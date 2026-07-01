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
          { title: "Nujabes — Feather", by: "지민", reason: "빗소리랑 제일 잘 어울려요", url: "https://www.youtube.com/results?search_query=Nujabes+Feather" },
          { title: "김사월 — 봄눈", by: "유나", reason: "창가에 앉아 듣기 좋은", url: "https://www.youtube.com/results?search_query=김사월+봄눈" },
          { title: "Bill Evans — Peace Piece", by: "도현", reason: "비 오면 자동재생됨", url: "https://www.youtube.com/results?search_query=Bill+Evans+Peace+Piece" }
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
          { title: "검정치마 — 기다린 만큼, 더", by: "유나", reason: "새벽 공기 같은 인트로", url: "https://www.youtube.com/results?search_query=검정치마+기다린+만큼+더" },
          { title: "Mac DeMarco — Chamber of Reflection", by: "지민", reason: "혼자여도 외롭지 않게", url: "https://www.youtube.com/results?search_query=Mac+DeMarco+Chamber+of+Reflection" }
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
          { title: "장기하 — 그건 니 생각이고", by: "도현", reason: "걸음 속도가 딱 맞아요", url: "https://www.youtube.com/results?search_query=장기하+그건+니+생각이고" }
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
    ep.tracks.push({ title: track.title, by: track.by, reason: track.reason, url: track.url || "" });
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
