import { getEmpresaIdAtual } from "../../components/empresas/empresasApi";
import { supabase } from "../../services/supabaseApi";
import type {
  AnotacaoDiaria,
  AnotacaoDiariaInput,
  AnotacaoGeral,
  AnotacaoGeralInput,
} from "../../models/anotacao";

export async function getAnotacoesDiarias() {
    const empresaId = await getEmpresaIdAtual();

    const { data: anotacoes_diarias, error } = await supabase
    .from('anotacoes_diarias')
    .select('*')
    .order('created_at', { ascending: false })
    .eq('empresa_id', empresaId)

    if (error) {
        throw new Error (error.message);
    }

    return anotacoes_diarias;
}

export async function getAnotacoesGerais() {
    const empresaId = await getEmpresaIdAtual();

    const { data: anotacoes_gerais, error } = await supabase
    .from('anotacoes_gerais')
    .select('*')
    .order('created_at', { ascending: false })
    .eq('empresa_id', empresaId)

    if (error) {
        throw new Error (error.message);
    }

    return anotacoes_gerais;
}
    
export async function createAnotacoesDiarias(data: AnotacaoDiariaInput) {
    const empresaId = await getEmpresaIdAtual();

    const { data: newData, error } = await supabase
    .from('anotacoes_diarias')
    .insert({...data, empresa_id: empresaId})
    .select()
    .single()

    if (error) {
        throw new Error (error.message);
    }

    return newData;
}

export async function createAnotacoesGerais(data: AnotacaoGeralInput) {
    const empresaId = await getEmpresaIdAtual();

    const { data: newData, error } = await supabase
    .from('anotacoes_gerais')
    .insert({...data, empresa_id: empresaId})
    .select()
    .single()

    if (error) {
        throw new Error (error.message);
    }

    return newData;
}

export async function updateAnotacoesDiarias(anotacao: AnotacaoDiariaInput & Pick<AnotacaoDiaria, "id">) {
  const empresaId = await getEmpresaIdAtual();
  const { id, titulo, data, prioridade } = anotacao;

  const { error } = await supabase
    .from("anotacoes_diarias")
    .update({
      titulo,
      data,
      prioridade,
    })
    .eq("id", id)
    .eq("empresa_id", empresaId)

  if (error) {
    console.error("Erro ao editar anotação diária:", error);
    throw error;
  }
}

export async function updateStatusAnotacaoDiaria({
  id,
  concluida,
}: {
  id: number;
  concluida: boolean;
}) {
  const empresaId = await getEmpresaIdAtual();

  const { error } = await supabase
    .from("anotacoes_diarias")
    .update({ concluida })
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAnotacoesGerais(anotacao: AnotacaoGeralInput & Pick<AnotacaoGeral, "id">) {
    const { id, titulo, descricao, cliente } = anotacao;
    const empresaId = await getEmpresaIdAtual();

  const { error } = await supabase
    .from("anotacoes_gerais")
    .update({
      titulo,
      descricao,
      cliente,
    })
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) {
    throw error;
  }
}

export async function deleteAnotacoesDiarias(id: number) {
    const empresaId = await getEmpresaIdAtual();

    const { error } = await supabase
    .from('anotacoes_diarias')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)

    if (error) {
        throw new Error (error.message);
    }

    return true;
}

export async function deleteAnotacoesGerais(id: number) {
    const empresaId = await getEmpresaIdAtual();

    const { error } = await supabase
    .from('anotacoes_gerais')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)

    if (error) {
        throw new Error (error.message);
    }

    return true;
}
