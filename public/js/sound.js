// Весёлые звуки без файлов — синтезируем прямо в браузере
window.Sound = (function () {
  let ac = null;
  let muted = false;
  try { muted = localStorage.getItem('muted') === '1'; } catch {}

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, start, dur, type = 'sine', vol = 0.2, slideTo) {
    const a = ctx(); if (!a || muted) return;
    const t = a.currentTime + start;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  return {
    click() { tone(660, 0, 0.09, 'triangle', 0.15, 990); },
    pop() { tone(420, 0, 0.12, 'sine', 0.25, 900); },
    bloop() { tone(300, 0, 0.18, 'sine', 0.22, 120); tone(500, 0.06, 0.12, 'sine', 0.12, 250); },
    boing() { tone(180, 0, 0.3, 'triangle', 0.25, 520); },
    magic() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.07, 0.25, 'triangle', 0.14)); },
    fanfare() { [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.3, 'square', 0.07)); tone(1046, 0.48, 0.5, 'triangle', 0.15); },
    error() { tone(300, 0, 0.15, 'sawtooth', 0.08, 200); tone(220, 0.15, 0.2, 'sawtooth', 0.08, 150); },
    get muted() { return muted; },
    toggle() { muted = !muted; try { localStorage.setItem('muted', muted ? '1' : '0'); } catch {} return muted; },
  };
})();
