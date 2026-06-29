import { forwardRef } from "react";
import {
  PrintPage,
  Header,
  HeaderLeft,
  HeaderRight,
  LogoBox,
  CompanyInfo,
  CompanySocial,
  Title,
  Section,
  TwoColumns,
  FieldRow,
  FieldLabel,
  FieldValue,
  MotorSection,
  TableSection,
  TableHeader,
  TableBody,
  TableColumn,
  TableTitle,
  ItemRow,
  TotalBox,
  ObservacoesBox,
  Footer,
  SignatureBox,
  SignatureLine,
} from "./ImpressOsStyled"
import type { OsType } from "../../models/os";
import logo from '../../assets/logo-print.jpg';
import qrcodepix from '../../assets/qrcodepix.jpeg';
import { formatPhone } from "../../utils/formatphone";
import { formatDate } from "../../utils/formatDate";
import { formatCpfCnpj } from "../../utils/formatcpfcnpj";

type ClienteResumo = {
  cliente: string;
  cpfcnpj?: string;
  telefone1?: string;
  endereco?: string;
  empresa?: string;
};

type TipoItemOS = "servico" | "peca";

type ItemOSPrint = {
  id?: number;
  id_os?: number;
  id_servico?: number | null;
  quantidade?: number | string | null;
  valor_unitario?: number | string | null;
  descricao?: string | null;
  tipo?: TipoItemOS | null;
  manual?: boolean | null;
  Servicos?: {
    id?: number;
    servico?: string;
    valor?: number | string | null;
    tipo?: TipoItemOS | null;
  } | null;
};

type OsPrintProps = {
  os: OsType;
  cliente: ClienteResumo;
  servicos?: ItemOSPrint[];
  pecas?: ItemOSPrint[];
};

function getDescricaoItem(item: ItemOSPrint) {
  return item.Servicos?.servico ?? item.descricao ?? "Item sem descrição";
}

function getValorUnitarioItem(item: ItemOSPrint) {
  return Number(item.valor_unitario ?? item.Servicos?.valor ?? 0);
}

function getQuantidadeItem(item: ItemOSPrint) {
  return Number(item.quantidade ?? 1);
}

function getSubtotalItem(item: ItemOSPrint) {
  return getValorUnitarioItem(item) * getQuantidadeItem(item);
}

export const OsPrint = forwardRef<HTMLDivElement, OsPrintProps>(
  ({ os, cliente, servicos = [], pecas = [] }, ref) => {
    return (
      <PrintPage ref={ref}>
        <Header>
          <HeaderLeft>
            <LogoBox>
              <img src={logo} alt="Logo da retífica" />
            </LogoBox>

            <CompanyInfo>CNPJ: 66.634.668/0001-07</CompanyInfo>
            <CompanyInfo>Rua: Benedito Merlino, 405</CompanyInfo>
            <CompanyInfo>Jd. Maria Rosa, Franca - SP</CompanyInfo>
          </HeaderLeft>

          <HeaderRight>
            <CompanySocial>PAGUE VIA PIX:</CompanySocial>

            <LogoBox>
              <img src={qrcodepix} alt="QR Code para pagamento via PIX" />
            </LogoBox>

            <CompanySocial>CONTATO:</CompanySocial>
            <CompanySocial>(16) 3724-7336</CompanySocial>
          </HeaderRight>
        </Header>

        <Title>ORDEM DE SERVIÇO [OS] Nº {os.id}</Title>

        <Section>
          <TwoColumns>
            <div>
              <FieldRow>
                <FieldLabel>Cliente:</FieldLabel>
                <FieldValue>{cliente.cliente}</FieldValue>
              </FieldRow>

              <FieldRow>
                <FieldLabel>Empresa:</FieldLabel>
                <FieldValue>{cliente.empresa ?? "-"}</FieldValue>
              </FieldRow>

              <FieldRow>
                <FieldLabel>CPF/CNPJ:</FieldLabel>
                <FieldValue>
                  {cliente.cpfcnpj ? formatCpfCnpj(cliente.cpfcnpj) : "-"}
                </FieldValue>
              </FieldRow>

              <FieldRow>
                <FieldLabel>Forma de pagamento:</FieldLabel>
                <FieldValue>{os.formaPagamento || "-"}</FieldValue>
              </FieldRow>
            </div>

            <div>
              <FieldRow>
                <FieldLabel>Telefone:</FieldLabel>
                <FieldValue>
                  {cliente.telefone1 ? formatPhone(cliente.telefone1) : "-"}
                </FieldValue>
              </FieldRow>

              <FieldRow>
                <FieldLabel>Endereço:</FieldLabel>
                <FieldValue>{cliente.endereco ?? "-"}</FieldValue>
              </FieldRow>

              <FieldRow>
                <FieldLabel>Data do serviço:</FieldLabel>
                <FieldValue>{formatDate(os.dataServico)}</FieldValue>
              </FieldRow>
            </div>
          </TwoColumns>
        </Section>

        <MotorSection>
          <TableTitle>MOTOR</TableTitle>

          <TwoColumns>
            <div>
              <FieldRow>
                <FieldLabel>Modelo do veículo:</FieldLabel>
                <FieldValue>{os.veículo || "-"}</FieldValue>
              </FieldRow>
            </div>

            <div>
              <FieldRow>
                <FieldLabel>Motor:</FieldLabel>
                <FieldValue>{os.motor || "-"}</FieldValue>
              </FieldRow>
            </div>
          </TwoColumns>
        </MotorSection>

        <TableSection>
          <TableHeader>
            <TableColumn>
              <TableTitle>QUANTIDADE - SERVIÇOS REALIZADOS</TableTitle>
            </TableColumn>

            <TableColumn>
              <TableTitle>PEÇAS TROCADAS</TableTitle>
            </TableColumn>
          </TableHeader>

          <TableBody>
            <TableColumn>
              {servicos.length === 0 ? (
                <ItemRow>
                  <span>-</span>
                  <span>R$ 0.00</span>
                </ItemRow>
              ) : (
                servicos.map((item, index) => (
                  <ItemRow key={`${getDescricaoItem(item)}-${index}`}>
                    <div>
                      <span>{getQuantidadeItem(item)} - </span>
                      <span>{getDescricaoItem(item)}</span>
                    </div>

                    <span>R$ {getSubtotalItem(item).toFixed(2)}</span>
                  </ItemRow>
                ))
              )}
            </TableColumn>

            <TableColumn>
              {pecas.length === 0 ? (
                <ItemRow>
                  <span>-</span>
                  <span>R$ 0.00</span>
                </ItemRow>
              ) : (
                pecas.map((item, index) => (
                  <ItemRow key={`${getDescricaoItem(item)}-${index}`}>
                    <div>
                      <span>{getQuantidadeItem(item)} - </span>
                      <span>{getDescricaoItem(item)}</span>
                    </div>

                    <span>R$ {getSubtotalItem(item).toFixed(2)}</span>
                  </ItemRow>
                ))
              )}
            </TableColumn>
          </TableBody>
        </TableSection>

        <TotalBox>
          <strong>TOTAL</strong>
          <span>R$ {Number(os.valorServico ?? 0).toFixed(2)}</span>
        </TotalBox>

        <ObservacoesBox>
          <TableTitle>OBSERVAÇÕES</TableTitle>
          <p>{os.obs || "-"}</p>
        </ObservacoesBox>

        <Footer>
          <div>
            <FieldLabel>Data de vencimento da OS:</FieldLabel>
            <FieldValue>{formatDate(os.dataVencimento)}</FieldValue>
          </div>

          <SignatureBox>
            <p>
              Recebemos todos os serviços prestados e iremos realizar o pagamento
              referente à OS Nº {os.id} prestado a nós.
            </p>

            <SignatureLine />
            <span>Assinatura do cliente</span>
          </SignatureBox>
        </Footer>
      </PrintPage>
    );
  }
);

OsPrint.displayName = "OsPrint";