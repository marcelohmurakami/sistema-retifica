import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !serviceKey || !publishableKey) {
  throw new Error("Credenciais de teste do Supabase não configuradas.");
}

export const admin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const publicClient = createClient(supabaseUrl, publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export async function getCatalog() {
  const { data: site, error: siteError } = await publicClient.rpc(
    "resolver_site_publico",
    { p_dominio: "localhost", p_slug: null },
  );
  if (siteError || !site) throw siteError ?? new Error("Site não encontrado.");

  const { data: catalog, error: catalogError } = await publicClient.rpc(
    "obter_catalogo_site",
    { p_id_empresa: Number(site.empresa.id) },
  );
  if (catalogError || !catalog) {
    throw catalogError ?? new Error("Catálogo não encontrado.");
  }
  return { site, catalog } as {
    site: {
      empresa: { id: number; fuso_horario: string };
      unidade: { id: number; fuso_horario: string };
    };
    catalog: {
      empresa: { id: number; fuso_horario: string };
      servicos: Array<{
        id: number;
        nome: string;
        exige_sinal: boolean;
        sinal_tipo: string | null;
        sinal_valor: number | null;
      }>;
    };
  };
}
