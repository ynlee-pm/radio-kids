import { mountNav, getMe } from "./ui.js";
import { getEpisodeByVol, getTracks, getComments, addTrack, addComment, signInWithGoogle, escapeHtml } from "./data.js";

(async function () {
  "use strict";

  await mountNav(".site-nav .links");

  function qsVol() {
    var m = /[?&]vol=(\d+)/.exec(location.search);
    return m ? Number(m[1]) : null;
  }

  var vol = qsVol();
  var root = document.getElementById("episode");

  // Only render http(s) links — blocks javascript:/data: URLs from the href.
  function isSafeUrl(u) {
    return /^https?:\/\//i.test(String(u || "").trim());
  }

  if (vol === null) {
    root.innerHTML = '<p style="margin:60px 0;">주제를 찾을 수 없어요. <a class="back-link" href="index.html">홈으로</a></p>';
    return;
  }

  var ep = null;
  try {
    ep = await getEpisodeByVol(vol);
  } catch (e) {
    console.error("getEpisodeByVol failed:", e);
  }

  if (!ep) {
    root.innerHTML = '<p style="margin:60px 0;">주제를 찾을 수 없어요. <a class="back-link" href="index.html">홈으로</a></p>';
    return;
  }

  async function render() {
    var tracks = [];
    var comments = [];
    try {
      tracks = await getTracks(ep.id);
    } catch (e) {
      console.error("getTracks failed:", e);
    }
    try {
      comments = await getComments(ep.id);
    } catch (e) {
      console.error("getComments failed:", e);
    }

    var me = null;
    try {
      me = await getMe();
    } catch (e) {
      console.error("getMe failed:", e);
      me = { session: null, profile: null };
    }

    var trackCards = tracks.length
      ? tracks.map(function (t) {
          var yt = isSafeUrl(t.url)
            ? '<a class="rec-yt" href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener noreferrer">▶ 듣기 ↗</a>'
            : '';
          return '<div class="rec-card">' +
            '<div class="rec-top">' +
              '<div class="rec-head">' +
                '<div class="rec-song">' + escapeHtml(t.song) + '</div>' +
                '<div class="rec-artist">' + escapeHtml(t.artist) + '</div>' +
              '</div>' +
              yt +
            '</div>' +
            '<div class="rec-foot">' +
              '<span class="rec-by">' + escapeHtml(t.author) + '</span>' +
              '<span class="rec-reason">' + escapeHtml(t.reason) + '</span>' +
            '</div>' +
          '</div>';
        }).join("")
      : '<p style="color:var(--muted);">아직 추천곡이 없어요.</p>';

    var commentList = comments.length
      ? comments.map(function (c) {
          return '<div class="comment">' +
            '<div class="c-name">' + escapeHtml(c.author) + '</div>' +
            '<p class="c-text">' + escapeHtml(c.body) + '</p>' +
          '</div>';
        }).join("")
      : '<p style="color:var(--muted);">아직 이야기가 없어요. 첫 감상을 남겨보세요.</p>';

    var head =
      '<div class="ep-head">' +
        '<span class="kicker">Vol.' + escapeHtml(String(ep.vol)) + '</span>' +
        '<h1 class="display ep-title">' + escapeHtml(ep.title) + '</h1>' +
        '<p class="ep-intro">' + escapeHtml(ep.intro) + '</p>' +
      '</div>';

    var loggedIn = !!(me && me.session);

    var trackForm = loggedIn
      ? '<form class="form" id="track-form">' +
          '<div class="row">' +
            '<input name="artist" placeholder="가수" required />' +
            '<input name="song" placeholder="곡명" required />' +
          '</div>' +
          '<div class="row"><input name="url" type="url" placeholder="유튜브 링크 (선택)" /></div>' +
          '<div class="row row-top">' +
            '<textarea name="reason" class="f-reason" placeholder="추천하는 이유" required></textarea>' +
          '</div>' +
          '<button class="btn" type="submit">이 주제에 곡 추천하기</button>' +
        '</form>'
      : '<button class="btn" id="track-login-btn">Google 로그인하고 참여하기</button>';

    var commentForm = loggedIn
      ? '<form class="form" id="comment-form">' +
          '<div class="row"><textarea name="body" placeholder="이 주제에 대한 감상이나 이야기를 남겨주세요" required></textarea></div>' +
          '<button class="btn" type="submit">댓글 남기기</button>' +
        '</form>'
      : '<button class="btn" id="comment-login-btn">Google 로그인하고 참여하기</button>';

    root.innerHTML =
      head +

      '<p class="kicker section-label">추천곡</p>' +
      '<div id="tracks">' + trackCards + '</div>' +
      trackForm +

      '<p class="kicker section-label">논의</p>' +
      '<div id="comments">' + commentList + '</div>' +
      commentForm +

      '<a class="back-link" href="index.html">← 홈으로</a>';

    if (loggedIn) {
      var tf = document.getElementById("track-form");
      tf.addEventListener("submit", async function (e) {
        e.preventDefault();
        var f = e.target;
        try {
          await addTrack(ep.id, {
            artist: f.artist.value.trim(),
            song: f.song.value.trim(),
            url: f.url.value.trim(),
            reason: f.reason.value.trim()
          });
          await render();
        } catch (err) {
          console.error("addTrack failed:", err);
          alert("추천곡을 등록하지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      });

      var cf = document.getElementById("comment-form");
      cf.addEventListener("submit", async function (e) {
        e.preventDefault();
        var f = e.target;
        try {
          await addComment(ep.id, { body: f.body.value.trim() });
          await render();
        } catch (err) {
          console.error("addComment failed:", err);
          alert("댓글을 등록하지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      });
    } else {
      var tlb = document.getElementById("track-login-btn");
      if (tlb) tlb.addEventListener("click", function () { signInWithGoogle(); });
      var clb = document.getElementById("comment-login-btn");
      if (clb) clb.addEventListener("click", function () { signInWithGoogle(); });
    }
  }

  await render();
})();
