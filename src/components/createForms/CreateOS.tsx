import { useForm } from "react-hook-form"
import { ButtonContainer, Form, FormRow, Input, Label, Select, SelectCliente, ServicosAdicionados, SubmitButton } from "../ui/EntityFormStyled"

import type { OSCreateInput, OSEditInput } from "../../models/os"
import type { ClienteType } from "../../models/cliente"

import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingContainer } from "../spinner/LoadingContainer"

import { defaultValues, editDefaultValues } from "../../utils/osDefaultValues"
import { useEditOS, useGetClientes, useGetItensOS, useGetServicos, useInsertOS } from "./useGetOs"
import { useGetEstoque } from "../../pages/estoque/useEstoque";
import type { ServicoAdicionado } from "../../pages/ordensDeServico/osApi";
import {
  calculateOsItemsTotal,
  resolveSelectedItemId,
} from "../../utils/osItems";
import { sortByName } from "../../utils/sortByName";

type TipoItemOS = "servico" | "peca";

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
    defaultValues: osSelecionada ? editDefaultValues(osSelecionada) : defaultValues,
  });

  const { servicos, isLoadingServicos } = useGetServicos();
  const { estoque, isLoadingEstoque } = useGetEstoque();
  const servicosDisponiveis = useMemo(
    () =>
      sortByName(
        servicos.filter((servico) => servico.tipo === "servico"),
        (servico) => servico.servico,
      ),
    [servicos],
  );

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerms] = useState("");

  useEffect(() => {
    if (hasId) return;

    const normalizedSearch = searchTerm.trim();
    const timeoutId = window.setTimeout(() => {
      setSearchInput(normalizedSearch.length >= 2 ? normalizedSearch : "");
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [hasId, searchTerm]);

  const { clientes, isLoadingClientes } = useGetClientes(
    "cliente",
    1,
    searchInput
  );

  const { itensDaOS, isLoadingItensOS } = useGetItensOS(
    osSelecionada ?? ({} as OSEditInput)
  );

  const [servicoSelecionado, setServicoSelecionado] = useState(0);
  const [pecaSelecionada, setPecaSelecionada] = useState(0);

  const [qtdServicoSelecionada, setQtdServicoSelecionada] = useState<number>(1);
  const [qtdPecaSelecionada, setQtdPecaSelecionada] = useState<number>(1);

  const [descricaoServicoManual, setDescricaoServicoManual] = useState("");
  const [valorServicoManual, setValorServicoManual] = useState("");
  const [qtdServicoManual, setQtdServicoManual] = useState<number>(1);

  const [descricaoPecaManual, setDescricaoPecaManual] = useState("");
  const [valorPecaManual, setValorPecaManual] = useState("");
  const [qtdPecaManual, setQtdPecaManual] = useState<number>(1);

  const [servicosAdicionados, setServicosSelecionados] = useState<ServicoAdicionado[]>([]);
  const [itensCarregados, setItensCarregados] = useState(!hasId);
  const osHidratadaRef = useRef<number | null>(null);
  const servicoSelecionadoValido = resolveSelectedItemId(
    servicosDisponiveis,
    servicoSelecionado,
  );
  const pecaSelecionadaValida = resolveSelectedItemId(
    estoque,
    pecaSelecionada,
  );

  const { mutate, isPending } = useInsertOS(
    reset,
    setServicosSelecionados,
  );

  const { mutateOS, isPendingOS } = useEditOS(
    reset,
    setServicosSelecionados,
  );

  useEffect(() => {
    if (
      !hasId ||
      !osSelecionada ||
      isLoadingItensOS ||
      isLoadingServicos ||
      isLoadingEstoque ||
      osHidratadaRef.current === osSelecionada.id
    ) {
      return;
    }

    const itensFormatados: ServicoAdicionado[] = itensDaOS.map((item) => {
          const servicoEncontrado = servicos.find(
            (servico) => servico.id === item.id_servico
          );
          const produtoEncontrado = estoque.find(
            (produto) => produto.id === item.produto_estoque_id,
          );
          const valorSalvo = Number(item.valor_unitario);
          const valorReferencia = Number(
            servicoEncontrado?.valor ?? produtoEncontrado?.valor ?? 0,
          );

          return {
            servicoId: item.id_servico ?? null,
            produtoEstoqueId: item.produto_estoque_id ?? null,
            descricao:
              item.descricao ??
              servicoEncontrado?.servico ??
              produtoEncontrado?.nome ??
              "Item sem descrição",
            valor:
              Number.isFinite(valorSalvo) && valorSalvo > 0
                ? valorSalvo
                : valorReferencia,
            quantidade: Number(item.quantidade ?? 1),
            tipo: item.tipo ?? servicoEncontrado?.tipo ?? "servico",
            manual: item.manual ?? !item.id_servico,
          };
        });

    if (
      itensFormatados.length === 0 &&
      Number(osSelecionada.valorServico) > 0
    ) {
      itensFormatados.push({
        servicoId: null,
        produtoEstoqueId: null,
        descricao:
          osSelecionada.servicosRealizados ||
          osSelecionada.pecasTrocadas ||
          `Serviço da OS ${osSelecionada.id}`,
        valor: Number(osSelecionada.valorServico),
        quantidade: 1,
        tipo: "servico",
        manual: true,
      });
    }

    osHidratadaRef.current = osSelecionada.id;
    // Os dados assíncronos precisam hidratar o editor somente uma vez por OS.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServicosSelecionados(itensFormatados);
    setItensCarregados(true);
  }, [
    estoque,
    hasId,
    isLoadingEstoque,
    isLoadingItensOS,
    isLoadingServicos,
    itensDaOS,
    osSelecionada,
    servicos,
  ]);

function adicionarItemCadastrado(
  tipo: TipoItemOS,
  itemId: number,
  quantidade: number
) {
  if (tipo === "servico") {
    const servicoEncontrado = servicos.find((s) => s.id === itemId);

    if (!servicoEncontrado) return;
    if (Number(servicoEncontrado.valor) <= 0) {
      alert("O serviço selecionado está sem valor cadastrado.");
      return;
    }

    setServicosSelecionados((estadoAnterior) => [
      ...estadoAnterior,
      {
        servicoId: servicoEncontrado.id,
        produtoEstoqueId: null,
        descricao: servicoEncontrado.servico,
        valor: Number(servicoEncontrado.valor),
        quantidade,
        tipo: "servico",
        manual: false,
      },
    ]);

    return;
  }

  if (tipo === "peca") {
    const produtoEncontrado = estoque.find((p) => p.id === itemId);

    if (!produtoEncontrado) return;
    if (Number(produtoEncontrado.valor) <= 0) {
      alert("A peça selecionada está sem valor de venda cadastrado.");
      return;
    }

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

  function handleClienteSearch() {
    const normalizedSearch = searchTerm.trim();
    setSearchInput(normalizedSearch.length >= 2 ? normalizedSearch : "");
  }

  const valorTotal = useMemo(() => {
    return calculateOsItemsTotal(servicosAdicionados);
  }, [servicosAdicionados]);

  useEffect(() => {
    if (!itensCarregados) return;

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
  }, [itensCarregados, servicosAdicionados, valorTotal, setValue]);

  function onSubmit(data: OSCreateInput) {
    if (!hasId) {
      mutate({
        os: data,
        itens: servicosAdicionados,
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
      });
    }
  }

  if (
    isPending ||
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
            disabled={hasId}
            type="search"
            enterKeyHint="search"
            placeholder={
              hasId ? osSelecionada?.Clientes?.cliente : "Buscar por cliente..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerms(e.target.value)}
            onBlur={handleClienteSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleClienteSearch();
              }
            }}
          />

          <Select
            id="idCliente"
            {...register("idCliente", { valueAsNumber: true })}
            disabled={hasId || !searchInput}
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
          enterKeyHint="next"
          {...register("formaPagamento")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="veículo">Veículo:</Label>
        <Input type="text" id="veículo" {...register("veículo")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="motor">Motor:</Label>
        <Input type="text" id="motor" enterKeyHint="next" {...register("motor")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="servicoSelect">Adicionar serviço cadastrado:</Label>

        <Select
          id="servicoSelect"
          value={servicoSelecionadoValido}
          onChange={(e) => setServicoSelecionado(Number(e.target.value))}
        >
          {servicosDisponiveis.map((servico) => (
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
          inputMode="numeric"
          enterKeyHint="done"
          onChange={(e) => setQtdServicoSelecionada(Number(e.target.value))}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton
          type="button"
          disabled={!servicoSelecionadoValido}
          onClick={() =>
            adicionarItemCadastrado(
              "servico",
              servicoSelecionadoValido,
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
          enterKeyHint="next"
          onChange={(e) => setDescricaoServicoManual(e.target.value)}
        />

        <Input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valorServicoManual}
          inputMode="decimal"
          enterKeyHint="next"
          onChange={(e) => setValorServicoManual(e.target.value)}
        />

        <Input
          type="number"
          min="1"
          value={qtdServicoManual}
          inputMode="numeric"
          enterKeyHint="done"
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
          value={pecaSelecionadaValida}
          onChange={(e) => setPecaSelecionada(Number(e.target.value))}
        >
            {estoque
            .map((peca) => (
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
          inputMode="numeric"
          enterKeyHint="done"
          onChange={(e) => setQtdPecaSelecionada(Number(e.target.value))}
        />
      </FormRow>

      <ButtonContainer>
        <SubmitButton
          type="button"
          disabled={!pecaSelecionadaValida}
          onClick={() =>
            adicionarItemCadastrado("peca", pecaSelecionadaValida, qtdPecaSelecionada)
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
          enterKeyHint="next"
          onChange={(e) => setDescricaoPecaManual(e.target.value)}
        />

        <Input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valorPecaManual}
          inputMode="decimal"
          enterKeyHint="next"
          onChange={(e) => setValorPecaManual(e.target.value)}
        />

        <Input
          type="number"
          min="1"
          value={qtdPecaManual}
          inputMode="numeric"
          enterKeyHint="done"
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
        <Input type="text" id="obs" enterKeyHint="done" {...register("obs")} />
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
