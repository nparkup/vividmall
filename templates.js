// 디자인템플릿 기본 데이터 (편집 가능한 도형/텍스트 요소 JSON). 서버 최초 실행 시 db.templates 로 저장됩니다.
let _n = 0;
const uid = () => 'e' + (++_n);
const T = (x, y, text, size, fill, o = {}) => ({ id: uid(), type: 'text', x, y, text, size, fill, weight: o.weight || 400, family: o.family || 'Malgun Gothic', align: o.align || 'left', lh: o.lh || 1.3, ls: o.ls || 0, opacity: o.opacity ?? 1 });
const R = (x, y, w, h, fill, o = {}) => ({ id: uid(), type: 'rect', x, y, w, h, fill, stroke: o.stroke || 'none', sw: o.sw || 0, rx: o.rx || 0, opacity: o.opacity ?? 1 });
const E = (x, y, w, h, fill, o = {}) => ({ id: uid(), type: 'ellipse', x, y, w, h, fill, stroke: o.stroke || 'none', sw: o.sw || 0, opacity: o.opacity ?? 1 });
const I = (x, y, w, h, fill, o = {}) => ({ id: uid(), type: 'icon', shape: 'tooth', x, y, w, h, fill, opacity: o.opacity ?? 1 });

const PAL = {
  sky: ['#0ea5e9', '#0369a1', '#e0f2fe'], navy: ['#1e3a8a', '#3b82f6', '#dbeafe'], mint: ['#0d9488', '#115e59', '#ccfbf1'], rose: ['#e11d48', '#9f1239', '#ffe4e6'],
  gold: ['#b8901f', '#3b2f12', '#fdf6e3'], violet: ['#7c3aed', '#4c1d95', '#ede9fe'], orange: ['#ea580c', '#9a3412', '#ffedd5'],
};
const CARD_P = ['card-std', 'card-armi', 'card-premium', 'card-fold', 'card-round', 'card-thick'];
const FLYER_P = ['flyer-a4', 'poster', 'poster-board', 'frame'];
const FORM_P = ['chart-mono', 'chart-color', 'consent', 'caution', 'letter-paper'];
const ENV_P = ['env-letter', 'env-letter-mono', 'env-window', 'env-window-mono'];

const tpl = (id, name, category, w, h, mm, products, bg, elements, tags = []) => ({ id, name, category, w, h, mm, products, bg, elements, tags, active: true });
const out = [];

// ---------- 명함 (1080x600 = 90x50mm) ----------
const info = (x, y, ink = '#0f172a', sub = '#64748b') => [
  T(x, y, '홍 길 동', 64, ink, { weight: 700, ls: 6 }), T(x, y + 78, '대표원장 · 치의학박사', 30, sub),
  T(x, y + 160, 'T  02-0000-0000   M  010-0000-0000', 28, ink), T(x, y + 202, 'www.dental.kr  |  info@dental.kr', 28, ink), T(x, y + 244, '서울특별시 ○○구 ○○로 123, 4층', 28, sub),
];
const logo = (x, y, c, nameC, sz = 54) => [I(x, y, 70, 62, c), T(x + 90, y + 2, '미소치과', sz, nameC, { weight: 800 }), T(x + 92, y + 2 + sz + 8, 'DENTAL CLINIC', 22, nameC, { opacity: .6, ls: 3 })];
out.push(tpl('card-bar-sky', '명함 · 클린 라인 (스카이)', '명함', 1080, 600, '90×50mm', CARD_P, '#ffffff', [R(0, 0, 36, 600, PAL.sky[0]), ...logo(90, 60, PAL.sky[0], PAL.sky[1]), ...info(90, 270)], ['앞면', '심플']));
out.push(tpl('card-split-navy', '명함 · 좌우 분할 (네이비)', '명함', 1080, 600, '90×50mm', CARD_P, '#ffffff', [R(0, 0, 360, 600, PAL.navy[0]), I(120, 190, 120, 106, '#ffffff'), T(180, 330, '미소치과', 44, '#ffffff', { align: 'center', weight: 800 }), T(180, 384, 'DENTAL CLINIC', 20, '#ffffff', { align: 'center', opacity: .7, ls: 3 }), ...info(420, 120, '#0f172a', '#64748b').map(e => e.type === 'text' && e.size === 28 ? { ...e, size: 26 } : e)], ['앞면']));
out.push(tpl('card-center-mint', '명함 · 뒷면 브랜드 (민트)', '명함', 1080, 600, '90×50mm', CARD_P, PAL.mint[0], [E(700, -120, 600, 600, '#ffffff', { opacity: .08 }), I(450, 150, 180, 160, '#ffffff'), T(540, 360, '미소치과', 72, '#ffffff', { align: 'center', weight: 800 }), T(540, 450, 'DENTAL CLINIC', 28, '#ffffff', { align: 'center', opacity: .8, ls: 6 })], ['뒷면', '브랜드']));
out.push(tpl('card-dark-gold', '명함 · 다크 골드', '명함', 1080, 600, '90×50mm', CARD_P, '#111827', [R(60, 60, 960, 480, 'none', { stroke: '#b8901f', sw: 3 }), I(100, 100, 70, 62, '#d4af37'), T(190, 104, '미소치과', 50, '#d4af37', { weight: 800 }), ...info(100, 270, '#f8fafc', '#cbd5e1')], ['앞면', '고급']));
out.push(tpl('card-soft-violet', '명함 · 소프트 바이올렛', '명함', 1080, 600, '90×50mm', CARD_P, PAL.violet[2], [E(760, 300, 520, 520, PAL.violet[0], { opacity: .18 }), E(900, -100, 300, 300, PAL.violet[0], { opacity: .12 }), ...logo(80, 70, PAL.violet[0], PAL.violet[1]), ...info(80, 270, '#1f1147', '#6b5b95')], ['앞면']));
out.push(tpl('card-bar-rose', '명함 · 로즈 포인트', '명함', 1080, 600, '90×50mm', CARD_P, '#ffffff', [R(0, 520, 1080, 80, PAL.rose[0]), ...logo(80, 60, PAL.rose[0], PAL.rose[1]), ...info(80, 250).map(e => e.type === 'text' && e.size === 28 ? { ...e, size: 26 } : e)], ['앞면']));

// ---------- 전단/포스터 (A4 1240x1754) ----------
const W = 1240, H = 1754;
out.push(tpl('flyer-hero-sky', '전단 · 건강한 미소 (스카이)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#ffffff', [
  R(0, 0, W, 760, PAL.sky[0]), E(760, 60, 640, 640, '#ffffff', { opacity: .12 }), I(820, 160, 320, 282, '#ffffff'),
  T(90, 210, '건강한 미소,', 110, '#ffffff', { weight: 800 }), T(90, 350, '평생 함께합니다', 110, '#ffffff', { weight: 800 }), T(90, 520, '스케일링 · 임플란트 · 교정 · 충치치료', 40, '#ffffff', { opacity: .95 }),
  ...[0, 1, 2].flatMap(i => [E(110, 900 + i * 190, 64, 64, PAL.sky[0]), T(142, 910 + i * 190, String(i + 1), 40, '#ffffff', { align: 'center', weight: 800 }), T(210, 900 + i * 190, ['정확한 진단, 정직한 진료', '최신 장비와 편안한 치료 환경', '환자 중심의 맞춤 치료 계획'][i], 52, '#0f172a', { weight: 700 }), T(210, 966 + i * 190, '내용을 입력하세요. 간단한 설명을 한 줄로 적어 주세요.', 32, '#64748b')]),
  R(0, 1554, W, 200, PAL.sky[1]), T(W / 2, 1590, '진료문의  02-0000-0000', 72, '#ffffff', { align: 'center', weight: 800 }), T(W / 2, 1680, '미소치과 | 서울특별시 ○○구 ○○로 123, 4층', 32, '#ffffff', { align: 'center', opacity: .85 }),
], ['홍보', '전단']));
out.push(tpl('flyer-event-orange', '전단 · 이벤트 (오렌지)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, PAL.orange[2], [
  E(-200, -200, 900, 900, PAL.orange[0], { opacity: .9 }), E(800, 1100, 700, 700, PAL.orange[0], { opacity: .25 }),
  T(100, 120, 'EVENT', 48, '#ffffff', { weight: 800, ls: 12 }), T(100, 200, '정기 스케일링', 120, '#ffffff', { weight: 800 }), T(100, 340, '이벤트', 120, '#ffffff', { weight: 800 }),
  E(760, 1020, 400, 400, '#e11d48'), T(960, 1130, 'SPECIAL', 50, '#ffffff', { align: 'center', weight: 700, ls: 4 }), T(960, 1200, '혜택', 110, '#ffffff', { align: 'center', weight: 800 }),
  R(100, 900, 620, 6, PAL.orange[0]), T(100, 940, '이벤트 기간', 40, PAL.orange[1], { weight: 700 }), T(100, 1000, '0000년 0월 0일 ~ 0월 0일', 56, '#0f172a', { weight: 800 }), T(100, 1100, '내용을 입력하세요.\n이벤트 혜택과 대상을 자유롭게 적어 주세요.', 38, '#475569', { lh: 1.6 }),
  I(100, 1500, 70, 62, PAL.orange[0]), T(190, 1500, '미소치과', 56, PAL.orange[1], { weight: 800 }), T(190, 1566, '진료문의 02-0000-0000', 36, '#475569'),
], ['이벤트', '전단']));
out.push(tpl('flyer-hours-navy', '포스터 · 진료시간 안내 (네이비)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#ffffff', [
  R(0, 0, W, 420, PAL.navy[0]), I(90, 100, 110, 97, '#ffffff'), T(240, 96, '진료시간 안내', 100, '#ffffff', { weight: 800 }), T(244, 230, '미소치과  |  Dental Clinic', 40, '#ffffff', { opacity: .85 }),
  ...[['월 · 화 · 목 · 금', '09:30 ~ 18:30'], ['수요일', '09:30 ~ 21:00 (야간진료)'], ['토요일', '09:30 ~ 14:00'], ['점심시간', '12:30 ~ 13:30'], ['일요일 · 공휴일', '휴진']].flatMap(([a, b], i) => [R(90, 520 + i * 170, 1060, 150, i % 2 ? '#f8fafc' : PAL.navy[2]), T(140, 570 + i * 170, a, 52, PAL.navy[0], { weight: 800 }), T(1090, 574 + i * 170, b, 50, '#0f172a', { align: 'right', weight: 700 })]),
  T(W / 2, 1450, '※ 진료 시간은 변동될 수 있으니 방문 전 전화 문의 바랍니다.', 34, '#64748b', { align: 'center' }), R(0, 1554, W, 200, PAL.navy[1]), T(W / 2, 1610, '예약 · 문의  02-0000-0000', 74, '#ffffff', { align: 'center', weight: 800 }),
], ['안내', '포스터']));
out.push(tpl('poster-tips-mint', '포스터 · 올바른 칫솔질 (민트)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, PAL.mint[2], [
  T(W / 2, 120, '올바른 칫솔질 3·3·3', 110, PAL.mint[1], { align: 'center', weight: 800 }), T(W / 2, 270, '하루 3번 · 식후 3분 이내 · 3분 동안', 48, PAL.mint[0], { align: 'center', weight: 700 }),
  ...[0, 1, 2].flatMap(i => [E(110 + i * 370, 480, 320, 320, PAL.mint[0]), T(270 + i * 370, 540, '3', 220, '#ffffff', { align: 'center', weight: 800 }), T(270 + i * 370, 850, ['하루 3번', '식후 3분 이내', '3분 동안'][i], 52, PAL.mint[1], { align: 'center', weight: 800 }), T(270 + i * 370, 930, '내용을 입력하세요', 32, '#475569', { align: 'center' })]),
  I(470, 1150, 300, 264, PAL.mint[0], { opacity: .25 }), T(W / 2, 1480, '치아 건강, 작은 습관에서 시작됩니다', 52, PAL.mint[1], { align: 'center', weight: 700 }), T(W / 2, 1600, '미소치과  02-0000-0000', 56, PAL.mint[0], { align: 'center', weight: 800 }),
], ['건강정보', '포스터']));
out.push(tpl('flyer-dark-gold', '전단 · 임플란트 (다크 골드)', '전단/포스터', W, H, 'A4 210×297mm', FLYER_P, '#111827', [
  R(60, 60, W - 120, H - 120, 'none', { stroke: '#b8901f', sw: 4 }), I(520, 200, 200, 176, '#d4af37'), T(W / 2, 460, 'IMPLANT', 130, '#d4af37', { align: 'center', weight: 800, ls: 14 }), T(W / 2, 640, '임플란트 전문 상담', 80, '#f8fafc', { align: 'center', weight: 700 }),
  R(520, 780, 200, 4, '#d4af37'), T(W / 2, 850, '정밀 진단부터 사후 관리까지\n한 분 한 분 맞춤 치료를 약속드립니다', 48, '#cbd5e1', { align: 'center', lh: 1.7 }),
  ...[0, 1, 2].flatMap(i => [T(220 + i * 400, 1180, ['01', '02', '03'][i], 80, '#d4af37', { align: 'center', weight: 800 }), T(220 + i * 400, 1290, ['정밀 3D CT', '숙련된 임상 경험', '철저한 소독 시스템'][i], 38, '#f8fafc', { align: 'center', weight: 700 })]),
  T(W / 2, 1560, '상담예약  02-0000-0000', 64, '#d4af37', { align: 'center', weight: 800 }), T(W / 2, 1650, '미소치과 · 서울특별시 ○○구 ○○로 123, 4층', 32, '#94a3b8', { align: 'center' }),
], ['임플란트', '고급']));

// ---------- 진료차트/서식 (A4) ----------
const table = (x, y, w, h, rows, cols, c = '#94a3b8') => {
  const els = [R(x, y, w, h, 'none', { stroke: c, sw: 2 })];
  for (let i = 1; i < rows; i++) els.push(R(x, y + i * h / rows, w, 1.5, c));
  for (let j = 1; j < cols; j++) els.push(R(x + j * w / cols, y, 1.5, h, c));
  return els;
};
const teethRow = (x, y, n, gap, c) => [...Array(n)].map((_, i) => R(x + i * gap, y, gap - 8, gap + 6, '#ffffff', { stroke: c, sw: 2, rx: 10 }));
const chartTpl = (id, name, c, color) => tpl(id, name, '진료차트/서식', W, H, 'A4 210×297mm', FORM_P, '#ffffff', [
  ...(color ? [R(0, 0, W, 24, c)] : []), T(W / 2, 90, '진 료 기 록 부', 76, color ? c : '#111827', { align: 'center', weight: 800, ls: 10 }), R(420, 190, 400, 4, color ? c : '#111827'),
  ...table(80, 250, 1080, 160, 2, 4, color ? c : '#555'), ...['성 명', '생년월일', '연락처', '차트번호'].map((t, i) => T(100 + i * 270, 262, t, 28, '#475569')), ...['주 소', '내원경로', '특이사항'].map((t, i) => T(100 + i * 360, 342, t, 28, '#475569')),
  T(80, 450, '치아 도식', 32, color ? c : '#111827', { weight: 700 }), ...teethRow(100, 500, 16, 66, color ? c : '#555'), ...teethRow(100, 600, 16, 66, color ? c : '#555'),
  ...table(80, 740, 1080, 860, 10, 3, color ? c : '#777'), ...['일 자', '진 료 내 용', '비 고'].map((t, i) => T([160, 580, 1000][i], 758, t, 30, color ? c : '#111827', { weight: 700 })),
  I(80, 1650, 36, 32, color ? c : '#555'), T(130, 1650, '미소치과', 32, color ? c : '#111827', { weight: 700 }), T(1160, 1654, 'TEL 02-0000-0000', 26, '#64748b', { align: 'right' }),
], ['차트']);
out.push(chartTpl('form-chart-mono', '진료기록부 (흑백)', '#111827', false));
out.push(chartTpl('form-chart-blue', '진료기록부 (컬러)', PAL.navy[0], true));
out.push(tpl('form-consent', '진료 동의서', '진료차트/서식', W, H, 'A4 210×297mm', FORM_P, '#ffffff', [
  R(0, 0, W, 24, PAL.sky[1]), I(90, 80, 70, 62, PAL.sky[0]), T(190, 84, '미소치과', 52, PAL.sky[1], { weight: 800 }), T(W / 2, 250, '진 료 동 의 서', 80, '#111827', { align: 'center', weight: 800, ls: 10 }), R(380, 350, 480, 4, PAL.sky[0]),
  ...table(90, 420, 1060, 150, 2, 3, '#94a3b8'), ...['환자명', '생년월일', '연락처', '보호자', '관계', '서명'].map((t, i) => T(110 + (i % 3) * 350, 436 + Math.floor(i / 3) * 75, t, 28, '#475569')),
  ...[0, 1, 2, 3, 4].flatMap(i => [R(100, 660 + i * 170, 44, 44, '#ffffff', { stroke: PAL.sky[0], sw: 3, rx: 8 }), T(170, 660 + i * 170, ['진료 및 치료 계획에 대한 설명을 들었으며 동의합니다.', '치료 과정에서 발생 가능한 합병증에 대한 설명을 들었습니다.', '마취 및 투약에 동의합니다.', '개인정보 수집·이용에 동의합니다.', '진료 기록 및 영상 자료의 활용에 동의합니다.'][i], 36, '#0f172a', { weight: 600 }), T(170, 718 + i * 170, '내용을 입력하세요.', 28, '#94a3b8')]),
  T(100, 1560, '0000년  00월  00일', 38, '#111827'), T(1140, 1560, '환자(보호자)  ____________  (서명)', 38, '#111827', { align: 'right' }),
], ['동의서']));
out.push(tpl('form-caution', '진료 후 주의사항', '진료차트/서식', W, H, 'A4 210×297mm', FORM_P, '#ffffff', [
  R(0, 0, W, 360, PAL.orange[0]), T(90, 100, '진료 후 주의사항', 110, '#ffffff', { weight: 800 }), T(94, 250, '치료 후 아래 내용을 꼭 지켜 주세요', 42, '#ffffff', { opacity: .9 }), I(1010, 110, 140, 123, '#ffffff', { opacity: .9 }),
  ...[0, 1, 2, 3, 4].flatMap(i => [E(100, 460 + i * 215, 80, 80, PAL.orange[0]), T(140, 475 + i * 215, '!', 56, '#ffffff', { align: 'center', weight: 800 }), T(230, 460 + i * 215, ['마취가 풀릴 때까지 식사를 피해 주세요', '처방된 약은 정해진 시간에 복용해 주세요', '출혈이 지속되면 거즈를 물고 지혈해 주세요', '치료 부위를 혀나 손으로 만지지 마세요', '이상이 있으면 즉시 연락해 주세요'][i], 44, '#0f172a', { weight: 700 }), T(230, 524 + i * 215, '내용을 입력하세요.', 30, '#94a3b8')]),
  R(0, 1554, W, 200, PAL.orange[1]), T(W / 2, 1610, '문의  02-0000-0000', 74, '#ffffff', { align: 'center', weight: 800 }),
], ['주의사항']));
out.push(tpl('form-letter-sky', '레터헤드 (A4 편지지)', '진료차트/서식', W, H, 'A4 210×297mm', FORM_P, '#ffffff', [
  I(100, 100, 80, 70, PAL.sky[0]), T(210, 102, '미소치과', 60, PAL.sky[1], { weight: 800 }), T(212, 176, 'DENTAL CLINIC', 24, PAL.sky[1], { opacity: .6, ls: 4 }), T(1140, 120, 'T 02-0000-0000\nwww.dental.kr', 26, '#64748b', { align: 'right', lh: 1.6 }), R(100, 250, 1040, 4, PAL.sky[0]),
  R(0, 1654, W, 100, PAL.sky[0]), T(W / 2, 1688, '서울특별시 ○○구 ○○로 123, 4층  |  T 02-0000-0000', 30, '#ffffff', { align: 'center' }),
], ['레터']));

// ---------- 봉투 (1320x630 = 220x105mm) ----------
out.push(tpl('env-bar-sky', '봉투 · 클린 로고 (스카이)', '봉투', 1320, 630, '220×105mm', ENV_P, '#ffffff', [
  I(70, 60, 80, 70, PAL.sky[0]), T(170, 62, '미소치과', 52, PAL.sky[1], { weight: 800 }), T(172, 126, 'DENTAL CLINIC', 22, PAL.sky[1], { opacity: .6, ls: 4 }), R(0, 560, 1320, 70, PAL.sky[0]),
  T(70, 190, '서울특별시 ○○구 ○○로 123, 4층\nTEL 02-0000-0000', 28, '#64748b', { lh: 1.6 }), R(1170, 50, 100, 120, 'none', { stroke: '#cbd5e1', sw: 3 }), T(1220, 98, '우표', 26, '#cbd5e1', { align: 'center' }),
], ['봉투']));
out.push(tpl('env-minimal', '봉투 · 미니멀', '봉투', 1320, 630, '220×105mm', ENV_P, '#ffffff', [
  I(70, 70, 60, 53, '#111827'), T(150, 72, '미소치과', 44, '#111827', { weight: 800 }), R(70, 160, 40, 4, '#111827'), T(70, 190, '서울특별시 ○○구 ○○로 123, 4층\nT 02-0000-0000  |  www.dental.kr', 24, '#64748b', { lh: 1.7 }),
], ['봉투']));

// ---------- 스티커 (720x720 = 60x60mm) ----------
out.push(tpl('sticker-brand-sky', '스티커 · 브랜드 (스카이)', '스티커', 720, 720, '60×60mm', ['sticker-sq'], PAL.sky[0], [E(380, -140, 520, 520, '#ffffff', { opacity: .1 }), I(250, 150, 220, 194, '#ffffff'), T(360, 400, '미소치과', 100, '#ffffff', { align: 'center', weight: 800 }), T(360, 530, 'DENTAL CLINIC', 34, '#ffffff', { align: 'center', opacity: .85, ls: 8 })], ['스티커']));
out.push(tpl('sticker-thanks', '스티커 · Thank you', '스티커', 720, 720, '60×60mm', ['sticker-sq'], '#ffffff', [R(30, 30, 660, 660, 'none', { stroke: PAL.mint[0], sw: 8, rx: 60 }), I(290, 110, 140, 123, PAL.mint[0]), T(360, 280, 'Thank you', 110, PAL.mint[1], { align: 'center', weight: 800, family: 'Georgia' }), T(360, 430, '오늘도 활짝 웃는 하루 되세요', 38, '#475569', { align: 'center' }), T(360, 560, '미소치과', 52, PAL.mint[0], { align: 'center', weight: 800 })], ['스티커']));
out.push(tpl('sticker-pink', '스티커 · 스마일 (로즈)', '스티커', 720, 720, '60×60mm', ['sticker-sq'], PAL.rose[2], [E(60, 60, 600, 600, PAL.rose[0]), I(255, 170, 210, 185, '#ffffff'), T(360, 400, '치카치카', 96, '#ffffff', { align: 'center', weight: 800 }), T(360, 520, '미소치과', 44, '#ffffff', { align: 'center', opacity: .9, weight: 700 })], ['스티커']));

// ---------- 롤업배너 (600x1800 = 600x1800mm) ----------
out.push(tpl('banner-roll-sky', '롤업배너 · 정기검진 (스카이)', '배너/현수막', 600, 1800, '600×1800mm', ['banner-in', 'banner-out', 'banner-mini'], '#ffffff', [
  R(0, 0, 600, 880, PAL.sky[0]), E(120, 120, 560, 560, '#ffffff', { opacity: .12 }), I(190, 260, 220, 194, '#ffffff'), T(300, 520, '미소치과', 62, '#ffffff', { align: 'center', weight: 800 }), T(300, 600, 'DENTAL CLINIC', 22, '#ffffff', { align: 'center', opacity: .85, ls: 6 }),
  T(300, 960, '6개월마다', 92, '#111827', { align: 'center', weight: 800 }), T(300, 1070, '정기검진', 100, PAL.sky[0], { align: 'center', weight: 800 }), R(220, 1210, 160, 5, PAL.sky[0]),
  T(300, 1260, '스케일링 · 충치치료\n임플란트 · 교정 상담', 36, '#475569', { align: 'center', lh: 1.7 }), R(0, 1620, 600, 180, PAL.sky[1]), T(300, 1660, '02-0000-0000', 60, '#ffffff', { align: 'center', weight: 800 }), T(300, 1738, '서울특별시 ○○구 ○○로 123, 4층', 22, '#ffffff', { align: 'center', opacity: .85 }),
], ['배너']));
out.push(tpl('banner-roll-dark', '롤업배너 · 임플란트 (다크)', '배너/현수막', 600, 1800, '600×1800mm', ['banner-in', 'banner-out', 'banner-mini'], '#111827', [
  R(30, 30, 540, 1740, 'none', { stroke: '#b8901f', sw: 3 }), I(210, 200, 180, 159, '#d4af37'), T(300, 460, 'IMPLANT', 92, '#d4af37', { align: 'center', weight: 800, ls: 8 }), T(300, 600, '임플란트 전문 상담', 54, '#f8fafc', { align: 'center', weight: 700 }), R(240, 700, 120, 4, '#d4af37'),
  T(300, 780, '정밀 진단부터\n사후 관리까지', 44, '#cbd5e1', { align: 'center', lh: 1.7 }), ...[0, 1, 2].flatMap(i => [T(300, 1100 + i * 150, '0' + (i + 1), 56, '#d4af37', { align: 'center', weight: 800 }), T(300, 1170 + i * 150, ['정밀 3D CT', '숙련된 임상 경험', '철저한 소독 시스템'][i], 30, '#f8fafc', { align: 'center' })]),
  T(300, 1640, '상담예약 02-0000-0000', 40, '#d4af37', { align: 'center', weight: 800 }),
], ['배너']));

// ---------- 현수막 (1500x450 = 3000x900mm) ----------
out.push(tpl('hang-open-sky', '현수막 · 개원 인사 (스카이)', '배너/현수막', 1500, 450, '3000×900mm', ['hang-banner'], PAL.sky[0], [E(1000, -200, 700, 700, '#ffffff', { opacity: .12 }), I(90, 110, 190, 168, '#ffffff'), T(330, 80, '미소치과 개원', 130, '#ffffff', { weight: 800 }), T(334, 240, '건강한 미소를 함께 만들어 가겠습니다', 52, '#ffffff', { opacity: .95 }), T(334, 340, '0월 0일 OPEN  |  TEL 02-0000-0000', 40, '#ffffff', { weight: 700 })], ['현수막']));
out.push(tpl('hang-white', '현수막 · 진료안내 (화이트)', '배너/현수막', 1500, 450, '3000×900mm', ['hang-banner'], '#ffffff', [R(0, 0, 1500, 70, PAL.navy[0]), R(0, 380, 1500, 70, PAL.navy[0]), I(80, 130, 150, 132, PAL.navy[0]), T(270, 120, '미소치과', 120, PAL.navy[0], { weight: 800 }), T(274, 262, '365일 진료 · 야간진료 · 주말진료', 52, '#111827', { weight: 700 }), T(1420, 160, '진료문의\n02-0000-0000', 56, PAL.navy[1], { align: 'right', weight: 800, lh: 1.5 })], ['현수막']));

const { genExtraTemplates } = require('./templates_extra');
module.exports = {
  genTemplates: () => out.map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), order: i + 1 })),
  genExtraTemplates, PAL,
};
