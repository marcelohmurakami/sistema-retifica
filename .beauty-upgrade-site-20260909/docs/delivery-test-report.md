# Relatório de homologação

Data: 9 de setembro de 2026  
Ambiente: site local + Supabase vinculado + Mercado Pago sandbox

## Resultado automatizado

- `npm run test`: regras unitárias de pagamento, Pix, reagendamento e fuso.
- `npm run test:e2e`: Chrome desktop e Pixel 7, com 18 cenários.
- `npm run lint` e `npm run build`: qualidade estática e build de produção.
- `npm audit`: dependências de produção e desenvolvimento.
- `supabase/tests/*.sql`: testes transacionais; todos terminam com `ROLLBACK`.

## Cenários cobertos

- Login real com usuário temporário em desktop e celular.
- Validação de cadastro sem reserva e campos inválidos.
- Agendamento sem sinal: criação, confirmação idempotente, reagendamento e cancelamento.
- Duas requisições simultâneas para o mesmo profissional/horário: um sucesso e um conflito.
- Agendamento com sinal de R$ 1 no sandbox.
- Pagamento aprovado, recusado, divergente, tardio, expirado, estornado e em disputa por testes transacionais.
- Webhook assinado repetido e webhook sem assinatura.
- Cancelamento dentro/fora do prazo, retenção e solicitação idempotente de estorno.
- Lembretes programados sem duplicação e cancelados junto do agendamento.
- Isolamento real por RLS entre dois clientes e entre duas empresas.
- Links expirados e limite de uso.
- Datas e horas no fuso da empresa, independentemente do navegador.
- Rede lenta, estados de carregamento e erros de API.
- Teclado, skip link, nomes acessíveis, contraste WCAG AA e auditoria axe.
- HTTP 404, title, description, canonical, Open Graph e JSON-LD `BeautySalon`.
- Cópia/restauração lógica de dados em tabelas temporárias com comparação de contagem e hash.

## Pendências externas para liberar produção

- O Mercado Pago ainda está em sandbox. A cobrança real de R$ 1 exige credenciais de produção e confirmação do pagamento pelo responsável.
- O projeto Supabase está no plano Free, que não oferece backups programados. Um restore completo precisa ser ensaiado em outro projeto/banco, nunca sobre o banco atual.
- A proteção do Supabase contra senhas vazadas está desativada e deve ser habilitada antes do lançamento, se disponível no plano.
- A fila impede lembretes duplicados, mas a entrega efetiva por WhatsApp/e-mail depende do workflow n8n que ainda será publicado.

## Comandos de repetição

```powershell
npm run test
npm run test:e2e
npm run lint
npm run build
npm audit
npx supabase db query --linked --file supabase/tests/delivery_security_isolation.sql
```
