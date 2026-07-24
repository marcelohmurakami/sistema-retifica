import styled from "styled-components"

export const PrintPage = styled.div`
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  color: #000;
  padding: 12mm;
  box-sizing: border-box;
  font-family: Arial, sans-serif;

  @media print {
    width: 100%;
    min-height: auto;
    margin: 0;
    padding: 0;
  }
`

export const Header = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 0;
  border-bottom: 1px solid #000;
  padding-bottom: 12px;
`

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  padding: 15px 0 0 60px;
`

export const HeaderRight = styled.div`
  text-align: left;
  max-width: 220px;
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

export const LogoBox = styled.div`
  align-self: center;
  img {
    max-width: 60%;
    max-height: 60%;
    object-fit: cover;
  }
`

export const CompanyInfo = styled.p`
  margin: 0 15px;
  font-size: 12.5px;
  font-weight: bold;
`

export const CompanySocial = styled.p`
  margin: 0 10px;
  font-size: 12.5px;
  font-weight: 700;
`

export const Title = styled.h2`
  font-size: 16px;
  margin: 12px 0;
  font-weight: 800;
  text-align: center;
`

export const Section = styled.div`
  border-bottom: 1px solid #000;
  padding: 10px 0;
`

export const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`

export const FieldRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  align-items: baseline;
  font-size: 11px;
`

export const FieldLabel = styled.span`
  font-weight: 700;
  font-size: 12px;
`

export const FieldValue = styled.span`
  border-bottom: 1px dotted #555;
  flex: 1;
  min-height: 16px;
  font-size: 12px;
  margin-left: 6px;
`

export const MotorSection = styled.div`
  border-bottom: 1px solid #000;
  padding: 10px 0;
`

export const TableSection = styled.div`
  border-bottom: 1px solid #000;
`

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #000;
`

export const TableBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 180px;
`

export const TableColumn = styled.div`
  padding: 8px;
  min-height: 100%;
  
  &:first-child {
    border-right: 1px solid #000;
  }
`

export const TableTitle = styled.h3`
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  margin: 0 0 8px;
`

export const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 3px;
  font-size: 11px;
`

export const TotalBox = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  border-bottom: 1px solid #000;
  padding: 10px 0;
  font-size: 14px;
`

export const ObservacoesBox = styled.div`
  min-height: 100px;
  border-bottom: 1px solid #000;
  padding: 10px 0;
  font-size: 11px;
  font-weight: bold;

  p {
    margin: 0;
    min-height: 60px;
  }
`

export const Footer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 20px;
  padding-top: 14px;
`

export const SignatureBox = styled.div`
  text-align: center;

  p {
    margin: 0 0 30px;
    font-size: 11px;
    line-height: 1.4;
  }

  div {
    font-size: 11px;
    display: flex;
    flex-direction: column;
  }
`

export const SignatureLine = styled.div`
  border-bottom: 1px solid #000;
  margin-bottom: 6px;
`
