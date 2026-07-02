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

  // Only render http(s) links — blocks javascript:/data: URLs from the href.
  function isSafeUrl(u) {
    return /^https?:\/\//i.test(String(u || "").trim());
  }

  function render() {
    var ep = getEpisode(vol);
    if (!ep) {
      root.innerHTML = '<p style="margin:60px 0;">주제를 찾을 수 없어요. <a class="back-link" href="index.html">홈으로</a></p>';
      return;
    }

    var tracks = ep.tracks.map(function (t) {
      var song = t.song || t.title || "";   // fall back to old combined field
      var artist = t.artist || "";
      var yt = isSafeUrl(t.url)
        ? '<a class="rec-yt" href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener noreferrer">▶ 듣기 ↗</a>'
        : '';
      return '<div class="rec-card">' +
        '<div class="rec-top">' +
          '<div class="rec-head">' +
            '<div class="rec-song">' + escapeHtml(song) + '</div>' +
            '<div class="rec-artist">' + escapeHtml(artist) + '</div>' +
          '</div>' +
          yt +
        '</div>' +
        '<div class="rec-foot">' +
          '<span class="rec-by">' + escapeHtml(t.by) + '</span>' +
          '<span class="rec-reason">' + escapeHtml(t.reason) + '</span>' +
        '</div>' +
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
        '<div class="row">' +
          '<input name="artist" placeholder="가수" required />' +
          '<input name="song" placeholder="곡명" required />' +
        '</div>' +
        '<div class="row"><input name="url" type="url" placeholder="유튜브 링크 (선택)" /></div>' +
        '<div class="row row-top">' +
          '<input name="by" class="f-nick" placeholder="닉네임" required />' +
          '<textarea name="reason" class="f-reason" placeholder="추천하는 이유" required></textarea>' +
        '</div>' +
        '<button class="btn" type="submit">이 주제에 곡 추천하기</button>' +
      '</form>' +

      '<p class="kicker section-label">논의</p>' +
      '<div id="comments">' + comments + '</div>' +
      '<form class="form" id="comment-form">' +
        '<div class="row"><input name="name" placeholder="닉네임" required /></div>' +
        '<div class="row"><textarea name="text" placeholder="이 주제에 대한 감상이나 이야기를 남겨주세요" required></textarea></div>' +
        '<button class="btn" type="submit">댓글 남기기</button>' +
      '</form>' +

      '<a class="back-link" href="index.html">← 홈으로</a>';

    document.getElementById("track-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      addTrack(vol, { artist: f.artist.value.trim(), song: f.song.value.trim(), by: f.by.value.trim(), reason: f.reason.value.trim(), url: f.url.value.trim() });
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
