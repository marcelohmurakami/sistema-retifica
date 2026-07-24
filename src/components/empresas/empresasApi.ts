import { supabase } from "../../services/supabaseApi";

export type EmpresaAtual = {
  user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>["user"];
  usuarioEmpresa: {
    id: number;
    user_id: string;
    empresa_id: string;
    role: string;
    nome: string;
    empresas: unknown;
  };
  empresaId: string;
  role: string;
  empresa: unknown;
};

let empresaAtualPromise: Promise<EmpresaAtual> | null = null;
let cachedUserId: string | null = null;

export function clearEmpresaAtualCache() {
  empresaAtualPromise = null;
  cachedUserId = null;
}

async function fetchEmpresaAtual(): Promise<EmpresaAtual> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  const user = session?.user;
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("usuarios_empresas")
    .select(`
      id,
      user_id,
      empresa_id,
      role,
      nome,
      empresas (*)
    `)
    .eq("user_id", user.id)
    .eq("ativo", true)
    .single();

  if (error) throw error;

  return {
    user,
    usuarioEmpresa: data,
    empresaId: data.empresa_id,
    role: data.role,
    empresa: data.empresas,
  };
}

export async function getEmpresaAtual() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.user) throw new Error("Usuário não autenticado.");

  if (!empresaAtualPromise || cachedUserId !== session.user.id) {
    cachedUserId = session.user.id;
    empresaAtualPromise = fetchEmpresaAtual().catch((fetchError) => {
      clearEmpresaAtualCache();
      throw fetchError;
    });
  }

  return empresaAtualPromise;
}

export async function getEmpresaIdAtual() {
  const empresaAtual = await getEmpresaAtual();
  return empresaAtual.empresaId;
}
