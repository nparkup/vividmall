# 치과 인쇄물 쇼핑몰

실행: node server.js (Node 18+, 의존성 없음)
- 쇼핑몰 http://localhost:3000
- 관리자 http://localhost:3000/admin/ (admin / admin1234, 환경변수 ADMIN_ID, ADMIN_PW로 변경)
- 데이터: data/db.json (삭제하면 초기화)

## 문서 변환 (Word·Excel·PowerPoint ↔ PDF)

무료파일변환 메뉴의 Office 변환 기능은 서버에 **LibreOffice**가 설치되어 있어야 동작합니다.
(PDF·이미지 도구는 브라우저에서 처리되므로 설치가 필요 없습니다.)

- Windows: `winget install TheDocumentFoundation.LibreOffice` 또는 https://www.libreoffice.org 설치 후 서버 재시작
- Linux: `sudo apt install libreoffice-writer libreoffice-calc libreoffice-impress fonts-nanum fonts-noto-cjk`
- 설치 경로가 특수하면 환경변수 `SOFFICE_PATH`에 soffice 실행 파일 경로 지정
- 선택 환경변수: `CONVERT_PARALLEL`(동시 변환 수, 기본 2), `CONVERT_TIMEOUT_MS`(기본 90000)
- 서버 시작 시 콘솔에 "문서 변환 엔진: LibreOffice 사용 가능"이 표시되면 준비 완료
- 제한: 파일당 30MB, IP당 10분 30회, 변환 직후 임시 파일 삭제. PDF→Word/PPT는 베타(글자 위주 PDF에 적합), PDF→Excel·HWP는 미지원
## Cloudflare 배포 (GitHub 연동, Workers + Durable Object + R2)

구조: `public/`(화면)은 Workers Assets, `/api/*`는 `worker/index.js`, 회원·주문·상품 데이터는 Durable Object(SQLite), 업로드 파일은 R2에 저장됩니다.
쇼핑몰 로직은 `lib/app.js`를 Node 서버(`server.js`)와 Worker가 함께 사용합니다.

1. R2 버킷 만들기 (최초 1회): `npx wrangler login` 후 `npx wrangler r2 bucket create vividmall-files`
2. Cloudflare 대시보드 → Workers & Pages → Create → **Import a repository**에서 이 GitHub 저장소 연결 (Deploy command: `npx wrangler deploy`)
3. 배포된 Worker → Settings → Variables and Secrets에 **ADMIN_PW**(관리자 비밀번호)를 Secret으로 추가 (ADMIN_ID는 선택, 기본 admin). 미설정 시 관리자 로그인이 막힙니다.
4. 이후 `main`에 푸시하면 자동 배포됩니다. 주소: `https://vividmall.<계정>.workers.dev`

로컬 테스트: 루트에 `.dev.vars` 파일(`ADMIN_PW=비밀번호`)을 만들고 `npm run dev:worker`

제한: Word/Excel/PPT↔PDF 변환(LibreOffice)은 Workers에서 동작하지 않습니다. PDF·이미지 도구는 정상 동작합니다.