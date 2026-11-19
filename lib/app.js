// 쇼핑몰 공용 로직 (Node 서버와 Cloudflare Worker가 함께 사용). 파일/DB 입출력은 호스트가 주입합니다.
'use strict';
const path = require('path');
const crypto = require('crypto');
const { seed, catalog, TOPS, SHOW_ALL } = require('../seed');
const { genTemplates, genExtraTemplates } = require('../templates');

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (code, msg) => { throw new HttpError(code, msg); };
const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);

// opts: { db(저장된 DB 또는 null), save(db), adminId, adminPw, io:{saveUpload(name,buf), saveImage(name,buf)} }
function createApp({ db: loaded, save: persist, adminId, adminPw, io }) {
  const ADMIN_ID = adminId, ADMIN_PW = adminPw;
  let db = loaded || seed();
  const save = () => persist(db);
// 기존 DB(1단 분류)는 2단 분류 상품 구성으로 교체 (회원/주문/게시글은 유지)
if (!db.categories || !db.categories[0] || !db.categories[0].top) {
  Object.assign(db, catalog());
  // 예전 분류를 가리키던 배너 링크를 새 분류로 연결
  const fix = { '%EC%95%BD%EB%B4%89%ED%88%AC%2F%EC%95%BD%ED%8F%AC%EC%A7%80': '%EA%B3%A0%EA%B8%89%EC%9D%B8%EC%87%84', '%EC%87%BC%ED%95%91%EB%B0%B1%2F%EB%B9%84%EB%8B%90%EB%B4%89%ED%88%AC': '%ED%8C%A8%ED%82%A4%EC%A7%80' };
  (db.banners || []).forEach(b => Object.entries(fix).forEach(([a, c]) => { b.link = b.link.replace(a, c); }));
}
save();

// 몰 이름 변경: 비비프린피아 → 비비디그라운드몰 (기존 DB 반영)
{
  const OLD_NAME = '비비프린' + '피아', NEW_NAME = '비비디그라운드몰';
  for (const k of ['shopName', 'bank']) if (typeof db.settings[k] === 'string' && db.settings[k].includes(OLD_NAME)) db.settings[k] = db.settings[k].split(OLD_NAME).join(NEW_NAME);
  save();
}
// 상단메뉴 이름 변경: 치과인쇄물 → 치과인쇄 (기존 DB 반영)
{
  const OLD = '치과인쇄' + '물', OLD_Q = '%EC%B9%98%EA%B3%BC%EC%9D%B8%EC%87%84%EB%AC%BC';
  db.categories.forEach(c => { if (c.top === OLD) c.top = '치과인쇄'; });
  (db.banners || []).forEach(b => { b.link = (b.link || '').replace(OLD_Q, '%EC%B9%98%EA%B3%BC%EC%9D%B8%EC%87%84'); b.title = (b.title || '').replace(OLD, '치과인쇄'); });
}// 치과인쇄 상단메뉴/추가 분류(also) 보강 (기존 상품·수정 내용은 유지)
{
  db.categories = db.categories.filter(c => !(c.top === '치과인쇄' && c.id === '기타')); // 기타 분류 삭제
  db.products = db.products.filter(p => p.id !== 'extra-pay');
  const fresh = catalog();
  if (!db.categories.some(c => c.top === '치과인쇄')) db.categories = [...fresh.categories.filter(c => c.top === '치과인쇄'), ...db.categories];
  const byId = new Map(db.products.map(p => [p.id, p]));
  fresh.products.forEach(fp => { const p = byId.get(fp.id); if (!p) db.products.push(fp); else if (!p.also) p.also = fp.also; });
  save();
}
// 메인 롤링배너: 치과인쇄/상업인쇄 홍보 이미지 배너 추가 (이미 있으면 유지)
if (!(db.banners || []).some(b => b.img)) {
  db.banners = [
    { title: '치과인쇄 홍보', sub: '', color: '#1d4ed8', color2: '#06b6d4', link: '#/list?top=%EC%B9%98%EA%B3%BC%EC%9D%B8%EC%87%84', img: '/img/banners/banner-dental.svg', active: true },
    { title: '상업인쇄 홍보', sub: '', color: '#7c3aed', color2: '#f97316', link: '#/list?top=%EC%83%81%EC%97%85%EC%9D%B8%EC%87%84', img: '/img/banners/banner-commercial.svg', active: true },
    ...(db.banners || []),
  ].map((b, i) => ({ ...b, id: i + 1 }));
  save();
}
// 상단메뉴 목록(db.tops)과 주요서비스(db.quickMenus) 초기화
if (!db.tops) db.tops = TOPS.map(name => ({ name, active: true }));
if (!db.quickMenus) {
  const hasProd = c => db.products.some(p => p.active && [{ cat: p.cat }, ...(p.also || [])].some(a => a.cat === c.id));
  const out = [];
  db.tops.forEach(t => {
    const cats = db.categories.filter(c => c.top === t.name && (SHOW_ALL.includes(t.name) || hasProd(c)));
    if (cats.length > 1) cats.forEach(c => out.push({ name: c.name, icon: c.icon, bg: c.bg, link: '#/list?cat=' + encodeURIComponent(c.id), active: true }));
    else if (cats.length === 1) out.push({ name: t.name, icon: cats[0].icon, bg: cats[0].bg, link: '#/list?top=' + encodeURIComponent(t.name), active: true });
  });
  db.quickMenus = out.map((q, i) => ({ id: i + 1, ...q }));
}
// 주요서비스 아이콘 중복 해소 (관리자가 직접 바꾼 아이콘은 건드리지 않음)
{
  const FIX = { '홍보인쇄물': ['🪪', '📣'], '배너/판넬': ['🖼️', '🚩'], '경인쇄': ['📋', '🧾'], '고급인쇄': ['💊', '✨'], '패키지 쇼핑백': ['🛍️', '📦'], '패키지': ['🛍️', '📦'] };
  const fix = x => { const f = FIX[x.name] || FIX[x.id]; if (f && x.icon === f[0]) x.icon = f[1]; };
  (db.quickMenus || []).forEach(fix); db.categories.forEach(fix);
}
save();
// 디자인템플릿 / 내 디자인 초기화
if (!db.templates) db.templates = genTemplates().map(t => ({ ...t, builtin: true }));
if (!db.designs) db.designs = [];
// 신규 추가 템플릿(세련된 컬렉션)을 기존 DB에 보강: 이미 있는 템플릿은 건드리지 않고, 새 것만 갤러리 맨 앞에 배치
{
  const have = new Set(db.templates.map(t => t.id));
  genExtraTemplates().filter(t => !have.has(t.id)).forEach((t, i) => db.templates.push({ ...t, builtin: true, order: -1000 + i }));
}
save();
const ORDER_STATUS = ['입금대기', '결제완료', '시안확인중', '제작중', '배송중', '배송완료', '취소'];

const hash = (pw, salt = crypto.randomBytes(8).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
const verify = (pw, stored) => { const [salt] = stored.split(':'); return hash(pw, salt) === stored; };
const token = () => crypto.randomBytes(24).toString('hex');
const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const userOf = req => { const t = (req.headers.authorization || '').replace('Bearer ', ''); const id = db.sessions[t]; return id && db.users.find(u => u.id === id); };
const isAdmin = req => !!db.adminSessions[(req.headers['x-admin-token'] || '')];
const needUser = req => userOf(req) || fail(401, '로그인이 필요합니다.');
const needAdmin = req => isAdmin(req) || fail(401, '관리자 로그인이 필요합니다.');
const pub = u => ({ id: u.id, username: u.username, name: u.name, phone: u.phone, email: u.email, zip: u.zip, addr: u.addr, addr2: u.addr2, points: u.points, clinic: u.clinic, createdAt: u.createdAt });
const mask = n => n ? n[0] + '*'.repeat(Math.max(1, n.length - 1)) : '';

function priceOf(p, opts = {}, qty) {
  const tier = p.tiers.find(t => t.qty === Number(qty)) || fail(400, `${p.name}: 잘못된 수량입니다.`);
  let sum = tier.price; const chosen = {};
  for (const g of p.options) {
    const c = g.choices.find(c => c.label === opts[g.name]) || g.choices[0];
    chosen[g.name] = c.label; sum += c.add;
  }
  return { unit: sum, chosen };
}

function dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const paid = db.orders.filter(o => o.status !== '취소');
  const byStatus = Object.fromEntries(ORDER_STATUS.map(s => [s, db.orders.filter(o => o.status === s).length]));
  const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10); return { date: d, sales: paid.filter(o => o.createdAt.startsWith(d)).reduce((a, o) => a + o.total, 0), count: paid.filter(o => o.createdAt.startsWith(d)).length }; });
  const top = {};
  paid.forEach(o => o.items.forEach(i => { top[i.name] = (top[i.name] || 0) + i.price; }));
  return {
    todayOrders: db.orders.filter(o => o.createdAt.startsWith(today)).length,
    todaySales: paid.filter(o => o.createdAt.startsWith(today)).reduce((a, o) => a + o.total, 0),
    totalSales: paid.reduce((a, o) => a + o.total, 0), totalOrders: db.orders.length,
    users: db.users.length, products: db.products.length,
    pendingInquiries: db.posts.filter(p => p.board === 'inquiry' && !p.reply).length,
    byStatus, days, top: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, sales]) => ({ name, sales })),
    recent: db.orders.slice(-5).reverse(),
  };
}

const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

// 공개
on('GET', '/api/shop', () => ({ settings: db.settings, tops: db.tops.filter(t => t.active).map(t => t.name), showAll: SHOW_ALL, categories: db.categories.filter(c => c.active !== false), quickMenus: (db.quickMenus || []).filter(q => q.active), banners: db.banners.filter(b => b.active), orderStatus: ORDER_STATUS }));
on('GET', '/api/products', ({ query }) => {
  let list = db.products.filter(p => p.active);
  if (query.cat) list = list.filter(p => [{ cat: p.cat, sub: p.sub }, ...(p.also || [])].some(a => a.cat === query.cat && (!query.sub || a.sub === query.sub)));
  if (query.q) list = list.filter(p => (p.name + p.spec).includes(query.q));
  if (query.hit) list = list.filter(p => p.hit);
  if (query.best) list = list.filter(p => p.best);
  return list.sort((a, b) => a.order - b.order);
});
on('GET', '/api/products/:id', ({ params }) => {
  const p = db.products.find(p => p.id === params.id && p.active) || fail(404, '상품을 찾을 수 없습니다.');
  p.views++; save(); return p;
});
on('POST', '/api/price', async ({ body }) => {
  const p = db.products.find(p => p.id === body.pid) || fail(404, '상품 없음');
  return priceOf(p, body.opts, body.qty);
});

// 회원
on('POST', '/api/auth/signup', async ({ body }) => {
  const username = str(body.username, 30), pw = str(body.password, 100), name = str(body.name, 30);
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) fail(400, '아이디는 영문/숫자 4~20자로 입력하세요.');
  if (pw.length < 6) fail(400, '비밀번호는 6자 이상이어야 합니다.');
  if (!name) fail(400, '이름(또는 병원명)을 입력하세요.');
  if (db.users.some(u => u.username === username)) fail(409, '이미 사용 중인 아이디입니다.');
  const u = { id: db.seq.user++, username, pw: hash(pw), name, clinic: str(body.clinic, 50), phone: str(body.phone, 20), email: str(body.email, 80), zip: '', addr: str(body.addr, 200), addr2: '', points: db.settings.signupPoints, createdAt: new Date().toISOString() };
  db.users.push(u);
  const t = token(); db.sessions[t] = u.id; save();
  return { token: t, user: pub(u) };
});
on('POST', '/api/auth/login', async ({ body }) => {
  const u = db.users.find(u => u.username === str(body.username));
  if (!u || !verify(str(body.password, 100), u.pw)) fail(401, '아이디 또는 비밀번호가 올바르지 않습니다.');
  if (u.blocked) fail(403, '이용이 제한된 계정입니다.');
  const t = token(); db.sessions[t] = u.id; save();
  return { token: t, user: pub(u) };
});
on('POST', '/api/auth/logout', ({ req }) => { delete db.sessions[(req.headers.authorization || '').replace('Bearer ', '')]; save(); return { ok: true }; });
on('GET', '/api/me', ({ req }) => pub(needUser(req)));
on('PUT', '/api/me', async ({ req, body }) => {
  const u = needUser(req);
  for (const k of ['name', 'clinic', 'phone', 'email', 'zip', 'addr', 'addr2']) if (k in body) u[k] = str(body[k], 200);
  if (body.password) { if (String(body.password).length < 6) fail(400, '비밀번호는 6자 이상'); u.pw = hash(String(body.password)); }
  save(); return pub(u);
});
on('GET', '/api/me/orders', ({ req }) => { const u = needUser(req); return db.orders.filter(o => o.userId === u.id).reverse(); });

// 업로드 (원본 바이너리, 최대 20MB)
on('POST', '/api/upload', async ({ req }) => {
  const orig = decodeURIComponent(req.headers['x-filename'] || 'file');
  const ext = path.extname(orig).toLowerCase();
  if (!/^\.(pdf|ai|psd|eps|jpg|jpeg|png|zip|hwp|ppt|pptx|cdr|tif|tiff)$/.test(ext)) fail(400, '허용되지 않는 파일 형식입니다. (pdf, ai, psd, jpg, png, zip 등)');
  const buf = await req.read(20e6);
  const name = crypto.randomBytes(8).toString('hex') + ext;
  await io.saveUpload(name, buf);
  return { url: '/uploads/' + name, name: orig, size: buf.length };
});

// 주문
on('POST', '/api/orders', async ({ req, body }) => {
  const user = userOf(req);
  if (!Array.isArray(body.items) || !body.items.length) fail(400, '주문할 상품이 없습니다.');
  const items = body.items.map(it => {
    const p = db.products.find(p => p.id === it.pid && p.active) || fail(400, '판매 중지되었거나 없는 상품이 있습니다.');
    if (p.soldout) fail(400, `품절된 상품이 있습니다: ${p.name}`);
    const count = Math.max(1, Math.min(99, parseInt(it.count) || 1));
    const { unit, chosen } = priceOf(p, it.opts, it.qty);
    return { pid: p.id, name: p.name, cat: p.cat, qty: Number(it.qty), count, opts: chosen, price: unit * count, file: it.file ? { url: str(it.file.url), name: str(it.file.name) } : null, memo: str(it.memo, 300) };
  });
  const sub = items.reduce((a, i) => a + i.price, 0);
  const shipFee = sub >= db.settings.freeShipOver ? 0 : db.settings.shipFee;
  let usePoints = 0;
  if (user) usePoints = Math.max(0, Math.min(parseInt(body.usePoints) || 0, user.points, sub));
  const total = sub + shipFee - usePoints;
  const ship = { name: str(body.ship?.name, 30), phone: str(body.ship?.phone, 20), zip: str(body.ship?.zip, 10), addr: str(body.ship?.addr, 200), addr2: str(body.ship?.addr2, 200), msg: str(body.ship?.msg, 200) };
  if (!ship.name || !ship.phone || !ship.addr) fail(400, '받는 분 이름, 연락처, 주소를 입력하세요.');
  const pay = body.pay === 'card' ? 'card' : 'bank';
  const d = new Date();
  const no = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(db.seq.order++).padStart(4, '0')}`;
  const order = {
    no, userId: user?.id ?? null, orderer: user ? user.name : ship.name, items, sub, shipFee, usePoints, total, ship, pay,
    depositor: str(body.depositor, 30), taxInvoice: !!body.taxInvoice, bizNo: str(body.bizNo, 20),
    status: pay === 'card' ? '결제완료' : '입금대기', memo: '', createdAt: d.toISOString(),
  };
  if (user) { user.points -= usePoints; if (pay === 'card') user.points += Math.floor(total * db.settings.pointRate / 100); }
  db.orders.push(order); save();
  return order;
});
on('POST', '/api/orders/lookup', async ({ body }) => {
  const o = db.orders.find(o => o.no === str(body.no) && o.ship.phone.replace(/\D/g, '') === str(body.phone).replace(/\D/g, ''));
  return o || fail(404, '일치하는 주문이 없습니다.');
});
on('POST', '/api/orders/:no/cancel', async ({ req, params, body }) => {
  const o = db.orders.find(o => o.no === params.no) || fail(404, '주문 없음');
  const user = userOf(req);
  const ok = (user && o.userId === user.id) || (!o.userId && o.ship.phone.replace(/\D/g, '') === str(body.phone).replace(/\D/g, ''));
  if (!ok) fail(403, '권한이 없습니다.');
  if (!['입금대기', '결제완료'].includes(o.status)) fail(400, '제작이 시작된 주문은 취소할 수 없습니다. 고객센터로 문의하세요.');
  o.status = '취소';
  if (user) user.points += o.usePoints;
  save(); return o;
});

// 게시판 (notice, faq, proof: 공개 / inquiry: 비밀글 지원)
on('GET', '/api/posts/:board', ({ req, params }) => {
  const user = userOf(req);
  return db.posts.filter(p => p.board === params.board && !p.hidden).reverse().map(p => {
    const mine = user && p.userId === user.id;
    const secret = p.secret && !mine;
    return { id: p.id, title: p.title, author: params.board === 'inquiry' || params.board === 'proof' ? mask(p.author) : p.author, createdAt: p.createdAt, secret: !!p.secret, answered: !!p.reply, content: secret ? null : p.content, reply: secret ? null : p.reply };
  });
});
on('POST', '/api/posts/:board', async ({ req, params, body }) => {
  if (!['inquiry', 'proof'].includes(params.board)) fail(403, '작성할 수 없는 게시판입니다.');
  const user = needUser(req);
  const title = str(body.title, 100), content = str(body.content, 3000);
  if (!title || !content) fail(400, '제목과 내용을 입력하세요.');
  db.posts.push({ id: db.seq.post++, board: params.board, title, content, author: user.name, userId: user.id, secret: !!body.secret, createdAt: new Date().toISOString() });
  save(); return { ok: true };
});

// ---------- 관리자 ----------
on('POST', '/api/admin/login', async ({ body }) => {
  if (!ADMIN_PW) fail(503, '관리자 비밀번호(ADMIN_PW)가 설정되지 않았습니다.');
  const a = Buffer.from(str(body.id)), b = Buffer.from(ADMIN_ID);
  const c = Buffer.from(str(body.password)), d = Buffer.from(ADMIN_PW);
  if (a.length !== b.length || c.length !== d.length || !crypto.timingSafeEqual(a, b) || !crypto.timingSafeEqual(c, d)) fail(401, '관리자 정보가 올바르지 않습니다.');
  const t = token(); db.adminSessions[t] = Date.now(); save(); return { token: t };
});
on('GET', '/api/admin/dashboard', ({ req }) => { needAdmin(req); return dashboard(); });

on('GET', '/api/admin/products', ({ req }) => { needAdmin(req); return db.products; });
const cleanProduct = (b, old = {}) => {
  const tiersIn = (b.tiers || []).map(t => ({ qty: Number(t.qty), price: Number(t.price) })).filter(t => t.qty > 0 && t.price >= 0);
  if (!str(b.name) || !tiersIn.length) fail(400, '상품명과 수량/가격(1개 이상)이 필요합니다.');
  const options = (b.options || []).map(g => ({ name: str(g.name, 30), choices: (g.choices || []).map(c => ({ label: str(c.label, 40), add: Number(c.add) || 0 })).filter(c => c.label) })).filter(g => g.name && g.choices.length);
  return { ...old, name: str(b.name, 100), cat: str(b.cat, 40), spec: str(b.spec, 200), desc: str(b.desc, 2000), icon: str(b.icon, 8) || '📦', sub: str(b.sub, 40), detail: (Array.isArray(b.detail) ? b.detail : []).slice(0, 60).map(d => d.type === 'image' ? { type: 'image', url: IMG_OK(d.url) ? d.url : '', caption: str(d.caption, 200) } : { type: 'text', text: str(d.text, 5000) }).filter(d => d.type === 'image' ? d.url : d.text), also: (Array.isArray(b.also) ? b.also : []).map(a => ({ cat: str(a.cat, 40), sub: str(a.sub, 40) })).filter(a => a.cat).slice(0, 3), unit: str(b.unit, 6) || '개', soldout: !!b.soldout, img: /^\/img\/[\w\/.-]+$/.test(str(b.img)) ? str(b.img) : (old.img || ''), badge: str(b.badge, 10), discount: Math.max(0, Math.min(90, Number(b.discount) || 0)), hit: !!b.hit, best: !!b.best, active: b.active !== false, order: Number(b.order) || old.order || 999, tiers: tiersIn, options };
};
on('POST', '/api/admin/products', async ({ req, body }) => {
  needAdmin(req);
  const id = str(body.id, 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'p' + Date.now();
  if (db.products.some(p => p.id === id)) fail(409, '이미 존재하는 상품 코드입니다.');
  const p = { id, views: 0, createdAt: new Date().toISOString(), ...cleanProduct(body) };
  db.products.push(p); save(); return p;
});
on('PUT', '/api/admin/products/:id', async ({ req, params, body }) => {
  needAdmin(req);
  const i = db.products.findIndex(p => p.id === params.id); if (i < 0) fail(404, '상품 없음');
  db.products[i] = cleanProduct(body, db.products[i]); save(); return db.products[i];
});
on('DELETE', '/api/admin/products/:id', ({ req, params }) => { needAdmin(req); db.products = db.products.filter(p => p.id !== params.id); save(); return { ok: true }; });

on('GET', '/api/admin/orders', ({ req, query }) => {
  needAdmin(req);
  let l = db.orders.slice().reverse();
  if (query.status) l = l.filter(o => o.status === query.status);
  if (query.q) l = l.filter(o => (o.no + o.orderer + o.ship.name + o.ship.phone).includes(query.q));
  return l;
});
on('PUT', '/api/admin/orders/:no', async ({ req, params, body }) => {
  needAdmin(req);
  const o = db.orders.find(o => o.no === params.no) || fail(404, '주문 없음');
  if (body.status) {
    if (!ORDER_STATUS.includes(body.status)) fail(400, '잘못된 상태');
    const wasPaid = ['결제완료', '시안확인중', '제작중', '배송중', '배송완료'].includes(o.status);
    const u = db.users.find(u => u.id === o.userId);
    if (u && !wasPaid && o.pay === 'bank' && ['결제완료', '시안확인중', '제작중', '배송중', '배송완료'].includes(body.status)) u.points += Math.floor(o.total * db.settings.pointRate / 100);
    if (u && o.status !== '취소' && body.status === '취소') u.points += o.usePoints;
    o.status = body.status;
  }
  if ('memo' in body) o.memo = str(body.memo, 500);
  if ('tracking' in body) o.tracking = str(body.tracking, 60);
  save(); return o;
});
on('DELETE', '/api/admin/orders/:no', ({ req, params }) => { needAdmin(req); db.orders = db.orders.filter(o => o.no !== params.no); save(); return { ok: true }; });

on('GET', '/api/admin/users', ({ req }) => { needAdmin(req); return db.users.map(u => ({ ...pub(u), blocked: !!u.blocked, orders: db.orders.filter(o => o.userId === u.id).length, spent: db.orders.filter(o => o.userId === u.id && o.status !== '취소').reduce((a, o) => a + o.total, 0) })); });
on('PUT', '/api/admin/users/:id', async ({ req, params, body }) => {
  needAdmin(req);
  const u = db.users.find(u => u.id === Number(params.id)) || fail(404, '회원 없음');
  if ('points' in body) u.points = Math.max(0, parseInt(body.points) || 0);
  if ('blocked' in body) u.blocked = !!body.blocked;
  if (body.resetPw) u.pw = hash(String(body.resetPw));
  save(); return pub(u);
});
on('DELETE', '/api/admin/users/:id', ({ req, params }) => { needAdmin(req); db.users = db.users.filter(u => u.id !== Number(params.id)); save(); return { ok: true }; });

on('GET', '/api/admin/posts', ({ req, query }) => { needAdmin(req); return db.posts.filter(p => !query.board || p.board === query.board).reverse(); });
on('POST', '/api/admin/posts', async ({ req, body }) => {
  needAdmin(req);
  if (!['notice', 'faq'].includes(body.board)) fail(400, '공지/FAQ만 작성 가능합니다.');
  db.posts.push({ id: db.seq.post++, board: body.board, title: str(body.title, 100), content: str(body.content, 3000), author: '관리자', createdAt: new Date().toISOString() });
  save(); return { ok: true };
});
on('PUT', '/api/admin/posts/:id', async ({ req, params, body }) => {
  needAdmin(req);
  const p = db.posts.find(p => p.id === Number(params.id)) || fail(404, '글 없음');
  if ('title' in body) p.title = str(body.title, 100);
  if ('content' in body) p.content = str(body.content, 3000);
  if ('reply' in body) p.reply = str(body.reply, 3000) || undefined;
  if ('hidden' in body) p.hidden = !!body.hidden;
  save(); return p;
});
on('DELETE', '/api/admin/posts/:id', ({ req, params }) => { needAdmin(req); db.posts = db.posts.filter(p => p.id !== Number(params.id)); save(); return { ok: true }; });

// ---- 이미지 업로드 (관리자 전용, 썸네일/상세/배너에 사용)
const IMG_OK = u => /^\/img\/[\w\/.-]+$/.test(String(u || '')) && !String(u).includes('..');
on('POST', '/api/admin/upload-image', async ({ req }) => {
  needAdmin(req);
  const orig = decodeURIComponent(req.headers['x-filename'] || 'image');
  const ext = path.extname(orig).toLowerCase();
  if (!/^\.(jpg|jpeg|png|webp|gif)$/.test(ext)) fail(400, 'jpg, png, webp, gif 이미지만 업로드할 수 있습니다.');
  const buf = await req.read(8e6);
  const sig = buf.subarray(0, 4).toString('latin1');
  if (!(sig.startsWith('\xff\xd8') || sig.startsWith('\x89PNG') || sig.startsWith('GIF8') || sig.startsWith('RIFF'))) fail(400, '올바른 이미지 파일이 아닙니다.');
  const name = Date.now().toString(36) + crypto.randomBytes(4).toString('hex') + ext;
  await io.saveImage(name, buf);
  return { url: '/img/uploads/' + name, name: orig, size: buf.length };
});

// ---- 상품 노출 순서
on('PUT', '/api/admin/product-order', async ({ req, body }) => {
  needAdmin(req);
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const pos = new Map(ids.map((id, i) => [id, i + 1]));
  let n = ids.length;
  db.products.forEach(p => { p.order = pos.get(p.id) ?? ++n; });
  save(); return { ok: true };
});

// ---- 메뉴 관리: 상단메뉴(tops) + 그룹(categories) 추가/수정/삭제/순서/노출
on('GET', '/api/admin/menu', ({ req }) => { needAdmin(req); return { tops: db.tops, categories: db.categories }; });
on('PUT', '/api/admin/menu', async ({ req, body }) => {
  needAdmin(req);
  const tops = (Array.isArray(body.tops) ? body.tops : []).map(t => ({ name: str(t.name, 30), old: str(t.old || t.name, 30), active: t.active !== false })).filter(t => t.name);
  if (!tops.length) fail(400, '상단메뉴가 1개 이상 필요합니다.');
  if (new Set(tops.map(t => t.name)).size !== tops.length) fail(400, '상단메뉴 이름이 중복되었습니다.');
  const topMap = Object.fromEntries(tops.map(t => [t.old, t.name]));
  const cats = (Array.isArray(body.categories) ? body.categories : []).map((c, i) => ({
    old: str(c.old || c.name, 40), id: str(c.name, 40), name: str(c.name, 40), top: topMap[str(c.top, 30)] || str(c.top, 30), order: i + 1,
    icon: str(c.icon, 8) || '📦', bg: /^#[0-9a-fA-F]{6}$/.test(str(c.bg)) ? str(c.bg) : '#e5e7eb', active: c.active !== false,
    subs: [...new Set((c.subs || []).map(s => str(s, 40)).filter(Boolean))],
  }));
  if (cats.some(c => !c.id)) fail(400, '그룹명을 입력하세요.');
  if (new Set(cats.map(c => c.id)).size !== cats.length) fail(400, '그룹명이 중복되었습니다.');
  if (cats.some(c => !tops.some(t => t.name === c.top))) fail(400, '존재하지 않는 상단메뉴를 지정한 그룹이 있습니다.');
  const catMap = Object.fromEntries(cats.map(c => [c.old, c]));
  const lost = [];
  const mapCl = a => { const c = catMap[a.cat]; return c && (!a.sub || c.subs.includes(a.sub)) ? { cat: c.id, sub: a.sub } : null; };
  const nextProducts = db.products.map(p => {
    const main = mapCl({ cat: p.cat, sub: p.sub });
    if (!main) { lost.push(p); return p; }
    const also = (p.also || []).map(mapCl).filter(Boolean);
    return { ...p, cat: main.cat, sub: main.sub, also };
  });
  if (lost.length) fail(400, `삭제/변경하려는 분류에 상품이 있습니다: ${lost.slice(0, 3).map(p => p.name).join(', ')}${lost.length > 3 ? ` 외 ${lost.length - 3}개` : ''}. 상품의 분류를 먼저 옮겨 주세요.`);
  db.products = nextProducts;
  db.tops = tops.map(t => ({ name: t.name, active: t.active }));
  db.categories = cats.map(({ old, ...c }) => c);
  save(); return { tops: db.tops, categories: db.categories };
});

// ---- 주요서비스(홈 아이콘 메뉴) 관리
const cleanLink = l => { l = str(l, 300); return /^(#\/|\/|https?:\/\/)/.test(l) ? l : '#/list'; };
on('GET', '/api/admin/quick', ({ req }) => { needAdmin(req); return db.quickMenus; });
on('PUT', '/api/admin/quick', async ({ req, body }) => {
  needAdmin(req);
  db.quickMenus = (Array.isArray(body) ? body : []).map(q => ({ name: str(q.name, 30), icon: str(q.icon, 8) || '📦', bg: /^#[0-9a-fA-F]{6}$/.test(str(q.bg)) ? str(q.bg) : '#e5e7eb', link: cleanLink(q.link), active: q.active !== false }))
    .filter(q => q.name).map((q, i) => ({ id: i + 1, ...q }));
  save(); return db.quickMenus;
});

// ---- 디자인템플릿 / 내 디자인
const COLOR_RE = /^(none|#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\))$/;
const clr = (v, d = '#000000') => (COLOR_RE.test(String(v)) ? String(v) : d);
const nn = (v, d = 0, min = -1e5, max = 1e5) => (Number.isFinite(+v) ? Math.min(max, Math.max(min, +v)) : d);
const HREF_RE = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|\/[\w\/.-]+)$/;
function cleanDoc(d) {
  if (!d || typeof d !== 'object') fail(400, '잘못된 디자인 데이터입니다.');
  if (!(+d.w >= 100 && +d.w <= 6000 && +d.h >= 100 && +d.h <= 6000)) fail(400, '디자인 크기가 올바르지 않습니다. (100~6000px)');
  const w = +d.w, h = +d.h;
  const els = (Array.isArray(d.elements) ? d.elements : []).slice(0, 150).map((e, i) => {
    if (!e || typeof e !== 'object') return null;
    const base = { id: String(e.id || 'e' + i).replace(/[^\w-]/g, '').slice(0, 20) || 'e' + i, type: e.type, x: nn(e.x), y: nn(e.y), opacity: nn(e.opacity, 1, 0, 1), hidden: !!e.hidden, rot: nn(e.rot, 0, -360, 360) };
    const fx = (e.grad && COLOR_RE.test(String(e.grad.a)) && COLOR_RE.test(String(e.grad.b)) ? { grad: { a: String(e.grad.a), b: String(e.grad.b), ang: nn(e.grad.ang, 45, -360, 360) } } : {});
    const box = { w: nn(e.w, 100, 1, 12000), h: nn(e.h, 100, 1, 12000) };
    switch (e.type) {
      case 'text': return { ...base, text: String(e.text ?? '').slice(0, 2000), size: nn(e.size, 40, 4, 1500), fill: clr(e.fill), weight: [400, 500, 600, 700, 800, 900].includes(+e.weight) ? +e.weight : 400, family: /^[\w \-가-힣]{1,40}$/.test(String(e.family)) ? e.family : 'Malgun Gothic', align: ['left', 'center', 'right'].includes(e.align) ? e.align : 'left', lh: nn(e.lh, 1.3, 0.8, 3), ls: nn(e.ls, 0, -20, 100), italic: !!e.italic };
      case 'rect': return { ...base, ...box, ...fx, shadow: !!e.shadow, fill: clr(e.fill, 'none'), stroke: clr(e.stroke, 'none'), sw: nn(e.sw, 0, 0, 200), rx: nn(e.rx, 0, 0, 2000) };
      case 'ellipse': return { ...base, ...box, ...fx, shadow: !!e.shadow, fill: clr(e.fill, 'none'), stroke: clr(e.stroke, 'none'), sw: nn(e.sw, 0, 0, 200) };
      case 'icon': return { ...base, ...box, shape: 'tooth', fill: clr(e.fill) };
      case 'image': return HREF_RE.test(String(e.href)) ? { ...base, ...box, href: String(e.href), brightness: nn(e.brightness, 1, 0, 3), contrast: nn(e.contrast, 1, 0, 3), saturate: nn(e.saturate, 1, 0, 3), blur: nn(e.blur, 0, 0, 50), gray: !!e.gray } : null;
      default: return null;
    }
  }).filter(Boolean);
  const doc = { w, h, bg: clr(d.bg, '#ffffff'), elements: els };
  if (JSON.stringify(doc).length > 6e6) fail(413, '디자인 용량이 너무 큽니다. 이미지를 줄여 주세요.');
  return doc;
}
const cleanThumb = t => (/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(t)) && String(t).length < 300000 ? String(t) : '');
const tplPublic = t => t;
on('GET', '/api/templates', () => db.templates.filter(t => t.active).sort((a, b) => a.order - b.order));
on('GET', '/api/templates/:id', ({ params }) => db.templates.find(t => t.id === params.id && t.active) || fail(404, '템플릿을 찾을 수 없습니다.'));

on('GET', '/api/me/designs', ({ req }) => { const u = needUser(req); return db.designs.filter(d => d.userId === u.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ doc, ...d }) => d); });
on('GET', '/api/designs/:id', ({ req, params }) => { const u = needUser(req); return db.designs.find(d => d.id === params.id && d.userId === u.id) || fail(404, '디자인을 찾을 수 없습니다.'); });
on('POST', '/api/designs', async ({ req, body }) => {
  const u = needUser(req);
  const tpl = db.templates.find(t => t.id === str(body.templateId, 60)) || fail(400, '템플릿 정보가 올바르지 않습니다.');
  const doc = cleanDoc(body.doc), name = str(body.name, 60) || tpl.name, now = new Date().toISOString();
  let d = body.id && db.designs.find(x => x.id === str(body.id, 30) && x.userId === u.id);
  if (d) Object.assign(d, { name, doc, thumb: cleanThumb(body.thumb) || d.thumb, updatedAt: now });
  else {
    if (db.designs.filter(x => x.userId === u.id).length >= 30) fail(400, '저장할 수 있는 디자인은 최대 30개입니다. 기존 디자인을 삭제해 주세요.');
    d = { id: 'd' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'), userId: u.id, templateId: tpl.id, name, doc, thumb: cleanThumb(body.thumb), createdAt: now, updatedAt: now };
    db.designs.push(d);
  }
  save(); return { id: d.id, name: d.name };
});
on('DELETE', '/api/designs/:id', ({ req, params }) => { const u = needUser(req); db.designs = db.designs.filter(d => !(d.id === params.id && d.userId === u.id)); save(); return { ok: true }; });

// 관리자: 템플릿 관리
const cleanTplMeta = (b, old = {}) => ({
  ...old, name: str(b.name, 60) || old.name, category: str(b.category, 30) || old.category || '기타', mm: str(b.mm, 30) || old.mm || '',
  products: (Array.isArray(b.products) ? b.products : old.products || []).map(p => str(p, 60)).filter(p => db.products.some(x => x.id === p)).slice(0, 30),
  tags: (Array.isArray(b.tags) ? b.tags : old.tags || []).map(t => str(t, 20)).filter(Boolean).slice(0, 8), active: b.active !== false, order: nn(b.order, old.order || 999, 0, 99999),
});
on('GET', '/api/admin/templates', ({ req }) => { needAdmin(req); return db.templates.slice().sort((a, b) => a.order - b.order); });
on('POST', '/api/admin/templates', async ({ req, body }) => {
  needAdmin(req);
  const doc = cleanDoc(body.doc);
  const t = { id: 'custom-' + Date.now().toString(36), custom: true, w: doc.w, h: doc.h, bg: doc.bg, elements: doc.elements, ...cleanTplMeta(body, { order: db.templates.length + 1 }) };
  if (!t.name) fail(400, '템플릿 이름을 입력하세요.');
  db.templates.push(t); save(); return t;
});
on('PUT', '/api/admin/templates/:id', async ({ req, params, body }) => {
  needAdmin(req);
  const i = db.templates.findIndex(t => t.id === params.id); if (i < 0) fail(404, '템플릿 없음');
  db.templates[i] = cleanTplMeta(body, db.templates[i]);
  if (body.doc) { const doc = cleanDoc(body.doc); Object.assign(db.templates[i], { w: doc.w, h: doc.h, bg: doc.bg, elements: doc.elements }); }
  save(); return db.templates[i];
});
on('PUT', '/api/admin/template-order', async ({ req, body }) => {
  needAdmin(req);
  const pos = new Map((Array.isArray(body.ids) ? body.ids : []).map((id, i) => [id, i + 1]));
  let n = pos.size; db.templates.forEach(t => { t.order = pos.get(t.id) ?? ++n; }); save(); return { ok: true };
});
on('DELETE', '/api/admin/templates/:id', ({ req, params }) => { needAdmin(req); db.templates = db.templates.filter(t => t.id !== params.id); save(); return { ok: true }; });
on('GET', '/api/admin/banners', ({ req }) => { needAdmin(req); return db.banners; });
on('PUT', '/api/admin/banners', async ({ req, body }) => {
  needAdmin(req);
  db.banners = (body || []).map((b, i) => ({ id: i + 1, title: str(b.title, 80), sub: str(b.sub, 120), color: str(b.color, 9) || '#1d4ed8', color2: str(b.color2, 9) || '#06b6d4', link: str(b.link, 100) || '#/list', img: /^\/img\/[\w\/.-]+$/.test(str(b.img)) ? str(b.img) : '', active: b.active !== false }));
  save(); return db.banners;
});
on('GET', '/api/admin/settings', ({ req }) => { needAdmin(req); return db.settings; });
on('PUT', '/api/admin/settings', async ({ req, body }) => {
  needAdmin(req);
  for (const k of Object.keys(db.settings)) if (k in body) db.settings[k] = typeof db.settings[k] === 'number' ? Number(body[k]) || 0 : str(body[k], 300);
  save(); return db.settings;
});

  const RAW_BODY = ['/api/upload', '/api/admin/upload-image', '/api/convert'];
  // 요청 처리: { method, pathname, query, headers, ip, read(limit)->Promise<Buffer> }
  async function dispatch({ method, pathname, query, headers, ip, read }) {
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(pathname); if (!m) continue;
      let body = {};
      if (['POST', 'PUT'].includes(method) && !RAW_BODY.includes(pathname)) {
        const b = await read(/^\/api\/(designs|admin\/templates)/.test(pathname) ? 8e6 : 1e6);
        try { body = b.length ? JSON.parse(b.toString('utf8')) : {}; } catch { fail(400, '잘못된 요청입니다.'); }
      }
      return r.fn({ req: { headers, ip, read }, body, params: m.groups || {}, query });
    }
    return fail(404, '존재하지 않는 API입니다.');
  }
  const isAdminToken = t => !!db.adminSessions[t || ''];
  return { on, dispatch, isAdminToken, HttpError, fail, str };
}
module.exports = { createApp, HttpError, fail };
