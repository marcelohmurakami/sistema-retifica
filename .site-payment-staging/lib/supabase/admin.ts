import "server-only";

import { createClient } from "@supabase/supabase-js";

function getAdminSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "A conexão administrativa do Supabase não foi configurada no servidor.",
    );
  }

  return { url, key };
}

export function createAdminSupabase() {
  const { url, key } = getAdminSupabaseConfig();

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
