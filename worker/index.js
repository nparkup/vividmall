// Cloudflare Worker 진입점.
//  - 정적 화면(public/)은 Workers Assets가 서비스
//  - /api/*, /uploads/*, /img/uploads/* 는 이 Worker가 처리
//  - 데이터는 Durable Object(SQLite)에 저장, 업로드 파일은 R2(FILES)에 저장
import { DurableObject } from 'cloudflare:workers';
import libApp from '../lib/app.js';
const { createApp, HttpError } = libApp;

const CHUNK = 300000;   // 문자 수 기준 분할 (행당 2MB 제한 회피)
const json = (code, obj) => new Response(JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const IMG_TYPE = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export class Shop extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT NOT NULL, i INTEGER NOT NULL, v TEXT NOT NULL, PRIMARY KEY (k, i))');
    this.cache = {}; this.dirty = false;
    ctx.blockConcurrencyWhile(async () => {
      const parts = {};
      for (const r of this.sql.exec('SELECT k, i, v FROM kv ORDER BY k, i')) (parts[r.k] ||= []).push(r.v);
      let loaded = null;
      if (Object.keys(parts).length) { loaded = {}; for (const [k, v] of Object.entries(parts)) { const s = v.join(''); this.cache[k] = s; loaded[k] = JSON.parse(s); } }
      this.app = createApp({
        db: loaded, save: db => { this.db = db; this.dirty = true; }, adminId: env.ADMIN_ID || 'admin', adminPw: env.ADMIN_PW || '',
        io: {
          saveUpload: (name, buf) => env.FILES.put('uploads/' + name, buf),
          saveImage: (name, buf) => env.FILES.put('img/' + name, buf, { httpMetadata: { contentType: IMG_TYPE[name.split('.').pop()] || 'application/octet-stream' } }),
        },
      });
      this.app.on('GET', '/api/convert/status', () => ({ available: false }));   // Workers에서는 LibreOffice를 쓸 수 없음
      this.app.on('POST', '/api/convert', () => { throw new HttpError(503, '이 서버에서는 Word/Excel/PPT 문서 변환을 지원하지 않습니다.'); });
      this.flush();
    });
  }

  // 바뀐 최상위 항목만 저장
  flush() {
    if (!this.dirty || !this.db) return;
    this.dirty = false;
    for (const [k, val] of Object.entries(this.db)) {
      const s = JSON.stringify(val);
      if (s === undefined || this.cache[k] === s) continue;
      this.sql.exec('DELETE FROM kv WHERE k = ?', k);
      for (let i = 0, n = 0; i < s.length || n === 0; i += CHUNK, n++) this.sql.exec('INSERT INTO kv (k, i, v) VALUES (?, ?, ?)', k, n, s.slice(i, i + CHUNK));
      this.cache[k] = s;
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    try {
      if (pathname.startsWith('/uploads/')) {   // 고객 업로드 원본: 관리자만
        if (!this.app.isAdminToken(url.searchParams.get('t'))) return new Response('forbidden', { status: 403 });
        const o = await this.env.FILES.get('uploads/' + pathname.split('/').pop());
        if (!o) return new Response('Not found', { status: 404 });
        return new Response(o.body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment', 'Cache-Control': 'no-store' } });
      }
      if (pathname.startsWith('/img/uploads/')) {   // 관리자가 올린 상품/배너 이미지
        const o = await this.env.FILES.get('img/' + pathname.split('/').pop());
        if (!o) return new Response('Not found', { status: 404 });
        return new Response(o.body, { headers: { 'Content-Type': o.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' } });
      }
      const headers = Object.fromEntries(request.headers);
      const read = async limit => {
        if (Number(headers['content-length'] || 0) > limit) throw new HttpError(413, '파일/요청이 너무 큽니다.');
        const buf = Buffer.from(await request.arrayBuffer());
        if (buf.length > limit) throw new HttpError(413, '파일/요청이 너무 큽니다.');
        return buf;
      };
      const result = await this.app.dispatch({ method: request.method, pathname, query: Object.fromEntries(url.searchParams), headers, ip: headers['cf-connecting-ip'], read });
      this.flush();
      return json(200, result);
    } catch (e) {
      this.flush();
      if (e instanceof HttpError) return json(e.code, { error: e.message });
      console.error(e); return json(500, { error: '서버 오류가 발생했습니다.' });
    }
  }
}

export default {
  fetch(request, env) {
    return env.SHOP.get(env.SHOP.idFromName('main')).fetch(request);
  },
};
