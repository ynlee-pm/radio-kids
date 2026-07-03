import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// 유나 님 Supabase 프로젝트 값으로 교체하세요 (공개 anon key — 노출돼도 안전, RLS가 보호).
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
