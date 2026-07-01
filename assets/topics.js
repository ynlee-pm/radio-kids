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
