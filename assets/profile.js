import { mountNav, getMe } from "./ui.js";
import { updateMyNickname, escapeHtml } from "./data.js";

const root = document.getElementById("profile");
(async function () {
  await mountNav(".site-nav .links");
  const me = await getMe();
  if (!me.session) {
    root.innerHTML = '<p style="margin:60px 0;">로그인하면 프로필을 설정할 수 있어요. <button class="btn" id="p-signin">로그인</button></p>';
    document.getElementById("p-signin").addEventListener("click", function(){ import("./data.js").then(m=>m.signInWithGoogle()); });
    return;
  }
  var meta = me.session.user.user_metadata || {};
  var name = meta.name || meta.full_name || "";
  var email = me.session.user.email || "";
  root.innerHTML =
    '<div class="ep-head"><h1 class="display ep-title">내 프로필</h1></div>' +
    '<div class="form">' +
      '<div class="pf-row"><span class="pf-label">이름</span><span class="pf-value">' + escapeHtml(name) + '</span></div>' +
      '<div class="pf-row"><span class="pf-label">이메일</span><span class="pf-value">' + escapeHtml(email) + '</span></div>' +
      '<form id="profile-form">' +
        '<div class="pf-row"><span class="pf-label">닉네임</span>' +
          '<input name="nickname" value="' + escapeHtml(me.profile.nickname) + '" placeholder="닉네임" required /></div>' +
        '<button class="btn" type="submit">저장</button>' +
      '</form>' +
      '<p id="p-msg" style="color:var(--muted);margin-top:12px;"></p>' +
    '</div>';
  document.getElementById("profile-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    await updateMyNickname(e.target.nickname.value.trim());
    document.getElementById("p-msg").textContent = "저장됐어요.";
  });
})();
