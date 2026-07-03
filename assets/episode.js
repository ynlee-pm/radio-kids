import { mountNav } from "./ui.js";
import { getEpisodeByVol, getTracks, getComments, escapeHtml } from "./data.js";

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

  root.innerHTML =
    head +

    '<p class="kicker section-label">추천곡</p>' +
    '<div id="tracks">' + trackCards + '</div>' +
    '<p style="color:var(--muted); margin-top:12px;">로그인하고 참여하기 (곧)</p>' +

    '<p class="kicker section-label">논의</p>' +
    '<div id="comments">' + commentList + '</div>' +
    '<p style="color:var(--muted); margin-top:12px;">로그인하고 참여하기 (곧)</p>' +

    '<a class="back-link" href="index.html">← 홈으로</a>';
})();
