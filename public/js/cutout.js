// Вырезание рисунка из фотографии листа бумаги.
// Идея: бумага светлая и почти бесцветная, рисунок — темнее или цветной.
// 1) выравниваем освещение (тени от телефона, жёлтая лампа)
// 2) находим «краску» 3) убираем мусор у краёв (стол, края листа)
// 4) заливаем всё внутри контура — чтобы незакрашенное пузо рыбки не стало дыркой
// 5) обрезаем по рисунку и уменьшаем до разумного размера
window.Cutout = (function () {
  const WORK = 900;     // размер, на котором считаем
  const OUT = 380;      // максимальная сторона готовой картинки

  function process(source, opts = {}) {
    const sensitivity = opts.sensitivity ?? 0.5; // 0..1
    const flip = !!opts.flip;

    // --- 1. Рисуем фото в рабочий размер (сначала обрезаем чёрные поля скриншота, если есть)
    let sw = source.naturalWidth || source.width;
    let sh = source.naturalHeight || source.height;
    const crop = blackBars(source, sw, sh);
    const k = Math.min(1, WORK / Math.max(crop.w, crop.h));
    const W = Math.max(1, Math.round(crop.w * k));
    const H = Math.max(1, Math.round(crop.h * k));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const N = W * H;

    // --- 2. Оценка цвета бумаги в каждой точке (по блокам)
    const B = Math.max(10, Math.round(Math.max(W, H) / 22));
    const bw = Math.ceil(W / B), bh = Math.ceil(H / B);
    const bgR = new Float32Array(bw * bh), bgG = new Float32Array(bw * bh), bgB = new Float32Array(bw * bh);
    const hist = new Uint32Array(64);
    for (let by = 0; by < bh; by++) {
      for (let bx = 0; bx < bw; bx++) {
        hist.fill(0);
        const x0 = bx * B, y0 = by * B, x1 = Math.min(W, x0 + B), y1 = Math.min(H, y0 + B);
        let cnt = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          hist[(lum(d[i], d[i + 1], d[i + 2]) / 4) | 0]++; cnt++;
        }
        // порог — 75-й перцентиль яркости: светлые пиксели блока = бумага
        let acc = 0, thr = 0;
        for (let b = 63; b >= 0; b--) { acc += hist[b]; if (acc >= cnt * 0.25) { thr = b * 4; break; } }
        let r = 0, g = 0, bb = 0, n = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          if (lum(d[i], d[i + 1], d[i + 2]) >= thr) { r += d[i]; g += d[i + 1]; bb += d[i + 2]; n++; }
        }
        const j = by * bw + bx;
        bgR[j] = r / n; bgG[j] = g / n; bgB[j] = bb / n;
      }
    }
    // Какие блоки — чистая бумага? Блок, где почти всё закрашено (например, тело кота),
    // заметно темнее или цветнее соседей. Такие блоки не верим и берём цвет бумаги от соседей.
    const nb = bw * bh;
    const bL = new Float32Array(nb), bC = new Float32Array(nb);
    for (let j = 0; j < nb; j++) {
      bL[j] = lum(bgR[j], bgG[j], bgB[j]);
      bC[j] = Math.max(bgR[j], bgG[j], bgB[j]) - Math.min(bgR[j], bgG[j], bgB[j]);
    }
    const valid = new Uint8Array(nb);
    let anyValid = false;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let maxL = 0, minC = 255;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue;
        const j = yy * bw + xx;
        if (bL[j] > maxL) maxL = bL[j];
        if (bC[j] < minC) minC = bC[j];
      }
      const j = y * bw + x;
      if (bL[j] >= maxL * 0.85 && bC[j] <= minC + 45) { valid[j] = 1; anyValid = true; }
    }
    const mR = Float32Array.from(bgR), mG = Float32Array.from(bgG), mB = Float32Array.from(bgB);
    if (anyValid) {
      // «закрашиваем» недостоверные блоки средним цветом достоверных соседей
      for (let pass = 0; pass < 60; pass++) {
        const add = [];
        for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
          const j = y * bw + x;
          if (valid[j]) continue;
          let r = 0, g = 0, b2 = 0, n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue;
            const k = yy * bw + xx;
            if (valid[k]) { r += mR[k]; g += mG[k]; b2 += mB[k]; n++; }
          }
          if (n) add.push([j, r / n, g / n, b2 / n]);
        }
        if (!add.length) break;
        for (const [j, r, g, b2] of add) { mR[j] = r; mG[j] = g; mB[j] = b2; valid[j] = 1; }
      }
    }
    const smooth = (a) => {
      for (let pass = 0; pass < 2; pass++) {
        const o = new Float32Array(a.length);
        for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
          let s = 0, n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue;
            s += a[yy * bw + xx]; n++;
          }
          o[y * bw + x] = s / n;
        }
        a = o;
      }
      return a;
    };
    const sR = smooth(mR), sG = smooth(mG), sB = smooth(mB);       // для цветов (без пятен краски)
    const lR = smooth(bgR), lG = smooth(bgG), lB = smooth(bgB);   // для поиска рисунка (повторяет тени)
    const sample = (arr, x, y) => {
      const fx = Math.min(bw - 1, Math.max(0, x / B - 0.5)), fy = Math.min(bh - 1, Math.max(0, y / B - 0.5));
      const x0 = fx | 0, y0 = fy | 0, x1 = Math.min(bw - 1, x0 + 1), y1 = Math.min(bh - 1, y0 + 1);
      const tx = fx - x0, ty = fy - y0;
      return (arr[y0 * bw + x0] * (1 - tx) + arr[y0 * bw + x1] * tx) * (1 - ty) +
             (arr[y1 * bw + x0] * (1 - tx) + arr[y1 * bw + x1] * tx) * ty;
    };

    // --- 3. Выравниваем свет (бумага становится белой) и ищем краску
    const ink = new Uint8Array(N);
    const darkT = 0.30 - sensitivity * 0.2;    // насколько темнее бумаги = краска
    const chromaT = 95 - sensitivity * 60;      // насколько ярким должен быть цвет, чтобы считаться краской (0..255)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x, i = p * 4;
      // поиск рисунка: сравниваем с бумагой прямо вокруг точки (тени не мешают)
      const r = Math.min(255, d[i] * 255 / Math.max(30, sample(lR, x, y)));
      const g = Math.min(255, d[i + 1] * 255 / Math.max(30, sample(lG, x, y)));
      const b = Math.min(255, d[i + 2] * 255 / Math.max(30, sample(lB, x, y)));
      // цвет для картинки: выравниваем по «чистой» бумаге
      d[i] = Math.min(255, d[i] * 255 / Math.max(30, sample(sR, x, y)));
      d[i + 1] = Math.min(255, d[i + 1] * 255 / Math.max(30, sample(sG, x, y)));
      d[i + 2] = Math.min(255, d[i + 2] * 255 / Math.max(30, sample(sB, x, y)));
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const L = lum(r, g, b) / 255;
      if (L < 1 - darkT || (mx - mn > chromaT && L < 0.995)) ink[p] = 1;
    }

    // --- 4. Немного «раздуваем» краску, чтобы закрыть щели в контуре
    const R = Math.max(1, Math.round(Math.max(W, H) / 260));
    const fat = dilate(ink, W, H, R);

    // Пятна краски. Тонкий контур часто рвётся на куски, поэтому собираем рисунок
    // из всех кусочков рядом друг с другом, а не берём один самый крупный.
    const { labels, comps } = components(fat, W, H);
    const minArea = N * 0.0003; // мельче — это пылинки и точки на бумаге
    let pool = comps.filter((c) => !c.border && c.area >= minArea);
    if (!pool.length) pool = comps.filter((c) => c.area >= minArea); // всё касается края — берём что есть
    if (!pool.length) return null;
    const boxArea = (c) => (c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1);
    pool.sort((a, b) => boxArea(b) - boxArea(a)); // главный — с самой большой рамкой (контур, а не пятно)
    const main = pool[0];
    const box = { x0: main.x0, y0: main.y0, x1: main.x1, y1: main.y1 };
    const keep = new Set([main.id]);
    const near = Math.max(W, H) * 0.025;
    const mx = 0, my = 0; // «внутри» — строго в рамке главной части
    for (let changed = true; changed;) {
      changed = false;
      for (const c of pool) {
        if (keep.has(c.id)) continue;
        const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
        const inside = cx > main.x0 - mx && cx < main.x1 + mx && cy > main.y0 - my && cy < main.y1 + my;
        const touching = c.x1 >= box.x0 - near && c.x0 <= box.x1 + near && c.y1 >= box.y0 - near && c.y0 <= box.y1 + near;
        // внутри рисунка — берём всегда; рядом снаружи — только крупные части (не пятнышки и не подпись)
        if (inside || (touching && c.area >= main.area * 0.03)) {
          keep.add(c.id); changed = true;
          box.x0 = Math.min(box.x0, c.x0); box.y0 = Math.min(box.y0, c.y0);
          box.x1 = Math.max(box.x1, c.x1); box.y1 = Math.max(box.y1, c.y1);
        }
      }
    }
    const K = new Uint8Array(N);
    let inkArea = 0;
    for (let p = 0; p < N; p++) if (keep.has(labels[p])) { K[p] = 1; inkArea++; }
    if (inkArea < N * 0.002) return null;

    // --- 5. Заливаем всё, что внутри контура
    const count = (m) => { let n = 0; for (let p = 0; p < N; p++) n += m[p]; return n; };
    let obj = erode(fillHoles(K, W, H), W, H, R);
    // Если контур с разрывами, внутри ничего не залилось. Тогда закрываем щели «пошире» и пробуем ещё раз.
    const R2 = Math.max(R + 2, Math.round(Math.max(W, H) / 70));
    const obj2 = erode(fillHoles(dilate(K, W, H, R2 - R), W, H), W, H, R2);
    if (count(obj2) > count(obj) * 1.5) obj = obj2;

    // Мягкий край (сглаживание)
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        s += obj[yy * W + xx]; n++;
      }
      const a = obj[p] ? s / n : (s / n) * 0.5;
      d[p * 4 + 3] = Math.round(a * 255);
      if (a > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      // чуть сочнее цвета
      const i = p * 4;
      const m = (d[i] + d[i + 1] + d[i + 2]) / 3;
      d[i] = clamp(m + (d[i] - m) * 1.15); d[i + 1] = clamp(m + (d[i + 1] - m) * 1.15); d[i + 2] = clamp(m + (d[i + 2] - m) * 1.15);
    }
    if (x1 < 0) return null;
    ctx.putImageData(img, 0, 0);

    // --- 6. Обрезаем и уменьшаем
    const pad = 3;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const s = Math.min(1, OUT / Math.max(cw, ch));
    const out = document.createElement('canvas');
    out.width = Math.max(8, Math.round(cw * s));
    out.height = Math.max(8, Math.round(ch * s));
    const o = out.getContext('2d');
    o.imageSmoothingQuality = 'high';
    if (flip) { o.translate(out.width, 0); o.scale(-1, 1); }
    o.drawImage(c, x0, y0, cw, ch, 0, 0, out.width, out.height);
    return out;
  }

  function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  // Чёрные поля по краям (скриншот с телефона, фото из мессенджера) — находим и отрезаем
  function blackBars(source, sw, sh) {
    const S = 200, k = Math.min(1, S / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const x = t.getContext('2d', { willReadFrequently: true });
    x.drawImage(source, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    const dark = (i) => d[i] < 30 && d[i + 1] < 30 && d[i + 2] < 30;
    const rowDark = (y) => { let n = 0; for (let i = 0; i < w; i++) n += dark((y * w + i) * 4); return n > w * 0.97; };
    const colDark = (cx) => { let n = 0; for (let j = 0; j < h; j++) n += dark((j * w + cx) * 4); return n > h * 0.97; };
    let top = 0, bot = h - 1, left = 0, right = w - 1;
    while (top < h / 2 && rowDark(top)) top++;
    while (bot > h / 2 && rowDark(bot)) bot--;
    while (left < w / 2 && colDark(left)) left++;
    while (right > w / 2 && colDark(right)) right--;
    // небольшой запас, чтобы не захватить край полосы
    const m = 2;
    if (top) top += m; if (bot < h - 1) bot -= m; if (left) left += m; if (right < w - 1) right -= m;
    if (bot - top < h * 0.2 || right - left < w * 0.2) return { x: 0, y: 0, w: sw, h: sh };
    return { x: left / k, y: top / k, w: (right - left + 1) / k, h: (bot - top + 1) / k };
  }

  // Всё, куда нельзя дойти от края картинки, не пересекая рисунок, — внутренность рисунка
  function fillHoles(K, W, H) {
    const N = W * H, outside = new Uint8Array(N), stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    while (stack.length) {
      const p = stack.pop();
      if (outside[p] || K[p]) continue;
      outside[p] = 1;
      const x = p % W;
      if (x > 0) stack.push(p - 1);
      if (x < W - 1) stack.push(p + 1);
      if (p >= W) stack.push(p - W);
      if (p < N - W) stack.push(p + W);
    }
    const obj = new Uint8Array(N);
    for (let p = 0; p < N; p++) obj[p] = outside[p] ? 0 : 1;
    return obj;
  }

  // Расширение/сужение маски квадратом радиуса r (раздельно по осям — быстро)
  function morph(src, W, H, r, isMax) {
    const tmp = new Uint8Array(src.length), out = new Uint8Array(src.length);
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        let v = isMax ? 0 : 1;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const s = xx < 0 || xx >= W ? (isMax ? 0 : 1) : src[row + xx];
          if (isMax ? s : !s) { v = isMax ? 1 : 0; break; }
        }
        tmp[row + x] = v;
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = isMax ? 0 : 1;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        const s = yy < 0 || yy >= H ? (isMax ? 0 : 1) : tmp[yy * W + x];
        if (isMax ? s : !s) { v = isMax ? 1 : 0; break; }
      }
      out[y * W + x] = v;
    }
    return out;
  }
  const dilate = (m, W, H, r) => morph(m, W, H, r, true);
  const erode = (m, W, H, r) => morph(m, W, H, r, false);

  function components(mask, W, H) {
    const labels = new Int32Array(W * H);
    const comps = [];
    let id = 0;
    const stack = [];
    for (let p0 = 0; p0 < mask.length; p0++) {
      if (!mask[p0] || labels[p0]) continue;
      id++;
      const c = { id, area: 0, x0: W, y0: H, x1: 0, y1: 0, border: false };
      stack.push(p0); labels[p0] = id;
      while (stack.length) {
        const p = stack.pop();
        const x = p % W, y = (p / W) | 0;
        c.area++;
        if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) c.border = true;
        const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
        for (const q of nb) if (q >= 0 && mask[q] && !labels[q]) { labels[q] = id; stack.push(q); }
      }
      comps.push(c);
    }
    return { labels, comps };
  }

  // Загрузка файла с телефона в картинку
  function loadFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Не получилось открыть фото'));
      im.src = url;
    });
  }

  return { process, loadFile };
})();
