const $ = s => document.querySelector(s);
const won = n => Number(n || 0).toLocaleString('ko-KR') + '원';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = s => (s || '').replace('T', ' ').slice(0, 16);
let TOKEN = localStorage.getItem('atoken') || '';
const STATUS = ['입금대기', '결제완료', '시안확인중', '제작중', '배송중', '배송완료', '취소'];
const stCls = s => s === '취소' ? 'c' : s === '배송완료' ? 'd' : s === '입금대기' ? 'w' : '';

async function api(url, method = 'GET', body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { showLogin(); throw new Error(j.error); }
  if (!r.ok) throw new Error(j.error || '오류');
  return j;
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2000); }
const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message); } };
const modal = html => { $('#mbox').innerHTML = html; $('#modal').classList.add('on'); };
window.closeModal = () => $('#modal').classList.remove('on');
$('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') closeModal(); });

function showLogin() { $('#login').style.display = 'flex'; }
window.doLogin = guard(async () => {
  const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: $('#aid').value, password: $('#apw').value }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error);
  TOKEN = j.token; localStorage.setItem('atoken', TOKEN); $('#login').style.display = 'none'; go(location.hash.slice(1) || 'dash');
});
window.logout = () => { TOKEN = ''; localStorage.removeItem('atoken'); showLogin(); };

const P = {};
// ---------- 대시보드 ----------
P.dash = async () => {
  const d = await api('/api/admin/dashboard'), max = Math.max(1, ...d.days.map(x => x.sales));
  return `<h2>대시보드</h2><div class="cards"><div class="c"><small>오늘 주문</small><b>${d.todayOrders}건</b></div><div class="c"><small>오늘 매출</small><b>${won(d.todaySales)}</b></div><div class="c"><small>누적 매출</small><b>${won(d.totalSales)}</b></div><div class="c"><small>미답변 문의</small><b style="color:${d.pendingInquiries ? 'var(--red)' : 'inherit'}">${d.pendingInquiries}건</b></div></div>
  <div class="cards"><div class="c"><small>전체 주문</small><b>${d.totalOrders}건</b></div><div class="c"><small>회원수</small><b>${d.users}명</b></div><div class="c"><small>등록 상품</small><b>${d.products}개</b></div><div class="c"><small>입금대기</small><b>${d.byStatus['입금대기']}건</b></div></div>
  <div class="two"><div class="panel"><h3>최근 7일 매출</h3><div class="chart">${d.days.map(x => `<div><i style="height:${Math.round(x.sales / max * 120)}px" title="${won(x.sales)}"></i>${x.date.slice(5)}<br>${x.count}건</div>`).join('')}</div></div>
  <div class="panel"><h3>주문 상태</h3>${STATUS.map(s => `<p style="display:flex;justify-content:space-between;padding:5px 0"><span class="st ${stCls(s)}">${s}</span><b>${d.byStatus[s]}</b></p>`).join('')}</div></div>
  <div class="two"><div class="panel"><h3>최근 주문</h3><table><tr><th>주문번호</th><th>주문자</th><th>금액</th><th>상태</th></tr>${d.recent.map(o => `<tr><td>${o.no}</td><td>${esc(o.orderer)}</td><td>${won(o.total)}</td><td><span class="st ${stCls(o.status)}">${o.status}</span></td></tr>`).join('') || '<tr><td colspan="4">주문 없음</td></tr>'}</table></div>
  <div class="panel"><h3>인기 상품 TOP5 (매출)</h3>${d.top.map((t, i) => `<p style="padding:5px 0">${i + 1}. ${esc(t.name)} <b style="float:right">${won(t.sales)}</b></p>`).join('') || '데이터 없음'}</div></div>`;
};

// ---------- 주문 ----------
let ordersCache = [];
P.orders = async () => {
  const sp = new URLSearchParams(location.hash.split('?')[1] || ''), st = sp.get('status') || '', q = sp.get('q') || '';
  ordersCache = await api('/api/admin/orders?' + new URLSearchParams({ ...(st && { status: st }), ...(q && { q }) }));
  return `<h2>주문관리</h2><div class="bar"><select onchange="location.hash='orders?status='+this.value+'&q='+encodeURIComponent($('#oq').value)"><option value="">전체 상태</option>${STATUS.map(s => `<option ${s === st ? 'selected' : ''}>${s}</option>`).join('')}</select>
  <input id="oq" placeholder="주문번호/이름/연락처" value="${esc(q)}" onkeydown="if(event.key==='Enter')location.hash='orders?status=${st}&q='+encodeURIComponent(this.value)"><span>총 ${ordersCache.length}건</span></div>
  <div class="panel" style="padding:0;overflow:auto"><table><tr><th>주문번호</th><th>일시</th><th>주문자</th><th>상품</th><th>금액</th><th>결제</th><th>상태</th><th></th></tr>
  ${ordersCache.map((o, i) => `<tr><td>${o.no}</td><td>${date(o.createdAt)}</td><td>${esc(o.orderer)}${o.userId ? '' : ' <small>(비회원)</small>'}</td><td>${esc(o.items[0].name)}${o.items.length > 1 ? ` 외 ${o.items.length - 1}` : ''}</td><td>${won(o.total)}</td><td>${o.pay === 'bank' ? '무통장' : '카드'}</td>
  <td><select onchange="setStatus('${o.no}',this.value)">${STATUS.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><button class="btn s g" onclick="orderDetail(${i})">상세</button></td></tr>`).join('') || '<tr><td colspan="8" style="text-align:center;padding:40px">주문이 없습니다.</td></tr>'}</table></div>`;
};
window.setStatus = guard(async (no, s) => { await api('/api/admin/orders/' + no, 'PUT', { status: s }); toast('상태가 변경되었습니다.'); });
window.orderDetail = i => {
  const o = ordersCache[i];
  modal(`<h3>주문 상세 ${o.no} <span class="st ${stCls(o.status)}">${o.status}</span></h3>
  <table>${o.items.map(it => `<tr><td><b>${esc(it.name)}</b><br><small>${it.qty.toLocaleString()}수량×${it.count}건 · ${esc(Object.values(it.opts).join(' / '))}</small>${it.memo ? `<br><small>요청: ${esc(it.memo)}</small>` : ''}</td><td>${it.file ? `<a class="btn s" href="${esc(it.file.url)}?t=${TOKEN}" target="_blank">📎 ${esc(it.file.name)}</a>` : '<small>파일 없음</small>'}</td><td style="text-align:right">${won(it.price)}</td></tr>`).join('')}</table>
  <p style="text-align:right;margin:10px 0">상품 ${won(o.sub)} + 배송 ${won(o.shipFee)} - 포인트 ${won(o.usePoints)} = <b>${won(o.total)}</b></p>
  <div class="g2"><div><b>배송지</b><br>${esc(o.ship.name)} / ${esc(o.ship.phone)}<br>(${esc(o.ship.zip)}) ${esc(o.ship.addr)} ${esc(o.ship.addr2)}<br>요청: ${esc(o.ship.msg)}</div>
  <div><b>결제</b><br>${o.pay === 'bank' ? '무통장 / 입금자 ' + esc(o.depositor) : '카드(데모)'}<br>${o.taxInvoice ? '세금계산서 요청: ' + esc(o.bizNo) : '세금계산서 없음'}</div></div><br>
  <div class="g2"><div class="f"><label>운송장번호</label><input id="trk" value="${esc(o.tracking || '')}"></div><div class="f"><label>관리자 메모</label><input id="omemo" value="${esc(o.memo || '')}"></div></div>
  <div style="display:flex;justify-content:space-between"><button class="btn r" onclick="delOrder('${o.no}')">주문 삭제</button><span><button class="btn" onclick="saveOrder('${o.no}')">저장</button> <button class="btn g" onclick="closeModal()">닫기</button></span></div>`);
};
window.saveOrder = guard(async no => { await api('/api/admin/orders/' + no, 'PUT', { tracking: $('#trk').value, memo: $('#omemo').value }); closeModal(); toast('저장됨'); go('orders'); });
window.delOrder = guard(async no => { if (!confirm('주문을 영구 삭제합니다.')) return; await api('/api/admin/orders/' + no, 'DELETE'); closeModal(); go('orders'); });

// ---------- 공통: 이미지 업로드 / 행 이동 ----------
async function uploadImage(file) {
  if (!file) throw new Error('파일을 선택하세요.');
  if (file.size > 8e6) throw new Error('8MB 이하 이미지만 업로드할 수 있습니다.');
  const r = await fetch('/api/admin/upload-image', { method: 'POST', headers: { 'X-Filename': encodeURIComponent(file.name), 'X-Admin-Token': TOKEN }, body: file });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '업로드 실패');
  return j.url;
}
window.moveRow = (btn, dir) => {
  const row = btn.closest('.mrow'), sib = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
  if (!sib) return;
  dir < 0 ? sib.before(row) : sib.after(row);
};

// ---------- 상품 ----------
let prodCache = [], menuCache = { tops: [], categories: [] }, catCache = [], prodDirty = false;
const prodFilter = () => { const sp = new URLSearchParams(location.hash.split('?')[1] || ''); return { cat: sp.get('cat') || '', q: sp.get('q') || '' }; };
P.products = async () => {
  prodCache = (await api('/api/admin/products')).sort((a, b) => (a.order || 0) - (b.order || 0));
  menuCache = await api('/api/admin/menu'); catCache = menuCache.categories; prodDirty = false;
  return `<h2>상품관리</h2><div class="bar"><button class="btn" onclick="editProduct(-1)">+ 상품 등록</button>
  <select id="pfcat" onchange="location.hash='products?cat='+encodeURIComponent(this.value)+'&q='+encodeURIComponent($('#pfq').value)"><option value="">전체 분류</option>${catCache.map(c => `<option value="${esc(c.id)}" ${prodFilter().cat === c.id ? 'selected' : ''}>${esc(c.top)} › ${esc(c.id)}</option>`).join('')}</select>
  <input id="pfq" placeholder="상품명 검색" value="${esc(prodFilter().q)}" onkeydown="if(event.key==='Enter')location.hash='products?cat='+encodeURIComponent($('#pfcat').value)+'&q='+encodeURIComponent(this.value)">
  <button class="btn" id="saveorder" onclick="saveProdOrder()" style="display:none">↕ 노출순서 저장</button><span id="pcount"></span></div>
  <p class="hint" style="margin-bottom:8px">▲▼로 순서를 바꾼 뒤 <b>노출순서 저장</b>을 누르면 쇼핑몰의 상품 목록 순서에 반영됩니다. (현재 필터에 보이는 상품끼리 위치를 바꿉니다.)</p>
  <div class="panel" style="padding:0;overflow:auto"><table><thead><tr><th>순서</th><th>썸네일</th><th>상품명 / 코드</th><th>분류</th><th>최저가</th><th>할인</th><th>HIT/BEST</th><th>판매</th><th></th></tr></thead><tbody id="ptbody"></tbody></table></div>`;
};
const prodVisible = () => { const f = prodFilter(); return prodCache.filter(p => (!f.cat || p.cat === f.cat || (p.also || []).some(a => a.cat === f.cat)) && (!f.q || (p.name + p.id).includes(f.q))); };
function renderProdRows() {
  const vis = prodVisible();
  $('#pcount').textContent = `총 ${vis.length}개`;
  $('#ptbody').innerHTML = vis.map((p, vi) => `<tr><td style="white-space:nowrap"><button class="btn s g" onclick="moveProd('${p.id}',-1)" ${vi === 0 ? 'disabled' : ''}>▲</button><button class="btn s g" onclick="moveProd('${p.id}',1)" ${vi === vis.length - 1 ? 'disabled' : ''}>▼</button></td>
  <td>${p.img ? `<img src="${esc(p.img)}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;display:block">` : `<span style="font-size:28px">${esc(p.icon)}</span>`}</td>
  <td>${esc(p.name)}${p.soldout ? ' <span class="st c">품절</span>' : ''}<br><small>${esc(p.id)}</small></td><td>${esc(p.cat)}<br><small>${esc(p.sub || '')}</small></td><td>${won(p.tiers[0]?.price)}</td><td>${p.discount}%</td><td>${p.hit ? 'HIT ' : ''}${p.best ? 'BEST' : ''}</td>
  <td><input type="checkbox" style="width:auto" ${p.active ? 'checked' : ''} onchange="toggleProd('${p.id}',this.checked)"></td><td style="white-space:nowrap"><button class="btn s g" onclick="editProduct('${p.id}')">수정</button> <button class="btn s r" onclick="delProd('${p.id}')">삭제</button></td></tr>`).join('') || '<tr><td colspan="9" style="text-align:center;padding:40px">상품이 없습니다.</td></tr>';
}
const origGo = null;
window.moveProd = (id, dir) => {
  const vis = prodVisible(), i = vis.findIndex(p => p.id === id), j = i + dir;
  if (j < 0 || j >= vis.length) return;
  const a = prodCache.indexOf(vis[i]), b = prodCache.indexOf(vis[j]);
  [prodCache[a], prodCache[b]] = [prodCache[b], prodCache[a]];
  prodDirty = true; $('#saveorder').style.display = ''; renderProdRows();
};
window.saveProdOrder = guard(async () => { await api('/api/admin/product-order', 'PUT', { ids: prodCache.map(p => p.id) }); prodDirty = false; $('#saveorder').style.display = 'none'; toast('노출순서가 저장되었습니다.'); });
window.toggleProd = guard(async (id, v) => { const p = prodCache.find(p => p.id === id); await api('/api/admin/products/' + id, 'PUT', { ...p, active: v }); p.active = v; toast(v ? '판매 중' : '판매 중지'); });
window.delProd = guard(async id => { if (!confirm('상품을 삭제합니다.')) return; await api('/api/admin/products/' + id, 'DELETE'); go('products'); });

let detailBlocks = [];
window.editProduct = id => {
  const isNew = id === -1;
  const p = isNew ? { id: '', name: '', cat: catCache[0].id, sub: '', unit: '개', soldout: false, spec: '', desc: '', icon: '📦', img: '', badge: '', discount: 0, hit: false, best: false, active: true, tiers: [{ qty: 100, price: 10000 }], options: [], detail: [], also: [] } : prodCache.find(x => x.id === id);
  window._editId = isNew ? -1 : id; detailBlocks = JSON.parse(JSON.stringify(p.detail || []));
  modal(`<h3>${isNew ? '상품 등록' : '상품 수정'}</h3>
  <div class="g2"><div class="f"><label>상품코드(영문/숫자)</label><input id="pid" value="${esc(p.id)}" ${isNew ? '' : 'disabled'} placeholder="비우면 자동"></div><div class="f"><label>분류 (그룹 / 세부항목)</label><div style="display:flex;gap:6px"><select id="pcat" onchange="subOpts()">${catCache.map(c => `<option value="${esc(c.id)}" ${c.id === p.cat ? 'selected' : ''}>${esc(c.top)} › ${esc(c.id)}</option>`).join('')}</select><select id="psub"></select></div></div></div>
  <div class="f"><label>추가 분류 (선택 · 한 상품을 다른 메뉴에도 노출)</label><div style="display:flex;gap:6px"><select id="pcat2" onchange="subOpts('', 'pcat2', 'psub2')"><option value="">(없음)</option>${catCache.map(c => `<option value="${esc(c.id)}" ${(p.also || [])[0] && p.also[0].cat === c.id ? 'selected' : ''}>${esc(c.top)} › ${esc(c.id)}</option>`).join('')}</select><select id="psub2"></select></div></div>
  <div class="f"><label>상품명</label><input id="pname" value="${esc(p.name)}"></div><div class="f"><label>규격/한줄설명</label><input id="pspec" value="${esc(p.spec)}"></div>
  <div class="panel" style="background:#f8fafc"><h3 style="font-size:14px">🖼️ 썸네일 이미지</h3><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
    <div id="thumbprev" style="width:120px;height:120px;border-radius:8px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:42px"></div>
    <div style="flex:1;min-width:220px"><input type="file" id="thumbfile" accept="image/png,image/jpeg,image/webp,image/gif" onchange="thumbUpload(this)"><div class="hint">jpg·png·webp·gif / 8MB 이하 / 정사각형(600×600) 권장</div>
    <div class="f" style="margin-top:8px"><label>이미지 경로</label><input id="pimg" value="${esc(p.img || '')}" oninput="thumbPrev()"></div><button class="btn s g" onclick="$('#pimg').value='';thumbPrev()">이미지 제거(아이콘 사용)</button></div></div></div>
  <div class="f"><label>짧은 소개 문구</label><textarea id="pdesc" rows="2">${esc(p.desc)}</textarea></div>
  <div class="panel" style="background:#f8fafc"><h3 style="font-size:14px">📄 상세페이지 내용 (텍스트·이미지 블록, 위에서 아래 순서로 표시)</h3><div id="dblocks"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn s g" onclick="addTextBlock()">+ 텍스트 추가</button><label class="btn s g" style="cursor:pointer">+ 이미지 추가<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onchange="addImageBlock(this)"></label></div></div>
  <div class="g2"><div class="f"><label>수량 단위 (장/매/개/세트 등)</label><input id="punit" value="${esc(p.unit || '개')}"></div><div class="f"><label>아이콘(이모지, 이미지 없을 때)</label><input id="picon" value="${esc(p.icon)}"></div></div>
  <div class="g2"><div class="f"><label>뱃지 (예: BEST, NEW, HOT)</label><input id="pbadge" value="${esc(p.badge)}"></div><div class="f"><label>할인율(%)</label><input id="pdc" type="number" value="${p.discount}"></div></div>
  <div class="f"><label>노출/상태</label><label><input type="checkbox" id="phit" style="width:auto" ${p.hit ? 'checked' : ''}> 히트상품</label> <label><input type="checkbox" id="pbest" style="width:auto" ${p.best ? 'checked' : ''}> 베스트</label> <label><input type="checkbox" id="pact" style="width:auto" ${p.active ? 'checked' : ''}> 판매중</label> <label><input type="checkbox" id="psold" style="width:auto" ${p.soldout ? 'checked' : ''}> 품절</label></div>
  <div class="g2"><div class="f"><label>수량별 판매가 (한 줄에 "수량,가격")</label><textarea id="ptiers" rows="5">${p.tiers.map(t => t.qty + ',' + t.price).join('\n')}</textarea></div>
  <div class="f"><label>옵션 (한 줄에 "옵션명: 선택1=추가금, 선택2=추가금")</label><textarea id="popts" rows="5">${p.options.map(g => g.name + ': ' + g.choices.map(c => c.label + '=' + c.add).join(', ')).join('\n')}</textarea></div></div>
  <div style="text-align:right"><button class="btn" onclick="saveProduct()">저장</button> <button class="btn g" onclick="closeModal()">취소</button></div>`);
  subOpts(p.sub); subOpts((p.also || [])[0] ? p.also[0].sub : '', 'pcat2', 'psub2'); thumbPrev(); renderBlocks();
};
window.subOpts = (sel, cid = 'pcat', sid = 'psub') => { const c = catCache.find(c => c.id === $('#' + cid).value); $('#' + sid).innerHTML = (c ? c.subs : []).map(s => `<option ${s === sel ? 'selected' : ''}>${esc(s)}</option>`).join(''); };
window.thumbPrev = () => { const v = $('#pimg').value.trim(); $('#thumbprev').innerHTML = v ? `<img src="${esc(v)}" style="width:100%;height:100%;object-fit:cover">` : '<span style="font-size:14px;color:#6b7280">이미지 없음</span>'; };
window.thumbUpload = guard(async inp => { const url = await uploadImage(inp.files[0]); $('#pimg').value = url; thumbPrev(); toast('썸네일이 업로드되었습니다. 저장을 눌러 반영하세요.'); });
function renderBlocks() {
  $('#dblocks').innerHTML = detailBlocks.map((b, i) => `<div class="blk"><div class="blkh"><b>${b.type === 'image' ? '🖼️ 이미지' : '📝 텍스트'}</b><span><button class="btn s g" onclick="moveBlock(${i},-1)">▲</button> <button class="btn s g" onclick="moveBlock(${i},1)">▼</button> <button class="btn s r" onclick="delBlock(${i})">삭제</button></span></div>
  ${b.type === 'image' ? `<img src="${esc(b.url)}" style="max-width:100%;max-height:160px;border-radius:6px;display:block;margin:6px 0"><input placeholder="이미지 설명(선택)" value="${esc(b.caption || '')}" oninput="detailBlocks[${i}].caption=this.value">` : `<textarea rows="4" oninput="detailBlocks[${i}].text=this.value" placeholder="상세 내용을 입력하세요 (줄바꿈 가능)">${esc(b.text || '')}</textarea>`}</div>`).join('') || '<p class="hint">등록된 상세 내용이 없습니다. 아래 버튼으로 추가하세요.</p>';
}
window.addTextBlock = () => { detailBlocks.push({ type: 'text', text: '' }); renderBlocks(); };
window.addImageBlock = guard(async inp => { const url = await uploadImage(inp.files[0]); detailBlocks.push({ type: 'image', url, caption: '' }); renderBlocks(); });
window.moveBlock = (i, d) => { const j = i + d; if (j < 0 || j >= detailBlocks.length) return; [detailBlocks[i], detailBlocks[j]] = [detailBlocks[j], detailBlocks[i]]; renderBlocks(); };
window.delBlock = i => { detailBlocks.splice(i, 1); renderBlocks(); };
window.saveProduct = guard(async () => {
  const id = window._editId, isNew = id === -1, old = isNew ? null : prodCache.find(x => x.id === id);
  const tiers = $('#ptiers').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [q, p] = l.split(','); return { qty: +q, price: +p }; });
  const options = $('#popts').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [name, rest = ''] = l.split(/:(.*)/s); return { name: name.trim(), choices: rest.split(',').map(c => { const [label, add] = c.split('='); return { label: (label || '').trim(), add: +add || 0 }; }).filter(c => c.label) };
  });
  const body = { id: $('#pid').value, cat: $('#pcat').value, name: $('#pname').value, spec: $('#pspec').value, desc: $('#pdesc').value, icon: $('#picon').value, img: $('#pimg').value.trim(), sub: $('#psub').value, unit: $('#punit').value, soldout: $('#psold').checked, badge: $('#pbadge').value, discount: +$('#pdc').value, hit: $('#phit').checked, best: $('#pbest').checked, active: $('#pact').checked, tiers, options, detail: detailBlocks, also: $('#pcat2').value ? [{ cat: $('#pcat2').value, sub: $('#psub2').value }] : [], order: isNew ? 99999 : old.order };
  await api(isNew ? '/api/admin/products' : '/api/admin/products/' + id, isNew ? 'POST' : 'PUT', body);
  closeModal(); toast('저장되었습니다.'); go('products');
});

// ---------- 메뉴(상단메뉴/그룹) 관리 ----------
P.categories = async () => {
  menuCache = await api('/api/admin/menu');
  const prods = await api('/api/admin/products');
  const cnt = {}; prods.forEach(p => { cnt[p.cat] = (cnt[p.cat] || 0) + 1; });
  window._cnt = cnt;
  return `<h2>메뉴(분류)관리</h2>
  <div class="panel"><h3>① 상단메뉴 (쇼핑몰 맨 위 메뉴 · 순서/노출/이름)</h3><div id="topl">${menuCache.tops.map(topRow).join('')}</div><button class="btn g" onclick="addTop()">+ 상단메뉴 추가</button>
  <p class="hint" style="margin-top:6px">상단메뉴 이름을 바꾸면 그 아래 그룹이 자동으로 따라갑니다. 새 상단메뉴는 저장 후 그룹에 지정할 수 있습니다.</p></div>
  <div class="panel"><h3>② 그룹 / 세부항목 (메가메뉴의 열과 항목 · 순서/노출/이름)</h3><p class="hint" style="margin-bottom:10px">그룹 순서가 메뉴 표시 순서입니다. 세부항목은 한 줄에 하나씩, 위에서 아래 순서로 표시됩니다. 상품이 없는 그룹/세부항목은 쇼핑몰에서 자동으로 숨겨집니다(치과인쇄 제외).</p>
  <div id="catl">${menuCache.categories.map(c => catRow(c)).join('')}</div>
  <button class="btn g" onclick="addCat()">+ 그룹 추가</button></div>
  <button class="btn" onclick="saveMenu()" style="padding:10px 26px">메뉴 전체 저장</button>`;
};
const topRow = t => `<div class="mrow trow" data-old="${esc(t.name)}"><button class="btn s g" onclick="moveRow(this,-1)">▲</button><button class="btn s g" onclick="moveRow(this,1)">▼</button>
  <input class="tname" value="${esc(t.name)}" style="flex:1"><label style="white-space:nowrap"><input type="checkbox" class="tact" style="width:auto" ${t.active !== false ? 'checked' : ''}> 노출</label><button class="btn s r" onclick="this.closest('.mrow').remove()">삭제</button></div>`;
const catRow = c => `<div class="mrow crow panel" style="background:#f8fafc;margin-bottom:10px" data-old="${esc(c.name)}"><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap"><button class="btn s g" onclick="moveRow(this,-1)">▲</button><button class="btn s g" onclick="moveRow(this,1)">▼</button>
  <select class="ctop" style="width:auto">${menuCache.tops.map(t => `<option value="${esc(t.name)}" ${t.name === c.top ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
  <input class="cname" value="${esc(c.name)}" placeholder="그룹명" style="flex:1;min-width:140px"><span class="hint">${(window._cnt || {})[c.name] ? `상품 ${window._cnt[c.name]}개` : ''}</span>
  <label style="white-space:nowrap"><input type="checkbox" class="cact" style="width:auto" ${c.active !== false ? 'checked' : ''}> 노출</label><button class="btn s r" onclick="this.closest('.mrow').remove()">삭제</button></div>
  <div class="g2"><div class="f"><label>세부항목 (한 줄에 하나)</label><textarea class="csubs" rows="4">${esc((c.subs || []).join('\n'))}</textarea></div>
  <div class="f"><label>아이콘 / 배경색</label><div style="display:flex;gap:6px"><input class="cicon" value="${esc(c.icon || '')}" style="width:70px"><input class="cbg" type="color" value="${esc(c.bg || '#e5e7eb')}" style="width:60px;padding:2px"></div></div></div></div>`;
window.addTop = () => $('#topl').insertAdjacentHTML('beforeend', topRow({ name: '', active: true }));
window.addCat = () => $('#catl').insertAdjacentHTML('beforeend', catRow({ top: menuCache.tops[0].name, name: '', subs: [], icon: '📦', bg: '#e5e7eb', active: true }));
window.saveMenu = guard(async () => {
  const tops = [...document.querySelectorAll('.trow')].map(r => ({ name: r.querySelector('.tname').value, old: r.dataset.old || r.querySelector('.tname').value, active: r.querySelector('.tact').checked }));
  const categories = [...document.querySelectorAll('.crow')].map(r => ({ old: r.dataset.old || r.querySelector('.cname').value, top: r.querySelector('.ctop').value, name: r.querySelector('.cname').value, subs: r.querySelector('.csubs').value.split('\n'), icon: r.querySelector('.cicon').value, bg: r.querySelector('.cbg').value, active: r.querySelector('.cact').checked }));
  await api('/api/admin/menu', 'PUT', { tops, categories }); toast('메뉴가 저장되었습니다.'); go('categories');
});

// ---------- 주요서비스 (홈 화면 아이콘 메뉴) ----------
let quickCache = [];
P.quick = async () => {
  quickCache = await api('/api/admin/quick'); menuCache = await api('/api/admin/menu');
  return `<h2>주요서비스 관리</h2><div class="panel"><p class="hint" style="margin-bottom:12px">쇼핑몰 홈의 배너 아래 아이콘 메뉴입니다. ▲▼로 순서를 바꾸고, 노출을 끄거나 삭제/추가할 수 있습니다. 링크는 목록에서 고르거나 직접 입력하세요.</p>
  <div id="ql">${quickCache.map(quickRow).join('')}</div><button class="btn g" onclick="addQuick()">+ 서비스 추가</button> <button class="btn" onclick="saveQuick()">전체 저장</button></div>`;
};
const linkChoices = () => [['#/list', '전체상품'], ...menuCache.tops.flatMap(t => [[`#/list?top=${encodeURIComponent(t.name)}`, `[상단] ${t.name}`], ...menuCache.categories.filter(c => c.top === t.name).map(c => [`#/list?cat=${encodeURIComponent(c.id)}`, `    ${t.name} › ${c.name}`])]), ['#/board/notice', '공지사항'], ['#/board/inquiry', '1:1 문의'], ['#/board/proof', '시안교정']];
const quickRow = q => `<div class="mrow qrow" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px;border:1px solid var(--line);border-radius:8px;margin-bottom:8px;background:#f8fafc">
  <button class="btn s g" onclick="moveRow(this,-1)">▲</button><button class="btn s g" onclick="moveRow(this,1)">▼</button>
  <input class="qicon" value="${esc(q.icon)}" style="width:56px;text-align:center;font-size:20px"><input class="qname" value="${esc(q.name)}" placeholder="서비스명" style="width:150px"><input class="qbg" type="color" value="${esc(q.bg || '#e5e7eb')}" style="width:50px;padding:2px">
  <select style="width:170px" onchange="if(this.value)this.closest('.qrow').querySelector('.qlink').value=this.value;this.value=''"><option value="">링크 선택…</option>${linkChoices().map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
  <input class="qlink" value="${esc(q.link)}" style="flex:1;min-width:180px"><label style="white-space:nowrap"><input type="checkbox" class="qact" style="width:auto" ${q.active !== false ? 'checked' : ''}> 노출</label><button class="btn s r" onclick="this.closest('.mrow').remove()">삭제</button></div>`;
window.addQuick = () => $('#ql').insertAdjacentHTML('beforeend', quickRow({ name: '', icon: '📦', bg: '#e5e7eb', link: '#/list', active: true }));
window.saveQuick = guard(async () => {
  const list = [...document.querySelectorAll('.qrow')].map(r => ({ icon: r.querySelector('.qicon').value, name: r.querySelector('.qname').value, bg: r.querySelector('.qbg').value, link: r.querySelector('.qlink').value, active: r.querySelector('.qact').checked }));
  await api('/api/admin/quick', 'PUT', list); toast('주요서비스가 저장되었습니다.'); go('quick');
});

// ---------- 디자인템플릿 관리 ----------
let tplCache = [], tplDirty = false;
const TPL_CATS = ['명함', '전단/포스터', '진료차트/서식', '봉투', '스티커', '배너/현수막'];
P.templates = async () => {
  tplCache = (await api('/api/admin/templates')).sort((a, b) => a.order - b.order);
  prodCache = await api('/api/admin/products'); tplDirty = false;
  const sp = new URLSearchParams(location.hash.split('?')[1] || ''), cat = sp.get('cat') || '';
  window._tplCat = cat;
  return `<h2>디자인템플릿 관리</h2><div class="bar"><select onchange="location.hash='templates?cat='+encodeURIComponent(this.value)"><option value="">전체 카테고리</option>${[...new Set([...TPL_CATS, ...tplCache.map(t => t.category)])].map(c => `<option ${c === cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  <button class="btn" id="tplsave" style="display:none" onclick="saveTplOrder()">↕ 노출순서 저장</button><a class="btn g" href="/#/templates" target="_blank">갤러리 보기</a><span id="tplcount"></span></div>
  <p class="hint" style="margin-bottom:8px">템플릿은 쇼핑몰 <b>디자인템플릿</b> 메뉴의 갤러리에 표시됩니다. 새 템플릿은 쇼핑몰 편집기에서 디자인한 뒤 <b>⭐ 템플릿 등록(관리자)</b> 버튼(관리자 로그인 상태에서만 표시)으로 등록하거나, 기존 템플릿을 편집기에서 열어 <b>덮어쓰기</b> 하세요.</p>
  <div class="panel" style="padding:0;overflow:auto"><table><thead><tr><th>순서</th><th>미리보기</th><th>이름</th><th>카테고리/규격</th><th>주문 가능 상품</th><th>노출</th><th></th></tr></thead><tbody id="tplbody"></tbody></table></div>`;
};
const tplVisible = () => tplCache.filter(t => !window._tplCat || t.category === window._tplCat);
function renderTplRows() {
  const vis = tplVisible();
  $('#tplcount').textContent = `총 ${vis.length}개`;
  $('#tplbody').innerHTML = vis.map((t, i) => `<tr><td style="white-space:nowrap"><button class="btn s g" onclick="moveTpl('${t.id}',-1)" ${i === 0 ? 'disabled' : ''}>▲</button><button class="btn s g" onclick="moveTpl('${t.id}',1)" ${i === vis.length - 1 ? 'disabled' : ''}>▼</button></td>
  <td><div style="width:90px;height:90px;background:#eef2f7;border-radius:6px;padding:6px;display:flex;align-items:center;justify-content:center">${TplRender.svg(t).replace('<svg ', '<svg style="max-width:100%;max-height:100%;box-shadow:0 2px 6px rgba(0,0,0,.25)" ')}</div></td>
  <td><b>${esc(t.name)}</b>${t.custom ? ' <span class="st">직접 등록</span>' : ''}<br><small>${esc(t.id)}</small></td><td>${esc(t.category)}<br><small>${esc(t.mm)}</small></td>
  <td style="max-width:240px"><small>${(t.products || []).map(id => { const p = prodCache.find(p => p.id === id); return esc(p ? p.name : id); }).join(', ') || '(없음)'}</small></td>
  <td><input type="checkbox" style="width:auto" ${t.active ? 'checked' : ''} onchange="toggleTpl('${t.id}',this.checked)"></td>
  <td style="white-space:nowrap"><button class="btn s g" onclick="editTpl('${t.id}')">수정</button> <a class="btn s g" href="/#/editor/${esc(t.id)}" target="_blank">편집기</a> <button class="btn s r" onclick="delTpl('${t.id}')">삭제</button></td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:40px">템플릿이 없습니다.</td></tr>';
}
window.moveTpl = (id, dir) => {
  const vis = tplVisible(), i = vis.findIndex(t => t.id === id), j = i + dir; if (j < 0 || j >= vis.length) return;
  const a = tplCache.indexOf(vis[i]), b = tplCache.indexOf(vis[j]); [tplCache[a], tplCache[b]] = [tplCache[b], tplCache[a]];
  tplDirty = true; $('#tplsave').style.display = ''; renderTplRows();
};
window.saveTplOrder = guard(async () => { await api('/api/admin/template-order', 'PUT', { ids: tplCache.map(t => t.id) }); $('#tplsave').style.display = 'none'; toast('노출순서가 저장되었습니다.'); });
window.toggleTpl = guard(async (id, v) => { const t = tplCache.find(t => t.id === id); await api('/api/admin/templates/' + id, 'PUT', { ...t, active: v }); t.active = v; toast(v ? '노출' : '숨김'); });
window.delTpl = guard(async id => { if (!confirm('템플릿을 삭제합니다. (이미 사용자가 저장한 디자인은 유지됩니다)')) return; await api('/api/admin/templates/' + id, 'DELETE'); go('templates'); });
window.editTpl = id => {
  const t = tplCache.find(t => t.id === id);
  modal(`<h3>템플릿 수정</h3><div class="f"><label>템플릿 이름</label><input id="tn" value="${esc(t.name)}"></div>
  <div class="g2"><div class="f"><label>카테고리</label><input id="tc" list="tcl" value="${esc(t.category)}"><datalist id="tcl">${TPL_CATS.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div><div class="f"><label>인쇄 규격(표시용)</label><input id="tm" value="${esc(t.mm)}"></div></div>
  <div class="f"><label>검색 태그 (쉼표로 구분)</label><input id="tt" value="${esc((t.tags || []).join(', '))}"></div>
  <div class="f"><label>주문 가능 상품 (Ctrl/Shift로 여러 개 선택)</label><select id="tp" multiple size="10">${prodCache.map(p => `<option value="${esc(p.id)}" ${(t.products || []).includes(p.id) ? 'selected' : ''}>${esc(p.cat)} › ${esc(p.name)}</option>`).join('')}</select></div>
  <div style="text-align:right"><button class="btn" onclick="saveTpl('${t.id}')">저장</button> <button class="btn g" onclick="closeModal()">취소</button></div>`);
};
window.saveTpl = guard(async id => {
  const t = tplCache.find(t => t.id === id);
  await api('/api/admin/templates/' + id, 'PUT', { ...t, name: $('#tn').value, category: $('#tc').value, mm: $('#tm').value, tags: $('#tt').value.split(',').map(s => s.trim()).filter(Boolean), products: [...$('#tp').selectedOptions].map(o => o.value) });
  closeModal(); toast('저장되었습니다.'); go('templates');
});

// ---------- 회원 ----------
let userCache = [];
P.users = async () => {
  userCache = await api('/api/admin/users');
  return `<h2>회원관리</h2><div class="panel" style="padding:0;overflow:auto"><table><tr><th>아이디</th><th>이름/병원</th><th>연락처</th><th>가입일</th><th>주문</th><th>구매액</th><th>포인트</th><th>상태</th><th></th></tr>
  ${userCache.map((u, i) => `<tr><td>${esc(u.username)}</td><td>${esc(u.name)}<br><small>${esc(u.clinic)}</small></td><td>${esc(u.phone)}<br><small>${esc(u.email)}</small></td><td>${date(u.createdAt).slice(0, 10)}</td><td>${u.orders}</td><td>${won(u.spent)}</td><td>${u.points.toLocaleString()}P</td><td>${u.blocked ? '<span class="st c">차단</span>' : '정상'}</td>
  <td><button class="btn s g" onclick="userEdit(${i})">관리</button></td></tr>`).join('') || '<tr><td colspan="9" style="text-align:center;padding:40px">회원이 없습니다.</td></tr>'}</table></div>`;
};
window.userEdit = i => {
  const u = userCache[i];
  modal(`<h3>${esc(u.name)} (${esc(u.username)})</h3><div class="g2"><div class="f"><label>포인트</label><input id="upt" type="number" value="${u.points}"></div><div class="f"><label>비밀번호 초기화 (입력 시 변경)</label><input id="upw" placeholder="새 비밀번호"></div></div>
  <label><input type="checkbox" id="ublk" style="width:auto" ${u.blocked ? 'checked' : ''}> 이용 차단</label><br><br>
  <div style="display:flex;justify-content:space-between"><button class="btn r" onclick="userDel(${u.id})">회원 삭제</button><span><button class="btn" onclick="userSave(${u.id})">저장</button> <button class="btn g" onclick="closeModal()">닫기</button></span></div>`);
};
window.userSave = guard(async id => { const b = { points: $('#upt').value, blocked: $('#ublk').checked }; if ($('#upw').value) { if ($('#upw').value.length < 6) throw new Error('비밀번호는 6자 이상'); b.resetPw = $('#upw').value; } await api('/api/admin/users/' + id, 'PUT', b); closeModal(); go('users'); });
window.userDel = guard(async id => { if (!confirm('회원을 삭제합니다.')) return; await api('/api/admin/users/' + id, 'DELETE'); closeModal(); go('users'); });

// ---------- 게시판 (문의/시안교정은 답변, 공지/FAQ는 작성) ----------
let postCache = [];
const BN = { inquiry: '1:1 문의', proof: '시안교정', notice: '공지사항', faq: 'FAQ' };
const boardPage = board => async () => {
  postCache = await api('/api/admin/posts?board=' + board);
  const writable = ['notice', 'faq'].includes(board);
  return `<h2>${BN[board]}</h2>${writable ? `<div class="bar"><button class="btn" onclick="postEdit('${board}',-1)">+ 글 작성</button></div>` : ''}
  <div class="panel" style="padding:0"><table><tr><th>번호</th><th>제목</th><th>작성자</th><th>일시</th>${writable ? '' : '<th>답변</th>'}<th></th></tr>
  ${postCache.map((p, i) => `<tr><td>${p.id}</td><td>${p.secret ? '🔒 ' : ''}${esc(p.title)}${p.hidden ? ' <small>(숨김)</small>' : ''}</td><td>${esc(p.author)}</td><td>${date(p.createdAt)}</td>${writable ? '' : `<td>${p.reply ? '<span class="st d">완료</span>' : '<span class="st w">대기</span>'}</td>`}
  <td><button class="btn s g" onclick="postEdit('${board}',${i})">${writable ? '수정' : '답변/보기'}</button> <button class="btn s r" onclick="postDel(${p.id},'${board}')">삭제</button></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px">글이 없습니다.</td></tr>'}</table></div>`;
};
['inquiry', 'proof', 'notice', 'faq'].forEach(b => P[b] = boardPage(b));
window.postEdit = (board, i) => {
  const p = i < 0 ? { title: '', content: '' } : postCache[i], writable = ['notice', 'faq'].includes(board);
  modal(`<h3>${BN[board]} ${i < 0 ? '작성' : '#' + p.id}</h3><div class="f"><label>제목</label><input id="ptitle" value="${esc(p.title)}" ${writable ? '' : 'disabled'}></div>
  <div class="f"><label>내용</label><textarea id="pcontent" rows="6" ${writable ? '' : 'disabled'}>${esc(p.content)}</textarea></div>
  ${writable ? '' : `<div class="f"><label>관리자 답변</label><textarea id="preply" rows="5">${esc(p.reply || '')}</textarea></div>`}
  <div style="text-align:right"><button class="btn" onclick="postSave('${board}',${i})">저장</button> <button class="btn g" onclick="closeModal()">닫기</button></div>`);
};
window.postSave = guard(async (board, i) => {
  if (['notice', 'faq'].includes(board)) {
    const b = { title: $('#ptitle').value, content: $('#pcontent').value };
    await api(i < 0 ? '/api/admin/posts' : '/api/admin/posts/' + postCache[i].id, i < 0 ? 'POST' : 'PUT', i < 0 ? { ...b, board } : b);
  } else await api('/api/admin/posts/' + postCache[i].id, 'PUT', { reply: $('#preply').value });
  closeModal(); toast('저장됨'); go(board);
});
window.postDel = guard(async (id, board) => { if (!confirm('삭제합니다.')) return; await api('/api/admin/posts/' + id, 'DELETE'); go(board); });

// ---------- 배너 (메인 롤링배너) ----------
P.banners = async () => {
  const list = await api('/api/admin/banners');
  return `<h2>메인 롤링배너 관리</h2><div class="panel"><p class="hint" style="margin-bottom:12px">홈 화면 맨 위에서 자동으로 넘어가는 배너입니다. ▲▼로 순서를 바꾸고, 노출을 끄거나 삭제/추가할 수 있습니다. 배너 이미지를 올리면 이미지가 배너 전체로 표시되고(권장 1200×300, 가운데 정렬), 이미지가 없으면 색상 + 제목/부제 배너로 표시됩니다.</p>
  <div id="bl">${list.map(bannerRow).join('')}</div><button class="btn g" onclick="addBanner()">+ 배너 추가</button> <button class="btn" onclick="saveBanners()">전체 저장</button></div>`;
};
const bannerRow = b => `<div class="mrow brow panel" style="background:#f8fafc;margin-bottom:10px"><div style="display:flex;gap:10px;flex-wrap:wrap">
  <div style="display:flex;flex-direction:column;gap:4px"><button class="btn s g" onclick="moveRow(this,-1)">▲</button><button class="btn s g" onclick="moveRow(this,1)">▼</button></div>
  <div class="bprev" style="width:300px;height:75px;border-radius:6px;background:linear-gradient(120deg,${esc(b.color)},${esc(b.color2)});overflow:hidden;flex-shrink:0"><div class="bprevimg" style="width:100%;height:100%;background:${b.img ? `url('${esc(b.img)}') center/contain no-repeat` : 'none'}"></div></div>
  <div style="flex:1;min-width:260px"><div class="g2"><div class="f"><label>제목</label><input class="bt" value="${esc(b.title)}"></div><div class="f"><label>부제 (이미지 없을 때 표시)</label><input class="bs" value="${esc(b.sub)}"></div></div>
  <div class="g2"><div class="f"><label>링크 (예: #/list?top=상업인쇄)</label><input class="bl" value="${esc(b.link)}"></div><div class="f"><label>배경색 1 / 2</label><div style="display:flex;gap:6px"><input class="bc1" type="color" value="${esc(b.color)}" oninput="bannerPrev(this)"><input class="bc2" type="color" value="${esc(b.color2)}" oninput="bannerPrev(this)"></div></div></div>
  <div class="f"><label>배너 이미지</label><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><input class="bimg" value="${esc(b.img || '')}" placeholder="/img/banners/..." oninput="bannerPrev(this)" style="flex:1;min-width:200px"><label class="btn s g" style="cursor:pointer">업로드<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onchange="bannerUpload(this)"></label><button class="btn s g" onclick="const r=this.closest('.brow');r.querySelector('.bimg').value='';bannerPrev(r.querySelector('.bimg'))">이미지 제거</button></div></div>
  <label><input type="checkbox" class="ba" style="width:auto" ${b.active ? 'checked' : ''}> 노출</label> <button class="btn s r" onclick="this.closest('.brow').remove()">삭제</button></div></div></div>`;
window.bannerPrev = el => { const r = el.closest('.brow'); r.querySelector('.bprev').style.background = `linear-gradient(120deg,${r.querySelector('.bc1').value},${r.querySelector('.bc2').value})`; const v = r.querySelector('.bimg').value.trim(); r.querySelector('.bprevimg').style.background = v ? `url('${v.replace(/'/g, '')}') center/contain no-repeat` : 'none'; };
window.bannerUpload = guard(async inp => { const r = inp.closest('.brow'); r.querySelector('.bimg').value = await uploadImage(inp.files[0]); bannerPrev(r.querySelector('.bimg')); toast('이미지가 업로드되었습니다. 전체 저장을 눌러 반영하세요.'); });
window.addBanner = () => $('#bl').insertAdjacentHTML('beforeend', bannerRow({ title: '', sub: '', link: '#/list', img: '', color: '#1d4ed8', color2: '#06b6d4', active: true }));
window.saveBanners = guard(async () => {
  const list = [...document.querySelectorAll('.brow')].map(r => ({ title: r.querySelector('.bt').value, sub: r.querySelector('.bs').value, link: r.querySelector('.bl').value, color: r.querySelector('.bc1').value, color2: r.querySelector('.bc2').value, img: r.querySelector('.bimg').value.trim(), active: r.querySelector('.ba').checked }));
  await api('/api/admin/banners', 'PUT', list); toast('배너가 저장되었습니다.'); go('banners');
});

// ---------- 기본설정 ----------
const SL = { shopName: '쇼핑몰 이름', notice: '상단 안내문구', company: '상호', ceo: '대표자', bizNo: '사업자등록번호', address: '주소', phone: '대표전화', fax: '팩스', email: '이메일', hours: '운영시간', bank: '입금계좌', shipFee: '배송비(원)', freeShipOver: '무료배송 기준금액(원)', pointRate: '적립률(%)', signupPoints: '가입 포인트' };
P.settings = async () => {
  const s = await api('/api/admin/settings');
  return `<h2>기본설정</h2><div class="panel"><div class="g2">${Object.keys(SL).map(k => `<div class="f"><label>${SL[k]}</label><input data-k="${k}" value="${esc(s[k])}"></div>`).join('')}</div><button class="btn" onclick="saveSettings()">저장</button></div>`;
};
window.saveSettings = guard(async () => { const b = {}; document.querySelectorAll('[data-k]').forEach(e => b[e.dataset.k] = e.value); await api('/api/admin/settings', 'PUT', b); toast('저장되었습니다.'); });

// ---------- 라우터 ----------
async function go(page) {
  const name = page.split('?')[0];
  if (!P[name]) return;
  document.querySelectorAll('#side a[data-p]').forEach(a => a.classList.toggle('on', a.dataset.p === name));
  try { $('#main').innerHTML = await P[name](); if (name === 'products') renderProdRows(); if (name === 'templates') renderTplRows(); } catch (e) { if (TOKEN) $('#main').innerHTML = `<p>${esc(e.message)}</p>`; }
}
document.querySelectorAll('#side a[data-p]').forEach(a => a.onclick = () => { location.hash = a.dataset.p; });
window.addEventListener('hashchange', () => TOKEN && go(location.hash.slice(1) || 'dash'));
if (TOKEN) { $('#login').style.display = 'none'; go(location.hash.slice(1) || 'dash'); }
