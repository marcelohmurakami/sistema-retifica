import type { OsType } from "../../models/os"

import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

import {
  BackButton,
  DetalhesContainer,
  DetalhesGrid,
  FlexButtons,
  InfoCard,
  InfoLabel,
  InfoValue,
  MessageBox,
  PageHeader,
  PageTitle,
  PrintButton,
} from "./OsDetalhesStyled";

import { OsPrint } from "../../components/impressOs/ImpressOs";
import { formatDate } from "../../utils/formatDate";
import { getFullDetailsOs } from "./osApi";
import type { ClienteType } from "../../models/cliente";
import { Link, useParams } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { queryKeys } from "../../services/queryKeys";

type TipoItemOS = "servico" | "peca";

type ServicoResumoOS = {
  id: number;
  servico: string;
  valor: number | string;
  tipo: TipoItemOS;
};

export type ItemOSDetalhe = {
  id: number;
  id_os: number;
  id_servico: number | null;
  quantidade: number;
  valor_unitario: number | string;
  descricao?: string | null;
  tipo?: TipoItemOS | null;
  manual?: boolean | null;
  Servicos?: ServicoResumoOS | null;
};

export type ClienteOSDetalhe = ClienteType | ClienteType[] | null;

export type OSDetalheType = OsType & {
  Clientes?: ClienteOSDetalhe;
  itensOS?: ItemOSDetalhe[];
};

export function OsDetalhes() {
  const { user } = useAuth();
  const { id } = useParams();
  const osId = Number(id);

  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error } = useQuery<OSDetalheType>({
    queryKey: queryKeys.ordensServico.detail(user?.id, osId),
    queryFn: () => getFullDetailsOs(osId),
    enabled: !!user?.id && !!osId,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `OS-${data?.id ?? ""}`,
  });

  if (!osId || Number.isNaN(osId)) {
    return (
      <DetalhesContainer>
        <MessageBox>
          <h2>OS inválida</h2>

          <Link to="/ordens-de-serviço">
            <BackButton>Voltar</BackButton>
          </Link>
        </MessageBox>
      </DetalhesContainer>
    );
  }

  if (isLoading) {
    return (
      <DetalhesContainer>
        <MessageBox>
          <h2>Carregando detalhes da OS...</h2>
        </MessageBox>
      </DetalhesContainer>
    );
  }

  if (isError) {
    return (
      <DetalhesContainer>
        <MessageBox>
          <h2>Erro ao carregar OS</h2>
          <p>{(error as Error).message}</p>

          <Link to="/ordens-de-serviço">
            <BackButton>Voltar</BackButton>
          </Link>
        </MessageBox>
      </DetalhesContainer>
    );
  }

  if (!data) {
    return (
      <DetalhesContainer>
        <MessageBox>
          <h2>OS não encontrada</h2>

          <Link to="/ordens-de-serviço">
            <BackButton>Voltar</BackButton>
          </Link>
        </MessageBox>
      </DetalhesContainer>
    );
  }

  const cliente = Array.isArray(data.Clientes)
    ? data.Clientes[0]
    : data.Clientes;

  const itensOS = data.itensOS ?? [];

  const servicosDaOS = itensOS.filter((item) => {
    const tipo = item.tipo ?? item.Servicos?.tipo;
    return tipo === "servico";
  });

  const pecasDaOS = itensOS.filter((item) => {
    const tipo = item.tipo ?? item.Servicos?.tipo;
    return tipo === "peca";
  });

  return (
    <>
      <DetalhesContainer>
        <PageHeader>
          <div>
            <PageTitle>Detalhes da OS #{data.id}</PageTitle>
          </div>

          <FlexButtons>
            <PrintButton type="button" onClick={handlePrint}>
              Imprimir OS
            </PrintButton>

            <Link to="/ordens-de-serviço">
              <BackButton>Voltar</BackButton>
            </Link>
          </FlexButtons>
        </PageHeader>

        <DetalhesGrid>
          <InfoCard>
            <InfoLabel>ID da OS</InfoLabel>
            <InfoValue>{data.id}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>ID do Cliente</InfoLabel>
            <InfoValue>{data.idCliente}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Cliente</InfoLabel>
            <InfoValue>{cliente?.cliente ?? "Nome não informado"}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Valor do Serviço</InfoLabel>
            <InfoValue>R$ {Number(data.valorServico ?? 0).toFixed(2)}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Data do Serviço</InfoLabel>
            <InfoValue>{formatDate(data.dataServico)}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Data de Vencimento</InfoLabel>
            <InfoValue>{formatDate(data.dataVencimento)}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Forma de Pagamento</InfoLabel>
            <InfoValue>{data.formaPagamento || "-"}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Veículo</InfoLabel>
            <InfoValue>{data.veículo || "-"}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Motor</InfoLabel>
            <InfoValue>{data.motor || "-"}</InfoValue>
          </InfoCard>

          <InfoCard style={{ gridColumn: "1 / -1" }}>
            <InfoLabel>Serviços realizados</InfoLabel>
            <InfoValue>{data.servicosRealizados || "-"}</InfoValue>
          </InfoCard>

          <InfoCard style={{ gridColumn: "1 / -1" }}>
            <InfoLabel>Peças trocadas</InfoLabel>
            <InfoValue>{data.pecasTrocadas || "-"}</InfoValue>
          </InfoCard>

          <InfoCard style={{ gridColumn: "1 / -1" }}>
            <InfoLabel>Observações</InfoLabel>
            <InfoValue>{data.obs || "Sem observações"}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Data de Criação</InfoLabel>
            <InfoValue>{formatDate(data.dataServico)}</InfoValue>
          </InfoCard>
        </DetalhesGrid>
      </DetalhesContainer>

      <div style={{ display: "none" }}>
        <OsPrint
          ref={printRef}
          os={data}
          cliente={{
            cliente: cliente?.cliente ?? "Não informado",
            cpfcnpj: cliente?.cpfcnpj,
            telefone1: cliente?.telefone1,
            endereco: cliente?.endereco,
            empresa: cliente?.oficina,
          }}
          servicos={servicosDaOS}
          pecas={pecasDaOS}
        />
      </div>
    </>
  );
}
