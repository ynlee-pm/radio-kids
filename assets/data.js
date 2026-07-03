import { supabase } from "./config.js";

export { supabase };

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
}
export async function signOut() { await supabase.auth.signOut(); }

export async function getMyProfile() {
  const s = await getSession();
  if (!s) return null;
  const { data } = await supabase.from("profiles").select("id,nickname,is_admin").eq("id", s.user.id).single();
  return data || null;
}
export async function updateMyNickname(nickname) {
  const s = await getSession();
  if (!s) throw new Error("not logged in");
  const { error } = await supabase.from("profiles").update({ nickname: nickname }).eq("id", s.user.id);
  if (error) throw error;
}

export function canEdit(row, me) {
  if (!me || !me.profile) return false;
  return row.created_by === me.profile.id || me.profile.is_admin === true;
}
