// Вырезание рисунка из фотографии листа бумаги.
// Идея: бумага светлая и почти бесцветная, рисунок — темнее или цветной.
// 1) выравниваем освещение (тени от телефона, жёлтая лампа)
// 2) находим «краску» 3) убираем мусор у краёв (стол, края листа)
// 4) заливаем всё внутри контура — чтобы незакрашенное пузо рыбки не стало дыркой
// 5) обрезаем по рисунку и уменьшаем до разумного размера
window.Cutout = (function () {
  const WORK = 720;     // размер, на котором считаем
  const OUT = 380;      // максимальная сторона готовой картинки

  function process(source, opts = {}) {
    const sensitivity = opts.sensitivity ?? 0.5; // 0..1
    const flip = !!opts.flip;

    // --- 1. Рисуем фото в рабочий размер
    const sw = source.naturalWidth || source.width;
    const sh = source.naturalHeight || source.height;
    const k = Math.min(1, WORK / Math.max(sw, sh));
    const W = Math.max(1, Math.round(sw * k));
    const H = Math.max(1, Math.round(sh * k));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, W, H);
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
    // Сглаживаем: берём максимум соседей (рисунок мог занять целый блок) и размываем
    const smooth = (arr) => {
      let a = arr;
      // максимум по яркости среди соседей 3x3 — убирает «тёмные» блоки внутри рисунка
      const m = new Float32Array(a.length);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        let best = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue;
          best = Math.max(best, a[yy * bw + xx]);
        }
        m[y * bw + x] = best;
      }
      a = m;
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
    const sR = smooth(bgR), sG = smooth(bgG), sB = smooth(bgB);
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
    const satT = 0.30 - sensitivity * 0.16;    // насколько цветнее бумаги = краска
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x, i = p * 4;
      const r = Math.min(255, d[i] * 255 / Math.max(30, sample(sR, x, y)));
      const g = Math.min(255, d[i + 1] * 255 / Math.max(30, sample(sG, x, y)));
      const b = Math.min(255, d[i + 2] * 255 / Math.max(30, sample(sB, x, y)));
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const L = lum(r, g, b) / 255;
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      if (L < 1 - darkT || (sat > satT && L < 0.995)) ink[p] = 1;
    }

    // --- 4. Немного «раздуваем» краску, чтобы закрыть щели в контуре
    const R = Math.max(1, Math.round(Math.max(W, H) / 260));
    const fat = dilate(ink, W, H, R);

    // Пятна краски: оставляем рисунок, выкидываем стол/края листа и мелкий мусор
    const { labels, comps } = components(fat, W, H);
    if (!comps.length) return null;
    const inner = comps.filter((c) => !c.border);
    const pool = inner.length ? inner : comps;
    pool.sort((a, b) => b.area - a.area);
    const main = pool[0];
    if (main.area < N * 0.002) return null;
    const ex = (main.x1 - main.x0) * 0.35, ey = (main.y1 - main.y0) * 0.35;
    const keep = new Set([main.id]);
    for (const c of pool) {
      if (c === main || c.area < main.area * 0.06) continue;
      const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
      if (cx > main.x0 - ex && cx < main.x1 + ex && cy > main.y0 - ey && cy < main.y1 + ey) keep.add(c.id);
    }
    const K = new Uint8Array(N);
    for (let p = 0; p < N; p++) if (keep.has(labels[p])) K[p] = 1;

    // --- 5. Заливаем всё, что внутри контура (всё, куда не дойти от края картинки)
    const outside = new Uint8Array(N);
    const stack = [];
    for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
    for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
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
    let obj = new Uint8Array(N);
    for (let p = 0; p < N; p++) obj[p] = outside[p] ? 0 : 1;
    obj = erode(obj, W, H, R); // возвращаем «раздутый» край на место

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
