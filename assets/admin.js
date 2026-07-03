import { mountNav, getMe } from "./ui.js";
import { listProfiles, setAdmin, escapeHtml } from "./data.js";

const root = document.getElementById("admin");

(async function () {
  await mountNav(".site-nav .links");
  const me = await getMe();
  if (!me.profile || !me.profile.is_admin) {
    root.innerHTML = '<p style="margin:60px 0;">권한이 없어요. <a class="back-link" href="index.html">홈으로</a></p>';
    return;
  }

  async function render() {
    var ps = [];
    try {
      ps = await listProfiles();
    } catch (e) {
      console.error("listProfiles failed:", e);
    }

    root.innerHTML =
      '<div class="ep-head"><span class="kicker">admin</span><h1 class="display ep-title">권한 관리</h1></div>' +
      '<div class="admin-list">' +
        ps.map(function (p) {
          var badge = p.is_admin ? '<span class="admin-badge">admin</span>' : '';
          var label = p.is_admin ? 'admin 해제' : 'admin 부여';
          return '<div class="admin-row">' +
            '<span class="admin-name">' + escapeHtml(p.nickname || '(닉네임 없음)') + '</span>' +
            badge +
            '<button class="admin-toggle" data-id="' + escapeHtml(p.id) + '" data-to="' + (p.is_admin ? '0' : '1') + '">' + label + '</button>' +
          '</div>';
        }).join("") +
      '</div>';

    Array.prototype.forEach.call(root.querySelectorAll(".admin-toggle"), function (b) {
      b.addEventListener("click", async function () {
        var id = b.getAttribute("data-id");
        var to = b.getAttribute("data-to") === "1";
        if (!to && id === me.profile.id && !confirm("본인 admin 권한을 해제할까요?")) return;
        b.disabled = true;
        try {
          await setAdmin(id, to);
          await render();
        } catch (e) {
          console.error("setAdmin failed:", e);
          alert("권한 변경에 실패했어요. 잠시 후 다시 시도해주세요.");
          b.disabled = false;
        }
      });
    });
  }

  await render();
})();
