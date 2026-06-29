import { useForm } from "react-hook-form"
import { ButtonContainer, Form, FormRow, Input, Label, Select, SelectCliente, ServicosAdicionados, SubmitButton } from "./CreateClienteStyled"

import type { OsType } from "../../models/os"
import type { ClienteType } from "../../models/cliente"

import { useEffect, useMemo, useState } from "react";
import { LoadingContainer } from "../spinner/LoadingContainer"

import { defaultValues, editDefaultValues } from "../../utils/osDefaultValues"
import { useEditOS, useGetClientes, useGetItensOS, useGetServicos, useInsertOS } from "./useGetOs"
import { useGetEstoque } from "../../pages/estoque/useEstoque";

type TipoItemOS = "servico" | "peca";

type ServicoAdicionadoComValor = {
  servicoId?: number | null;
  produtoEstoqueId?: number | null;
  descricao: string;
  valor: number;
  quantidade: number;
  tipo: TipoItemOS;
  manual: boolean;
};

export type OSCreateInput = Omit<OsType, "id" | "created_at">;
export type OSEditInput = Omit<OsType, "created_at">;

type CreateOSProps = {
  osSelecionada?:
    | (OSEditInput & {
        Clientes?: ClienteType;
      })
    | null;
};

export function CreateOS({ osSelecionada }: CreateOSProps) {
  const hasId = !!osSelecionada?.id;

  const { register, handleSubmit, reset, setValue } = useForm<OSCreateInput>({
    defaultValues,
  });

  const { servicos, isLoadingServicos } = useGetServicos();
  const { estoque, isLoadingEstoque } = useGetEstoque();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerms] = useState("");

  const { clientes, isLoadingClientes } = useGetClientes(
    "cliente",
    1,
    searchInput
  );

  const { itensDaOS, isLoadingItensOS } = useGetItensOS(
    osSelecionada ?? ({} as OSEditInput)
  );

  const [servicoSelecionado, setServicoSelecionado] = useState<number>(1);
  const [pecaSelecionada, setPecaSelecionada] = useState<number>(1);

  const [qtdServicoSelecionada, setQtdServicoSelecionada] = useState<number>(1);
  const [qtdPecaSelecionada, setQtdPecaSelecionada] = useState<number>(1);

  const [descricaoServicoManual, setDescricaoServicoManual] = useState("");
  const [valorServicoManual, setValorServicoManual] = useState("");
  const [qtdServicoManual, setQtdServicoManual] = useState<number>(1);

  const [descricaoPecaManual, setDescricaoPecaManual] = useState("");
  const [valorPecaManual, setValorPecaManual] = useState("");
  const [qtdPecaManual, setQtdPecaManual] = useState<number>(1);

  const [servicosAdicionados, setServicosSelecionados] = useState<
    ServicoAdicionadoComValor[]
  >([]);

  const { mutate, isPending } = useInsertOS(
    reset,
    setServicosSelecionados,
    setServicoSelecionado,
    setQtdServicoSelecionada
  );

  const { mutateOS, isPendingOS } = useEditOS(
    reset,
    setServicosSelecionados,
    setServicoSelecionado,
    setQtdServicoSelecionada
  );

  useEffect(() => {
    if (hasId && itensDaOS.length > 0) {
      const itensFormatados: ServicoAdicionadoComValor[] = itensDaOS.map(
        (item: any) => {
          const servicoEncontrado = servicos.find(
            (servico) => servico.id === item.id_servico
          );

          return {
            servicoId: item.id_servico ?? null,
            descricao:
              item.descricao ??
              servicoEncontrado?.servico ??
              "Item sem descrição",
            valor: Number(item.valor ?? servicoEncontrado?.valor ?? 0),
            quantidade: Number(item.quantidade ?? 1),
            tipo: item.tipo ?? servicoEncontrado?.tipo ?? "servico",
            manual: item.manual ?? !item.id_servico,
          };
        }
      );

      setServicosSelecionados(itensFormatados);
    }
  }, [hasId, itensDaOS, servicos]);

function adicionarItemCadastrado(
  tipo: TipoItemOS,
  itemId: number,
  quantidade: number
) {
  if (tipo === "servico") {
    const servicoEncontrado = servicos.find((s) => s.id === itemId);

    if (!servicoEncontrado) return;

    setServicosSelecionados((estadoAnterior) => [
      ...estadoAnterior,
      {
        servicoId: servicoEncontrado.id,
        produtoEstoqueId: null,
        descricao: servicoEncontrado.servico,
        valor: Number(servicoEncontrado.valor),
        quantidade,
        tipo: "servico",
        origem: "servicos",
        manual: false,
      },
    ]);

    return;
  }

  if (tipo === "peca") {
    const produtoEncontrado = estoque.find((p: any) => p.id === itemId);

    if (!produtoEncontrado) return;

    if (Number(produtoEncontrado.qtdEstoque) < quantidade) {
      alert("Quantidade insuficiente em estoque.");
      return;
    }

    setServicosSelecionados((estadoAnterior) => [
      ...estadoAnterior,
      {
        servicoId: null,
        produtoEstoqueId: produtoEncontrado.id,
        descricao: produtoEncontrado.nome,
        valor: Number(produtoEncontrado.valor),
        quantidade,
        tipo: "peca",
        origem: "estoque",
        manual: false,
      },
    ]);
  }
}

  function adicionarItemManual(tipo: TipoItemOS) {
    const descricao =
      tipo === "servico" ? descricaoServicoManual : descricaoPecaManual;

    const valorTexto =
      tipo === "servico" ? valorServicoManual : valorPecaManual;

    const quantidade =
      tipo === "servico" ? qtdServicoManual : qtdPecaManual;

    const valor = Number(valorTexto);

    if (!descricao.trim()) return;
    if (!valor || valor <= 0) return;
    if (!quantidade || quantidade <= 0) return;

    setServicosSelecionados((estadoAnterior) => [
      ...estadoAnterior,
      {
        servicoId: null,
        produtoEstoqueId: null,
        descricao,
        valor,
        quantidade,
        tipo,
        manual: true,
      },
    ]);

    if (tipo === "servico") {
      setDescricaoServicoManual("");
      setValorServicoManual("");
      setQtdServicoManual(1);
    } else {
      setDescricaoPecaManual("");
      setValorPecaManual("");
      setQtdPecaManual(1);
    }
  }

  function removeServico(index: number) {
    setServicosSelecionados((estadoAnterior) =>
      estadoAnterior.filter((_, i) => i !== index)
    );
  }

  const valorTotal = useMemo(() => {
    return servicosAdicionados.reduce((total, item) => {
      return total + Number(item.valor) * Number(item.quantidade);
    }, 0);
  }, [servicosAdicionados]);

  useEffect(() => {
    setValue("valorServico", Number(valorTotal));

    const descricaoServicos = servicosAdicionados
      .filter((item) => item.tipo === "servico")
      .map((item) => item.descricao)
      .join(", ");

    const descricaoPecas = servicosAdicionados
      .filter((item) => item.tipo === "peca")
      .map((item) => item.descricao)
      .join(", ");

    setValue("servicosRealizados", descricaoServicos);
    setValue("pecasTrocadas", descricaoPecas);
  }, [servicosAdicionados, valorTotal, setValue]);

  useEffect(() => {
    if (hasId && osSelecionada) {
      reset(editDefaultValues(osSelecionada));
    } else {
      reset(defaultValues);
      setServicosSelecionados([]);
    }
  }, [hasId, osSelecionada, reset]);

  function onSubmit(data: OSCreateInput) {
    if (!hasId) {
      mutate({
        os: data,
        itens: servicosAdicionados,
        servicos,
      });

      return;
    }

    if (hasId && osSelecionada) {
      mutateOS({
        os: {
          ...data,
          id: osSelecionada.id,
        },
        itens: servicosAdicionados,
        servicos,
      });
    }
  }

  if (
    isPending ||
    isLoadingClientes ||
    isLoadingServicos ||
    isPendingOS ||
    isLoadingItensOS ||
    isLoadingEstoque
  ) {
    return <LoadingContainer />;
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <h1>{hasId ? "Editar OS" : "Tela de cadastro de OS"}</h1>

      <FormRow>
        <Label htmlFor="idCliente">Cliente:</Label>

        <SelectCliente>
          <Input
            disabled={isLoadingClientes || hasId}
            type="text"
            placeholder={
              hasId ? osSelecionada?.Clientes?.cliente : "Buscar por cliente..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerms(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchInput(searchTerm);
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />

          <Select
            id="idCliente"
            {...register("idCliente", { valueAsNumber: true })}
            disabled={isLoadingClientes || hasId}
          >
            <option value="" disabled>
              {isLoadingClientes
                ? "Carregando clientes..."
                : "Selecione um cliente"}
            </option>

            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cliente}
              </option>
            ))}
          </Select>
        </SelectCliente>
      </FormRow>

      <FormRow>
        <Label htmlFor="dataServico">Data do serviço:</Label>
        <Input type="date" id="dataServico" {...register("dataServico")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="dataVencimento">Data do vencimento:</Label>
        <Input
          type="date"
          id="dataVencimento"
          {...register("dataVencimento")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="formaPagamento">Forma de pagamento:</Label>
        <Input
          type="text"
          id="formaPagamento"
          {...register("formaPagamento")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="veículo">Veículo:</Label>
        <Input type="text" id="veículo" {...register("veículo")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="motor">Motor:</Label>
        <Input type="text" id="motor" {...register("motor")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="servicoSelect">Adicionar serviço cadastrado:</Label>

        <Select
          id="servicoSelect"
          value={servicoSelecionado}
          onChange={(e) => setServicoSelecionado(Number(e.target.value))}
        >
          {servicos
            ?.filter((servico) => servico.tipo === "servico")
            .map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.servico} - R$ {Number(servico.valor).toFixed(2)}
              </option>
            ))}
        </Select>

        <Label>Quantidade:</Label>
        <Input
          type="number"
          min="1"
          value={qtdServicoSelecionada}
          onChange={(e) => setQtdServicoSelecionada(Number(e.target.value))}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton
          type="button"
          onClick={() =>
            adicionarItemCadastrado(
              "servico",
              servicoSelecionado,
              qtdServicoSelecionada
            )
          }
        >
          Adicionar serviço
        </SubmitButton>
      </ButtonContainer>

      <FormRow>
        <Label>Serviço especial:</Label>

        <Input
          type="text"
          placeholder="Ex: Serviço especial no cabeçote"
          value={descricaoServicoManual}
          onChange={(e) => setDescricaoServicoManual(e.target.value)}
        />

        <Input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valorServicoManual}
          onChange={(e) => setValorServicoManual(e.target.value)}
        />

        <Input
          type="number"
          min="1"
          value={qtdServicoManual}
          onChange={(e) => setQtdServicoManual(Number(e.target.value))}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton
          type="button"
          onClick={() => adicionarItemManual("servico")}
        >
          Adicionar serviço especial
        </SubmitButton>
      </ButtonContainer>

      <FormRow>
        <Label htmlFor="pecaSelect">Adicionar peça cadastrada:</Label>

        <Select
          id="pecaSelect"
          value={pecaSelecionada}
          onChange={(e) => setPecaSelecionada(Number(e.target.value))}
        >
            {estoque
            .map((peca: any) => (
              <option key={peca.id} value={peca.id}>
                {peca.nome} - R$ {Number(peca.valor).toFixed(2)}
              </option>
            ))}
        </Select>

        <Label>Quantidade:</Label>
        <Input
          type="number"
          min="1"
          value={qtdPecaSelecionada}
          onChange={(e) => setQtdPecaSelecionada(Number(e.target.value))}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton
          type="button"
          onClick={() =>
            adicionarItemCadastrado("peca", pecaSelecionada, qtdPecaSelecionada)
          }
        >
          Adicionar peça
        </SubmitButton>
      </ButtonContainer>

      <FormRow>
        <Label>Peça avulsa:</Label>

        <Input
          type="text"
          placeholder="Ex: Junta especial"
          value={descricaoPecaManual}
          onChange={(e) => setDescricaoPecaManual(e.target.value)}
        />

        <Input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valorPecaManual}
          onChange={(e) => setValorPecaManual(e.target.value)}
        />

        <Input
          type="number"
          min="1"
          value={qtdPecaManual}
          onChange={(e) => setQtdPecaManual(Number(e.target.value))}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton type="button" onClick={() => adicionarItemManual("peca")}>
          Adicionar peça avulsa
        </SubmitButton>
      </ButtonContainer>

      <FormRow>
        <Label>Itens adicionados:</Label>

        <div style={{ width: "100%" }}>
          {servicosAdicionados.length === 0 ? (
            <p>Nenhum item adicionado.</p>
          ) : (
            servicosAdicionados.map((item, index) => {
              const subtotal = Number(item.valor) * Number(item.quantidade);

              return (
                <ServicosAdicionados key={`${item.descricao}-${index}`}>
                  <span>
                    {item.tipo === "peca" ? "Peça" : "Serviço"}:{" "}
                    {item.descricao} — R$ {Number(item.valor).toFixed(2)} x{" "}
                    {item.quantidade} = R$ {subtotal.toFixed(2)}
                    {item.manual ? " (manual)" : ""}
                  </span>

                  <button type="button" onClick={() => removeServico(index)}>
                    Remover
                  </button>
                </ServicosAdicionados>
              );
            })
          )}
        </div>
      </FormRow>

      <FormRow>
        <Label htmlFor="servicosRealizados">Resumo dos serviços:</Label>
        <Input
          type="text"
          id="servicosRealizados"
          readOnly
          {...register("servicosRealizados")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="pecasTrocadas">Peças trocadas:</Label>
        <Input
          type="text"
          id="pecasTrocadas"
          readOnly
          {...register("pecasTrocadas")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="obs">Observações:</Label>
        <Input type="text" id="obs" {...register("obs")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="valorServico">Valor total do serviço:</Label>
        <Input
          type="number"
          id="valorServico"
          readOnly
          {...register("valorServico", { valueAsNumber: true })}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton type="submit" disabled={isPending || isPendingOS}>
          {hasId
            ? isPendingOS
              ? "Salvando..."
              : "Salvar edição"
            : isPending
              ? "Salvando..."
              : "Salvar OS"}
        </SubmitButton>
      </ButtonContainer>
    </Form>
  );
}