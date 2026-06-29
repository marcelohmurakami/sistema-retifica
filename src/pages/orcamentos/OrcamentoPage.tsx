import { useQuery } from "@tanstack/react-query";
import { useRef } from 'react'
import { Link, useParams } from "react-router"
import { getCliente } from "../../pages/clientes/clientesApi";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import { BackButton, DetalhesContainer, DetalhesGrid, FlexButtons, InfoCard, InfoLabel, InfoValue, MessageBox, PageHeader, PageTitle, PrintButton } from "../ordensDeServico/OsDetalhesStyled";
import type { ClienteType } from "../../models/cliente";
import { getOrcamentoById } from "./Orcamento";
import { ImpressOrcamento } from "./impressOrcamento";
import { toPng } from 'html-to-image';

export function OrcamentoPage() {
  const { id } = useParams()
  const downloadRef = useRef<HTMLDivElement>(null)

  const { data: orcamento, isLoading: isLoadingOrcamento } = useQuery<any>({
    queryKey: ['Orcamento', id],
    queryFn: () => getOrcamentoById(Number(id)),
    enabled: !!id,
  })

  const idCliente = orcamento?.idCliente

  const { data, isLoading, isError, error } = useQuery<ClienteType>({
    queryKey: ['Cliente', idCliente],
    queryFn: () => getCliente(idCliente),
    enabled: !!idCliente,
  })

  async function handleDownloadOrcamento() {
    if (!downloadRef.current) return

    await document.fonts.ready

    const dataUrl = await toPng(downloadRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `orcamento-${orcamento?.id}.png`
    link.click()
  }

  function compartilharWhatsapp(orcamento: any) {
    const telefone = String(orcamento.Clientes?.telefone1 ?? "");

    if (!telefone) {
      alert ("Cliente sem telefone cadastrado ou n° inválido.");
      return;
    }

    const mensagem = `Olá ${orcamento.Clientes?.cliente}, tudo bem? Segue o orçamento e a relação de peças do seu motor.
    
    Orçamento #${orcamento.id}
    Motor: ${orcamento.motor}

    ${orcamento.orcamento}
    
    Qualquer dúvida estou a disposição.
    Orçamento emitido pelo sistema dia ${new Date().toLocaleDateString()}.`;

    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }

  if (isLoading || isLoadingOrcamento) return <LoadingContainer />

  if (isError) {
    return (
      <DetalhesContainer>
        <MessageBox>
          <h2>Erro ao carregar orçamento</h2>
          <p>{(error as Error).message}</p>

          <Link to="/orcamentos">
            <BackButton>Voltar</BackButton>
          </Link>
        </MessageBox>
      </DetalhesContainer>
    )
  }

  return (
    <>
      <DetalhesContainer>
        <PageHeader>
          <div>
            <PageTitle>Detalhes do orçamento {orcamento?.id}</PageTitle>
          </div>

        <FlexButtons>
            <PrintButton onClick={() => compartilharWhatsapp(orcamento)}>
              📲 Compartilhar via WhatsApp
            </PrintButton>

            <PrintButton onClick={() => window.print()}>
              🖨️ Imprimir orçamento
            </PrintButton>

            <PrintButton onClick={handleDownloadOrcamento}>
              📄 Baixar orçamento
            </PrintButton>

            <Link to="/orcamentos">
              <BackButton>⬅️ Voltar</BackButton>
            </Link>
          </FlexButtons>
        </PageHeader>

        <DetalhesGrid>
          <InfoCard>
            <InfoLabel>ID do cliente</InfoLabel>
            <InfoValue>{data?.id}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Cliente</InfoLabel>
            <InfoValue>{data?.cliente}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Motor:</InfoLabel>
            <InfoValue>{orcamento?.motor}</InfoValue>
          </InfoCard>

          <InfoCard style={{ gridColumn: '1 / 2' }}>
            <InfoLabel>Orçamento:</InfoLabel>
            <InfoValue>{orcamento?.orcamento}</InfoValue>
          </InfoCard>

          <InfoCard style={{ gridColumn: '2 / 3' }}>
            <InfoLabel>Observações:</InfoLabel>
            <InfoValue>{orcamento?.obs}</InfoValue>
          </InfoCard>
        </DetalhesGrid>
      </DetalhesContainer>

      <div className="area-orcamento-impressao">
        <div ref={downloadRef}>
          <ImpressOrcamento orcamento={orcamento} cliente={data} />
        </div>
      </div>
    </>
  )
}
