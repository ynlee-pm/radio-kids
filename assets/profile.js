import { mountNav, getMe } from "./ui.js";
import { updateMyNickname, escapeHtml } from "./data.js";

const root = document.getElementById("profile");
(async function () {
  await mountNav(".site-nav .links");
  const me = await getMe();
  if (!me.session) {
    root.innerHTML = '<p style="margin:60px 0;">로그인하면 프로필을 설정할 수 있어요. <button class="btn" id="p-signin">Google 로그인</button></p>';
    document.getElementById("p-signin").addEventListener("click", function(){ import("./data.js").then(m=>m.signInWithGoogle()); });
    return;
  }
  root.innerHTML =
    '<div class="ep-head"><span class="kicker">프로필</span><h1 class="display ep-title">내 닉네임</h1></div>' +
    '<form class="form" id="profile-form">' +
      '<div class="row"><input name="nickname" value="' + escapeHtml(me.profile.nickname) + '" placeholder="닉네임" required /></div>' +
      '<button class="btn" type="submit">저장</button>' +
    '</form><p id="p-msg" style="color:var(--muted);margin-top:12px;"></p>';
  document.getElementById("profile-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    await updateMyNickname(e.target.nickname.value.trim());
    document.getElementById("p-msg").textContent = "저장됐어요.";
  });
})();
