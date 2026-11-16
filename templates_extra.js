// 추가 템플릿: 그라데이션·그림자·둥근 카드·타이포 중심의 세련된 디자인 (트렌디 스타일 컬렉션)
let _n = 1000;
const uid = () => 'x' + (++_n);
const T = (x, y, text, size, fill, o = {}) => ({ id: uid(), type: 'text', x, y, text, size, fill, weight: o.weight || 400, family: o.family || 'Malgun Gothic', align: o.align || 'left', lh: o.lh || 1.3, ls: o.ls || 0, opacity: o.opacity ?? 1 });
const shapeFx = o => ({ ...(o.grad ? { grad: { a: o.grad[0], b: o.grad[1], ang: o.grad[2] ?? 45 } } : {}), ...(o.shadow ? { shadow: true } : {}), ...(o.rot ? { rot: o.rot } : {}) });
const R = (x, y, w, h, fill, o = {}) => ({ id: uid(), type: 'rect', x, y, w, h, fill, stroke: o.stroke || 'none', sw: o.sw || 0, rx: o.rx || 0, opacity: o.opacity ?? 1, ...shapeFx(o) });
const E = (x, y, w, h, fill, o = {}) => ({ id: uid(), type: 'ellipse', x, y, w, h, fill, stroke: o.stroke || 'none', sw: o.sw || 0, opacity: o.opacity ?? 1, ...shapeFx(o) });
const I = (x, y, w, h, fill, o = {}) => ({ id: uid(), type: 'icon', shape: 'tooth', x, y, w, h, fill, opacity: o.opacity ?? 1, ...(o.rot ? { rot: o.rot } : {}) });

const CARD_P = ['card-std', 'card-armi', 'card-premium', 'card-fold', 'card-round', 'card-thick'];
const FLYER_P = ['flyer-a4', 'poster', 'poster-board', 'frame'];
const ENV_P = ['env-letter', 'env-letter-mono', 'env-window', 'env-window-mono'];
const ROLL_P = ['banner-in', 'banner-out', 'banner-mini'];
const tpl = (id, name, category, w, h, mm, products, bg, elements, tags = []) => ({ id, name, category, w, h, mm, products, bg, elements, tags: ['NEW', ...tags], active: true });
const out = [];
const W = 1240, H = 1754;

// ---------- 공통 조각 ----------
const logoRow = (x, y, c, nameC, name = '미소치과', sub = 'DENTAL CLINIC', fam = 'Malgun Gothic', sz = 50) =>
  [I(x, y, 64, 56, c), T(x + 84, y - 4, name, sz, nameC, { weight: 800, family: fam }), T(x + 86, y + sz + 2, sub, 20, nameC, { opacity: .55, ls: 5 })];
const contact = (x, y, c, sub, sz = 26, gap = 42) => [T(x, y, 'T   02-0000-0000', sz, c), T(x, y + gap, 'E   info@dental.kr', sz, c), T(x, y + gap * 2, 'A   서울특별시 ○○구 ○○로 123, 4층', sz, sub)];

// =====================================================================
// 명함 (1080x600 = 90x50mm)
// =====================================================================
out.push(tpl('card-sage-line', '명함 · 세이지 라인', '명함', 1080, 600, '90×50mm', CARD_P, '#f4f1ea', [
  R(40, 40, 1000, 520, 'none', { stroke: '#6b8f71', sw: 2, rx: 28 }), ...logoRow(100, 100, '#6b8f71', '#2f3e36', '미소치과', 'DENTAL CLINIC', 'Batang'),
  R(100, 262, 56, 4, '#6b8f71'), T(100, 292, '김 미 소', 58, '#2f3e36', { weight: 800, ls: 8, family: 'Batang' }), T(100, 368, '대표원장 · 치의학박사', 26, '#6b8f71', { weight: 700 }), ...contact(100, 424, '#2f3e36', '#6b8f71', 24, 38),
], ['앞면', '미니멀']));
out.push(tpl('card-ocean-back', '명함 · 오션 그라데이션 (뒷면)', '명함', 1080, 600, '90×50mm', CARD_P, '#0ea5e9', [
  R(0, 0, 1080, 600, '#0ea5e9', { grad: ['#0ea5e9', '#6366f1', 45] }), E(640, -200, 640, 640, '#ffffff', { opacity: .1 }), E(-120, 330, 520, 520, '#ffffff', { opacity: .08 }), E(760, 360, 260, 260, 'none', { stroke: '#ffffff', sw: 3, opacity: .35 }),
  I(450, 150, 180, 158, '#ffffff'), T(540, 345, 'SMILE DENTAL', 56, '#ffffff', { align: 'center', weight: 800, ls: 10 }), T(540, 425, '미소치과', 30, '#ffffff', { align: 'center', opacity: .85, ls: 8 }),
], ['뒷면', '그라데이션']));
out.push(tpl('card-ocean-front', '명함 · 오션 그라데이션 (앞면)', '명함', 1080, 600, '90×50mm', CARD_P, '#ffffff', [
  R(0, 0, 1080, 16, '#0ea5e9', { grad: ['#0ea5e9', '#6366f1', 0] }), E(790, 250, 520, 520, '#6366f1', { opacity: .08 }), E(880, -140, 360, 360, '#0ea5e9', { opacity: .1 }),
  ...logoRow(90, 84, '#0ea5e9', '#1e293b'), T(90, 262, '김 미 소', 58, '#0f172a', { weight: 800, ls: 6 }), T(90, 338, 'DIRECTOR · 대표원장', 24, '#6366f1', { weight: 700, ls: 3 }), ...contact(90, 414, '#334155', '#64748b', 24, 40),
], ['앞면', '그라데이션']));
out.push(tpl('card-blush-round', '명함 · 블러쉬 라운드', '명함', 1080, 600, '90×50mm', CARD_P, '#fdf0ee', [
  E(640, -210, 700, 700, '#e8a598', { opacity: .35 }), E(820, 330, 420, 420, '#f4c7bf', { opacity: .55 }), E(700, 90, 90, 90, '#ffffff', { opacity: .7 }),
  ...logoRow(90, 90, '#d4806f', '#5b3a36', '미소치과', 'DENTAL CLINIC', 'Batang'), T(90, 262, '김 미 소', 58, '#5b3a36', { weight: 800, ls: 8, family: 'Batang' }), T(90, 338, '대표원장', 26, '#d4806f', { weight: 700, ls: 4 }), ...contact(90, 410, '#5b3a36', '#a1685d', 24, 40),
], ['앞면', '파스텔']));
out.push(tpl('card-retro', '명함 · 레트로 크림', '명함', 1080, 600, '90×50mm', CARD_P, '#f6ecd9', [
  R(30, 30, 1020, 540, 'none', { stroke: '#d94f30', sw: 6, rx: 10 }), R(48, 48, 984, 504, 'none', { stroke: '#2a6f6b', sw: 2, rx: 6 }),
  I(90, 90, 70, 62, '#d94f30'), T(180, 86, '미소치과', 58, '#2a6f6b', { weight: 800, family: 'Batang' }), T(184, 152, 'SINCE 2025 · DENTAL CLINIC', 20, '#d94f30', { ls: 4, weight: 700 }),
  T(90, 250, '김 미 소', 60, '#2b2b2b', { weight: 800, ls: 8, family: 'Batang' }), T(90, 328, '대표원장 · 치의학박사', 26, '#6b5a42'), R(48, 452, 984, 100, '#d94f30', { rx: 0 }),
  T(90, 478, 'T 02-0000-0000   |   info@dental.kr', 28, '#f6ecd9', { weight: 700 }), T(90, 518, '서울특별시 ○○구 ○○로 123, 4층', 22, '#f6ecd9', { opacity: .85 }),
], ['앞면', '레트로']));
out.push(tpl('card-luxe-black', '명함 · 럭셔리 블랙 골드', '명함', 1080, 600, '90×50mm', CARD_P, '#0b0b0f', [
  R(60, 60, 960, 480, 'none', { stroke: '#c9a24a', sw: 2 }), R(78, 78, 924, 444, 'none', { stroke: '#c9a24a', sw: 1, opacity: .5 }), I(480, 112, 120, 105, '#c9a24a'),
  T(540, 246, 'MISO DENTAL', 54, '#c9a24a', { align: 'center', family: 'Georgia', ls: 10, weight: 700 }), R(500, 326, 80, 2, '#c9a24a'), T(540, 356, '김 미 소   |   대표원장', 30, '#e7e1d3', { align: 'center', ls: 4 }),
  T(540, 424, 'T 02-0000-0000     E info@dental.kr', 24, '#a8a291', { align: 'center' }), T(540, 466, '서울특별시 ○○구 ○○로 123, 4층', 22, '#a8a291', { align: 'center' }),
], ['앞면', '고급']));
out.push(tpl('card-lilac-bubble', '명함 · 라일락 버블', '명함', 1080, 600, '90×50mm', CARD_P, '#f3e8ff', [
  E(-90, -90, 380, 380, '#c084fc', { opacity: .35 }), E(860, 380, 320, 320, '#a855f7', { opacity: .25 }), E(720, 60, 120, 120, '#ffffff', { opacity: .75 }), E(640, 450, 60, 60, '#ffffff', { opacity: .6 }),
  ...logoRow(90, 100, '#a855f7', '#4c1d95'), T(90, 272, '김 미 소', 58, '#3b1470', { weight: 800, ls: 6 }), T(90, 348, 'DIRECTOR', 24, '#a855f7', { weight: 700, ls: 6 }), ...contact(90, 418, '#3b1470', '#7e5aa8', 24, 38),
], ['앞면', '파스텔']));
out.push(tpl('card-reservation', '진료 예약카드', '명함', 1080, 600, '90×50mm', CARD_P, '#ffffff', [
  R(0, 0, 1080, 130, '#0d9488', { grad: ['#0d9488', '#06b6d4', 0] }), T(60, 36, '진료 예약 카드', 50, '#ffffff', { weight: 800, ls: 2 }), I(960, 38, 62, 54, '#ffffff'),
  T(60, 178, '성   명', 30, '#475569', { weight: 700 }), R(200, 216, 420, 2, '#cbd5e1'), T(660, 178, '담당의', 30, '#475569', { weight: 700 }), R(790, 216, 230, 2, '#cbd5e1'),
  T(60, 270, '예약일', 30, '#475569', { weight: 700 }), R(200, 308, 250, 2, '#cbd5e1'), T(490, 270, '시   간', 30, '#475569', { weight: 700 }), R(620, 308, 220, 2, '#cbd5e1'),
  R(60, 380, 960, 110, '#f0fdfa', { rx: 20 }), T(90, 404, '※ 예약 변경은 하루 전까지 연락 주세요.\n   T 02-0000-0000  |  미소치과', 26, '#0f766e', { lh: 1.5, weight: 600 }), T(540, 530, '건강한 미소를 함께 만들어 가겠습니다', 24, '#94a3b8', { align: 'center' }),
], ['예약', '카드']));

// =====================================================================
// 전단 / 포스터 (A4 1240x1754)
// =====================================================================
out.push(tpl('poster-scaling-pastel', '포스터 · 스케일링 이벤트 (파스텔)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#fff4ec', [
  E(560, -320, 1000, 1000, '#ffd9c2'), E(-280, 1180, 900, 900, '#ffe7d8'), E(880, 1250, 520, 520, '#ffd0b0', { opacity: .6 }),
  R(100, 150, 380, 68, '#fb7a3a', { rx: 34 }), T(290, 168, 'SCALING EVENT', 30, '#ffffff', { align: 'center', weight: 800, ls: 6 }),
  T(100, 270, '치아 건강의 시작,', 66, '#7a3a1c', { weight: 700, family: 'Batang' }), T(96, 356, '스케일링', 210, '#fb7a3a', { weight: 800, family: 'Batang' }), T(104, 610, '1년에 한 번, 건강한 잇몸을 위한 정기 스케일링', 40, '#7a3a1c'),
  R(100, 760, 1040, 530, '#ffffff', { rx: 40, shadow: true }), T(160, 820, '이벤트 안내', 34, '#fb7a3a', { weight: 800, ls: 4 }), R(160, 876, 80, 5, '#fb7a3a'),
  ...[['기 간', '0000. 00. 00  ~  00. 00'], ['대 상', '내원 환자 누구나'], ['혜 택', '스케일링 00% 할인']].flatMap(([a, b], i) => [T(160, 930 + i * 114, a, 34, '#9a6b52', { weight: 700 }), T(360, 922 + i * 114, b, 46, '#2b1a12', { weight: 700 }), R(160, 1004 + i * 114, 920, 2, '#f1d9cb')]),
  I(100, 1490, 66, 58, '#fb7a3a'), T(194, 1486, '미소치과', 60, '#7a3a1c', { weight: 800, family: 'Batang' }), T(196, 1562, '진료문의  02-0000-0000   |   서울특별시 ○○구 ○○로 123', 32, '#9a6b52'),
], ['스케일링', '이벤트', '파스텔']));
out.push(tpl('poster-whitening-gradient', '포스터 · 치아 미백 (그라데이션)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#7c3aed', [
  R(0, 0, W, H, '#7c3aed', { grad: ['#7c3aed', '#06b6d4', 70] }), E(-300, -300, 900, 900, '#ffffff', { opacity: .08 }), E(700, 900, 800, 800, '#ffffff', { opacity: .07 }), E(300, 420, 640, 640, 'none', { stroke: '#ffffff', sw: 3, opacity: .5 }), E(380, 500, 480, 480, '#ffffff', { opacity: .12 }),
  T(W / 2, 150, 'TEETH WHITENING', 74, '#ffffff', { align: 'center', weight: 800, ls: 12 }), R(520, 252, 200, 4, '#ffffff', { opacity: .7 }), T(W / 2, 292, '눈부신 미소를 위한 치아 미백', 56, '#ffffff', { align: 'center', weight: 700 }),
  I(470, 580, 300, 264, '#ffffff'), ...[0, 1, 2].flatMap(i => [R(110 + i * 350, 1150, 320, 120, '#ffffff', { rx: 60, opacity: .16, stroke: '#ffffff', sw: 2 }), T(270 + i * 350, 1186, ['전문가 상담', '안전한 시술', '맞춤 관리'][i], 40, '#ffffff', { align: 'center', weight: 700 })]),
  T(W / 2, 1370, '지금 예약하고 특별 혜택을 받아보세요', 46, '#ffffff', { align: 'center' }), R(300, 1470, 640, 110, '#ffffff', { rx: 55, shadow: true }), T(W / 2, 1498, '02-0000-0000', 60, '#7c3aed', { align: 'center', weight: 800, ls: 4 }),
  T(W / 2, 1650, '미소치과 · 서울특별시 ○○구 ○○로 123', 32, '#ffffff', { align: 'center', opacity: .85 }),
], ['미백', '그라데이션']));
out.push(tpl('poster-ortho-clean', '포스터 · 투명교정 상담 (클린)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#ffffff', [
  R(0, 0, W, 820, '#e8eef7'), I(540, 250, 160, 141, '#c7d2e4'), T(W / 2, 430, '이미지를 추가해 주세요', 40, '#94a3b8', { align: 'center' }),
  R(100, 690, 1040, 500, '#ffffff', { rx: 44, shadow: true }), T(160, 752, 'INVISIBLE ORTHODONTICS', 30, '#2563eb', { weight: 800, ls: 6 }), T(160, 806, '투명교정 무료 상담', 94, '#0f172a', { weight: 800 }),
  T(160, 936, '보이지 않게, 부담 없이.\n나에게 맞는 교정 계획을 세워 드립니다.', 40, '#475569', { lh: 1.6 }),
  ...[0, 1, 2].flatMap(i => [E(110, 1290 + i * 112, 60, 60, '#2563eb'), E(128, 1308 + i * 112, 24, 24, '#ffffff'), T(206, 1296 + i * 112, ['3D 스캔 정밀 진단', '투명 장치로 자연스러운 교정', '치료 기간 · 비용 사전 안내'][i], 46, '#0f172a', { weight: 700 })]),
  R(0, 1654, W, 100, '#2563eb', { grad: ['#2563eb', '#4f46e5', 0] }), T(W / 2, 1684, '상담예약  02-0000-0000   ·   미소치과', 40, '#ffffff', { align: 'center', weight: 700 }),
], ['교정', '클린']));
out.push(tpl('poster-implant-luxe', '포스터 · 임플란트 프리미엄 (럭셔리)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#0b0b0f', [
  R(70, 70, W - 140, H - 140, 'none', { stroke: '#c9a24a', sw: 2 }), R(92, 92, W - 184, H - 184, 'none', { stroke: '#c9a24a', sw: 1, opacity: .5 }), I(540, 190, 160, 141, '#c9a24a'),
  T(W / 2, 400, 'IMPLANT', 150, '#c9a24a', { align: 'center', family: 'Georgia', weight: 700, ls: 16 }), T(W / 2, 590, '임플란트 프리미엄 상담', 64, '#f3eee0', { align: 'center', family: 'Batang', weight: 700 }), R(560, 704, 120, 2, '#c9a24a'),
  T(W / 2, 744, '정밀한 진단과 섬세한 시술\n오래도록 편안한 치아를 약속드립니다', 42, '#bdb7a6', { align: 'center', lh: 1.8, family: 'Batang' }),
  ...[0, 1, 2].flatMap(i => [T(250 + i * 370, 1040, '0' + (i + 1), 92, '#c9a24a', { align: 'center', family: 'Georgia' }), R(200 + i * 370, 1190, 100, 2, '#c9a24a', { opacity: .6 }), T(250 + i * 370, 1222, ['3D CT 정밀진단', '맞춤 수술 가이드', '평생 사후관리'][i], 36, '#f3eee0', { align: 'center', weight: 600 })]),
  T(W / 2, 1480, 'RESERVATION', 34, '#c9a24a', { align: 'center', ls: 10, family: 'Georgia' }), T(W / 2, 1540, '02-0000-0000', 74, '#f3eee0', { align: 'center', family: 'Georgia', weight: 700, ls: 4 }), T(W / 2, 1650, '미소치과 · 서울특별시 ○○구 ○○로 123', 30, '#8d8777', { align: 'center' }),
], ['임플란트', '고급']));
out.push(tpl('poster-kids-playful', '포스터 · 어린이 치과 (컬러풀)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#fff7d6', [
  E(-120, -120, 500, 500, '#ffd23f'), E(900, 120, 420, 420, '#ff6b6b', { opacity: .9 }), E(780, 1250, 600, 600, '#4dabf7', { opacity: .85 }), E(-160, 1150, 520, 520, '#69db7c', { opacity: .9 }),
  T(W / 2, 140, '어린이 치과', 150, '#1f2937', { align: 'center', weight: 800 }), T(W / 2, 330, '우리 아이 첫 치과, 즐겁게!', 52, '#1f2937', { align: 'center', weight: 700 }),
  E(350, 430, 540, 540, '#ffffff', { shadow: true }), I(450, 520, 340, 299, '#fff1b8'), E(530, 600, 38, 56, '#1f2937'), E(670, 600, 38, 56, '#1f2937'), R(570, 700, 100, 30, '#ff6b6b', { rx: 15 }), E(490, 672, 56, 34, '#ffa8a8', { opacity: .85 }), E(694, 672, 56, 34, '#ffa8a8', { opacity: .85 }),
  R(160, 1060, 920, 130, '#ff6b6b', { rx: 28, shadow: true }), T(W / 2, 1096, '불소 도포 · 실란트 · 충치 예방', 56, '#ffffff', { align: 'center', weight: 800 }),
  T(W / 2, 1300, '소아 전문 진료 · 겁 많은 아이도 편안하게', 44, '#1f2937', { align: 'center', weight: 700 }), T(W / 2, 1590, '미소치과  02-0000-0000', 62, '#1f2937', { align: 'center', weight: 800 }),
], ['어린이', '소아']));
out.push(tpl('poster-open-retro', '포스터 · 개원 안내 (레트로)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#f6ecd9', [
  R(0, 0, W, 40, '#d94f30'), R(0, 50, W, 12, '#2a6f6b'), R(0, H - 62, W, 12, '#2a6f6b'), R(0, H - 40, W, 40, '#d94f30'),
  E(220, 140, 800, 800, '#e9d7b3'), E(320, 240, 600, 600, '#d94f30'), E(420, 340, 400, 400, '#f6ecd9'), E(500, 420, 240, 240, '#2a6f6b'), I(555, 470, 130, 114, '#f6ecd9'),
  T(W / 2, 1000, 'GRAND OPEN', 112, '#d94f30', { align: 'center', family: 'Georgia', weight: 800, ls: 8 }), T(W / 2, 1140, '미소치과 개원', 92, '#2a6f6b', { align: 'center', family: 'Batang', weight: 800 }), R(420, 1270, 400, 4, '#2a6f6b'),
  T(W / 2, 1310, '0000년 0월 0일 개원  ·  개원 기념 혜택 안내', 40, '#6b5a42', { align: 'center' }), T(W / 2, 1590, 'T 02-0000-0000   |   서울특별시 ○○구 ○○로 123, 4층', 34, '#6b5a42', { align: 'center' }),
], ['개원', '레트로']));
out.push(tpl('poster-services-grid', '포스터 · 진료과목 안내 (카드 그리드)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#f8fafc', [
  T(100, 120, 'OUR SERVICES', 34, '#0d9488', { weight: 800, ls: 8 }), T(100, 176, '미소치과 진료 안내', 100, '#0f172a', { weight: 800 }),
  ...[['스케일링', '정기 검진과 함께\n잇몸 건강을 지켜요', '#e0f2fe', '#0284c7'], ['임플란트', '정밀 진단 기반\n자연스러운 치아 회복', '#fce7f3', '#db2777'], ['치아교정', '투명교정부터\n전통 교정까지', '#ede9fe', '#7c3aed'], ['충치치료', '아프지 않게\n꼼꼼하게 치료해요', '#fef3c7', '#d97706'], ['치아미백', '밝고 건강한\n미소를 되찾아요', '#dcfce7', '#16a34a'], ['잇몸치료', '초기 관리가\n가장 중요해요', '#ffedd5', '#ea580c']]
    .flatMap(([n, d, bg, ac], k) => { const c = k % 2, r = Math.floor(k / 2), x = 100 + c * 530, y = 400 + r * 370; return [R(x, y, 510, 340, bg, { rx: 36 }), E(x + 380, y + 190, 100, 100, ac, { opacity: .22 }), T(x + 40, y + 36, '0' + (k + 1), 28, ac, { weight: 800, ls: 3 }), T(x + 40, y + 92, n, 58, '#0f172a', { weight: 800 }), T(x + 40, y + 190, d, 30, '#475569', { lh: 1.5 })]; }),
  R(0, 1654, W, 100, '#0f172a'), T(W / 2, 1684, '진료문의  02-0000-0000', 40, '#ffffff', { align: 'center', weight: 700 }),
], ['진료안내', '카드']));
out.push(tpl('poster-doctor-profile', '포스터 · 의료진 소개', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#eef6ff', [
  E(600, -240, 900, 900, '#cfe3ff'), E(-200, 1300, 700, 700, '#dbeafe'), E(110, 200, 520, 520, '#ffffff', { shadow: true }), E(135, 225, 470, 470, '#dbeafe'), I(300, 370, 140, 123, '#93c5fd'), T(370, 520, '사진', 40, '#93c5fd', { align: 'center' }),
  T(700, 230, 'DIRECTOR', 28, '#2563eb', { weight: 800, ls: 8 }), T(700, 282, '김미소', 124, '#0f172a', { weight: 800 }), T(704, 440, '대표원장 · 치의학박사', 44, '#475569'), R(704, 530, 100, 5, '#2563eb'),
  ...[0, 1, 2, 3, 4].flatMap(i => [E(110, 830 + i * 110, 26, 26, '#2563eb'), T(166, 812 + i * 110, ['○○대학교 치의학과 졸업', '○○대학교 치과대학원 박사', '○○병원 치과 전문의 수료', '대한○○학회 정회원', '現 미소치과 대표원장'][i], 46, '#0f172a', { weight: 600 })]),
  R(0, 1554, W, 200, '#2563eb', { grad: ['#2563eb', '#4f46e5', 0] }), T(W / 2, 1612, '미소치과  ·  02-0000-0000', 64, '#ffffff', { align: 'center', weight: 800 }),
], ['의료진', '프로필']));

// =====================================================================
// 봉투 (1320x630 = 220x105mm)
// =====================================================================
out.push(tpl('env-gradient', '봉투 · 그라데이션 포인트', '봉투', 1320, 630, '220×105mm', ENV_P, '#ffffff', [
  R(0, 0, 36, 630, '#0ea5e9', { grad: ['#0ea5e9', '#6366f1', 90] }), I(100, 70, 68, 60, '#0ea5e9'), T(190, 64, '미소치과', 52, '#1e293b', { weight: 800 }), T(192, 128, 'DENTAL CLINIC', 22, '#6366f1', { ls: 5, weight: 700 }),
  R(100, 190, 50, 4, '#0ea5e9', { grad: ['#0ea5e9', '#6366f1', 0] }), T(100, 214, '서울특별시 ○○구 ○○로 123, 4층\nT 02-0000-0000  |  www.dental.kr', 26, '#64748b', { lh: 1.7 }), E(1000, 330, 520, 520, '#6366f1', { opacity: .06 }),
], ['봉투', '그라데이션']));
out.push(tpl('env-sage', '봉투 · 세이지 심플', '봉투', 1320, 630, '220×105mm', ENV_P, '#f4f1ea', [
  R(40, 40, 1240, 550, 'none', { stroke: '#6b8f71', sw: 2, rx: 24 }), I(100, 90, 62, 54, '#6b8f71'), T(184, 86, '미소치과', 50, '#2f3e36', { weight: 800, family: 'Batang' }), T(186, 146, 'DENTAL CLINIC', 20, '#6b8f71', { ls: 5 }),
  T(100, 440, '서울특별시 ○○구 ○○로 123, 4층\nT 02-0000-0000  |  www.dental.kr', 24, '#6b8f71', { lh: 1.7 }),
], ['봉투', '미니멀']));

// =====================================================================
// 스티커 (720x720 = 60x60mm)
// =====================================================================
out.push(tpl('sticker-ring-sage', '스티커 · 세이지 링', '스티커', 720, 720, '60×60mm', ['sticker-sq'], '#f4f1ea', [
  E(40, 40, 640, 640, '#6b8f71'), E(72, 72, 576, 576, 'none', { stroke: '#f4f1ea', sw: 4 }), I(290, 170, 140, 123, '#f4f1ea'), T(360, 330, '미소치과', 86, '#f4f1ea', { align: 'center', weight: 800, family: 'Batang' }), R(300, 452, 120, 3, '#f4f1ea', { opacity: .7 }), T(360, 482, 'DENTAL CLINIC', 30, '#f4f1ea', { align: 'center', ls: 8, opacity: .85 }),
], ['스티커', '링']));
out.push(tpl('sticker-gradient-smile', '스티커 · 그라데이션 스마일', '스티커', 720, 720, '60×60mm', ['sticker-sq'], '#ffffff', [
  R(30, 30, 660, 660, '#0ea5e9', { rx: 150, grad: ['#0ea5e9', '#6366f1', 45] }), E(380, -100, 460, 460, '#ffffff', { opacity: .1 }), I(280, 150, 160, 141, '#ffffff'), T(360, 330, 'SMILE', 130, '#ffffff', { align: 'center', weight: 800, ls: 6 }), T(360, 500, '오늘도 활짝 웃어요', 38, '#ffffff', { align: 'center', opacity: .9 }), T(360, 570, '미소치과', 44, '#ffffff', { align: 'center', weight: 800 }),
], ['스티커', '그라데이션']));
out.push(tpl('sticker-retro-badge', '스티커 · 레트로 배지', '스티커', 720, 720, '60×60mm', ['sticker-sq'], '#f6ecd9', [
  E(40, 40, 640, 640, '#d94f30'), E(80, 80, 560, 560, '#f6ecd9'), E(110, 110, 500, 500, 'none', { stroke: '#2a6f6b', sw: 6 }), I(300, 190, 120, 106, '#2a6f6b'),
  T(360, 320, 'SMILE', 96, '#d94f30', { align: 'center', family: 'Georgia', weight: 800, ls: 6 }), T(360, 450, 'DENTAL CLINIC', 30, '#2a6f6b', { align: 'center', ls: 6, weight: 700 }), T(360, 510, '미소치과', 46, '#2a6f6b', { align: 'center', family: 'Batang', weight: 800 }),
], ['스티커', '레트로']));

// =====================================================================
// 롤업배너 (600x1800) / 현수막 (1500x450)
// =====================================================================
out.push(tpl('banner-roll-gradient', '롤업배너 · 정기검진 (그라데이션)', '배너/현수막', 600, 1800, '600×1800mm', ROLL_P, '#6366f1', [
  R(0, 0, 600, 1800, '#0ea5e9', { grad: ['#0ea5e9', '#6366f1', 70] }), E(-160, -120, 560, 560, '#ffffff', { opacity: .1 }), E(300, 1050, 500, 500, '#ffffff', { opacity: .08 }), E(130, 240, 340, 340, 'none', { stroke: '#ffffff', sw: 3, opacity: .45 }),
  I(210, 330, 180, 159, '#ffffff'), T(300, 640, '6개월마다', 90, '#ffffff', { align: 'center', weight: 800 }), T(300, 750, '정기검진', 104, '#ffffff', { align: 'center', weight: 800 }), R(220, 900, 160, 5, '#ffffff', { opacity: .7 }),
  ...[0, 1, 2].flatMap(i => [R(70, 970 + i * 130, 460, 100, '#ffffff', { rx: 50, opacity: .16, stroke: '#ffffff', sw: 2 }), T(300, 996 + i * 130, ['스케일링 · 예방치료', '충치 · 잇몸치료', '임플란트 · 교정 상담'][i], 36, '#ffffff', { align: 'center', weight: 700 })]),
  R(60, 1500, 480, 200, '#ffffff', { rx: 36, shadow: true }), T(300, 1534, '진료예약', 28, '#6366f1', { align: 'center', weight: 800, ls: 6 }), T(300, 1580, '02-0000-0000', 54, '#1e293b', { align: 'center', weight: 800 }), T(300, 1654, '미소치과', 26, '#64748b', { align: 'center' }),
], ['배너', '그라데이션']));
out.push(tpl('banner-roll-pastel', '롤업배너 · 스케일링 (파스텔)', '배너/현수막', 600, 1800, '600×1800mm', ROLL_P, '#fff4ec', [
  E(-120, -100, 520, 520, '#ffd9c2'), E(300, 200, 420, 420, '#ffe7d8'), E(-140, 1250, 520, 520, '#ffd0b0', { opacity: .6 }),
  R(120, 190, 360, 62, '#fb7a3a', { rx: 31 }), T(300, 206, 'SCALING EVENT', 28, '#ffffff', { align: 'center', weight: 800, ls: 5 }), T(300, 310, '치아 건강의', 74, '#7a3a1c', { align: 'center', weight: 700, family: 'Batang' }), T(300, 410, '스케일링', 130, '#fb7a3a', { align: 'center', weight: 800, family: 'Batang' }),
  E(110, 640, 380, 380, '#ffffff', { shadow: true }), I(190, 740, 220, 194, '#fb7a3a'), T(300, 1090, '1년에 한 번,\n건강한 잇몸을 위해', 42, '#7a3a1c', { align: 'center', lh: 1.5, weight: 600 }),
  R(80, 1300, 440, 160, '#ffffff', { rx: 32, shadow: true }), T(300, 1328, 'EVENT 혜택', 26, '#fb7a3a', { align: 'center', weight: 800, ls: 4 }), T(300, 1376, '스케일링 00% 할인', 44, '#2b1a12', { align: 'center', weight: 800 }),
  T(300, 1580, '미소치과', 70, '#7a3a1c', { align: 'center', weight: 800, family: 'Batang' }), T(300, 1670, '02-0000-0000', 44, '#fb7a3a', { align: 'center', weight: 800 }),
], ['배너', '파스텔']));
out.push(tpl('hang-gradient', '현수막 · 개원 인사 (그라데이션)', '배너/현수막', 1500, 450, '3000×900mm', ['hang-banner'], '#0ea5e9', [
  R(0, 0, 1500, 450, '#0ea5e9', { grad: ['#0ea5e9', '#6366f1', 20] }), E(1000, -220, 700, 700, '#ffffff', { opacity: .1 }), E(-120, 200, 420, 420, '#ffffff', { opacity: .08 }), E(1100, 120, 300, 300, 'none', { stroke: '#ffffff', sw: 3, opacity: .4 }),
  I(90, 120, 190, 168, '#ffffff'), T(330, 72, '미소치과 개원', 140, '#ffffff', { weight: 800 }), T(336, 250, '건강한 미소를 함께 만들어 가겠습니다', 54, '#ffffff', { opacity: .95 }), R(336, 336, 640, 64, '#ffffff', { rx: 32, opacity: .2 }), T(656, 350, '0월 0일 OPEN  |  TEL 02-0000-0000', 38, '#ffffff', { align: 'center', weight: 700 }),
], ['현수막', '그라데이션']));
out.push(tpl('hang-retro', '현수막 · 진료안내 (레트로)', '배너/현수막', 1500, 450, '3000×900mm', ['hang-banner'], '#f6ecd9', [
  R(0, 0, 1500, 56, '#d94f30'), R(0, 66, 1500, 10, '#2a6f6b'), R(0, 374, 1500, 10, '#2a6f6b'), R(0, 394, 1500, 56, '#d94f30'),
  E(90, 120, 200, 200, '#2a6f6b'), I(135, 168, 110, 97, '#f6ecd9'), T(340, 106, '미소치과', 130, '#d94f30', { weight: 800, family: 'Batang' }), T(344, 262, '365일 진료 · 야간진료 · 주말진료', 54, '#2a6f6b', { weight: 800, family: 'Batang' }), T(1430, 150, '진료문의\n02-0000-0000', 58, '#2b2b2b', { align: 'right', weight: 800, lh: 1.5 }),
], ['현수막', '레트로']));

// =====================================================================
// SNS 카드뉴스 (1080x1080) — 디지털용(PNG 저장)
// =====================================================================
const SNS = 'SNS 카드뉴스';
out.push(tpl('sns-tip-brush', 'SNS · 올바른 칫솔질 3·3·3', SNS, 1080, 1080, '1080×1080px (SNS)', [], '#e6fffa', [
  E(-200, -200, 700, 700, '#99f6e4', { opacity: .6 }), E(720, 700, 600, 600, '#5eead4', { opacity: .5 }), T(90, 90, 'DENTAL TIP 01', 30, '#0f766e', { weight: 800, ls: 8 }), T(90, 150, '올바른 칫솔질', 112, '#134e4a', { weight: 800 }), T(90, 300, '3 · 3 · 3 법칙', 66, '#0d9488', { weight: 700 }),
  ...[0, 1, 2].flatMap(i => [R(90 + i * 300, 480, 270, 340, '#ffffff', { rx: 40, shadow: true }), T(225 + i * 300, 520, '3', 170, '#0d9488', { align: 'center', weight: 800 }), T(225 + i * 300, 740, ['하루 3번', '식후 3분 이내', '3분 동안'][i], 34, '#134e4a', { align: 'center', weight: 700 })]),
  I(90, 930, 50, 44, '#0d9488'), T(160, 930, '미소치과  @misodental', 34, '#0f766e', { weight: 700 }),
], ['SNS', '건강정보']));
out.push(tpl('sns-event-gradient', 'SNS · 이벤트 안내 (그라데이션)', SNS, 1080, 1080, '1080×1080px (SNS)', [], '#f97316', [
  R(0, 0, 1080, 1080, '#f97316', { grad: ['#f97316', '#ec4899', 45] }), E(560, -260, 760, 760, '#ffffff', { opacity: .1 }), E(-200, 640, 640, 640, '#ffffff', { opacity: .08 }), E(700, 640, 280, 280, 'none', { stroke: '#ffffff', sw: 3, opacity: .45 }),
  T(90, 100, 'SPECIAL EVENT', 34, '#ffffff', { weight: 800, ls: 10 }), T(90, 170, '스케일링', 170, '#ffffff', { weight: 800 }), T(90, 360, '이벤트', 170, '#ffffff', { weight: 800 }),
  R(90, 620, 640, 150, '#ffffff', { rx: 75, shadow: true }), T(410, 652, '00% 할인', 80, '#ec4899', { align: 'center', weight: 800 }), T(90, 840, '기간  0000. 00. 00 ~ 00. 00', 40, '#ffffff', { weight: 700 }), T(90, 910, '미소치과  02-0000-0000', 40, '#ffffff', { opacity: .9 }),
], ['SNS', '이벤트']));
out.push(tpl('sns-hours-mono', 'SNS · 진료시간 안내 (모노)', SNS, 1080, 1080, '1080×1080px (SNS)', [], '#ffffff', [
  R(0, 0, 1080, 1080, 'none', { stroke: '#111827', sw: 6 }), T(90, 90, 'CLINIC HOURS', 30, '#6b7280', { weight: 800, ls: 10 }), T(90, 148, '진료시간 안내', 104, '#111827', { weight: 800 }), R(90, 290, 120, 6, '#111827'),
  ...[['월 · 화 · 목 · 금', '09:30 – 18:30'], ['수요일', '09:30 – 21:00'], ['토요일', '09:30 – 14:00'], ['점심시간', '12:30 – 13:30'], ['일 · 공휴일', '휴진']].flatMap(([a, b], i) => [T(90, 350 + i * 118, a, 44, '#111827', { weight: 700 }), T(990, 350 + i * 118, b, 44, '#111827', { align: 'right', weight: 400 }), R(90, 424 + i * 118, 900, 2, '#e5e7eb')]),
  I(90, 985, 46, 40, '#111827'), T(156, 984, '미소치과  02-0000-0000', 32, '#111827', { weight: 700 }),
], ['SNS', '진료시간']));
out.push(tpl('sns-before-after', 'SNS · 비포 & 애프터', SNS, 1080, 1080, '1080×1080px (SNS)', [], '#f1f5f9', [
  T(540, 70, 'BEFORE & AFTER', 40, '#334155', { align: 'center', weight: 800, ls: 10 }), T(540, 130, '치료 전 · 후 비교', 64, '#0f172a', { align: 'center', weight: 800 }),
  ...[0, 1].flatMap(i => [R(70 + i * 470, 260, 470, 560, '#e2e8f0', { rx: 28 }), I(245 + i * 470, 480, 120, 106, '#cbd5e1'), T(305 + i * 470, 620, '사진 추가', 30, '#94a3b8', { align: 'center' }), R(110 + i * 470, 290, 170, 56, i ? '#2563eb' : '#64748b', { rx: 28 }), T(195 + i * 470, 302, i ? 'AFTER' : 'BEFORE', 28, '#ffffff', { align: 'center', weight: 800, ls: 3 })]),
  T(540, 880, '※ 개인에 따라 결과는 다를 수 있습니다.', 28, '#64748b', { align: 'center' }), I(380, 960, 46, 40, '#2563eb'), T(446, 958, '미소치과  02-0000-0000', 34, '#0f172a', { weight: 700 }),
], ['SNS', '비포애프터']));

module.exports = { genExtraTemplates: () => out.map(t => JSON.parse(JSON.stringify(t))) };
