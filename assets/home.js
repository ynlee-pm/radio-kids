import { mountNav } from "./ui.js";
import { getEpisodes, getTracks, getTopics, escapeHtml } from "./data.js";

(async function () {
  "use strict";

  await mountNav(".site-nav .links");

  var episodes = [];
  try {
    episodes = await getEpisodes();
  } catch (e) {
    console.error("getEpisodes failed:", e);
  }
  var current = episodes[0] || null;
  var past = episodes.slice(1);

  var tracks = [];
  if (current) {
    try {
      tracks = await getTracks(current.id);
    } catch (e) {
      console.error("getTracks failed:", e);
    }
  }

  // ----- hero (latest episode) -----
  var trackRows = current ? tracks.slice(0, 3).map(function (t) {
    var song = t.song || "";
    var artist = t.artist || "";
    return '<div class="trk"><span class="trk-song">' + escapeHtml(song) +
      (artist ? ' <span class="trk-artist">— ' + escapeHtml(artist) + '</span>' : '') +
      '</span><span class="trk-by">' + escapeHtml(t.author) + '</span></div>';
  }).join("") : "";

  if (!current) {
    document.getElementById("hero").innerHTML =
      '<div class="hero-main">' +
        '<span class="kicker onair"><span class="pip"></span> On Air</span>' +
        '<h1 class="display hero-title">아직 주제가 없어요</h1>' +
        '<p class="hero-intro">다음 주제 정하기에서 새 주제를 제안해보세요.</p>' +
      '</div>';
  } else {
    document.getElementById("hero").innerHTML =
      '<div class="hero-main">' +
        '<span class="kicker onair"><span class="pip"></span> On Air · Vol.' + escapeHtml(String(current.vol)) + '</span>' +
        '<h1 class="display hero-title">' + escapeHtml(current.title) + '</h1>' +
        '<p class="hero-intro">' + escapeHtml(current.intro) + '</p>' +
        '<a class="enter-link" href="episode.html?vol=' + encodeURIComponent(current.vol) + '">이야기 나누기 →</a>' +
      '</div>' +
      '<div class="hero-side">' +
        '<p class="kicker side-label">이번 주제 추천곡</p>' + trackRows +
      '</div>';
  }

  // ----- archive -----
  document.getElementById("archive-list").innerHTML = past.map(function (e) {
    return '<a class="archive-row" href="episode.html?vol=' + encodeURIComponent(e.vol) + '">' +
      '<span class="a-vol">Vol.' + escapeHtml(String(e.vol)) + '</span>' +
      '<span class="a-title">' + escapeHtml(e.title) + '</span>' +
    '</a>';
  }).join("");

  // "새 주제 만들기" removed from home — episodes are created via the
  // confirmed-topic flow only (Task 4+).
  document.getElementById("new-episode").innerHTML = "";

  // ----- next topic teaser (top voted) -----
  var topics = [];
  try {
    topics = await getTopics();
  } catch (e) {
    console.error("getTopics failed:", e);
  }
  var top = topics[0] || null;
  document.getElementById("next-teaser").innerHTML =
    '<span class="kicker">다음 주제 정하는 중</span>' +
    '<h2 class="display nt-title">' + (top ? escapeHtml(top.title) : "아직 제안이 없어요") + '</h2>' +
    '<p>' + (top ? "지금 가장 많은 표를 받은 주제예요. 함께 정해요." : "첫 주제를 제안해보세요.") + '</p>' +
    '<a class="enter-link" href="topics.html">다음 주제 정하러 가기 →</a>';
})();
