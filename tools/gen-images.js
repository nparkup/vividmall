// 상품 썸네일 SVG 생성기 (직접 그린 오리지널 목업 이미지). 실행: node tools/gen-images.js
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'img', 'products');
fs.mkdirSync(OUT, { recursive: true });

const FONT = 'font-family="Malgun Gothic,Apple SD Gothic Neo,Noto Sans KR,sans-serif"';
const T = (x, y, s, fill, t, o = '') => `<text x="${x}" y="${y}" font-size="${s}" fill="${fill}" ${FONT} ${o}>${t}</text>`;
const R = (x, y, w, h, fill, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${o}/>`;
const tooth = (x, y, s, c, o = '') => `<path transform="translate(${x} ${y}) scale(${s})" d="M-10,-12 C-14,-12 -16,-6 -14,0 C-12,8 -10,16 -6,16 C-3,16 -3,8 0,8 C3,8 3,16 6,16 C10,16 12,8 14,0 C16,-6 14,-12 10,-12 C6,-12 4,-9 0,-9 C-4,-9 -6,-12 -10,-12Z" fill="${c}" ${o}/>`;
const lines = (x, y, w, n, gap, c = '#cbd5e1', h = 3) => [...Array(n)].map((_, i) => R(x, y + i * gap, i % 3 === 2 ? w * .7 : w, h, c, 'rx="1.5"')).join('');
const G = (inner, t = '') => `<g ${t}>${inner}</g>`;
const tr = (x, y, rot = 0) => `transform="translate(${x} ${y}) rotate(${rot})"`;
const SH = 'filter="url(#sh)"', SH2 = 'filter="url(#sh2)"';
const teeth = (x, y, n, gap, c, f = 'none') => [...Array(n)].map((_, i) => `<rect x="${x + i * gap}" y="${y}" width="${gap - 5}" height="${gap + 2}" rx="4" fill="${f}" stroke="${c}" stroke-width="1.4"/>`).join('');
const NAME = '미소치과';

const BG = { gray: ['#d9d9d9', '#bcbcbc'], green: ['#c6e09b', '#a8cb70'], mint: ['#c4eadf', '#9bd5c6'], pink: ['#f8d0d8', '#ecaebd'], beige: ['#f1e6d0', '#dfcdaa'], sky: ['#cfe4f6', '#a8cbe9'], lav: ['#ddd6f3', '#bdb2e4'], sand: ['#ece6d8', '#d4c9b0'], peach: ['#fbdcc8', '#f2b999'] };
const leaf = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0,0 C40,-30 110,-30 150,0 C110,30 40,30 0,0Z"/><path d="M0,0 L-60,-8" stroke="#000" stroke-width="5" fill="none"/></g>`;
const render = (inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e7a1"/><stop offset=".5" stop-color="#d4af37"/><stop offset="1" stop-color="#b8901f"/></linearGradient>
<linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset=".5" stop-color="#b6c0cc"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient>
<linearGradient id="foil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd6de"/><stop offset=".3" stop-color="#f8fafc"/><stop offset=".6" stop-color="#aeb8c4"/><stop offset="1" stop-color="#eef2f6"/></linearGradient>
<filter id="sh" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="3" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".28"/></filter>
<filter id="sh2" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="1" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".28"/></filter>
<filter id="blur"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="real" x="-5%" y="-5%" width="110%" height="110%">
<feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 .35  0 0 0 0 .33  0 0 0 0 .3  0 0 0 .22 -.04" result="grain"/>
<feComposite in="grain" in2="SourceAlpha" operator="in" result="grainIn"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>
<feSpecularLighting in="b" surfaceScale="5" specularConstant=".9" specularExponent="22" lighting-color="#fff" result="spec"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting>
<feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
<feColorMatrix in="specIn" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .55 0" result="specSoft"/>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grainIn"/><feMergeNode in="specSoft"/></feMerge>
</filter>
<filter id="desk"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .09 0"/></filter>
<radialGradient id="vig" cx=".38" cy=".3" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".30"/></radialGradient>
</defs><rect width="600" height="600" fill="url(#bg)"/>
<g filter="url(#blur)" opacity=".13" fill="#000">${leaf(430, -10, 62, 1.5)}${leaf(520, 60, 95, 1.3)}${leaf(-20, 40, 20, 1.2)}</g>
<rect width="600" height="600" filter="url(#desk)"/><g filter="url(#real)"><g transform="translate(-90 28) scale(1.3)">${inner}</g></g><rect width="600" height="600" fill="url(#vig)"/></svg>`;
const wrap = inner => inner;
// ---------- 서식류 ----------
const doc = (x, y, w, h, { acc = '#2563eb', title = '', inner = '', rot = 0, band = true } = {}) => G(
  R(0, 0, w, h, '#fff', `rx="4" ${SH}`) + (band ? R(0, 0, w, 32, acc, 'rx="4"') + R(0, 20, w, 12, acc) + tooth(18, 16, .55, '#fff') + T(34, 21, 13, '#fff', title, 'font-weight="700"') : '') + inner, tr(x, y, rot));
const infoBlock = (w, c) => [0, 1].map(i => [0, 1].map(j => R(14 + j * (w / 2 - 6), 44 + i * 16, w / 2 - 20, 9, 'none', `stroke="${c}" stroke-width="1" rx="2"`)).join('')).join('');

const grid = (x, y, w, h, rows, cols, c = '#94a3b8') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="1"/>` + [...Array(rows - 1)].map((_, i) => `<line x1="${x}" y1="${y + (i + 1) * h / rows}" x2="${x + w}" y2="${y + (i + 1) * h / rows}" stroke="${c}" stroke-width=".8"/>`).join('') + [...Array(cols - 1)].map((_, i) => `<line x1="${x + (i + 1) * w / cols}" y1="${y}" x2="${x + (i + 1) * w / cols}" y2="${y + h}" stroke="${c}" stroke-width=".8"/>`).join('');
const formPage = (x, y, rot, acc, color, title) => G(R(0, 0, 210, 290, '#fff', `${SH} rx="2"`) + (color ? R(0, 0, 210, 8, acc) : '')
  + T(105, 30, 14, color ? acc : '#111', title, 'text-anchor="middle" font-weight="700" letter-spacing="3"') + R(60, 36, 90, 1.5, color ? acc : '#111')
  + grid(14, 48, 182, 30, 2, 4, color ? acc : '#555') + grid(14, 84, 182, 20, 1, 3, color ? acc : '#555')
  + teeth(18, 114, 8, 22, color ? acc : '#555', color ? '#eaf3ff' : 'none') + teeth(18, 140, 8, 22, color ? acc : '#555', color ? '#eaf3ff' : 'none')
  + grid(14, 172, 182, 100, 7, 3, color ? acc : '#777') + tooth(188, 282, .35, color ? acc : '#555') + T(18, 284, 7, '#64748b', NAME), tr(x, y, rot));
const chart = (acc, color) => formPage(160, 78, -9, acc, color, '진 료 기 록 부') + formPage(235, 66, 5, acc, color, '초 진 차 트');
const slip = acc => {
  const pad = (x, y, rot) => doc(x, y, 240, 180, { rot, band: false });
  return pad(170, 175, -5) + pad(190, 165, 3) + doc(180, 120, 240, 190, {
    acc, title: '접수증', inner: R(0, 36, 240, 1, '#fff') + [0, 1, 2, 3, 4].map(i => R(16, 52 + i * 24, 70, 8, acc, 'opacity=".25" rx="2"') + R(96, 56 + i * 24, 126, 1.5, '#94a3b8')).join('')
      + `<line x1="0" y1="168" x2="240" y2="168" stroke="#94a3b8" stroke-dasharray="5 4"/>` + T(16, 184, 10, '#64748b', 'NO. 0001')
  }) + R(180, 114, 240, 14, '#f59e0b', 'rx="3" opacity=".9"');
};
const consent = () => {
  const stripes = R(212, 62, 12, 290, '#60a5fa', 'rx="2"') + R(222, 66, 10, 290, '#fde047', 'rx="2"');
  const rows = [0, 1, 2, 3].map(i => `<rect x="16" y="${50 + i * 30}" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5" rx="2"/>` + R(38, 53 + i * 30, 150, 3, '#94a3b8') + R(38, 60 + i * 30, 110, 3, '#cbd5e1')).join('');
  return stripes + doc(0 + 195, 62, 210, 290, { acc: '#0e7490', title: '진료 동의서', inner: rows + R(16, 190, 178, 1, '#cbd5e1') + lines(16, 202, 178, 3, 12) + T(16, 262, 10, '#64748b', '서명') + R(44, 264, 120, 1.5, '#334155') });
};
const letter = () => doc(180, 60, 240, 300, {
  acc: '#fff', band: false, inner: tooth(34, 34, .8, '#0ea5e9') + T(52, 40, 15, '#0369a1', NAME, 'font-weight="700"') + T(150, 28, 8, '#94a3b8', 'Dental Clinic') + R(0, 56, 240, 2, '#0ea5e9')
    + lines(24, 90, 190, 11, 15) + R(0, 278, 240, 22, '#0ea5e9', 'opacity=".9"') + T(24, 293, 9, '#fff', 'TEL 02-0000-0000')
}) + R(190, 360, 220, 8, '#e2e8f0', 'rx="2"');
const foldChart = () => {
  const left = `<polygon points="120,90 300,90 300,330 120,330" fill="#fff" ${SH}/>` + R(120, 90, 180, 30, '#2563eb') + tooth(142, 105, .55, '#fff') + T(158, 110, 13, '#fff', '진료차트 A3', 'font-weight="700"') + R(136, 134, 70, 9, 'none', 'stroke="#94a3b8" rx="2"') + R(214, 134, 70, 9, 'none', 'stroke="#94a3b8" rx="2"') + teeth(136, 170, 8, 20, '#2563eb', '#e0efff') + teeth(136, 196, 8, 20, '#2563eb', '#e0efff') + lines(134, 240, 150, 5, 14);
  const right = `<polygon points="300,90 480,102 480,318 300,330" fill="#eef3f9" ${SH}/>` + `<polygon points="300,90 480,102 480,120 300,120" fill="#1d4ed8"/>` + lines(318, 150, 150, 9, 18, '#c4d3e8');
  return left + right + `<line x1="300" y1="90" x2="300" y2="330" stroke="#94a3b8" stroke-width="1.5"/>` + `<polygon points="296,90 300,90 300,330 296,330" fill="#0002"/>`;
};

// ---------- 봉투/화일 ----------
const envBack = (x, y, w, h, c, flap, rot = 0) => G(R(0, 0, w, h, c, `rx="3" ${SH}`) + `<path d="M0,0 L${w / 2},${h * .6} L${w},0 Z" fill="${flap}"/><path d="M0,${h} L${w * .42},${h * .52} M${w},${h} L${w * .58},${h * .52}" stroke="#0003" fill="none"/>`, tr(x, y, rot));
const envFront = (x, y, w, h, c, acc, { win = false, rot = 0 } = {}) => G(R(0, 0, w, h, c, `rx="3" ${SH}`) + tooth(26, 26, .75, acc) + T(44, 31, 13, acc, NAME, 'font-weight="700"')
  + (win ? R(w * .08, h * .42, w * .5, h * .34, '#e6f0fb', 'stroke="#94a3b8" rx="3"') + lines(w * .12, h * .5, w * .4, 3, 11, '#94a3b8', 2.5) : lines(w * .45, h * .55, w * .45, 3, 11, '#9ca3af', 2.5))
  + `<rect x="${w - 38}" y="12" width="26" height="30" fill="none" stroke="#9ca3af" stroke-dasharray="3 2" rx="2"/>`, tr(x, y, rot));
const env = ({ w = 300, h = 170, c = '#fff', flap = '#f1f5f9', acc = '#0ea5e9', win = false } = {}) => envBack(100, 105, w, h, c, flap, -6) + envFront(200, 150, w, h, c, acc, { win, rot: 3 });
const docEnv = ({ c, flap, acc }) => envBack(120, 110, 250, 200, c, flap, -5) + envFront(220, 120, 250, 200, c, acc, { rot: 4 });

const folder = (x, y, w, h, acc, rot = 0) => G(
  `<path d="M0,12 Q0,0 12,0 L${w * .4},0 L${w * .46},16 L${w},16 L${w},${h} L0,${h}Z" fill="${acc}" opacity=".75" ${SH}/>` + R(14, 26, w - 28, h * .55, '#fff', 'rx="3"') + lines(28, 50, w - 56, 4, 14)
  + `<path d="M0,${h * .42} L${w},${h * .36} L${w},${h} L0,${h}Z" fill="${acc}"/>` + tooth(w / 2 - 50, h * .72, 1, '#fff') + T(w / 2 - 28, h * .72 + 6, 18, '#fff', NAME, 'font-weight="700"'), tr(x, y, rot));
const vinyl = (x, y, w, h, kind) => {
  const panel = R(0, 0, w, h, '#fff', 'fill-opacity=".5" stroke="#8aa4c0" stroke-width="2" rx="6"');
  const sheet = R(14, 8, w - 28, h * .7, '#fff', 'rx="3"') + R(14, 8, w - 28, 24, '#38bdf8', 'rx="3"') + tooth(34, 20, .5, '#fff') + T(48, 25, 12, '#fff', NAME, 'font-weight="700"') + lines(28, 48, w - 56, 6, 14);
  let extra = '';
  if (kind === 'l') extra = `<path d="M${w - 2},2 L${w - 2},${h} L2,${h}" stroke="#5b7ea3" stroke-width="5" fill="none"/>`;
  if (kind === '1') extra = R(0, h * .55, w, h * .45, '#cfe3f7', 'fill-opacity=".75" stroke="#8aa4c0" stroke-width="2"') + tooth(w / 2 - 40, h * .78, .9, '#0ea5e9') + T(w / 2 - 22, h * .78 + 6, 16, '#0369a1', NAME, 'font-weight="700"');
  return G(`<g ${SH}>${panel}</g>` + sheet + extra + (kind === 'l' ? tooth(w / 2 - 40, h * .84, .9, '#0ea5e9') + T(w / 2 - 22, h * .84 + 6, 16, '#0369a1', NAME, 'font-weight="700"') : ''), tr(x, y));
};
const vinyl2 = () => {
  const half = (x, flip) => G(R(0, 0, 200, 270, '#fff', 'fill-opacity=".5" stroke="#8aa4c0" stroke-width="2" rx="6"') + R(0, 130, 200, 140, '#cfe3f7', 'fill-opacity=".8" stroke="#8aa4c0" stroke-width="2"') + R(20, 20, 160, 90, '#fff', 'rx="3"') + lines(34, 40, 130, 4, 14) + (flip ? tooth(70, 200, 1, '#0ea5e9') + T(90, 206, 16, '#0369a1', NAME, 'font-weight="700"') : ''), tr(x, 75));
  return `<g ${SH}>${half(98)}${half(302)}</g>` + R(296, 75, 8, 270, '#5b7ea3', 'rx="3"');
};

// ---------- 명찰 ----------
const tagBase = (x, y, w, h, fill, stroke, content, rot = 0) => G(`<g ${SH}>` + R(0, 0, w, h, fill, `rx="10" stroke="${stroke}" stroke-width="2"`) + `</g>` + content, tr(x, y, rot));
const tags = kind => {
  const defs = {
    pvc: { f: '#fff', s: '#cbd5e1', ink: '#0f172a', acc: '#0ea5e9' },
    acrylic: { f: '#dff1fb', s: '#9ccbe8', ink: '#475569', acc: '#38bdf8' },
    gold: { f: 'url(#gold)', s: '#a8841c', ink: '#5b4308', acc: '#5b4308' },
    silver: { f: 'url(#silver)', s: '#8b96a3', ink: '#334155', acc: '#334155' },
  }[kind];
  const content = (w, h) => (kind === 'pvc' ? R(0, 0, 70, h, defs.acc, 'rx="10"') + R(60, 0, 12, h, defs.acc) + tooth(35, h / 2, .95, '#fff') : tooth(38, h / 2, .9, defs.acc, kind === 'acrylic' ? 'opacity=".8"' : ''))
    + T(kind === 'pvc' ? 90 : 62, h / 2 - 2, 20, defs.ink, '홍길동', 'font-weight="700"') + T(kind === 'pvc' ? 90 : 62, h / 2 + 18, 12, defs.ink, '원장 | ' + NAME)
    + (kind === 'acrylic' ? `<polygon points="30,0 90,0 50,${h} -10,${h}" fill="#fff" opacity=".35"/>` : '') + (kind === 'gold' || kind === 'silver' ? `<rect x="3" y="3" width="${w - 6}" height="${h / 2}" rx="8" fill="#fff" opacity=".22"/>` : '');
  const mk = (x, y, rot) => tagBase(x, y, 290, 100, defs.f, defs.s, content(290, 100), rot);
  const clip = (x, y) => R(x, y, 30, 8, '#6b7280', 'rx="3"');
  return mk(150, 90, -5) + clip(290, 82) + mk(170, 230, 4) + clip(310, 232);
};

// ---------- 명함 ----------
const card = (x, y, rot, fill, content, w = 270, h = 150) => G(R(0, 0, w, h, fill, `rx="5" ${SH}`) + content, tr(x, y, rot));
const cardFront = (acc, ink = '#0f172a', fill = '#fff') => R(0, 0, 14, 150, acc, 'rx="2"') + tooth(46, 40, .9, acc) + T(66, 46, 15, acc, NAME, 'font-weight="700"') + T(34, 98, 20, ink, '홍 길 동', 'font-weight="700"') + T(34, 118, 11, '#64748b', '대표원장 · 치의학박사') + T(34, 136, 10, '#64748b', 'T 02-0000-0000  |  www.dental.kr');
const cardBack = (acc, logo = '#fff') => R(0, 0, 270, 150, acc, 'rx="5"') + tooth(135, 60, 2, logo, 'opacity=".95"') + T(135, 118, 16, logo, NAME, 'text-anchor="middle" font-weight="700"');
const cards = kind => {
  if (kind === 'std') return card(120, 190, -7, '#fff', cardBack('#0ea5e9')) + card(215, 110, 5, '#fff', cardFront('#0ea5e9'));
  if (kind === 'premium') return card(110, 180, -6, '#f4ecdc', cardBack('#e9dfc8', 'url(#gold)')) + card(220, 105, 5, '#f4ecdc', cardFront('#b8901f', '#3b2f12') + R(0, 0, 270, 150, '#fff', 'opacity=".08" rx="5"'));
  if (kind === 'thick') { const edges = [...Array(8)].map((_, i) => card(165 + i * 1.5, 110 + 8 - i, 0, i < 7 ? '#e5e7eb' : '#fff', '', 270, 150)).join(''); return edges + card(173, 106, 0, '#fff', cardFront('#7c3aed')) + T(300, 330, 15, '#64748b', '350g 초고급 극후지', 'text-anchor="middle" font-weight="700"'); }
  // fold
  return `<g ${SH}>` + `<polygon points="130,130 300,130 300,310 130,310" fill="#fff"/>` + `<polygon points="300,130 470,138 470,302 300,310" fill="#f1f5f9"/></g>` + `<line x1="300" y1="130" x2="300" y2="310" stroke="#94a3b8" stroke-dasharray="4 3"/>`
    + G(tooth(46, 50, 1, '#0ea5e9') + T(70, 56, 17, '#0ea5e9', NAME, 'font-weight="700"') + lines(24, 100, 120, 4, 16) , tr(130, 130)) + G(R(16, 20, 130, 14, '#0ea5e9', 'rx="3"') + T(22, 31, 10, '#fff', '진료시간 안내') + lines(16, 56, 130, 7, 16, '#c4d3e8'), tr(300, 134, 1.7));
};

// ---------- 스티커 / 전단 / 리플렛 / 포스터 ----------
const stickerSheet = () => {
  const cells = [0, 1, 2].map(r => [0, 1, 2].map(c => G(R(0, 0, 76, 76, ['#0ea5e9', '#14b8a6', '#6366f1'][(r + c) % 3], 'rx="6"') + tooth(38, 34, 1.3, '#fff') + T(38, 66, 9, '#fff', NAME, 'text-anchor="middle"'), tr(168 + c * 90, 96 + r * 90))).join('')).join('');
  return R(150, 80, 300, 280, '#fff', `rx="6" ${SH}`) + R(150, 80, 300, 280, '#e8eef6', 'rx="6" opacity=".6"') + cells + `<polygon points="450,300 450,360 390,360" fill="#cbd5e1"/><polygon points="450,300 390,360 396,330" fill="#fff" opacity=".9"/>`;
};
const flyer = (acc, acc2, rot = 0, x = 190, y = 55, s = 1) => G(R(0, 0, 220, 300, '#fff', `rx="3" ${SH}`) + `<rect width="220" height="120" fill="${acc}" rx="3"/>` + `<circle cx="170" cy="60" r="46" fill="${acc2}" opacity=".5"/>` + tooth(170, 62, 2, '#fff')
  + T(18, 52, 18, '#fff', '건강한 미소,', 'font-weight="700"') + T(18, 78, 18, '#fff', '평생 함께합니다', 'font-weight="700"') + T(18, 100, 10, '#fff', NAME + ' · 정기검진 안내', 'opacity=".9"')
  + [0, 1, 2].map(i => `<circle cx="26" cy="${150 + i * 32}" r="6" fill="${acc}"/>` + R(42, 146 + i * 32, 150, 4, '#94a3b8', 'rx="2"') + R(42, 154 + i * 32, 110, 3, '#cbd5e1', 'rx="1.5"')).join('') + R(0, 262, 220, 38, acc2, 'rx="3"') + T(110, 286, 13, '#fff', 'TEL 02-0000-0000', 'text-anchor="middle" font-weight="700"'), tr(x, y, rot) + ` ` );
const leaflet = (acc, acc2) => `<g ${SH}><polygon points="100,70 230,62 230,346 100,338" fill="${acc}"/><polygon points="230,62 370,62 370,346 230,346" fill="#fff"/><polygon points="370,62 500,70 500,338 370,346" fill="#f5f8fc"/></g>`
  + tooth(165, 160, 2.4, '#fff') + T(165, 230, 18, '#fff', NAME, 'text-anchor="middle" font-weight="700"') + T(165, 252, 10, '#fff', '건강한 치아 안내서', 'text-anchor="middle"')
  + G(R(14, 26, 112, 16, acc2, 'rx="3"') + T(22, 38, 10, '#fff', '진료 안내') + lines(16, 64, 108, 12, 16), tr(240, 62))
  + G(R(14, 26, 112, 84, acc, 'opacity=".18" rx="4"') + teeth(22, 52, 5, 22, acc) + lines(16, 134, 108, 10, 16), tr(376, 66, 1.4))
  + '<line x1="230" y1="62" x2="230" y2="346" stroke="#0002"/><line x1="370" y1="62" x2="370" y2="346" stroke="#0002"/>';
const poster = () => R(0, 0, 600, 392, '#eadfce', 'opacity=".0"') + `<rect x="0" y="0" width="600" height="300" fill="#eef1f6"/>` + G(R(0, 0, 230, 320, '#fff', `${SH}`) + R(14, 14, 202, 292, '#0ea5e9', 'rx="2"') + `<circle cx="115" cy="110" r="66" fill="#fff" opacity=".22"/>` + tooth(115, 112, 4, '#fff') + T(115, 220, 22, '#fff', '6개월마다', 'text-anchor="middle" font-weight="700"') + T(115, 248, 22, '#fff', '정기검진', 'text-anchor="middle" font-weight="700"') + T(115, 284, 11, '#fff', NAME, 'text-anchor="middle" opacity=".9"'), tr(185, 50)) + R(292, 44, 28, 14, '#fde68a', 'opacity=".85" transform="rotate(-8 305 50)"') + R(80, 44, 28, 14, '#fde68a', 'opacity=".85" transform="rotate(8 94 50)" ');

// ---------- 약포/약봉투 ----------
const pill = (x, y, rot, c1, c2) => G(`<rect x="-16" y="-7" width="32" height="14" rx="7" fill="${c1}"/><rect x="0" y="-7" width="16" height="14" rx="7" fill="${c2}"/><rect x="-16" y="-7" width="32" height="5" rx="3" fill="#fff" opacity=".35"/>`, tr(x, y, rot));
const medEnv = () => G(R(0, 0, 300, 220, '#fff', `rx="5" ${SH}`) + `<path d="M0,0 L150,70 L300,0 Z" fill="#e8f3fc" stroke="#cbd5e1"/>` + R(0, 90, 300, 34, '#14b8a6') + tooth(32, 107, .7, '#fff') + T(52, 112, 15, '#fff', NAME + ' 처방약', 'font-weight="700"')
  + ['아침', '점심', '저녁', '취침전'].map((t, i) => `<rect x="${22 + i * 68}" y="142" width="12" height="12" fill="none" stroke="#14b8a6" stroke-width="1.6" rx="2"/>` + T(38 + i * 68, 153, 12, '#334155', t)).join('') + T(22, 184, 11, '#64748b', '성명 ____________  날짜 ________') + R(22, 196, 256, 2, '#cbd5e1'), tr(150, 100, -3)) + pill(150, 345, -20, '#f87171', '#fff') + pill(200, 352, 25, '#60a5fa', '#fff') + pill(110, 355, 10, '#fbbf24', '#fff');
const pouch = (x, y, w, h, fill, content, rot = 0, crimp = true) => G(R(0, 0, w, h, fill, `rx="3" ${SH}`) + (crimp ? [0, h - 18].map(yy => R(0, yy, w, 18, '#000', 'opacity=".06"') + [...Array(Math.floor(w / 6))].map((_, i) => `<line x1="${i * 6 + 3}" y1="${yy + 2}" x2="${i * 6 + 3}" y2="${yy + 16}" stroke="#000" stroke-opacity=".18"/>`).join('')).join('') : '') + content, tr(x, y, rot));
let PLAIN = false;
const brandPrint = (w, h, acc) => PLAIN ? '' : tooth(w / 2, h / 2 - 22, 1.5, acc) + T(w / 2, h / 2 + 22, 15, acc, NAME, 'text-anchor="middle" font-weight="700"') + T(w / 2, h / 2 + 40, 9, acc, 'Dental Clinic', 'text-anchor="middle" opacity=".8"');
const medPaper = () => pouch(120, 70, 170, 260, '#fdfbf5', brandPrint(170, 260, '#0d9488') + `<line x1="0" y1="130" x2="170" y2="130" stroke="#000" stroke-opacity=".08"/>`, -6, false) + pouch(260, 80, 170, 260, '#f3f9f7', brandPrint(170, 260, '#0d9488') + `<line x1="0" y1="130" x2="170" y2="130" stroke="#000" stroke-opacity=".08"/>`, 5, false);
const medFilm = () => pouch(150, 70, 170, 260, '#e9f6ff', `<rect x="8" y="8" width="154" height="244" fill="none" stroke="#9cc9e8" stroke-dasharray="3 3"/>` + `<polygon points="14,20 60,20 14,160" fill="#fff" opacity=".6"/>` + pill(60, 120, 30, '#f87171', '#fff') + pill(110, 150, -20, '#60a5fa', '#fff') + pill(80, 190, 60, '#fbbf24', '#fff') + R(0, 18, 170, 30, '#0ea5e9', 'opacity=".85"') + T(85, 38, 12, '#fff', NAME, 'text-anchor="middle" font-weight="700"'), -4)
  + pouch(300, 90, 160, 240, '#e9f6ff', `<polygon points="14,20 60,20 14,150" fill="#fff" opacity=".6"/>` + pill(70, 120, 10, '#34d399', '#fff') + pill(100, 170, -40, '#f87171', '#fff') + R(0, 18, 160, 28, '#14b8a6', 'opacity=".85"') + T(80, 37, 12, '#fff', NAME, 'text-anchor="middle" font-weight="700"'), 6);
const alu = double => pouch(145, 66, 175, 268, 'url(#foil)', brandPrint(175, 268, '#0f766e') + `<polygon points="0,18 40,18 0,200" fill="#fff" opacity=".35"/>`, -5)
  + pouch(300, 78, 175, 268, double ? '#0f766e' : 'url(#foil)', double ? brandPrint(175, 268, '#fff') + T(87, 70, 11, '#fff', '뒷면 인쇄', 'text-anchor="middle" opacity=".8"') : lines(30, 110, 115, 5, 16, '#7b8794') + `<polygon points="0,18 40,18 0,200" fill="#fff" opacity=".3"/>`, 6);
const spoon = (x, y, rot) => G(`<g ${SH2}><ellipse cx="0" cy="0" rx="46" ry="32" fill="#bfeee6" stroke="#2bb8a3" stroke-width="2"/><rect x="40" y="-9" width="190" height="18" rx="9" fill="#bfeee6" stroke="#2bb8a3" stroke-width="2"/></g><ellipse cx="-8" cy="-8" rx="26" ry="12" fill="#fff" opacity=".5"/>` + [1, 2, 3].map(i => `<line x1="${-30 + i * 12}" y1="-24" x2="${-30 + i * 12}" y2="${i === 2 ? -10 : -16}" stroke="#0d9488"/>`).join('') + T(120, 4, 9, '#0d9488', '5ml  10ml  15ml'), tr(x, y, rot));
const spoons = () => spoon(150, 170, -8) + spoon(170, 270, 6);

// ---------- 쇼핑백 ----------
const bag = (x, y, w, h, d, acc, handle = '#0f172a') => {
  const hh = 90;
  return `<path d="M${x + w * .3},${y + 8} C${x + w * .3},${y - hh} ${x + w * .7},${y - hh} ${x + w * .7},${y + 8}" fill="none" stroke="${handle}" stroke-width="5" stroke-linecap="round"/>`
    + `<polygon points="${x + w},${y} ${x + w + d},${y - d * .35} ${x + w + d},${y + h - d * .35} ${x + w},${y + h}" fill="${acc}" opacity=".7"/><polygon points="${x + w},${y} ${x + w + d},${y - d * .35} ${x + w + d},${y + h - d * .35} ${x + w},${y + h}" fill="#000" opacity=".18"/>`
    + `<g ${SH}>${R(x, y, w, h, acc, 'rx="2"')}</g>` + R(x, y, w, 26, '#fff', 'opacity=".16"') + tooth(x + w / 2, y + h * .34, w / 200 * 2.2, '#fff') + T(x + w / 2, y + h * .34 + 16 * (w / 200 * 2.2) + 34, Math.round(w / 12), '#fff', NAME, 'text-anchor="middle" font-weight="700"')
    + `<circle cx="${x + w * .3}" cy="${y + 8}" r="5" fill="#fff" stroke="#9ca3af"/><circle cx="${x + w * .7}" cy="${y + 8}" r="5" fill="#fff" stroke="#9ca3af"/>`;
};
const plasticBag = () => `<g ${SH}><path d="M170,120 L430,120 L450,370 L150,370 Z" fill="#fff" opacity=".92" stroke="#cbd5e1"/></g>` + `<path d="M230,120 L230,100 Q300,40 370,100 L370,120" fill="#fff" stroke="#cbd5e1"/>` + `<rect x="260" y="132" width="80" height="22" rx="11" fill="#eef3f9" stroke="#cbd5e1"/>`
  + tooth(300, 235, 2.2, '#0ea5e9') + T(300, 296, 22, '#0369a1', NAME, 'text-anchor="middle" font-weight="700"') + T(300, 318, 10, '#64748b', 'Dental Clinic', 'text-anchor="middle"') + `<path d="M190,160 Q260,190 200,260 M410,170 Q350,230 405,300" stroke="#e2e8f0" stroke-width="3" fill="none"/>`;

// ---------- 추가 형태 ----------
const caution = () => doc(150, 90, 200, 280, { rot: -5, band: false }) + doc(215, 70, 210, 290, {
  acc: '#f97316', title: '진료 후 주의사항',
  inner: [0, 1, 2, 3, 4].map(i => `<circle cx="24" cy="${60 + i * 40}" r="9" fill="#f97316"/>` + T(21, 64 + i * 40, 11, '#fff', '!', 'font-weight="700"') + R(42, 52 + i * 40, 150, 4, '#94a3b8', 'rx="2"') + R(42, 62 + i * 40, 120, 4, '#cbd5e1', 'rx="2"')).join(''),
});
const dieStickers = shape => {
  const cols = ['#0ea5e9', '#14b8a6', '#6366f1', '#f59e0b', '#ec4899'];
  let cells = '';
  if (shape === 'round') for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells += `<circle cx="${210 + c * 90}" cy="${150 + r * 90}" r="36" fill="${cols[(r * 3 + c) % 5]}" stroke="#fff" stroke-width="5"/>` + tooth(210 + c * 90, 146 + r * 90, 1.3, '#fff');
  else for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) cells += G(R(0, 0, 124, 38, cols[(r + c) % 5], 'rx="14" stroke="#fff" stroke-width="4"') + tooth(24, 19, .7, '#fff') + T(42, 24, 12, '#fff', NAME, 'font-weight="700"'), tr(172 + c * 140, 100 + r * 50));
  return R(150, 80, 300, 280, '#fff', `rx="6" ${SH}`) + R(150, 80, 300, 280, '#e8eef6', 'rx="6" opacity=".6"') + cells;
};
const zipBag = () => `<g ${SH}><rect x="190" y="100" width="220" height="290" rx="5" fill="#e6f2fb" fill-opacity=".75" stroke="#a9c6de" stroke-width="2"/></g>`
  + R(190, 135, 220, 14, '#fff', 'opacity=".55"') + [...Array(22)].map((_, i) => `<line x1="${196 + i * 10}" y1="136" x2="${196 + i * 10}" y2="148" stroke="#7aa7c9"/>`).join('')
  + `<polygon points="200,160 250,160 200,330" fill="#fff" opacity=".4"/>` + tooth(300, 235, 1.9, '#0ea5e9') + T(300, 292, 20, '#0369a1', NAME, 'text-anchor="middle" font-weight="700"') + T(300, 312, 10, '#64748b', '처방약 보관용', 'text-anchor="middle"')
  + pill(260, 352, 15, '#f87171', '#fff') + pill(310, 355, -20, '#60a5fa', '#fff') + pill(350, 350, 40, '#fbbf24', '#fff');
const packer = () => `<g ${SH}>` + R(140, 270, 320, 100, '#d9dee5', 'rx="12"') + R(165, 130, 270, 150, '#eef1f5', 'rx="14"') + `</g>`
  + `<circle cx="250" cy="205" r="52" fill="#94a3b8"/><circle cx="250" cy="205" r="34" fill="#e2e8f0"/><circle cx="250" cy="205" r="8" fill="#64748b"/>`
  + [...Array(6)].map((_, i) => `<circle cx="${250 + 43 * Math.cos(i * Math.PI / 3)}" cy="${205 + 43 * Math.sin(i * Math.PI / 3)}" r="5" fill="#fff" stroke="#94a3b8"/>`).join('')
  + R(340, 160, 70, 90, '#0d9488', 'rx="8"') + T(375, 200, 11, '#fff', '6포', 'text-anchor="middle" font-weight="700"') + R(350, 215, 50, 6, '#fff', 'opacity=".6" rx="3"')
  + R(455, 195, 70, 14, '#64748b', 'rx="7"') + `<circle cx="528" cy="202" r="14" fill="#334155"/>` + T(300, 345, 13, '#64748b', 'MANUAL PACKER', 'text-anchor="middle" font-weight="700"');
const slimBag = (w, h, milky) => {
  const x = 300 - w / 2, y = 90, f = milky ? '#f6f6f0' : '#e8f3fb';
  return `<g ${SH}><path d="M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h}Z" fill="${f}" fill-opacity="${milky ? .96 : .8}" stroke="#c4d4e2" stroke-width="2"/></g>`
    + `<rect x="${300 - w * .28}" y="${y + 18}" width="${w * .56}" height="26" rx="13" fill="${milky ? '#e5e5dc' : '#d4e6f4'}" stroke="#c4d4e2"/>`
    + `<polygon points="${x + 8},${y + 60} ${x + 50},${y + 60} ${x + 8},${y + h * .6}" fill="#fff" opacity="${milky ? .45 : .4}"/>`
    + tooth(300, y + h * .5, Math.min(2.4, w / 70), '#0ea5e9') + T(300, y + h * .5 + 54, Math.round(w / 8), '#0369a1', NAME, 'text-anchor="middle" font-weight="700"');
};
const rollBags = () => `<g ${SH}><rect x="170" y="290" width="260" height="90" rx="45" fill="#eaf4fb" stroke="#b6cfe3" stroke-width="2"/></g><ellipse cx="170" cy="335" rx="22" ry="45" fill="#d6e8f6" stroke="#b6cfe3" stroke-width="2"/><ellipse cx="170" cy="335" rx="8" ry="16" fill="#8fb1cc"/>`
  + [0, 1, 2].map(i => G(`<path d="M0,0 L100,0 L100,230 L0,230Z" fill="#f2f8fd" stroke="#c4d4e2" stroke-width="2"/><rect x="25" y="14" width="50" height="14" rx="7" fill="#d4e6f4"/>` + tooth(50, 100, 1.2, '#0ea5e9') + T(50, 138, 11, '#0369a1', NAME, 'text-anchor="middle" font-weight="700"'), tr(215 + i * 6 + i * 70, 70 - i * 4 + 10, i * 3 - 3))).join('');
const rollup = (acc, out) => R(190, 358, 220, 18, '#4b5563', 'rx="6"') + R(292, 338, 16, 22, '#374151') + (out ? `<ellipse cx="300" cy="372" rx="105" ry="12" fill="#2563eb" opacity=".5"/>` : '')
  + `<g ${SH}>` + R(215, 36, 170, 308, '#fff') + `</g>` + R(215, 36, 170, 130, acc) + `<circle cx="300" cy="100" r="46" fill="#fff" opacity=".2"/>` + tooth(300, 100, 2.4, '#fff')
  + T(300, 206, 21, '#111827', '6개월마다', 'text-anchor="middle" font-weight="700"') + T(300, 234, 21, acc, '정기검진', 'text-anchor="middle" font-weight="700"') + lines(240, 262, 120, 4, 14) + R(215, 312, 170, 32, acc) + T(300, 333, 12, '#fff', NAME + ' 02-0000-0000', 'text-anchor="middle"');
const bannerStand = () => R(170, 350, 260, 22, '#4b5563', 'rx="8"') + R(292, 80, 16, 270, '#9ca3af') + R(300 - 90, 76, 180, 12, '#6b7280', 'rx="4"') + R(300 - 90, 318, 180, 10, '#6b7280', 'rx="4"') + `<rect x="216" y="86" width="168" height="230" fill="#fff" opacity=".35" stroke="#9ca3af" stroke-dasharray="6 5"/>`;
const frameA4 = () => `<g ${SH}>` + R(160, 56, 280, 340, '#1f2937', 'rx="4"') + `</g>` + R(178, 74, 244, 304, '#fff') + R(192, 88, 216, 276, '#0ea5e9') + `<circle cx="300" cy="190" r="62" fill="#fff" opacity=".22"/>` + tooth(300, 192, 3.8, '#fff')
  + T(300, 290, 22, '#fff', '6개월마다', 'text-anchor="middle" font-weight="700"') + T(300, 318, 22, '#fff', '정기검진', 'text-anchor="middle" font-weight="700"') + `<polygon points="178,74 320,74 178,300" fill="#fff" opacity=".2"/>`;
const hangBanner = () => `<path d="M80,155 L120,95 M520,155 L480,95" stroke="#6b7280" stroke-width="3"/>` + R(70, 150, 460, 150, '#0ea5e9', `rx="3" ${SH}`) + R(70, 150, 460, 8, '#fff', 'opacity=".25"')
  + [[84, 164], [300, 164], [516, 164], [84, 286], [300, 286], [516, 286]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#e5e7eb" stroke="#6b7280"/>`).join('')
  + tooth(140, 225, 2.6, '#fff') + T(195, 222, 32, '#fff', '건강한 미소', 'font-weight="700"') + T(195, 256, 17, '#fff', NAME + ' · 02-0000-0000', 'opacity=".95"');
const withPlain = fn => { PLAIN = true; const s = fn(); PLAIN = false; return s; };

// ---------- 상품 매핑 [그림, 배경] ----------
const A = { blue: '#2563eb', sky: '#0ea5e9', teal: '#0d9488', slate: '#334155' };
const mono = s => s.replace(/#2563eb/g, '#475569').replace(/#1d4ed8/g, '#334155').replace(/#e0efff/g, 'none');
const items = {
  'chart-mono': [() => chart('#475569', false), 'gray'],
  'chart-color': [() => chart(A.blue, true), 'green'],
  'slip-color': [() => slip('#0d9488'), 'green'],
  consent: [() => consent(), 'sky'],
  caution: [() => caution(), 'peach'],
  'letter-paper': [() => letter(), 'sand'],
  'fold-mono': [() => mono(foldChart()), 'gray'],
  'fold-color': [() => foldChart(), 'sky'],

  'env-letter-mono': [() => env({ acc: A.slate }), 'gray'],
  'env-letter': [() => env({}), 'green'],
  'env-window-mono': [() => env({ win: true, acc: A.slate }), 'gray'],
  'env-window': [() => env({ win: true, acc: A.blue }), 'green'],
  'env-doc-mono': [() => docEnv({ c: '#fff', flap: '#e5e9ef', acc: A.slate }), 'gray'],
  'env-doc-color': [() => docEnv({ c: '#fff', flap: '#e0efff', acc: A.sky }), 'sky'],
  'env-9-mono': [() => G(docEnv({ c: '#fff', flap: '#e5e9ef', acc: A.slate }), 'transform="translate(50 36) scale(.88)"'), 'sand'],
  'env-9-color': [() => G(docEnv({ c: '#fff', flap: '#e0efff', acc: A.sky }), 'transform="translate(50 36) scale(.88)"'), 'mint'],
  'env-xray': [() => G(R(0, 0, 170, 210, '#0b1220', `rx="5" ${SH}`) + `<circle cx="85" cy="70" r="34" fill="none" stroke="#9fb4c9" stroke-width="2"/>` + tooth(85, 72, 1.5, '#cfe0f0') + lines(24, 130, 120, 4, 16, '#475569'), tr(170, 50, -8)) + docEnv({ c: '#d9b98a', flap: '#c9a56d', acc: '#3f2d14' }), 'sand'],
  'holder-paper-mono': [() => folder(160, 60, 280, 290, '#64748b'), 'gray'],
  'holder-paper-kraft': [() => folder(160, 60, 280, 290, '#c9a56d'), 'sand'],
  'holder-paper': [() => folder(160, 60, 280, 290, '#0ea5e9'), 'mint'],
  'holder-vinyl-l': [() => vinyl(190, 60, 230, 300, 'l'), 'sky'],
  'holder-vinyl-1': [() => vinyl(190, 60, 230, 300, '1'), 'mint'],
  'holder-vinyl-2': [() => vinyl2(), 'lav'],
  'holder-vinyl-idx': [() => vinyl2() + R(104, 62, 42, 14, '#f97316', 'rx="3"') + R(152, 62, 42, 14, '#10b981', 'rx="3"') + R(306, 62, 42, 14, '#6366f1', 'rx="3"') + R(354, 62, 42, 14, '#ec4899', 'rx="3"'), 'lav'],
  'tag-pvc': [() => tags('pvc'), 'gray'],
  'tag-acrylic': [() => tags('acrylic'), 'sky'],
  'tag-gold': [() => tags('gold'), 'beige'],
  'tag-silver': [() => tags('silver'), 'gray'],

  'card-std': [() => cards('std'), 'peach'],
  'card-armi': [() => cards('premium').replace(/#f4ecdc/g, '#f7f7f3').replace(/#b8901f/g, '#6b7280'), 'sand'],
  'card-premium': [() => cards('premium').replace(/#f4ecdc/g, '#e6edf6').replace(/#e9dfc8/g, '#b9cbe3'), 'sky'],
  'card-fold': [() => cards('fold'), 'mint'],
  'card-round': [() => cards('std').replace(/rx="5"/g, 'rx="22"'), 'pink'],
  'card-thick': [() => cards('thick'), 'lav'],
  'sticker-sq': [() => stickerSheet(), 'pink'],
  'sticker-rrect': [() => dieStickers('rrect'), 'peach'],
  'sticker-round': [() => dieStickers('round'), 'mint'],
  'flyer-a4': [() => flyer('#0ea5e9', '#0369a1', -5, 150, 60) + flyer('#14b8a6', '#0f766e', 5, 250, 55), 'sky'],
  'leaflet-3': [() => leaflet('#0ea5e9', '#0369a1'), 'mint'],
  'leaflet-3r': [() => leaflet('#0d9488', '#115e59'), 'green'],

  'med-env-mono': [() => medEnv().replace(/#14b8a6/g, '#64748b'), 'gray'],
  'med-env-comp': [() => medEnv().replace(/#14b8a6/g, '#0ea5e9'), 'sky'],
  'med-env': [() => medEnv(), 'mint'],
  zipper: [() => zipBag(), 'sky'],
  'med-paper-noru': [() => medPaper().replace(/#fdfbf5/g, '#e8d9b8').replace(/#f3f9f7/g, '#eadfc4'), 'sand'],
  'med-paper': [() => medPaper(), 'peach'],
  'med-film': [() => medFilm(), 'sky'],
  'med-paper-plain': [() => withPlain(() => medPaper().replace(/#fdfbf5/g, '#e8d9b8').replace(/#f3f9f7/g, '#eadfc4')), 'sand'],
  'alu-p-front': [() => alu(false), 'gray'],
  'alu-p-both': [() => alu(true), 'green'],
  'alu-p-plain': [() => withPlain(() => alu(false)), 'gray'],
  'alu-pal-front': [() => alu(false).replace(/#0f766e/g, '#1d4ed8'), 'sky'],
  'alu-pal-both': [() => alu(true).replace(/#0f766e/g, '#1d4ed8'), 'lav'],
  'alu-al-front': [() => alu(false).replace(/#0f766e/g, '#9d174d'), 'pink'],
  'med-spoon': [() => spoons(), 'mint'],
  packer: [() => G(packer(), 'transform="translate(-45 0)"'), 'sky'],

  'bag-land': [() => bag(130, 140, 300, 230, 70, '#0ea5e9'), 'pink'],
  'bag-port': [() => bag(170, 130, 210, 250, 60, '#0d9488'), 'sand'],
  'vbag-m': [() => slimBag(120, 280, false), 'sky'],
  'bag-plastic': [() => plasticBag(), 'sky'],
  'vbag-roll': [() => rollBags(), 'mint'],
  'vbag-milky': [() => slimBag(170, 270, true), 'lav'],

  'banner-in': [() => rollup('#0ea5e9', false), 'sky'],
  'banner-out': [() => rollup('#f97316', true), 'peach'],
  'banner-stand': [() => bannerStand(), 'gray'],
  'banner-mini': [() => R(80, 330, 440, 12, '#fff', 'opacity=".5" rx="6"') + G(rollup('#14b8a6', false), 'transform="translate(185 150) scale(.55)"'), 'mint'],
  poster: [() => poster(), 'lav'],
  'poster-board': [() => poster() + `<polygon points="415,50 427,56 427,372 415,372" fill="#e5e7eb"/>`, 'lav'],
  frame: [() => frameA4(), 'beige'],
  'hang-banner': [() => hangBanner(), 'sky'],
};
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));
for (const [id, [fn, bg]] of Object.entries(items)) fs.writeFileSync(path.join(OUT, id + '.svg'), render(fn(), BG[bg]));
console.log(Object.keys(items).length + '개 이미지 생성 →', OUT);

// ---------- 메인 롤링배너 (1200x300 투명 이미지: 배경 그라데이션은 사이트에서 깔아 어떤 화면 폭에서도 잘리지 않음) ----------
const BOUT = path.join(__dirname, '..', 'public', 'img', 'banners');
fs.mkdirSync(BOUT, { recursive: true });
const DEFS = render('', BG.sky).match(/<defs>[\s\S]*<\/defs>/)[0];
const place = (inner, x, y, s) => G(inner, `transform="translate(${x} ${y}) scale(${s})"`);
// 1200x400 (히어로 비율에 맞춤). 좌우 바깥 여백 약 96px: 글자는 x=96부터, 이미지는 x≈1104까지만 배치
const PADX = 96;
const banner = ({ tag, title1, title2, sub, cta, ctaColor, mock }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400">${DEFS}
<circle cx="830" cy="205" r="185" fill="#fff" opacity=".10"/><circle cx="1110" cy="60" r="90" fill="#fff" opacity=".08"/>
<rect x="${PADX}" y="92" width="${tag.length * 17 + 30}" height="32" rx="16" fill="#fff" opacity=".24"/>${T(PADX + 15, 114, 16, '#fff', tag, 'font-weight="700"')}
${T(PADX, 186, 44, '#fff', title1, 'font-weight="700"')}${T(PADX, 240, 44, '#fff', title2, 'font-weight="700"')}
${T(PADX, 280, 17, '#fff', sub, 'opacity=".95"')}
<rect x="${PADX}" y="306" width="224" height="46" rx="23" fill="#fff"/>${T(PADX + 112, 335, 16, ctaColor, cta, 'text-anchor="middle" font-weight="700"')}
${G(place(mock, -61, 34, .74), 'transform="translate(60 78) scale(.87)"')}</svg>`;
const banners = {
  'banner-dental': banner({
    tag: '치과인쇄', title1: '치과 인쇄물,', title2: '한 곳에서 끝내세요', sub: '진료차트 · 명함 · 약포지 · 쇼핑백 · 배너 맞춤제작', cta: '치과인쇄 보러가기 →', ctaColor: '#1d4ed8',
    mock: place(chart('#2563eb', true), 860, -20, .66) + place(cards('std'), 1090, 40, .62) + place(alu(true), 1330, -6, .6) + place(bag(130, 140, 300, 230, 70, '#0ea5e9'), 1450, 10, .5),
  }),
  'banner-commercial': banner({
    tag: '상업인쇄', title1: '상업인쇄 대량주문,', title2: '합리적인 가격으로', sub: '명함 · 전단 · 스티커 · 봉투 · 리플렛 · 고급인쇄', cta: '상업인쇄 보러가기 →', ctaColor: '#7c3aed',
    mock: place(cards('premium'), 850, 10, .6) + place(flyer('#0ea5e9', '#0369a1', -5, 150, 60) + flyer('#14b8a6', '#0f766e', 5, 250, 55), 1040, -10, .62) + place(stickerSheet(), 1290, 0, .62) + place(leaflet('#0ea5e9', '#0369a1'), 1380, 60, .48),
  }),
  'banner-sale': banner({
    tag: '특가 이벤트', title1: '최대 31% 할인', title2: '치과 인쇄물 특가전', sub: '진료차트 · 접수증 · 레터지 · 전단지 기획전', cta: '상품 보러가기 →', ctaColor: '#ea580c',
    mock: place(chart('#475569', false), 860, -20, .66) + place(slip('#0d9488'), 1100, 20, .6) + place(letter(), 1330, -10, .56)
      + `<circle cx="1545" cy="70" r="62" fill="#e11d48" ${SH}/>` + T(1545, 70, 34, '#fff', '31%', 'text-anchor="middle" font-weight="800"') + T(1545, 98, 20, '#fff', 'OFF', 'text-anchor="middle" font-weight="700"'),
  }),
  'banner-alu': banner({
    tag: '신상품 입고', title1: '알루미늄 · 투명 약포지', title2: '신상 입고', sub: '치과 처방 포장 전문, 소량도 OK', cta: '상품 보러가기 →', ctaColor: '#0f766e',
    mock: place(alu(true), 850, -6, .62) + place(medFilm(), 1130, 0, .6) + place(medEnv(), 1400, 40, .5),
  }),
  'banner-bag': banner({
    tag: '성수기 예약', title1: '쇼핑백 제작', title2: '겨울 성수기 예약', sub: '납기 확인 후 미리 주문하세요', cta: '상품 보러가기 →', ctaColor: '#9333ea',
    mock: place(bag(130, 140, 300, 230, 70, '#0ea5e9'), 850, 0, .55) + place(bag(170, 130, 210, 250, 60, '#0d9488'), 1130, 0, .55) + place(plasticBag(), 1330, 20, .55),
  }),
};
for (const [id, svg] of Object.entries(banners)) fs.writeFileSync(path.join(BOUT, id + '.svg'), svg);
console.log(Object.keys(banners).length + '개 배너 생성 →', BOUT);
