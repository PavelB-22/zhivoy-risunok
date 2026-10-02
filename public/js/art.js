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

  const cover = {
    sea: `
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ff0ff"/><stop offset="1" stop-color="#1479d6"/></linearGradient></defs>
      <rect width="200" height="140" fill="url(#cs)"/>
      <path d="M0 122 Q50 110 100 122 T200 120 V140 H0Z" fill="#ffd56b"/>
      <g class="sway"><path d="M30 130 Q20 100 34 80 Q44 60 32 44" stroke="#22c55e" stroke-width="8" fill="none" stroke-linecap="round"/></g>
      <g class="sway d2"><path d="M172 130 Q182 104 168 86" stroke="#4ade80" stroke-width="8" fill="none" stroke-linecap="round"/></g>
      <g class="swim">
        <path d="M70 70 L48 54 Q54 70 48 86Z" fill="#ffd23f" stroke="#2b1b4a" stroke-width="3.5" stroke-linejoin="round"/>
        <ellipse cx="98" cy="70" rx="32" ry="22" fill="#ff7a59" stroke="#2b1b4a" stroke-width="3.5"/>
        <path d="M92 50 Q88 70 92 90" stroke="#fff" stroke-width="5" fill="none" opacity=".6"/>
        <circle cx="114" cy="64" r="6" fill="#fff" stroke="#2b1b4a" stroke-width="2.5"/><circle cx="116" cy="65" r="3" fill="#2b1b4a"/>
      </g>
      <g class="rise"><circle cx="140" cy="60" r="6" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="150" cy="40" r="4" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="143" cy="24" r="3" fill="none" stroke="#fff" stroke-width="2"/></g>
    </svg>`,
    savanna: `
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ff"/><stop offset=".65" stop-color="#ffe9a3"/></linearGradient></defs>
      <rect width="200" height="140" fill="url(#cv)"/>
      <g class="spin" style="transform-origin:160px 30px"><circle cx="160" cy="30" r="16" fill="#ffd23f"/>
        <g stroke="#ffb703" stroke-width="4" stroke-linecap="round"><path d="M160 6v-4M160 58v-4M136 30h-4M188 30h-4M143 13l-3-3M180 50l-3-3M143 47l-3 3M180 10l-3 3"/></g></g>
      <path d="M0 96 Q60 78 120 92 T200 88 V140 H0Z" fill="#f8b84e"/>
      <g class="bob">
        <g fill="#c2611f" stroke="#2b1b4a" stroke-width="3">
          ${Array.from({length:12},(_,k)=>{const a=k/12*Math.PI*2;return `<circle cx="${(86+Math.cos(a)*28).toFixed(1)}" cy="${(80+Math.sin(a)*28).toFixed(1)}" r="11"/>`}).join('')}
        </g>
        <circle cx="86" cy="80" r="28" fill="#c2611f"/>
        <circle cx="86" cy="82" r="22" fill="#ffc94d" stroke="#2b1b4a" stroke-width="3"/>
        <circle cx="78" cy="78" r="3.5" fill="#2b1b4a"/><circle cx="94" cy="78" r="3.5" fill="#2b1b4a"/>
        <path d="M82 88 L90 88 L86 93Z" fill="#2b1b4a"/>
        <path d="M80 96 Q86 100 92 96" fill="none" stroke="#2b1b4a" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="68" cy="58" r="6" fill="#ffc94d" stroke="#2b1b4a" stroke-width="3"/><circle cx="104" cy="58" r="6" fill="#ffc94d" stroke="#2b1b4a" stroke-width="3"/>
      </g>
      <path d="M150 96 q4 -40 -6 -50 M134 44 q20 -10 40 2" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="152" cy="44" rx="30" ry="8" fill="#3f9b3f"/>
    </svg>`,
    home: `
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="140" fill="#ffd6e7"/>
      <g fill="#fff" opacity=".7"><circle cx="20" cy="20" r="5"/><circle cx="60" cy="34" r="4"/><circle cx="180" cy="22" r="5"/><circle cx="140" cy="40" r="3"/></g>
      <rect y="104" width="200" height="36" fill="#f2b880"/>
      <path d="M120 104 V62 L150 38 L180 62 V104Z" fill="#ffe08a" stroke="#2b1b4a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M112 66 L150 32 L188 66" fill="none" stroke="#ff5fa2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="140" y="74" width="20" height="30" rx="3" fill="#7c3aed"/>
      <g class="bob">
        <path d="M44 74 L50 50 L62 66 M90 66 L102 50 L106 74" fill="#9ca3af" stroke="#2b1b4a" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="75" cy="84" rx="34" ry="28" fill="#a3a3b8" stroke="#2b1b4a" stroke-width="3"/>
        <circle cx="64" cy="80" r="4" fill="#2b1b4a"/><circle cx="86" cy="80" r="4" fill="#2b1b4a"/>
        <path d="M72 88 L78 88 L75 92Z" fill="#ff5fa2"/>
        <path d="M68 96 Q75 100 82 96" fill="none" stroke="#2b1b4a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M44 86 H58 M44 92 L58 90 M92 86 H106 M92 90 L106 92" stroke="#2b1b4a" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g class="beat" style="transform-origin:30px 112px"><path d="M30 120 C14 108 20 98 30 106 C40 98 46 108 30 120Z" fill="#ff4f8b"/></g>
    </svg>`,
  };

  return { icon, mascot, cover };
})();
