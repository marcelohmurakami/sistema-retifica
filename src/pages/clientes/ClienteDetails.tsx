import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router"
import { getCliente, getClientesOS } from "./clientesApi";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import { BackButton, DetalhesContainer, DetalhesGrid, FlexButtons, InfoCard, InfoLabel, InfoValue, MessageBox, PageHeader, PageTitle } from "../ordensDeServico/OsDetalhesStyled";
import type { ClienteType } from "../../models/cliente";
import { formatCpfCnpj } from "../../utils/formatcpfcnpj";
import { formatDate } from "../../utils/formatDate";

export function ClienteDetails () {
    const { id } = useParams();
    const idCliente = Number(id);

    const { data, isLoading, isError, error } = useQuery<ClienteType>({
        queryKey: ['cliente', idCliente],
        queryFn: () => getCliente(idCliente),
    })

    const { data: clientesOS, isLoading: isLoadingClientes } = useQuery<any>({
      queryKey: ['OrdemDeServiço', idCliente],
      queryFn: () => getClientesOS(idCliente)
    })

    if(isLoading || isLoadingClientes) return <LoadingContainer />

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
        )
    }

    return (
        <>
        <DetalhesContainer>
          <PageHeader>
            <div>
              <PageTitle>Detalhes do cliente {data?.cliente.split(' ')[0].toUpperCase()}</PageTitle>
            </div>
    
            <FlexButtons>
                <Link to="/clientes">
                    <BackButton>Voltar</BackButton>
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
              <InfoLabel>CPF/CNPJ:</InfoLabel>
              <InfoValue>{data?.cpfcnpj ? formatCpfCnpj(data.cpfcnpj) : "-"}</InfoValue>
            </InfoCard>

            <InfoCard>
              <InfoLabel>Oficina:</InfoLabel>
              <InfoValue>{data?.oficina ? data.oficina : "-"}</InfoValue>
            </InfoCard>

            <InfoCard>
              <InfoLabel>Telefone 1:</InfoLabel>
              <InfoValue>{data?.telefone1 ? data.telefone1 : "-"}</InfoValue>
            </InfoCard>

            <InfoCard>
              <InfoLabel>Telefone 2:</InfoLabel>
              <InfoValue>{data?.telefone2 ? data.telefone2 : "-"}</InfoValue>
            </InfoCard>

            <InfoCard style={{ gridColumn: "1 / -1" }}>
              <InfoLabel>{`Últimos ${clientesOS.length} serviços feitos:`}</InfoLabel>
              {clientesOS.map((os: any) => (
                <>
                  <hr style={{ margin: "10px 0" }}></hr>
                  <Link to={`/ordens-de-serviço/${os.id}`}>
                    <InfoValue style={{ fontSize: "12px" }}>{`ID da OS: ${os.id}, Data do serviço: ${formatDate(os.dataServico)}, Motor: ${os.motor}, Valor: R$${os.valorServico}`}</InfoValue>
                  </Link>
                  <hr style={{ margin: "10px 0" }}></hr>
                </>
              ))}
            </InfoCard>
            
          </DetalhesGrid>
        </DetalhesContainer>
        </>
      )
}
