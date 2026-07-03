import { mountNav, getMe } from "./ui.js";
import { listProfiles, setAdmin, escapeHtml } from "./data.js";
const root = document.getElementById("admin");
(async function () {
  await mountNav(".site-nav .links");
  const me = await getMe();
  if (!me.profile || !me.profile.is_admin) {
    root.innerHTML = '<p style="margin:60px 0;">권한이 없어요. <a class="back-link" href="index.html">홈으로</a></p>'; return;
  }
  async function render() {
    const ps = await listProfiles();
    root.innerHTML = '<div class="ep-head"><span class="kicker">admin</span><h1 class="display ep-title">권한 관리</h1></div>' +
      ps.map(function (p) {
        return '<div class="rec-foot" style="border-top:1px solid var(--hair);padding:14px 0;">' +
          '<span class="rec-by">' + (p.is_admin ? "admin" : "member") + '</span>' +
          '<span class="rec-reason">' + escapeHtml(p.nickname) + '</span>' +
          '<button class="mini-act" data-id="' + escapeHtml(p.id) + '" data-to="' + (p.is_admin ? "0" : "1") + '" style="margin-left:auto;">' +
            (p.is_admin ? "admin 해제" : "admin 부여") + '</button>' +
        '</div>';
      }).join("");
    Array.prototype.forEach.call(root.querySelectorAll("[data-id]"), function (b) {
      b.addEventListener("click", async function () {
        var to = b.getAttribute("data-to") === "1";
        if (!to && b.getAttribute("data-id") === me.profile.id && !confirm("본인 admin 권한을 해제할까요?")) return;
        try {
          await setAdmin(b.getAttribute("data-id"), to);
          await render();
        } catch (e) {
          console.error("setAdmin failed:", e);
          alert("권한 변경에 실패했어요. 잠시 후 다시 시도해주세요.");
        }
      });
    });
  }
  await render();
})();
