// Живой рисунок — интерфейс: вход, меню миров, живой экран, добавление рисунка, раздел для взрослых
(function () {
  const app = document.getElementById('app');
  const I = Art.icon;

  const LOCS = {
    sea:     { title: 'Море',    go: 'Отпустить в море!',   hint: 'Нарисуй рыбку, медузу, кита или осьминога', arrive: 'приплыл', move: 'плывёт', btn: 'blue' },
    savanna: { title: 'Саванна', go: 'Выпустить в саванну!', hint: 'Нарисуй льва, слона, жирафа или зебру', arrive: 'прибежал', move: 'идёт', btn: 'orange' },
    home:    { title: 'Домик',   go: 'Привести домой!',     hint: 'Нарисуй котика, собачку или хомячка', arrive: 'пришёл', move: 'идёт', btn: 'pink' },
  };
  const POLL_MS = 5000;

  // ---------- Связь с сервером ----------
  const realApi = {
    async req(method, url, body) {
      const r = await fetch(url, {
        method, credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try { data = await r.json(); } catch {}
      if (!r.ok) { const e = new Error(data.error || 'Нет связи с сервером'); e.status = r.status; throw e; }
      return data;
    },
    me() { return this.req('GET', '/api/me').then((d) => d.user); },
    login(login, password) { return this.req('POST', '/api/login', { login, password }).then((d) => d.user); },
    register(login, password) { return this.req('POST', '/api/register', { login, password }).then((d) => d.user); },
    logout() { return this.req('POST', '/api/logout'); },
    list(loc, all) { return this.req('GET', `/api/creatures?location=${loc}${all ? '&all=1' : ''}`).then((d) => d.creatures); },
    add(data) { return this.req('POST', '/api/creatures', data); },
    remove(id) { return this.req('DELETE', `/api/creatures/${id}`); },
    img(item) { return `/api/img/${item.id}`; },
  };
  const api = window.DEMO_API || realApi;

  let user = null;
  let cleanup = [];
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });

  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const go = (path) => { location.hash = path; };
  const sky = '<div class="sky"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div></div>';

  // ---------- Маршруты ----------
  async function route() {
    cleanup.forEach((f) => f()); cleanup = [];
    const path = location.hash.slice(1) || '/';
    if (!user && path !== '/login') return go('/login');
    if (user && path === '/login') return go('/');
    const play = path.match(/^\/play\/(sea|savanna|home)$/);
    if (path === '/login') return renderAuth();
    if (play) return renderPlay(play[1]);
    if (path.startsWith('/grown')) { const [, , tab, loc] = path.split('/'); return renderGrown(tab, loc); }
    return renderMenu();
  }

  // ---------- Вход / регистрация ----------
  function renderAuth() {
    let mode = 'login';
    app.innerHTML = '';
    const el = h(`
      <div class="auth">${sky}
        <div class="auth-box pop">
          ${Art.mascot}
          <div class="logo">Живой рисунок</div>
          <p class="tagline">Нарисуй зверька — и он оживёт!</p>
          <form class="panel" autocomplete="on">
            <div class="tabs"><button type="button" data-m="login" class="on">Войти</button><button type="button" data-m="register">Новый аккаунт</button></div>
            <input class="field" name="login" placeholder="Логин" autocomplete="username" autocapitalize="off" required>
            <input class="field" name="password" type="password" placeholder="Пароль" autocomplete="current-password" required>
            <div class="err"></div>
            <button class="btn big wide" type="submit">Поехали!</button>
            <div class="small-note">Аккаунт заводит взрослый. Все рисунки сохраняются только в нём.</div>
          </form>
        </div>
      </div>`);
    app.append(el);
    const form = el.querySelector('form'), err = el.querySelector('.err'), sub = form.querySelector('[type=submit]');
    el.querySelectorAll('.tabs button').forEach((b) => b.onclick = () => {
      Sound.click();
      mode = b.dataset.m;
      el.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
      sub.textContent = mode === 'login' ? 'Поехали!' : 'Создать аккаунт';
      form.password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
      err.textContent = '';
    });
    form.onsubmit = async (e) => {
      e.preventDefault();
      Sound.click();
      err.textContent = ''; sub.disabled = true;
      try {
        user = await (mode === 'login' ? api.login : api.register).call(api, form.login.value, form.password.value);
        Sound.magic();
        go('/');
      } catch (ex) {
        Sound.error();
        err.textContent = ex.message;
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      } finally { sub.disabled = false; }
    };
  }

  // ---------- Главное меню: выбор мира ----------
  function renderMenu() {
    app.innerHTML = '';
    const el = h(`
      <div class="menu">${sky}
        <div class="topbar pop">
          <div class="hello">Привет, <span>${esc(user.login)}</span>!</div>
          <button class="round small" data-a="sound" aria-label="Звук">${Sound.muted ? I.soundOff : I.soundOn}</button>
          <button class="round small" data-a="grown" aria-label="Для взрослых">${I.gear}</button>
        </div>
        <h2 class="pop">Куда пойдём?</h2>
        <div class="worlds">
          ${Object.entries(LOCS).map(([k, v]) => `
            <button class="world ${k} pop jelly" data-loc="${k}">
              <div class="art">${Art.cover[k]}</div>
              <div class="label"><b>${v.title}</b><span class="count" data-count="${k}">…</span></div>
            </button>`).join('')}
        </div>
      </div>`);
    app.append(el);
    el.querySelectorAll('.world').forEach((b) => b.onclick = () => { Sound.pop(); setTimeout(() => go('/play/' + b.dataset.loc), 120); });
    el.querySelector('[data-a=grown]').onclick = () => { Sound.click(); parentGate(() => go('/grown/drawings/sea')); };
    el.querySelector('[data-a=sound]').onclick = (e) => { Sound.toggle(); e.currentTarget.innerHTML = Sound.muted ? I.soundOff : I.soundOn; Sound.click(); };
    for (const k of Object.keys(LOCS)) {
      api.list(k).then((l) => {
        const c = el.querySelector(`[data-count=${k}]`);
        if (c) c.textContent = l.length ? `${l.length} из 10` : 'пусто';
      }).catch(handleAuthError);
    }
  }

  // ---------- Живой экран ----------
  function renderPlay(loc) {
    const L = LOCS[loc];
    app.innerHTML = '';
    const el = h(`
      <div class="stage">
        <canvas></canvas>
        <div class="hud">
          <button class="round" data-a="home" aria-label="Домой">${I.home}</button>
          <div class="sp"></div>
          <div class="counter" hidden></div>
          <button class="round small" data-a="sound" aria-label="Звук">${Sound.muted ? I.soundOff : I.soundOn}</button>
          <button class="round small" data-a="full" aria-label="Во весь экран">${I.full}</button>
        </div>
        <div class="empty" hidden><div class="big">Тут пока никого!</div><p>${L.hint}, сфотографируй рисунок, и он оживёт.</p></div>
        <div class="arrow-hint" hidden>Жми сюда →</div>
        <button class="fab" aria-label="Добавить рисунок">${I.camera}</button>
      </div>`);
    app.append(el);
    const canvas = el.querySelector('canvas');
    const counter = el.querySelector('.counter'), empty = el.querySelector('.empty'), hint = el.querySelector('.arrow-hint');

    const world = new Scene.World(canvas, loc, {
      onArrive(c) {
        Sound.fanfare();
        world.burst(Math.min(Math.max(c.x, 60), world.W - 60), c.y, 'star', 16);
        toast(el, c.name ? `${c.name} ${L.arrive}!` : `Новый друг ${L.arrive}!`);
      },
      onTap(what) { what === 'creature' ? Sound.boing() : Sound.bloop(); },
    });
    cleanup.push(() => world.destroy());

    let lastSig = '';
    async function refresh() {
      try {
        const list = await api.list(loc);
        const sig = list.map((x) => x.id).join(',');
        if (sig !== lastSig) { lastSig = sig; world.sync(list, api.img); }
        counter.hidden = !list.length;
        counter.textContent = `${list.length} из 10`;
        empty.hidden = hint.hidden = list.length > 0;
      } catch (e) { handleAuthError(e); }
    }
    refresh();
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    cleanup.push(() => clearInterval(timer));

    // Кнопки прячутся, когда никто не трогает экран (режим «телевизор»)
    let idleT;
    const wake = () => { el.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => el.classList.add('idle'), 6000); };
    el.addEventListener('pointermove', wake); el.addEventListener('pointerdown', wake); wake();
    cleanup.push(() => clearTimeout(idleT));

    // Не даём экрану погаснуть
    let lock = null;
    const getLock = async () => { try { lock = await navigator.wakeLock?.request('screen'); } catch {} };
    getLock();
    const vis = () => { if (!document.hidden) getLock(); };
    document.addEventListener('visibilitychange', vis);
    cleanup.push(() => { document.removeEventListener('visibilitychange', vis); lock?.release?.().catch(() => {}); });

    el.querySelector('[data-a=home]').onclick = () => { Sound.click(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); go('/'); };
    el.querySelector('[data-a=sound]').onclick = (e) => { Sound.toggle(); e.currentTarget.innerHTML = Sound.muted ? I.soundOff : I.soundOn; Sound.click(); };
    el.querySelector('[data-a=full]').onclick = () => {
      Sound.click();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen?.().catch(() => {});
    };
    el.querySelector('.fab').onclick = () => { Sound.pop(); openAdd(loc, () => refresh()); };
  }

  function toast(parent, text) {
    const t = h(`<div class="toast">${esc(text)}</div>`);
    parent.append(t);
    setTimeout(() => t.remove(), 3100);
  }

  // ---------- Добавление рисунка ----------
  function openAdd(loc, done) {
    const L = LOCS[loc];
    const bg = h(`<div class="sheet-bg"><div class="sheet"></div></div>`);
    const sheet = bg.querySelector('.sheet');
    document.body.append(bg);
    const close = () => { bg.remove(); };
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) close(); });
    cleanup.push(close);

    let photo = null, result = null, flipped = false, sens = 0.5;

    const fileInput = (capture) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      if (capture) inp.capture = 'environment';
      inp.onchange = async () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        try { photo = await Cutout.loadFile(f); } catch { return stepPick('Не получилось открыть фото. Попробуй ещё раз.'); }
        flipped = false; sens = 0.5;
        stepPreview();
      };
      inp.click();
    };

    function stepPick(error) {
      sheet.innerHTML = `
        <button class="round small x" aria-label="Закрыть">${I.close}</button>
        <h3>Новый друг!</h3>
        <p class="hint">${L.hint}.</p>
        <div class="steps"><div><b>1</b>Нарисуй</div><div><b>2</b>Сфоткай</div><div><b>3</b>Смотри!</div></div>
        ${error ? `<p class="err">${esc(error)}</p>` : ''}
        <div class="pick">
          <button class="btn big ${L.btn} wide" data-a="cam">${I.camera} Сфотографировать</button>
          <button class="btn white wide" data-a="gal">${I.image} Выбрать из галереи</button>
        </div>`;
      sheet.querySelector('.x').onclick = () => { Sound.click(); close(); };
      sheet.querySelector('[data-a=cam]').onclick = () => { Sound.click(); fileInput(true); };
      sheet.querySelector('[data-a=gal]').onclick = () => { Sound.click(); fileInput(false); };
    }

    function stepPreview() {
      sheet.innerHTML = `
        <button class="round small x" aria-label="Закрыть">${I.close}</button>
        <h3>Вот он!</h3>
        <div class="preview ${loc}"><div class="loader"><svg class="spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="80 50" stroke-linecap="round"/></svg>Колдую…</div></div>
        <input class="field" maxlength="40" placeholder="Как его зовут?">
        <details class="tune"><summary>Плохо вырезалось?</summary>
          <div class="row"><span>Меньше</span><input class="slider" type="range" min="0" max="1" step="0.05" value="${sens}"><span>Больше</span></div>
        </details>
        <div class="pick">
          <button class="btn big green wide" data-a="save" disabled>${I.magic} ${L.go}</button>
          <button class="btn white wide" data-a="again">${I.camera} Другое фото</button>
        </div>`;
      sheet.querySelector('.x').onclick = () => { Sound.click(); close(); };
      sheet.querySelector('[data-a=again]').onclick = () => { Sound.click(); stepPick(); };
      const slider = sheet.querySelector('.slider');
      let tm;
      slider.oninput = () => { sens = +slider.value; clearTimeout(tm); tm = setTimeout(runCut, 250); };
      sheet.querySelector('[data-a=save]').onclick = save;
      setTimeout(runCut, 60); // даём окну нарисоваться
    }

    function runCut() {
      const box = sheet.querySelector('.preview');
      const saveBtn = sheet.querySelector('[data-a=save]');
      result = Cutout.process(photo, { sensitivity: sens, flip: flipped });
      if (!result) {
        Sound.error();
        box.innerHTML = `<div class="loader" style="padding:20px;text-align:center">Не вижу рисунок.<br>Сфоткай поближе, на светлом столе</div>`;
        saveBtn.disabled = true;
        return;
      }
      Sound.magic();
      box.innerHTML = '';
      result.removeAttribute('style');
      box.append(result);
      const dir = h(`<div class="dir">${L.move} → сюда</div>`);
      const fb = h(`<button class="round small flipbtn" aria-label="Развернуть">${I.flip}</button>`);
      fb.onclick = () => { Sound.click(); flipped = !flipped; result = mirror(result); box.querySelector('canvas').replaceWith(result); };
      box.append(dir, fb);
      saveBtn.disabled = false;
    }

    async function save() {
      const btn = sheet.querySelector('[data-a=save]');
      if (!result) return;
      btn.disabled = true;
      Sound.click();
      try {
        let data = result.toDataURL('image/webp', 0.9);
        if (!data.startsWith('data:image/webp')) data = result.toDataURL('image/png');
        await api.add({ location: loc, name: sheet.querySelector('.field').value.trim(), image: data, w: result.width, h: result.height });
        close();
        done();
      } catch (e) {
        Sound.error();
        btn.disabled = false;
        handleAuthError(e);
        alertIn(sheet, e.message);
      }
    }

    stepPick();
  }

  function mirror(c) {
    const o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    const x = o.getContext('2d');
    x.translate(o.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0);
    return o;
  }

  function alertIn(parent, text) {
    let e = parent.querySelector('.err');
    if (!e) { e = h('<p class="err"></p>'); parent.querySelector('.pick').before(e); }
    e.textContent = text;
  }

  // ---------- Замок для родителей ----------
  let unlockedUntil = 0; // после правильного ответа 10 минут не спрашиваем
  function parentGate(onOk, onCancel) {
    if (Date.now() < unlockedUntil) return onOk();
    let a, b, val = '';
    const newTask = () => { a = 3 + Math.floor(Math.random() * 7); b = 11 - a + Math.floor(Math.random() * 6); val = ''; };
    newTask();
    const bg = h(`<div class="sheet-bg"><div class="sheet gate"></div></div>`);
    const sheet = bg.querySelector('.sheet');
    document.body.append(bg);
    const close = () => bg.remove();
    cleanup.push(close);
    const cancel = () => { close(); if (onCancel) onCancel(); };
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) cancel(); });
    function draw(wrong) {
      sheet.innerHTML = `
        <button class="round small x" aria-label="Закрыть">${I.close}</button>
        <h3>Только для взрослых</h3>
        <p class="hint">Реши пример, чтобы открыть настройки</p>
        <div class="task ${wrong ? 'shake' : ''}"><span>${a} + ${b} =</span><b class="ans">${val || '?'}</b></div>
        <div class="keys">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}
          <button data-k="del" aria-label="Стереть">${I.back}</button><button data-k="0">0</button>
          <button data-k="ok" class="ok">ОК</button>
        </div>`;
      sheet.querySelector('.x').onclick = () => { Sound.click(); cancel(); };
      sheet.querySelectorAll('[data-k]').forEach((k) => k.onclick = () => {
        const v = k.dataset.k;
        if (v === 'ok') {
          if (Number(val) === a + b) { Sound.magic(); unlockedUntil = Date.now() + 10 * 60 * 1000; close(); onOk(); }
          else { Sound.error(); newTask(); draw(true); }
          return;
        }
        Sound.click();
        if (v === 'del') val = val.slice(0, -1); else if (val.length < 3) val += v;
        sheet.querySelector('.ans').textContent = val || '?';
      });
    }
    draw(false);
  }

  // ---------- Раздел для взрослых ----------
  function renderGrown(tab, loc) {
    if (!['drawings', 'templates'].includes(tab)) tab = 'drawings';
    if (!LOCS[loc]) loc = 'sea';
    if (Date.now() >= unlockedUntil) {
      app.innerHTML = `<div class="page">${sky}</div>`;
      return parentGate(() => renderGrown(tab, loc), () => go('/'));
    }
    app.innerHTML = '';
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const el = h(`
      <div class="page">${sky}
        <div class="topbar">
          <button class="round small" data-a="back" aria-label="Назад">${I.back}</button>
          <div class="hello">Для взрослых</div>
          <button class="btn white" data-a="logout" style="min-height:48px;font-size:17px;padding:0 18px">${I.logout} Выйти</button>
        </div>
        <div class="bigtabs">
          <button data-tab="drawings" class="${tab === 'drawings' ? 'on' : ''}">${I.image} Рисунки</button>
          <button data-tab="templates" class="${tab === 'templates' ? 'on' : ''}">${I.print} Раскраски</button>
        </div>
        <div class="seg">${Object.entries(LOCS).map(([k, v]) => `<button data-loc="${k}" class="${k === loc ? 'on' : ''}">${v.title}</button>`).join('')}</div>
        <div class="body"></div>
      </div>`);
    app.append(el);
    el.querySelector('[data-a=back]').onclick = () => { Sound.click(); go('/'); };
    el.querySelector('[data-a=logout]').onclick = async () => { Sound.click(); try { await api.logout(); } catch {} user = null; unlockedUntil = 0; go('/login'); };
    el.querySelectorAll('.bigtabs button').forEach((b) => b.onclick = () => { Sound.click(); go(`/grown/${b.dataset.tab}/${loc}`); });
    el.querySelectorAll('.seg button').forEach((b) => b.onclick = () => { Sound.click(); go(`/grown/${tab}/${b.dataset.loc}`); });
    const body = el.querySelector('.body');
    if (tab === 'templates') return renderTemplates(body, loc);

    body.innerHTML = `
      <div class="note"><b>Ярлык на рабочий стол.</b>
        ${installPrompt ? 'Нажми «Установить» — приложение появится рядом с остальными.' :
          isIOS ? 'В Safari нажми «Поделиться» → «На экран «Домой»».' :
          'В Chrome или Edge: меню браузера (⋮) → «Установить приложение» или «Добавить на главный экран».'}
        ${installPrompt ? `<div style="margin-top:10px"><button class="btn green" data-a="install">${I.install} Установить</button></div>` : ''}
      </div>
      <div class="note">На экране живут последние 10. Когда приходит новый, самый старый уходит, но остаётся здесь. Удалить — корзинка (нажать два раза).</div>
      <div class="gallery"><div class="note">Загружаю…</div></div>`;
    const ib = body.querySelector('[data-a=install]');
    if (ib) ib.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice.catch(() => {}); installPrompt = null; ib.remove(); };
    loadGallery(body.querySelector('.gallery'), loc);
  }

  async function loadGallery(gal, loc) {
    try {
      const list = (await api.list(loc, true)).reverse();
      if (!list.length) { gal.innerHTML = '<div class="note">Пока пусто.</div>'; return; }
      gal.innerHTML = '';
      list.forEach((c, i) => {
        const t = h(`
          <div class="tile">
            ${i < 10 ? '<span class="on-screen">на экране</span>' : ''}
            <div class="pic"><img alt="" loading="lazy"></div>
            <div class="nm">${esc(c.name || 'Без имени')}</div>
            <button class="round small del" aria-label="Удалить">${I.trash}</button>
          </div>`);
        t.querySelector('img').src = api.img(c);
        const del = t.querySelector('.del');
        let armed = false;
        del.onclick = async () => {
          if (!armed) { armed = true; del.style.setProperty('--c', '#e11d48'); del.style.color = '#fff'; Sound.click(); setTimeout(() => { armed = false; del.style.removeProperty('--c'); del.style.color = ''; }, 2500); return; }
          Sound.bloop();
          await api.remove(c.id).catch(handleAuthError);
          t.style.transition = 'transform .3s, opacity .3s'; t.style.transform = 'scale(.3)'; t.style.opacity = '0';
          setTimeout(() => t.remove(), 300);
        };
        gal.append(t);
      });
    } catch (e) { handleAuthError(e); gal.innerHTML = `<div class="note">${esc(e.message)}</div>`; }
  }

  // ---------- Раскраски для печати ----------
  function renderTemplates(body, loc) {
    const items = Templates.list[loc];
    body.innerHTML = `
      <div class="note"><b>Как печатать.</b> Нажми «Скачать» — сохранится PDF формата А4. Распечатай дома или отнеси в фотостудию и попроси «распечатать А4, чёрно-белую». Ребёнок раскрашивает зверька и фотографирует лист целиком.</div>
      <div class="grown" style="margin:0 0 18px;justify-content:flex-start">
        <button class="btn yellow" data-all>${I.install} Скачать все ${items.length} одним файлом</button>
      </div>
      <div class="tpl-grid">
        ${items.map((t) => `
          <div class="tpl">
            <div class="sheetpic">${Templates.preview(t)}</div>
            <div class="nm">${t.name}</div>
            <button class="btn blue" data-id="${t.id}">${I.install} Скачать</button>
          </div>`).join('')}
      </div>`;
    const run = async (btn, ids, name) => {
      if (window.DEMO) { alertNote(body, 'В демо-версии скачивание выключено. На твоём сайте кнопка сохранит PDF.'); return; }
      const old = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Готовлю…';
      try { Templates.download(await Templates.pdfFor(loc, ids), name); Sound.magic(); }
      catch (e) { Sound.error(); alertNote(body, 'Не получилось сделать PDF: ' + e.message); }
      finally { btn.disabled = false; btn.innerHTML = old; }
    };
    body.querySelector('[data-all]').onclick = (e) => { Sound.click(); run(e.currentTarget, null, `raskraski-${loc}.pdf`); };
    body.querySelectorAll('[data-id]').forEach((b) => b.onclick = () => {
      Sound.click();
      run(b, [b.dataset.id], `raskraska-${b.dataset.id}.pdf`);
    });
  }

  function alertNote(body, text) {
    let n = body.querySelector('.note.warn');
    if (!n) { n = h('<div class="note warn"></div>'); body.prepend(n); }
    n.textContent = text;
    n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake');
  }

  function handleAuthError(e) {
    if (e && e.status === 401) { user = null; go('/login'); }
  }

  // ---------- Старт ----------
  (async function boot() {
    try { user = await api.me(); } catch { user = null; }
    window.addEventListener('hashchange', route);
    route();
  })();
})();
