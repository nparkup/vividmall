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