// 쇼핑몰 프론트 (해시 라우팅 SPA)
const $ = s => document.querySelector(s);
const won = n => Number(n).toLocaleString('ko-KR') + '원';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = s => (s || '').slice(0, 10);
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const S = { shop: null, user: null, token: localStorage.getItem('token') || '' };
let cart = ls('cart', []);
const saveCart = () => { localStorage.setItem('cart', JSON.stringify(cart)); renderQuick(); };

async function api(url, method = 'GET', body) {
  const h = { 'Content-Type': 'application/json' };
  if (S.token) h.Authorization = 'Bearer ' + S.token;
  const r = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '오류가 발생했습니다.');
  return j;
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message); } };

// 썸네일 (이미지 대신 이모지 + 분류별 배경)
const catBg = c => (S.shop.categories.find(x => x.id === c) || {}).bg || '#e5e7eb';
const disc = (price, d) => d ? Math.round(price / (1 - d / 100) / 100) * 100 : price;
const pic = p => p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : esc(p.icon);
function card(p) {
  const t = p.tiers[0];
  return `<a class="card" href="#/p/${p.id}"><div class="thumb" style="background:${catBg(p.cat)}">${p.soldout ? '<span class="badge" style="background:#6b7280">SOLD OUT</span>' : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}${pic(p)}${p.discount ? `<span class="dcbar">${p.discount} %</span>` : ''}</div>
  <div class="info"><div class="nm">${esc(p.name)}</div><div class="sp">${esc(p.spec)}</div>
  <div class="price">${p.discount ? `<span class="dc">${p.discount}%</span>` : ''}<b>${won(t.price)}</b>~${p.discount ? `<s>${won(disc(t.price, p.discount))}</s>` : ''}</div></div></a>`;
}

// 상단메뉴 > 그룹 > 세부항목 트리 (판매 중인 상품이 있는 항목만 노출)
const topOf = cat => (S.shop.categories.find(c => c.id === cat) || {}).top || '';
const listLink = (cat, sub) => `#/list?cat=${encodeURIComponent(cat)}${sub ? '&sub=' + encodeURIComponent(sub) : ''}`;
function tree() {
  const prods = S.products || [];
  const inCat = (c, s) => prods.some(p => [{ cat: p.cat, sub: p.sub }, ...(p.also || [])].some(a => a.cat === c && (!s || a.sub === s)));
  return (S.shop.tops || []).map(top => {
    const all = (S.shop.showAll || []).includes(top);
    return { top, cats: S.shop.categories.filter(c => c.top === top && (all || inCat(c.id))).map(c => ({ ...c, subs: all ? c.subs : c.subs.filter(s => inCat(c.id, s)) })) };
  }).filter(t => t.cats.length);
}
// ---------- 공통 레이아웃 ----------
function renderChrome() {
  const s = S.shop.settings, u = S.user;
  $('#topbar').innerHTML = `<div class="wrap"><span>${s.notice ? `📢 ${esc(s.notice)}` : ''}</span><span>${u
    ? `<b>${esc(u.name)}</b>님 (${u.points.toLocaleString()}P) <a href="#/my">마이페이지</a><a href="#" onclick="logout();return false">로그아웃</a>`
    : `<a href="#/login">로그인</a><a href="#/signup">회원가입</a><a href="#/lookup">비회원 주문조회</a>`}<a class="tb-m" href="#/board/inquiry">문의하기</a><a class="tb-m tb-cart" href="#/cart">장바구니(${cart.length})</a></span></div>`;
  const cur = location.hash.split('?')[0];
  const qs = new URLSearchParams(location.hash.split('?')[1] || ''), catQ = qs.get('cat');
  $('#header').innerHTML = `<div class="wrap hd-main"><a class="logo" href="#/">${esc(s.shopName)}<small>치과 인쇄물 전문</small></a>
  <form class="search" onsubmit="location.hash='#/list?q='+encodeURIComponent(this.q.value);return false"><input name="q" placeholder="상품명을 검색하세요 (예: 명함, 차트)"><button>검색</button></form>
  <div class="hd-links"><a href="#/templates">디자인템플릿</a><a href="#/board/inquiry">문의하기</a><a href="#/cart">장바구니(${cart.length})</a></div></div>
  <nav class="gnb"><div class="wrap"><div class="gi"><a class="dent ${cur === '#/list' && !qs.get('top') && !catQ ? 'on' : ''}" href="#/list">전체상품</a></div>
  <div class="gi"><a class="bg-tpl ${cur === '#/templates' || cur.startsWith('#/editor') ? 'on' : ''}" href="#/templates">템플릿</a><div class="sub"><a href="#/templates">전체 템플릿</a>${(S.tplCats || []).map(c => `<a href="#/templates?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}<a href="#/templates?mine=1">내 디자인</a></div></div>
  ${tree().map(t => `<div class="gi"><a class="${t.top === '치과인쇄' ? 'bg-dental' : ''} ${qs.get('top') === t.top || t.cats.some(c => c.id === catQ) ? 'on' : ''}" href="#/list?top=${encodeURIComponent(t.top)}">${esc(t.top)}</a>
  <div class="mega"><div class="mega-in">${t.cats.map(c => `<div class="mcol"><a class="mh" href="${listLink(c.id)}">${esc(c.name)}</a>${c.subs.map(s => `<a href="${listLink(c.id, s)}">${esc(s)}</a>`).join('')}</div>`).join('')}</div></div></div>`).join('')}
  <div class="gi"><a href="#/board/notice">고객센터</a><div class="sub"><a href="#/board/notice">공지사항</a><a href="#/board/faq">FAQ</a><a href="#/board/inquiry">1:1 문의</a><a href="#/templates">디자인템플릿</a><a href="#/board/proof">시안교정</a></div></div>
  <div class="gi"><a class="bg-tool ${cur.startsWith('#/tools') ? 'on' : ''}" href="#/tools">무료파일변환</a><div class="sub">${(window.FileTools ? FileTools.TOOLS : []).map(t => `<a href="#/tools/${t.id}">${esc(t.name)}</a>`).join('')}</div></div></div></nav>`;
  // 메가메뉴가 화면 오른쪽 밖으로 넘치면 넘친 만큼 왼쪽으로 당겨서 보여줌
  document.querySelectorAll('#header .gnb .gi').forEach(g => {
    const m = g.querySelector('.mega'); if (!m) return;
    g.addEventListener('mouseenter', () => {
      m.style.left = '';
      const over = m.getBoundingClientRect().right - (document.documentElement.clientWidth - 16);
      if (over > 0) m.style.left = -over + 'px';
    });
  });
  $('#footer').innerHTML = `<div class="wrap"><div class="fl"><a href="#/board/notice">공지사항</a><a href="#/board/faq">FAQ</a><a href="#/board/inquiry">1:1문의</a><a href="#/lookup">주문조회</a><a href="#/tools">무료파일변환</a><a href="/admin/">관리자</a></div>
  <div class="cols"><div><b>${esc(s.company)}</b><span class="bar"> | </span>대표: ${esc(s.ceo)}<span class="bar"> | </span>사업자등록번호: ${esc(s.bizNo)}<br>주소: ${esc(s.address)}<br>대표번호: ${esc(s.phone)}<span class="bar"> | </span>e-mail: ${esc(s.email)}${s.fax ? `<span class="bar"> | </span>FAX: ${esc(s.fax)}` : ''}</div>
  <div><b>고객센터 운영시간</b><br>${esc(s.hours)}</div><div><b>무통장 입금계좌</b><br>${esc(s.bank)}</div></div>
  <p style="margin-top:14px">© ${esc(s.company)}. 본 사이트의 상품 이미지 및 콘텐츠를 무단 복제할 수 없습니다.</p></div>`;
  renderQuick();
}
function renderQuick() {
  $('#quick').innerHTML = `<a href="#/my"><span>👤</span>마이</a><a href="#/cart"><span>🛒</span>장바구니${cart.length ? `<i>${cart.length}</i>` : ''}</a>
  <a href="#/board/inquiry"><span>💬</span>문의</a><button onclick="scrollTo({top:0,behavior:'smooth'})"><span>⬆</span>TOP</button>`;
  document.querySelectorAll('.hd-links a:last-child, .tb-cart').forEach(h => { h.textContent = `장바구니(${cart.length})`; });
}
window.logout = async () => { try { await api('/api/auth/logout', 'POST'); } catch {} S.token = ''; S.user = null; localStorage.removeItem('token'); renderChrome(); location.hash = '#/'; };

// ---------- 페이지 ----------
const pages = {};

pages.home = async () => {
  const [hit, best] = await Promise.all([api('/api/products?hit=1'), api('/api/products?best=1')]);
  const [notice, tpls] = await Promise.all([api('/api/posts/notice'), api('/api/templates')]);
  const ban = S.shop.banners;
  
  // 메인 롤링배너: 자동 넘김 + 화살표/점 클릭 + 마우스 드래그 + 터치 스와이프
  setTimeout(() => {
    clearInterval(window._hero);
    const hero = document.querySelector('.hero'); if (!hero) return;
    const sl = [...hero.querySelectorAll('.slide')], dots = [...hero.querySelectorAll('.dots i')], n = sl.length;
    let i = 0, drag = null, suppress = false;
    const pos = (k, dx) => {   // 현재 슬라이드는 0, 다음은 +1, 이전은 -1 (드래그 방향 쪽 이웃을 우선 배치)
      if (k === i) return 0;
      const nx = (i + 1) % n, pv = (i - 1 + n) % n;
      if (dx > 0 && k === pv) return -1;
      if (dx <= 0 && k === nx) return 1;
      return k === nx ? 1 : k === pv ? -1 : 2;
    };
    const place = (dx = 0, anim = true) => {
      sl.forEach((s, k) => { s.style.transition = anim ? '' : 'none'; s.style.transform = `translateX(calc(${pos(k, dx) * 100}% + ${dx}px))`; s.classList.toggle('on', k === i); });
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    const play = () => { clearInterval(window._hero); if (n > 1) window._hero = setInterval(() => go(i + 1), 4500); };
    const go = k => { i = ((k % n) + n) % n; place(); play(); };
    place(0, false); play();
    if (n < 2) return;
    dots.forEach((d, k) => { d.onclick = () => go(k); });
    hero.querySelector('.hero-nav.prev')?.addEventListener('click', () => go(i - 1));
    hero.querySelector('.hero-nav.next')?.addEventListener('click', () => go(i + 1));
    hero.addEventListener('mouseenter', () => clearInterval(window._hero));
    hero.addEventListener('mouseleave', () => { if (!drag) play(); });
    hero.addEventListener('pointerdown', e => {
      if ((e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.hero-nav, .dots')) return;
      drag = { x: e.clientX, t: Date.now(), moved: false, id: e.pointerId };
    });
    hero.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved) { if (Math.abs(dx) < 8) return; drag.moved = true; clearInterval(window._hero); hero.classList.add('dragging'); try { hero.setPointerCapture(drag.id); } catch { /* 무시 */ } }
      place(dx, false);
    });
    const end = e => {
      if (!drag) return;
      const d = drag; drag = null; hero.classList.remove('dragging');
      if (!d.moved) return;
      suppress = true; setTimeout(() => { suppress = false; }, 0);   // 드래그 직후 링크가 눌리지 않게
      const dx = e.clientX - d.x, w = hero.clientWidth, fast = Date.now() - d.t < 280 && Math.abs(dx) > 30;
      if (e.type !== 'pointercancel' && (Math.abs(dx) > Math.max(60, w * 0.15) || fast)) go(i + (dx < 0 ? 1 : -1)); else { place(); play(); }
    };
    hero.addEventListener('pointerup', end); hero.addEventListener('pointercancel', end);
    hero.addEventListener('click', e => { if (suppress) { e.preventDefault(); e.stopPropagation(); } }, true);
    hero.addEventListener('dragstart', e => e.preventDefault());
  });
  return `<section class="hero"><div class="hero-in">${ban.map((b, i) => b.img ? `<div class="slide imgslide ${i ? '' : 'on'}" style="background:url('${esc(b.img)}') center/contain no-repeat,linear-gradient(120deg,${esc(b.color)},${esc(b.color2)})"><a class="fill" href="${esc(b.link)}" aria-label="${esc(b.title)}"></a></div>` : `<div class="slide ${i ? '' : 'on'}" style="background:linear-gradient(120deg,${esc(b.color)},${esc(b.color2)})"><div class="wrap"><h2>${esc(b.title)}</h2><p>${esc(b.sub)}</p><a class="btn" href="${esc(b.link)}">상품 보러가기 →</a></div></div>`).join('')}</div>
  ${ban.length > 1 ? '<button class="hero-nav prev" aria-label="이전 배너">‹</button><button class="hero-nav next" aria-label="다음 배너">›</button>' : ''}
  <div class="dots">${ban.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div></section>
  <div class="wrap"><div class="iconsec"><div class="icons">${(S.shop.quickMenus || []).map(c => `<a href="${esc(c.link)}" style="--c:${esc(c.bg)}"><span>${esc(c.icon || '📦')}</span>${esc(c.name)}</a>`).join('')}</div></div>
  <section class="sec"><h2><span><em class="eyebrow">HOT PICKS</em>치과 히트상품</span> <a href="#/list">전체보기 →</a></h2><div class="grid">${hit.slice(0, 8).map(card).join('')}</div></section>
  <section class="sec"><h2><span><em class="eyebrow">BEST SELLERS</em>베스트 상품</span> <a href="#/list">전체보기 →</a></h2><div class="grid">${best.slice(0, 4).map(card).join('')}</div></section>
  <section class="quick3">
   <div class="box"><h3>공지사항 <a href="#/board/notice">더보기</a></h3><ul>${notice.slice(0, 5).map(n => `<li><span>${esc(n.title)}</span><span>${date(n.createdAt)}</span></li>`).join('')}</ul></div>
   <div class="box"><h3>디자인템플릿 <a href="#/templates">더보기</a></h3><ul>${tpls.slice(0, 5).map(n => `<li><a href="#/editor/${esc(n.id)}">${esc(n.name)}</a><span>${esc(n.category)}</span></li>`).join('') || '<li>등록된 템플릿이 없습니다.</li>'}</ul></div>
   <div class="box"><h3>고객센터</h3><div class="cs">${esc(S.shop.settings.phone)}</div><p style="color:var(--mute)">${esc(S.shop.settings.hours)}</p><p style="margin-top:10px"><b>입금계좌</b><br>${esc(S.shop.settings.bank)}</p></div></section></div>`;
};

pages.list = async (q) => {
  const params = new URLSearchParams(q);
  const top = params.get('top') || '', cat = params.get('cat') || '', sub = params.get('sub') || '', kw = params.get('q') || '', sort = params.get('sort') || '';
  let list = await api('/api/products?' + new URLSearchParams({ ...(cat && { cat }), ...(sub && { sub }), ...(kw && { q: kw }) }));
  if (top && !cat) { const ids = S.shop.categories.filter(c => c.top === top).map(c => c.id); list = list.filter(p => ids.includes(p.cat) || (p.also || []).some(a => ids.includes(a.cat))); }
  if (sort === 'low') list.sort((a, b) => a.tiers[0].price - b.tiers[0].price);
  if (sort === 'high') list.sort((a, b) => b.tiers[0].price - a.tiers[0].price);
  if (sort === 'dc') list.sort((a, b) => b.discount - a.discount);
  const mk = o => '#/list?' + new URLSearchParams({ ...(top && { top }), ...(cat && { cat }), ...(sub && { sub }), ...(kw && { q: kw }), ...(sort && { sort }), ...o });
  const catObj = S.shop.categories.find(c => c.id === cat);
  const topName = top || (catObj && catObj.top) || '';
  const t = tree();
  const tab = (label, href, on) => `<button class="${on ? 'on' : ''}" onclick="location.hash='${href}'">${esc(label)}</button>`;
  let tabs = '';
  if (catObj) tabs = tab('전체', listLink(cat), !sub) + (tree().flatMap(x => x.cats).find(c => c.id === cat)?.subs || []).map(s => tab(s, listLink(cat, s), sub === s)).join('');
  else if (top) tabs = t.filter(x => x.top === top).flatMap(x => x.cats).map(c => tab(c.name, listLink(c.id), false)).join('');
  return `<div class="wrap"><div class="crumb">홈${topName ? ` › <a href="#/list?top=${encodeURIComponent(topName)}">${esc(topName)}</a>` : ''}${cat ? ` › <a href="${listLink(cat)}">${esc(cat)}</a>` : ''}${sub ? ' › ' + esc(sub) : ''}${kw ? ` › 검색 "${esc(kw)}"` : ''}</div>
  <div class="layout"><aside class="side"><h3>전체 메뉴</h3>${t.map(x => `<a class="toph ${x.top === topName ? 'on' : ''}" href="#/list?top=${encodeURIComponent(x.top)}">${esc(x.top)}</a>${x.top === topName ? x.cats.map(c => `<a class="catl ${cat === c.id && !sub ? 'on' : ''}" href="${listLink(c.id)}">${esc(c.name)}</a>${cat === c.id ? c.subs.map(s => `<a class="subl ${sub === s ? 'on' : ''}" href="${listLink(c.id, s)}">└ ${esc(s)}</a>`).join('') : ''}`).join('') : ''}`).join('')}</aside>
  <section><div class="pagehead"><h1>${esc(sub || cat || top || '전체상품')}</h1></div>
  ${tabs ? `<div class="tabs">${tabs}</div>` : ''}
  <div class="sortbar"><span>총 <b>${list.length}</b>개 상품</span><select onchange="location.hash=this.value"><option value="${mk({ sort: '' })}">기본순</option><option value="${mk({ sort: 'low' })}" ${sort === 'low' ? 'selected' : ''}>낮은가격순</option><option value="${mk({ sort: 'high' })}" ${sort === 'high' ? 'selected' : ''}>높은가격순</option><option value="${mk({ sort: 'dc' })}" ${sort === 'dc' ? 'selected' : ''}>할인율순</option></select></div>
  ${list.length ? `<div class="grid" style="grid-template-columns:repeat(3,1fr)">${list.map(card).join('')}</div>` : '<div class="empty">조건에 맞는 상품이 없습니다.</div>'}</section></div></div>`;
};

pages.p = async (id) => {
  const p = await api('/api/products/' + id);
  window._p = p; window._sel = { qty: p.tiers[0].qty, opts: Object.fromEntries(p.options.map(g => [g.name, g.choices[0].label])), count: 1, file: null };
  setTimeout(recalc); setTimeout(applyPendingDesign);
  return `<div class="wrap"><div class="crumb">홈${topOf(p.cat) ? ` › <a href="#/list?top=${encodeURIComponent(topOf(p.cat))}">${esc(topOf(p.cat))}</a>` : ''} › <a href="#/list?cat=${encodeURIComponent(p.cat)}">${esc(p.cat)}</a>${p.sub ? ` › <a href="#/list?cat=${encodeURIComponent(p.cat)}&sub=${encodeURIComponent(p.sub)}">${esc(p.sub)}</a>` : ''}</div>
  <div class="pd"><div class="big" style="background:${catBg(p.cat)}">${pic(p)}</div><div>
  <h1>${esc(p.name)}</h1><div class="sp">${esc(p.spec)}</div>
  <div class="opt"><label>수량</label><div class="chips" id="qtys">${p.tiers.map((t, i) => `<button class="${i ? '' : 'on'}" onclick="pick('qty',${t.qty},this)">${t.qty.toLocaleString()}${esc(p.unit || '개')}</button>`).join('')}</div></div>
  ${p.options.map(g => `<div class="opt"><label>${esc(g.name)}</label><div class="chips">${g.choices.map((c, i) => `<button class="${i ? '' : 'on'}" onclick="pick('${esc(g.name)}','${esc(c.label)}',this)">${esc(c.label)}${c.add ? ` (+${c.add.toLocaleString()})` : ''}</button>`).join('')}</div></div>`).join('')}
  <div class="opt"><label>주문 건수</label><input type="number" id="cnt" min="1" max="99" value="1" style="width:90px" oninput="_sel.count=Math.max(1,Math.min(99,+this.value||1));recalc()"></div>
  <div class="opt"><label>디자인 파일</label><div><label class="upload" id="upl"><input type="file" hidden onchange="upload(this)">📎 클릭하여 인쇄 파일 첨부 (pdf, ai, psd, jpg, png, zip / 20MB)</label><div style="font-size:12px;color:var(--mute);margin-top:4px">파일이 없으면 비워두고 요청사항에 기재해 주세요. 시안 제작 후 안내드립니다.</div><a class="btn sm" style="margin-top:8px" href="#/templates?product=${esc(p.id)}">🎨 디자인템플릿으로 직접 만들기</a></div></div>
  <div class="opt"><label>요청사항</label><input id="memo" placeholder="병원명, 문구, 연락처 등 디자인 요청사항" maxlength="300"></div>
  <div class="totalbox"><div class="row"><span>정가</span><s id="orig" style="color:#9ca3af"></s></div><div class="row"><span>할인 ${p.discount}%</span><span id="dcamt" style="color:var(--red)"></span></div><div class="row"><b>결제금액</b><span class="bigp" id="tot"></span></div></div>
  ${p.soldout ? '<div class="btnrow"><button class="btn gray" disabled style="opacity:.7">품절된 상품입니다</button></div>' : '<div class="btnrow"><button class="btn ghost" onclick="addCart()">🛒 장바구니</button><button class="btn acc" onclick="buyNow()">바로주문</button></div>'}</div></div>
  <div class="tabbar"><a class="on">상품설명</a></div><div class="box" style="margin-bottom:20px"><p>${esc(p.desc)}</p>${(p.detail || []).map(d => d.type === 'image' ? `<figure class="dimg"><img src="${esc(d.url)}" alt="${esc(d.caption || p.name)}" loading="lazy">${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}</figure>` : `<p class="dtxt">${esc(d.text).replace(/\n/g, '<br>')}</p>`).join('')}<ul style="margin:12px 0 0 18px;color:var(--mute);line-height:2"><li>제작기간: 파일 확인 및 시안 승인 후 영업일 기준 3~7일</li><li>배송: 택배 (5만원 이상 무료배송, 미만 ${won(S.shop.settings.shipFee)})</li><li>인쇄물은 주문제작 상품으로 제작이 시작되면 취소/환불이 불가합니다.</li><li>색상은 모니터와 실제 인쇄물이 다를 수 있습니다.</li></ul></div></div>`;
};
window.pick = (k, v, el) => {
  if (k === 'qty') _sel.qty = v; else _sel.opts[k] = v;
  el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); recalc();
};
function calcUnit(p, sel) {
  let s = p.tiers.find(t => t.qty === sel.qty).price;
  for (const g of p.options) s += (g.choices.find(c => c.label === sel.opts[g.name]) || g.choices[0]).add;
  return s;
}
window.recalc = () => {
  const p = _p, v = calcUnit(p, _sel) * _sel.count;
  $('#tot').textContent = won(v); $('#orig').textContent = won(disc(v, p.discount)); $('#dcamt').textContent = '-' + won(disc(v, p.discount) - v);
};
window.upload = guard(async inp => {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 20e6) throw new Error('20MB 이하 파일만 가능합니다.');
  $('#upl').lastChild.textContent = '업로드 중...';
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'X-Filename': encodeURIComponent(f.name) }, body: f });
  const j = await r.json(); if (!r.ok) { $('#upl').lastChild.textContent = '📎 클릭하여 파일 첨부'; throw new Error(j.error); }
  _sel.file = { url: j.url, name: j.name }; $('#upl').classList.add('has'); $('#upl').lastChild.textContent = `✅ ${j.name} (${(j.size / 1024).toFixed(0)}KB)`;
});
const curItem = () => ({ pid: _p.id, qty: _sel.qty, opts: { ..._sel.opts }, count: _sel.count, file: _sel.file, memo: $('#memo').value });
window.addCart = () => { cart.push(curItem()); saveCart(); toast('장바구니에 담았습니다.'); };
window.buyNow = () => { sessionStorage.setItem('direct', JSON.stringify([curItem()])); location.hash = '#/checkout?direct=1'; };

// 장바구니 아이템 상세 로드
async function loadItems(items) {
  const out = [];
  for (const [idx, it] of items.entries()) {
    try { const p = await api('/api/products/' + it.pid); const unit = calcUnit(p, { qty: it.qty, opts: it.opts }); out.push({ ...it, idx, p, price: unit * it.count }); } catch { /* 판매중지 상품 제외 */ }
  }
  return out;
}
const shipFee = sub => sub >= S.shop.settings.freeShipOver || !sub ? 0 : S.shop.settings.shipFee;
const optText = it => Object.values(it.opts).join(' / ');

pages.cart = async () => {
  const items = await loadItems(cart), sub = items.reduce((a, i) => a + i.price, 0);
  return `<div class="wrap"><div class="pagehead"><h1>장바구니</h1><div class="steps"><span class="on">1 장바구니</span><span>2 주문/결제</span><span>3 완료</span></div></div>
  ${items.length ? `<div class="cartlist">${items.map(it => `<div class="cartitem"><div class="th" style="background:${catBg(it.p.cat)}">${pic(it.p)}</div>
  <div><a href="#/p/${it.pid}"><b>${esc(it.p.name)}</b></a><small>${it.qty.toLocaleString()}수량 × ${it.count}건 · ${esc(optText(it))}</small><small>${it.file ? '📎 ' + esc(it.file.name) : '파일 미첨부'}</small></div><b>${won(it.price)}</b><button class="btn sm gray" onclick="rmCart(${it.idx})">✕</button></div>`).join('')}</div>
  <div class="sumbox"><div class="row"><span>상품금액</span><span>${won(sub)}</span></div><div class="row"><span>배송비</span><span>${won(shipFee(sub))}</span></div><div class="row tot"><span>합계</span><span>${won(sub + shipFee(sub))}</span></div></div>
  <div class="btnrow" style="max-width:420px;margin-left:auto"><a class="btn gray" href="#/list">쇼핑 계속하기</a><a class="btn acc" href="#/checkout">주문하기</a></div>` : '<div class="empty">장바구니가 비어 있습니다.<br><br><a class="btn" href="#/list">상품 보러가기</a></div>'}</div>`;
};
window.rmCart = i => { cart.splice(i, 1); saveCart(); route(); };

pages.checkout = async (q) => {
  const direct = new URLSearchParams(q).get('direct');
  const src = direct ? JSON.parse(sessionStorage.getItem('direct') || '[]') : cart;
  const items = await loadItems(src); if (!items.length) { location.hash = '#/cart'; return ''; }
  window._co = { items, direct: !!direct };
  const sub = items.reduce((a, i) => a + i.price, 0), u = S.user || {};
  setTimeout(coTotal);
  return `<div class="wrap"><div class="pagehead"><h1>주문/결제</h1><div class="steps"><span>1 장바구니</span><span class="on">2 주문/결제</span><span>3 완료</span></div></div>
  <h3 style="margin:10px 0">주문상품</h3><table class="t"><tr><th>상품</th><th>옵션</th><th>금액</th></tr>${items.map(i => `<tr><td class="l">${esc(i.p.name)}</td><td>${i.qty.toLocaleString()}수량×${i.count} · ${esc(optText(i))}</td><td>${won(i.price)}</td></tr>`).join('')}</table>
  ${S.user ? '' : '<p style="margin-top:10px;color:var(--mute)">비회원으로 주문합니다. (로그인하면 포인트가 적립됩니다)</p>'}
  <h3 style="margin:24px 0 10px">배송정보</h3><div class="box"><div class="frow"><div class="f"><label>받는 분</label><input id="sn" value="${esc(u.name || '')}"></div><div class="f"><label>연락처</label><input id="sp" value="${esc(u.phone || '')}" placeholder="010-0000-0000"></div></div>
  <div class="frow"><div class="f"><label>우편번호</label><input id="sz" value="${esc(u.zip || '')}"></div><div class="f"><label>주소</label><input id="sa" value="${esc(u.addr || '')}"></div></div>
  <div class="f"><label>상세주소</label><input id="sa2" value="${esc(u.addr2 || '')}"></div><div class="f"><label>배송 요청사항</label><input id="sm" placeholder="경비실 맡겨주세요 등"></div></div>
  <h3 style="margin:24px 0 10px">결제방법</h3><div class="box paybox"><label><input type="radio" name="pay" value="bank" checked onchange="payChg()"> 무통장입금</label><label><input type="radio" name="pay" value="card" onchange="payChg()"> 신용카드 (데모 결제 - 실제 결제되지 않음)</label>
  <div id="bankf" class="frow"><div class="f"><label>입금자명</label><input id="dep" value="${esc(u.name || '')}"></div><div style="color:var(--mute);padding-top:22px">${esc(S.shop.settings.bank)}</div></div>
  <div class="frow"><div class="f"><label><input type="checkbox" id="tax" style="width:auto" onchange="$('#biz').style.display=this.checked?'block':'none'"> 세금계산서 발행</label><input id="biz" placeholder="사업자등록번호" style="display:none"></div></div></div>
  <div class="sumbox"><div class="row"><span>상품금액</span><span>${won(sub)}</span></div><div class="row"><span>배송비</span><span>${won(shipFee(sub))}</span></div>
  ${S.user ? `<div class="row"><span>포인트 사용 (보유 ${S.user.points.toLocaleString()}P)</span><input id="pt" type="number" min="0" max="${Math.min(S.user.points, sub)}" value="0" style="width:110px;text-align:right" oninput="coTotal()"></div>` : ''}
  <div class="row tot"><span>최종 결제금액</span><span id="cototal"></span></div></div>
  <div class="btnrow" style="max-width:420px;margin-left:auto"><button class="btn acc lg" onclick="placeOrder()">결제하기</button></div></div>`;
};
window.payChg = () => { $('#bankf').style.display = document.querySelector('[name=pay]:checked').value === 'bank' ? 'grid' : 'none'; };
window.coTotal = () => {
  const sub = _co.items.reduce((a, i) => a + i.price, 0), pt = Math.max(0, Math.min(+($('#pt')?.value) || 0, S.user?.points || 0, sub));
  $('#cototal').textContent = won(sub + shipFee(sub) - pt);
};
window.placeOrder = guard(async () => {
  const o = await api('/api/orders', 'POST', {
    items: _co.items.map(i => ({ pid: i.pid, qty: i.qty, opts: i.opts, count: i.count, file: i.file, memo: i.memo })),
    ship: { name: $('#sn').value, phone: $('#sp').value, zip: $('#sz').value, addr: $('#sa').value, addr2: $('#sa2').value, msg: $('#sm').value },
    pay: document.querySelector('[name=pay]:checked').value, depositor: $('#dep').value, usePoints: +($('#pt')?.value) || 0, taxInvoice: $('#tax').checked, bizNo: $('#biz').value,
  });
  if (_co.direct) sessionStorage.removeItem('direct'); else { cart = []; saveCart(); }
  if (S.user) S.user = await api('/api/me'), renderChrome();
  sessionStorage.setItem('lastOrder', JSON.stringify(o)); location.hash = '#/done';
});

pages.done = async () => {
  const o = JSON.parse(sessionStorage.getItem('lastOrder') || 'null'); if (!o) { location.hash = '#/'; return ''; }
  return `<div class="wrap"><div class="formbox" style="max-width:560px;text-align:center"><div style="font-size:56px">🎉</div><h1>주문이 접수되었습니다</h1>
  <p style="margin:10px 0">주문번호 <b style="color:var(--pri);font-size:20px">${o.no}</b></p><p>결제금액 <b>${won(o.total)}</b> · ${o.pay === 'bank' ? '무통장입금' : '신용카드'}</p>
  ${o.pay === 'bank' ? `<div class="box" style="margin:16px 0;text-align:left"><b>입금계좌</b><br>${esc(S.shop.settings.bank)}<br>입금자명: ${esc(o.depositor || o.ship.name)}</div>` : ''}
  <p style="color:var(--mute);margin-bottom:20px">입금(결제) 확인 후 시안 확인 및 제작이 진행됩니다.${S.user ? '' : '<br>비회원은 주문번호와 연락처로 주문조회가 가능합니다.'}</p>
  <a class="btn" href="${S.user ? '#/my' : '#/lookup'}">주문내역 보기</a> <a class="btn gray" href="#/">홈으로</a></div></div>`;
};

pages.login = async () => `<div class="wrap"><div class="formbox"><h1>로그인</h1><div class="f"><label>아이디</label><input id="lu"></div><div class="f"><label>비밀번호</label><input id="lp" type="password" onkeydown="if(event.key==='Enter')doLogin()"></div>
  <button class="btn lg" style="width:100%" onclick="doLogin()">로그인</button><p style="text-align:center;margin-top:14px"><a href="#/signup">회원가입</a> · <a href="#/lookup">비회원 주문조회</a></p></div></div>`;
window.doLogin = guard(async () => { const r = await api('/api/auth/login', 'POST', { username: $('#lu').value, password: $('#lp').value }); setSession(r); location.hash = '#/'; toast('환영합니다!'); });
function setSession(r) { S.token = r.token; S.user = r.user; localStorage.setItem('token', r.token); renderChrome(); }

pages.signup = async () => `<div class="wrap"><div class="formbox"><h1>회원가입</h1><p style="text-align:center;color:var(--mute);margin-bottom:16px">가입 즉시 ${S.shop.settings.signupPoints.toLocaleString()}P 적립!</p>
  ${[['su', '아이디 (영문/숫자 4~20자)'], ['sp1', '비밀번호 (6자 이상)', 'password'], ['sn', '이름'], ['sc', '병원명'], ['sph', '연락처'], ['se', '이메일']].map(([id, l, t]) => `<div class="f"><label>${l}</label><input id="${id}" type="${t || 'text'}"></div>`).join('')}
  <button class="btn lg" style="width:100%" onclick="doSignup()">가입하기</button></div></div>`;
window.doSignup = guard(async () => { const r = await api('/api/auth/signup', 'POST', { username: $('#su').value, password: $('#sp1').value, name: $('#sn').value, clinic: $('#sc').value, phone: $('#sph').value, email: $('#se').value }); setSession(r); location.hash = '#/'; toast('가입 완료! 포인트가 적립되었습니다.'); });

const stCls = s => s === '취소' ? 'c' : s === '배송완료' ? 'd' : s === '입금대기' ? 'w' : '';
const orderRows = os => os.length ? `<table class="t"><tr><th>주문번호</th><th>일자</th><th>상품</th><th>금액</th><th>상태</th><th></th></tr>${os.map(o => `<tr><td>${o.no}</td><td>${date(o.createdAt)}</td><td class="l">${esc(o.items[0].name)}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ''}${o.tracking ? `<br><small>운송장 ${esc(o.tracking)}</small>` : ''}</td><td>${won(o.total)}</td><td><span class="st ${stCls(o.status)}">${o.status}</span></td>
  <td>${['입금대기', '결제완료'].includes(o.status) ? `<button class="btn sm gray" onclick="cancelOrder('${o.no}')">주문취소</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="empty">주문 내역이 없습니다.</div>';
pages.my = async () => {
  if (!S.user) { location.hash = '#/login'; return ''; }
  const os = await api('/api/me/orders'), u = S.user;
  return `<div class="wrap"><div class="pagehead"><h1>마이페이지</h1></div>
  <div class="quick3" style="margin-bottom:24px"><div class="box"><h3>${esc(u.name)}님</h3>${esc(u.clinic || '')}<br>${esc(u.email || '')}</div><div class="box"><h3>보유 포인트</h3><div class="cs">${u.points.toLocaleString()} P</div></div><div class="box"><h3>총 주문</h3><div class="cs">${os.length}건</div></div></div>
  <h3 style="margin-bottom:10px">주문/배송 조회</h3>${orderRows(os)}
  <h3 style="margin:30px 0 10px">회원정보 수정</h3><div class="box"><div class="frow">${[['mn', '이름', u.name], ['mc', '병원명', u.clinic], ['mp', '연락처', u.phone], ['me', '이메일', u.email], ['mz', '우편번호', u.zip], ['ma', '주소', u.addr], ['ma2', '상세주소', u.addr2]].map(([id, l, v]) => `<div class="f"><label>${l}</label><input id="${id}" value="${esc(v || '')}"></div>`).join('')}<div class="f"><label>새 비밀번호 (변경 시)</label><input id="mpw" type="password"></div></div>
  <button class="btn" onclick="saveMe()">저장</button></div></div>`;
};
window.saveMe = guard(async () => { S.user = await api('/api/me', 'PUT', { name: $('#mn').value, clinic: $('#mc').value, phone: $('#mp').value, email: $('#me').value, zip: $('#mz').value, addr: $('#ma').value, addr2: $('#ma2').value, password: $('#mpw').value || undefined }); renderChrome(); toast('저장되었습니다.'); });
window.cancelOrder = guard(async no => { if (!confirm('주문을 취소하시겠습니까?')) return; await api(`/api/orders/${no}/cancel`, 'POST', { phone: window._lk?.phone }); if (S.user) S.user = await api('/api/me'); renderChrome(); toast('주문이 취소되었습니다.'); route(); });

pages.lookup = async () => `<div class="wrap"><div class="formbox"><h1>비회원 주문조회</h1><div class="f"><label>주문번호</label><input id="ln" placeholder="20260101-0001"></div><div class="f"><label>주문 시 연락처</label><input id="lph"></div>
  <button class="btn lg" style="width:100%" onclick="doLookup()">조회</button></div><div id="lkres"></div></div>`;
window.doLookup = guard(async () => { const o = await api('/api/orders/lookup', 'POST', { no: $('#ln').value, phone: $('#lph').value }); window._lk = { phone: $('#lph').value }; $('#lkres').innerHTML = orderRows([o]); });

pages.board = async (name) => {
  const T = { notice: '공지사항', faq: 'FAQ', inquiry: '1:1 문의', proof: '시안교정' };
  const posts = await api('/api/posts/' + name);
  window._posts = posts;
  const write = ['inquiry', 'proof'].includes(name);
  return `<div class="wrap"><div class="pagehead"><h1>${T[name]}</h1>${write ? `<button class="btn" onclick="$('#wr').style.display='block'">글쓰기</button>` : ''}</div>
  ${write ? `<div class="box" id="wr" style="display:none;margin-bottom:16px">${S.user ? `<div class="f"><label>제목</label><input id="wt"></div><div class="f"><label>내용</label><textarea id="wc" rows="5"></textarea></div>
  ${name === 'inquiry' ? '<label><input type="checkbox" id="ws" style="width:auto"> 비밀글</label><br><br>' : ''}<button class="btn" onclick="writePost('${name}')">등록</button>` : '로그인 후 작성할 수 있습니다. <a href="#/login" style="color:var(--pri)">로그인</a>'}</div>` : ''}
  <table class="t"><tr><th style="width:70px">번호</th><th>제목</th><th style="width:110px">작성자</th><th style="width:110px">날짜</th>${write ? '<th style="width:80px">상태</th>' : ''}</tr>
  ${posts.map((p, i) => `<tr class="cl" onclick="togglePost(${i})"><td>${posts.length - i}</td><td class="l">${p.secret ? '🔒 ' : ''}${esc(p.title)}</td><td>${esc(p.author)}</td><td>${date(p.createdAt)}</td>${write ? `<td>${p.answered ? '<span class="st d">답변완료</span>' : '<span class="st">대기</span>'}</td>` : ''}</tr>
  <tr id="pc${i}" style="display:none"><td colspan="5" class="l" style="text-align:left;padding:18px;background:#fafafa">${p.content === null ? '🔒 비밀글입니다. 작성자만 볼 수 있습니다.' : esc(p.content).replace(/\n/g, '<br>')}${p.reply ? `<div class="ans" style="margin-top:12px;padding:12px;border-radius:8px"><b>↳ 답변</b><br>${esc(p.reply).replace(/\n/g, '<br>')}</div>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">등록된 글이 없습니다.</td></tr>'}</table></div>`;
};
window.togglePost = i => { const e = $('#pc' + i); e.style.display = e.style.display === 'none' ? 'table-row' : 'none'; };
window.writePost = guard(async name => { await api('/api/posts/' + name, 'POST', { title: $('#wt').value, content: $('#wc').value, secret: $('#ws')?.checked }); toast('등록되었습니다.'); route(); });

// ---------- 디자인템플릿 갤러리 / 편집기 ----------
pages.templates = async (q) => {
  const params = new URLSearchParams(q);
  const cat = params.get('cat') || '', kw = params.get('q') || '', prod = params.get('product') || '', mine = params.get('mine') === '1';
  const all = await api('/api/templates');
  let designs = [];
  if (S.user) { try { designs = await api('/api/me/designs'); } catch { designs = []; } }
  const cats = [...new Set(all.map(t => t.category))];
  const prodObj = prod && (S.products || []).find(p => p.id === prod);
  let list = all.filter(t => (!cat || t.category === cat) && (!kw || (t.name + t.tags.join(' ')).includes(kw)) && (!prod || (t.products || []).includes(prod)));
  const link = o => '#/templates?' + new URLSearchParams({ ...(cat && { cat }), ...(prod && { product: prod }), ...o }).toString();
  const card = t => `<a class="tcard" href="#/editor/${esc(t.id)}"><div class="tprev" style="aspect-ratio:1/1">${TplRender.svg(t)}</div>
    <div class="tinfo"><b>${esc(t.name)}</b><div class="ttags"><span>${esc(t.category)}</span><span>${esc(t.mm)}</span></div></div></a>`;
  const myCard = d => `<div class="tcard"><a href="#/editor/${esc(d.templateId)}?design=${esc(d.id)}"><div class="tprev" style="aspect-ratio:1/1">${d.thumb ? `<img src="${esc(d.thumb)}" alt="">` : ''}</div></a>
    <div class="tinfo"><b>${esc(d.name)}</b><div class="ttags"><span>${date(d.updatedAt)}</span></div><div style="display:flex;gap:6px;margin-top:8px"><a class="btn sm" href="#/editor/${esc(d.templateId)}?design=${esc(d.id)}">열기</a><button class="btn sm gray" onclick="delDesign('${esc(d.id)}')">삭제</button></div></div></div>`;
  return `<div class="wrap"><div class="pagehead" style="margin-top:20px"><h1>디자인템플릿</h1></div>
  <p style="color:var(--mute);margin-bottom:14px">마음에 드는 템플릿을 고르면 글자·색상·이미지를 바로 수정(보정)할 수 있고, 완성한 디자인으로 취급 상품을 바로 주문할 수 있습니다.</p>
  ${prodObj ? `<div class="notice-bar" style="border-radius:8px;margin-bottom:12px">‘${esc(prodObj.name)}’에 사용할 수 있는 템플릿만 보고 있습니다. <a href="#/templates" style="text-decoration:underline">전체 보기</a></div>` : ''}
  <div class="tabs"><button class="${!cat && !mine ? 'on' : ''}" onclick="location.hash='${link({})}'">전체 (${all.filter(t => !prod || (t.products || []).includes(prod)).length})</button>${cats.map(c => `<button class="${cat === c && !mine ? 'on' : ''}" onclick="location.hash='${link({ cat: c })}'">${esc(c)}</button>`).join('')}
    <button class="${mine ? 'on' : ''}" onclick="location.hash='#/templates?mine=1'">⭐ 내 디자인${S.user ? ` (${designs.length})` : ''}</button>
    <form onsubmit="location.hash='${link({})}&q='+encodeURIComponent(this.q.value);return false" style="margin-left:auto"><input name="q" value="${esc(kw)}" placeholder="템플릿 검색" style="width:180px;border-radius:20px"></form></div>
  ${mine ? (S.user ? (designs.length ? `<div class="tgrid">${designs.map(myCard).join('')}</div>` : '<div class="empty">저장한 디자인이 없습니다.<br>편집 화면에서 “내 디자인 저장”을 눌러 보세요.</div>') : '<div class="empty">로그인 후 내 디자인을 볼 수 있습니다.<br><br><a class="btn" href="#/login">로그인</a></div>')
      : list.length ? `<div class="tgrid">${list.map(card).join('')}</div>` : '<div class="empty">조건에 맞는 템플릿이 없습니다.</div>'}</div>`;
};
window.delDesign = guard(async id => { if (!confirm('저장한 디자인을 삭제하시겠습니까?')) return; await api('/api/designs/' + id, 'DELETE'); toast('삭제되었습니다.'); route(); });

pages.editor = async (id, q) => {
  const did = new URLSearchParams(q).get('design');
  const tpl = await api('/api/templates/' + id);
  let doc = { w: tpl.w, h: tpl.h, bg: tpl.bg, elements: tpl.elements }, name = tpl.name, designId = null;
  if (did) {
    if (!S.user) { location.hash = '#/login'; return ''; }
    const d = await api('/api/designs/' + did); doc = d.doc; name = d.name; designId = d.id;
  }
  setTimeout(() => TplEditor.mount({ tpl, doc, name, designId }));
  return `<div class="wrap-wide"><div id="edroot"></div></div>`;
};

// 편집기에서 넘어온 디자인을 상품 주문서에 자동 첨부
function applyPendingDesign() {
  try {
    const d = JSON.parse(sessionStorage.getItem('pendingDesign') || 'null');
    if (!d || !window._p || d.pid !== _p.id) return;
    _sel.file = d.file;
    const u = $('#upl'); if (u) { u.classList.add('has'); u.lastChild.textContent = `✅ 디자인템플릿 적용: ${d.label}`; }
    const m = $('#memo'); if (m && !m.value) m.value = `디자인템플릿: ${d.tpl}`;
    sessionStorage.removeItem('pendingDesign'); toast('편집한 디자인이 주문서에 첨부되었습니다.');
  } catch { /* 무시 */ }
}

// ---------- 라우터 ----------
async function route() {
  document.body.classList.remove('ed-open');
  const [path, q] = (location.hash.slice(1) || '/').split('?');
  const seg = path.split('/').filter(Boolean);
  const app = $('#app');
  try {
    let html;
    if (!seg.length) html = await pages.home();
    else if (seg[0] === 'list') html = await pages.list(q);
    else if (seg[0] === 'p') html = await pages.p(seg[1]);
    else if (seg[0] === 'board') html = await pages.board(seg[1]);
    else if (seg[0] === 'editor') html = await pages.editor(seg[1], q);
    else if (seg[0] === 'tools') html = FileTools.page(seg[1]);
    else if (pages[seg[0]]) html = await pages[seg[0]](q);
    else html = '<div class="empty">페이지를 찾을 수 없습니다.</div>';
    app.innerHTML = html; renderChrome(); scrollTo(0, 0);
  } catch (e) { app.innerHTML = `<div class="empty">${esc(e.message)}<br><br><a class="btn" href="#/">홈으로</a></div>`; }
}
window.addEventListener('hashchange', route);
(async () => {
  S.shop = await api('/api/shop');
  S.products = await api('/api/products');
  try { S.tplCats = [...new Set((await api('/api/templates')).map(t => t.category))]; } catch { S.tplCats = []; }
  if (S.token) { try { S.user = await api('/api/me'); } catch { S.token = ''; localStorage.removeItem('token'); } }
  await route();
})();
