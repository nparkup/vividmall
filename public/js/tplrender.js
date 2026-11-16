// 디자인템플릿 렌더러: 템플릿/디자인 JSON → SVG 문자열 (갤러리 미리보기, 편집기, PNG 내보내기 공용)
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  const TOOTH = 'M-10,-12 C-14,-12 -16,-6 -14,0 C-12,8 -10,16 -6,16 C-3,16 -3,8 0,8 C3,8 3,16 6,16 C10,16 12,8 14,0 C16,-6 14,-12 10,-12 C6,-12 4,-9 0,-9 C-4,-9 -6,-12 -10,-12Z';
  const SAFE_HREF = h => /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|\/[\w\/.-]+)$/.test(String(h || ''));

  function imageFilter(e) {
    const b = num(e.brightness, 1), c = num(e.contrast, 1), s = e.gray ? 0 : num(e.saturate, 1), bl = num(e.blur, 0);
    if (b === 1 && c === 1 && s === 1 && !bl) return '';
    const slope = c * b, icpt = (0.5 - 0.5 * c) * b;
    return `<filter id="f_${e.id}" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%">${bl ? `<feGaussianBlur stdDeviation="${bl}"/>` : ''}<feComponentTransfer><feFuncR type="linear" slope="${slope}" intercept="${icpt}"/><feFuncG type="linear" slope="${slope}" intercept="${icpt}"/><feFuncB type="linear" slope="${slope}" intercept="${icpt}"/></feComponentTransfer><feColorMatrix type="saturate" values="${s}"/></filter>`;
  }

  // 그라데이션 / 그림자 / 회전 지원
  const COLOR_OK = c => /^(none|#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\))$/.test(String(c));
  const hasGrad = e => (e.type === 'rect' || e.type === 'ellipse') && e.grad && COLOR_OK(e.grad.a) && COLOR_OK(e.grad.b);
  const gradDef = e => {
    if (!hasGrad(e)) return '';
    const a = num(e.grad.ang, 45) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return `<linearGradient id="g_${esc(e.id)}" x1="${0.5 - 0.5 * c}" y1="${0.5 - 0.5 * s}" x2="${0.5 + 0.5 * c}" y2="${0.5 + 0.5 * s}"><stop offset="0" stop-color="${esc(e.grad.a)}"/><stop offset="1" stop-color="${esc(e.grad.b)}"/></linearGradient>`;
  };
  const fillOf = e => (hasGrad(e) ? `url(#g_${esc(e.id)})` : esc(e.fill || 'none'));
  const shadowAttr = e => (e.shadow ? ' filter="url(#dsh)"' : '');
  function el(e) {
    const s = shape(e);
    if (!s || !e.rot || e.type === 'text') return s;
    return `<g transform="rotate(${num(e.rot)} ${num(e.x) + Math.max(1, num(e.w, 10)) / 2} ${num(e.y) + Math.max(1, num(e.h, 10)) / 2})">${s}</g>`;
  }
  function shape(e) {
    if (e.hidden) return '';
    const op = e.opacity != null && e.opacity < 1 ? ` opacity="${num(e.opacity, 1)}"` : '';
    const id = `data-id="${esc(e.id)}"`;
    const x = num(e.x), y = num(e.y), w = Math.max(1, num(e.w, 10)), h = Math.max(1, num(e.h, 10));
    switch (e.type) {
      case 'rect': return `<rect ${id}${op} x="${x}" y="${y}" width="${w}" height="${h}" rx="${num(e.rx)}" fill="${fillOf(e)}"${shadowAttr(e)} stroke="${esc(e.stroke || 'none')}" stroke-width="${num(e.sw)}"/>`;
      case 'ellipse': return `<ellipse ${id}${op} cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fillOf(e)}"${shadowAttr(e)} stroke="${esc(e.stroke || 'none')}" stroke-width="${num(e.sw)}"/>`;
      case 'icon': return `<svg ${id}${op} x="${x}" y="${y}" width="${w}" height="${h}" viewBox="-16 -12 32 28" preserveAspectRatio="xMidYMid meet" overflow="visible"><path d="${TOOTH}" fill="${esc(e.fill || '#000')}"/></svg>`;
      case 'image': {
        if (!SAFE_HREF(e.href)) return '';
        const f = imageFilter(e);
        return `<svg ${id}${op} x="${x}" y="${y}" width="${w}" height="${h}" overflow="hidden"><image href="${esc(e.href)}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"${f ? ` filter="url(#f_${esc(e.id)})"` : ''}/></svg>`;
      }
      case 'text': {
        const size = Math.max(4, num(e.size, 40)), lh = num(e.lh, 1.3), lines = String(e.text ?? '').split('\n');
        const anchor = e.align === 'center' ? 'middle' : e.align === 'right' ? 'end' : 'start';
        const fam = String(e.family || 'Malgun Gothic').replace(/['"<>&]/g, '');
        const tsp = lines.map((ln, i) => `<tspan x="${x}" ${i ? `dy="${size * lh}"` : ''}>${ln === '' ? '&#160;' : esc(ln)}</tspan>`).join('');
        return `<text ${id}${op} x="${x}" y="${y + size * 0.86}" font-size="${size}" fill="${esc(e.fill || '#000')}" font-weight="${num(e.weight, 400)}" font-family="'${fam}','Malgun Gothic','Apple SD Gothic Neo',sans-serif" text-anchor="${anchor}"${e.ls ? ` letter-spacing="${num(e.ls)}"` : ''}${e.italic ? ' font-style="italic"' : ''}>${tsp}</text>`;
      }
      default: return '';
    }
  }

  // opts.size: 지정 시 width/height 속성 포함(내보내기용) / opts.scale: 내보내기 배율
  function svg(doc, opts = {}) {
    const w = num(doc.w, 1000), h = num(doc.h, 1000), els = doc.elements || [];
    const defs = els.filter(e => e.type === 'image' && !e.hidden).map(imageFilter).join('') + els.filter(e => !e.hidden).map(gradDef).join('')
      + '<filter id="dsh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0f172a" flood-opacity=".18"/></filter>';
    const dim = opts.scale ? ` width="${Math.round(w * opts.scale)}" height="${Math.round(h * opts.scale)}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${dim} preserveAspectRatio="xMidYMid meet"><defs>${defs}</defs><rect width="${w}" height="${h}" fill="${esc(doc.bg || '#fff')}"/>${els.map(el).join('')}</svg>`;
  }

  // SVG → PNG Blob
  function exportPng(doc, scale = 1) {
    return new Promise((resolve, reject) => {
      const w = Math.round(num(doc.w, 1000) * scale), h = Math.round(num(doc.h, 1000) * scale);
      const url = URL.createObjectURL(new Blob([svg(doc, { scale })], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        cv.toBlob(b => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))), 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 변환에 실패했습니다.')); };
      img.src = url;
    });
  }
  const blobToDataUrl = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });

  window.TplRender = { svg, exportPng, blobToDataUrl, esc, SAFE_HREF };
})();
