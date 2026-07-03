import { mountNav, getMe } from "./ui.js";
import { getTopics, addTopic, signInWithGoogle, escapeHtml } from "./data.js";

(async function () {
  "use strict";

  await mountNav(".site-nav .links");

  var listEl = document.getElementById("topic-list");
  var formHost = document.getElementById("topic-form");

  async function render() {
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

    var me = null;
    try {
      me = await getMe();
    } catch (e) {
      console.error("getMe failed:", e);
      me = { session: null, profile: null };
    }
    var loggedIn = !!(me && me.session);

    if (!formHost) return;

    if (loggedIn) {
      formHost.outerHTML =
        '<form class="form" id="topic-form">' +
          '<div class="row"><input name="title" placeholder="주제 (예: 첫사랑의 노래)" required /></div>' +
          '<div class="row"><input name="desc" placeholder="한 줄 설명" required /></div>' +
          '<button class="btn" type="submit">주제 제안하기</button>' +
        '</form>';
      formHost = document.getElementById("topic-form");
      formHost.addEventListener("submit", async function (e) {
        e.preventDefault();
        var f = e.target;
        try {
          await addTopic({ title: f.title.value.trim(), description: f.desc.value.trim() });
          await render();
        } catch (err) {
          console.error("addTopic failed:", err);
          alert("주제를 등록하지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      });
    } else {
      formHost.outerHTML = '<button class="btn" id="topic-login-btn">Google 로그인하고 참여하기</button>';
      formHost = document.getElementById("topic-login-btn");
      formHost.addEventListener("click", function () { signInWithGoogle(); });
    }
  }

  await render();
})();
