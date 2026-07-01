(function () {
  "use strict";

  var episodes = getEpisodes();
  var current = episodes[0];
  var past = episodes.slice(1);

  // ----- hero (latest episode) -----
  var trackRows = current.tracks.slice(0, 3).map(function (t) {
    var song = t.song || t.title || "";   // fall back to old combined field
    var artist = t.artist || "";
    return '<div class="trk"><span class="trk-song">' + escapeHtml(song) +
      (artist ? ' <span class="trk-artist">— ' + escapeHtml(artist) + '</span>' : '') +
      '</span><span class="trk-by">' + escapeHtml(t.by) + '</span></div>';
  }).join("");

  document.getElementById("hero").innerHTML =
    '<div class="hero-main">' +
      '<span class="kicker onair"><span class="pip"></span> On Air · Vol.' + current.vol + '</span>' +
      '<h1 class="display hero-title">' + escapeHtml(current.title) + '</h1>' +
      '<p class="hero-intro">' + escapeHtml(current.intro) + '</p>' +
      '<a class="enter-link" href="episode.html?vol=' + current.vol + '">이야기 나누기 →</a>' +
    '</div>' +
    '<div class="hero-side">' +
      '<p class="kicker side-label">이번 주제 추천곡</p>' + trackRows +
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
