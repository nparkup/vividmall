// 의존성 없는 Node.js 서버 (Node 18+). 실행: node server.js
// 쇼핑몰 로직은 lib/app.js 에 있고, 여기서는 파일 저장/HTTP/문서 변환(LibreOffice)을 담당합니다.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createApp, HttpError, fail } = require('./lib/app');

const PORT = process.env.PORT || 3000;
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PW = process.env.ADMIN_PW || 'admin1234';
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const STORAGE = process.env.STORAGE_DIR || ROOT;   // 배포 시 영구 디스크 경로 지정
const DATA_DIR = path.join(STORAGE, 'data');
const UPLOADS = path.join(STORAGE, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

let saveTimer = null;
const save = db => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 1)), 100);
};
const IMG_DIR = path.join(PUBLIC, 'img', 'uploads');
const app = createApp({
  db: fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : null,
  save, adminId: ADMIN_ID, adminPw: ADMIN_PW,
  io: {
    async saveUpload(name, buf) { fs.writeFileSync(path.join(UPLOADS, name), buf); },
    async saveImage(name, buf) { fs.mkdirSync(IMG_DIR, { recursive: true }); fs.writeFileSync(path.join(IMG_DIR, name), buf); },
  },
});
const { on, str } = app;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const readBody = (req, limit = 1e6) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0;
  req.on('data', c => { size += c.length; if (size > limit) { reject(new HttpError(413, '파일/요청이 너무 큽니다.')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

// ---- 문서 변환 (LibreOffice 헤드리스): Word/Excel/PPT → PDF, PDF → Word/PPT
const { execFile } = require('child_process');
const os = require('os');
const OFFICE_EXT = ['doc', 'docx', 'rtf', 'odt', 'txt', 'xls', 'xlsx', 'csv', 'ods', 'ppt', 'pptx', 'odp'];
const zipMagic = b => b[0] === 0x50 && b[1] === 0x4b, oleMagic = b => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
const MAGIC = {
  docx: zipMagic, xlsx: zipMagic, pptx: zipMagic, odt: zipMagic, ods: zipMagic, odp: zipMagic, doc: oleMagic, xls: oleMagic, ppt: oleMagic,
  rtf: b => b.subarray(0, 5).toString() === '{\\rtf', pdf: b => b.subarray(0, 5).toString().startsWith('%PDF'), txt: () => true, csv: () => true,
};
const OUT_MIME = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
const CONV_MAX_PARALLEL = +process.env.CONVERT_PARALLEL || 2, CONV_TIMEOUT = +process.env.CONVERT_TIMEOUT_MS || 90000, CONV_MAX_BYTES = 30e6;

// soffice 실행 파일 찾기: 환경변수 SOFFICE_PATH → 일반 설치 경로 → PATH
function findSoffice() {
  const cand = [process.env.SOFFICE_PATH, 'C:\\Program Files\\LibreOffice\\program\\soffice.exe', 'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe', '/Applications/LibreOffice.app/Contents/MacOS/soffice', '/usr/bin/soffice', '/usr/bin/libreoffice', '/usr/local/bin/soffice', '/opt/libreoffice/program/soffice'].filter(Boolean);
  for (const p of cand) { try { if (fs.statSync(p).isFile()) return p; } catch { /* 다음 후보 */ } }
  for (const dir of (process.env.PATH || '').split(path.delimiter)) for (const n of ['soffice', 'soffice.exe', 'libreoffice']) { const p = path.join(dir, n); try { if (fs.statSync(p).isFile()) return p; } catch { /* 다음 */ } }
  return null;
}
const SOFFICE_PREFIX = (() => { try { return JSON.parse(process.env.SOFFICE_ARGS_PREFIX || '[]'); } catch { return []; } })();   // (개발/테스트용) soffice 앞에 붙일 인자
const fileUrl = p => 'file://' + (p.startsWith('/') ? '' : '/') + encodeURI(p.replace(/\\/g, '/'));

// 동시 변환 제한 + 대기열
let convActive = 0; const convWait = [];
const convAcquire = () => new Promise((res, rej) => { if (convWait.length >= 8) return rej(new HttpError(503, '변환 요청이 많습니다. 잠시 후 다시 시도해 주세요.')); if (convActive < CONV_MAX_PARALLEL) { convActive++; res(); } else convWait.push(res); });
const convRelease = () => { const n = convWait.shift(); if (n) n(); else convActive--; };
// IP별 사용량 제한 (10분에 30회)
const convHits = new Map();
function convRate(ip) { const now = Date.now(), arr = (convHits.get(ip) || []).filter(t => now - t < 600000); if (arr.length >= 30) fail(429, '잠시 후 다시 시도해 주세요. (10분에 30회까지 변환할 수 있습니다)'); arr.push(now); convHits.set(ip, arr); }

app.on('GET', '/api/convert/status', () => ({ available: !!findSoffice() }));
app.on('POST', '/api/convert', async ({ req, query }) => {
  const to = ['pdf', 'docx', 'pptx'].includes(query.to) ? query.to : fail(400, '지원하지 않는 변환입니다.');
  const soffice = findSoffice() || fail(503, '이 서버에는 문서 변환 엔진(LibreOffice)이 설치되어 있지 않아 지금은 사용할 수 없습니다. 관리자에게 문의해 주세요.');
  convRate(req.ip || 'x');
  const name = decodeURIComponent(req.headers['x-filename'] || 'file'), ext = path.extname(name).slice(1).toLowerCase();
  if (!(to === 'pdf' ? OFFICE_EXT : ['pdf']).includes(ext)) fail(400, to === 'pdf' ? 'Word, Excel, PowerPoint 문서만 변환할 수 있습니다.' : 'PDF 파일만 변환할 수 있습니다.');
  const buf = await req.read(CONV_MAX_BYTES);
  if (!buf.length) fail(400, '빈 파일입니다.');
  if (!MAGIC[ext](buf)) fail(400, '파일 내용이 확장자와 맞지 않거나 손상된 파일입니다.');
  await convAcquire();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pmconv-'));
  try {
    const inp = path.join(dir, 'input.' + ext), outDir = path.join(dir, 'out');
    fs.mkdirSync(outDir); fs.writeFileSync(inp, buf);
    const args = [...SOFFICE_PREFIX, '--headless', '--norestore', '--nolockcheck', '--nodefault', '--nofirststartwizard', '--nologo', '-env:UserInstallation=' + fileUrl(path.join(dir, 'profile'))];
    if (ext === 'pdf') args.push('--infilter=' + (to === 'docx' ? 'writer_pdf_import' : 'impress_pdf_import'));
    args.push('--convert-to', to === 'docx' ? 'docx:MS Word 2007 XML' : to === 'pptx' ? 'pptx:Impress MS PowerPoint 2007 XML' : 'pdf', '--outdir', outDir, inp);
    await new Promise((resolve, reject) => execFile(soffice, args, { timeout: CONV_TIMEOUT, windowsHide: true, maxBuffer: 1e6 }, err => (err ? reject(err) : resolve())));
    const outFile = fs.readdirSync(outDir).find(f => f.toLowerCase().endsWith('.' + to));
    if (!outFile) fail(500, '변환 결과를 만들지 못했습니다. 문서가 손상되었거나 지원하지 않는 형식일 수 있습니다.');
    const out = fs.readFileSync(path.join(outDir, outFile));
    return { __raw: { status: 200, headers: { 'Content-Type': OUT_MIME[to], 'Content-Length': out.length, 'Cache-Control': 'no-store' }, body: out } };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error('[convert] 실패:', e.message);
    fail(500, e.killed ? '변환 시간이 초과되었습니다. 파일이 너무 크거나 복잡합니다.' : '문서를 변환하지 못했습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.');
  } finally { convRelease(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* 임시 폴더 정리 실패는 무시 */ } }
});

// ---------- 서버 ----------
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith('/api/')) {
      const result = await app.dispatch({ method: req.method, pathname, query: Object.fromEntries(url.searchParams), headers: req.headers, ip: req.socket.remoteAddress, read: limit => readBody(req, limit) });
      if (result && result.__raw) { res.writeHead(result.__raw.status, result.__raw.headers); return res.end(result.__raw.body); }   // 바이너리 응답(변환 결과 파일)
      return send(res, 200, result);
    }
    // 정적 파일
    let file;
    if (pathname.startsWith('/uploads/')) {
      if (!app.isAdminToken(url.searchParams.get('t'))) { res.writeHead(403); return res.end('forbidden'); }
      file = path.join(UPLOADS, path.basename(pathname));
    } else {
      file = path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname.endsWith('/') ? pathname + 'index.html' : pathname);
      if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    const headers = { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    if (pathname.startsWith('/uploads/')) headers['Content-Disposition'] = 'attachment';
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.code, { error: e.message });
    console.error(e); send(res, 500, { error: '서버 오류가 발생했습니다.' });
  }
});
server.listen(PORT, () => { console.log(findSoffice() ? '문서 변환 엔진: LibreOffice 사용 가능' : '문서 변환 엔진: LibreOffice 미설치 (Word/Excel/PPT↔PDF 변환 비활성)'); console.log(`쇼핑몰: http://localhost:${PORT}\n관리자: http://localhost:${PORT}/admin/  (ID: ${ADMIN_ID} / PW: ${process.env.ADMIN_PW ? '환경변수로 설정됨' : ADMIN_PW + ' ← 기본값입니다. 공개 전 ADMIN_PW를 꼭 바꾸세요'})`); });
