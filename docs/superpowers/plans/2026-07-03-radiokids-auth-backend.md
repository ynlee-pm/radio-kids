# 라디오키즈 로그인·권한 백엔드(Supabase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** localStorage 프로토타입 라디오키즈를 Google 로그인 + Supabase(Postgres·RLS) 기반 다중 사용자 앱으로 전환한다 — 본인 글만 수정/삭제(admin은 전부), 계정당 1표 투표, admin 전용 주제 확정, 권한/프로필 페이지.

**Architecture:** 정적 사이트(GitHub Pages 유지) + Supabase. 브라우저가 `@supabase/supabase-js`(ESM CDN)로 Supabase에 직접 통신하고, 권한은 RLS가 강제. 기존 `assets/data.js`(localStorage 동기)를 Supabase 비동기 API로 전면 교체하고, 페이지 스크립트를 async 렌더로 전환한다.

**Tech Stack:** HTML/CSS/바닐라 JS(ES modules), Supabase(Auth Google + Postgres + RLS + RPC), `@supabase/supabase-js@2` (esm.sh). 빌드 도구 없음.

## Global Constraints

- 호스팅은 GitHub Pages 유지(정적). 서버리스/자체 서버 없음.
- Supabase와 **브라우저 직접 통신 + anon public key**. anon 키는 공개 안전값이며 데이터 보호는 RLS가 담당.
- 권한: 추천곡·댓글·주제는 `created_by = auth.uid()` 본인만 수정/삭제, `is_admin()`이면 전부. 투표는 계정당 1표. 주제 확정은 admin 전용 RPC.
- 닉네임은 `profiles.nickname` (작성물은 `created_by` join으로 표기). 폼에 닉네임 입력칸 없음.
- 수정/삭제 UI는 "⋯ 더보기" 드롭다운 안에만. 본인 글이거나 admin일 때만 ⋯ 노출. 바깥에 "주제 수정" 등 카피 노출 금지.
- 팔레트/타이포 기존 유지: bg #FCFBF9, ink #121212, muted #9A9A96, hairline #E7E7E4, accent #C7724C / 제목 ZenSerif, 본문 Pretendard.
- 모든 사용자 문자열은 `escapeHtml`로 이스케이프. 외부 링크는 http(s)만 + `target=_blank rel="noopener noreferrer"`.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **환경 제약**: 라이브 검증(실제 Google 로그인·RLS)은 유나 님이 Supabase 프로젝트+OAuth를 세팅한 뒤에만 가능. Task 1 완료 직후 "수동 세팅 게이트"를 거친다. 그 전 태스크의 검증은 정적(문법·구조·API 사용 정확성)으로 하고, 라이브 체크리스트는 세팅 이후 수행한다.

## 수동 세팅 게이트 (Task 1 이후, 유나 님 수행 — 구현자는 안내만)

1. Supabase 프로젝트 생성 → Project URL + anon public key 확보.
2. Supabase SQL Editor에 `db/schema.sql` 실행. (선택) `db/seed.sql` 실행.
3. Google Cloud Console에서 OAuth 2.0 클라이언트 생성 → 승인된 리디렉션 URI에 `https://<프로젝트>.supabase.co/auth/v1/callback` 등록 → Client ID/Secret을 Supabase Auth의 Google provider에 입력·활성화.
4. Supabase Auth > URL Configuration의 Redirect URLs에 `https://ynlee-pm.github.io/radio-kids/` 추가.
5. `assets/config.js`에 URL/anon key 입력(Task 2).
6. 유나 님 계정으로 1회 로그인 후 SQL: `update profiles set is_admin = true where id = (select id from auth.users where email = 'yn.lee@teamsparta.co');`

## File Structure

- `db/schema.sql` — 테이블 6개 + 트리거(신규유저 프로필) + `is_admin()` + RLS 정책 + `confirm_topic()` RPC.
- `db/seed.sql` — 기존 샘플 데이터 이관(created_by null). 선택 실행.
- `docs/SUPABASE_SETUP.md` — 위 수동 세팅 게이트 상세 안내(스크린샷 대체 텍스트).
- `assets/config.js` — Supabase URL/anon key 상수 + `supabase` 클라이언트 export (ESM).
- `assets/data.js` — **전면 재작성**. Supabase 비동기 API(auth/episodes/tracks/comments/topics/votes/admin) + `escapeHtml` + `canEdit(row, me)`. ES module로 export.
- `assets/ui.js` — 공통: 네비 로그인 상태 렌더, ⋯ 드롭다운 컴포넌트, 현재 세션/프로필 캐시.
- `assets/home.js` / `assets/episode.js` / `assets/topics.js` — async 렌더로 전환, ⋯메뉴·로그인 게이팅 반영(ES module).
- `profile.html` + `assets/profile.js` — 닉네임 설정.
- `admin.html` + `assets/admin.js` — 권한 페이지(admin 전용).
- `index.html` / `episode.html` / `topics.html` — `<script type="module">`로 전환, config/data/ui/페이지 스크립트 로드.
- `assets/style.css` — ⋯드롭다운, 로그인 버튼, 프로필·권한 페이지, 로그인 안내 배너 스타일 추가.

> 참고: 스크립트는 ES module(`type="module"`)로 전환한다. 모듈 간 import로 의존(예: data.js가 config.js의 `supabase`를 import). 기존 IIFE 패턴은 모듈로 대체.

---

### Task 1: DB 스키마 · RLS · RPC · 시드 · 세팅 안내

Supabase에 붙여넣을 SQL과 세팅 문서를 만든다. 이 태스크의 산출물은 유나 님이 Supabase에 적용하는 소스다(코드 실행 아님).

**Files:**
- Create: `db/schema.sql`
- Create: `db/seed.sql`
- Create: `docs/SUPABASE_SETUP.md`

**Interfaces:**
- Produces: 테이블 `profiles(id,nickname,is_admin,created_at)`, `episodes(id,vol,title,intro,cover_color,created_by,created_at)`, `tracks(id,episode_id,artist,song,url,reason,created_by,created_at)`, `comments(id,episode_id,body,created_by,created_at)`, `topics(id,title,description,status,created_by,created_at)`, `votes(topic_id,user_id,created_at)`. 함수 `public.is_admin() -> boolean`, `public.confirm_topic(p_topic uuid) -> episodes`. 이후 모든 data.js 쿼리가 이 스키마에 의존.

- [ ] **Step 1: `db/schema.sql` 작성** — 아래 전체를 그대로.

```sql
-- ===== Tables =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create table episodes (
  id uuid primary key default gen_random_uuid(),
  vol int not null,
  title text not null,
  intro text not null default '',
  cover_color text default '#5B6B74',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
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
create table comments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  body text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'candidate',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table votes (
  topic_id uuid not null references topics(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

-- ===== New-user profile trigger =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===== admin helper =====
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ===== Prevent non-admin self-elevation on profiles =====
create or replace function public.guard_profile_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'only admin can change is_admin';
  end if;
  return new;
end; $$;
drop trigger if exists trg_guard_profile_admin on public.profiles;
create trigger trg_guard_profile_admin
  before update on public.profiles
  for each row execute procedure public.guard_profile_admin();

-- ===== confirm_topic RPC (admin only) =====
create or replace function public.confirm_topic(p_topic uuid)
returns episodes language plpgsql security definer set search_path = public as $$
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

-- ===== RLS =====
alter table profiles enable row level security;
alter table episodes enable row level security;
alter table tracks   enable row level security;
alter table comments enable row level security;
alter table topics   enable row level security;
alter table votes    enable row level security;

-- profiles: everyone reads; user updates own row (admin change guarded by trigger); admin updates anyone
create policy profiles_sel on profiles for select using (true);
create policy profiles_upd_own on profiles for update using (id = auth.uid());
create policy profiles_upd_admin on profiles for update using (public.is_admin());

-- episodes: everyone reads; only admin writes
create policy episodes_sel on episodes for select using (true);
create policy episodes_ins on episodes for insert with check (public.is_admin());
create policy episodes_upd on episodes for update using (public.is_admin());
create policy episodes_del on episodes for delete using (public.is_admin());

-- tracks
create policy tracks_sel on tracks for select using (true);
create policy tracks_ins on tracks for insert with check (auth.uid() = created_by);
create policy tracks_upd on tracks for update using (created_by = auth.uid() or public.is_admin());
create policy tracks_del on tracks for delete using (created_by = auth.uid() or public.is_admin());

-- comments
create policy comments_sel on comments for select using (true);
create policy comments_ins on comments for insert with check (auth.uid() = created_by);
create policy comments_upd on comments for update using (created_by = auth.uid() or public.is_admin());
create policy comments_del on comments for delete using (created_by = auth.uid() or public.is_admin());

-- topics (status flips to 'confirmed' only via confirm_topic RPC, which is security definer)
create policy topics_sel on topics for select using (true);
create policy topics_ins on topics for insert with check (auth.uid() = created_by);
create policy topics_upd on topics for update using (created_by = auth.uid() or public.is_admin());
create policy topics_del on topics for delete using (created_by = auth.uid() or public.is_admin());

-- votes
create policy votes_sel on votes for select using (true);
create policy votes_ins on votes for insert with check (user_id = auth.uid());
create policy votes_del on votes for delete using (user_id = auth.uid());
```

- [ ] **Step 2: `db/seed.sql` 작성** — 기존 샘플 데이터 이관(소유자 없음). 실행은 선택.

```sql
-- Optional seed. created_by는 null(=admin만 관리). Run once after schema.
with e12 as (
  insert into episodes (vol, title, intro, cover_color)
  values (12, '비 오는 날의 창가에서', '창밖으로 빗소리가 번지는 오후. 각자의 방에서 같은 비를 듣는 우리가 고른, 조금 젖은 노래들.', '#5B6B74')
  returning id
)
insert into tracks (episode_id, artist, song, reason, url)
select id, x.artist, x.song, x.reason, x.url from e12, (values
  ('Nujabes','Feather','빗소리랑 제일 잘 어울려요','https://www.youtube.com/results?search_query=Nujabes+Feather'),
  ('김사월','봄눈','창가에 앉아 듣기 좋은','https://www.youtube.com/results?search_query=김사월+봄눈'),
  ('Bill Evans','Peace Piece','비 오면 자동재생됨','https://www.youtube.com/results?search_query=Bill+Evans+Peace+Piece')
) as x(artist,song,reason,url);

insert into episodes (vol, title, intro, cover_color) values
 (11, '첫차의 온도', '아무도 없는 새벽 정류장, 첫차를 기다리며 듣고 싶은 노래.', '#7A6A55'),
 (10, '늦여름 밤 산책', '더위가 한풀 꺾인 밤, 이어폰 한 쪽만 꽂고 걷고 싶은.', '#4E5A4A');

insert into topics (title, description) values
 ('출근길 BGM', '지하철·버스에서 하루를 여는 노래'),
 ('울고 싶은 밤', '펑펑 울어도 되는, 위로가 되는 곡'),
 ('여름의 끝', '8월 말의 그 아쉬운 공기');
```

- [ ] **Step 3: `docs/SUPABASE_SETUP.md` 작성** — 위 "수동 세팅 게이트" 6단계를 순서대로, 각 단계에서 클릭할 메뉴 경로와 붙여넣을 값(리디렉션 URI 형식, admin 부여 SQL)을 명시한 안내 문서로 작성.

- [ ] **Step 4: 정적 검증** — SQL 문법 자체 점검(테이블 6개·정책·함수·트리거 존재, 컬럼명이 spec과 일치). 라이브 적용은 유나 님이 수행.

Run: `grep -c "create policy" db/schema.sql`
Expected: `22` (정책 22개)

- [ ] **Step 5: 커밋**

```bash
git add db docs/SUPABASE_SETUP.md
git commit -m "feat(db): supabase schema, RLS, confirm_topic RPC, seed, setup guide

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Supabase 클라이언트 · 로그인/로그아웃 · 네비 상태 · 프로필 페이지

로그인 인프라를 세운다. 이후 모든 태스크가 세션/프로필/네비에 의존한다.

**Files:**
- Create: `assets/config.js`
- Modify: `assets/data.js` (auth/profile 함수 추가 — 이 태스크에선 auth 부분만; 데이터 쿼리는 Task 3에서)
- Create: `assets/ui.js`
- Create: `profile.html`, `assets/profile.js`
- Modify: `index.html`, `episode.html`, `topics.html` (module script 로딩 + ui 네비 마운트)
- Modify: `assets/style.css` (로그인 버튼/네비 유저영역/프로필 폼)

**Interfaces:**
- Consumes: Task 1 스키마(profiles), 유나 님 세팅(config 값).
- Produces (data.js): `supabase`(재-export), `getSession() -> Promise<Session|null>`, `signInWithGoogle() -> Promise<void>`, `signOut() -> Promise<void>`, `getMyProfile() -> Promise<{id,nickname,is_admin}|null>`, `updateMyNickname(nickname) -> Promise<void>`. (ui.js): `mountNav(rootSelector) -> Promise<void>`(네비의 로그인/프로필/권한 링크 렌더), `getMe() -> Promise<{session,profile}>`(세션+프로필 캐시). 이후 태스크가 `getMe()`로 로그인/ admin 여부 판단.

- [ ] **Step 1: `assets/config.js`** — Supabase 클라이언트 생성. URL/anon key는 유나 님 세팅값으로 교체(플레이스홀더 명시).

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// 유나 님 Supabase 프로젝트 값으로 교체하세요 (공개 anon key — 노출돼도 안전, RLS가 보호).
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- [ ] **Step 2: `assets/data.js` auth 파트** — 파일을 ES module로 재작성 시작. 이 태스크에선 auth/profile + `escapeHtml`만. (Task 3에서 데이터 쿼리 추가)

```js
import { supabase } from "./config.js";

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
}
export async function signOut() { await supabase.auth.signOut(); }

export async function getMyProfile() {
  const s = await getSession();
  if (!s) return null;
  const { data } = await supabase.from("profiles").select("id,nickname,is_admin").eq("id", s.user.id).single();
  return data || null;
}
export async function updateMyNickname(nickname) {
  const s = await getSession();
  if (!s) throw new Error("not logged in");
  const { error } = await supabase.from("profiles").update({ nickname: nickname }).eq("id", s.user.id);
  if (error) throw error;
}

export function canEdit(row, me) {
  if (!me || !me.profile) return false;
  return row.created_by === me.profile.id || me.profile.is_admin === true;
}
```

- [ ] **Step 3: `assets/ui.js`** — 세션+프로필 캐시 + 네비 렌더.

```js
import { getSession, getMyProfile, signInWithGoogle, signOut, escapeHtml } from "./data.js";

let _me = null, _loaded = false;
export async function getMe() {
  if (_loaded) return _me;
  const session = await getSession();
  const profile = session ? await getMyProfile() : null;
  _me = { session, profile }; _loaded = true;
  return _me;
}

export async function mountNav(linksSelector) {
  const el = document.querySelector(linksSelector);
  if (!el) return;
  const me = await getMe();
  var html = '<a href="index.html">홈</a><a href="topics.html">다음 주제 정하기</a>';
  if (me.session) {
    html += '<a href="profile.html">' + escapeHtml(me.profile ? me.profile.nickname : "프로필") + '</a>';
    if (me.profile && me.profile.is_admin) html += '<a href="admin.html">권한</a>';
    html += '<button class="nav-auth" id="nav-signout">로그아웃</button>';
  } else {
    html += '<button class="nav-auth" id="nav-signin">Google 로그인</button>';
  }
  el.innerHTML = html;
  var so = document.getElementById("nav-signout");
  if (so) so.addEventListener("click", async function () { await signOut(); location.reload(); });
  var si = document.getElementById("nav-signin");
  if (si) si.addEventListener("click", function () { signInWithGoogle(); });
}
```

- [ ] **Step 4: `index.html`/`episode.html`/`topics.html` 스크립트 전환** — 각 파일 하단 스크립트를 module로 교체. 예(index.html):

```html
  <script type="module" src="assets/home.js"></script>
```
그리고 `home.js`/`episode.js`/`topics.js` 상단에서 `import { mountNav } from "./ui.js";` 후 렌더 시작 시 `await mountNav(".site-nav .links");` 호출(각 페이지 Task에서 반영). 이 태스크에선 최소한 세 페이지가 module 로딩되고 네비가 로그인 상태를 표시하도록 각 페이지 스크립트 진입부에 `mountNav` 호출을 추가한다. (config.js는 data.js가 import하므로 별도 로드 불필요.)

- [ ] **Step 5: `profile.html` + `assets/profile.js`** — 닉네임 조회/수정. profile.html은 episode.html의 head/nav 구조를 그대로 따르고 `<main id="profile">` + `<script type="module" src="assets/profile.js">`.

```js
import { mountNav, getMe } from "./ui.js";
import { updateMyNickname, escapeHtml } from "./data.js";

const root = document.getElementById("profile");
(async function () {
  await mountNav(".site-nav .links");
  const me = await getMe();
  if (!me.session) {
    root.innerHTML = '<p style="margin:60px 0;">로그인하면 프로필을 설정할 수 있어요. <button class="btn" id="p-signin">Google 로그인</button></p>';
    document.getElementById("p-signin").addEventListener("click", function(){ import("./data.js").then(m=>m.signInWithGoogle()); });
    return;
  }
  root.innerHTML =
    '<div class="ep-head"><span class="kicker">프로필</span><h1 class="display ep-title">내 닉네임</h1></div>' +
    '<form class="form" id="profile-form">' +
      '<div class="row"><input name="nickname" value="' + escapeHtml(me.profile.nickname) + '" placeholder="닉네임" required /></div>' +
      '<button class="btn" type="submit">저장</button>' +
    '</form><p id="p-msg" style="color:var(--muted);margin-top:12px;"></p>';
  document.getElementById("profile-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    await updateMyNickname(e.target.nickname.value.trim());
    document.getElementById("p-msg").textContent = "저장됐어요.";
  });
})();
```

- [ ] **Step 6: `assets/style.css`** — 네비 버튼/프로필 스타일 추가.

```css
.nav-auth { font-family: inherit; font-size: 13px; cursor: pointer; background: none; border: 0; color: var(--ink); padding: 0; }
.nav-auth:hover { color: var(--accent); }
```

- [ ] **Step 7: 정적 검증** — 세 페이지가 module로 로드되고 콘솔 에러 없이 네비가 렌더되는지(미로그인 상태: "Google 로그인" 버튼 표시). config에 실제 값이 없으면 Supabase 호출은 실패할 수 있으나, 네비 렌더 자체는 되어야 함(에러는 콘솔에만).

Run(로컬): `python3 -m http.server 8080` 후 `http://localhost:8080/` — 네비에 "Google 로그인" 버튼 노출 확인. (실제 로그인은 세팅 이후 라이브 검증.)

- [ ] **Step 8: 커밋**

```bash
git add assets/config.js assets/data.js assets/ui.js profile.html assets/profile.js assets/style.css index.html episode.html topics.html
git commit -m "feat(auth): supabase client, google login/logout, nav state, profile page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 읽기 경로 — 데이터 계층 쿼리 + 홈/주제/다음주제 표시

Supabase에서 읽어와 세 페이지를 렌더한다(표시만; 쓰기/수정/투표 UI는 이후 태스크). 닉네임은 join으로 표기.

**Files:**
- Modify: `assets/data.js` (읽기 쿼리 추가)
- Modify: `assets/home.js`, `assets/episode.js`, `assets/topics.js` (async 렌더로 전환)

**Interfaces:**
- Consumes: Task 2(`getMe`, `escapeHtml`, `supabase`).
- Produces (data.js):
  - `getEpisodes() -> Promise<Episode[]>` (vol desc). Episode = `{id,vol,title,intro,created_by,created_at}`
  - `getEpisodeByVol(vol) -> Promise<Episode|null>`
  - `getTracks(episodeId) -> Promise<Track[]>` (created_at asc). Track = `{id,episode_id,artist,song,url,reason,created_by, author}` — `author`=닉네임 문자열
  - `getComments(episodeId) -> Promise<Comment[]>` (created_at asc). Comment = `{id,episode_id,body,created_by,created_at, author}`
  - `getTopics() -> Promise<Topic[]>` (status='candidate', vote count desc). Topic = `{id,title,description,created_by, author, votes}`
  이후 write/edit/vote 태스크가 이 read 함수로 재렌더.

- [ ] **Step 1: data.js 읽기 함수 추가** — join으로 author 닉네임과 votes 수 포함.

```js
export async function getEpisodes() {
  const { data, error } = await supabase.from("episodes")
    .select("id,vol,title,intro,created_by,created_at").order("vol", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getEpisodeByVol(vol) {
  const { data } = await supabase.from("episodes")
    .select("id,vol,title,intro,created_by,created_at").eq("vol", Number(vol)).maybeSingle();
  return data || null;
}
export async function getTracks(episodeId) {
  const { data, error } = await supabase.from("tracks")
    .select("id,episode_id,artist,song,url,reason,created_by,created_at, profiles:created_by(nickname)")
    .eq("episode_id", episodeId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(function (t) { t.author = t.profiles ? t.profiles.nickname : "익명"; return t; });
}
export async function getComments(episodeId) {
  const { data, error } = await supabase.from("comments")
    .select("id,episode_id,body,created_by,created_at, profiles:created_by(nickname)")
    .eq("episode_id", episodeId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(function (c) { c.author = c.profiles ? c.profiles.nickname : "익명"; return c; });
}
export async function getTopics() {
  const { data, error } = await supabase.from("topics")
    .select("id,title,description,created_by,created_at, profiles:created_by(nickname), votes(count)")
    .eq("status", "candidate");
  if (error) throw error;
  var list = (data || []).map(function (t) {
    t.author = t.profiles ? t.profiles.nickname : "익명";
    t.votes = (t.votes && t.votes[0]) ? t.votes[0].count : 0;
    return t;
  });
  list.sort(function (a, b) { return b.votes - a.votes; });
  return list;
}
```

- [ ] **Step 2: `home.js` async 전환** — 기존 렌더 로직을 async 함수로 감싸고, 상단에서 `mountNav`. On Air = getEpisodes()[0]. hero 추천곡은 `getTracks(current.id)`의 앞 3개(곡명 — 가수). 아카이브 = 나머지. 티저 = getTopics()[0]. **홈의 공개 "+ 새 주제 만들기"는 제거**(에피소드는 확정 흐름으로만 생성). 빈 상태(에피소드 0개) 가드 유지. 표시 로직/마크업은 기존 `home.js` 구조를 그대로 따르되 데이터 소스만 async 함수로 교체.

핵심 골격:
```js
import { mountNav } from "./ui.js";
import { getEpisodes, getTracks, getTopics, escapeHtml } from "./data.js";
(async function () {
  await mountNav(".site-nav .links");
  const episodes = await getEpisodes();
  const current = episodes[0], past = episodes.slice(1);
  const tracks = current ? await getTracks(current.id) : [];
  // ... 기존 hero/archive/teaser 마크업을 current/past/tracks/topics로 렌더 (링크는 episode.html?vol=<vol>) ...
})();
```

- [ ] **Step 3: `episode.js` 읽기 전환** — `getEpisodeByVol(vol)` → 없으면 "주제를 찾을 수 없어요". `getTracks(ep.id)`, `getComments(ep.id)` 렌더. 추천곡 카드는 기존 마크업(곡명/가수/닉네임=author/추천이유/듣기버튼) 유지하되 `t.by`→`t.author`, `t.song`/`t.artist` 사용. 댓글은 `c.author`+`c.body`. 폼/수정삭제/투표는 이후 태스크(이 태스크에선 표시만, 폼은 잠시 숨기거나 로그인 안내로 둠).

- [ ] **Step 4: `topics.js` 읽기 전환** — `getTopics()` 렌더(제목/설명/author 제안/votes 수). 하트/제안 폼/수정삭제는 이후 태스크. 이 태스크에선 표시만.

- [ ] **Step 5: 정적/로컬 검증** — 세 페이지가 콘솔 에러 없이 로드되고, (라이브 세팅 완료 시) 시드 데이터가 표시되는지. 세팅 전이면 빈 목록/에러는 콘솔에만 남고 레이아웃은 유지되어야 함.

- [ ] **Step 6: 커밋**
```bash
git add assets/data.js assets/home.js assets/episode.js assets/topics.js
git commit -m "feat(read): supabase-backed read path for home/episode/topics

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 쓰기 경로 — 추천곡/댓글/주제 추가 (로그인 게이팅, 닉네임 자동)

로그인 사용자가 추천곡·댓글·주제를 추가한다. 닉네임 입력칸 없음(프로필 닉네임 자동). 미로그인 시 폼 대신 로그인 안내.

**Files:** Modify: `assets/data.js`, `assets/episode.js`, `assets/topics.js`

**Interfaces:**
- Consumes: Task 2/3.
- Produces (data.js): `addTrack(episodeId, {artist,song,url,reason}) -> Promise`, `addComment(episodeId, {body}) -> Promise`, `addTopic({title,description}) -> Promise`. 모두 내부에서 `created_by = auth.uid()` 세팅.

- [ ] **Step 1: data.js 쓰기 함수**
```js
async function myId() { const s = await getSession(); if (!s) throw new Error("로그인이 필요해요"); return s.user.id; }
export async function addTrack(episodeId, t) {
  const uid = await myId();
  const { error } = await supabase.from("tracks").insert({
    episode_id: episodeId, artist: t.artist, song: t.song, url: t.url || "", reason: t.reason, created_by: uid });
  if (error) throw error;
}
export async function addComment(episodeId, c) {
  const uid = await myId();
  const { error } = await supabase.from("comments").insert({ episode_id: episodeId, body: c.body, created_by: uid });
  if (error) throw error;
}
export async function addTopic(t) {
  const uid = await myId();
  const { error } = await supabase.from("topics").insert({ title: t.title, description: t.description, created_by: uid });
  if (error) throw error;
}
```
(주의: `getSession`을 data.js 내부에서 쓰므로 같은 모듈에 이미 정의돼 있어야 함 — Task 2에서 정의됨.)

- [ ] **Step 2: episode.js 폼** — 로그인 시에만 추천곡 폼(가수/곡명/유튜브링크/추천이유 — 닉네임칸 없음)과 댓글 폼(내용만) 노출. 미로그인 시 "로그인하고 참여하기" 버튼. 제출 → `addTrack`/`addComment` → 다시 데이터 로드 후 재렌더. `me = await getMe()`로 분기.

- [ ] **Step 3: topics.js 제안 폼** — 로그인 시 제안 폼(제목/설명 — 제안자칸 없음). 제출 → `addTopic` → 재렌더. 미로그인 시 로그인 안내.

- [ ] **Step 4: 정적 검증** — 폼 마크업에 닉네임/제안자 입력칸이 없는지, 미로그인 시 폼 대신 안내가 뜨는지(로컬, 세션 없음 상태).

- [ ] **Step 5: 커밋**
```bash
git add assets/data.js assets/episode.js assets/topics.js
git commit -m "feat(write): add track/comment/topic with login gating and profile nickname

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: ⋯ 더보기 메뉴 — 소유권 기반 수정/삭제

추천곡·댓글·주제(후보)·주제(에피소드)에서, 본인 글이거나 admin이면 우측에 `⋯` → 드롭다운(수정/삭제). 바깥에 카피 노출 금지.

**Files:** Modify: `assets/data.js`, `assets/ui.js`, `assets/style.css`, `assets/episode.js`, `assets/topics.js`

**Interfaces:**
- Consumes: Task 2(`canEdit`), Task 3/4.
- Produces (data.js): `updateTrack(id,{artist,song,url,reason})`, `deleteTrack(id)`, `deleteComment(id)`, `updateTopic(id,{title,description})`, `deleteTopic(id)`, `updateEpisode(id,{title,intro})`, `deleteEpisode(id)` — 모두 Promise, RLS가 권한 강제(실패 시 throw). (ui.js): `attachMenu(buttonEl, items)` — `items`=`[{label, onClick}]`로 드롭다운 생성/토글.

- [ ] **Step 1: data.js update/delete 함수**
```js
export async function updateTrack(id, f) { const { error } = await supabase.from("tracks").update(f).eq("id", id); if (error) throw error; }
export async function deleteTrack(id) { const { error } = await supabase.from("tracks").delete().eq("id", id); if (error) throw error; }
export async function deleteComment(id) { const { error } = await supabase.from("comments").delete().eq("id", id); if (error) throw error; }
export async function updateTopic(id, f) { const { error } = await supabase.from("topics").update(f).eq("id", id); if (error) throw error; }
export async function deleteTopic(id) { const { error } = await supabase.from("topics").delete().eq("id", id); if (error) throw error; }
export async function updateEpisode(id, f) { const { error } = await supabase.from("episodes").update(f).eq("id", id); if (error) throw error; }
export async function deleteEpisode(id) { const { error } = await supabase.from("episodes").delete().eq("id", id); if (error) throw error; }
```

- [ ] **Step 2: ui.js `attachMenu`** — 접근성 있는 작은 드롭다운.
```js
export function attachMenu(btn, items) {
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    closeAllMenus();
    var menu = document.createElement("div");
    menu.className = "menu-pop";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.className = "menu-item"; b.textContent = it.label;
      b.addEventListener("click", function (ev) { ev.stopPropagation(); closeAllMenus(); it.onClick(); });
      menu.appendChild(b);
    });
    btn.parentNode.appendChild(menu);
  });
}
function closeAllMenus() { Array.prototype.forEach.call(document.querySelectorAll(".menu-pop"), function (m) { m.remove(); }); }
document.addEventListener("click", closeAllMenus);
```

- [ ] **Step 3: style.css 드롭다운**
```css
.menu-wrap { position: relative; }
.menu-btn { background: none; border: 0; cursor: pointer; color: var(--muted); font-size: 18px; line-height: 1; padding: 0 4px; }
.menu-btn:hover { color: var(--ink); }
.menu-pop { position: absolute; right: 0; top: 100%; background: #fff; border: 1px solid var(--hair); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.08); padding: 6px; z-index: 20; min-width: 96px; }
.menu-item { display: block; width: 100%; text-align: left; background: none; border: 0; cursor: pointer; font-family: inherit; font-size: 13px; color: var(--ink); padding: 8px 10px; border-radius: 6px; }
.menu-item:hover { background: var(--bg); color: var(--accent); }
```

- [ ] **Step 4: episode.js ⋯ 적용** — 각 추천곡 카드/각 댓글/주제 헤더에서 `canEdit(row, me)`가 true면 `⋯` 버튼(`.menu-btn`) 렌더 후 `attachMenu`로 수정/삭제 연결. 수정=인라인 편집 폼(기존 인라인 편집 패턴), 삭제=`confirm()` 후 delete + 재렌더. 기존의 바깥 "수정/삭제" 텍스트·"주제 수정/주제 삭제" 링크는 제거.

- [ ] **Step 5: topics.js ⋯ 적용** — 후보 카드에서 `canEdit`면 `⋯` → 수정(인라인)/삭제.

- [ ] **Step 6: 정적 검증** — 미로그인/타인 글에는 `⋯`가 렌더되지 않는지(canEdit=false), 본인/admin일 때만 노출. (라이브에서 A/B 계정 교차 검증은 세팅 후.)

- [ ] **Step 7: 커밋**
```bash
git add assets/data.js assets/ui.js assets/style.css assets/episode.js assets/topics.js
git commit -m "feat(manage): ⋯ menu with ownership/admin-gated edit and delete

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 투표 — 계정당 1표(토글)

localStorage 꼼수를 없애고 votes 테이블 기반으로 전환. 로그인 사용자가 하트로 토글.

**Files:** Modify: `assets/data.js`, `assets/topics.js`

**Interfaces:**
- Consumes: Task 3(getTopics votes 수).
- Produces (data.js): `getMyVotes() -> Promise<Set<topicId>>`, `toggleVote(topicId) -> Promise`.

- [ ] **Step 1: data.js 투표 함수**
```js
export async function getMyVotes() {
  const s = await getSession(); if (!s) return new Set();
  const { data } = await supabase.from("votes").select("topic_id").eq("user_id", s.user.id);
  return new Set((data || []).map(function (v) { return v.topic_id; }));
}
export async function toggleVote(topicId) {
  const s = await getSession(); if (!s) throw new Error("로그인이 필요해요");
  const uid = s.user.id;
  const { data } = await supabase.from("votes").select("topic_id").eq("user_id", uid).eq("topic_id", topicId).maybeSingle();
  if (data) { await supabase.from("votes").delete().eq("user_id", uid).eq("topic_id", topicId); }
  else { await supabase.from("votes").insert({ user_id: uid, topic_id: topicId }); }
}
```

- [ ] **Step 2: topics.js 투표 연결** — 렌더 시 `getMyVotes()`로 내가 누른 것 채움(♥/♡). 하트 클릭 → 로그인 필요 시 안내, 아니면 `toggleVote` → 재렌더(정렬 갱신). 기존 `radioclub.voted` localStorage 로직 제거.

- [ ] **Step 3: 정적 검증** — 미로그인 시 하트 클릭이 로그인 안내로 이어지는지. (계정당 1표 라이브 검증은 세팅 후.)

- [ ] **Step 4: 커밋**
```bash
git add assets/data.js assets/topics.js
git commit -m "feat(vote): per-account voting via votes table (toggle)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 주제 확정 — admin 전용 (후보→에피소드 승격)

admin이 후보 주제에서 "확정"을 누르면 `confirm_topic` RPC로 새 주제(에피소드)가 생성되고 후보에서 사라진다.

**Files:** Modify: `assets/data.js`, `assets/topics.js`

**Interfaces:**
- Consumes: Task 1(RPC), Task 2(getMe).
- Produces (data.js): `confirmTopic(topicId) -> Promise<Episode>`.

- [ ] **Step 1: data.js**
```js
export async function confirmTopic(topicId) {
  const { data, error } = await supabase.rpc("confirm_topic", { p_topic: topicId });
  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: topics.js 확정 버튼** — `me.profile.is_admin`일 때만 각 후보 카드에 "확정" 버튼. 클릭 → `confirm()` → `confirmTopic(id)` → 재렌더(후보에서 제거됨). 성공 안내(예: "'{제목}'이(가) 새 주제가 됐어요"). 비-admin에겐 버튼 미노출.

- [ ] **Step 3: 정적 검증** — 비-admin/미로그인에는 확정 버튼이 없는지. (승격→홈 On Air 반영은 라이브 세팅 후 검증.)

- [ ] **Step 4: 커밋**
```bash
git add assets/data.js assets/topics.js
git commit -m "feat(admin): confirm topic -> promote to new episode (admin only)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 권한 페이지 — admin 전용

admin이 회원 목록을 보고 admin 권한을 부여/해제한다.

**Files:** Create: `admin.html`, `assets/admin.js`. Modify: `assets/data.js`.

**Interfaces:**
- Consumes: Task 2(getMe), profiles 테이블.
- Produces (data.js): `listProfiles() -> Promise<Profile[]>` (`{id,nickname,is_admin}`), `setAdmin(userId, isAdmin) -> Promise`.

- [ ] **Step 1: data.js**
```js
export async function listProfiles() {
  const { data, error } = await supabase.from("profiles").select("id,nickname,is_admin").order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function setAdmin(userId, isAdmin) {
  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  if (error) throw error;
}
```

- [ ] **Step 2: `admin.html`** — episode.html 구조 따라 `<main id="admin">` + `<script type="module" src="assets/admin.js">`.

- [ ] **Step 3: `assets/admin.js`** — 비-admin/미로그인 접근 시 "권한 없음" + 홈 링크. admin이면 회원 목록(닉네임 + admin 여부 + "admin 부여/해제" 토글 버튼). 토글 → `setAdmin` → 재렌더. 자기 자신 해제 방지(마지막 admin 잠김 방지 위해 최소한 본인 토글 시 confirm 경고).

```js
import { mountNav, getMe } from "./ui.js";
import { listProfiles, setAdmin, escapeHtml } from "./data.js";
const root = document.getElementById("admin");
(async function () {
  await mountNav(".site-nav .links");
  const me = await getMe();
  if (!me.profile || !me.profile.is_admin) {
    root.innerHTML = '<p style="margin:60px 0;">권한이 없어요. <a class="back-link" href="index.html">홈으로</a></p>'; return;
  }
  async function render() {
    const ps = await listProfiles();
    root.innerHTML = '<div class="ep-head"><span class="kicker">admin</span><h1 class="display ep-title">권한 관리</h1></div>' +
      ps.map(function (p) {
        return '<div class="rec-foot" style="border-top:1px solid var(--hair);padding:14px 0;">' +
          '<span class="rec-by">' + (p.is_admin ? "admin" : "member") + '</span>' +
          '<span class="rec-reason">' + escapeHtml(p.nickname) + '</span>' +
          '<button class="mini-act" data-id="' + escapeHtml(p.id) + '" data-to="' + (p.is_admin ? "0" : "1") + '" style="margin-left:auto;">' +
            (p.is_admin ? "admin 해제" : "admin 부여") + '</button>' +
        '</div>';
      }).join("");
    Array.prototype.forEach.call(root.querySelectorAll("[data-id]"), function (b) {
      b.addEventListener("click", async function () {
        var to = b.getAttribute("data-to") === "1";
        if (!to && b.getAttribute("data-id") === me.profile.id && !confirm("본인 admin 권한을 해제할까요?")) return;
        await setAdmin(b.getAttribute("data-id"), to); await render();
      });
    });
  }
  await render();
})();
```

- [ ] **Step 4: 정적 검증** — 비-admin 접근 시 "권한 없음" 렌더. (부여/해제 반영은 라이브 세팅 후.)

- [ ] **Step 5: 커밋**
```bash
git add admin.html assets/admin.js assets/data.js
git commit -m "feat(admin): permissions page — grant/revoke admin

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 라이브 검증 체크리스트 (유나 님 Supabase 세팅 완료 후, 함께 수행)

배포 후 실제 계정으로:
- [ ] Google 로그인/로그아웃, 새로고침 후 세션 유지
- [ ] 미로그인: 읽기 O, 작성/투표/⋯메뉴 X (UI + RLS 양쪽)
- [ ] 로그인 A가 추천곡/댓글/주제 작성 → 닉네임(프로필) 자동 표기
- [ ] A의 글에 A는 ⋯(수정/삭제) 보임, B는 안 보임. B가 콘솔로 A의 행 update 시도 → RLS 거부
- [ ] admin(유나): 타인 글 수정/삭제 가능, 후보 "확정" → 새 주제 생성·홈 On Air·후보에서 사라짐
- [ ] 투표 계정당 1표·취소, 정렬 갱신
- [ ] 프로필 닉네임 변경 → 과거 작성물 표기 반영
- [ ] 권한 페이지에서 B에게 admin 부여 → B에게 admin 기능 노출
- [ ] main push 후 GitHub Pages 재배포 반영

## 완료 기준

- 로그인 기반으로 작성/수정/삭제/투표/확정/권한관리가 동작하고, RLS가 권한을 강제한다.
- 닉네임은 프로필 기반 자동 표기, 수정/삭제는 ⋯ 메뉴 안에만.
- 기존 감성(ZenSerif/에디토리얼 모노) 유지, 반응형 유지.
