# 라디오키즈 — 로그인·권한 백엔드(Supabase) 설계

작성일: 2026-07-03

## 한 줄 요약

localStorage 프로토타입인 라디오키즈를, **Google 로그인 + 공용 DB(Supabase) + 행 단위 권한(RLS)** 을 갖춘 다중 사용자 앱으로 전환한다. 본인이 쓴 추천곡·댓글·주제는 본인이 수정/삭제하고, admin(유나)은 전체를 관리하며 다음 주제를 확정한다.

## 목표

- Google 계정으로 로그인/로그아웃
- 로그인 사용자만 추천곡·댓글·주제 작성, 투표 가능
- **소유권**: 추천곡·댓글·주제는 작성 본인만 수정/삭제. **admin은 전부** 수정/삭제(모더레이션)
- **투표**: 계정당 1표(취소 가능)
- **주제 확정**: admin이 후보 주제를 확정하면 새 주제(에피소드)로 승격되어 홈 On Air가 됨. admin 전용
- **권한 페이지**: admin이 회원의 admin 권한을 부여/해제
- **프로필**: 닉네임 설정. 프로필 닉네임이 작성물 전반에 자동 표기
- 수정/삭제 UI는 **"⋯ 더보기" 메뉴** 안으로. 본인 글 또는 admin일 때만 ⋯ 노출

## 비목표 (YAGNI)

- 이메일/비밀번호 로그인, 소셜 로그인 다중화(구글만)
- 실시간 동기화(정적 새로고침으로 충분), 알림, 이미지 업로드
- 서버리스 함수/자체 서버 — Supabase 직접 통신 + RLS로 충분

## 아키텍처

- **호스팅: 기존 GitHub Pages 유지**(옮기지 않음). 정적 사이트.
- **Supabase**: Auth(Google) + Postgres + RLS + RPC 1개(주제 확정).
- 브라우저가 `@supabase/supabase-js`(ESM CDN)로 Supabase에 **직접** 통신. 공개 anon 키 사용 — anon 키는 공개용이며, 데이터 보호는 RLS가 담당한다.
- 설정값(Supabase URL, anon key)은 `assets/config.js`에 상수로 둔다(공개되어도 안전).
- 기존 `assets/data.js`(localStorage)를 **Supabase 비동기 호출**로 전면 교체. 페이지 스크립트(home/episode/topics + 신규 profile/admin)는 async 렌더로 전환.

## 데이터 모델 (Postgres)

```sql
-- 프로필 (auth.users 1:1)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 주제(에피소드)
create table episodes (
  id uuid primary key default gen_random_uuid(),
  vol int not null,
  title text not null,
  intro text not null default '',
  cover_color text default '#5B6B74',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 추천곡
create table tracks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  artist text not null default '',
  song text not null default '',
  url text default '',
  reason text not null default '',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 댓글
create table comments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  body text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 다음 주제 후보
create table topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'candidate',   -- 'candidate' | 'confirmed'
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 투표(계정당 1표)
create table votes (
  topic_id uuid not null references topics(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);
```

- 닉네임은 각 작성물의 `created_by` → `profiles.nickname` join으로 표기. 프로필에서 닉네임을 바꾸면 과거 작성물 표기도 함께 바뀐다.
- On Air(현재 주제) = `vol`이 가장 큰 episode. 지난 주제 = 그 외 vol 내림차순.

### 신규 유저 프로필 자동 생성 트리거
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### admin 판별 헬퍼
```sql
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
```

## 권한 규칙 (RLS)

모든 테이블 `enable row level security`. 핵심 정책:

- **profiles**: `select` 전체 허용(닉네임 표시용). `update`는 본인(`id = auth.uid()`) 또는 admin. 단, 비-admin이 자기 `is_admin`을 못 올리도록 BEFORE UPDATE 트리거로 차단(변경 시 `is_admin()` 필요).
- **episodes**: `select` 전체. `insert/update/delete`는 **admin만**(에피소드는 주제 확정 또는 admin 직접 추가로만 생성).
- **tracks / comments / topics**: `select` 전체. `insert`는 로그인 + `created_by = auth.uid()`. `update/delete`는 `created_by = auth.uid()` **또는** `is_admin()`.
- **topics.status='confirmed'** 로의 변경은 admin만(확정 RPC 경유).
- **votes**: `select` 전체. `insert`는 `user_id = auth.uid()`. `delete`는 `user_id = auth.uid()`.

### 주제 확정 RPC (원자적, admin 전용)
```sql
create or replace function public.confirm_topic(p_topic uuid)
returns episodes language plpgsql security definer as $$
declare v_next int; v_topic topics; v_ep episodes;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into v_topic from topics where id = p_topic;
  if v_topic is null then raise exception 'topic not found'; end if;
  select coalesce(max(vol),0)+1 into v_next from episodes;
  insert into episodes (vol, title, intro, created_by)
    values (v_next, v_topic.title, v_topic.description, auth.uid())
    returning * into v_ep;
  update topics set status = 'confirmed' where id = p_topic;
  return v_ep;
end; $$;
```
확정 시 후보 목록에서는 `status='confirmed'`를 제외해 노출.

## 인증 흐름

- 상단 네비에 **로그인/로그아웃**. 로그인 = `supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo: <현재 사이트 URL>}})`.
- 세션은 supabase-js가 자동 관리. 페이지 로드 시 `getSession()`으로 로그인 상태·프로필·admin 여부 판단.
- 미로그인 시: 읽기는 되지만 작성/투표/수정/삭제 UI는 "로그인하고 참여하기"로 대체.

## 화면 변화

- **네비**: 로그인/로그아웃, (로그인 시) 프로필 링크, (admin 시) 권한 페이지 링크.
- **⋯ 더보기 메뉴**: 추천곡 카드·댓글·주제 카드·주제(에피소드) 헤더에서, 본인 글이거나 admin이면 우측에 `⋯` 버튼 → 드롭다운(수정/삭제). 바깥에 "주제 수정" 등 카피 노출하지 않음.
- **폼**: 닉네임 입력칸 제거(프로필 닉네임 자동). 로그인 필요.
- **다음 주제 페이지**: 후보 카드에 admin 전용 "확정" 버튼. 투표는 계정당 1표(하트 토글).
- **프로필 페이지**(`profile.html`): 닉네임 조회/수정.
- **권한 페이지**(`admin.html`, admin 전용): 회원(profiles) 목록 + admin 부여/해제 토글.
- 홈의 기존 공개 "+ 새 주제 만들기"는 제거(에피소드는 확정 흐름/admin으로만 생성). 일반 사용자는 다음 주제 후보 "제안"으로 참여.

## 파일 구성 변화

- `assets/config.js` — Supabase URL/anon key + supabase 클라이언트 생성(ESM import).
- `assets/data.js` — Supabase 비동기 API로 재작성. 함수는 Promise 반환:
  - auth: `getSession()`, `signInWithGoogle()`, `signOut()`, `getMyProfile()`, `updateMyNickname()`
  - episodes: `getEpisodes()`, `getEpisode(id|vol)`, `deleteEpisode(id)`
  - tracks: `getTracks(episodeId)`, `addTrack(...)`, `updateTrack(...)`, `deleteTrack(id)`
  - comments: `getComments(episodeId)`, `addComment(...)`, `deleteComment(id)`
  - topics: `getTopics()`(후보만), `addTopic(...)`, `updateTopic(...)`, `deleteTopic(id)`, `confirmTopic(id)`
  - votes: `getMyVotes()`, `toggleVote(topicId)`
  - admin: `listProfiles()`, `setAdmin(userId, bool)`
  - util: `escapeHtml()`, `currentUserCanEdit(row)`(본인 or admin)
- `assets/home.js` / `episode.js` / `topics.js` — async 렌더로 전환, ⋯메뉴·로그인 게이팅 반영.
- `assets/ui.js`(신규) — 네비 로그인 상태 렌더 + ⋯ 드롭다운 공통 컴포넌트.
- `profile.html` + `assets/profile.js`, `admin.html` + `assets/admin.js` — 신규.
- `assets/style.css` — ⋯메뉴/드롭다운, 로그인 버튼, 프로필·권한 페이지 스타일 추가.
- `db/schema.sql` — 위 스키마+트리거+RLS+RPC 전체(유나 님이 Supabase SQL 편집기에 붙여넣기).
- `db/seed.sql` — 기존 샘플 데이터 이관(선택). `created_by = null`(소유자 없음 → admin만 관리).

## 데이터 이관 / 시드

- 기존 코드 시드(주제 3개 + 추천곡·댓글, 후보 주제 3개)를 `db/seed.sql`로 옮겨 첫 화면이 비지 않게 한다. `created_by`는 null(=소유자 없음, admin만 수정/삭제).
- 시작을 비우고 싶으면 seed 실행을 생략하면 됨.
- 기존 방문자 브라우저의 localStorage 데이터는 이관하지 않음(개인 로컬 데이터였음).

## 유나 님이 직접 하실 수동 세팅 (구현 중/후 안내)

1. **Supabase 프로젝트 생성** → Project URL, anon public key 확보 → `assets/config.js`에 입력.
2. **Google Cloud OAuth 클라이언트** 발급(승인된 리다이렉트 URI에 Supabase 콜백 등록) → Supabase Auth의 Google provider에 Client ID/Secret 등록.
3. Supabase SQL 편집기에 `db/schema.sql` 실행(+선택적으로 `db/seed.sql`).
4. GitHub Pages 사이트 URL을 Supabase Auth의 Redirect URLs에 추가.
5. 유나 님 계정으로 **1회 로그인** 후, `update profiles set is_admin=true where id='<유나 uid>';` 실행(최초 admin 부여). 이후엔 권한 페이지에서 관리.

## 만드는 순서 (구현 플랜의 뼈대)

1. `db/schema.sql`(+seed) 작성 → 유나 님 적용
2. `config.js` + supabase 클라이언트 + 로그인/로그아웃 + 네비 상태 + 프로필 페이지(닉네임)
3. `data.js` 읽기 경로 Supabase 전환(홈/주제/다음주제 표시)
4. 쓰기 경로(추천곡/댓글/주제 추가) + 닉네임 자동
5. ⋯ 더보기 메뉴로 소유권 기반 수정/삭제(추천곡·댓글·주제·에피소드)
6. 투표(계정당 1표) 전환
7. admin 주제 확정(RPC) — 후보→에피소드 승격
8. 권한 페이지(admin) — 회원 목록 + admin 토글

## 검증 방법

프로토타입 수준 수동 검증 + 브라우저 관찰:
- 로그인/로그아웃 동작, 세션 유지
- 미로그인 시 작성/투표/수정 불가(UI 및 RLS 양쪽)
- A계정이 만든 글을 B계정이 수정/삭제 불가(⋯ 미노출 + RLS 거부), 본인은 가능
- admin은 타인 글 수정/삭제 가능, 주제 확정 시 새 주제 생성·On Air 반영, 후보에서 사라짐
- 투표 계정당 1표·취소, 프로필 닉네임 변경이 과거 글 표기에 반영
- 권한 페이지에서 admin 부여/해제가 실제 권한에 반영
- RLS 우회 시도(콘솔에서 남의 행 update)가 거부되는지 확인
