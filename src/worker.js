// Живой рисунок — серверная часть (Cloudflare Worker + база D1)
// Всё, что начинается с /api/, обрабатывается здесь. Остальное (сайт) отдаёт Cloudflare из папки public.

const LOCATIONS = ['sea', 'savanna', 'home'];
const SCREEN_LIMIT = 10;            // сколько существ одновременно на экране
const SESSION_DAYS = 60;            // сколько дней держится вход
const MAX_IMAGE_CHARS = 1_400_000;  // ~1 МБ картинка максимум

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    try {
      return await handleApi(request, env, url);
    } catch (err) {
      console.error(err);
      return json({ error: 'Ошибка сервера' }, 500);
    }
  },
};

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/register' && method === 'POST') return register(request, env);
  if (path === '/api/login' && method === 'POST') return login(request, env);
  if (path === '/api/logout' && method === 'POST') return logout(request, env);

  const user = await currentUser(request, env);
  if (path === '/api/me') return json({ user: user ? { id: user.id, login: user.login } : null });
  if (!user) return json({ error: 'Нужно войти в аккаунт' }, 401);

  // Последние 10 существ локации — для экрана
  if (path === '/api/creatures' && method === 'GET') {
    const loc = url.searchParams.get('location');
    if (!LOCATIONS.includes(loc)) return json({ error: 'Неизвестная локация' }, 400);
    const all = url.searchParams.get('all') === '1';
    const { results } = await env.DB.prepare(
      `SELECT id, name, w, h, created_at FROM creatures
       WHERE user_id = ? AND location = ? ORDER BY id DESC LIMIT ?`
    ).bind(user.id, loc, all ? 500 : SCREEN_LIMIT).all();
    return json({ creatures: results.reverse() });
  }

  // Сохранить новый рисунок
  if (path === '/api/creatures' && method === 'POST') {
    const body = await readJson(request);
    const loc = body.location;
    const image = String(body.image || '');
    const name = String(body.name || '').trim().slice(0, 40);
    const w = Math.round(Number(body.w) || 0);
    const h = Math.round(Number(body.h) || 0);
    if (!LOCATIONS.includes(loc)) return json({ error: 'Неизвестная локация' }, 400);
    if (!/^data:image\/(png|webp|jpeg);base64,/.test(image)) return json({ error: 'Это не картинка' }, 400);
    if (image.length > MAX_IMAGE_CHARS) return json({ error: 'Картинка слишком большая' }, 413);
    if (w < 8 || h < 8 || w > 2000 || h > 2000) return json({ error: 'Странный размер картинки' }, 400);
    const res = await env.DB.prepare(
      `INSERT INTO creatures (user_id, location, name, image, w, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(user.id, loc, name, image, w, h, Date.now()).run();
    return json({ ok: true, id: res.meta.last_row_id });
  }

  // Удалить рисунок
  const del = path.match(/^\/api\/creatures\/(\d+)$/);
  if (del && method === 'DELETE') {
    await env.DB.prepare(`DELETE FROM creatures WHERE id = ? AND user_id = ?`).bind(Number(del[1]), user.id).run();
    return json({ ok: true });
  }

  // Картинка существа
  const img = path.match(/^\/api\/img\/(\d+)$/);
  if (img && method === 'GET') {
    const row = await env.DB.prepare(`SELECT image FROM creatures WHERE id = ? AND user_id = ?`)
      .bind(Number(img[1]), user.id).first();
    if (!row) return new Response('Not found', { status: 404 });
    const m = row.image.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: { 'Content-Type': m[1], 'Cache-Control': 'private, max-age=31536000, immutable' },
    });
  }

  return json({ error: 'Не найдено' }, 404);
}

// ---------- Аккаунты ----------

async function register(request, env) {
  const { login, password } = await readJson(request);
  const l = String(login || '').trim();
  const p = String(password || '');
  if (!/^[\p{L}\p{N}_.\-]{3,32}$/u.test(l)) return json({ error: 'Логин: 3–32 символа, буквы, цифры, _ . -' }, 400);
  if (p.length < 6) return json({ error: 'Пароль минимум 6 символов' }, 400);
  const exists = await env.DB.prepare(`SELECT id FROM users WHERE login = ?`).bind(l).first();
  if (exists) return json({ error: 'Такой логин уже занят' }, 409);
  const salt = randomHex(16);
  const hash = await hashPassword(p, salt);
  const res = await env.DB.prepare(`INSERT INTO users (login, pass_hash, salt, created_at) VALUES (?, ?, ?, ?)`)
    .bind(l, hash, salt, Date.now()).run();
  return startSession(env, res.meta.last_row_id, l, request);
}

async function login(request, env) {
  const { login, password } = await readJson(request);
  const user = await env.DB.prepare(`SELECT id, login, pass_hash, salt FROM users WHERE login = ?`)
    .bind(String(login || '').trim()).first();
  if (!user) return json({ error: 'Неверный логин или пароль' }, 401);
  const hash = await hashPassword(String(password || ''), user.salt);
  if (!safeEqual(hash, user.pass_hash)) return json({ error: 'Неверный логин или пароль' }, 401);
  return startSession(env, user.id, user.login, request);
}

async function logout(request, env) {
  const token = getCookie(request, 'sid');
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, '', 0) });
}

async function startSession(env, userId, login, request) {
  const token = randomHex(32);
  const maxAge = SESSION_DAYS * 86400;
  await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`)
    .bind(token, userId, Date.now() + maxAge * 1000).run();
  // заодно чистим просроченные сессии
  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(Date.now()).run();
  return json({ user: { id: userId, login } }, 200, { 'Set-Cookie': cookie(request, token, maxAge) });
}

async function currentUser(request, env) {
  const token = getCookie(request, 'sid');
  if (!token) return null;
  return env.DB.prepare(
    `SELECT u.id, u.login FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`
  ).bind(token, Date.now()).first();
}

// ---------- Помощники ----------

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: 100000 }, key, 256
  );
  return bytesToHex(new Uint8Array(bits));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function randomHex(n) { return bytesToHex(crypto.getRandomValues(new Uint8Array(n))); }
function bytesToHex(b) { return [...b].map((x) => x.toString(16).padStart(2, '0')).join(''); }
function hexToBytes(h) { return new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16))); }

function getCookie(request, name) {
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

function cookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `sid=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
