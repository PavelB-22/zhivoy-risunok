// Раскраски: 15 зверей (по 5 на мир), чёрные контуры на белом.
// Все звери смотрят вправо — так приложению проще их оживить.
window.Templates = (function () {
  const SW = 7; // толщина контура
  const o = (d, extra = '') => `<path d="${d}" fill="#fff" stroke="#111" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const l = (d, w = 5) => `<path d="${d}" fill="none" stroke="#111" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const c = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#111" stroke-width="${SW}"/>`;
  const e = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fff" stroke="#111" stroke-width="${SW}"/>`;
  const dot = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#111"/>`;
  const rr = (x, y, w, h, r = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" stroke="#111" stroke-width="${SW}"/>`;
  // «лента» — толстая линия с белой серединой (щупальца, хвосты), её тоже можно раскрасить
  const rb = (d, w = 24) =>
    `<path d="${d}" fill="none" stroke="#111" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w - 2 * SW}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const eye = (cx, cy, r = 13) => c(cx, cy, r) + dot(cx + r * 0.25, cy + r * 0.1, r * 0.5) + `<circle cx="${cx + r * 0.4}" cy="${cy - r * 0.2}" r="${r * 0.18}" fill="#fff"/>`;

  const list = {
    sea: [
      { id: 'fish', name: 'Рыбка', vb: '0 0 400 300', body:
        o('M95 150 L28 85 Q48 150 28 215 Z') + o('M175 72 Q205 25 255 62 Z') + o('M190 225 Q205 268 240 232 Z') +
        o('M90 150 C120 70 250 55 320 105 C350 125 365 140 368 150 C365 160 350 175 320 195 C250 245 120 230 90 150 Z') +
        l('M170 95 Q155 150 170 205') + l('M220 85 Q205 150 220 215') +
        o('M250 168 Q222 196 208 178 Q222 166 250 158 Z') + eye(310, 130, 17) + l('M335 168 Q348 176 360 162') },

      { id: 'jelly', name: 'Медуза', vb: '0 0 400 410', body:
        rb('M100 175 C75 225 130 260 100 310 C80 345 115 370 95 390') +
        rb('M150 180 C140 240 175 270 150 320 C135 350 160 365 150 380') +
        rb('M200 182 C215 240 185 280 205 330 C215 360 195 375 200 395') +
        rb('M250 180 C260 240 225 270 250 320 C265 350 240 365 250 380') +
        rb('M300 175 C325 225 270 260 300 310 C320 345 285 370 305 390') +
        o('M50 180 C50 25 350 25 350 180 Q325 205 300 180 Q275 205 250 180 Q225 205 200 180 Q175 205 150 180 Q125 205 100 180 Q75 205 50 180 Z') +
        c(115, 110, 14) + c(285, 95, 18) + c(305, 145, 10) + c(150, 65, 10) +
        eye(170, 125, 15) + eye(230, 125, 15) + l('M180 155 Q200 172 220 155') },

      { id: 'whale', name: 'Кит', vb: '0 0 420 300', body:
        rb('M300 64 L300 22', 18) + rb('M300 30 C285 12 268 14 260 26', 18) + rb('M300 30 C315 12 332 14 340 26', 18) +
        o('M100 150 C70 140 55 115 50 90 C35 68 8 70 6 84 C28 94 36 106 38 118 C22 126 8 138 10 150 C34 152 56 142 72 136 Z') +
        o('M70 150 C90 70 220 50 320 70 C380 82 408 130 402 165 C396 215 330 240 230 238 C150 236 100 215 70 150 Z') +
        o('M140 222 C200 205 330 205 398 175 C390 215 330 240 230 238 C190 237 160 232 140 222 Z') +
        l('M200 216 L205 236') + l('M245 212 L250 236') + l('M290 208 L294 232') + l('M335 198 L338 222') +
        o('M215 205 C222 245 255 262 280 252 C265 238 255 222 250 207 Z') +
        eye(330, 128, 14) + l('M352 168 Q370 176 388 164') },

      { id: 'shark', name: 'Акула', vb: '0 0 420 260', body:
        o('M85 130 L20 50 Q38 110 32 130 Q38 160 18 215 Z') +
        o('M185 85 C195 42 218 20 248 14 C238 45 240 70 252 88 Z') +
        o('M70 130 C120 75 250 68 330 92 C372 105 400 120 412 135 C396 152 372 162 330 170 C250 186 130 186 70 130 Z') +
        o('M150 172 C220 177 320 166 406 140 C396 152 372 162 330 170 C262 184 196 184 150 172 Z') +
        l('M285 108 Q278 128 286 150') + l('M300 106 Q293 126 301 148') + l('M315 104 Q308 124 316 146') +
        o('M225 168 C232 205 255 228 282 232 C272 208 270 188 270 170 Z') +
        eye(352, 115, 11) + l('M348 150 Q372 158 398 144') +
        `<path d="M360 153 L365 162 L370 154 M376 151 L381 159 L386 149" fill="#fff" stroke="#111" stroke-width="4" stroke-linejoin="round"/>` },

      { id: 'octopus', name: 'Осьминог', vb: '0 0 400 400', body:
        rb('M110 180 C55 190 30 240 50 268 C65 288 85 270 72 258', 30) +
        rb('M290 180 C345 190 370 240 350 268 C335 288 315 270 328 258', 30) +
        rb('M130 200 C90 245 70 295 98 325 C118 345 140 325 124 310', 30) +
        rb('M270 200 C310 245 330 295 302 325 C282 345 260 325 276 310', 30) +
        rb('M170 212 C155 270 145 330 178 352 C198 364 210 344 194 334', 30) +
        rb('M230 212 C245 270 255 330 222 352 C202 364 190 344 206 334', 30) +
        o('M90 190 C68 50 332 50 310 190 C290 228 110 228 90 190 Z') +
        c(130, 115, 11) + c(270, 105, 14) + c(200, 75, 9) +
        eye(168, 150, 20) + eye(232, 150, 20) + l('M180 190 Q200 205 220 190') },
    ],

    savanna: [
      { id: 'elephant', name: 'Слон', vb: '0 0 420 320', body:
        rb('M78 165 C58 180 52 200 54 222', 16) + o('M42 222 Q54 248 66 222 Z') +
        rr(100, 200, 45, 92) + rr(225, 200, 45, 92) +
        o('M70 170 C65 100 140 75 230 80 C300 85 330 120 325 175 C320 225 280 240 200 240 C120 240 75 225 70 170 Z') +
        rr(130, 205, 45, 92) + rr(255, 205, 45, 92) +
        l('M140 296 q7 -10 14 0 M156 296 q7 -10 14 0') + l('M265 296 q7 -10 14 0 M281 296 q7 -10 14 0') +
        o('M335 165 C356 192 362 232 346 266 C340 282 354 292 364 280 C384 240 380 190 362 150 Z') +
        c(320, 130, 62) +
        l('M348 230 l14 4 M352 252 l14 3') +
        o('M288 85 C232 68 212 150 232 186 C248 212 292 202 296 176 Z') +
        o('M342 176 C352 196 368 202 388 196 C374 190 364 180 360 168 Z') +
        eye(342, 112, 11) },

      { id: 'giraffe', name: 'Жираф', vb: '0 0 380 470', body:
        rb('M72 290 C60 320 56 345 58 370', 12) + o('M48 368 Q58 400 70 368 Z') +
        rr(85, 300, 28, 150, 12) + rr(118, 300, 28, 150, 12) +
        o('M200 255 L250 82 L300 96 L268 275 Z') +
        o('M60 292 C55 242 110 226 180 226 C250 226 286 246 286 286 C286 322 250 332 175 332 C100 332 62 322 60 292 Z') +
        rr(210, 300, 28, 150, 12) + rr(244, 300, 28, 150, 12) +
        l('M85 430 h28 M118 430 h28 M210 430 h28 M244 430 h28') +
        rb('M262 50 L256 16', 13) + rb('M286 47 L288 13', 13) + c(256, 14, 9) + c(288, 11, 9) +
        o('M258 58 L222 44 L248 76 Z') +
        o('M245 76 C245 40 300 34 332 54 C354 68 356 94 334 104 C306 116 248 108 245 76 Z') +
        e(110, 262, 20, 14, -10) + e(160, 252, 18, 13, 15) + e(215, 260, 22, 14, -5) + e(135, 302, 18, 12, 10) +
        e(192, 302, 20, 13, -15) + e(248, 292, 15, 11, 5) + e(262, 128, 12, 17, 15) + e(256, 182, 13, 17, 10) + e(282, 222, 11, 15, 5) +
        eye(302, 66, 9) + dot(338, 84, 4) + l('M318 100 Q330 104 340 98') },

      { id: 'lion', name: 'Лев', vb: '0 0 420 320', body:
        rb('M80 178 C40 172 30 128 48 104', 14) + o('M48 104 C30 96 32 70 50 62 C52 76 64 78 70 70 C76 90 66 104 48 104 Z') +
        rr(105, 210, 42, 85) + rr(230, 210, 42, 85) +
        o('M75 192 C70 140 130 125 210 128 C280 130 310 150 310 195 C310 235 270 245 195 245 C120 245 78 235 75 192 Z') +
        rr(135, 215, 42, 85) + rr(260, 215, 42, 85) +
        l('M145 299 q6 -9 12 0 M159 299 q6 -9 12 0') + l('M270 299 q6 -9 12 0 M284 299 q6 -9 12 0') +
        Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return c((320 + Math.cos(a) * 58).toFixed(1), (128 + Math.sin(a) * 58).toFixed(1), 26); }).join('') +
        `<circle cx="320" cy="128" r="62" fill="#fff"/>` +
        c(292, 88, 13) + c(348, 88, 13) +
        c(320, 130, 46) +
        dot(304, 122, 6) + dot(336, 122, 6) +
        `<path d="M312 140 L328 140 L320 150 Z" fill="#111" stroke="#111" stroke-width="4" stroke-linejoin="round"/>` +
        l('M320 150 Q311 162 302 155 M320 150 Q329 162 338 155') },

      { id: 'zebra', name: 'Зебра', vb: '0 0 420 340', body:
        rb('M70 170 C58 200 54 225 56 250', 12) + o('M46 248 Q56 282 68 248 Z') +
        rr(95, 205, 30, 115, 12) + rr(128, 205, 30, 115, 12) +
        o('M250 170 L290 70 L340 85 L302 190 Z') +
        o('M65 180 C60 135 120 125 200 125 C270 125 305 145 305 185 C305 225 265 235 190 235 C115 235 68 225 65 180 Z') +
        rr(235, 205, 30, 115, 12) + rr(268, 205, 30, 115, 12) +
        l('M95 300 h30 M128 300 h30 M235 300 h30 M268 300 h30') +
        l('M95 260 h30 M128 262 h30 M235 260 h30 M268 262 h30') +
        o('M294 60 L280 70 L288 79 L272 91 L281 99 L264 114 L274 121 L258 137 L268 144 L252 160 L264 170 L304 76 Z') +
        o('M307 58 L300 24 L326 50 Z') +
        o('M290 76 C298 44 346 38 370 70 L396 122 C404 140 386 152 368 142 L330 108 C310 102 284 96 290 76 Z') +
        l('M120 130 Q110 180 125 230') + l('M150 127 Q140 180 155 233') + l('M180 126 Q170 180 185 234') +
        l('M210 126 Q204 176 215 233') + l('M240 128 Q234 176 246 230') + l('M268 134 Q264 176 276 226') +
        l('M276 118 L318 130') + l('M288 92 L330 106') + l('M266 148 L306 160') +
        l('M345 60 L340 85') + l('M362 80 L350 100') +
        eye(332, 72, 8) + dot(386, 128, 4) },

      { id: 'monkey', name: 'Обезьянка', vb: '0 0 400 340', body:
        rb('M92 170 C40 160 30 88 72 70 C98 60 108 90 88 100', 16) +
        rr(100, 205, 30, 100, 14) + rr(132, 205, 30, 100, 14) +
        e(175, 185, 95, 55) +
        rr(225, 200, 30, 105, 14) + rr(257, 200, 30, 105, 14) +
        e(110, 305, 22, 10) + e(147, 305, 22, 10) + e(244, 305, 22, 10) + e(276, 305, 22, 10) +
        e(160, 195, 40, 28) +
        c(238, 120, 22) + c(342, 120, 22) + c(238, 120, 10) + c(342, 120, 10) +
        c(290, 120, 55) +
        o('M290 100 C270 78 242 100 254 126 C262 150 280 166 290 166 C300 166 318 150 326 126 C338 100 310 78 290 100 Z') +
        l('M282 66 Q290 54 298 66 M270 70 Q274 58 284 64') +
        eye(276, 116, 8) + eye(304, 116, 8) + dot(286, 136, 3) + dot(294, 136, 3) + l('M276 146 Q290 158 304 146') },
    ],

    home: [
      { id: 'cat', name: 'Котик', vb: '0 0 400 320', body:
        rb('M85 175 C40 160 30 100 60 80 C70 72 78 82 70 92', 20) +
        rr(110, 200, 34, 85, 15) + rr(210, 200, 34, 85, 15) +
        e(180, 190, 105, 62) +
        rr(135, 205, 34, 85, 15) + rr(235, 205, 34, 85, 15) +
        o('M262 80 L270 22 L305 62 Z') + o('M335 62 L368 22 L372 82 Z') +
        l('M276 66 L280 42 L294 60') + l('M346 60 L362 42 L362 68') +
        c(318, 112, 62) +
        e(296, 105, 12, 15) + e(340, 105, 12, 15) + dot(298, 108, 6) + dot(342, 108, 6) +
        `<path d="M311 128 L325 128 L318 137 Z" fill="#111"/>` +
        l('M318 137 Q308 150 298 142 M318 137 Q328 150 338 142') +
        l('M290 128 L268 124 M290 136 L270 140 M346 128 L368 124 M346 136 L366 140', 4) },

      { id: 'dog', name: 'Собачка', vb: '0 0 430 320', body:
        rb('M85 170 C55 150 50 115 62 92', 18) +
        rr(100, 205, 38, 82, 15) + rr(220, 205, 38, 82, 15) +
        e(185, 190, 112, 58) +
        e(150, 172, 32, 22, -10) +
        rr(128, 210, 38, 82, 15) + rr(250, 210, 38, 82, 15) +
        rb('M262 168 Q292 192 326 182', 20) + c(298, 196, 10) +
        c(310, 128, 56) +
        e(360, 150, 34, 25) +
        `<ellipse cx="390" cy="139" rx="11" ry="9" fill="#111"/>` +
        l('M372 168 Q362 178 348 172') +
        o('M286 82 C254 76 242 140 260 172 C274 188 296 172 292 150 Z') +
        eye(320, 116, 9) },

      { id: 'parrot', name: 'Попугай', vb: '0 0 360 430', body:
        o('M150 285 L92 405 L124 412 L178 300 Z') + o('M175 292 L146 418 L178 418 L198 300 Z') +
        rb('M190 300 L186 338', 14) + rb('M222 300 L224 338', 14) +
        l('M170 344 L186 338 L196 350 M212 346 L224 338 L236 348', 6) +
        o('M138 175 C122 108 208 86 252 120 C288 150 280 232 254 280 C232 314 166 318 148 288 C130 258 142 218 138 175 Z') +
        l('M175 250 C200 268 230 262 245 245') +
        o('M218 78 L210 40 L232 66 Z') + o('M234 70 L238 30 L250 64 Z') +
        c(242, 108, 48) +
        o('M282 88 C322 82 338 122 316 150 C306 134 296 128 284 128 Z') +
        o('M284 128 C296 128 304 136 306 146 C296 148 288 142 284 128 Z') +
        c(258, 98, 15) + dot(262, 99, 7) +
        o('M178 165 C150 196 150 258 186 290 C212 268 222 218 206 172 Z') +
        l('M172 200 C178 222 186 240 196 252') + l('M190 186 C194 212 200 230 204 240') },

      { id: 'hamster', name: 'Хомячок', vb: '0 0 380 300', body:
        c(232, 92, 22) + c(232, 92, 11) + c(280, 98, 18) + c(280, 98, 9) +
        o('M60 200 C50 120 130 80 210 85 C290 90 335 140 330 200 C325 245 272 260 190 258 C110 256 65 245 60 200 Z') +
        o('M90 228 C120 196 250 192 300 225 C285 250 250 258 190 258 C130 258 102 248 90 228 Z') +
        c(302, 200, 26) +
        e(130, 262, 18, 10) + e(170, 264, 18, 10) + e(250, 262, 18, 10) + e(288, 258, 16, 10) +
        o('M60 196 C42 192 40 178 56 176 Z') +
        eye(292, 146, 10) + `<ellipse cx="326" cy="166" rx="7" ry="5" fill="#111"/>` +
        l('M326 172 Q320 182 312 178') + l('M312 166 L345 158 M312 172 L346 176', 3) },

      { id: 'rabbit', name: 'Зайчик', vb: '0 0 380 380', body:
        o('M248 130 C226 64 232 12 254 6 C276 12 282 74 270 132 Z') + l('M254 112 C246 70 248 36 255 24') +
        o('M276 134 C286 68 308 28 326 34 C342 46 320 96 298 138 Z') + l('M290 120 C300 84 312 58 320 50') +
        c(72, 255, 26) +
        e(150, 330, 70, 22) +
        o('M70 262 C60 180 130 150 200 160 C262 170 282 220 272 282 C264 322 202 340 140 336 C96 332 76 302 70 262 Z') +
        e(250, 328, 28, 14) +
        e(280, 172, 58, 50) +
        eye(296, 160, 10) + `<ellipse cx="334" cy="178" rx="7" ry="5" fill="#111"/>` +
        l('M334 184 Q328 196 318 192') + l('M318 182 L352 172 M318 188 L354 192', 3) +
        l('M196 240 C206 262 206 290 196 310') },
    ],
  };

  const WORLD = { sea: 'Море', savanna: 'Саванна', home: 'Домик' };

  // Маленькая картинка для карточки
  function preview(t) {
    return `<svg viewBox="${t.vb}" xmlns="http://www.w3.org/2000/svg">${t.body}</svg>`;
  }

  // Целый лист А4 (размеры в мм). Подписи очень светлые — приложение их не вырежет.
  function pageSvg(t, world) {
    const [, , w, h] = t.vb.split(' ').map(Number);
    const boxW = 180, boxH = 215;
    const s = Math.min(boxW / w, boxH / h);
    const dw = w * s, dh = h * s;
    const x = (210 - dw) / 2, y = 38 + (boxH - dh) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="2480" height="3508" viewBox="0 0 210 297">
      <rect width="210" height="297" fill="#fff"/>
      <text x="105" y="22" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="10" fill="#dcdcdc">${WORLD[world]} · ${t.name}</text>
      <svg x="${x}" y="${y}" width="${dw}" height="${dh}" viewBox="${t.vb}">${t.body}</svg>
      <text x="105" y="282" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="6" fill="#e2e2e2">Раскрась и сфотографируй весь лист · Живой рисунок</text>
    </svg>`;
  }

  function svgToCanvas(svg) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = 2480; cv.height = 3508; // А4, 300 точек на дюйм
        const x = cv.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
        x.drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv);
      };
      img.onerror = () => reject(new Error('Не получилось нарисовать лист'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  const toJpeg = (cv) => new Promise((res) => cv.toBlob((b) => b.arrayBuffer().then((a) => res(new Uint8Array(a))), 'image/jpeg', 0.92));

  // Простейший PDF: каждая страница — картинка во весь лист А4
  function makePdf(jpegs) {
    const enc = new TextEncoder();
    const parts = []; const offsets = []; let len = 0;
    const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const W = 595.28, H = 841.89;
    const n = jpegs.length;
    // объекты: 1 каталог, 2 страницы, дальше по 3 на страницу (страница, содержимое, картинка)
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const obj = (id, body) => { offsets[id] = len; push(`${id} 0 obj\n`); body(); push('\nendobj\n'); };
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    const kids = jpegs.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`));
    jpegs.forEach((jpg, i) => {
      const p = 3 + i * 3;
      obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i} ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`));
      const content = `q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`;
      obj(p + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
      obj(p + 2, () => {
        push(`<< /Type /XObject /Subtype /Image /Width 2480 /Height 3508 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
        push(jpg); push('\nendstream');
      });
    });
    const xref = len; const total = 3 + n * 3;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }

  async function pdfFor(world, ids) {
    const items = list[world].filter((t) => !ids || ids.includes(t.id));
    const jpegs = [];
    for (const t of items) jpegs.push(await toJpeg(await svgToCanvas(pageSvg(t, world))));
    return makePdf(jpegs);
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  return { list, WORLD, preview, pageSvg, svgToCanvas, pdfFor, download };
})();
