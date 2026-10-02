// Живые сцены: аквариум, саванна, домик питомцев.
// Всё рисуется кодом на canvas — никаких картинок качать не нужно.
window.Scene = (function () {
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FONT = '"Nunito", "Baloo 2", system-ui, sans-serif';

  // Настройки локаций
  const LOC = {
    sea:     { mode: 'swim', area: [0.10, 0.84] },
    savanna: { mode: 'walk', area: [0.60, 0.95] },
    home:    { mode: 'walk', area: [0.66, 0.96] },
  };

  class World {
    constructor(canvas, location, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.loc = location;
      this.cfg = LOC[location];
      this.creatures = new Map();
      this.particles = [];
      this.t = 0;
      this.first = true;
      this.onArrive = opts.onArrive || (() => {});
      this.onTap = opts.onTap || (() => {});
      this._resize = () => this.resize();
      window.addEventListener('resize', this._resize);
      this._down = (e) => this.tap(e);
      canvas.addEventListener('pointerdown', this._down);
      this.resize();
      this.running = true;
      let last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.frame(dt);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    destroy() {
      this.running = false;
      window.removeEventListener('resize', this._resize);
      this.canvas.removeEventListener('pointerdown', this._down);
    }

    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = this.canvas.clientWidth || window.innerWidth;
      const H = this.canvas.clientHeight || window.innerHeight;
      this.W = W; this.H = H; this.dpr = dpr;
      this.unit = Math.max(Math.min(W, H * 1.4), H * 0.55) / 800; // общий масштаб (на вертикальном телефоне чуть крупнее)
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
      this.bg = document.createElement('canvas');
      this.bg.width = this.canvas.width; this.bg.height = this.canvas.height;
      const b = this.bg.getContext('2d');
      b.scale(dpr, dpr);
      this.decor = BG[this.loc].init(W, H);
      BG[this.loc].paint(b, W, H, this.decor);
      for (const c of this.creatures.values()) c.fit(this);
    }

    // Список с сервера: последние 10. Новые — заплывают/заходят, лишние — уходят.
    sync(list, urlFor) {
      const ids = new Set(list.map((x) => x.id));
      for (const c of this.creatures.values()) {
        if (!ids.has(c.id) && c.state !== 'leave') c.leave(this);
      }
      const initial = this.first;
      this.first = false;
      for (const item of list) {
        if (this.creatures.has(item.id)) continue;
        const c = new Creature(item, this.cfg.mode);
        this.creatures.set(item.id, c);
        const img = new Image();
        img.onload = () => {
          c.img = img;
          c.fit(this);
          if (initial) c.placeInside(this); else { c.enter(this); this.onArrive(c); }
        };
        img.src = urlFor(item);
      }
    }

    tap(e) {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      // сверху вниз — ищем, в кого попали
      const list = [...this.creatures.values()].filter((c) => c.img).sort((a, b) => b.y - a.y);
      for (const c of list) {
        if (c.hit(x, y)) { c.poke(); this.burst(x, y, 'heart', 7); this.onTap('creature'); return; }
      }
      this.burst(x, y, this.loc === 'sea' ? 'bubble' : this.loc === 'savanna' ? 'flower' : 'star', 9);
      this.onTap('empty');
    }

    burst(x, y, type, n) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = rand(40, 160) * this.unit;
        this.particles.push({
          type, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60 * this.unit,
          life: 0, max: rand(0.9, 1.6), size: rand(8, 18) * this.unit, rot: rand(0, 6), hue: rand(0, 360),
        });
      }
    }

    frame(dt) {
      this.t += dt;
      const ctx = this.ctx, W = this.W, H = this.H;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.bg, 0, 0);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      BG[this.loc].back(ctx, W, H, this.t, this.decor, dt, this);

      const list = [...this.creatures.values()].filter((c) => c.img);
      for (const c of list) {
        c.update(dt, this);
        if (c.gone) this.creatures.delete(c.id);
      }
      if (this.cfg.mode === 'walk') list.sort((a, b) => a.y - b.y);
      for (const c of list) if (!c.gone) c.draw(ctx, this);

      BG[this.loc].front(ctx, W, H, this.t, this.decor, dt, this);
      this.drawParticles(ctx, dt);
      for (const c of list) if (!c.gone) c.drawLabel(ctx, this);
    }

    drawParticles(ctx, dt) {
      this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
      for (const p of this.particles) {
        const k = p.life / p.max;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.97;
        if (p.type === 'bubble') p.vy -= 120 * this.unit * dt; else p.vy += 160 * this.unit * dt;
        ctx.save();
        ctx.globalAlpha = 1 - k * k;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + k * 2);
        const s = p.size * (0.6 + k * 0.6);
        if (p.type === 'bubble') bubble(ctx, 0, 0, s * 0.7);
        else if (p.type === 'heart') heart(ctx, s, '#ff4f8b');
        else if (p.type === 'flower') flower(ctx, s, `hsl(${p.hue},90%,65%)`);
        else star(ctx, s, `hsl(${p.hue},95%,62%)`);
        ctx.restore();
      }
    }
  }

  // ---------------- Существо ----------------
  class Creature {
    constructor(item, mode) {
      this.id = item.id;
      this.name = item.name || '';
      this.mode = mode;
      this.aspect = item.w / item.h;
      this.state = 'live';
      this.phase = rand(0, 10);
      this.dir = Math.random() < 0.5 ? 1 : -1;
      this.face = this.dir;
      this.vx = 0; this.vy = 0;
      this.pokeT = 1; this.idle = 0; this.label = 0;
      this.kSize = rand(0.88, 1.12);
      this.kSpeed = rand(0.8, 1.2);
    }

    fit(w) {
      const u = w.unit;
      this.base = (this.mode === 'swim' ? 165 : 215) * u * this.kSize;
      this.speed = (this.mode === 'swim' ? 70 : 55) * u * this.kSpeed;
      this.size();
      if (w.cfg.mode === 'walk') {
        const [a, b] = w.cfg.area;
        this.y = clamp(this.y ?? 0, w.H * a, w.H * b);
      }
    }

    size(w) {
      let L = this.base;
      if (this.mode === 'walk' && w) {
        const [a, b] = w.cfg.area;
        const t = clamp((this.y - w.H * a) / (w.H * (b - a)), 0, 1);
        L *= 0.6 + 0.45 * t;
      }
      // самая длинная сторона = L, но не выше разумного
      if (this.aspect >= 1) { this.dw = L; this.dh = L / this.aspect; }
      else { this.dh = L * (this.mode === 'walk' ? 1 : 0.85); this.dw = this.dh * this.aspect; }
    }

    placeInside(w) {
      const [a, b] = w.cfg.area;
      this.x = rand(w.W * 0.15, w.W * 0.85);
      this.y = rand(w.H * a, w.H * b);
      if (this.mode === 'swim') this.y = clamp(this.y, w.H * a + this.dh, w.H * b - this.dh / 2);
      this.newTarget(w);
    }

    enter(w) {
      const [a, b] = w.cfg.area;
      this.state = 'enter';
      this.dir = Math.random() < 0.5 ? 1 : -1;
      this.face = this.dir;
      this.size(w);
      this.x = this.dir > 0 ? -this.dw : w.W + this.dw;
      this.y = this.mode === 'swim' ? rand(w.H * a + this.dh, w.H * b - this.dh) : rand(w.H * (a + 0.1), w.H * b);
      this.tx = this.dir > 0 ? rand(w.W * 0.3, w.W * 0.6) : rand(w.W * 0.4, w.W * 0.7);
      this.ty = this.y;
      this.label = 7;
    }

    leave(w) {
      this.state = 'leave';
      this.dir = this.x < w.W / 2 ? -1 : 1;
      this.tx = this.dir > 0 ? w.W + this.dw * 1.5 : -this.dw * 1.5;
      this.ty = this.y;
      this.idle = 0;
    }

    newTarget(w) {
      const [a, b] = w.cfg.area;
      if (this.mode === 'swim') {
        // плывём далеко в сторону, немного меняя глубину
        const goRight = this.x < w.W * 0.35 ? true : this.x > w.W * 0.65 ? false : Math.random() < 0.5;
        this.tx = goRight ? rand(w.W * 0.7, w.W * 0.92) : rand(w.W * 0.08, w.W * 0.3);
        this.ty = clamp(this.y + rand(-0.25, 0.25) * w.H, w.H * a + this.dh * 0.6, w.H * b - this.dh * 0.5);
      } else {
        this.tx = rand(w.W * 0.08, w.W * 0.92);
        this.ty = rand(w.H * a, w.H * b);
      }
    }

    poke() { this.pokeT = 0; this.label = 4; }

    hit(x, y) {
      const top = this.mode === 'walk' ? this.y - this.dh : this.y - this.dh / 2;
      return Math.abs(x - this.x) < this.dw * 0.5 && y > top && y < top + this.dh;
    }

    update(dt, w) {
      this.pokeT = Math.min(1, this.pokeT + dt * 1.2);
      this.label = Math.max(0, this.label - dt);
      const leaving = this.state === 'leave';
      const sp = this.speed * (leaving ? 2.2 : this.state === 'enter' ? 1.4 : 1);

      if (this.mode === 'swim') {
        const dx = this.tx - this.x, dy = this.ty - this.y;
        const wantVx = Math.sign(dx) * sp * clamp(Math.abs(dx) / 80, 0.25, 1);
        const wantVy = clamp(dy * 0.6, -sp * 0.45, sp * 0.45);
        this.vx += (wantVx - this.vx) * Math.min(1, dt * 1.6);
        this.vy += (wantVy - this.vy) * Math.min(1, dt * 1.6);
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.phase += dt * (4 + 6 * Math.abs(this.vx) / this.speed);
        if (!leaving && Math.abs(dx) < 40 * w.unit) { this.state = 'live'; this.newTarget(w); }
      } else {
        if (this.idle > 0 && !leaving) {
          this.idle -= dt;
          this.vx *= 0.85;
          this.phase += dt * 1.5;
        } else {
          const dx = this.tx - this.x;
          const depth = clamp((this.y - w.H * w.cfg.area[0]) / (w.H * (w.cfg.area[1] - w.cfg.area[0])), 0, 1);
          const v = sp * (0.6 + 0.45 * depth);
          this.vx += (Math.sign(dx) * v - this.vx) * Math.min(1, dt * 3);
          this.x += this.vx * dt;
          this.y += clamp((this.ty - this.y) * 0.5, -v * 0.3, v * 0.3) * dt;
          this.phase += dt * (6 + 6 * Math.abs(this.vx) / this.speed);
          if (!leaving && Math.abs(dx) < 20 * w.unit) {
            this.state = 'live';
            if (Math.random() < 0.55) this.idle = rand(1.2, 3.5);
            this.newTarget(w);
          }
        }
        this.size(w);
      }
      if (Math.abs(this.vx) > 4) this.dir = Math.sign(this.vx);
      this.face += (this.dir - this.face) * Math.min(1, dt * 5);
      if (leaving && (this.x < -this.dw * 1.2 || this.x > w.W + this.dw * 1.2)) this.gone = true;
    }

    draw(ctx, w) {
      const img = this.img, dw = this.dw, dh = this.dh;
      const pk = this.pokeT < 1 ? Math.sin(this.pokeT * Math.PI) : 0;
      ctx.save();
      if (this.mode === 'swim') {
        ctx.translate(this.x, this.y + Math.sin(this.phase * 0.35) * 4 * w.unit);
        const spin = this.pokeT < 1 ? (1 - Math.pow(1 - this.pokeT, 3)) * Math.PI * 2 : 0; // кувырок при касании
        ctx.rotate(clamp(this.vy / (this.speed * 3), -0.35, 0.35) * Math.sign(this.face || 1) + spin * Math.sign(this.face || 1));
        const sx = Math.abs(this.face) < 0.15 ? 0.15 * Math.sign(this.face || 1) : this.face;
        ctx.scale(sx * (1 + pk * 0.2), 1 + pk * 0.2);
        // Тело изгибается волной: хвост (слева) машет сильнее, голова почти неподвижна
        const N = 18, iw = img.naturalWidth, ih = img.naturalHeight;
        const sw = iw / N, ddw = dw / N;
        const amp = dh * 0.09;
        for (let i = 0; i < N; i++) {
          const u = (i + 0.5) / N;
          const k = Math.pow(1 - u, 1.6);
          const off = Math.sin(this.phase - u * 3.2) * amp * k;
          ctx.drawImage(img, i * sw, 0, sw, ih, -dw / 2 + i * ddw, -dh / 2 + off, ddw + 0.8, dh);
        }
      } else {
        const moving = Math.abs(this.vx) > this.speed * 0.15;
        const bob = moving ? Math.abs(Math.sin(this.phase)) * dh * 0.07 : Math.sin(this.phase * 2) * dh * 0.01;
        const rock = moving ? Math.sin(this.phase) * 0.06 : 0;
        const hop = pk * dh * 0.45;
        // тень
        ctx.fillStyle = 'rgba(40,20,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, dw * 0.38 * (1 - pk * 0.3), dh * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(this.x, this.y - bob - hop);
        ctx.rotate(rock);
        const breathe = 1 + Math.sin(this.t2 = (this.t2 || 0) + 0.04) * 0.015;
        const sx = Math.abs(this.face) < 0.15 ? 0.15 * Math.sign(this.face || 1) : this.face;
        ctx.scale(sx * (1 + pk * 0.08), breathe * (1 - pk * 0.05));
        ctx.drawImage(img, -dw / 2, -dh, dw, dh);
      }
      ctx.restore();
    }

    drawLabel(ctx, w) {
      if (!this.name || this.label <= 0) return;
      const a = clamp(this.label, 0, 1);
      const fs = Math.round(18 * w.unit + 6);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `800 ${fs}px ${FONT}`;
      const tw = ctx.measureText(this.name).width + fs * 1.2;
      const x = this.x, y = (this.mode === 'swim' ? this.y - this.dh / 2 : this.y - this.dh) - fs * 1.1;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      roundRect(ctx, x - tw / 2, y - fs * 0.85, tw, fs * 1.6, fs * 0.8);
      ctx.fill();
      ctx.fillStyle = '#5b2bd6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.name, x, y - fs * 0.05);
      ctx.restore();
    }
  }

  // ---------------- Фигурки для частиц ----------------
  function bubble(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.15); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  }
  function heart(ctx, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.45, -s, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.45, -s, s, -s * 0.3, 0, s * 0.35);
    ctx.fill();
  }
  function star(ctx, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * 0.42 : s;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  }
  function flower(ctx, s, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.42, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function cloud(ctx, x, y, s, color = '#fff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
    ctx.arc(x + s * 0.55, y - s * 0.2, s * 0.6, 0, Math.PI * 2);
    ctx.arc(x + s * 1.15, y, s * 0.45, 0, Math.PI * 2);
    ctx.rect(x, y - s * 0.1, s * 1.15, s * 0.55);
    ctx.fill();
  }
  function grad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }

  // ---------------- Фоны ----------------
  const BG = {
    // ===== АКВАРИУМ =====
    sea: {
      init(W, H) {
        const u = Math.min(W, H * 1.4) / 800;
        const weeds = [];
        const n = Math.max(6, Math.round(W / 120));
        for (let i = 0; i < n; i++) weeds.push({
          x: rand(0, W), h: rand(0.18, 0.42) * H, w: rand(10, 18) * u, ph: rand(0, 6),
          c: ['#22c55e', '#16a34a', '#4ade80', '#10b981'][i % 4], front: Math.random() < 0.35,
        });
        const vents = [rand(0.1, 0.3), rand(0.6, 0.9)].map((x) => ({ x: x * W, t: 0 }));
        return { u, weeds, vents, bubbles: [], fishTiny: [] };
      },
      paint(c, W, H, d) {
        c.fillStyle = grad(c, 0, H, ['#5ee7f5', '#1fb3e6', '#1279c9', '#0b4fa0']);
        c.fillRect(0, 0, W, H);
        // дальние скалы
        c.fillStyle = 'rgba(20,70,150,0.45)';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 12) c.lineTo(x, H * 0.72 - Math.sin(x * 0.006 + 1) * H * 0.07 - Math.sin(x * 0.017) * H * 0.03);
        c.lineTo(W, H); c.fill();
        // песок
        const sy = H * 0.86;
        c.fillStyle = grad(c, sy - 20, H, ['#ffe08a', '#f7c35f', '#eaa84a']);
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W + 10; x += 10) c.lineTo(x, sy + Math.sin(x * 0.012) * 10 * d.u + Math.sin(x * 0.031) * 4 * d.u);
        c.lineTo(W, H); c.fill();
        // камушки и ракушки
        const cols = ['#f472b6', '#a78bfa', '#fb923c', '#fde68a', '#60a5fa'];
        for (let i = 0; i < W / 25; i++) {
          c.fillStyle = cols[i % cols.length];
          c.beginPath();
          c.ellipse(rand(0, W), rand(sy + 18 * d.u, H - 6), rand(4, 10) * d.u, rand(3, 6) * d.u, 0, 0, Math.PI * 2);
          c.fill();
        }
        // кораллы
        const coral = (x, s, col) => {
          c.strokeStyle = col; c.lineCap = 'round';
          const br = (x0, y0, a, len, w, depth) => {
            if (depth === 0) return;
            const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
            c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
            br(x1, y1, a - 0.45, len * 0.75, w * 0.75, depth - 1);
            br(x1, y1, a + 0.45, len * 0.75, w * 0.75, depth - 1);
          };
          br(x, sy + 8 * d.u, -Math.PI / 2, 45 * s, 14 * s, 4);
        };
        coral(W * 0.18, d.u * 1.1, '#ff6b9d');
        coral(W * 0.78, d.u * 1.3, '#ff9f43');
        coral(W * 0.52, d.u * 0.8, '#c084fc');
        // ракушка-сундучок: большой камень
        c.fillStyle = '#7c6fd6';
        c.beginPath(); c.ellipse(W * 0.9, sy + 14 * d.u, 70 * d.u, 40 * d.u, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#9b8ff0';
        c.beginPath(); c.ellipse(W * 0.88, sy + 6 * d.u, 30 * d.u, 16 * d.u, 0, Math.PI, 0); c.fill();
      },
      back(c, W, H, t, d, dt) {
        // лучи света
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const x = W * (0.1 + i * 0.22) + Math.sin(t * 0.3 + i) * 30;
          const a = 0.05 + 0.04 * Math.sin(t * 0.7 + i * 2);
          const g = c.createLinearGradient(0, 0, 0, H * 0.85);
          g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = g;
          c.beginPath(); c.moveTo(x - 30, 0); c.lineTo(x + 30, 0); c.lineTo(x + 160, H * 0.85); c.lineTo(x + 40, H * 0.85); c.fill();
        }
        c.restore();
        // волны на поверхности
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3 * d.u;
        c.beginPath();
        for (let x = 0; x <= W; x += 12) c.lineTo(x, 8 * d.u + Math.sin(x * 0.02 + t * 2) * 4 * d.u);
        c.stroke();
        weeds(c, H, t, d, false);
        // пузырьки со дна
        for (const v of d.vents) {
          v.t -= dt;
          if (v.t <= 0) { v.t = rand(0.15, 0.5); d.bubbles.push({ x: v.x + rand(-6, 6), y: H * 0.88, r: rand(3, 9) * d.u, ph: rand(0, 6) }); }
        }
        d.bubbles = d.bubbles.filter((b) => b.y > -20);
        for (const b of d.bubbles) {
          b.y -= (40 + b.r * 6) * dt * d.u; b.ph += dt * 3;
          bubble(c, b.x + Math.sin(b.ph) * 4, b.y, b.r);
        }
      },
      front(c, W, H, t, d) { weeds(c, H, t, d, true); },
    },

    // ===== САВАННА / ЗООПАРК =====
    savanna: {
      init(W, H) {
        const u = Math.min(W, H * 1.4) / 800;
        const clouds = Array.from({ length: 4 }, () => ({ x: rand(0, W), y: rand(0.06, 0.28) * H, s: rand(50, 90) * u, v: rand(6, 16) * u }));
        const grass = Array.from({ length: Math.round(W / 40) }, () => ({ x: rand(0, W), h: rand(20, 45) * u, ph: rand(0, 6) }));
        const flies = Array.from({ length: 4 }, () => ({ x: rand(0, W), y: rand(0.4, 0.7) * H, ph: rand(0, 6), hue: rand(0, 360) }));
        return { u, clouds, grass, flies };
      },
      paint(c, W, H, d) {
        const hz = H * 0.52;
        c.fillStyle = grad(c, 0, hz, ['#4cc9ff', '#8fdcff', '#ffe8a3']);
        c.fillRect(0, 0, W, hz + 2);
        // солнце
        const sx = W * 0.82, sy = H * 0.16, sr = 55 * d.u;
        const g = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3);
        g.addColorStop(0, 'rgba(255,230,120,0.9)'); g.addColorStop(1, 'rgba(255,230,120,0)');
        c.fillStyle = g; c.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
        c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
        // горы
        c.fillStyle = '#f0a868';
        c.beginPath(); c.moveTo(0, hz);
        for (let x = 0; x <= W; x += W / 10) c.lineTo(x, hz - (Math.sin(x * 0.005) * 0.5 + 0.7) * H * 0.12);
        c.lineTo(W, hz); c.fill();
        c.fillStyle = '#c5d86d';
        c.beginPath(); c.moveTo(0, hz + 4);
        for (let x = 0; x <= W; x += 20) c.lineTo(x, hz - (Math.sin(x * 0.009 + 2) * 0.5 + 0.5) * H * 0.05);
        c.lineTo(W, hz + 4); c.fill();
        // земля
        c.fillStyle = grad(c, hz, H, ['#ffd166', '#f8b84e', '#f29e4c']);
        c.fillRect(0, hz, W, H - hz);
        // акации
        const acacia = (x, s) => {
          c.strokeStyle = '#7a4a24'; c.lineWidth = 9 * s; c.lineCap = 'round';
          c.beginPath(); c.moveTo(x, hz + 6 * s); c.quadraticCurveTo(x + 8 * s, hz - 50 * s, x - 6 * s, hz - 95 * s); c.stroke();
          c.lineWidth = 5 * s;
          c.beginPath(); c.moveTo(x + 2 * s, hz - 60 * s); c.lineTo(x + 40 * s, hz - 95 * s); c.stroke();
          c.fillStyle = '#3f9b3f';
          c.beginPath(); c.ellipse(x + 5 * s, hz - 105 * s, 85 * s, 22 * s, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#52b84f';
          c.beginPath(); c.ellipse(x - 5 * s, hz - 112 * s, 60 * s, 14 * s, 0, 0, Math.PI * 2); c.fill();
        };
        acacia(W * 0.15, d.u * 1.2);
        acacia(W * 0.62, d.u * 0.8);
        acacia(W * 0.92, d.u);
        // озерцо
        c.fillStyle = '#4fc3f7';
        c.beginPath(); c.ellipse(W * 0.4, hz + H * 0.05, W * 0.12, H * 0.025, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)';
        c.beginPath(); c.ellipse(W * 0.38, hz + H * 0.045, W * 0.04, H * 0.006, 0, 0, Math.PI * 2); c.fill();
        // пятнышки на земле
        c.fillStyle = 'rgba(200,120,40,0.25)';
        for (let i = 0; i < W / 18; i++) { c.beginPath(); c.ellipse(rand(0, W), rand(hz + 30, H), rand(6, 22) * d.u, rand(2, 5) * d.u, 0, 0, Math.PI * 2); c.fill(); }
      },
      back(c, W, H, t, d, dt) {
        for (const cl of d.clouds) {
          cl.x += cl.v * dt;
          if (cl.x > W + cl.s * 2) cl.x = -cl.s * 2;
          cloud(c, cl.x, cl.y, cl.s);
        }
        // лучики солнца
        c.save();
        c.translate(W * 0.82, H * 0.16);
        c.rotate(t * 0.15);
        c.strokeStyle = 'rgba(255,210,63,0.7)'; c.lineWidth = 6 * d.u; c.lineCap = 'round';
        for (let i = 0; i < 12; i++) {
          c.rotate(Math.PI / 6);
          c.beginPath(); c.moveTo(70 * d.u, 0); c.lineTo((90 + Math.sin(t * 3 + i) * 8) * d.u, 0); c.stroke();
        }
        c.restore();
        // бабочки
        for (const f of d.flies) {
          f.ph += dt;
          f.x += Math.cos(f.ph * 0.5) * 30 * d.u * dt + 10 * d.u * dt;
          if (f.x > W + 20) f.x = -20;
          const y = f.y + Math.sin(f.ph * 1.3) * 30 * d.u;
          const fl = Math.abs(Math.sin(f.ph * 14));
          c.fillStyle = `hsl(${f.hue},90%,65%)`;
          c.beginPath(); c.ellipse(f.x - 5 * d.u * fl, y, 7 * d.u * fl + 1, 9 * d.u, -0.3, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(f.x + 5 * d.u * fl, y, 7 * d.u * fl + 1, 9 * d.u, 0.3, 0, Math.PI * 2); c.fill();
        }
      },
      front(c, W, H, t, d) {
        c.strokeStyle = '#6aa83a'; c.lineCap = 'round';
        for (const g of d.grass) {
          const sw = Math.sin(t * 1.8 + g.ph) * 6 * d.u;
          c.lineWidth = 3 * d.u;
          for (let k = -1; k <= 1; k++) {
            c.beginPath(); c.moveTo(g.x + k * 5 * d.u, H + 2);
            c.quadraticCurveTo(g.x + k * 8 * d.u, H - g.h * 0.5, g.x + k * 12 * d.u + sw, H - g.h * (1 - Math.abs(k) * 0.25));
            c.stroke();
          }
        }
      },
    },

    // ===== ДОМИК ПИТОМЦЕВ =====
    home: {
      init(W, H) {
        const u = Math.min(W, H * 1.4) / 800;
        const dust = Array.from({ length: 18 }, () => ({ x: rand(0, 1), y: rand(0, 1), ph: rand(0, 6) }));
        return { u, dust };
      },
      paint(c, W, H, d) {
        const fy = H * 0.6; // линия пола
        // обои
        c.fillStyle = '#ffe9a8'; c.fillRect(0, 0, W, fy);
        c.fillStyle = 'rgba(255,170,90,0.18)';
        for (let x = 0; x < W; x += 60 * d.u) c.fillRect(x, 0, 28 * d.u, fy);
        c.fillStyle = 'rgba(255,255,255,0.5)';
        for (let x = 30 * d.u; x < W; x += 120 * d.u) for (let y = 30 * d.u; y < fy; y += 90 * d.u) {
          c.save(); c.translate(x, y); heart(c, 8 * d.u, 'rgba(255,120,160,0.35)'); c.restore();
        }
        // окно
        const wx = W * 0.1, wy = H * 0.1, ww = W * 0.26, wh = H * 0.32;
        c.fillStyle = '#fff'; c.fillRect(wx - 10 * d.u, wy - 10 * d.u, ww + 20 * d.u, wh + 20 * d.u);
        c.fillStyle = grad(c, wy, wy + wh, ['#48c3ff', '#b5ecff']); c.fillRect(wx, wy, ww, wh);
        cloud(c, wx + ww * 0.15, wy + wh * 0.35, 30 * d.u);
        c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(wx + ww * 0.8, wy + wh * 0.25, 22 * d.u, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#7cd36b'; c.beginPath(); c.ellipse(wx + ww / 2, wy + wh, ww * 0.7, wh * 0.25, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#fff'; c.fillRect(wx + ww / 2 - 4 * d.u, wy, 8 * d.u, wh); c.fillRect(wx, wy + wh / 2 - 4 * d.u, ww, 8 * d.u);
        // шторы
        c.fillStyle = '#ff6fa5';
        c.beginPath(); c.moveTo(wx - 30 * d.u, wy - 25 * d.u); c.lineTo(wx + ww * 0.22, wy - 25 * d.u);
        c.quadraticCurveTo(wx + 4 * d.u, wy + wh * 0.5, wx + 12 * d.u, wy + wh + 30 * d.u); c.lineTo(wx - 30 * d.u, wy + wh + 30 * d.u); c.fill();
        c.beginPath(); c.moveTo(wx + ww + 30 * d.u, wy - 25 * d.u); c.lineTo(wx + ww * 0.78, wy - 25 * d.u);
        c.quadraticCurveTo(wx + ww - 4 * d.u, wy + wh * 0.5, wx + ww - 12 * d.u, wy + wh + 30 * d.u); c.lineTo(wx + ww + 30 * d.u, wy + wh + 30 * d.u); c.fill();
        c.fillStyle = '#e24f8a'; c.fillRect(wx - 40 * d.u, wy - 32 * d.u, ww + 80 * d.u, 12 * d.u);
        // картина
        const px = W * 0.5, py = H * 0.12;
        c.fillStyle = '#8b5cf6'; c.fillRect(px, py, 110 * d.u, 80 * d.u);
        c.fillStyle = '#fff7e0'; c.fillRect(px + 8 * d.u, py + 8 * d.u, 94 * d.u, 64 * d.u);
        c.fillStyle = '#ff9f43'; c.beginPath(); c.arc(px + 55 * d.u, py + 40 * d.u, 18 * d.u, 0, Math.PI * 2); c.fill();
        // диван
        const sx = W * 0.62, sw = W * 0.32, sy = fy - 95 * d.u;
        c.fillStyle = '#4f9df7';
        roundRect(c, sx, sy - 50 * d.u, sw, 90 * d.u, 26 * d.u); c.fill();
        c.fillStyle = '#6bb3ff';
        roundRect(c, sx + 20 * d.u, sy + 10 * d.u, sw - 40 * d.u, 60 * d.u, 18 * d.u); c.fill();
        c.fillStyle = '#3b82f6';
        roundRect(c, sx - 15 * d.u, sy - 5 * d.u, 45 * d.u, 95 * d.u, 18 * d.u); c.fill();
        roundRect(c, sx + sw - 30 * d.u, sy - 5 * d.u, 45 * d.u, 95 * d.u, 18 * d.u); c.fill();
        c.fillStyle = '#ffd23f'; roundRect(c, sx + sw * 0.6, sy - 12 * d.u, 50 * d.u, 40 * d.u, 12 * d.u); c.fill();
        // пол
        c.fillStyle = grad(c, fy, H, ['#f2b880', '#e8a065', '#d98a4e']);
        c.fillRect(0, fy, W, H - fy);
        c.strokeStyle = 'rgba(140,70,20,0.25)'; c.lineWidth = 2;
        for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * 0.04, fy); c.lineTo(W / 2 + i * W * 0.16, H); c.stroke(); }
        c.fillStyle = '#fff'; c.fillRect(0, fy - 8 * d.u, W, 10 * d.u);
        // коврик
        const rx = W * 0.45, ry = H * 0.82;
        c.fillStyle = '#ff7eb3'; c.beginPath(); c.ellipse(rx, ry, W * 0.28, H * 0.1, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffd1e6'; c.lineWidth = 6 * d.u;
        c.beginPath(); c.ellipse(rx, ry, W * 0.22, H * 0.075, 0, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.ellipse(rx, ry, W * 0.14, H * 0.045, 0, 0, Math.PI * 2); c.stroke();
        // цветок в горшке
        const fx = W * 0.05;
        c.fillStyle = '#e76f51'; c.beginPath(); c.moveTo(fx - 25 * d.u, fy - 30 * d.u); c.lineTo(fx + 25 * d.u, fy - 30 * d.u); c.lineTo(fx + 18 * d.u, fy + 10 * d.u); c.lineTo(fx - 18 * d.u, fy + 10 * d.u); c.fill();
        c.fillStyle = '#2fbf71';
        for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(fx + i * 12 * d.u, fy - 60 * d.u - Math.abs(i) * -8 * d.u, 9 * d.u, 30 * d.u, i * 0.35, 0, Math.PI * 2); c.fill(); }
      },
      back(c, W, H, t, d) {
        // часы с бегущей стрелкой
        const cx = W * 0.42, cy = H * 0.3, r = 34 * d.u;
        c.fillStyle = '#fff'; c.strokeStyle = '#22c55e'; c.lineWidth = 7 * d.u;
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill(); c.stroke();
        c.strokeStyle = '#333'; c.lineCap = 'round';
        c.lineWidth = 4 * d.u; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * 0.1) * r * 0.5, cy + Math.sin(t * 0.1) * r * 0.5); c.stroke();
        c.lineWidth = 2.5 * d.u; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * 1.2) * r * 0.78, cy + Math.sin(t * 1.2) * r * 0.78); c.stroke();
        // солнечный луч из окна
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = `rgba(255,240,180,${0.1 + Math.sin(t * 0.8) * 0.04})`;
        c.beginPath(); c.moveTo(W * 0.1, H * 0.42); c.lineTo(W * 0.36, H * 0.42); c.lineTo(W * 0.62, H); c.lineTo(W * 0.2, H); c.fill();
        c.restore();
      },
      front(c, W, H, t, d) {
        // пылинки в луче
        c.fillStyle = 'rgba(255,255,255,0.8)';
        for (const p of d.dust) {
          const x = W * (0.15 + p.x * 0.3) + Math.sin(t * 0.5 + p.ph) * 20 * d.u + (p.y * W * 0.25);
          const y = H * (0.45 + p.y * 0.5) + Math.cos(t * 0.4 + p.ph) * 15 * d.u;
          c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + p.ph);
          c.beginPath(); c.arc(x, y, 2.2 * d.u, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
      },
    },
  };

  function weeds(c, H, t, d, front) {
    c.lineCap = 'round';
    for (const w of d.weeds) {
      if (w.front !== front) continue;
      c.strokeStyle = w.c; c.lineWidth = w.w;
      c.globalAlpha = front ? 0.95 : 0.8;
      c.beginPath();
      const base = H + 4;
      c.moveTo(w.x, base);
      const seg = 6;
      for (let i = 1; i <= seg; i++) {
        const k = i / seg;
        c.lineTo(w.x + Math.sin(t * 1.3 + w.ph + k * 2.5) * 18 * d.u * k, base - w.h * k);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  return { World, LOC };
})();
