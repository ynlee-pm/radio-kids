import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// 유나 님 Supabase 프로젝트 값으로 교체하세요 (공개 anon key — 노출돼도 안전, RLS가 보호).
export const SUPABASE_URL = "https://tpsbsaqoiiizrolrbdcy.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwc2JzYXFvaWlpenJvbHJiZGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzU0MjIsImV4cCI6MjA5ODYxMTQyMn0.1uzB49r3waNnwCW9Hkp7mfjg3C99qxB0v9iE45cPFRE";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
