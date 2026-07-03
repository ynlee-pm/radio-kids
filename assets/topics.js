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
  var editingId = null;   // id of the topic currently being edited

  function render() {
    var voted = votedSet();
    listEl.innerHTML = getTopics().map(function (t) {
      var id = escapeHtml(String(t.id));
      if (t.id === editingId) {
        return '<div class="topic-card">' +
          '<form class="form edit-form" data-editform="' + id + '" style="flex:1; margin:0;">' +
            '<div class="row"><input name="title" value="' + escapeHtml(t.title) + '" placeholder="주제" required /></div>' +
            '<div class="row"><input name="desc" value="' + escapeHtml(t.desc) + '" placeholder="한 줄 설명" required /></div>' +
            '<div class="row"><input name="by" value="' + escapeHtml(t.by) + '" placeholder="제안자" required /></div>' +
            '<button class="btn" type="submit">저장</button>' +
            '<button class="btn-ghost" type="button" data-cancel="1">취소</button>' +
          '</form>' +
        '</div>';
      }
      var isVoted = !!voted[t.id];
      return '<div class="topic-card">' +
        '<div class="tc-body">' +
          '<div class="tc-title">' + escapeHtml(t.title) + '</div>' +
          '<p class="tc-desc">' + escapeHtml(t.desc) + '</p>' +
          '<div class="tc-by">' + escapeHtml(t.by) + ' 제안</div>' +
          '<div class="mini-acts">' +
            '<button class="mini-act" data-edit="' + id + '">수정</button>' +
            '<button class="mini-act" data-del="' + id + '">삭제</button>' +
          '</div>' +
        '</div>' +
        '<div class="vote' + (isVoted ? " voted" : "") + '" data-id="' + id + '">' +
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

    Array.prototype.forEach.call(listEl.querySelectorAll("[data-edit]"), function (b) {
      b.addEventListener("click", function () { editingId = b.getAttribute("data-edit"); render(); });
    });

    Array.prototype.forEach.call(listEl.querySelectorAll("[data-del]"), function (b) {
      b.addEventListener("click", function () {
        if (confirm("이 주제를 삭제할까요?")) { deleteTopic(b.getAttribute("data-del")); render(); }
      });
    });

    var ef = listEl.querySelector("[data-editform]");
    if (ef) {
      ef.addEventListener("submit", function (e) {
        e.preventDefault();
        updateTopic(ef.getAttribute("data-editform"), {
          title: ef.title.value.trim(), desc: ef.desc.value.trim(), by: ef.by.value.trim()
        });
        editingId = null;
        render();
      });
      ef.querySelector("[data-cancel]").addEventListener("click", function () {
        editingId = null; render();
      });
    }
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
