import styled, { createGlobalStyle } from 'styled-components'

export const PrintGlobalStyle = createGlobalStyle`
  .area-orcamento-impressao {
    position: fixed;
    left: -10000px;
    top: 0;
    width: 794px;
    min-height: 1123px;
    background: #ffffff;
    pointer-events: none;
  }

  @media print {
    body * {
      visibility: hidden !important;
    }

    .area-orcamento-impressao,
    .area-orcamento-impressao * {
      visibility: visible !important;
    }

    .area-orcamento-impressao {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      min-height: auto;
      pointer-events: auto;
    }

    @page {
      size: A4;
      margin: 12mm;
    }
  }
`

export const PrintPage = styled.div`
  width: 794px;
  min-height: 1123px;
  padding: 42px;
  color: #1f2937;
  font-family: Arial, sans-serif;
  background: #ffffff;
  box-sizing: border-box;
`

export const PrintHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  margin-bottom: 28px;
  border-bottom: 3px solid #2563eb;
`

export const BrandBlock = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 14px;

  img {
    width: 180px;
    max-width: 180px;
    height: auto;
    object-fit: contain;
    display: block;
  }

  span {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }
`

export const DocumentMeta = styled.div`
  text-align: right;
  color: #64748b;
  font-size: 13px;
`

export const DocumentTitle = styled.h1`
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 28px;
`

export const Section = styled.section`
  margin-bottom: 24px;
`

export const SectionTitle = styled.h2`
  margin: 0 0 10px;
  color: #111827;
  font-size: 14px;
  text-transform: uppercase;
`

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

export const InfoItem = styled.div`
  padding: 13px 15px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
`

export const Label = styled.span`
  display: block;
  margin-bottom: 5px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
`

export const Value = styled.strong`
  display: block;
  color: #111827;
  font-size: 15px;
  line-height: 1.4;
`

export const TextBox = styled.div`
  min-height: 120px;
  padding: 15px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
`

export const SignatureRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 36px;
  margin-top: 68px;
`

export const SignatureBox = styled.div`
  padding-top: 12px;
  text-align: center;
  color: #475569;
  font-size: 13px;
  border-top: 1px solid #94a3b8;
`

export const Footer = styled.footer`
  margin-top: 42px;
  padding-top: 14px;
  color: #94a3b8;
  font-size: 11px;
  text-align: center;
  border-top: 1px solid #e2e8f0;
`