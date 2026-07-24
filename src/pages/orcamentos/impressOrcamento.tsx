import {
  PrintGlobalStyle,
  PrintPage,
  PrintHeader,
  BrandBlock,
  DocumentTitle,
  DocumentMeta,
  Section,
  SectionTitle,
  InfoGrid,
  InfoItem,
  Label,
  Value,
  TextBox,
  Footer,
} from './impressOrcamentoStyled'
import logo from '../../assets/logo-print.jpg';
import type { OrcamentoType } from '../../models/orcamento';
import type { ClienteType } from '../../models/cliente';

type ImpressOrcamentoProps = {
  orcamento?: OrcamentoType | null
  cliente?: ClienteType | null
}

export function ImpressOrcamento({ orcamento, cliente }: ImpressOrcamentoProps) {
  const hoje = new Date().toLocaleDateString('pt-BR')

    function renderTextWithBold(text?: string) {
        if (!text) return '-'

        const parts = text.split(/(\*\*.*?\*\*)/g)

        return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>
        }

        return <span key={index}>{part}</span>
        })
    }

  return (
    <>
      <PrintGlobalStyle />

      <PrintPage>
        <PrintHeader>
          <BrandBlock>
            <img src={logo} alt="Logo da retífica" />
          </BrandBlock>

          <DocumentMeta>
            <DocumentTitle>Orçamento #{orcamento?.id}</DocumentTitle>
            <span>Emitido em {hoje}</span>
          </DocumentMeta>
        </PrintHeader>

        <Section>
          <SectionTitle>Dados do cliente</SectionTitle>

          <InfoGrid>
            <InfoItem>
              <Label>Motor</Label>
              <Value>{orcamento?.motor || '-'}</Value>
            </InfoItem>

            <InfoItem>
              <Label>Cliente</Label>
              <Value>{cliente?.cliente || '-'}</Value>
            </InfoItem>
          </InfoGrid>
        </Section>

        <Section>
          <SectionTitle>Serviços / peças</SectionTitle>
          <TextBox>{renderTextWithBold(orcamento?.orcamento) || 'Nenhuma informação informada.'}</TextBox>
        </Section>

        <Section>
          <SectionTitle>Observações</SectionTitle>
          <TextBox>{renderTextWithBold(orcamento?.obs) || 'Sem observações.'}</TextBox>
        </Section>
        <Footer>Documento gerado automaticamente pelo sistema.</Footer>
      </PrintPage>
    </>
  )
}
