import { mountNav } from "./ui.js";
import { getTopics, escapeHtml } from "./data.js";

(async function () {
  "use strict";

  await mountNav(".site-nav .links");

  var listEl = document.getElementById("topic-list");

  var topics = [];
  try {
    topics = await getTopics();
  } catch (e) {
    console.error("getTopics failed:", e);
  }

  listEl.innerHTML = topics.length
    ? topics.map(function (t) {
        return '<div class="topic-card">' +
          '<div class="tc-body">' +
            '<div class="tc-title">' + escapeHtml(t.title) + '</div>' +
            '<p class="tc-desc">' + escapeHtml(t.description) + '</p>' +
            '<div class="tc-by">' + escapeHtml(t.author) + ' 제안</div>' +
          '</div>' +
          '<div class="vote">' +
            '<span class="heart">♡</span>' +
            '<span class="count">' + escapeHtml(String(t.votes)) + '</span>' +
          '</div>' +
        '</div>';
      }).join("")
    : '<p style="color:var(--muted);">아직 제안된 주제가 없어요.</p>';

  // Suggest-topic form is out of scope for this task (Task 4+); hide it and
  // show a login placeholder instead.
  var form = document.getElementById("topic-form");
  if (form) {
    form.outerHTML = '<p style="color:var(--muted);">로그인하고 참여하기 (곧)</p>';
  }
})();
