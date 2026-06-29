import { supabase } from "../../services/supabaseApi";

export async function getEmpresaAtual() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
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

export async function getEmpresaIdAtual() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("usuarios_empresas")
    .select("empresa_id")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .single();

  if (error) throw error;

  return data.empresa_id as string;
}