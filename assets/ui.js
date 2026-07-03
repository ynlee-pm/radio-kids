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
  var html = '<a href="index.html">홈</a><a href="topics.html">다음 주제</a>';
  if (me.session) {
    html += '<div class="menu-wrap nav-profile-wrap">' +
      '<button type="button" class="nav-profile" id="nav-profile-btn" aria-label="내 메뉴">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.2 3.6-6.5 8-6.5s8 2.3 8 6.5"/></svg>' +
      '</button></div>';
  } else {
    html += '<button class="nav-auth" id="nav-signin">로그인</button>';
  }
  el.innerHTML = html;
  var pb = document.getElementById("nav-profile-btn");
  if (pb) {
    var items = [{ label: "프로필 설정", onClick: function () { location.href = "profile.html"; } }];
    if (me.profile && me.profile.is_admin) items.push({ label: "권한", onClick: function () { location.href = "admin.html"; } });
    items.push({ label: "로그아웃", onClick: async function () { await signOut(); location.reload(); } });
    attachMenu(pb, items);
  }
  var si = document.getElementById("nav-signin");
  if (si) si.addEventListener("click", function () { signInWithGoogle(); });
}

export function attachMenu(btn, items) {
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    closeAllMenus();
    var menu = document.createElement("div");
    menu.className = "menu-pop";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.className = "menu-item"; b.textContent = it.label;
      b.addEventListener("click", function (ev) { ev.stopPropagation(); closeAllMenus(); it.onClick(); });
      menu.appendChild(b);
    });
    btn.parentNode.appendChild(menu);
  });
}
function closeAllMenus() { Array.prototype.forEach.call(document.querySelectorAll(".menu-pop"), function (m) { m.remove(); }); }
document.addEventListener("click", closeAllMenus);
