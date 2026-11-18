# 🎖️ 통합 병력 인사 관리 및 출타/건강 현황 시스템

> **소대 / 중대 단위 실시간 병력 현원·출타·건강 현황 관리 및 군 표준 일일 인원 보고 자동 생성 웹앱**  
> 개발 스택: **HTML5, Tailwind CSS, JavaScript (Vanilla ES6), Supabase, Vercel**

---

## 📂 파일 구성 안내 (롤링페이퍼와 동일한 초간단 구조)
* **`index.html`**: 전체 화면 UI (헤더, 4대 통계 카드, 대원 명부, 출타 현황, 보고서 모달, 보안 잠금창)
* **`style.css`**: 국방/군사 테마 커스텀 다크 디자인 및 상태 뱃지 스타일
* **`app.js`**: 실시간 계산, 대원 관리, 출타 등록(대원 상태 자동 변경), 일일보고서 자동 생성 및 원클릭 복사
* **`config.js`**: Supabase URL, Key, 관리자 비밀번호 설정 파일
* **`supabase_schema.sql`**: Supabase SQL Editor에 복사·붙여넣기 할 원클릭 DB 스키마 (12명 샘플 데이터 포함)

---

## 🚀 4단계 초간단 설정 및 배포 가이드

### [1단계] Supabase 클라우드 DB 생성 (3분)
1. [supabase.com](https://supabase.com)에 로그인 후 **[New project]**를 클릭합니다.
   - 이름: `military-personnel` 입력
   - DB 비밀번호 입력 후 리전은 **`Seoul`** 선택
2. 좌측 메뉴 **[SQL Editor]** (`>_` 아이콘) ➔ **[New query]**를 누릅니다.
3. 본 폴더의 **`supabase_schema.sql`** 파일 전체 내용을 복사해서 붙여넣고 **[Run]** 버튼을 클릭합니다.
   - `members` 테이블, `event_logs` 테이블, 외래키(Foreign Key), 권한(RLS) 및 12명 부대원 샘플 데이터가 1초 만에 완성됩니다!

### [2단계] `config.js`에 Supabase 연결하기
1. Supabase 대시보드 왼쪽 아래 **[Project Settings]** (톱니바퀴) ➔ **[API]** 메뉴로 이동합니다.
2. **Project URL**과 **`anon` `public` key**를 복사합니다.
3. 본 폴더의 **`config.js`** 파일을 메모장이나 에디터로 열어 따옴표 안에 붙여넣고 저장합니다:
```javascript
const CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co", // 복사한 URL
  SUPABASE_ANON_KEY: "eyJhbGciOi...",                 // 복사한 anon key
  ADMIN_PASSWORD: "rok1234"                          // 관리자 비밀번호
};
```
> 💡 지금 바로 `index.html`을 더블클릭해서 브라우저로 열어보세요! 내 컴퓨터에서 즉시 테스트할 수 있습니다.

### [3단계] GitHub에 소스코드 올리기 (Push)
1. [github.com](https://github.com) 로그인 후 우측 상단 **[+] ➔ [New repository]** 클릭
2. Repository name에 `military-personnel-system` 입력 후 **[Create repository]** 클릭
3. 생성된 빈 화면 중앙의 **`uploading an existing file`** 클릭
4. 현재 폴더에 있는 모든 파일(`index.html`, `style.css`, `app.js`, `config.js` 등)을 드래그해서 끌어다 놓습니다.
5. 하단의 초록색 **[Commit changes]** 버튼을 클릭하면 업로드 완료!

### [4단계] Vercel 무료 웹 배포 (실제 인터넷 URL 생성)
1. [vercel.com](https://vercel.com)에 접속하여 GitHub 계정으로 로그인합니다.
2. 대시보드에서 **[Add New...] ➔ [Project]**를 클릭합니다.
3. 방금 올린 `military-personnel-system` 저장소 옆의 **[Import]** 버튼을 누릅니다.
4. 별도의 빌드 설정 없이 맨 아래 파란색 **[Deploy]** 버튼을 바로 클릭합니다!
5. 약 20초 만에 실제 접속 가능한 인터넷 주소(예: `https://military-personnel-system.vercel.app`)가 완성됩니다! 🎉

---

## 🔒 관리자 접속 정보
- **기본 비밀번호**: `rok1234` (`config.js`에서 언제든 변경 가능)
- 부대원 상태(현원/휴가/외출/외박/환자) 실시간 변경 및 출타 복귀 시 자동 '현원' 복귀
- **[일일 보고서 생성]** 클릭 시 군 표준 보고 문구가 자동 생성되며 **[📋 원클릭 복사]**로 카카오톡·온나라에 즉시 전송 가능!
