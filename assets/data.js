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

export async function getEpisodes() {
  const { data, error } = await supabase.from("episodes")
    .select("id,vol,title,intro,created_by,created_at").order("vol", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getEpisodeByVol(vol) {
  const { data, error } = await supabase.from("episodes")
    .select("id,vol,title,intro,created_by,created_at").eq("vol", Number(vol)).maybeSingle();
  if (error) throw error;   // surface real errors instead of silently "not found"
  return data || null;
}
export async function getTracks(episodeId) {
  const { data, error } = await supabase.from("tracks")
    .select("id,episode_id,artist,song,url,reason,created_by,created_at, profiles:created_by(nickname)")
    .eq("episode_id", episodeId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(function (t) { t.author = t.profiles ? t.profiles.nickname : "익명"; return t; });
}
export async function getComments(episodeId) {
  const { data, error } = await supabase.from("comments")
    .select("id,episode_id,body,created_by,created_at, profiles:created_by(nickname)")
    .eq("episode_id", episodeId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(function (c) { c.author = c.profiles ? c.profiles.nickname : "익명"; return c; });
}
export async function getTopics() {
  const { data, error } = await supabase.from("topics")
    .select("id,title,description,created_by,created_at, profiles:created_by(nickname), votes(count)")
    .eq("status", "candidate");
  if (error) throw error;
  var list = (data || []).map(function (t) {
    t.author = t.profiles ? t.profiles.nickname : "익명";
    t.votes = (t.votes && t.votes[0]) ? t.votes[0].count : 0;
    return t;
  });
  list.sort(function (a, b) { return b.votes - a.votes; });
  return list;
}
