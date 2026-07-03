import { mountNav, getMe, attachMenu } from "./ui.js";
import {
  getEpisodeByVol, getTracks, getComments, addTrack, addComment, signInWithGoogle, escapeHtml, canEdit,
  updateTrack, deleteTrack, deleteComment, updateEpisode, deleteEpisode
} from "./data.js";

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
    me_ = me;

    var loggedIn = !!(me && me.session);

    function menuBtnHtml() {
      return '<div class="menu-wrap"><button type="button" class="menu-btn" aria-label="더보기">⋯</button></div>';
    }

    var trackCards = tracks.length
      ? tracks.map(function (t) {
          var yt = isSafeUrl(t.url)
            ? '<a class="rec-yt" href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener noreferrer">▶ 듣기 ↗</a>'
            : '';
          var menu = canEdit(t, me) ? menuBtnHtml() : '';
          return '<div class="rec-card" data-id="' + escapeHtml(t.id) + '">' +
            '<div class="rec-top">' +
              '<div class="rec-head">' +
                '<div class="rec-song">' + escapeHtml(t.song) + '</div>' +
                '<div class="rec-artist">' + escapeHtml(t.artist) + '</div>' +
              '</div>' +
              yt +
              menu +
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
          var menu = canEdit(c, me) ? menuBtnHtml() : '';
          return '<div class="comment" data-id="' + escapeHtml(c.id) + '">' +
            '<div class="c-top">' +
              '<div class="c-name">' + escapeHtml(c.author) + '</div>' +
              menu +
            '</div>' +
            '<p class="c-text">' + escapeHtml(c.body) + '</p>' +
          '</div>';
        }).join("")
      : '<p style="color:var(--muted);">아직 이야기가 없어요. 첫 감상을 남겨보세요.</p>';

    var epMenu = canEdit(ep, me) ? menuBtnHtml() : '';
    var head =
      '<div class="ep-head" data-id="' + escapeHtml(ep.id) + '">' +
        '<div class="ep-head-top">' +
          '<span class="kicker">Vol.' + escapeHtml(String(ep.vol)) + '</span>' +
          epMenu +
        '</div>' +
        '<h1 class="display ep-title">' + escapeHtml(ep.title) + '</h1>' +
        '<p class="ep-intro">' + escapeHtml(ep.intro) + '</p>' +
      '</div>';

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

    wireTrackMenus(tracks);
    wireCommentMenus(comments);
    wireEpisodeMenu();
  }

  function wireTrackMenus(tracks) {
    tracks.forEach(function (t) {
      if (!canEdit(t, me_)) return;
      var card = root.querySelector('.rec-card[data-id="' + cssEscape(t.id) + '"]');
      if (!card) return;
      var btn = card.querySelector(".menu-btn");
      if (!btn) return;
      attachMenu(btn, [
        { label: "수정", onClick: function () { openTrackEditForm(card, t); } },
        { label: "삭제", onClick: async function () {
            if (!confirm("이 추천곡을 삭제할까요?")) return;
            try {
              await deleteTrack(t.id);
              await render();
            } catch (err) {
              console.error("deleteTrack failed:", err);
              alert("삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
            }
          } }
      ]);
    });
  }

  function openTrackEditForm(card, t) {
    card.innerHTML =
      '<form class="form track-edit-form">' +
        '<div class="row">' +
          '<input name="artist" placeholder="가수" value="' + escapeHtml(t.artist) + '" required />' +
          '<input name="song" placeholder="곡명" value="' + escapeHtml(t.song) + '" required />' +
        '</div>' +
        '<div class="row"><input name="url" type="url" placeholder="유튜브 링크 (선택)" value="' + escapeHtml(t.url || "") + '" /></div>' +
        '<div class="row row-top">' +
          '<textarea name="reason" class="f-reason" placeholder="추천하는 이유" required>' + escapeHtml(t.reason) + '</textarea>' +
        '</div>' +
        '<button class="btn" type="submit">저장</button>' +
        '<button class="btn-ghost" type="button" data-act="cancel">취소</button>' +
      '</form>';
    var form = card.querySelector(".track-edit-form");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var f = e.target;
      try {
        await updateTrack(t.id, {
          artist: f.artist.value.trim(),
          song: f.song.value.trim(),
          url: f.url.value.trim(),
          reason: f.reason.value.trim()
        });
        await render();
      } catch (err) {
        console.error("updateTrack failed:", err);
        alert("수정하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    });
    form.querySelector('[data-act="cancel"]').addEventListener("click", function () { render(); });
  }

  function wireCommentMenus(comments) {
    comments.forEach(function (c) {
      if (!canEdit(c, me_)) return;
      var el = root.querySelector('.comment[data-id="' + cssEscape(c.id) + '"]');
      if (!el) return;
      var btn = el.querySelector(".menu-btn");
      if (!btn) return;
      attachMenu(btn, [
        { label: "삭제", onClick: async function () {
            if (!confirm("이 댓글을 삭제할까요?")) return;
            try {
              await deleteComment(c.id);
              await render();
            } catch (err) {
              console.error("deleteComment failed:", err);
              alert("삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
            }
          } }
      ]);
    });
  }

  function wireEpisodeMenu() {
    if (!canEdit(ep, me_)) return;
    var headEl = root.querySelector('.ep-head[data-id="' + cssEscape(ep.id) + '"]');
    if (!headEl) return;
    var btn = headEl.querySelector(".menu-btn");
    if (!btn) return;
    attachMenu(btn, [
      { label: "수정", onClick: function () { openEpisodeEditForm(headEl); } },
      { label: "삭제", onClick: async function () {
          if (!confirm("이 에피소드를 삭제할까요? 추천곡과 댓글도 함께 삭제될 수 있어요.")) return;
          try {
            await deleteEpisode(ep.id);
            location.href = "index.html";
          } catch (err) {
            console.error("deleteEpisode failed:", err);
            alert("삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
          }
        } }
    ]);
  }

  function openEpisodeEditForm(headEl) {
    headEl.innerHTML =
      '<form class="form ep-edit-form">' +
        '<div class="row"><input name="title" placeholder="제목" value="' + escapeHtml(ep.title) + '" required /></div>' +
        '<div class="row row-top"><textarea name="intro" class="f-reason" placeholder="소개" required>' + escapeHtml(ep.intro) + '</textarea></div>' +
        '<button class="btn" type="submit">저장</button>' +
        '<button class="btn-ghost" type="button" data-act="cancel">취소</button>' +
      '</form>';
    var form = headEl.querySelector(".ep-edit-form");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var f = e.target;
      try {
        await updateEpisode(ep.id, { title: f.title.value.trim(), intro: f.intro.value.trim() });
        ep.title = f.title.value.trim();
        ep.intro = f.intro.value.trim();
        await render();
      } catch (err) {
        console.error("updateEpisode failed:", err);
        alert("수정하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    });
    form.querySelector('[data-act="cancel"]').addEventListener("click", function () { render(); });
  }

  // Minimal CSS.escape polyfill fallback for data-id selector safety (uuid values are safe,
  // but guard against unexpected characters breaking the attribute selector).
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, "\\$&");
  }

  var me_ = null;

  await render();
})();
