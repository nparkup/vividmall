// 디자인템플릿 편집기 (망고보드형 레이아웃): 상단 메뉴바 · 왼쪽 아이콘 레일 + 슬라이드 패널(템플릿/그래픽/텍스트/배경/업로드/레이어/나의작업) · 캔버스 · 떠 있는 줌/속성 패널
// 편집 엔진: SVG 기반 텍스트/도형/이미지 편집, 이미지 보정, 레이어 드래그 정렬, 자석 가이드, 정렬 도구, 실행취소, PNG/JPG 저장, 내 디자인 저장, 인쇄 주문 연동
(function () {
  const R = window.TplRender, esc = R.esc, NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s);
  const FONTS = ['Malgun Gothic', 'Batang', 'Gulim', 'Dotum', 'Gungsuh', 'Arial', 'Georgia', 'Impact', 'Courier New'];
  const CATS = ['명함', '전단/포스터', '진료차트/서식', '봉투', '스티커', '배너/현수막', 'SNS 카드뉴스'];
  let st = null, bound = false, histTimer = null, tplCache = null, uploadCache = [];

  const uid = () => 'e' + Math.random().toString(36).slice(2, 8);
  const getEl = id => st.doc.elements.find(e => e.id === id);
  const selIds = () => st.ids.filter(id => getEl(id));
  const single = () => (st.ids.length === 1 ? getEl(st.ids[0]) : null);
  const hex6 = c => { c = String(c || ''); if (/^#[0-9a-fA-F]{6}$/.test(c)) return c; if (/^#[0-9a-fA-F]{3}$/.test(c)) return '#' + c.slice(1).split('').map(x => x + x).join(''); return '#cccccc'; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const label = e => ({ text: '텍스트', rect: '사각형', ellipse: '원', icon: '치아 로고', image: '이미지' }[e.type] || e.type);
  const union = bs => { const x1 = Math.min(...bs.map(b => b.x)), y1 = Math.min(...bs.map(b => b.y)), x2 = Math.max(...bs.map(b => b.x + b.w)), y2 = Math.max(...bs.map(b => b.y + b.h)); return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }; };
  const hhmmss = () => new Date().toTimeString().slice(0, 8);

  const IC = {
    template: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>',
    graphic: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="5"/><rect x="11" y="11" width="10" height="10" rx="2"/></svg>',
    text: '<svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>',
    bg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    mine: '<svg viewBox="0 0 24 24"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/></svg>',
  };
  const RAIL = [['template', '템플릿'], ['graphic', '그래픽'], ['text', '텍스트'], ['bg', '배경'], ['upload', '업로드'], ['layers', '레이어'], ['mine', '나의작업']];

  // ---------- 그래픽 / 텍스트 / 배경 프리셋 ----------
  const GRAPHICS = [
    ['사각형', (w, h) => ({ type: 'rect', w: w * .3, h: h * .18, fill: '#0ea5e9', rx: 0 })],
    ['둥근 사각형', (w, h) => ({ type: 'rect', w: w * .3, h: h * .18, fill: '#6366f1', rx: Math.min(w, h) * .04 })],
    ['원', (w, h) => ({ type: 'ellipse', w: Math.min(w, h) * .3, h: Math.min(w, h) * .3, fill: '#f59e0b' })],
    ['타원', (w, h) => ({ type: 'ellipse', w: w * .34, h: h * .16, fill: '#10b981' })],
    ['가로선', (w, h) => ({ type: 'rect', w: w * .4, h: Math.max(3, h * .004), fill: '#111827', rx: 0 })],
    ['치아 로고', (w, h) => ({ type: 'icon', shape: 'tooth', w: Math.min(w, h) * .2, h: Math.min(w, h) * .175, fill: '#0ea5e9' })],
    ['그라데이션', (w, h) => ({ type: 'rect', w: w * .34, h: h * .2, fill: '#0ea5e9', rx: Math.min(w, h) * .03, grad: { a: '#0ea5e9', b: '#6366f1', ang: 45 } })],
    ['그라데이션 원', (w, h) => ({ type: 'ellipse', w: Math.min(w, h) * .3, h: Math.min(w, h) * .3, fill: '#f97316', grad: { a: '#f97316', b: '#ec4899', ang: 45 } })],
    ['그림자 카드', (w, h) => ({ type: 'rect', w: w * .36, h: h * .22, fill: '#ffffff', rx: Math.min(w, h) * .035, shadow: true })],
    ['링', (w, h) => ({ type: 'ellipse', w: Math.min(w, h) * .3, h: Math.min(w, h) * .3, fill: 'none', stroke: '#6366f1', sw: Math.max(4, Math.min(w, h) * .008) })],
    ['알약 라벨', (w, h) => ({ type: 'rect', w: w * .3, h: h * .05, fill: '#fb7a3a', rx: 999 })],
    ['테두리 박스', (w, h) => ({ type: 'rect', w: w * .34, h: h * .2, fill: 'none', stroke: '#111827', sw: Math.max(3, Math.min(w, h) * .004), rx: Math.min(w, h) * .02 })],
  ];
  const TEXT_PRESETS = [
    ['제목 추가', { text: '제목을 입력하세요', f: .07, weight: 800 }, 'font-size:22px;font-weight:800'],
    ['부제목 추가', { text: '부제목을 입력하세요', f: .042, weight: 700 }, 'font-size:16px;font-weight:700'],
    ['본문 추가', { text: '본문 내용을 입력하세요', f: .028, weight: 400 }, 'font-size:13px'],
    ['명조 제목', { text: '명조체 제목', f: .07, weight: 800, family: 'Batang' }, "font-family:Batang;font-size:21px;font-weight:800"],
    ['영문 대문자', { text: 'DENTAL CLINIC', f: .04, weight: 800, ls: 10, family: 'Georgia' }, "font-family:Georgia;font-size:15px;font-weight:800;letter-spacing:3px"],
    ['큰 숫자', { text: '01', f: .16, weight: 800, family: 'Georgia' }, "font-family:Georgia;font-size:30px;font-weight:800"],
  ];
  const BG_SOLID = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#111827', '#0b0b0f', '#fff4ec', '#fdf0ee', '#f4f1ea', '#f6ecd9', '#e6fffa', '#e0f2fe', '#dbeafe', '#ede9fe', '#f3e8ff', '#fce7f3', '#ffedd5', '#fef9c3', '#dcfce7', '#0ea5e9', '#6366f1', '#0d9488', '#f97316', '#e11d48'];
  const BG_GRAD = [['#0ea5e9', '#6366f1', 45], ['#7c3aed', '#06b6d4', 70], ['#f97316', '#ec4899', 45], ['#10b981', '#06b6d4', 60], ['#fde68a', '#fca5a5', 60], ['#c7d2fe', '#fbcfe8', 45], ['#0f172a', '#334155', 90], ['#fef3c7', '#bae6fd', 90]];

  // ---------- 히스토리 / 작업내역 ----------
  function push() {
    const j = JSON.stringify(st.doc);
    if (st.hist[st.hi] === j) return;
    st.hist = st.hist.slice(0, st.hi + 1); st.histT = st.histT.slice(0, st.hi + 1);
    st.hist.push(j); st.histT.push(hhmmss()); st.hi = st.hist.length - 1;
    if (st.hist.length > 80) { st.hist.shift(); st.histT.shift(); st.hi--; }
    st.dirty = true; topState();
  }
  const pushSoon = () => { clearTimeout(histTimer); histTimer = setTimeout(push, 500); };
  function jumpTo(ni) {
    clearTimeout(histTimer); push();
    if (ni < 0 || ni >= st.hist.length) return;
    st.hi = ni; st.doc = JSON.parse(st.hist[ni]); st.ids = selIds();
    draw(); panel(); topState();
  }
  const undo = d => jumpTo(st.hi + d);

  // ---------- 화면 구성 ----------
  function mount(info) {
    document.body.classList.add('ed-open');
    st = { tpl: info.tpl, doc: clone(info.doc), ids: [], hist: [], histT: [], hi: -1, zoom: 1, designId: info.designId || null, name: info.name || info.tpl.name, drag: null, dirty: false, snap: true, guides: [], marquee: null, alignRef: 'sel', rail: 'template', mode: 'rail', selKey: '', spOpen: window.innerWidth > 900, tq: '', tc: '', orig: clone(info.doc) };
    $('#edroot').innerHTML = `<div class="ed2">
      <header class="ed2-top">
        <a class="ed2-back" href="#/templates" title="템플릿 목록으로">‹</a><a class="ed2-brand" href="#/">${esc(S.shop.settings.shopName)}<small>디자인</small></a>
        <div class="ed2-menus">
          <div class="ed2-mw"><button class="ed2-mb" data-menu="file">파일</button><div class="ed2-dd" id="dd-file" hidden>
            <button data-m="save">내 디자인에 저장<kbd>Ctrl+S</kbd></button><button data-m="rename">이름 바꾸기</button><button data-m="tpl">다른 템플릿 선택</button><button data-m="reset">처음 상태로 되돌리기</button></div></div>
          <div class="ed2-mw"><button class="ed2-mb" data-menu="dl">다운로드</button><div class="ed2-dd" id="dd-dl" hidden>
            <button data-m="png">PNG · 고해상도 (인쇄용)</button><button data-m="png1">PNG · 원본 크기</button><button data-m="jpg">JPG · 용량 작게</button></div></div>
          <div class="ed2-mw"><button class="ed2-mb" data-menu="share">공유</button><div class="ed2-dd" id="dd-share" hidden>
            <button data-m="copytpl">템플릿 링크 복사</button><button data-m="copydesign">내 디자인 링크 복사 (본인만 열람)</button></div></div>
          <button class="ed2-mb ed2-order" id="ed-order">인쇄물 주문</button>
        </div>
        <input id="ed-name" class="ed2-name" maxlength="60" value="${esc(st.name)}" title="디자인 이름"><span class="ed2-spacer"></span>
        <button class="ed2-ib" id="ed-undo" title="실행취소 (Ctrl+Z)">↶</button><button class="ed2-ib" id="ed-redo" title="다시실행 (Ctrl+Y)">↷</button>
        <span class="ed2-save" id="ed-savest">저장안함</span><button class="ed2-mb" id="ed-save">저장</button>
        <div class="ed2-mw"><button class="ed2-mb" data-menu="hist">작업내역</button><div class="ed2-dd ed2-dd-r" id="dd-hist" hidden></div></div>
        <button class="ed2-mb" id="ed-admin" hidden>템플릿 등록</button>
      </header>
      <div class="ed2-body">
        <nav class="ed2-rail">${RAIL.map(([k, l]) => `<button data-rail="${k}" title="${l}">${IC[k]}<span>${l}</span></button>`).join('')}</nav>
        <aside class="ed2-sp" id="ed-sp"><div class="ed2-ph"><b id="ed-spt"></b><button id="ed-spx" title="패널 접기">‹</button></div><div class="ed2-spbar" id="ed-spbar" hidden><button id="ed-showprops">선택한 요소 속성 편집 →</button></div><div class="ed2-spb" id="ed-spb"></div></aside>
        <button class="ed2-sptoggle" id="ed-spo" title="패널 열기" hidden>›</button>
        <div class="ed2-main">
          <div class="ed-stage" id="ed-stage"><div class="ed-paper" id="ed-paper"></div></div>
          <div class="ed2-zoom"><button id="ed-zo" title="축소">−</button><select id="ed-zsel" title="확대/축소"></select><button id="ed-zi" title="확대">＋</button><i></i><span id="ed-size"></span><i></i>
            <button id="ed-snap" class="ed2-on" title="드래그할 때 가이드선에 자동으로 달라붙습니다 (Alt를 누르면 일시 해제)">자석</button><button id="ed-fit" title="화면에 맞춤">맞춤</button></div>
          <div class="ed2-float" id="ed-float" hidden><button data-act="dup">복제</button><button data-act="del">삭제</button><button data-act="front">앞으로</button><button data-act="back">뒤로</button></div>
          <div class="ed2-hint">클릭=선택 · Shift+클릭=여러 개 · 빈 곳 드래그=범위 선택 · Ctrl+A 전체 · 드래그 시 가이드선 자동 맞춤(Alt=해제) · Delete 삭제 · 방향키 이동 · 인쇄 영역 <b id="ed-mm">${esc(st.tpl.mm || '')}</b></div>
        </div>
      </div></div><input type="file" id="ed-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>`;
    push(); st.dirty = false;
    if (localStorage.getItem('atoken')) $('#ed-admin').hidden = false;
    wire(); renderSp(); draw(); panel(); topState();
    setTimeout(() => { if (st && $('#ed-stage')) fit(); }, 60); setTimeout(() => { if (st && $('#ed-stage')) fit(); }, 250);
    if (!bound) { bound = true; document.addEventListener('keydown', onKey); document.addEventListener('click', onDocClick); window.addEventListener('resize', () => { if (st && $('#ed-stage')) fit(); }); }
  }

  const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message || '오류가 발생했습니다.'); } };

  function wire() {
    $('#ed-undo').onclick = () => undo(-1); $('#ed-redo').onclick = () => undo(1);
    $('#ed-zi').onclick = () => zoom(st.zoom * 1.2); $('#ed-zo').onclick = () => zoom(st.zoom / 1.2); $('#ed-fit').onclick = fit;
    $('#ed-zsel').onchange = e => zoom(+e.target.value / 100);
    $('#ed-snap').onclick = () => { st.snap = !st.snap; $('#ed-snap').classList.toggle('ed2-on', st.snap); toast(st.snap ? '자석(가이드선 자동 맞춤) 켜짐' : '자석 꺼짐'); };
    $('#ed-name').oninput = e => { st.name = e.target.value; st.dirty = true; topState(); };
    $('#ed-save').onclick = () => guard(save)(); $('#ed-order').onclick = orderModal; $('#ed-admin').onclick = adminRegisterModal;
    document.querySelectorAll('.ed2-rail [data-rail]').forEach(b => b.onclick = () => { const k = b.dataset.rail; if (st.rail === k && st.spOpen) st.spOpen = false; else { st.rail = k; st.spOpen = true; } st.mode = 'rail'; renderSp(); });
    $('#ed-spx').onclick = () => { st.spOpen = false; renderSp(); }; $('#ed-spo').onclick = () => { st.spOpen = true; renderSp(); };
    document.querySelectorAll('#ed-float [data-act]').forEach(b => b.onclick = () => action(b.dataset.act));
    document.querySelector('.ed2-top').addEventListener('click', onMenuClick);
    $('#ed-file').onchange = guard(async ev => {
      const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
      const rep = st.replacing; st.replacing = false; const img = await readImage(f);
      if (rep && single() && single().type === 'image') { single().href = img.href; push(); draw(); panel(); }
      else { uploadCache.unshift(img); uploadCache.splice(30); addImageElement(img); if (st.rail === 'upload') renderSp(); }
    });
    const paper = $('#ed-paper');
    paper.addEventListener('pointerdown', ev => {
      const h = ev.target.closest('[data-h]'), n = ev.target.closest('[data-id]');
      if (h) return startDrag('resize', ev, h.dataset.h);
      if (n && getEl(n.dataset.id)) {
        const id = n.dataset.id;
        if (ev.shiftKey || ev.ctrlKey || ev.metaKey) { setSel(st.ids.includes(id) ? st.ids.filter(x => x !== id) : [...st.ids, id]); return; }
        if (!st.ids.includes(id)) setSel([id]);
        return startDrag('move', ev);
      }
      startDrag('marquee', ev);
    });
    paper.addEventListener('dblclick', ev => { const n = ev.target.closest('[data-id]'); if (n && getEl(n.dataset.id)?.type === 'text') { setSel([n.dataset.id]); const ta = $('#ed-spb textarea'); if (ta) { ta.focus(); ta.select(); } } });
    // 왼쪽 슬라이드 패널 (템플릿/그래픽/텍스트/배경/업로드/레이어/나의작업)
    const sp = $('#ed-spb');
    sp.addEventListener('click', ev => { if (st.justDragged) { ev.stopPropagation(); ev.preventDefault(); st.justDragged = false; } }, true);
    sp.addEventListener('click', onSpClick); sp.addEventListener('input', onSpInput); sp.addEventListener('pointerdown', onLayerDown);
    sp.addEventListener('change', () => { clearTimeout(histTimer); push(); });
    $('#ed-showprops').onclick = () => { st.mode = 'props'; renderSp(); };
  }

  // ---------- 상단 메뉴 ----------
  function onDocClick(ev) {
    if (!st || !$('#ed-paper')) return;
    const mb = ev.target.closest('[data-menu]');
    document.querySelectorAll('.ed2-dd').forEach(d => { if (!mb || d.id !== 'dd-' + mb.dataset.menu) d.hidden = true; });
    if (mb) { const d = $('#dd-' + mb.dataset.menu); if (d.hidden) { if (mb.dataset.menu === 'hist') fillHist(); d.hidden = false; } else d.hidden = true; }
  }
  function fillHist() {
    $('#dd-hist').innerHTML = st.hist.map((_, i) => i).reverse().map(i => `<button data-hi="${i}" class="${i === st.hi ? 'cur' : ''}"><span>${i === 0 ? '처음 상태' : '편집 ' + i}</span><kbd>${st.histT[i]}${i === st.hi ? ' ●' : ''}</kbd></button>`).join('');
  }
  function onMenuClick(ev) {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.hi != null) { jumpTo(+b.dataset.hi); fillHist(); return; }
    const m = b.dataset.m; if (!m) return;
    document.querySelectorAll('.ed2-dd').forEach(d => { d.hidden = true; });
    if (m === 'save') guard(save)();
    else if (m === 'rename') { const i = $('#ed-name'); i.focus(); i.select(); }
    else if (m === 'tpl') { st.rail = 'template'; st.spOpen = true; renderSp(); }
    else if (m === 'reset') { if (!confirm('모든 편집 내용을 버리고 이 템플릿의 처음 상태로 되돌립니다. (작업내역에서 복구할 수 있습니다)')) return; st.doc = clone(st.orig); st.ids = []; push(); draw(); panel(); toast('처음 상태로 되돌렸습니다.'); }
    else if (m === 'png') guard(() => download('png', hiScale()))();
    else if (m === 'png1') guard(() => download('png', 1))();
    else if (m === 'jpg') guard(() => download('jpg', hiScale()))();
    else if (m === 'copytpl') copyText(`${location.origin}/#/editor/${st.tpl.id}`);
    else if (m === 'copydesign') { if (!st.designId) return toast('먼저 “내 디자인에 저장”을 해 주세요.'); copyText(`${location.origin}/#/editor/${st.tpl.id}?design=${st.designId}`); }
  }
  function copyText(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('링크를 복사했습니다.'), () => { window.prompt('링크를 복사하세요', t); }); }

  // ---------- 확대/축소 / 상태 ----------
  function zoom(z) { st.zoom = Math.max(0.05, Math.min(4, z)); draw(); }
  function fit() { const s = $('#ed-stage'); if (!s) return; st.zoom = Math.max(0.05, Math.min((s.clientWidth - 60) / st.doc.w, (s.clientHeight - 150) / st.doc.h, 2)); draw(); }
  function topState() {
    const u = $('#ed-undo'), r = $('#ed-redo'); if (!u) return;
    u.disabled = st.hi <= 0; r.disabled = st.hi >= st.hist.length - 1;
    const sv = $('#ed-savest'); sv.textContent = st.dirty ? '저장안함' : '저장됨'; sv.classList.toggle('ok', !st.dirty);
  }
  function setSel(ids) { st.ids = ids; draw(); panel(); }
  function zoomUi() {
    const pct = Math.round(st.zoom * 100), opts = [...new Set([25, 50, 75, 100, 150, 200, pct])].sort((a, b) => a - b);
    $('#ed-zsel').innerHTML = opts.map(p => `<option value="${p}" ${p === pct ? 'selected' : ''}>${p}%</option>`).join('');
    $('#ed-size').textContent = `${st.doc.w}×${st.doc.h}px`;
  }

  // ---------- 왼쪽 슬라이드 패널 ----------
  const SP_TITLE = { template: '템플릿', graphic: '그래픽', text: '텍스트', bg: '배경', upload: '업로드', layers: '레이어', mine: '나의작업' };
  function renderSp() {
    const sp = $('#ed-sp'); if (!sp) return;
    sp.hidden = !st.spOpen; $('#ed-spo').hidden = st.spOpen;
    const ids = selIds(), propsMode = st.mode === 'props' && ids.length > 0;
    document.querySelectorAll('.ed2-rail [data-rail]').forEach(b => b.classList.toggle('on', st.spOpen && !propsMode && b.dataset.rail === st.rail));
    $('#ed-spbar').hidden = !(st.spOpen && !propsMode && ids.length > 0);
    $('#ed-spt').textContent = propsMode ? (ids.length > 1 ? ids.length + '개 선택' : label(single()) + ' 속성') : SP_TITLE[st.rail];
    if (st.spOpen) { if (propsMode) renderProps(); else ({ template: renderTemplates, graphic: renderGraphics, text: renderTextPanel, bg: renderBg, upload: renderUpload, layers: layers, mine: renderMine }[st.rail])(); }
    setTimeout(() => { if (st && $('#ed-stage')) fit(); }, 0);
  }
  async function renderTemplates() {
    const body = $('#ed-spb'); body.innerHTML = '<div class="ed2-empty">불러오는 중…</div>';
    try { if (!tplCache) tplCache = await api('/api/templates'); } catch { body.innerHTML = '<div class="ed2-empty">템플릿을 불러오지 못했습니다.</div>'; return; }
    if (st.rail !== 'template') return;
    const cats = [...new Set(tplCache.map(t => t.category))];
    body.innerHTML = `<div class="ed2-search"><input id="ed-tq" placeholder="템플릿 검색 (예: 이벤트, 명함)" value="${esc(st.tq)}"></div>
      <div class="ed2-chips" id="ed-chips"><button data-sp="tc:" class="${!st.tc ? 'on' : ''}">전체</button>${cats.map(c => `<button data-sp="tc:${esc(c)}" class="${st.tc === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div><div class="ed2-tgrid" id="ed-tgrid"></div>`;
    fillTplGrid();
  }
  function fillTplGrid() {
    const g = $('#ed-tgrid'); if (!g || !tplCache) return;
    const q = st.tq.trim(), list = tplCache.filter(t => (!st.tc || t.category === st.tc) && (!q || (t.name + (t.tags || []).join(' ') + t.category).includes(q)));
    document.querySelectorAll('#ed-chips button').forEach(b => b.classList.toggle('on', b.dataset.sp === 'tc:' + st.tc));
    g.innerHTML = list.map(t => `<button class="ed2-tpl ${t.id === st.tpl.id ? 'cur' : ''}" data-sp="tpl:${esc(t.id)}" title="${esc(t.name)}"><div class="ed2-tp">${R.svg(t)}</div><span>${esc(t.name)}</span></button>`).join('') || '<div class="ed2-empty">검색 결과가 없습니다.</div>';
  }
  function applyTemplate(id) {
    const t = (tplCache || []).find(x => x.id === id); if (!t) return;
    if (t.id === st.tpl.id && !st.dirty) return toast('이미 이 템플릿으로 작업 중입니다.');
    if (st.dirty && !confirm('현재 편집 내용이 선택한 템플릿으로 교체됩니다. (작업내역에서 복구할 수 있습니다) 계속할까요?')) return;
    st.tpl = { id: t.id, name: t.name, category: t.category, mm: t.mm, products: t.products || [], w: t.w, h: t.h };
    st.doc = { w: t.w, h: t.h, bg: t.bg, elements: clone(t.elements) }; st.orig = clone(st.doc); st.ids = []; st.designId = null;
    st.name = t.name; $('#ed-name').value = t.name; document.querySelector('.ed2-hint').lastChild.textContent = '';
    push(); st.dirty = false; topState(); fit(); panel(); fillTplGrid();
    toast(`‘${t.name}’ 템플릿을 불러왔습니다.`);
  }
  function renderGraphics() {
    $('#ed-spb').innerHTML = `<p class="ed2-note">클릭하면 캔버스 가운데에 추가됩니다.</p><div class="ed2-ggrid">${GRAPHICS.map(([n, mk], i) => {
      const p = mk(100, 100), s = 66 / Math.max(p.w, p.h), el = { id: 'p', x: (100 - p.w * s) / 2, y: (100 - p.h * s) / 2, opacity: 1, stroke: 'none', sw: 0, rx: 0, ...p, w: p.w * s, h: p.h * s };
      if (el.sw) el.sw *= s; if (el.rx) el.rx = Math.min(el.rx * s, 999);
      return `<button class="ed2-g" data-sp="gr:${i}" title="${n}">${R.svg({ w: 100, h: 100, bg: '#f3f4f6', elements: [el] })}<span>${n}</span></button>`;
    }).join('')}</div>`;
  }
  function addGraphic(i) {
    const w = st.doc.w, h = st.doc.h, p = GRAPHICS[i][1](w, h), ew = Math.max(8, Math.round(p.w)), eh = Math.max(4, Math.round(p.h));
    const e = { id: uid(), opacity: 1, stroke: 'none', sw: 0, rx: 0, ...p, w: ew, h: eh, x: Math.round((w - ew) / 2), y: Math.round((h - eh) / 2) };
    if (e.sw) e.sw = Math.round(e.sw); if (e.rx && e.rx < 900) e.rx = Math.round(e.rx);
    st.doc.elements.push(e); st.ids = [e.id]; push(); draw(); panel();
  }
  function renderTextPanel() {
    $('#ed-spb').innerHTML = `<p class="ed2-note">클릭하면 캔버스에 글상자가 추가됩니다. 글자를 더블클릭하면 내용을 바로 고칠 수 있습니다.</p><div class="ed2-tlist">${TEXT_PRESETS.map(([n, , css], i) => `<button data-sp="tx:${i}"><span style="${css}">${esc(n)}</span></button>`).join('')}
      <button data-sp="txpill"><span style="display:inline-block;background:#fb7a3a;color:#fff;border-radius:999px;padding:4px 14px;font-weight:800;font-size:13px">라벨 텍스트</span></button></div>`;
  }
  function addTextPreset(i) {
    const p = TEXT_PRESETS[i][1], size = Math.max(14, Math.round(st.doc.w * p.f));
    const e = { id: uid(), type: 'text', x: Math.round(st.doc.w * .1), y: Math.round(st.doc.h * .4), text: p.text, size, fill: '#111827', weight: p.weight, family: p.family || 'Malgun Gothic', align: 'left', lh: 1.3, ls: p.ls || 0, opacity: 1 };
    st.doc.elements.push(e); st.ids = [e.id]; push(); draw(); panel();
  }
  function addPillLabel() {
    const size = Math.max(14, Math.round(st.doc.w * .028)), w = Math.round(size * 9), h = Math.round(size * 2.1), x = Math.round(st.doc.w * .1), y = Math.round(st.doc.h * .4);
    const bg = { id: uid(), type: 'rect', x, y, w, h, fill: '#fb7a3a', stroke: 'none', sw: 0, rx: 999, opacity: 1 };
    const tx = { id: uid(), type: 'text', x: Math.round(x + w / 2), y: Math.round(y + h / 2 - size * 0.62), text: '라벨 텍스트', size, fill: '#ffffff', weight: 800, family: 'Malgun Gothic', align: 'center', lh: 1.3, ls: 2, opacity: 1 };
    st.doc.elements.push(bg, tx); st.ids = [bg.id, tx.id]; push(); draw(); panel();
  }
  function renderBg() {
    $('#ed-spb').innerHTML = `<h4 class="ed2-h">단색</h4><div class="ed2-sw">${BG_SOLID.map(c => `<button data-sp="bgs:${c}" style="background:${c}" title="${c}" class="${st.doc.bg === c && !getEl('bgfill') ? 'cur' : ''}"></button>`).join('')}</div>
      <label class="ed2-custom">직접 선택 <input type="color" data-bgcolor value="${hex6(st.doc.bg)}"></label>
      <h4 class="ed2-h">그라데이션</h4><div class="ed2-sw ed2-sw2">${BG_GRAD.map((g, i) => `<button data-sp="bgg:${i}" style="background:linear-gradient(${g[2] + 90}deg,${g[0]},${g[1]})" title="그라데이션 ${i + 1}"></button>`).join('')}</div>
      <p class="ed2-note">그라데이션 배경은 맨 뒤 ‘배경’ 레이어로 추가되며, 속성 패널에서 색과 각도를 바꿀 수 있습니다.</p>`;
  }
  function setBgSolid(c) { st.doc.elements = st.doc.elements.filter(e => e.id !== 'bgfill'); st.doc.bg = c; push(); draw(); panel(); if (st.rail === 'bg') renderBg(); }
  function setBgGrad(i) {
    const g = BG_GRAD[i], base = { id: 'bgfill', type: 'rect', x: 0, y: 0, w: st.doc.w, h: st.doc.h, fill: g[0], grad: { a: g[0], b: g[1], ang: g[2] }, stroke: 'none', sw: 0, rx: 0, opacity: 1 }, e = getEl('bgfill');
    if (e) Object.assign(e, base); else st.doc.elements.unshift(base);
    push(); draw(); panel(); if (st.rail === 'bg') renderBg();
  }
  function renderUpload() {
    $('#ed-spb').innerHTML = `<button class="ed2-upbtn" data-sp="upbtn">이미지 업로드</button><p class="ed2-note">png · jpg · webp · gif / 12MB 이하. 올린 이미지는 아래 목록에서 다시 사용할 수 있습니다. (이 브라우저 창을 닫기 전까지)</p>
      <div class="ed2-ugrid">${uploadCache.map((u, i) => `<button data-sp="up:${i}"><img src="${esc(u.href)}" alt=""></button>`).join('') || '<div class="ed2-empty">업로드한 이미지가 없습니다.</div>'}</div>`;
  }
  async function renderMine() {
    const body = $('#ed-spb');
    if (!S.user) { body.innerHTML = '<div class="ed2-empty">로그인하면 작업을 저장하고 다시 열 수 있습니다.<br><br><a class="btn sm" href="#/login">로그인</a></div>'; return; }
    body.innerHTML = '<div class="ed2-empty">불러오는 중…</div>';
    let list = []; try { list = await api('/api/me/designs'); } catch { /* 무시 */ }
    if (st.rail !== 'mine') return;
    body.innerHTML = `<button class="ed2-upbtn" data-sp="minesave">현재 디자인 저장</button><div class="ed2-tgrid" style="margin-top:12px">${list.map(d => `<button class="ed2-tpl ${d.id === st.designId ? 'cur' : ''}" data-sp="mine:${esc(d.templateId)}:${esc(d.id)}" title="${esc(d.name)}"><div class="ed2-tp">${d.thumb ? `<img src="${esc(d.thumb)}" alt="">` : ''}</div><span>${esc(d.name)}</span></button>`).join('') || '<div class="ed2-empty" style="grid-column:1/-1">저장한 디자인이 없습니다.</div>'}</div>`;
  }
  function onSpInput(ev) {
    const t = ev.target;
    if (t.id === 'ed-tq') { st.tq = t.value; fillTplGrid(); }
    else if (t.dataset.bgcolor != null) { st.doc.elements = st.doc.elements.filter(e => e.id !== 'bgfill'); st.doc.bg = t.value; draw(); pushSoon(); }
    else onPanelInput(ev);
  }
  function onSpClick(ev) {
    const b = ev.target.closest('[data-sp]');
    if (!b) return onPanelClick(ev);   // 레이어 패널 버튼
    const [k, ...rest] = b.dataset.sp.split(':'), v = rest.join(':');
    if (k === 'tpl') applyTemplate(v);
    else if (k === 'tc') { st.tc = v; fillTplGrid(); }
    else if (k === 'gr') addGraphic(+v);
    else if (k === 'tx') addTextPreset(+v);
    else if (k === 'txpill') addPillLabel();
    else if (k === 'bgs') setBgSolid(v);
    else if (k === 'bgg') setBgGrad(+v);
    else if (k === 'up') { const u = uploadCache[+v]; if (u) addImageElement(u); }
    else if (k === 'upbtn') { st.replacing = false; $('#ed-file').click(); }
    else if (k === 'minesave') guard(async () => { await save(); renderMine(); })();
    else if (k === 'mine') { const [tid, did] = v.split(':'); if (st.dirty && !confirm('저장하지 않은 편집 내용이 사라집니다. 계속할까요?')) return; location.hash = `#/editor/${tid}?design=${did}`; }
  }

  // ---------- 캔버스 ----------
  function draw() {
    const paper = $('#ed-paper'); if (!paper) return;
    paper.style.width = st.doc.w * st.zoom + 'px'; paper.style.height = st.doc.h * st.zoom + 'px';
    paper.innerHTML = R.svg(st.doc);
    const svg = paper.firstChild; svg.style.cssText = 'width:100%;height:100%;display:block';
    overlay(svg);
    zoomUi();
    if (st.rail === 'layers' && st.spOpen && !(st.mode === 'props' && selIds().length)) layers();
  }
  function bbox(e, svg) {
    if (e.type === 'text') { const n = svg.querySelector(`[data-id="${e.id}"]`); if (n) { const b = n.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; } }
    return { x: e.x, y: e.y, w: e.w, h: e.h };
  }
  // 현재 화면 기준 모든 요소의 실제 영역(글자 포함)
  function boxes() { const svg = $('#ed-paper').firstChild, m = new Map(); st.doc.elements.forEach(e => { if (!e.hidden) m.set(e.id, bbox(e, svg)); }); return m; }
  const isBg = b => b.w >= st.doc.w * 0.95 && b.h >= st.doc.h * 0.9;
  function overlay(svg) {
    const u = 1 / st.zoom, g = document.createElementNS(NS, 'g'), ids = selIds().filter(id => !getEl(id).hidden); let h = '';
    const dash = `stroke-width="${2 * u}" stroke-dasharray="${6 * u} ${4 * u}"`;
    if (ids.length) {
      const bs = ids.map(id => bbox(getEl(id), svg));
      bs.forEach(b => { h += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" stroke="${ids.length > 1 ? '#7c3aed' : '#2563eb'}" ${dash} pointer-events="none"/>`; });
      if (ids.length > 1) { const ub = union(bs); h += `<rect x="${ub.x}" y="${ub.y}" width="${ub.w}" height="${ub.h}" fill="rgba(124,58,237,.05)" stroke="#7c3aed" stroke-width="${2 * u}" pointer-events="none"/>`; }
      else {
        const b = bs[0], hs = 12 * u, e = getEl(ids[0]);
        const corners = e.type === 'text' ? { se: [b.x + b.w, b.y + b.h] } : { nw: [b.x, b.y], ne: [b.x + b.w, b.y], sw: [b.x, b.y + b.h], se: [b.x + b.w, b.y + b.h] };
        h += Object.entries(corners).map(([k, [cx, cy]]) => `<rect data-h="${k}" x="${cx - hs / 2}" y="${cy - hs / 2}" width="${hs}" height="${hs}" fill="#fff" stroke="#2563eb" stroke-width="${2 * u}" style="cursor:${k === 'nw' || k === 'se' ? 'nwse' : 'nesw'}-resize"/>`).join('');
      }
    }
    (st.guides || []).forEach(gd => { h += gd.v != null ? `<line x1="${gd.v}" y1="0" x2="${gd.v}" y2="${st.doc.h}" stroke="#ec4899" stroke-width="${1.5 * u}" stroke-dasharray="${5 * u} ${3 * u}" pointer-events="none"/>` : `<line x1="0" y1="${gd.h}" x2="${st.doc.w}" y2="${gd.h}" stroke="#ec4899" stroke-width="${1.5 * u}" stroke-dasharray="${5 * u} ${3 * u}" pointer-events="none"/>`; });
    if (st.marquee) { const m = st.marquee; h += `<rect x="${Math.min(m.x1, m.x2)}" y="${Math.min(m.y1, m.y2)}" width="${Math.abs(m.x2 - m.x1)}" height="${Math.abs(m.y2 - m.y1)}" fill="rgba(37,99,235,.1)" stroke="#2563eb" stroke-width="${1.5 * u}" pointer-events="none"/>`; }
    g.innerHTML = h; svg.appendChild(g);
  }

  // ---------- 드래그 / 리사이즈 / 범위선택 (자석 가이드 포함) ----------
  const pt = ev => { const r = $('#ed-paper').getBoundingClientRect(); return { x: (ev.clientX - r.left) / st.zoom, y: (ev.clientY - r.top) / st.zoom }; };
  function startDrag(kind, ev, handle) {
    ev.preventDefault();
    const bm = boxes(), p0 = pt(ev), ids = selIds();
    const d = { kind, handle, p0, moved: false, bm };
    if (kind === 'marquee') { d.base = (ev.shiftKey ? [...st.ids] : []); if (!ev.shiftKey && st.ids.length) { st.ids = []; panel(); } }
    else {
      d.origs = new Map(ids.map(id => [id, clone(getEl(id))]));
      d.ub = union(ids.map(id => bm.get(id)));
      // 자석 대상선: 캔버스 가장자리/중앙 + 선택되지 않은 다른 요소의 왼쪽·가운데·오른쪽/위·가운데·아래
      const tx = [0, st.doc.w / 2, st.doc.w], ty = [0, st.doc.h / 2, st.doc.h];
      bm.forEach((b, id) => { if (ids.includes(id) || isBg(b)) return; tx.push(b.x, b.x + b.w / 2, b.x + b.w); ty.push(b.y, b.y + b.h / 2, b.y + b.h); });
      d.tx = tx; d.ty = ty;
    }
    st.drag = d;
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp, { once: true });
  }
  // 값 목록(vals)이 대상선(targets)에 th 이내로 가까우면 보정값과 대상선 반환
  function snapVals(vals, targets, th) {
    let best = null;
    for (const t of targets) for (const v of vals) { const dd = t - v; if (Math.abs(dd) <= th && (!best || Math.abs(dd) < Math.abs(best.d))) best = { d: dd, line: t }; }
    return best;
  }
  function onMove(ev) {
    const d = st.drag; if (!d) return;
    const p = pt(ev); let dx = p.x - d.p0.x, dy = p.y - d.p0.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) d.moved = true;
    const th = 8 / st.zoom, snapOn = st.snap && !ev.altKey;
    if (d.kind === 'marquee') {
      st.marquee = { x1: d.p0.x, y1: d.p0.y, x2: p.x, y2: p.y };
      const m = st.marquee, mx1 = Math.min(m.x1, m.x2), mx2 = Math.max(m.x1, m.x2), my1 = Math.min(m.y1, m.y2), my2 = Math.max(m.y1, m.y2), hit = [];
      d.bm.forEach((b, id) => { if (!isBg(b) && b.x < mx2 && b.x + b.w > mx1 && b.y < my2 && b.y + b.h > my1) hit.push(id); });
      st.ids = [...new Set([...d.base, ...hit])]; draw(); return;
    }
    if (d.kind === 'move') {
      st.guides = [];
      if (snapOn) {
        const nb = { x: d.ub.x + dx, y: d.ub.y + dy, w: d.ub.w, h: d.ub.h };
        const sx = snapVals([nb.x, nb.x + nb.w / 2, nb.x + nb.w], d.tx, th), sy = snapVals([nb.y, nb.y + nb.h / 2, nb.y + nb.h], d.ty, th);
        if (sx) { dx += sx.d; st.guides.push({ v: sx.line }); } if (sy) { dy += sy.d; st.guides.push({ h: sy.line }); }
      }
      d.origs.forEach((o, id) => { const e = getEl(id); if (e) { e.x = Math.round(o.x + dx); e.y = Math.round(o.y + dy); } });
    } else {
      const e = single(), o = d.origs.get(st.ids[0]); if (!e || !o) return;
      st.guides = [];
      if (e.type === 'text') { e.size = Math.round(Math.max(8, Math.min(1500, o.size * ((d.ub.w + dx) / Math.max(1, d.ub.w))))); }
      else {
        const keep = e.type === 'icon' || ev.shiftKey, ratio = o.w / o.h, min = 10, k = d.handle;
        let x = o.x, y = o.y, w = o.w, h = o.h;
        if (k.includes('e')) w = o.w + dx; if (k.includes('w')) { w = o.w - dx; x = o.x + dx; }
        if (k.includes('s')) h = o.h + dy; if (k.includes('n')) { h = o.h - dy; y = o.y + dy; }
        if (snapOn && !keep) {   // 움직이는 모서리를 다른 요소/캔버스 선에 맞춤
          if (k.includes('e')) { const s = snapVals([x + w], d.tx, th); if (s) { w += s.d; st.guides.push({ v: s.line }); } }
          if (k.includes('w')) { const s = snapVals([x], d.tx, th); if (s) { x += s.d; w -= s.d; st.guides.push({ v: s.line }); } }
          if (k.includes('s')) { const s = snapVals([y + h], d.ty, th); if (s) { h += s.d; st.guides.push({ h: s.line }); } }
          if (k.includes('n')) { const s = snapVals([y], d.ty, th); if (s) { y += s.d; h -= s.d; st.guides.push({ h: s.line }); } }
        }
        if (keep) { h = w / ratio; if (k.includes('n')) y = o.y + o.h - h; if (k.includes('w')) x = o.x + o.w - w; }
        if (w < min || h < min) return;
        Object.assign(e, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
      }
    }
    draw(); syncInputs();
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove);
    const d = st.drag; st.drag = null; st.guides = []; st.marquee = null;
    if (d && d.kind === 'marquee') { draw(); panel(); return; }
    if (d && d.moved) push(); draw();
  }

  // ---------- 정렬 도구: 수동 정렬 / 간격 균등 / 크기 맞춤 ----------
  function alignSel(kind) {
    const ids = selIds(); if (!ids.length) return toast('먼저 요소를 선택하세요.');
    draw(); const bm = boxes();
    const ref = ids.length > 1 && st.alignRef !== 'canvas' ? union(ids.map(id => bm.get(id))) : { x: 0, y: 0, w: st.doc.w, h: st.doc.h };
    ids.forEach(id => {
      const e = getEl(id), b = bm.get(id); let dx = 0, dy = 0;
      if (kind === 'l') dx = ref.x - b.x; else if (kind === 'c') dx = ref.x + ref.w / 2 - (b.x + b.w / 2); else if (kind === 'r') dx = ref.x + ref.w - (b.x + b.w);
      else if (kind === 't') dy = ref.y - b.y; else if (kind === 'm') dy = ref.y + ref.h / 2 - (b.y + b.h / 2); else if (kind === 'b') dy = ref.y + ref.h - (b.y + b.h);
      e.x = Math.round(e.x + dx); e.y = Math.round(e.y + dy);
    });
    push(); draw(); panel();
  }
  function distribute(axis) {   // 'h' 가로 간격 균등, 'v' 세로 간격 균등
    const ids = selIds(); if (ids.length < 3) return toast('간격을 맞추려면 3개 이상 선택하세요.');
    draw(); const bm = boxes(), p = axis === 'h' ? 'x' : 'y', s = axis === 'h' ? 'w' : 'h';
    const list = ids.map(id => ({ e: getEl(id), b: bm.get(id) })).sort((a, b) => a.b[p] - b.b[p]);
    const first = list[0].b, last = list[list.length - 1].b, total = last[p] + last[s] - first[p], sum = list.reduce((a, i) => a + i.b[s], 0), gap = (total - sum) / (list.length - 1);
    let cur = first[p];
    list.forEach(i => { i.e[p] = Math.round(i.e[p] + (cur - i.b[p])); cur += i.b[s] + gap; });
    push(); draw(); panel();
  }
  function matchSize(dim) {
    const ids = selIds(); if (ids.length < 2) return toast('크기를 맞추려면 2개 이상 선택하세요.');
    const ref = getEl(ids[0]); if (ref.type === 'text') return toast('첫 번째로 선택한 요소가 글자이면 크기를 맞출 수 없습니다.');
    ids.slice(1).forEach(id => { const e = getEl(id); if (e.type !== 'text') e[dim] = ref[dim]; });
    push(); draw(); panel();
  }

  // ---------- 요소 추가/동작 ----------
  function addElement(kind) {
    const w = st.doc.w, h = st.doc.h;
    if (kind === 'image') { st.replacing = false; return $('#ed-file').click(); }
    const base = { id: uid(), opacity: 1 };
    const e = kind === 'text' ? { ...base, type: 'text', x: Math.round(w * .1), y: Math.round(h * .1), text: '텍스트를 입력하세요', size: Math.round(w * .05), fill: '#111827', weight: 700, family: 'Malgun Gothic', align: 'left', lh: 1.3, ls: 0 }
      : kind === 'rect' ? { ...base, type: 'rect', x: Math.round(w * .2), y: Math.round(h * .2), w: Math.round(w * .3), h: Math.round(h * .15), fill: '#0ea5e9', stroke: 'none', sw: 0, rx: 0 }
        : kind === 'ellipse' ? { ...base, type: 'ellipse', x: Math.round(w * .2), y: Math.round(h * .2), w: Math.round(Math.min(w, h) * .3), h: Math.round(Math.min(w, h) * .3), fill: '#f59e0b', stroke: 'none', sw: 0 }
          : { ...base, type: 'icon', shape: 'tooth', x: Math.round(w * .4), y: Math.round(h * .4), w: Math.round(Math.min(w, h) * .2), h: Math.round(Math.min(w, h) * .2 * .875), fill: '#0ea5e9' };
    st.doc.elements.push(e); st.ids = [e.id]; push(); draw(); panel();
  }
  function addImageElement(img) {
    let w = st.doc.w * .5, h = w / img.ratio; if (h > st.doc.h * .7) { h = st.doc.h * .7; w = h * img.ratio; }
    const e = { id: uid(), type: 'image', href: img.href, x: Math.round((st.doc.w - w) / 2), y: Math.round((st.doc.h - h) / 2), w: Math.round(w), h: Math.round(h), opacity: 1, brightness: 1, contrast: 1, saturate: 1, blur: 0, gray: false };
    st.doc.elements.push(e); st.ids = [e.id]; push(); draw(); panel();
  }
  function action(a) {
    const ids = selIds(); if (!ids.length) return toast('먼저 요소를 선택하세요.');
    const arr = st.doc.elements;
    if (a === 'del') { st.doc.elements = arr.filter(e => !ids.includes(e.id)); st.ids = []; }
    else if (a === 'dup') { const news = ids.map(id => { const c = clone(getEl(id)); c.id = uid(); c.x += 30; c.y += 30; return c; }); arr.push(...news); st.ids = news.map(c => c.id); }
    else if (a === 'front') { const sel = arr.filter(e => ids.includes(e.id)); st.doc.elements = [...arr.filter(e => !ids.includes(e.id)), ...sel]; }
    else if (a === 'back') { const sel = arr.filter(e => ids.includes(e.id)); st.doc.elements = [...sel, ...arr.filter(e => !ids.includes(e.id))]; }
    else if (a === 'forward') { for (let i = arr.length - 2; i >= 0; i--) if (ids.includes(arr[i].id) && !ids.includes(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; }
    else if (a === 'backward') { for (let i = 1; i < arr.length; i++) if (ids.includes(arr[i].id) && !ids.includes(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; }
    push(); draw(); panel();
  }
  function onKey(ev) {
    if (!st || !$('#ed-paper')) return;
    const tag = (ev.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    const k = ev.key, mod = ev.ctrlKey || ev.metaKey;
    if (mod && k.toLowerCase() === 'z') { ev.preventDefault(); return undo(ev.shiftKey ? 1 : -1); }
    if (mod && k.toLowerCase() === 'y') { ev.preventDefault(); return undo(1); }
    if (mod && k.toLowerCase() === 'd') { ev.preventDefault(); return action('dup'); }
    if (mod && k.toLowerCase() === 'a') { ev.preventDefault(); return setSel(st.doc.elements.filter(e => !e.hidden).map(e => e.id)); }
    if (mod && k.toLowerCase() === 's') { ev.preventDefault(); return guard(save)(); }
    if (k === 'Escape') return setSel([]);
    const ids = selIds(); if (!ids.length) return;
    if (k === 'Delete' || k === 'Backspace') { ev.preventDefault(); return action('del'); }
    const step = ev.shiftKey ? 10 : 1, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[k];
    if (mv) { ev.preventDefault(); ids.forEach(id => { const e = getEl(id); e.x += mv[0]; e.y += mv[1]; }); draw(); syncInputs(); pushSoon(); }
  }

  const PH = '<div class="ed2-backrow"><button data-do="deselect">‹ 선택 해제하고 패널로 돌아가기</button></div>';
  // ---------- 속성 패널 ----------
  const row = (lbl, inner) => `<div class="ed-row"><label>${lbl}</label>${inner}</div>`;
  const numIn = (k, v, o = '') => `<input type="number" data-k="${k}" data-num value="${Math.round(v * 100) / 100}" ${o}>`;
  const colorIn = (k, v) => `<input type="color" data-k="${k}" value="${hex6(v)}">`;
  const range = (k, v, min, max, step) => `<input type="range" data-k="${k}" data-num min="${min}" max="${max}" step="${step}" value="${v}"><span class="ed-rv">${Math.round(v * 100) / 100}</span>`;
  const posRows = e => row('위치 X / Y', `<div class="ed-2">${numIn('x', e.x)}${numIn('y', e.y)}</div>`) + (e.type !== 'text' ? row('크기 W / H', `<div class="ed-2">${numIn('w', e.w, 'min="1"')}${numIn('h', e.h, 'min="1"')}</div>`) : '');
  const alignBar = multi => `<div class="ed2-sec"><div class="ed2-ar2">${[['l', '⇤', '왼쪽 정렬'], ['c', '↔', '가로 가운데'], ['r', '⇥', '오른쪽 정렬'], ['t', '⤒', '위쪽 정렬'], ['m', '↕', '세로 가운데'], ['b', '⤓', '아래쪽 정렬']].map(([k, ic, t]) => `<button data-align-k="${k}" title="${t}">${ic}</button>`).join('')}${multi ? '<button data-dist="h" title="가로 간격 균등 (3개 이상)">⇹</button><button data-dist="v" title="세로 간격 균등 (3개 이상)">⇳</button>' : ''}</div>
    ${multi ? `<div class="ed-ref"><label><input type="radio" name="aref" value="sel" ${st.alignRef !== 'canvas' ? 'checked' : ''}> 선택한 요소끼리</label><label><input type="radio" name="aref" value="canvas" ${st.alignRef === 'canvas' ? 'checked' : ''}> 캔버스 기준</label></div>` : '<div class="ed2-line">캔버스(종이) 기준으로 정렬합니다</div>'}
    <div class="ed2-ar2 ed2-ord">${[['front', '맨 앞으로'], ['forward', '앞으로'], ['backward', '뒤로'], ['back', '맨 뒤로']].map(([a, t]) => `<button data-act2="${a}">${t}</button>`).join('')}</div></div>`;
  function panel() {   // 선택이 바뀌면 왼쪽 패널을 '속성' 화면으로 전환, 선택 해제 시 원래 패널로 복귀
    const ids = selIds(), key = ids.join(','), fl = $('#ed-float'); if (fl) fl.hidden = !ids.length;
    if (key !== st.selKey) {
      st.selKey = key;
      if (!ids.length) st.mode = 'rail';
      else if (!st.fromLayer) { st.mode = 'props'; st.spOpen = true; }
      return renderSp();
    }
    if (st.mode === 'props' && st.spOpen && ids.length) renderProps();
  }
  function renderProps() {
    const el = $('#ed-spb'); if (!el) return;
    const ids = selIds(); if (!ids.length) return;
    if (ids.length > 1) { el.innerHTML = PH + alignBar(true) + `<div class="ed-box"><h4>${ids.length}개 선택됨</h4><p class="ed-note" style="margin:0 0 8px">드래그하면 함께 이동합니다. Shift+클릭으로 추가/해제, Esc로 선택 해제.</p><div class="ed-al"><button data-same="w">너비 같게</button><button data-same="h">높이 같게</button></div><div class="ed-al" style="margin-top:8px"><button data-act2="dup">복제</button><button data-act2="del">삭제</button></div></div>`; return; }
    const e = single();
    if (!e) {
      el.innerHTML = `<div class="ed-box"><h4>캔버스</h4>${row('배경색', colorIn('bg', st.doc.bg))}<p class="ed-note">크기 ${st.doc.w} × ${st.doc.h}px · 인쇄 규격 ${esc(st.tpl.mm || '')}</p>
        <p class="ed-note">▶ 요소를 끌면 <b>가이드선</b>에 자동으로 달라붙습니다.<br>▶ Shift+클릭 / 빈 곳 드래그로 여러 개를 선택해 정렬할 수 있습니다.<br>▶ 글자는 더블클릭하면 바로 내용을 수정할 수 있습니다.<br>▶ 이미지를 선택하면 밝기·대비·채도 <b>보정</b>이 가능합니다.</p></div>`;
      return;
    }
    let h = `<div class="ed-box">` + posRows(e);
    if (e.type === 'text') {
      h += `<textarea data-k="text" rows="3">${esc(e.text)}</textarea>`
        + row('글꼴', `<select data-k="family">${FONTS.map(f => `<option ${f === e.family ? 'selected' : ''}>${f}</option>`).join('')}</select>`)
        + row('글자 크기', numIn('size', e.size, 'min="4" max="1500"')) + row('글자 색', colorIn('fill', e.fill))
        + row('굵기', `<select data-k="weight" data-num>${[[400, '보통'], [600, '약간 굵게'], [700, '굵게'], [800, '매우 굵게']].map(([v, t]) => `<option value="${v}" ${+e.weight === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`)
        + row('글 정렬', `<div class="ed-al">${[['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']].map(([v, t]) => `<button data-align="${v}" class="${e.align === v ? 'on' : ''}">${t}</button>`).join('')}</div>`)
        + row('줄 간격', numIn('lh', e.lh, 'step="0.1" min="0.8" max="3"')) + row('자간', numIn('ls', e.ls || 0, 'step="1"')) + row('이탤릭', `<input type="checkbox" data-k="italic" ${e.italic ? 'checked' : ''}>`) + row('투명도', range('opacity', e.opacity ?? 1, 0, 1, 0.05));
    } else if (e.type === 'rect' || e.type === 'ellipse') {
      h += row('채우기', `<div class="ed-2">${colorIn('fill', e.fill)}<label class="ed-ck"><input type="checkbox" data-k="fillNone" ${e.fill === 'none' ? 'checked' : ''}> 없음</label></div>`)
        + row('테두리 색', `<div class="ed-2">${colorIn('stroke', e.stroke)}<label class="ed-ck"><input type="checkbox" data-k="strokeNone" ${e.stroke === 'none' || !e.stroke ? 'checked' : ''}> 없음</label></div>`) + row('테두리 두께', numIn('sw', e.sw || 0, 'min="0"'))
        + (e.type === 'rect' ? row('모서리 둥글게', numIn('rx', e.rx || 0, 'min="0"')) : '') + row('투명도', range('opacity', e.opacity ?? 1, 0, 1, 0.05))
        + row('그라데이션', `<label class="ed-ck"><input type="checkbox" data-k="gradOn" ${e.grad ? 'checked' : ''}> 사용</label>`) + (e.grad ? row('끝 색 / 각도', `<div class="ed-2">${colorIn('gradB', e.grad.b)}${numIn('gradAng', e.grad.ang ?? 45, 'step="15"')}</div>`) : '')
        + row('그림자', `<input type="checkbox" data-k="shadow" ${e.shadow ? 'checked' : ''}>`) + row('회전(°)', numIn('rot', e.rot || 0, 'step="1" min="-360" max="360"'));
    } else if (e.type === 'icon') {
      h += row('색상', colorIn('fill', e.fill)) + row('투명도', range('opacity', e.opacity ?? 1, 0, 1, 0.05)) + row('회전(°)', numIn('rot', e.rot || 0, 'step="1" min="-360" max="360"'));
    } else if (e.type === 'image') {
      h += `<h4 style="margin-top:6px">🎨 이미지 보정</h4>` + row('밝기', range('brightness', e.brightness ?? 1, 0.2, 2, 0.05)) + row('대비', range('contrast', e.contrast ?? 1, 0.2, 2, 0.05)) + row('채도', range('saturate', e.saturate ?? 1, 0, 2, 0.05)) + row('흐림', range('blur', e.blur ?? 0, 0, 20, 0.5))
        + row('흑백', `<input type="checkbox" data-k="gray" ${e.gray ? 'checked' : ''}>`) + row('투명도', range('opacity', e.opacity ?? 1, 0, 1, 0.05)) + `<div class="ed-al"><button data-do="reset-adj">보정 초기화</button><button data-do="replace">이미지 교체</button></div>`;
    }
    h += `</div>`;
    el.innerHTML = PH + alignBar(false) + h;
  }
  function syncInputs() { const e = single(), el = $('#ed-spb'); if (!e || !el || st.mode !== 'props') return; el.querySelectorAll('[data-k]').forEach(i => { const k = i.dataset.k; if (['x', 'y', 'w', 'h', 'size'].includes(k) && e[k] != null && document.activeElement !== i) i.value = Math.round(e[k] * 100) / 100; }); }
  function onPanelInput(ev) {
    const t = ev.target;
    if (t.name === 'aref') { st.alignRef = t.value; return; }
    const k = t.dataset.k; if (!k) return;
    let v = t.type === 'checkbox' ? t.checked : t.dataset.num != null ? +t.value : t.value;
    if (k === 'bg') { st.doc.bg = v; draw(); return pushSoon(); }
    const e = single(); if (!e) return;
    if (k === 'fillNone') { e.fill = v ? 'none' : '#cccccc'; panel(); }
    else if (k === 'strokeNone') { e.stroke = v ? 'none' : '#111827'; if (!v && !e.sw) e.sw = 4; panel(); }
    else if (k === 'gradOn') { if (v) e.grad = { a: e.fill && e.fill !== 'none' ? e.fill : '#0ea5e9', b: '#6366f1', ang: 45 }; else delete e.grad; panel(); }
    else if (k === 'gradB') { if (e.grad) e.grad.b = v; }
    else if (k === 'gradAng') { if (e.grad && Number.isFinite(v)) e.grad.ang = v; }
    else if (k === 'fill' && e.fill === 'none') e.fill = v;
    else if (k === 'fill' && e.grad) { e.fill = v; e.grad.a = v; }
    else { if (t.dataset.num != null && !Number.isFinite(v)) return; e[k] = v; }
    if (t.type === 'range') { const sp = t.nextElementSibling; if (sp) sp.textContent = Math.round(v * 100) / 100; }
    draw(); pushSoon();
  }
  function onPanelClick(ev) {
    const b = ev.target.closest('button'); if (!b) return; const e = single();
    if (b.dataset.alignK) return alignSel(b.dataset.alignK);
    if (b.dataset.dist) return distribute(b.dataset.dist);
    if (b.dataset.same) return matchSize(b.dataset.same);
    if (b.dataset.act2) return action(b.dataset.act2);
    if (b.dataset.align && e) { e.align = b.dataset.align; push(); draw(); panel(); }
    else if (b.dataset.do === 'reset-adj' && e) { Object.assign(e, { brightness: 1, contrast: 1, saturate: 1, blur: 0, gray: false, opacity: 1 }); push(); draw(); panel(); }
    else if (b.dataset.do === 'replace') { st.replacing = true; $('#ed-file').click(); }
    else if (b.dataset.do === 'deselect') setSel([]);
    else if (b.dataset.layer) {
      const [act, id] = b.dataset.layer.split(':'), arr = st.doc.elements, i = arr.findIndex(x => x.id === id); if (i < 0) return;
      if (act === 'sel') { st.fromLayer = true; setSel(ev.shiftKey || ev.ctrlKey ? (st.ids.includes(id) ? st.ids.filter(x => x !== id) : [...st.ids, id]) : [id]); st.fromLayer = false; return; }
      if (act === 'del') { arr.splice(i, 1); st.ids = st.ids.filter(x => x !== id); }
      if (act === 'hide') arr[i].hidden = !arr[i].hidden;
      if (act === 'up' && i < arr.length - 1) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      if (act === 'down' && i > 0) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      push(); draw(); layers();
    }
  }
  function layers() {
    const el = $('#ed-spb'); if (!el || st.rail !== 'layers' || !st.spOpen || (st.mode === 'props' && selIds().length)) return;
    el.innerHTML = `<div class="ed-box" style="padding:0"><p class="ed-note" style="margin:0 0 8px">⠿ 끌어서 위아래 순서를 바꿀 수 있습니다 · Shift+클릭=다중 선택 후 함께 이동</p>${[...st.doc.elements].reverse().map(e => `<div class="ed-layer ${st.ids.includes(e.id) ? 'on' : ''}" data-lid="${e.id}"><i class="ed-grip" title="끌어서 순서 변경">⠿</i><button class="ed-ln" data-layer="sel:${e.id}">${e.type === 'text' ? '📝 ' + esc(String(e.text).replace(/\n/g, ' ').slice(0, 14)) : e.type === 'image' ? '🖼️ 이미지' : e.type === 'icon' ? '🦷 로고' : e.type === 'rect' ? '▭ 사각형' : '◯ 원'}</button>
      <span class="ed-ctl"><button data-layer="hide:${e.id}" title="숨김">${e.hidden ? '🚫' : '👁'}</button><button data-layer="up:${e.id}">▲</button><button data-layer="down:${e.id}">▼</button><button data-layer="del:${e.id}">✕</button></span></div>`).join('') || '<p class="ed-note">요소가 없습니다.</p>'}</div>`;
  }

  // ---------- 레이어 드래그 앤 드롭 순서 변경 ----------
  function onLayerDown(ev) {
    if (st.rail !== 'layers' || !st.spOpen || ev.button !== 0) return;
    const row = ev.target.closest('.ed-layer'); if (!row || ev.target.closest('.ed-ctl')) return;
    const id = row.dataset.lid, sx = ev.clientX, sy = ev.clientY;
    const moving = st.ids.length > 1 && st.ids.includes(id) ? st.doc.elements.filter(e => st.ids.includes(e.id)).map(e => e.id) : [id];
    const rows = () => [...document.querySelectorAll('#ed-spb .ed-layer')], clear = () => rows().forEach(r => r.classList.remove('drop-before', 'drop-end'));
    let dragging = false, target = null;
    const move = e => {
      if (!dragging) {
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 6) return;
        dragging = true; document.body.classList.add('ed-dragging');
        rows().forEach(r => { if (moving.includes(r.dataset.lid)) r.classList.add('dragging'); });
      }
      const side = document.querySelector('#ed-spb'), sr = side.getBoundingClientRect();   // 가장자리에서 자동 스크롤
      if (e.clientY < sr.top + 40) side.scrollTop -= 14; else if (e.clientY > sr.bottom - 40) side.scrollTop += 14;
      clear(); target = null;
      const cand = rows().filter(r => !moving.includes(r.dataset.lid)), before = cand.find(r => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
      if (before) { before.classList.add('drop-before'); target = { before: before.dataset.lid }; }
      else if (cand.length) { cand[cand.length - 1].classList.add('drop-end'); target = { end: true }; }
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.body.classList.remove('ed-dragging');
      if (!dragging) return;
      st.justDragged = true; setTimeout(() => { st.justDragged = false; }, 60);
      clear();
      if (target) reorderLayers(moving, target); else layers();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  function reorderLayers(movingIds, target) {
    const els = st.doc.elements, disp = [...els].reverse().map(e => e.id);   // 화면 순서: 위가 앞(맨 앞 요소)
    const mv = disp.filter(i => movingIds.includes(i)), rest = disp.filter(i => !movingIds.includes(i));
    const pos = target.end ? rest.length : rest.indexOf(target.before), nd = [...rest.slice(0, pos), ...mv, ...rest.slice(pos)];
    if (nd.every((id, i) => id === disp[i])) return layers();
    const byId = new Map(els.map(e => [e.id, e]));
    st.doc.elements = nd.reverse().map(id => byId.get(id)); st.ids = movingIds;
    push(); draw(); layers();
  }
  // ---------- 이미지 읽기 ----------
  async function readImage(file) {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error('png, jpg, webp, gif 이미지만 사용할 수 있습니다.');
    if (file.size > 12e6) throw new Error('12MB 이하 이미지만 사용할 수 있습니다.');
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('이미지를 읽을 수 없습니다.')); i.src = url; });
    const s = Math.min(1, 1400 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
    cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
    return { href: cv.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88), ratio: img.width / img.height };
  }

  // ---------- 저장 / 내보내기 / 주문 ----------
  const hiScale = () => Math.min(3, Math.max(1, 2400 / Math.max(st.doc.w, st.doc.h)));
  async function save() {
    if (!S.user) { toast('로그인 후 내 디자인으로 저장할 수 있습니다.'); return false; }
    clearTimeout(histTimer); push();
    const thumb = await R.blobToDataUrl(await R.exportPng(st.doc, 300 / Math.max(st.doc.w, st.doc.h)));
    const r = await api('/api/designs', 'POST', { id: st.designId, templateId: st.tpl.id, name: st.name, doc: st.doc, thumb });
    st.designId = r.id; st.dirty = false; topState(); toast('내 디자인에 저장되었습니다.'); return true;
  }
  async function download(fmt = 'png', scale = 1) {
    let b = await R.exportPng(st.doc, scale);
    if (fmt === 'jpg') {   // JPG: 흰 배경 위에 합성해 용량을 줄임
      const bmp = await createImageBitmap(b), cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
      const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0);
      b = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = (st.name || 'design').replace(/[\\/:*?"<>|]/g, '_') + (fmt === 'jpg' ? '.jpg' : '.png'); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function modal(html) { closeModal(); const m = document.createElement('div'); m.className = 'ed-modal'; m.id = 'ed-modal'; m.innerHTML = `<div class="ed-mbox">${html}</div>`; m.addEventListener('mousedown', e => { if (e.target === m) closeModal(); }); document.body.appendChild(m); return m; }
  function closeModal() { const m = $('#ed-modal'); if (m) m.remove(); }
  function orderModal() {
    const prods = (st.tpl.products || []).map(id => (S.products || []).find(p => p.id === id)).filter(p => p && !p.soldout);
    if (!prods.length) return toast('이 템플릿은 SNS 등 디지털용입니다. ‘PNG 저장’으로 이미지를 내려받아 사용하세요.');
    const m = modal(`<h3>🛒 이 디자인으로 인쇄 주문</h3><p class="ed-note">편집한 디자인이 인쇄용 이미지(PNG)로 만들어져 주문서에 자동 첨부됩니다. 상품을 선택하면 수량·옵션 선택 화면으로 이동합니다.<br>디자인 크기: <b>${esc(st.tpl.mm || '')}</b></p>
      <div class="ed-plist">${prods.map((p, i) => `<label class="ed-pi"><input type="radio" name="edp" value="${esc(p.id)}" ${i ? '' : 'checked'}>${p.img ? `<img src="${esc(p.img)}" alt="">` : ''}<span><b>${esc(p.name)}</b><br><small>${esc(p.spec)}</small></span><em>${won(p.tiers[0].price)}~</em></label>`).join('')}</div>
      <div style="text-align:right;margin-top:14px"><button class="btn gray" id="edm-close">닫기</button> <button class="btn acc" id="edm-go">주문하러 가기 →</button></div>`);
    m.querySelector('#edm-close').onclick = closeModal;
    m.querySelector('#edm-go').onclick = guard(async ev => {
      const btn = ev.currentTarget, pid = m.querySelector('input[name=edp]:checked').value; btn.disabled = true; btn.textContent = '인쇄용 이미지 생성 중…';
      try {
        clearTimeout(histTimer); push();
        const blob = await R.exportPng(st.doc, hiScale()), fname = (st.name || 'design').replace(/[\\/:*?"<>|]/g, '_') + '.png';
        const r = await fetch('/api/upload', { method: 'POST', headers: { 'X-Filename': encodeURIComponent(fname) }, body: blob }), j = await r.json();
        if (!r.ok) throw new Error(j.error || '업로드에 실패했습니다.');
        sessionStorage.setItem('pendingDesign', JSON.stringify({ pid, file: { url: j.url, name: '디자인템플릿_' + fname }, label: st.name, tpl: st.tpl.name }));
        if (S.user) { try { await save(); } catch { /* 저장 실패는 주문 진행을 막지 않음 */ } }
        closeModal(); location.hash = '#/p/' + pid;
      } finally { btn.disabled = false; btn.textContent = '주문하러 가기 →'; }
    });
  }
  function adminRegisterModal() {
    const m = modal(`<h3>⭐ 템플릿으로 등록 (관리자)</h3><p class="ed-note">현재 편집 중인 디자인을 새 템플릿으로 갤러리에 등록합니다.</p>
      <div class="ed-row"><label>템플릿 이름</label><input id="adm-name" value="${esc(st.name)}"></div>
      <div class="ed-row"><label>카테고리</label><select id="adm-cat">${CATS.map(c => `<option ${c === st.tpl.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="ed-row"><label>인쇄 규격(표시용)</label><input id="adm-mm" value="${esc(st.tpl.mm || '')}"></div>
      <div class="ed-row"><label>주문 가능 상품</label><select id="adm-prods" multiple size="8">${(S.products || []).map(p => `<option value="${esc(p.id)}" ${(st.tpl.products || []).includes(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="ed-row"><label>등록 방식</label><div><label class="ed-ck"><input type="radio" name="adm-mode" value="new" checked> 새 템플릿으로 등록</label><br><label class="ed-ck"><input type="radio" name="adm-mode" value="over"> 기존 템플릿 덮어쓰기 (${esc(st.tpl.name)})</label></div></div>
      <div style="text-align:right;margin-top:12px"><button class="btn gray" id="adm-close">닫기</button> <button class="btn" id="adm-ok">등록</button></div>`);
    m.querySelector('#adm-close').onclick = closeModal;
    m.querySelector('#adm-ok').onclick = guard(async () => {
      const body = { name: $('#adm-name').value, category: $('#adm-cat').value, mm: $('#adm-mm').value, products: [...$('#adm-prods').selectedOptions].map(o => o.value), doc: st.doc };
      const over = document.querySelector('input[name=adm-mode]:checked').value === 'over', r = await fetch(over ? '/api/admin/templates/' + encodeURIComponent(st.tpl.id) : '/api/admin/templates', { method: over ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': localStorage.getItem('atoken') || '' }, body: JSON.stringify(body) }), j = await r.json();
      if (!r.ok) throw new Error(j.error || '등록 실패'); closeModal(); toast(over ? '템플릿이 덮어쓰기 되었습니다.' : '템플릿으로 등록되었습니다.');
    });
  }

  window.TplEditor = { mount, isDirty: () => !!(st && st.dirty), _state: () => st };
})();
