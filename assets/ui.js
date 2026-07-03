import { getSession, getMyProfile, signInWithGoogle, signOut, escapeHtml } from "./data.js";

let _me = null, _loaded = false;
export async function getMe() {
  if (_loaded) return _me;
  try {
    const session = await getSession();
    const profile = session ? await getMyProfile() : null;
    _me = { session, profile };
  } catch (e) {
    console.error("getMe failed, treating as logged-out:", e);
    _me = { session: null, profile: null };
  }
  _loaded = true;
  return _me;
}

export async function mountNav(linksSelector) {
  const el = document.querySelector(linksSelector);
  if (!el) return;
  var me;
  try {
    me = await getMe();
  } catch (e) {
    console.error("mountNav: getMe threw, rendering logged-out nav:", e);
    me = { session: null, profile: null };
  }
  var html = '<a href="index.html">홈</a><a href="topics.html">다음 주제 정하기</a>';
  if (me.session) {
    html += '<a href="profile.html">' + escapeHtml(me.profile ? me.profile.nickname : "프로필") + '</a>';
    if (me.profile && me.profile.is_admin) html += '<a href="admin.html">권한</a>';
    html += '<button class="nav-auth" id="nav-signout">로그아웃</button>';
  } else {
    html += '<button class="nav-auth" id="nav-signin">Google 로그인</button>';
  }
  el.innerHTML = html;
  var so = document.getElementById("nav-signout");
  if (so) so.addEventListener("click", async function () { await signOut(); location.reload(); });
  var si = document.getElementById("nav-signin");
  if (si) si.addEventListener("click", function () { signInWithGoogle(); });
}
