import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getServerSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?? process.env.SUPABASE_URL
    ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("A conexão com o Supabase Auth ainda não foi configurada.");
  }

  return { url, key };
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { url, key } = getServerSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components não podem gravar cookies. Route Handlers e o
          // callback de autenticação, que são usados aqui, podem.
        }
      },
    },
  });
}
