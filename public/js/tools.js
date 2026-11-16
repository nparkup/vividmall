// 무료 파일 변환 도구 (smallpdf 스타일): 모든 변환은 서버로 업로드하지 않고 사용자의 브라우저 안에서 처리됩니다.
// PDF 처리: pdf-lib(편집/병합/분할) · pdf.js(렌더링/텍스트 추출) 를 필요할 때만 CDN에서 불러옵니다.
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_TOTAL = 100 * 1024 * 1024;
  const CDN = { pdflib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' };
  const loaded = {};
  const loadScript = url => loaded[url] || (loaded[url] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = () => { delete loaded[url]; rej(new Error('변환 엔진을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.')); }; document.head.appendChild(s); }));
  async function needLib(...names) {
    for (const n of names) {
      if (n === 'pdflib' && !window.PDFLib) await loadScript(CDN.pdflib);
      if (n === 'pdfjs') { if (!window.pdfjsLib) await loadScript(CDN.pdfjs); window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.worker; }
    }
  }

  // ---------- 유틸 ----------
  const fmtSize = n => (n < 1024 ? n + 'B' : n < 1048576 ? (n / 1024).toFixed(1) + 'KB' : (n / 1048576).toFixed(2) + 'MB');
  const baseName = n => String(n).replace(/\.[^.]+$/, '');
  const readBuf = f => f.arrayBuffer();
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const toBlob = (c, type, q) => new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('이미지 변환에 실패했습니다. (이 브라우저가 해당 형식을 지원하지 않을 수 있습니다)'))), type, q));
  async function loadBitmap(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch { const url = URL.createObjectURL(file); try { const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('이미지를 읽을 수 없습니다: ' + file.name)); i.src = url; }); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); } }
  }
  const dims = b => ({ w: b.width || b.naturalWidth, h: b.height || b.naturalHeight });
  function parseRanges(str, total) {   // "1-3, 5, 8-" → [[1,3],[5,5],[8,total]]
    const out = [];
    for (const part of String(str || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const m = part.match(/^(\d*)\s*-\s*(\d*)$/) || part.match(/^(\d+)$/);
      if (!m) throw new Error(`페이지 범위가 올바르지 않습니다: "${part}" (예: 1-3, 5, 8-)`);
      let a, b; if (m.length === 2) a = b = +m[1]; else { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : total; }
      if (a < 1 || b < 1 || a > total || b > total || a > b) throw new Error(`페이지 범위가 문서 범위(1–${total})를 벗어났습니다: "${part}"`);
      out.push([a, b]);
    }
    return out;
  }
  const rangeIdx = ranges => ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
  const pdfOut = (bytes, name) => ({ name, blob: new Blob([bytes], { type: 'application/pdf' }) });
  async function loadPdf(file, opts = {}) {
    await needLib('pdflib');
    try { return await PDFLib.PDFDocument.load(await readBuf(file), { ignoreEncryption: false, ...opts }); }
    catch (e) { if (/encrypt/i.test(String(e && (e.name + e.message)))) throw new Error(`암호가 걸린 PDF는 처리할 수 없습니다: ${file.name}`); throw new Error(`PDF를 읽을 수 없습니다: ${file.name}`); }
  }
  async function openPdfJs(file) {
    await needLib('pdfjs');
    try { return await pdfjsLib.getDocument({ data: new Uint8Array(await readBuf(file)) }).promise; }
    catch (e) { if (e && e.name === 'PasswordException') throw new Error(`암호가 걸린 PDF는 처리할 수 없습니다: ${file.name}`); throw new Error(`PDF를 읽을 수 없습니다: ${file.name}`); }
  }
  const canvasFromImage = async (file, maxSide) => {
    const bmp = await loadBitmap(file), { w, h } = dims(bmp), s = Math.min(1, (maxSide || 1e9) / Math.max(w, h)), cv = mkCanvas(w * s, h * s), cx = cv.getContext('2d');
    cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height); return cv;
  };

  // ---------- ZIP (무압축 저장) ----------
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function makeZip(items) {
    const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
    const d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const it of items) {
      const data = new Uint8Array(await it.blob.arrayBuffer()), name = enc.encode(it.name), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh, name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(ch, name); offset += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((a, p) => a + (p.byteLength ?? p.length), 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, items.length, true); end.setUint16(10, items.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }

  // ---------- 서버(LibreOffice) 변환 요청 ----------
  const OFFICE_RUN = to => async ({ files, progress }) => {
    const out = [];
    for (let i = 0; i < files.length; i++) {
      progress(i / files.length, `${i + 1}/${files.length} 서버에서 변환 중… (파일에 따라 수십 초 걸릴 수 있습니다)`);
      const f = files[i].file, r = await fetch('/api/convert?to=' + to, { method: 'POST', headers: { 'X-Filename': encodeURIComponent(f.name) }, body: f });
      if (!r.ok) { let m = '변환에 실패했습니다.'; try { m = (await r.json()).error || m; } catch { /* 본문 없음 */ } throw new Error(`${f.name}: ${m}`); }
      out.push({ name: baseName(f.name) + '.' + to, blob: await r.blob() });
    }
    return out;
  };
  const extOf = n => (String(n).split('.').pop() || '').toLowerCase();

  // ---------- 도구 정의 ----------
  const PAGES = { k: 'pages', label: '페이지 범위', type: 'text', ph: '예: 1-3, 5, 8-  (비우면 전체)' };
  const TOOLS = [
    // ===== PDF 변환 =====
    { id: 'img2pdf', group: 'PDF 변환', name: '이미지를 PDF로', badge: 'IMG→PDF', desc: 'JPG·PNG·WEBP 이미지를 한 개의 PDF 문서로 합칩니다. 순서는 끌거나 ▲▼로 바꿀 수 있습니다.', kind: 'image', multi: true, order: true, min: 1, needs: ['pdflib'],
      opts: [{ k: 'size', label: '페이지 크기', type: 'select', choices: [['fit', '이미지 크기에 맞춤'], ['a4', 'A4 용지 (이미지를 맞춰 넣기)']] }, { k: 'margin', label: 'A4 여백', type: 'select', choices: [['0', '없음'], ['28', '보통'], ['56', '넓게']], show: o => o.size === 'a4' }, { k: 'quality', label: '화질', type: 'select', choices: [['0.95', '높음 (파일 큼)'], ['0.85', '보통'], ['0.7', '작은 용량']], def: '0.85' }],
      async run({ files, o, progress }) {
        const { PDFDocument } = PDFLib, doc = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          progress(i / files.length, `이미지 ${i + 1}/${files.length} 처리 중…`);
          const cv = await canvasFromImage(files[i].file, 4200), img = await doc.embedJpg(new Uint8Array(await (await toBlob(cv, 'image/jpeg', +o.quality)).arrayBuffer()));
          let pw = img.width * 0.75, ph = img.height * 0.75, dw = pw, dh = ph, x = 0, y = 0;
          if (o.size === 'a4') { const land = img.width > img.height; pw = land ? 841.89 : 595.28; ph = land ? 595.28 : 841.89; const m = +o.margin, sc = Math.min((pw - 2 * m) / img.width, (ph - 2 * m) / img.height); dw = img.width * sc; dh = img.height * sc; x = (pw - dw) / 2; y = (ph - dh) / 2; }
          doc.addPage([pw, ph]).drawImage(img, { x, y, width: dw, height: dh });
        }
        return [pdfOut(await doc.save(), (files.length === 1 ? baseName(files[0].file.name) : 'images') + '.pdf')];
      } },
    { id: 'pdf2img', group: 'PDF 변환', name: 'PDF를 이미지로', badge: 'PDF→JPG', desc: 'PDF의 각 페이지를 JPG 또는 PNG 이미지로 저장합니다.', kind: 'pdf', min: 1, needs: ['pdfjs'],
      opts: [{ k: 'fmt', label: '이미지 형식', type: 'select', choices: [['jpg', 'JPG'], ['png', 'PNG (투명 배경 없음)']] }, { k: 'scale', label: '해상도', type: 'select', choices: [['1', '보통 (72dpi · 작은 용량)'], ['2', '높음 (144dpi)'], ['3', '아주 높음 (216dpi · 인쇄용)']], def: '2' }, PAGES],
      async run({ files, o, progress }) {
        const pdf = await openPdfJs(files[0].file), ranges = parseRanges(o.pages, pdf.numPages), idx = ranges.length ? rangeIdx(ranges) : [...Array(pdf.numPages).keys()], out = [];
        if (idx.length > 200) throw new Error('한 번에 최대 200페이지까지 변환할 수 있습니다. 페이지 범위를 나눠 주세요.');
        for (let n = 0; n < idx.length; n++) {
          progress(n / idx.length, `${n + 1}/${idx.length} 페이지 변환 중…`);
          const page = await pdf.getPage(idx[n] + 1), vp = page.getViewport({ scale: +o.scale }), cv = mkCanvas(vp.width, vp.height), cx = cv.getContext('2d');
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); await page.render({ canvasContext: cx, viewport: vp }).promise;
          out.push({ name: `${baseName(files[0].file.name)}_${idx[n] + 1}.${o.fmt}`, blob: await toBlob(cv, o.fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92) });
        }
        return out;
      } },
    { id: 'pdf2txt', group: 'PDF 변환', name: 'PDF 텍스트 추출', badge: 'PDF→TXT', desc: 'PDF 안의 글자를 텍스트(.txt) 파일로 추출합니다. 스캔 이미지로 된 PDF는 글자가 추출되지 않습니다.', kind: 'pdf', min: 1, needs: ['pdfjs'], opts: [],
      async run({ files, progress }) {
        const pdf = await openPdfJs(files[0].file); let text = '';
        for (let p = 1; p <= pdf.numPages; p++) { progress(p / pdf.numPages, `${p}/${pdf.numPages} 페이지 추출 중…`); const tc = await (await pdf.getPage(p)).getTextContent(); let line = ''; tc.items.forEach(it => { line += it.str + (it.hasEOL ? '\n' : ' '); }); text += `\n===== ${p} 페이지 =====\n${line.trim()}\n`; }
        if (!text.replace(/=====.*=====|\s/g, '')) throw new Error('추출할 글자가 없습니다. (스캔한 이미지 PDF일 수 있습니다)');
        return [{ name: baseName(files[0].file.name) + '.txt', blob: new Blob(['﻿' + text.trim() + '\n'], { type: 'text/plain;charset=utf-8' }) }];
      } },
    // ===== PDF 편집 =====
    { id: 'merge', group: 'PDF 편집', name: 'PDF 병합', badge: 'MERGE', desc: '여러 PDF를 하나로 합칩니다. 합칠 순서는 끌거나 ▲▼로 바꿀 수 있습니다.', kind: 'pdf', multi: true, order: true, min: 2, needs: ['pdflib'], opts: [],
      async run({ files, progress }) {
        const { PDFDocument } = PDFLib, out = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) { progress(i / files.length, `${i + 1}/${files.length} 문서 합치는 중…`); const src = await loadPdf(files[i].file); (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p)); }
        return [pdfOut(await out.save(), 'merged.pdf')];
      } },
    { id: 'split', group: 'PDF 편집', name: 'PDF 분할 · 페이지 추출', badge: 'SPLIT', desc: '원하는 페이지만 뽑아 새 PDF로 만들거나, 여러 개로 나눕니다.', kind: 'pdf', min: 1, needs: ['pdflib'],
      opts: [{ k: 'mode', label: '방식', type: 'select', choices: [['extract', '선택한 페이지를 PDF 한 개로 추출'], ['ranges', '범위마다 PDF 따로 저장'], ['each', '모든 페이지를 한 장씩 나누기']] }, { ...PAGES, label: '페이지 범위', ph: '예: 1-3, 5, 8-', show: o => o.mode !== 'each' }],
      async run({ files, o, progress }) {
        const src = await loadPdf(files[0].file), total = src.getPageCount(), base = baseName(files[0].file.name), out = [];
        const make = async idx => { const d = await PDFLib.PDFDocument.create(); (await d.copyPages(src, idx)).forEach(p => d.addPage(p)); return d.save(); };
        if (o.mode === 'each') { if (total > 300) throw new Error('최대 300페이지까지 나눌 수 있습니다.'); for (let i = 0; i < total; i++) { progress(i / total, `${i + 1}/${total} 페이지 분할 중…`); out.push(pdfOut(await make([i]), `${base}_${i + 1}.pdf`)); } return out; }
        const ranges = parseRanges(o.pages, total); if (!ranges.length) throw new Error('페이지 범위를 입력해 주세요. (예: 1-3, 5)');
        if (o.mode === 'extract') return [pdfOut(await make(rangeIdx(ranges)), `${base}_추출.pdf`)];
        for (let i = 0; i < ranges.length; i++) { progress(i / ranges.length, `${i + 1}/${ranges.length} 범위 저장 중…`); const [a, b] = ranges[i]; out.push(pdfOut(await make(rangeIdx([[a, b]])), `${base}_${a === b ? a : a + '-' + b}.pdf`)); }
        return out;
      } },
    { id: 'rotate', group: 'PDF 편집', name: 'PDF 회전', badge: 'ROTATE', desc: 'PDF 페이지를 90°씩 돌려 저장합니다. 전체 또는 일부 페이지만 회전할 수 있습니다.', kind: 'pdf', min: 1, needs: ['pdflib'],
      opts: [{ k: 'angle', label: '회전 각도 (시계 방향)', type: 'select', choices: [['90', '90°'], ['180', '180°'], ['270', '270° (반시계 90°)']] }, PAGES],
      async run({ files, o }) {
        const doc = await loadPdf(files[0].file), pages = doc.getPages(), ranges = parseRanges(o.pages, pages.length), idx = ranges.length ? rangeIdx(ranges) : pages.map((_, i) => i);
        idx.forEach(i => pages[i].setRotation(PDFLib.degrees((pages[i].getRotation().angle + +o.angle) % 360)));
        return [pdfOut(await doc.save(), baseName(files[0].file.name) + '_회전.pdf')];
      } },
    { id: 'delpages', group: 'PDF 편집', name: 'PDF 페이지 삭제', badge: 'DELETE', desc: '필요 없는 페이지를 지우고 나머지로 새 PDF를 만듭니다.', kind: 'pdf', min: 1, needs: ['pdflib'],
      opts: [{ ...PAGES, label: '삭제할 페이지', ph: '예: 2, 4-6' }],
      async run({ files, o }) {
        const doc = await loadPdf(files[0].file), total = doc.getPageCount(), ranges = parseRanges(o.pages, total); if (!ranges.length) throw new Error('삭제할 페이지를 입력해 주세요. (예: 2, 4-6)');
        const del = new Set(rangeIdx(ranges)); if (del.size >= total) throw new Error('모든 페이지를 삭제할 수는 없습니다.');
        [...del].sort((a, b) => b - a).forEach(i => doc.removePage(i));
        return [pdfOut(await doc.save(), baseName(files[0].file.name) + '_삭제.pdf')];
      } },
    { id: 'pagenum', group: 'PDF 편집', name: 'PDF 페이지 번호 넣기', badge: 'NUMBER', desc: '각 페이지에 쪽 번호를 넣습니다.', kind: 'pdf', min: 1, needs: ['pdflib'],
      opts: [{ k: 'pos', label: '위치', type: 'select', choices: [['bc', '아래 가운데'], ['br', '아래 오른쪽'], ['bl', '아래 왼쪽'], ['tc', '위 가운데'], ['tr', '위 오른쪽']] }, { k: 'fmt', label: '형식', type: 'select', choices: [['n', '1, 2, 3 …'], ['nt', '1 / 10, 2 / 10 …']] }, { k: 'start', label: '시작 번호', type: 'number', def: 1, min: 0 }, { k: 'size', label: '글자 크기', type: 'number', def: 11, min: 6, max: 40 }],
      async run({ files, o }) {
        const doc = await loadPdf(files[0].file), font = await doc.embedFont(PDFLib.StandardFonts.Helvetica), pages = doc.getPages(), size = +o.size || 11;
        pages.forEach((p, i) => {
          const { width, height } = p.getSize(), n = (+o.start || 1) + i, t = o.fmt === 'nt' ? `${n} / ${(+o.start || 1) + pages.length - 1}` : String(n), tw = font.widthOfTextAtSize(t, size), m = 28;
          const x = o.pos.endsWith('c') ? (width - tw) / 2 : o.pos.endsWith('r') ? width - tw - m : m, y = o.pos.startsWith('b') ? m - size / 2 : height - m - size / 2;
          p.drawText(t, { x, y, size, font, color: PDFLib.rgb(0.2, 0.2, 0.2) });
        });
        return [pdfOut(await doc.save(), baseName(files[0].file.name) + '_쪽번호.pdf')];
      } },
    { id: 'watermark', group: 'PDF 편집', name: 'PDF 워터마크', badge: 'MARK', desc: '모든 페이지에 글자 워터마크(한글 가능)를 넣습니다.', kind: 'pdf', min: 1, needs: ['pdflib'],
      opts: [{ k: 'text', label: '워터마크 글자', type: 'text', def: '샘플', ph: '예: 시안 확인용' }, { k: 'size', label: '크기 (페이지 너비 대비 %)', type: 'range', def: 60, min: 20, max: 100 }, { k: 'opacity', label: '투명도 %', type: 'range', def: 25, min: 5, max: 80 }, { k: 'angle', label: '기울기 (°)', type: 'range', def: 35, min: 0, max: 90 }, { k: 'color', label: '색상', type: 'color', def: '#888888' }],
      async run({ files, o }) {
        const text = String(o.text || '').trim(); if (!text) throw new Error('워터마크 글자를 입력해 주세요.');
        const doc = await loadPdf(files[0].file), fs = 160, tmp = mkCanvas(10, 10).getContext('2d'); tmp.font = `bold ${fs}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
        const tw = Math.ceil(tmp.measureText(text).width), cv = mkCanvas(tw + 40, fs * 1.5), cx = cv.getContext('2d'); cx.font = tmp.font; cx.fillStyle = o.color; cx.textBaseline = 'middle'; cx.fillText(text, 20, cv.height / 2);
        const img = await doc.embedPng(new Uint8Array(await (await toBlob(cv, 'image/png')).arrayBuffer())), ang = +o.angle * Math.PI / 180;
        doc.getPages().forEach(p => {
          const { width, height } = p.getSize(), w = width * (+o.size / 100), h = w * (img.height / img.width), cxp = width / 2, cyp = height / 2;
          p.drawImage(img, { x: cxp - (w / 2 * Math.cos(ang) - h / 2 * Math.sin(ang)), y: cyp - (w / 2 * Math.sin(ang) + h / 2 * Math.cos(ang)), width: w, height: h, rotate: PDFLib.degrees(+o.angle), opacity: +o.opacity / 100 });
        });
        return [pdfOut(await doc.save(), baseName(files[0].file.name) + '_워터마크.pdf')];
      } },
    { id: 'pdfcompress', group: 'PDF 편집', name: 'PDF 압축', badge: 'COMPRESS', desc: '파일 용량을 줄입니다. “이미지로 압축”은 용량이 크게 줄지만 글자를 선택·검색할 수 없게 됩니다.', kind: 'pdf', min: 1, needs: ['pdflib', 'pdfjs'], compare: true,
      opts: [{ k: 'mode', label: '압축 방식', type: 'select', choices: [['light', '구조만 정리 (글자 유지 · 압축률 낮음)'], ['strong', '이미지로 압축 (용량 크게 감소 · 글자 선택 불가)']] }, { k: 'level', label: '화질', type: 'select', choices: [['high', '높음 (150dpi)'], ['mid', '보통 (110dpi)'], ['low', '낮음 (80dpi · 가장 작게)']], def: 'mid', show: o => o.mode === 'strong' }],
      async run({ files, o, progress }) {
        const f = files[0].file, base = baseName(f.name);
        if (o.mode === 'light') { const doc = await loadPdf(f); return [pdfOut(await doc.save({ useObjectStreams: true }), base + '_압축.pdf')]; }
        const L = { high: [150, 0.8], mid: [110, 0.68], low: [80, 0.55] }[o.level], pdf = await openPdfJs(f), out = await PDFLib.PDFDocument.create();
        for (let p = 1; p <= pdf.numPages; p++) {
          progress(p / pdf.numPages, `${p}/${pdf.numPages} 페이지 압축 중…`);
          const page = await pdf.getPage(p), base1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: L[0] / 72 }), cv = mkCanvas(vp.width, vp.height), cx = cv.getContext('2d');
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); await page.render({ canvasContext: cx, viewport: vp }).promise;
          const img = await out.embedJpg(new Uint8Array(await (await toBlob(cv, 'image/jpeg', L[1])).arrayBuffer()));
          out.addPage([base1.width, base1.height]).drawImage(img, { x: 0, y: 0, width: base1.width, height: base1.height });
        }
        return [pdfOut(await out.save(), base + '_압축.pdf')];
      } },
    // ===== 이미지 =====
    { id: 'imgconv', group: '이미지 도구', name: '이미지 형식 변환', badge: 'JPG·PNG', desc: 'JPG, PNG, WEBP 형식으로 서로 바꿉니다. 여러 장을 한 번에 변환할 수 있습니다.', kind: 'image', multi: true, min: 1, needs: [],
      opts: [{ k: 'to', label: '변환할 형식', type: 'select', choices: [['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WEBP']] }, { k: 'q', label: '화질 (JPG·WEBP)', type: 'range', def: 90, min: 40, max: 100, show: o => o.to !== 'png' }],
      async run({ files, o, progress }) {
        const type = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[o.to], out = [];
        for (let i = 0; i < files.length; i++) { progress(i / files.length, `${i + 1}/${files.length} 변환 중…`); const bmp = await loadBitmap(files[i].file), { w, h } = dims(bmp), cv = mkCanvas(w, h), cx = cv.getContext('2d'); if (o.to === 'jpg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); } cx.drawImage(bmp, 0, 0); out.push({ name: `${baseName(files[i].file.name)}.${o.to}`, blob: await toBlob(cv, type, +o.q / 100) }); }
        return out;
      } },
    { id: 'imgcompress', group: '이미지 도구', name: '이미지 압축', badge: 'COMPRESS', desc: '화질을 크게 해치지 않고 이미지 용량을 줄입니다. 온라인 접수·이메일 첨부에 편리합니다.', kind: 'image', multi: true, min: 1, needs: [], compare: true,
      opts: [{ k: 'q', label: '화질', type: 'range', def: 72, min: 30, max: 95 }, { k: 'max', label: '긴 변 최대 크기', type: 'select', choices: [['0', '원본 크기 유지'], ['3000', '3000px'], ['2000', '2000px'], ['1600', '1600px'], ['1200', '1200px'], ['800', '800px']], def: '2000' }, { k: 'to', label: '저장 형식', type: 'select', choices: [['jpg', 'JPG (호환성 최고)'], ['webp', 'WEBP (더 작음)']] }],
      async run({ files, o, progress }) {
        const out = [];
        for (let i = 0; i < files.length; i++) { progress(i / files.length, `${i + 1}/${files.length} 압축 중…`); const cv = await canvasFromImage(files[i].file, +o.max || 0); out.push({ name: `${baseName(files[i].file.name)}_압축.${o.to}`, blob: await toBlob(cv, o.to === 'webp' ? 'image/webp' : 'image/jpeg', +o.q / 100), orig: files[i].file.size }); }
        return out;
      } },
    { id: 'imgresize', group: '이미지 도구', name: '이미지 크기 조절', badge: 'RESIZE', desc: '이미지를 원하는 크기(픽셀) 또는 비율(%)로 줄이거나 늘립니다.', kind: 'image', multi: true, min: 1, needs: [],
      opts: [{ k: 'mode', label: '조절 방식', type: 'select', choices: [['pct', '비율(%)로'], ['px', '가로 크기(px)로 (세로는 자동)']] }, { k: 'pct', label: '비율 %', type: 'number', def: 50, min: 5, max: 400, show: o => o.mode === 'pct' }, { k: 'width', label: '가로 px', type: 'number', def: 1200, min: 16, max: 8000, show: o => o.mode === 'px' }],
      async run({ files, o, progress }) {
        const out = [];
        for (let i = 0; i < files.length; i++) {
          progress(i / files.length, `${i + 1}/${files.length} 변환 중…`);
          const bmp = await loadBitmap(files[i].file), { w, h } = dims(bmp), nw = o.mode === 'pct' ? w * (+o.pct / 100) : +o.width, nh = h * (nw / w);
          if (nw * nh > 100e6) throw new Error('결과 이미지가 너무 큽니다. 크기를 줄여 주세요.');
          const png = /png/i.test(files[i].file.type), cv = mkCanvas(nw, nh), cx = cv.getContext('2d'); if (!png) { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); } cx.imageSmoothingQuality = 'high'; cx.drawImage(bmp, 0, 0, cv.width, cv.height);
          out.push({ name: `${baseName(files[i].file.name)}_${cv.width}x${cv.height}.${png ? 'png' : 'jpg'}`, blob: await toBlob(cv, png ? 'image/png' : 'image/jpeg', 0.92) });
        }
        return out;
      } },
    // ===== Office 변환 (서버의 LibreOffice) =====
    { id: 'word2pdf', group: 'Office 변환', name: 'Word를 PDF로', badge: 'DOC→PDF', desc: 'Word(.doc, .docx)·RTF·ODT·텍스트(.txt) 문서를 PDF로 변환합니다. 한글(.hwp) 문서는 지원하지 않습니다.', kind: 'office', exts: ['doc', 'docx', 'rtf', 'odt', 'txt'], multi: true, min: 1, needs: [], server: true, opts: [], run: OFFICE_RUN('pdf') },
    { id: 'excel2pdf', group: 'Office 변환', name: 'Excel을 PDF로', badge: 'XLS→PDF', desc: 'Excel(.xls, .xlsx)·CSV·ODS 파일을 PDF로 변환합니다. 인쇄 영역과 페이지 설정이 그대로 적용됩니다.', kind: 'office', exts: ['xls', 'xlsx', 'csv', 'ods'], multi: true, min: 1, needs: [], server: true, opts: [], run: OFFICE_RUN('pdf') },
    { id: 'ppt2pdf', group: 'Office 변환', name: 'PowerPoint를 PDF로', badge: 'PPT→PDF', desc: 'PowerPoint(.ppt, .pptx)·ODP 프레젠테이션을 PDF로 변환합니다.', kind: 'office', exts: ['ppt', 'pptx', 'odp'], multi: true, min: 1, needs: [], server: true, opts: [], run: OFFICE_RUN('pdf') },
    { id: 'pdf2word', group: 'Office 변환', name: 'PDF를 Word로', badge: 'PDF→DOCX', beta: true, desc: 'PDF를 편집 가능한 Word(.docx) 문서로 바꿉니다.', kind: 'pdf', exts: ['pdf'], multi: true, min: 1, needs: [], server: true, opts: [], run: OFFICE_RUN('docx') },
    { id: 'pdf2ppt', group: 'Office 변환', name: 'PDF를 PowerPoint로', badge: 'PDF→PPTX', beta: true, desc: 'PDF 각 페이지를 PowerPoint(.pptx) 슬라이드로 바꿉니다.', kind: 'pdf', exts: ['pdf'], multi: true, min: 1, needs: [], server: true, opts: [], run: OFFICE_RUN('pptx') },
  ];
  const GROUPS = [['PDF 변환', '#ef4444'], ['Office 변환', '#f59e0b'], ['PDF 편집', '#3056ff'], ['이미지 도구', '#10b981']];
  const gColor = g => (GROUPS.find(x => x[0] === g) || [0, '#64748b'])[1];
  const byId = id => TOOLS.find(t => t.id === id);

  // ---------- 화면: 도구 목록 ----------
  function indexPage() {
    return `<div class="wrap tl"><div class="tl-hero"><span class="tl-eyebrow">FREE FILE TOOLS</span><h1>무료 파일 변환 · 편집</h1>
      <p>회원가입 없이 바로 사용하세요. PDF·이미지 도구는 파일이 서버로 전송되지 않고 <b>내 브라우저 안에서만</b> 처리됩니다. (Office 변환은 서버에서 처리한 뒤 즉시 삭제됩니다)</p></div>
      ${GROUPS.map(([g, c]) => `<section class="tl-sec"><h2>${esc(g)}</h2><div class="tl-grid">${TOOLS.filter(t => t.group === g).map(t => `<a class="tl-card" href="#/tools/${t.id}" style="--c:${c}"><span class="tl-ic">${esc(t.badge)}</span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></a>`).join('')}</div></section>`).join('')}
      <p class="tl-note">※ PDF → Excel 변환과 한글(.hwp) 문서 변환은 지원하지 않습니다. 인쇄 주문용 파일은 PDF 또는 JPG/PNG 형태로 올려 주세요.</p></div>`;
  }

  // ---------- 화면: 도구 상세 ----------
  let ts = null;
  function toolPage(id) {
    const t = byId(id); if (!t) return '<div class="empty">존재하지 않는 도구입니다.<br><br><a class="btn" href="#/tools">도구 목록</a></div>';
    ts = { t, files: [], results: [], busy: false, n: 0 };
    setTimeout(() => mountTool(), 0);
    if (t.needs && t.needs.length) needLib(...t.needs).catch(() => { /* 실행 시 안내 */ });
    return `<div class="wrap tl"><div class="crumb"><a href="#/">홈</a> › <a href="#/tools">무료파일변환</a> › ${esc(t.name)}</div>
      <div class="tl-head" style="--c:${gColor(t.group)}"><span class="tl-ic">${esc(t.badge)}</span><div><h1>${esc(t.name)}</h1><p>${esc(t.desc)}</p></div></div>
      <div class="tl-box">
        ${t.beta ? '<div class="tl-info"><b>베타 기능</b> · 글자 위주의 PDF에 적합합니다. 표·이미지·복잡한 레이아웃은 원본과 달라질 수 있고, 스캔한 이미지 PDF는 글자로 바뀌지 않습니다.</div>' : ''}<div id="tl-warn" class="tl-err" hidden></div>
        <div class="tl-drop" id="tl-drop"><input type="file" id="tl-file" hidden ${t.multi ? 'multiple' : ''} accept="${t.exts ? t.exts.map(e => '.' + e).join(',') : t.kind === 'pdf' ? '.pdf,application/pdf' : 'image/*'}">
          <div class="tl-up"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg></div>
          <b>${t.kind === 'pdf' ? 'PDF' : t.kind === 'office' ? '문서' : '이미지'} 파일을 여기로 끌어다 놓으세요</b><button class="btn" id="tl-pick" type="button">파일 선택</button><small>${t.multi ? '여러 파일을 한 번에 선택할 수 있습니다 · ' : ''}${t.server ? '파일당 30MB까지 · 변환을 위해 서버로 전송되며 변환 직후 삭제됩니다' : '총 100MB까지 · 파일은 서버로 전송되지 않습니다'}</small></div>
        <div id="tl-files"></div><div id="tl-opts" class="tl-opts"></div>
        <div class="tl-act"><button class="btn lg" id="tl-run" disabled>${esc(t.name)} 실행</button></div>
        <div class="tl-prog" id="tl-prog" hidden><div class="tl-bar"><i id="tl-barfill"></i></div><span id="tl-ptxt"></span></div>
        <div id="tl-err" class="tl-err" hidden></div><div id="tl-res"></div></div>
      <div class="tl-others"><b>다른 도구</b>${TOOLS.filter(x => x.id !== t.id).map(x => `<a href="#/tools/${x.id}">${esc(x.name)}</a>`).join('')}</div></div>`;
  }
  function optHtml(op) {
    const id = 'o-' + op.k, lab = `<label for="${id}">${esc(op.label)}</label>`;
    let inp;
    if (op.type === 'select') inp = `<select id="${id}" data-o="${op.k}">${op.choices.map(([v, l]) => `<option value="${esc(v)}" ${String(op.def ?? op.choices[0][0]) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    else if (op.type === 'range') inp = `<div class="tl-rg"><input id="${id}" data-o="${op.k}" type="range" min="${op.min}" max="${op.max}" value="${op.def}"><output>${op.def}</output></div>`;
    else if (op.type === 'number') inp = `<input id="${id}" data-o="${op.k}" type="number" value="${op.def ?? ''}" ${op.min != null ? `min="${op.min}"` : ''} ${op.max != null ? `max="${op.max}"` : ''}>`;
    else if (op.type === 'color') inp = `<input id="${id}" data-o="${op.k}" type="color" value="${op.def}">`;
    else inp = `<input id="${id}" data-o="${op.k}" type="text" value="${esc(op.def ?? '')}" placeholder="${esc(op.ph || '')}">`;
    return `<div class="tl-o" data-ok="${op.k}">${lab}${inp}</div>`;
  }
  const collect = () => { const o = {}; document.querySelectorAll('#tl-opts [data-o]').forEach(el => { o[el.dataset.o] = el.value; }); return o; };
  function applyShow() { const o = collect(); ts.t.opts.forEach(op => { const el = document.querySelector(`#tl-opts [data-ok="${op.k}"]`); if (el && op.show) el.hidden = !op.show(o); }); }
  const accepts = (t, f) => t.exts ? t.exts.includes(extOf(f.name)) : (t.kind === 'pdf' ? /\.pdf$/i.test(f.name) || f.type === 'application/pdf' : /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name));
  function mountTool() {
    const t = ts.t, drop = $('#tl-drop'), inp = $('#tl-file');
    $('#tl-opts').innerHTML = t.opts.length ? `<h3>옵션</h3>${t.opts.map(optHtml).join('')}` : '';
    applyShow();
    $('#tl-opts').addEventListener('input', e => { if (e.target.type === 'range') e.target.nextElementSibling.textContent = e.target.value; applyShow(); });
    $('#tl-pick').onclick = e => { e.stopPropagation(); inp.click(); };
    drop.onclick = () => inp.click();
    inp.onchange = () => { addFiles([...inp.files]); inp.value = ''; };
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));
    $('#tl-run').onclick = run;
    if (t.server) fetch('/api/convert/status').then(r => r.json()).then(j => { ts.serverOk = !!j.available; if (!j.available) { const w = $('#tl-warn'); w.textContent = '이 서버에는 문서 변환 엔진(LibreOffice)이 설치되어 있지 않아 지금은 사용할 수 없습니다. 관리자에게 문의해 주세요.'; w.hidden = false; } renderFiles(); }).catch(() => { /* 실행 시 안내 */ });
    $('#tl-files').addEventListener('click', e => {
      const b = e.target.closest('[data-fa]'); if (!b) return; const [a, id] = b.dataset.fa.split(':'), i = ts.files.findIndex(f => f.id === +id); if (i < 0) return;
      if (a === 'x') { URL.revokeObjectURL(ts.files[i].url); ts.files.splice(i, 1); }
      else if (a === 'up' && i > 0) [ts.files[i - 1], ts.files[i]] = [ts.files[i], ts.files[i - 1]];
      else if (a === 'dn' && i < ts.files.length - 1) [ts.files[i + 1], ts.files[i]] = [ts.files[i], ts.files[i + 1]];
      renderFiles();
    });
  }
  function addFiles(list) {
    const t = ts.t; if (ts.busy) return;
    const ok = list.filter(f => accepts(t, f)); if (ok.length < list.length) toastMsg(t.exts ? `${t.exts.map(e => '.' + e).join(', ')} 파일만 추가할 수 있습니다.` : `${t.kind === 'pdf' ? 'PDF' : '이미지'} 파일만 추가할 수 있습니다.`);
    if (!ok.length) return;
    if (t.multi && ts.files.length + ok.length > 10) { toastMsg('한 번에 최대 10개까지 추가할 수 있습니다.'); ok.length = Math.max(0, 10 - ts.files.length); if (!ok.length) return; }
    if (!t.multi) { ts.files.forEach(f => URL.revokeObjectURL(f.url)); ts.files = []; }
    for (const f of (t.multi ? ok : ok.slice(0, 1))) {
      if (t.server && f.size > 30 * 1024 * 1024) { toastMsg(`${f.name}: 서버 변환은 파일당 30MB까지 가능합니다.`); continue; }
      if (ts.files.reduce((a, x) => a + x.file.size, 0) + f.size > MAX_TOTAL) { toastMsg('총 100MB를 넘을 수 없습니다.'); break; }
      ts.files.push({ id: ++ts.n, file: f, url: t.kind === 'image' ? URL.createObjectURL(f) : '' });
    }
    clearResults(); renderFiles();
  }
  function renderFiles() {
    const t = ts.t, el = $('#tl-files');
    el.innerHTML = ts.files.length ? `<h3>선택한 파일 (${ts.files.length}개${t.order ? ' · 이 순서대로 합쳐집니다' : ''})</h3>` + ts.files.map(f => `<div class="tl-file">${t.kind === 'image' ? `<img src="${esc(f.url)}" alt="">` : `<span class="tl-pdf">${esc(extOf(f.file.name).toUpperCase().slice(0, 4))}</span>`}<span class="tl-fn">${esc(f.file.name)}</span><em>${fmtSize(f.file.size)}</em>
      <span class="tl-fa">${t.order ? `<button data-fa="up:${f.id}" title="위로">▲</button><button data-fa="dn:${f.id}" title="아래로">▼</button>` : ''}<button data-fa="x:${f.id}" title="삭제">✕</button></span></div>`).join('') : '';
    const need = t.min || 1, run = $('#tl-run'); run.disabled = ts.busy || ts.files.length < need || ts.serverOk === false;
    run.textContent = ts.serverOk === false ? '변환 엔진 미설치' : ts.files.length < need ? `파일을 ${need}개 이상 선택해 주세요` : `${t.name} 실행`;
  }
  const toastMsg = m => { if (typeof toast === 'function') toast(m); else alert(m); };
  function clearResults() { ts.results.forEach(r => r.url && URL.revokeObjectURL(r.url)); ts.results = []; $('#tl-res').innerHTML = ''; $('#tl-err').hidden = true; }
  function setProg(p, txt) { $('#tl-prog').hidden = false; $('#tl-barfill').style.width = Math.round(Math.max(2, p * 100)) + '%'; $('#tl-ptxt').textContent = txt || ''; }
  async function run() {
    const t = ts.t; if (ts.busy) return;
    clearResults(); ts.busy = true; renderFiles(); $('#tl-run').disabled = true; $('#tl-run').textContent = '처리 중…';
    try {
      setProg(0.02, '변환 엔진을 준비하는 중…');
      if (t.needs && t.needs.length) await needLib(...t.needs);
      const out = await t.run({ files: ts.files, o: collect(), progress: setProg });
      if (!out || !out.length) throw new Error('변환 결과가 없습니다.');
      ts.results = out.map(r => ({ ...r, url: URL.createObjectURL(r.blob) }));
      setProg(1, '완료!'); showResults();
    } catch (e) { $('#tl-prog').hidden = true; const er = $('#tl-err'); er.textContent = e.message || '변환 중 오류가 발생했습니다.'; er.hidden = false; }
    finally { ts.busy = false; renderFiles(); }
  }
  function showResults() {
    const t = ts.t, rs = ts.results, total = rs.reduce((a, r) => a + r.blob.size, 0), origTotal = ts.files.reduce((a, f) => a + f.file.size, 0);
    const saved = t.compare && origTotal ? Math.round((1 - total / origTotal) * 100) : null;
    $('#tl-res').innerHTML = `<div class="tl-done"><div class="tl-ok">✓</div><h3>변환이 완료되었습니다</h3>
      ${saved != null ? `<p class="tl-save ${saved > 0 ? '' : 'bad'}">${fmtSize(origTotal)} → <b>${fmtSize(total)}</b> ${saved > 0 ? `(${saved}% 감소)` : '(용량이 줄지 않았습니다. 다른 설정을 시도해 보세요)'}</p>` : ''}
      <div class="tl-rlist">${rs.map((r, i) => `<div class="tl-r">${/image\//.test(r.blob.type) ? `<img src="${esc(r.url)}" alt="">` : '<span class="tl-pdf">' + esc(extOf(r.name).toUpperCase().slice(0, 4)) + '</span>'}<span class="tl-fn">${esc(r.name)}</span><em>${fmtSize(r.blob.size)}</em><a class="btn sm" href="${esc(r.url)}" download="${esc(r.name)}">다운로드</a></div>`).join('')}</div>
      ${rs.length > 1 ? '<button class="btn lg" id="tl-zip">전체 ZIP으로 받기</button>' : `<a class="btn lg" href="${esc(rs[0].url)}" download="${esc(rs[0].name)}">다운로드</a>`}
      <p class="tl-hint">결과 파일은 이 창을 닫으면 사라집니다. 인쇄 주문 시에는 상품 상세 화면에서 이 파일을 첨부하세요.</p></div>`;
    const z = $('#tl-zip'); if (z) z.onclick = async () => { z.disabled = true; z.textContent = 'ZIP 만드는 중…'; try { const blob = await makeZip(rs.map(r => ({ name: r.name, blob: r.blob }))), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${baseName(ts.files[0].file.name)}_변환결과.zip`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); } finally { z.disabled = false; z.textContent = '전체 ZIP으로 받기'; } };
    $('#tl-res').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.FileTools = { TOOLS, GROUPS, page: id => (id ? toolPage(id) : indexPage()) };
})();
