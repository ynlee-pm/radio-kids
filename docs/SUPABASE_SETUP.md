# Supabase 수동 설정 가이드

radiokids 라디오 사이트를 Google 인증 + Supabase 백엔드로 업그레이드하기 위한 단계별 설정 안내입니다.

---

## Step 1: Supabase 프로젝트 생성

1. [Supabase 대시보드](https://app.supabase.com)에 로그인 또는 회원가입
2. **New Project** 클릭
3. 프로젝트명: `radiokids` (또는 원하는 명칭)
4. Region: `ap-southeast-1` (Singapore) 또는 가장 가까운 지역 선택
5. Database password 설정 (안전하게 보관)
6. **Create new project** 클릭

프로젝트 생성 후, 대시보드 좌상단에서:
- **Project URL** 확보 (예: `https://xxxxx.supabase.co`)
- **API Keys** 탭에서 **anon public** 키 복사 (예: `eyJhbGc...`)

이 두 값을 `/assets/config.js`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 입력합니다.

---

## Step 2: Google OAuth 클라이언트 설정

### 2-1. Google Cloud Console에서 OAuth 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 좌상단 프로젝트 드롭다운 → **새 프로젝트** → 프로젝트명: `radiokids` → **만들기**
3. 생성 후, 좌측 메뉴 → **API 및 서비스** → **사용자 인증 정보**
4. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
5. 첫 사용이면 "동의 화면 구성"을 먼저 진행:
   - **User Type**: 외부 선택
   - 필수 정보(이메일, 앱 이름) 입력 후 저장
6. 다시 **사용자 인증 정보** → **+ 만들기** → **OAuth 클라이언트 ID**
7. **애플리케이션 유형**: 웹 애플리케이션
8. **승인된 리다이렉트 URI** 추가 (아래 단계 2-2에서 확보할 Supabase 콜백 URI)
9. **만들기** → 클라이언트 ID, 클라이언트 보안 비밀번호 복사 (Step 2-2에서 사용)

### 2-2. Supabase에 Google Provider 설정

1. Supabase 대시보드 좌측 메뉴 → **Authentication**
2. **Providers** 탭
3. **Google** 찾기 → 클릭
4. **Enable** 토글 켜기
5. Step 2-1에서 복사한 **Client ID**, **Client Secret** 붙여넣기
6. **Redirect URL for OAuth** 확인 (Supabase가 자동 생성, 예: `https://xxxxx.supabase.co/auth/v1/callback`)
7. 이 Redirect URL을 Google Cloud Console의 **승인된 리다이렉트 URI**에 추가한 후 저장
8. Supabase에서 **Save** 클릭

---

## Step 3: 데이터베이스 스키마 적용

1. Supabase 대시보드 좌측 메뉴 → **SQL Editor**
2. **New Query** 클릭
3. 프로젝트 루트의 `db/schema.sql` 전체 내용 복사
4. SQL 편집기에 붙여넣기
5. **▶ Run** (또는 Ctrl+Enter) 클릭

스키마 실행 완료 후, 필요시 **SQL Editor** → **New Query**에서:
```sql
-- 선택사항: 샘플 데이터 추가 (db/seed.sql 내용)
-- 이 단계를 건너뛰면 빈 상태에서 시작합니다.
```

`db/seed.sql` 내용을 복사 → 붙여넣기 → **Run**으로 샘플 에피소드·주제 추가 (선택)

---

## Step 4: GitHub Pages 사이트 URL을 Supabase Redirect URLs에 등록

1. 라디오 사이트가 호스팅될 GitHub Pages URL 확인
   - 예: `https://github.com/사용자/radiokids` 리포지토리 → GitHub Pages 설정에서
   - 예: `https://사용자.github.io/radiokids`

2. Supabase 대시보드 → **Authentication** → **URL Configuration**
3. **Redirect URLs** 섹션:
   - **Add URL** 클릭
   - 사이트 URL 입력 (예: `https://사용자.github.io/radiokids`)
   - **Save** 클릭

---

## Step 5: 최초 Admin 권한 부여

1. 라디오 사이트(GitHub Pages)에 접속
2. 우상단 **로그인** 클릭 → Google 계정으로 로그인
3. 로그인 완료 후, Supabase 대시보드 → **SQL Editor** → **New Query**
4. 아래 SQL 실행 (유나님의 사용자 UUID로 교체):

```sql
update profiles set is_admin=true where id='<유나님 로그인 후의 UUID>';
```

**UUID 확인 방법:**
- Supabase 대시보드 → **Authentication** → **Users**
- 방금 로그인한 계정의 UUID 복사 → 위 SQL의 `<유나님 로그인 후의 UUID>` 부분에 붙여넣기

---

## Step 6: 권한 페이지에서 다른 사용자 관리

1. 라디오 사이트 우상단 **프로필** → **권한 관리** (또는 `/admin.html`)
2. 등록된 사용자 목록 표시
3. 필요시 사용자 옆 토글로 **Admin 권한 부여/해제** 가능

---

## 완료 확인

- [ ] Supabase 프로젝트 생성 & Project URL, Anon Key 확보
- [ ] Google OAuth 클라이언트 생성 & Supabase에 등록
- [ ] `db/schema.sql` 실행 (테이블 6개, 정책 18개, 함수/트리거 생성됨)
- [ ] `db/seed.sql` 실행 (선택)
- [ ] GitHub Pages URL을 Supabase Redirect URLs에 등록
- [ ] 최초 로그인 후 Admin 권한 부여
- [ ] 권한 페이지에서 추가 사용자 관리 가능 확인

완료 후, 라디오 사이트에서 **로그인/로그아웃**, **추천곡 제출**, **주제 투표**, **댓글 작성**, **주제 확정**(Admin)이 정상 작동하는지 확인합니다.
