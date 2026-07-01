# 라디오 만드는 밤 — 소모임 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라디오 소모임이 회차마다 주제를 정하고, 음악을 추천하고, 서로 논의하는 감성 프로토타입 웹사이트를 빌드 없는 정적 사이트로 만든다.

**Architecture:** 3개의 정적 HTML 페이지(홈·회차 상세·다음 주제)가 공통 CSS와 페이지별 바닐라 JS로 렌더된다. 데이터는 `assets/data.js`가 시드(seed) + `localStorage`로 관리하고, 각 페이지 스크립트는 그 데이터를 읽어 DOM을 그리고 폼/투표 이벤트를 처리한다. 서버·빌드·프레임워크 없음.

**Tech Stack:** HTML5, CSS3(커스텀 프로퍼티), 바닐라 JavaScript(ES2015+), `localStorage`. 폰트: GraceSerif 2.0(self-host .otf, 제목) + Pretendard(CDN, 본문).

## Global Constraints

- 성격: **감성 프로토타입**. 서버·DB·로그인·실제 음원 재생 없음. 상태는 `localStorage` 키 `radioclub.v1` 하나에 저장.
- 비주얼: **에디토리얼 모노**. 팔레트 — 배경 `#FCFBF9`, 본문 `#121212`, 흐린 텍스트 `#9A9A96`, 헤어라인 `#E7E7E4`, 포인트 `#C7724C`. 색은 최소한.
- 타이포: 제목 = **GraceSerif 2.0**(`assets/fonts/`에 self-host), 본문·UI = **Pretendard**(CDN). 제목은 크고 우아하게, 본문은 담백하게. 여백 넉넉히, 선은 얇게, 군더더기 없음.
- 구조: **회차/에피소드 중심**. 각 회차 = `{ vol, title, intro, coverColor, tracks[], comments[] }`.
- 폰트 원본: `/Users/teamsparta/Documents/AX-workflow/GraceSerif2.0/GraceSerif2.0-{Regular,Bold}.otf`.
- 검증: 로컬 정적 서버 `python3 -m http.server 8080`(프로젝트 루트에서 실행) + 브라우저 관찰. 자동화 테스트는 두지 않는다.
- 반응형: 모바일 폭(≤640px)에서 hero 세로 스택, 폰트 축소, 레이아웃 깨지지 않게.
- 커밋: 각 Task 끝에 커밋. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## File Structure

- `index.html` — 홈(온에어 데스크). data.js + home.js 로드.
- `episode.html` — 회차 상세(`?vol=N`). data.js + episode.js 로드.
- `topics.html` — 다음 주제 정하기. data.js + topics.js 로드.
- `assets/fonts/GraceSerif2.0-Regular.otf`, `assets/fonts/GraceSerif2.0-Bold.otf` — self-host 폰트.
- `assets/style.css` — 공통 스타일(팔레트 변수, @font-face, 타이포, 네비, 폼, 카드, 반응형).
- `assets/data.js` — 시드 데이터 + localStorage 헬퍼(순수 데이터 계층, DOM 접근 없음).
- `assets/home.js` — 홈 렌더.
- `assets/episode.js` — 회차 상세 렌더 + 곡 추천 폼 + 댓글 폼.
- `assets/topics.js` — 주제 목록 렌더 + 투표 + 제안 폼.

> 설계 스펙은 단일 `app.js`를 언급했으나, 페이지별 파일로 분리하면 각 파일이 하나의 책임만 갖고 Task 경계가 깔끔해진다. data.js는 공통 데이터 계층으로 유지.

각 페이지 스크립트가 공통으로 쓰는 아주 작은 유틸(`escapeHtml`)은 `data.js`에 함께 둔다(별도 파일 만들 만큼 크지 않음).

---

### Task 1: 프로젝트 뼈대 — 폰트, 팔레트, 타이포, 공통 네비

세 페이지가 공유할 시각 기반(폰트 self-host, 팔레트 변수, 타이포, 상단 네비)을 세운다. 이 Task 끝나면 빈 페이지라도 GraceSerif 제목 + Pretendard 본문 + 올바른 색이 보인다.

**Files:**
- Create: `assets/fonts/GraceSerif2.0-Regular.otf` (복사)
- Create: `assets/fonts/GraceSerif2.0-Bold.otf` (복사)
- Create: `assets/style.css`
- Create: `index.html` (뼈대만 — 이후 Task 3에서 채움)

**Interfaces:**
- Produces: CSS 커스텀 프로퍼티 `--bg, --ink, --muted, --hair, --accent`; 폰트 패밀리 `"GraceSerif"`(제목), `"Pretendard"`(본문); 공통 클래스 `.site-nav`, `.wrap`, `.kicker`, `.display`, `.hairline`. 이후 모든 페이지가 이 클래스와 변수를 사용.

- [ ] **Step 1: 폰트 파일 복사**

```bash
mkdir -p assets/fonts
cp "/Users/teamsparta/Documents/AX-workflow/GraceSerif2.0/GraceSerif2.0-Regular.otf" assets/fonts/
cp "/Users/teamsparta/Documents/AX-workflow/GraceSerif2.0/GraceSerif2.0-Bold.otf" assets/fonts/
ls assets/fonts/
```

Expected: 두 개의 `.otf` 파일이 나열됨.

- [ ] **Step 2: `assets/style.css` 작성**

```css
/* ===== Fonts ===== */
@font-face {
  font-family: "GraceSerif";
  src: url("fonts/GraceSerif2.0-Regular.otf") format("opentype");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "GraceSerif";
  src: url("fonts/GraceSerif2.0-Bold.otf") format("opentype");
  font-weight: 700;
  font-display: swap;
}
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

/* ===== Palette ===== */
:root {
  --bg: #FCFBF9;
  --ink: #121212;
  --muted: #9A9A96;
  --hair: #E7E7E4;
  --accent: #C7724C;
  --maxw: 960px;
}

/* ===== Base ===== */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: "Pretendard", -apple-system, "Helvetica Neue", sans-serif;
  font-size: 15px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }

.wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }

/* ===== Typography ===== */
.display {
  font-family: "GraceSerif", serif;
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -0.01em;
  margin: 0;
}
.kicker {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
.hairline { border: 0; border-top: 1px solid var(--hair); margin: 0; }

/* ===== Nav ===== */
.site-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26px 0;
}
.site-nav .brand { font-family: "GraceSerif", serif; font-size: 18px; }
.site-nav .links { display: flex; gap: 22px; font-size: 13px; color: var(--ink); }
.site-nav .links a:hover { color: var(--accent); }

/* ===== On-air label ===== */
.onair { display: inline-flex; align-items: center; gap: 8px; }
.onair .pip {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent); display: inline-block;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .wrap { padding: 0 18px; }
  .site-nav { flex-direction: column; gap: 12px; align-items: flex-start; }
}
```

- [ ] **Step 3: `index.html` 뼈대 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>라디오 만드는 밤</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
  <div class="wrap">
    <nav class="site-nav">
      <a class="brand" href="index.html">라디오 만드는 밤</a>
      <div class="links">
        <a href="index.html">홈</a>
        <a href="topics.html">다음 주제 정하기</a>
        <a href="#archive">지난 회차</a>
      </div>
    </nav>
    <hr class="hairline" />

    <main>
      <p class="kicker" style="margin-top:40px;">폰트 확인용 임시</p>
      <h1 class="display" style="font-size:56px;">비 오는 날의 창가에서</h1>
      <p>Pretendard 본문 확인용 문장입니다. 각자의 방에서 같은 비를 듣는 우리.</p>
    </main>
  </div>
</body>
</html>
```

- [ ] **Step 4: 로컬 서버로 시각 확인**

```bash
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080/` 열기. Expected:
- 배경이 미색(`#FCFBF9`), 제목 "비 오는 날의 창가에서"가 **GraceSerif**(세리프)로 크게 렌더.
- 본문 문장은 Pretendard(산세리프).
- 상단 네비(로고 + 홈/다음 주제 정하기/지난 회차)와 얇은 구분선.
- DevTools Network 탭에서 `GraceSerif2.0-Regular.otf`가 200으로 로드됨(제목 폰트가 시스템 세리프로 폴백되지 않았는지 확인).

확인 후 서버 종료(Ctrl+C).

- [ ] **Step 5: 커밋**

```bash
git add assets/fonts assets/style.css index.html
git commit -m "feat: scaffold fonts, palette, typography, shared nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 데이터 계층 — 시드 + localStorage 헬퍼

모든 페이지가 쓸 데이터 계층을 만든다. 순수 데이터 함수만 — DOM 접근 없음. 이 Task 끝나면 브라우저 콘솔에서 함수 호출로 회차·주제 데이터를 읽고 쓸 수 있다.

**Files:**
- Create: `assets/data.js`

**Interfaces:**
- Produces (전역 함수, `window`에 노출):
  - `loadState() -> { episodes: Episode[], topics: Topic[] }`
  - `saveState(state) -> void`
  - `getEpisodes() -> Episode[]` (vol 내림차순)
  - `getEpisode(vol) -> Episode | undefined` (vol은 숫자)
  - `addTrack(vol, { title, by, reason }) -> Episode` (해당 회차 tracks에 추가 후 저장)
  - `addComment(vol, { name, text }) -> Comment` (`{ name, text, at }`, at=ISO 문자열, comments에 추가 후 저장)
  - `getTopics() -> Topic[]` (votes 내림차순)
  - `addTopic({ title, desc, by }) -> Topic` (`{ id, title, desc, by, votes:0 }`, id=문자열)
  - `voteTopic(id) -> Topic | undefined` (votes+1 후 저장)
  - `escapeHtml(str) -> string`
  - 타입: `Episode = { vol:number, title:string, intro:string, coverColor:string, tracks:Track[], comments:Comment[] }`, `Track = { title:string, by:string, reason:string }`, `Comment = { name:string, text:string, at:string }`, `Topic = { id:string, title:string, desc:string, by:string, votes:number }`.

- [ ] **Step 1: `assets/data.js` 작성 (시드 + 헬퍼)**

```javascript
(function () {
  "use strict";

  var STORAGE_KEY = "radioclub.v1";

  var SEED = {
    episodes: [
      {
        vol: 12,
        title: "비 오는 날의 창가에서",
        intro: "창밖으로 빗소리가 번지는 오후. 각자의 방에서 같은 비를 듣는 우리가 고른, 조금 젖은 노래들.",
        coverColor: "#5B6B74",
        tracks: [
          { title: "Nujabes — Feather", by: "지민", reason: "빗소리랑 제일 잘 어울려요" },
          { title: "김사월 — 봄눈", by: "유나", reason: "창가에 앉아 듣기 좋은" },
          { title: "Bill Evans — Peace Piece", by: "도현", reason: "비 오면 자동재생됨" }
        ],
        comments: [
          { name: "지민", text: "이번 주제 너무 좋아요. 비 오는 날만 기다리게 될 듯.", at: "2026-06-28T09:12:00.000Z" },
          { name: "도현", text: "Peace Piece 틀어놓고 커피 내렸는데 완벽했음.", at: "2026-06-28T21:40:00.000Z" }
        ]
      },
      {
        vol: 11,
        title: "첫차의 온도",
        intro: "아무도 없는 새벽 정류장, 첫차를 기다리며 듣고 싶은 노래.",
        coverColor: "#7A6A55",
        tracks: [
          { title: "검정치마 — 기다린 만큼, 더", by: "유나", reason: "새벽 공기 같은 인트로" },
          { title: "Mac DeMarco — Chamber of Reflection", by: "지민", reason: "혼자여도 외롭지 않게" }
        ],
        comments: [
          { name: "유나", text: "첫차 타면서 실제로 들었어요. 최고.", at: "2026-06-21T05:30:00.000Z" }
        ]
      },
      {
        vol: 10,
        title: "늦여름 밤 산책",
        intro: "더위가 한풀 꺾인 밤, 이어폰 한 쪽만 꽂고 걷고 싶은.",
        coverColor: "#4E5A4A",
        tracks: [
          { title: "장기하 — 그건 니 생각이고", by: "도현", reason: "걸음 속도가 딱 맞아요" }
        ],
        comments: []
      }
    ],
    topics: [
      { id: "t1", title: "출근길 BGM", desc: "지하철·버스에서 하루를 여는 노래", by: "지민", votes: 5 },
      { id: "t2", title: "울고 싶은 밤", desc: "펑펑 울어도 되는, 위로가 되는 곡", by: "유나", votes: 8 },
      { id: "t3", title: "여름의 끝", desc: "8월 말의 그 아쉬운 공기", by: "도현", votes: 3 }
    ]
  };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { return JSON.parse(raw); }
    } catch (e) { /* fall through to seed */ }
    return clone(SEED);
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getEpisodes() {
    return loadState().episodes.slice().sort(function (a, b) { return b.vol - a.vol; });
  }

  function getEpisode(vol) {
    vol = Number(vol);
    return loadState().episodes.filter(function (e) { return e.vol === vol; })[0];
  }

  function addTrack(vol, track) {
    vol = Number(vol);
    var state = loadState();
    var ep = state.episodes.filter(function (e) { return e.vol === vol; })[0];
    if (!ep) { return undefined; }
    ep.tracks.push({ title: track.title, by: track.by, reason: track.reason });
    saveState(state);
    return ep;
  }

  function addComment(vol, comment) {
    vol = Number(vol);
    var state = loadState();
    var ep = state.episodes.filter(function (e) { return e.vol === vol; })[0];
    if (!ep) { return undefined; }
    var c = { name: comment.name, text: comment.text, at: new Date().toISOString() };
    ep.comments.push(c);
    saveState(state);
    return c;
  }

  function getTopics() {
    return loadState().topics.slice().sort(function (a, b) { return b.votes - a.votes; });
  }

  function addTopic(topic) {
    var state = loadState();
    var t = {
      id: "t" + (Date.now()),
      title: topic.title,
      desc: topic.desc,
      by: topic.by,
      votes: 0
    };
    state.topics.push(t);
    saveState(state);
    return t;
  }

  function voteTopic(id) {
    var state = loadState();
    var t = state.topics.filter(function (x) { return x.id === id; })[0];
    if (!t) { return undefined; }
    t.votes += 1;
    saveState(state);
    return t;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.loadState = loadState;
  window.saveState = saveState;
  window.getEpisodes = getEpisodes;
  window.getEpisode = getEpisode;
  window.addTrack = addTrack;
  window.addComment = addComment;
  window.getTopics = getTopics;
  window.addTopic = addTopic;
  window.voteTopic = voteTopic;
  window.escapeHtml = escapeHtml;
})();
```

- [ ] **Step 2: `index.html`에 data.js 임시 로드**

`index.html`의 `</body>` 바로 앞에 추가:

```html
  <script src="assets/data.js"></script>
```

- [ ] **Step 3: 콘솔에서 데이터 계층 검증**

```bash
python3 -m http.server 8080
```

`http://localhost:8080/` 열고 DevTools 콘솔에서 순서대로 실행하며 결과 확인:

```javascript
localStorage.removeItem("radioclub.v1");        // 초기화
getEpisodes().map(e => e.vol);                   // Expected: [12, 11, 10]
getEpisode(12).title;                            // Expected: "비 오는 날의 창가에서"
getTopics().map(t => t.votes);                   // Expected: [8, 5, 3]  (내림차순)
addTrack(12, {title:"Test — Song", by:"나", reason:"확인"}).tracks.length; // Expected: 4
getEpisode(12).tracks.length;                    // Expected: 4  (저장 유지)
voteTopic("t1").votes;                            // Expected: 6
addTopic({title:"새 주제", desc:"설명", by:"나"}).votes;  // Expected: 0
escapeHtml("<b>&'\"");                            // Expected: "&lt;b&gt;&amp;&#39;&quot;"
location.reload();                                // 새로고침
getEpisode(12).tracks.length;                    // Expected: 4  (localStorage 유지 확인)
```

각 줄이 기대값과 일치하면 통과. 확인 후 `localStorage.removeItem("radioclub.v1")`로 다시 초기화하고 서버 종료.

- [ ] **Step 4: 커밋**

```bash
git add assets/data.js index.html
git commit -m "feat: add seed data and localStorage data layer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 홈 페이지 — 온에어 데스크

`index.html`을 실제 홈으로 완성한다. 최신 회차를 온에어 데스크로 크게 보여주고, 추천곡 요약, 지난 회차 아카이브, 다음 주제 티저를 렌더한다.

**Files:**
- Modify: `index.html` (Task 1의 임시 main 교체)
- Create: `assets/home.js`

**Interfaces:**
- Consumes: `getEpisodes()`, `getTopics()`, `escapeHtml()` (Task 2).
- Produces: 없음(페이지 종단).

- [ ] **Step 1: `index.html` main 영역 교체**

`<main>...</main>` 전체를 아래로 교체하고, `</body>` 앞 스크립트를 data.js + home.js 두 개로 만든다:

```html
    <main>
      <section class="hero" id="hero"><!-- home.js가 채움 --></section>

      <hr class="hairline" style="margin:56px 0 0;" />
      <section id="archive">
        <p class="kicker" style="margin:40px 0 18px;">지난 회차</p>
        <div class="archive-list" id="archive-list"><!-- home.js --></div>
      </section>

      <hr class="hairline" style="margin:56px 0 0;" />
      <section class="next-teaser" id="next-teaser"><!-- home.js --></section>
    </main>
  </div>
  <script src="assets/data.js"></script>
  <script src="assets/home.js"></script>
</body>
```

- [ ] **Step 2: `assets/style.css`에 홈 스타일 추가**

파일 끝에 추가:

```css
/* ===== Home: hero (on-air desk) ===== */
.hero { display: flex; gap: 44px; align-items: flex-start; margin-top: 44px; }
.hero .hero-main { flex: 1.5; }
.hero .hero-title { font-size: 60px; margin: 14px 0 20px; }
.hero .hero-intro { font-size: 15px; color: #3A3A38; max-width: 34ch; margin: 0; }
.hero .hero-side { flex: 1; }
.hero .side-label { margin: 0 0 6px; }
.trk { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--hair); font-size: 14px; }
.trk .trk-by { color: var(--muted); white-space: nowrap; }
.enter-link { display: inline-block; margin-top: 20px; font-size: 13px; color: var(--accent); }

/* ===== Home: archive ===== */
.archive-list { display: flex; flex-direction: column; }
.archive-row { display: flex; align-items: baseline; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--hair); }
.archive-row .a-vol { font-size: 12px; color: var(--muted); width: 56px; flex: none; }
.archive-row .a-title { font-family: "GraceSerif", serif; font-size: 22px; }
.archive-row:hover .a-title { color: var(--accent); }

/* ===== Home: next teaser ===== */
.next-teaser { margin: 40px 0 80px; }
.next-teaser .nt-title { font-size: 30px; margin: 12px 0 10px; }
.next-teaser p { color: #3A3A38; margin: 0 0 16px; }

@media (max-width: 640px) {
  .hero { flex-direction: column; gap: 28px; }
  .hero .hero-title { font-size: 40px; }
  .next-teaser .nt-title { font-size: 24px; }
}
```

- [ ] **Step 3: `assets/home.js` 작성**

```javascript
(function () {
  "use strict";

  var episodes = getEpisodes();
  var current = episodes[0];
  var past = episodes.slice(1);

  // ----- hero (latest episode) -----
  var trackRows = current.tracks.slice(0, 3).map(function (t) {
    return '<div class="trk"><span>' + escapeHtml(t.title) +
      '</span><span class="trk-by">' + escapeHtml(t.by) + '</span></div>';
  }).join("");

  document.getElementById("hero").innerHTML =
    '<div class="hero-main">' +
      '<span class="kicker onair"><span class="pip"></span> On Air · Vol.' + current.vol + '</span>' +
      '<h1 class="display hero-title">' + escapeHtml(current.title) + '</h1>' +
      '<p class="hero-intro">' + escapeHtml(current.intro) + '</p>' +
      '<a class="enter-link" href="episode.html?vol=' + current.vol + '">이 회차 들어가기 →</a>' +
    '</div>' +
    '<div class="hero-side">' +
      '<p class="kicker side-label">이번 회차 추천곡</p>' + trackRows +
    '</div>';

  // ----- archive -----
  document.getElementById("archive-list").innerHTML = past.map(function (e) {
    return '<a class="archive-row" href="episode.html?vol=' + e.vol + '">' +
      '<span class="a-vol">Vol.' + e.vol + '</span>' +
      '<span class="a-title">' + escapeHtml(e.title) + '</span>' +
    '</a>';
  }).join("");

  // ----- next topic teaser (top voted) -----
  var top = getTopics()[0];
  document.getElementById("next-teaser").innerHTML =
    '<span class="kicker">다음 주제 정하는 중</span>' +
    '<h2 class="display nt-title">' + (top ? escapeHtml(top.title) : "아직 제안이 없어요") + '</h2>' +
    '<p>' + (top ? "지금 가장 많은 표를 받은 주제예요. 함께 정해요." : "첫 주제를 제안해보세요.") + '</p>' +
    '<a class="enter-link" href="topics.html">다음 주제 정하러 가기 →</a>';
})();
```

- [ ] **Step 4: 브라우저에서 확인**

```bash
python3 -m http.server 8080
```

`http://localhost:8080/` Expected:
- Hero: 좌측에 `● On Air · Vol.12`, 큰 GraceSerif 제목 "비 오는 날의 창가에서", 소개글, "이 회차 들어가기 →". 우측에 추천곡 3줄(곡명 + 추천인).
- 지난 회차: Vol.11 "첫차의 온도", Vol.10 "늦여름 밤 산책" 두 줄, 호버 시 제목이 포인트색.
- 다음 주제 티저: "울고 싶은 밤"(votes 8, 최다) 표시 + "다음 주제 정하러 가기 →".
- 모바일 폭(브라우저 좁히기)에서 hero가 세로로 쌓임.
- 링크 클릭 시 아직 episode.html/topics.html 없어 404 — 정상(다음 Task).

확인 후 서버 종료.

- [ ] **Step 5: 커밋**

```bash
git add index.html assets/style.css assets/home.js
git commit -m "feat: home page on-air desk with archive and next-topic teaser

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 회차 상세 — 추천곡 리스트 + 곡 추천 폼 + 댓글

`episode.html`을 만든다. `?vol=N`으로 회차를 열고, 추천곡 전체 목록·곡 추천 폼·논의(댓글)를 렌더한다. 폼 제출 시 즉시 목록에 추가되고 새로고침 후에도 유지된다.

**Files:**
- Create: `episode.html`
- Create: `assets/episode.js`
- Modify: `assets/style.css` (폼·상세 스타일 추가)

**Interfaces:**
- Consumes: `getEpisode(vol)`, `getEpisodes()`, `addTrack(vol, {title,by,reason})`, `addComment(vol, {name,text})`, `escapeHtml()`.
- Produces: 없음(페이지 종단).

- [ ] **Step 1: `episode.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>회차 · 라디오 만드는 밤</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
  <div class="wrap">
    <nav class="site-nav">
      <a class="brand" href="index.html">라디오 만드는 밤</a>
      <div class="links">
        <a href="index.html">홈</a>
        <a href="topics.html">다음 주제 정하기</a>
      </div>
    </nav>
    <hr class="hairline" />
    <main id="episode"><!-- episode.js가 채움 --></main>
  </div>
  <script src="assets/data.js"></script>
  <script src="assets/episode.js"></script>
</body>
</html>
```

- [ ] **Step 2: `assets/style.css`에 상세·폼 스타일 추가**

파일 끝에 추가:

```css
/* ===== Episode detail ===== */
.ep-head { margin: 44px 0 40px; }
.ep-title { font-size: 56px; margin: 14px 0 18px; }
.ep-intro { font-size: 15px; color: #3A3A38; max-width: 46ch; margin: 0; }
.section-label { margin: 48px 0 14px; }
.track-item { padding: 16px 0; border-bottom: 1px solid var(--hair); }
.track-item .t-title { font-size: 16px; }
.track-item .t-meta { font-size: 13px; color: var(--muted); margin-top: 4px; }
.track-item .t-meta b { color: var(--ink); font-weight: 500; }
.comment { padding: 16px 0; border-bottom: 1px solid var(--hair); }
.comment .c-name { font-size: 13px; font-weight: 600; }
.comment .c-text { margin: 4px 0 0; }
.comment .c-at { font-size: 11px; color: var(--muted); }
.back-link { display: inline-block; margin: 60px 0 80px; font-size: 13px; color: var(--accent); }

/* ===== Forms (shared) ===== */
.form { margin: 20px 0 8px; padding: 22px; border: 1px solid var(--hair); border-radius: 12px; background: #fff; }
.form .row { display: flex; gap: 12px; }
.form .row + .row { margin-top: 12px; }
.form input, .form textarea {
  width: 100%; font-family: inherit; font-size: 14px; color: var(--ink);
  padding: 11px 13px; border: 1px solid var(--hair); border-radius: 8px; background: var(--bg);
}
.form input:focus, .form textarea:focus { outline: none; border-color: var(--accent); }
.form textarea { resize: vertical; min-height: 64px; }
.form .btn {
  margin-top: 12px; font-family: inherit; font-size: 13px; cursor: pointer;
  padding: 11px 22px; border: 1px solid var(--ink); border-radius: 999px;
  background: var(--ink); color: #fff;
}
.form .btn:hover { background: var(--accent); border-color: var(--accent); }

@media (max-width: 640px) {
  .ep-title { font-size: 38px; }
  .form .row { flex-direction: column; }
}
```

- [ ] **Step 3: `assets/episode.js` 작성**

```javascript
(function () {
  "use strict";

  function qsVol() {
    var m = /[?&]vol=(\d+)/.exec(location.search);
    return m ? Number(m[1]) : (getEpisodes()[0] ? getEpisodes()[0].vol : null);
  }

  var vol = qsVol();
  var root = document.getElementById("episode");

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ""; }
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }

  function render() {
    var ep = getEpisode(vol);
    if (!ep) {
      root.innerHTML = '<p style="margin:60px 0;">회차를 찾을 수 없어요. <a class="back-link" href="index.html">홈으로</a></p>';
      return;
    }

    var tracks = ep.tracks.map(function (t) {
      return '<div class="track-item">' +
        '<div class="t-title">' + escapeHtml(t.title) + '</div>' +
        '<div class="t-meta"><b>' + escapeHtml(t.by) + '</b> · ' + escapeHtml(t.reason) + '</div>' +
      '</div>';
    }).join("");

    var comments = ep.comments.length
      ? ep.comments.map(function (c) {
          return '<div class="comment">' +
            '<div class="c-name">' + escapeHtml(c.name) + ' <span class="c-at">' + fmtDate(c.at) + '</span></div>' +
            '<p class="c-text">' + escapeHtml(c.text) + '</p>' +
          '</div>';
        }).join("")
      : '<p style="color:var(--muted);">아직 이야기가 없어요. 첫 감상을 남겨보세요.</p>';

    root.innerHTML =
      '<div class="ep-head">' +
        '<span class="kicker">Vol.' + ep.vol + '</span>' +
        '<h1 class="display ep-title">' + escapeHtml(ep.title) + '</h1>' +
        '<p class="ep-intro">' + escapeHtml(ep.intro) + '</p>' +
      '</div>' +

      '<p class="kicker section-label">추천곡</p>' +
      '<div id="tracks">' + tracks + '</div>' +
      '<form class="form" id="track-form">' +
        '<div class="row"><input name="title" placeholder="곡명 (예: 아티스트 — 제목)" required /></div>' +
        '<div class="row"><input name="by" placeholder="추천인" required /></div>' +
        '<div class="row"><input name="reason" placeholder="한 줄 사유" required /></div>' +
        '<button class="btn" type="submit">이 회차에 곡 추천하기</button>' +
      '</form>' +

      '<p class="kicker section-label">논의</p>' +
      '<div id="comments">' + comments + '</div>' +
      '<form class="form" id="comment-form">' +
        '<div class="row"><input name="name" placeholder="닉네임" required /></div>' +
        '<div class="row"><textarea name="text" placeholder="이 회차에 대한 감상이나 이야기를 남겨주세요" required></textarea></div>' +
        '<button class="btn" type="submit">댓글 남기기</button>' +
      '</form>' +

      '<a class="back-link" href="index.html">← 홈으로</a>';

    document.getElementById("track-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      addTrack(vol, { title: f.title.value.trim(), by: f.by.value.trim(), reason: f.reason.value.trim() });
      render();
    });

    document.getElementById("comment-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      addComment(vol, { name: f.name.value.trim(), text: f.text.value.trim() });
      render();
    });
  }

  render();
})();
```

- [ ] **Step 4: 브라우저에서 확인**

```bash
python3 -m http.server 8080
```

`http://localhost:8080/episode.html?vol=12` Expected:
- Vol.12 헤더 + 제목 + 소개글.
- 추천곡 3개(곡명 / 추천인 · 사유). 곡 추천 폼(곡명·추천인·사유 + 버튼).
- 논의: 댓글 2개(지민·도현) + 날짜. 댓글 폼.
- 곡 추천 폼에 입력 후 제출 → 목록에 즉시 4번째 곡 추가. 새로고침해도 유지.
- 댓글 폼 제출 → 목록에 즉시 추가, 날짜 표시.
- `episode.html?vol=999` → "회차를 찾을 수 없어요" + 홈 링크.
- 홈에서 "이 회차 들어가기 →" / 아카이브 클릭 시 정상 진입.

확인 후 `localStorage.removeItem("radioclub.v1")`로 초기화, 서버 종료.

- [ ] **Step 5: 커밋**

```bash
git add episode.html assets/episode.js assets/style.css
git commit -m "feat: episode detail with track submission and comments

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 다음 주제 정하기 — 제안 카드 + 투표 + 제안 폼

`topics.html`을 만든다. 제안된 주제를 인기순 카드로 보여주고, 하트 투표로 카운트를 올리며 재정렬하고, 새 주제 제안 폼을 제공한다.

**Files:**
- Create: `topics.html`
- Create: `assets/topics.js`
- Modify: `assets/style.css` (주제 카드·하트 스타일 추가)

**Interfaces:**
- Consumes: `getTopics()`, `addTopic({title,desc,by})`, `voteTopic(id)`, `escapeHtml()`.
- Produces: 없음(페이지 종단).

- [ ] **Step 1: `topics.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>다음 주제 정하기 · 라디오 만드는 밤</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
  <div class="wrap">
    <nav class="site-nav">
      <a class="brand" href="index.html">라디오 만드는 밤</a>
      <div class="links">
        <a href="index.html">홈</a>
        <a href="topics.html">다음 주제 정하기</a>
      </div>
    </nav>
    <hr class="hairline" />
    <main>
      <div class="ep-head">
        <span class="kicker">함께 정해요</span>
        <h1 class="display ep-title">다음 회차 주제</h1>
        <p class="ep-intro">듣고 싶은 주제를 제안하고, 마음에 드는 주제에 마음을 눌러주세요. 가장 많은 표를 받은 주제가 다음 방송이 됩니다.</p>
      </div>
      <div id="topic-list"><!-- topics.js --></div>
      <p class="kicker section-label">새 주제 제안하기</p>
      <form class="form" id="topic-form">
        <div class="row"><input name="title" placeholder="주제 (예: 첫사랑의 노래)" required /></div>
        <div class="row"><input name="desc" placeholder="한 줄 설명" required /></div>
        <div class="row"><input name="by" placeholder="제안자" required /></div>
        <button class="btn" type="submit">주제 제안하기</button>
      </form>
      <a class="back-link" href="index.html">← 홈으로</a>
    </main>
  </div>
  <script src="assets/data.js"></script>
  <script src="assets/topics.js"></script>
</body>
</html>
```

- [ ] **Step 2: `assets/style.css`에 주제 카드 스타일 추가**

파일 끝에 추가:

```css
/* ===== Topics ===== */
.topic-card { display: flex; align-items: center; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--hair); }
.topic-card .tc-body { flex: 1; }
.topic-card .tc-title { font-family: "GraceSerif", serif; font-size: 24px; }
.topic-card .tc-desc { font-size: 13px; color: #3A3A38; margin: 4px 0 0; }
.topic-card .tc-by { font-size: 12px; color: var(--muted); margin-top: 6px; }
.vote {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  min-width: 60px; cursor: pointer; user-select: none;
  border: 1px solid var(--hair); border-radius: 12px; padding: 12px 0; background: #fff;
}
.vote:hover { border-color: var(--accent); }
.vote .heart { font-size: 18px; line-height: 1; color: var(--accent); }
.vote .count { font-size: 14px; font-weight: 600; }
.vote.voted { background: var(--accent); border-color: var(--accent); }
.vote.voted .heart, .vote.voted .count { color: #fff; }
```

- [ ] **Step 3: `assets/topics.js` 작성**

투표 중복 방지는 프로토타입 수준으로 `localStorage`의 별도 키(`radioclub.voted`)에 투표한 주제 id를 기억한다.

```javascript
(function () {
  "use strict";

  var VOTED_KEY = "radioclub.voted";

  function votedSet() {
    try { return JSON.parse(localStorage.getItem(VOTED_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function markVoted(id) {
    var s = votedSet(); s[id] = true;
    localStorage.setItem(VOTED_KEY, JSON.stringify(s));
  }

  var listEl = document.getElementById("topic-list");

  function render() {
    var voted = votedSet();
    listEl.innerHTML = getTopics().map(function (t) {
      var isVoted = !!voted[t.id];
      return '<div class="topic-card">' +
        '<div class="tc-body">' +
          '<div class="tc-title">' + escapeHtml(t.title) + '</div>' +
          '<p class="tc-desc">' + escapeHtml(t.desc) + '</p>' +
          '<div class="tc-by">' + escapeHtml(t.by) + ' 제안</div>' +
        '</div>' +
        '<div class="vote' + (isVoted ? " voted" : "") + '" data-id="' + t.id + '">' +
          '<span class="heart">' + (isVoted ? "♥" : "♡") + '</span>' +
          '<span class="count">' + t.votes + '</span>' +
        '</div>' +
      '</div>';
    }).join("");

    Array.prototype.forEach.call(listEl.querySelectorAll(".vote"), function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-id");
        if (votedSet()[id]) { return; }   // 한 번만
        voteTopic(id);
        markVoted(id);
        render();
      });
    });
  }

  document.getElementById("topic-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    addTopic({ title: f.title.value.trim(), desc: f.desc.value.trim(), by: f.by.value.trim() });
    f.reset();
    render();
  });

  render();
})();
```

- [ ] **Step 4: 브라우저에서 확인**

```bash
python3 -m http.server 8080
```

`http://localhost:8080/topics.html` Expected:
- 주제 카드가 인기순(울고 싶은 밤 8 → 출근길 BGM 5 → 여름의 끝 3)으로 정렬, 각 카드 우측에 ♡ + 카운트.
- 하트 클릭 → 카운트 +1, ♥로 채워지고 배경 포인트색, 필요 시 재정렬. 같은 카드 다시 클릭해도 안 오름(한 번만).
- 새 주제 제안 폼 제출 → 목록에 카운트 0으로 추가, 폼 리셋.
- 새로고침해도 투표·제안 유지.
- 홈의 "다음 주제 정하러 가기 →"에서 진입 정상.

확인 후 `localStorage.removeItem("radioclub.v1"); localStorage.removeItem("radioclub.voted");`로 초기화, 서버 종료.

- [ ] **Step 5: 커밋**

```bash
git add topics.html assets/topics.js assets/style.css
git commit -m "feat: next-topic page with proposals and heart voting

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 마무리 — 반응형·감성 폴리시 점검 + README

전체를 한 흐름으로 훑으며 여백·정렬·모바일을 다듬고, 여는 방법을 적은 README를 추가한다.

**Files:**
- Modify: `assets/style.css` (필요 시 미세 조정만)
- Create: `README.md`

**Interfaces:**
- Consumes: 전체.
- Produces: 없음.

- [ ] **Step 1: 전 페이지 통독 점검**

```bash
python3 -m http.server 8080
```

체크리스트(문제 발견 시 `style.css`만 최소 수정):
- 홈 → 회차 상세 → 홈 → 다음 주제 → 홈, 네비/뒤로가기 모두 동작.
- 데스크탑에서 hero·상세·주제 카드의 여백이 넉넉하고 정렬이 흐트러지지 않음.
- 브라우저 폭 375px로 좁혔을 때: hero 세로 스택, 폼 입력칸 세로 스택, 제목 크기 축소, 가로 스크롤 없음.
- GraceSerif 제목 / Pretendard 본문이 모든 페이지에서 일관.
- 포인트색(`#C7724C`)이 과하게 쓰이지 않고 링크·하트·On Air 점에만.

- [ ] **Step 2: `README.md` 작성**

```markdown
# 라디오 만드는 밤

라디오 만들기 소모임이 회차마다 주제를 정하고, 음악을 추천하고, 서로 논의하는 감성 웹사이트 (프로토타입).

## 여는 방법

브라우저에서 바로 열거나, 로컬 서버로 실행합니다.

    python3 -m http.server 8080

그 다음 http://localhost:8080/ 접속.

## 구조

- `index.html` — 홈(온에어 데스크): 이번 회차 + 추천곡 + 지난 회차 + 다음 주제 티저
- `episode.html?vol=N` — 회차 상세: 추천곡 리스트 + 곡 추천 폼 + 논의(댓글)
- `topics.html` — 다음 주제 정하기: 제안 + 하트 투표
- `assets/` — 스타일, 데이터 계층(시드 + localStorage), 페이지별 스크립트, 폰트

## 참고

- 데이터는 브라우저 `localStorage`에만 저장됩니다(서버 없음). 초기화하려면 콘솔에서
  `localStorage.removeItem("radioclub.v1"); localStorage.removeItem("radioclub.voted");`
- 제목 폰트: GraceSerif 2.0 (self-host) / 본문: Pretendard (CDN)
```

- [ ] **Step 3: 최종 확인 후 서버 종료 및 커밋**

```bash
git add -A
git commit -m "chore: responsive polish pass and README

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 완료 기준

- 세 페이지가 시드 데이터로 렌더되고, 서로 네비게이션된다.
- 곡 추천·댓글·주제 제안·투표가 즉시 반영되고 새로고침 후에도 유지된다.
- GraceSerif 제목 + Pretendard 본문, 에디토리얼 모노 팔레트가 일관되게 적용된다.
- 모바일 폭에서 레이아웃이 깨지지 않는다.
