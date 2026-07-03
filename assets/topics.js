import { mountNav, getMe, attachMenu } from "./ui.js";
import { getTopics, addTopic, signInWithGoogle, escapeHtml, canEdit, updateTopic, deleteTopic, getMyVotes, toggleVote, confirmTopic } from "./data.js";

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

    var me = null;
    try {
      me = await getMe();
    } catch (e) {
      console.error("getMe failed:", e);
      me = { session: null, profile: null };
    }

    var myVotes = new Set();
    try {
      myVotes = await getMyVotes();
    } catch (e) {
      console.error("getMyVotes failed:", e);
    }

    var isAdmin = !!(me && me.profile && me.profile.is_admin);

    listEl.innerHTML = topics.length
      ? topics.map(function (t) {
          var menu = canEdit(t, me)
            ? '<div class="menu-wrap"><button type="button" class="menu-btn" aria-label="더보기">⋯</button></div>'
            : '';
          var voted = myVotes.has(t.id);
          var confirmBtn = isAdmin
            ? '<button type="button" class="confirm-btn">확정</button>'
            : '';
          return '<div class="topic-card" data-id="' + escapeHtml(t.id) + '">' +
            '<div class="tc-body">' +
              '<div class="tc-title">' + escapeHtml(t.title) + '</div>' +
              '<p class="tc-desc">' + escapeHtml(t.description) + '</p>' +
              '<div class="tc-foot">' +
                '<span class="tc-by">' + escapeHtml(t.author) + ' 제안</span>' +
                '<span class="tc-actions">' + confirmBtn + menu + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="vote' + (voted ? ' voted' : '') + '">' +
              '<span class="heart">' + (voted ? '♥' : '♡') + '</span>' +
              '<span class="count">' + escapeHtml(String(t.votes)) + '</span>' +
            '</div>' +
          '</div>';
        }).join("")
      : '<p style="color:var(--muted);">아직 제안된 주제가 없어요.</p>';

    wireTopicMenus(topics, me);
    wireVoteButtons(topics, me);
    if (isAdmin) wireConfirmButtons(topics);

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
      formHost.outerHTML = '<button class="btn" id="topic-login-btn">로그인하고 참여하기</button>';
      formHost = document.getElementById("topic-login-btn");
      formHost.addEventListener("click", function () { signInWithGoogle(); });
    }
  }

  function wireTopicMenus(topics, me) {
    topics.forEach(function (t) {
      if (!canEdit(t, me)) return;
      var card = listEl.querySelector('.topic-card[data-id="' + cssEscape(t.id) + '"]');
      if (!card) return;
      var btn = card.querySelector(".menu-btn");
      if (!btn) return;
      attachMenu(btn, [
        { label: "수정", onClick: function () { openTopicEditForm(card, t); } },
        { label: "삭제", onClick: async function () {
            if (!confirm("이 주제를 삭제할까요?")) return;
            try {
              await deleteTopic(t.id);
              await render();
            } catch (err) {
              console.error("deleteTopic failed:", err);
              alert("삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
            }
          } }
      ]);
    });
  }

  function wireVoteButtons(topics, me) {
    var loggedIn = !!(me && me.session);
    topics.forEach(function (t) {
      var card = listEl.querySelector('.topic-card[data-id="' + cssEscape(t.id) + '"]');
      if (!card) return;
      var voteEl = card.querySelector(".vote");
      if (!voteEl) return;
      voteEl.addEventListener("click", async function () {
        if (!loggedIn) {
          if (confirm("투표하려면 로그인이 필요해요. 로그인할까요?")) {
            signInWithGoogle();
          }
          return;
        }
        try {
          await toggleVote(t.id);
          await render();
        } catch (err) {
          console.error("toggleVote failed:", err);
          alert("투표하지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      });
    });
  }

  function wireConfirmButtons(topics) {
    topics.forEach(function (t) {
      var card = listEl.querySelector('.topic-card[data-id="' + cssEscape(t.id) + '"]');
      if (!card) return;
      var btn = card.querySelector(".confirm-btn");
      if (!btn) return;
      btn.addEventListener("click", async function () {
        if (!confirm("'" + t.title + "'을(를) 새 주제로 확정할까요?")) return;
        try {
          await confirmTopic(t.id);
          await render();
          alert("'" + t.title + "'이(가) 새 주제가 됐어요");
        } catch (err) {
          console.error("confirmTopic failed:", err);
          alert("주제를 확정하지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      });
    });
  }

  function openTopicEditForm(card, t) {
    card.outerHTML =
      '<div class="topic-card" data-id="' + escapeHtml(t.id) + '">' +
        '<form class="form topic-edit-form" style="flex:1;">' +
          '<div class="row"><input name="title" placeholder="주제" value="' + escapeHtml(t.title) + '" required /></div>' +
          '<div class="row"><input name="desc" placeholder="한 줄 설명" value="' + escapeHtml(t.description) + '" required /></div>' +
          '<button class="btn" type="submit">저장</button>' +
          '<button class="btn-ghost" type="button" data-act="cancel">취소</button>' +
        '</form>' +
      '</div>';
    var newCard = listEl.querySelector('.topic-card[data-id="' + cssEscape(t.id) + '"]');
    var form = newCard.querySelector(".topic-edit-form");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var f = e.target;
      try {
        await updateTopic(t.id, { title: f.title.value.trim(), description: f.desc.value.trim() });
        await render();
      } catch (err) {
        console.error("updateTopic failed:", err);
        alert("수정하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    });
    form.querySelector('[data-act="cancel"]').addEventListener("click", function () { render(); });
  }

  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, "\\$&");
  }

  await render();
})();
