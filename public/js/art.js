// Картинки интерфейса (SVG прямо в коде): иконки, рыбка-талисман, обложки локаций
window.Art = (function () {
  const i = (p, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;

  const icon = {
    camera: i('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    image: i('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
    home: i('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>'),
    plus: i('<path d="M12 5v14M5 12h14"/>'),
    flip: i('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
    close: i('<path d="M6 6l12 12M18 6 6 18"/>'),
    trash: i('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    gear: i('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
    soundOn: i('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
    soundOff: i('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6M22 9l-5 6"/>'),
    full: i('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    check: i('<path d="m5 12 5 5 9-10"/>'),
    print: i('<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>'),
    logout: i('<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>'),
    install: i('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    back: i('<path d="M15 5l-7 7 7 7"/>'),
    paw: i('<circle cx="12" cy="15.5" r="4"/><circle cx="5.5" cy="10" r="1.8"/><circle cx="9.5" cy="6" r="1.8"/><circle cx="14.5" cy="6" r="1.8"/><circle cx="18.5" cy="10" r="1.8"/>'),
    wing: i('<path d="M12 8v11"/><path d="M12 11C9 4 3 4 3 9s5 5 9 2"/><path d="M12 11c3-7 9-7 9-2s-5 5-9 2"/><path d="M12 13c-3 0-6 2-5 5s4 1 5-3M12 13c3 0 6 2 5 5s-4 1-5-3"/><path d="M10 5l2 3 2-3"/>'),
    fish: i('<path d="M3 12c3-5 9-6 13 0-4 6-10 5-13 0z"/><path d="M16 12l5-4v8z"/><circle cx="7.5" cy="11" r=".6"/>'),
    hop: i('<path d="M3 20c1.5-8 6-8 7.5 0M12 20c1.5-11 7.5-11 9 0"/><path d="M19 16l2 4 2-3"/>'),
    magic: i('<path d="m4 20 11-11M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.7 1.3L21 13l-1.3.7L19 15l-.7-1.3L17 13l1.3-.7z"/>'),
  };

  const mascot = `
  <svg viewBox="0 0 220 160" class="mascot">
    <defs>
      <linearGradient id="mg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#ff5e62"/></linearGradient>
    </defs>
    <g class="m-tail"><path d="M52 80 L8 40 Q20 80 8 120 Z" fill="#ffd23f" stroke="#2b1b4a" stroke-width="6" stroke-linejoin="round"/></g>
    <path d="M100 34 Q125 0 158 32" fill="#ffd23f" stroke="#2b1b4a" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="120" cy="82" rx="75" ry="55" fill="url(#mg)" stroke="#2b1b4a" stroke-width="6"/>
    <path d="M95 32 Q85 80 98 132" fill="none" stroke="#fff" stroke-width="10" opacity=".55"/>
    <path d="M125 28 Q115 82 128 136" fill="none" stroke="#fff" stroke-width="10" opacity=".55"/>
    <g class="m-eye"><circle cx="160" cy="68" r="17" fill="#fff" stroke="#2b1b4a" stroke-width="5"/><circle cx="164" cy="70" r="8" fill="#2b1b4a"/><circle cx="167" cy="66" r="3" fill="#fff"/></g>
    <path d="M168 100 Q180 108 190 98" fill="none" stroke="#2b1b4a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="150" cy="96" r="7" fill="#ff8fb1" opacity=".8"/>
    <path class="m-fin" d="M112 100 Q96 128 132 116 Z" fill="#ffd23f" stroke="#2b1b4a" stroke-width="5" stroke-linejoin="round"/>
  </svg>`;

  const INK = '#2b1b4a';
  // контурная «лента»: тёмная обводка + цвет внутри (хвосты)
  const tail = (d, color, w = 4) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;

  // Иллюстрации нарисованы в сетке 400×280 и уменьшены вдвое, чтобы влезть в карточку 200×140
  const O = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
  const L = (d, w = 3.5, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Картинки зверей для карточек (белый фон уже убран). В демо-версии их подменяет window.ART_IMG.
  const IMG = window.ART_IMG || { sea: '/icons/cover-sea.webp', savanna: '/icons/cover-savanna.webp', home: '/icons/cover-home.webp' };
  const pic = (src, x, y, w, h, cls) => `<g class="${cls}"><image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/></g>`;
  const goldfish = pic(IMG.sea, 26, 10, 150, 116, 'swim');
  const elephant = pic(IMG.savanna, 60, 8, 126, 125, 'bob');
  const kitten = pic(IMG.home, 4, 22, 152, 110, 'bob');

  const cover = {
    sea: `
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ff0ff"/><stop offset="1" stop-color="#1479d6"/></linearGradient></defs>
      <rect width="200" height="140" fill="url(#cs)"/>
      <path d="M0 124 Q50 112 100 124 T200 122 V140 H0Z" fill="#ffd56b"/>
      <g class="sway"><path d="M14 134 Q4 106 18 86 Q28 68 16 52" stroke="#22c55e" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <g class="sway d2"><path d="M186 134 Q196 108 182 90" stroke="#4ade80" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      ${goldfish}
    </svg>`,
    savanna: `
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ff"/><stop offset=".65" stop-color="#ffe9a3"/></linearGradient></defs>
      <rect width="200" height="140" fill="url(#cv)"/>
      <g class="spin" style="transform-origin:174px 24px"><circle cx="174" cy="24" r="13" fill="#ffd23f"/>
        <g stroke="#ffb703" stroke-width="4" stroke-linecap="round"><path d="M174 4v-3M174 47v-3M154 24h-3M197 24h-3M160 10l-2-2M188 38l-2-2M160 38l-2 2M188 10l-2 2"/></g></g>
      <path d="M0 98 Q60 82 120 94 T200 90 V140 H0Z" fill="#f8b84e"/>
      <path d="M26 100 q3 -38 -6 -48 M8 52 q18 -9 36 2" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="26" cy="50" rx="26" ry="7.5" fill="#3f9b3f"/>
      <ellipse cx="122" cy="132" rx="56" ry="5" fill="#d98b2b" opacity=".45"/>
      ${elephant}
    </svg>`,
    home: `
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="140" fill="#ffd6e7"/>
      <g fill="#fff" opacity=".7"><circle cx="20" cy="20" r="5"/><circle cx="60" cy="14" r="4"/><circle cx="110" cy="10" r="3"/></g>
      <rect y="108" width="200" height="32" fill="#f2b880"/>
      <path d="M150 108 V72 L174 52 L198 72 V108Z" fill="#ffe08a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M144 76 L174 46 L204 76" fill="none" stroke="#ff5fa2" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="166" y="84" width="16" height="24" rx="3" fill="#7c3aed"/>
      <ellipse cx="80" cy="131" rx="64" ry="5" fill="#c97b45" opacity=".45"/>
      <g class="beat" style="transform-origin:20px 34px"><path d="M20 42 C6 32 11 23 20 29 C29 23 34 32 20 42Z" fill="#ff4f8b"/></g>
      ${kitten}
    </svg>`,
  };

  return { icon, mascot, cover };
})();
