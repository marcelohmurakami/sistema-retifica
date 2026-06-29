import styled, { createGlobalStyle } from "styled-components";

export const PrintGlobalStyle = createGlobalStyle`
  @media print {
    body * {
      visibility: hidden !important;
    }

    .recibo-print-area,
    .recibo-print-area * {
      visibility: visible !important;
    }

    .recibo-print-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      box-shadow: none !important;
    }

    @page {
      size: A4;
      margin: 12mm;
    }
  }
`;

export const ReceiptIconButton = styled.button`
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  background: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #1d4ed8;
  }
`;

export const ReceiptBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding: 32px;
  background: rgba(15, 23, 42, 0.72);
  overflow: auto;

  @media print {
    position: static;
    padding: 0;
    background: #ffffff;
  }
`;

export const CloseButton = styled.button`
  position: fixed;
  top: 20px;
  right: 24px;
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  background: #ef4444;
  font-weight: 700;
  cursor: pointer;

  @media print {
    display: none;
  }
`;

export const ReceiptPage = styled.div`
  width: 794px;
  min-height: 1123px;
  margin: 0 auto;
  padding: 44px;
  box-sizing: border-box;
  background: #ffffff;
  color: #172033;
  font-family: Arial, sans-serif;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
`;

export const ReceiptHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 24px;
  margin-bottom: 28px;
  border-bottom: 3px solid #2563eb;
`;

export const BrandArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 26px;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }
`;

export const ReceiptTitleArea = styled.div`
  text-align: right;
`;

export const ReceiptTitle = styled.h1`
  margin: 0;
  font-size: 34px;
  color: #2563eb;
`;

export const ReceiptNumber = styled.span`
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
`;

export const AmountBox = styled.div`
  padding: 24px;
  margin-bottom: 30px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
`;

export const AmountLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
`;

export const AmountValue = styled.strong`
  display: block;
  color: #0f172a;
  font-size: 38px;
`;

export const ReceiptSection = styled.section`
  margin-bottom: 26px;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 12px;
  color: #0f172a;
  font-size: 14px;
  text-transform: uppercase;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

export const InfoBox = styled.div`
  padding: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
`;

export const Label = styled.span`
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
`;

export const Value = styled.strong`
  display: block;
  color: #111827;
  font-size: 15px;
`;

export const DescriptionBox = styled.div`
  min-height: 150px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

export const SignatureArea = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 42px;
  margin-top: 76px;
`;

export const SignatureBox = styled.div`
  padding-top: 12px;
  text-align: center;
  border-top: 1px solid #94a3b8;

  span {
    color: #475569;
    font-size: 13px;
  }
`;

export const ReceiptFooter = styled.footer`
  margin-top: 42px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
`;