# Brief de demonstração — Murakami Beauty

Este documento reúne os dados usados no site fictício do Murakami Beauty. Ele separa o que já está versionado no sistema de agendamentos das decisões criadas apenas para a demonstração pública.

## Integração ativa com o Supabase

- Site fixado na empresa `10` por `SUPABASE_COMPANY_ID`.
- Catálogo, preços, durações e profissionais carregados em tempo real por RPC pública segura.
- Horários calculados pela jornada, intervalo, ausências, bloqueios e agendamentos já existentes.
- Reservas criadas no Supabase com validação transacional e chave de idempotência.
- Área do cliente conectada para consultar, confirmar, cancelar e reagendar a reserva do dispositivo.
- Acesso do cliente protegido por token UUID em cookie `HttpOnly`; o token não é exposto no JSON do navegador.
- A API pública não recebe acesso direto às tabelas e não utiliza `service_role`.
- Pagamento e envio efetivo de WhatsApp/e-mail continuam em modo de demonstração.

## Dados confirmados no sistema

- Empresa: Murakami Beauty.
- Identificador da empresa no ambiente de testes: `10`.
- Fuso horário: `America/Sao_Paulo`.
- Jornada padrão: segunda a sábado, das 08:00 às 19:00.
- Intervalo padrão: 12:00 às 13:00.
- Profissionais da carga demo: Beatriz Costa, Diego Martins, Larissa Nunes, Camila Prado, Fernanda Reis e Marcos Vieira.
- Serviços referenciados nas migrations: Corte feminino, Manicure e Maquiagem social.
- Valores personalizados referenciados: Corte feminino por R$ 85, Manicure por R$ 50 e Maquiagem social por R$ 170.
- Formas de pagamento disponíveis: dinheiro, Pix, cartão de débito e cartão de crédito em até 12 parcelas.
- A operação demo contém mais de 20 clientes fictícios, seis profissionais e mais de 70 agendamentos simulados.
- O sistema já contempla agenda simultânea, multisserviço, sinal, consentimentos de comunicação, ausências e diferentes origens de agendamento.

## Identidade criada para o site fictício

- Nome comercial: Murakami Beauty.
- Razão social fictícia: Murakami Beauty Serviços de Beleza Ltda.
- Documento fictício: 00.000.000/0001-00.
- Símbolo: monograma tipográfico `M`.
- Paleta: vinho profundo, ameixa, rosa queimado, cobre suave e marfim.
- Estilo: contemporâneo, acolhedor, sofisticado e sem excessos.
- Slogan: “Beleza que respeita quem você é.”

## Contatos fictícios

- Telefone e WhatsApp: (11) 90000-0010.
- E-mail: contato@murakamibeauty.example.
- Endereço: Alameda das Flores, 110 — Jardins — São Paulo/SP — CEP 01400-000.
- Instagram: @murakamibeauty.
- Domínio reservado para testes: `murakamibeauty.example`.
- Domínio desejado para uma entrega real: `murakamibeauty.com.br`, sujeito à disponibilidade e registro.

## Catálogo usado no site

| Serviço | Duração | Valor inicial | Origem |
| --- | ---: | ---: | --- |
| Corte feminino | 50 min | R$ 85 | Valor personalizado da carga demo |
| Manicure | 45 min | R$ 50 | Valor personalizado da carga demo |
| Maquiagem social | 75 min | R$ 170 | Valor personalizado da carga demo |
| Escova e finalização | 45 min | R$ 90 | Conteúdo complementar fictício |
| Design de sobrancelhas | 40 min | R$ 65 | Conteúdo complementar fictício |
| Hidratação capilar | 60 min | R$ 120 | Conteúdo complementar fictício |

## Regras definidas para a demonstração

- Sinal: 25% do valor do serviço, abatido integralmente no atendimento.
- Cancelamento gratuito: até 24 horas antes.
- Reagendamento: até 24 horas antes, mantendo o sinal.
- Cancelamento fora do prazo: sinal retido, salvo análise manual.
- Atraso: tolerância de 15 minutos; após esse prazo, o atendimento pode precisar ser adaptado ou reagendado.
- Antecedência mínima para agendar: 2 horas.
- Janela máxima de agendamento: 60 dias.
- Lembretes: WhatsApp e e-mail 24 horas e 2 horas antes.
- Pagamentos: Pix, dinheiro, débito e crédito; o site usa pagamento simulado até a integração com um provedor sandbox.

## Diferenciais e texto institucional

O Murakami Beauty é apresentado como um espaço de beleza no Jardins onde técnica, escuta e cuidado se encontram. A experiência prioriza atendimento personalizado, agenda organizada, profissionais especializados e autonomia para a cliente confirmar, remarcar ou cancelar pela área do cliente.

Diferenciais usados:

- Atendimento com escuta e personalização.
- Profissionais com agenda e especialidades organizadas no sistema.
- Reserva online em poucos minutos.
- Sinal, confirmação e lembretes centralizados.
- Área do cliente para acompanhar todos os horários.

## Perguntas frequentes

### Como funciona o agendamento online?

A cliente escolhe serviço, profissional, data e horário, informa seus dados e confirma o sinal quando ele for exigido.

### Preciso pagar para reservar?

Alguns serviços exigem sinal de 25%, integralmente abatido do valor final.

### Posso cancelar ou reagendar?

Sim. O processo pode ser feito pela Área do Cliente, respeitando o prazo de 24 horas.

### Receberei lembretes?

Sim. A demonstração prevê lembretes por WhatsApp e e-mail 24 horas e 2 horas antes.

## Imagens e autorização

As imagens atuais foram geradas para a demonstração e não representam pessoas, equipe ou instalações reais. Em uma entrega para cliente real, devem ser substituídas por materiais autorizados por escrito.

## Observação de segurança

O levantamento utilizou schema, migrations versionadas e RPCs públicas controladas. Nenhuma informação de clientes foi copiada, e nenhuma chave administrativa do Supabase foi usada para ignorar as políticas de segurança. As reservas de validação `MK000220` e `MK000221` foram canceladas ao final dos testes para liberar os horários.
