# Panorama geral classificado por plano

## Legenda

- `[BÁSICO • LITE • COMPLETO]`: disponível em todos os planos.
- `[LITE • COMPLETO]`: disponível a partir do Plano Lite.
- `[COMPLETO]`: exclusivo do Plano Completo.
- Etiquetas com observações indicam quando o recurso existe em mais de um plano, mas com níveis diferentes.

## Funcionalidades

- [BÁSICO • LITE • COMPLETO] Cadastro de clientes
- [LITE • COMPLETO] Cadastro de fornecedores
- [LITE • COMPLETO] Cadastro de produtos
- [BÁSICO • LITE • COMPLETO] Cadastro de serviços (Nome, valor, duração média, tempo de intervalo, profissionais habilitados, necessidade de pagamento ou sinal antecipado)
- [LITE • COMPLETO] Cadastro de funcionários (especialidades, serviços prestados, comissão, jornada de trabalho, folgas, férias, horários agendados)

!image.png

- [BÁSICO • LITE • COMPLETO — recursos avançados no COMPLETO] Agendamento de horários (marcar por conta, cliente marcar, desmarcar, cancelar, alterar, consultar, visualização diaria semanal e mensal, bloqueio por conflito de horários, listas de espera, status do agendamento (aguardando confirmação, confirmado, em atendimento, finalizado, no show, cancelado), receber agendamentos diretamente do site)
- [BÁSICO • LITE • COMPLETO — individual no BÁSICO e por funcionário no LITE/COMPLETO] Configuração completa de disponibilidade de agendamentos (jornada de trabalho e dias, feriados, ferias de funcionarios, etc…)
- [BÁSICO • LITE • COMPLETO] Status de cada agendamento (cliente, serviço a ser prestado, horário, status pagamento
- [LITE • COMPLETO] Controle de estoque
- [LITE • COMPLETO] Controle de caixa e finanças
- [COMPLETO] Cálculo de comissões
- [BÁSICO • LITE • COMPLETO — nível conforme o plano] Configurações gerais
- [LITE • COMPLETO — permissões personalizadas no COMPLETO] Diferenciar os usuarios (admins, funcionarios, dono, etc…)
- [LITE: mensagens manuais • COMPLETO: mensagens automáticas] Confirmações e recados (confirmações no whatsapp e email automaticas, como lembrete de agendamento, cancelamento ou alterações).
- [COMPLETO] Página de orçamentos
- [LITE • COMPLETO] Financeiro (contas a receber e pagar)
- [BÁSICO: básicos • LITE: financeiros básicos • COMPLETO: avançados] Relatórios
- [TODOS internamente • COMPLETO para consulta detalhada] Auditoria
- [LITE • COMPLETO] Comanda com todos os serviços e produtos do serviço do cliente (status de pagamentos)

## Diferenciais

- [COMPLETO] Lista de espera com preenchimento e mensagem automatica em caso de cancelamentos
- [COMPLETO] Mensagem automática para clientes inativos
- [COMPLETO] Mensagem automática no aniversário de clientes.
- [COMPLETO] Sistema de avaliação do serviço
- [BÁSICO: básico • LITE: gerencial • COMPLETO: avançado] Dashboard profissional
- [COMPLETO] Integração com google calendar
- [COMPLETO] App para os funcionários consultarem agenda
- [COMPLETO] Dominio próprio

## Regras de negócio

### FIXAS

- [BÁSICO • LITE • COMPLETO] Uma empresa nunca acessa os dados da outra
- [BÁSICO • LITE • COMPLETO] Um agendamento nunca pode ser feito após o horário atual.
- [BÁSICO • LITE • COMPLETO] Um pagamento não pode ter total inválido
- [COMPLETO] Gerar comissão quando atendimento é finalizado
- [LITE • COMPLETO] Baixar estoque quando o produto der como vendido
- [BÁSICO • LITE • COMPLETO] Dois profissionais podem atender ao memso tempo, mas um profissional nao pode ter dois serviços ao mesmo tempo

### CONFIGURÁVEIS (TÓPICOS SENSÍVEIS PEDIR CONFIRMAÇÃO)

- [LITE • COMPLETO] Permitir encaixe? boolean
- [BÁSICO • LITE • COMPLETO] Antecedencia mínima para cancelar? numeric
- [BÁSICO • LITE • COMPLETO] Prazo mínimo e máximo para agendar?
- [COMPLETO] Permitir agendamento recorrente?
- [LITE • COMPLETO] Permitir escolha do profissional.
- [LITE • COMPLETO] Permitir “qualquer profissional”.
- [LITE • COMPLETO] Permitir mais de um serviço.
- [COMPLETO] Permitir mais de um profissional no mesmo atendimento.
- [COMPLETO] Exigir sinal? boolean (if true, qual porcentagem?)
- [COMPLETO] Diferente tipos de comissão por serviço
- [LITE • COMPLETO] Tempo de tolerância para atraso.
- [BÁSICO • LITE • COMPLETO] Prazo mínimo.
- [LITE • COMPLETO] Limite de reagendamentos.
- [COMPLETO] Cobrar multa.
- [COMPLETO] Perder ou devolver o sinal.
- [COMPLETO] Transformar sinal em crédito.
- [LITE • COMPLETO] Exigir justificativa.
- [LITE • COMPLETO] Quem pode ignorar a política.
- [LITE: manual • COMPLETO: automático] Notificar profissional e cliente.
- [COMPLETO] Valor fixo ou percentual.
- [COMPLETO] Regra geral ou por serviço.
- [COMPLETO] Prazo para pagamento.
- [COMPLETO] Reserva temporária do horário.
- [COMPLETO] Cancelamento automático se não houver pagamento.
- [COMPLETO] Reembolso ou crédito após cancelamento.
- [TODOS internamente • COMPLETO para consulta detalhada] REGISTRAR TUDO NA AUDITORIA

## Backlog (resolução de problemas)

### SIMPLES / GERAIS

- [BÁSICO • LITE • COMPLETO] Usuário entra no sistema e consegue recuperar e alterar sua senha e dados
- [BÁSICO • LITE • COMPLETO] Usuário consegue visualizar todos os atendimentos do dia de hoje, da semana e do mês
- [BÁSICO • LITE • COMPLETO] A recepcionista consegue filtrar os horários marcados por profissional
- [BÁSICO • LITE • COMPLETO] A recepcionista consegue encontrar um cliente pesquisando por seu nome
- [BÁSICO • LITE • COMPLETO] A recepcionista consegue cadastrar um cliente enquanto está agendando um horário
- [BÁSICO • LITE • COMPLETO] A recepcionista consegue, com facilidade, reagendar um horário de um agendamento prévio com confirmação necessária se violar a política de agendamento da empresa
- [COMPLETO] O cliente consegue, com facilidade, reagendar seu horário de acordo com as políticas da empresa de antecedencia
- [BÁSICO • LITE: pela empresa • COMPLETO: pela empresa ou cliente] A recepcionista e cliente conseguem cancelar um agendamento, se estiverem dentro do prazo estipulado.
- [LITE: confirmação manual • COMPLETO: confirmação online] Cliente ou usuário confirmar presença (check in) 12 horas antes do serviço
- [BÁSICO • LITE • COMPLETO] Profissional ou gerente conseguir bloquear um horário específico por motivos pessoais
- [BÁSICO • LITE • COMPLETO] Usuários conseguem adicionar observações no cadastro de seus clientes
- [BÁSICO • LITE • COMPLETO] Usuários conseguem registrar quando o cliente chegou no salão e o atendimento foi finalizado
- [LITE • COMPLETO] Fechar a comanda com serviço
- [LITE • COMPLETO] Recepcionista pode fechar a comanda com o valor total recebido e o valor ir para o caixa.
- [LITE: básico • COMPLETO: avançado] O usuário consegue ter o controle do caixa, DRE e resultados.
- [BÁSICO • LITE • COMPLETO] O sistema automaticamente bloqueia horários de um profissional quando o dono atualiza uma folga, intervalos ou férias.

### COMPLEXOS MAS VAI PROFISSIONAIS E ÚTEIS

- [LITE • COMPLETO] Gerente quer cadastrar um funcionário de forma rápida, simples, visual e fácil
- [LITE • COMPLETO] Recepcionista quer fechar uma comanda, onde foi feito dois serviços diferentes com a aquisição de um produto, quer pagar metade no pix e a outra metade no cartão
- [LITE • COMPLETO] Recepcionista quer fechar uma comanda onde parte do pagamento foi feito, e o restante será marcado fiado na qual será registrado nas contas a receber do sistema
- [COMPLETO] Cliente quer agendar um horário no mesmo dia com profissionais diferentes para fazer as unhas e cortar o cabelo, tudo na mesma comanda.
- [COMPLETO] Dono quer ter controle do dia e o sistema automaticamente irá mandar mensagens automaticas para os clientes confirmado a presença no dia do serviço.
- [LITE • COMPLETO] Cliente quer pagar mais do que o combinado e deixar o valor restante em haver para o próximo serviço, a recepcionista consegue colocar o valor pago maior do que o valor do serviço e o crédito fica automaticamente registrado no cadastro do cliente
- [COMPLETO] Cliente quer um horário e dia fixo, a cada duas semanas. O profissional consegue bloquear os horários e deixar agendado o horário recorrente
- [COMPLETO] Um profissional ficou doente e precisa reagendar todos seus clientes, o sistema consegue identificar todos os clientes afetados e mandar uma mensagem para eles informando.
- [COMPLETO] O usuário consegue disparar um aviso de falta ou ausencia em cima da hora e cancelar um dia ou periodo de serviço.
- [COMPLETO] Um cliente cancelou o horário das 14h. Existem três pessoas aguardando uma vaga. O sistema deve enviar o convite para as pessoas em espera. (por ordem, definir um prazo de resposta, caso contrário o convite será redirecionado para o próximo da lista)

## DONO

- [BÁSICO • LITE • COMPLETO] Consegue alterar logo do sistema e mudar as informações principais da empresa (endereço, horários de funcionamento, contato, redes sociais)
- [BÁSICO • LITE • COMPLETO] Cadastrar, alterar, modificar e deletar serviços e seus valores
- [LITE • COMPLETO] Cadastrar funcionários novos
- [BÁSICO: profissionais básicos • LITE • COMPLETO: funcionários] Definir a carga de trabalho de cada funcionário, assim como suas férias, folgas e intervalo.
- [BÁSICO • LITE • COMPLETO] Configurar regras de cancelamento
- [BÁSICO • LITE • COMPLETO] Configurar regras de reagendamento
- [COMPLETO] Configurar necessidade de sinal, e caso sim a porcentagem (que será aplicada para todos os serviços, caso algum serviço em específico seja diferente, poderá ser modificado no cadastro do serviço em si)
- [LITE • COMPLETO] Criar e deletar usuários (funcionários) para acessar o sistema
- [LITE • COMPLETO] Consultar débitos e créditos de cliente

## RECEPÇÃO

- [BÁSICO • LITE • COMPLETO] Conseguir ver um panorama geral do dia (quem confirmou horário, quem não confirmou, etc…)
- [LITE • COMPLETO] Caso um cliente não tenha confirmado, habilitar um botão para mandar uma mensagem no zap manualmente confirmando a presença do cliente
- [BÁSICO • LITE • COMPLETO] Identificar atrasos caso não esteja confirmado que o cliente chegou
- [BÁSICO • LITE • COMPLETO] Marcar que o cliente chegou
- [BÁSICO • LITE • COMPLETO] Profissional responsável pelo cliente conseguir visualizar que seu cliente chegou, se ainda não chegou ou se chegou mas ainda não foi atendido no horário
- [BÁSICO • LITE • COMPLETO] Agendar com qualquer profissional disponível
- [BÁSICO • LITE • COMPLETO] Alterar profissional sem mudar o horário
- [BÁSICO • LITE • COMPLETO] Alterar horário sem alterar profissional
- [LITE • COMPLETO] Adicionar serviço dentro de um agendamento já existente
- [BÁSICO • LITE • COMPLETO] Registrar no show
- [LITE • COMPLETO] Registrar encaixe
- [LITE • COMPLETO] Consultar débitos e créditos de cliente

## PROFISSIONAL

- [BÁSICO • LITE • COMPLETO] Consultar sua própria agenda
- [BÁSICO • LITE • COMPLETO] Agendar, remarcar e cancelar agendamentos
- [BÁSICO • LITE • COMPLETO] Acessar informações de seu cliente
- [BÁSICO • LITE • COMPLETO] Consutar histórico de atendimentos
- [LITE • COMPLETO] Adicionar, alterar e remover serviços e produtos da comanda do cliente
- [BÁSICO • LITE • COMPLETO] Bloquear um periodo particular
- [BÁSICO/LITE: produção • COMPLETO: produção e comissão] Consultar produção e comissão

## CLIENTE (QUANDO SOLICITADO PLANO)

- [COMPLETO] Selecionar serviço disponível
- [COMPLETO] Selecionar profissional de sua preferência ou qualquer disponível
- [COMPLETO] Visualizar todos os horários disponíveis
- [COMPLETO] Visualizar horários disponíveis de um profissional específico
- [COMPLETO] Criar, confirmar, alterar e cancelar um agendamento sem precisar entrar em contato com a empresa (dentro das regras)
- [COMPLETO] Pagar sinal (quando necessário)
- [COMPLETO] Confirmar presença
- [COMPLETO] Entrar na lista de espera
- [COMPLETO] Consultar próximos agendamentos
- [COMPLETO] Consultar pacotes e sessões restantes
- [COMPLETO] Atualizar dados de contato
- [COMPLETO] Avaliar e dar feedback no pós atendimento

## SISTEMA DE PAGAMENTO

- [COMPLETO] Permitir pagamento de sinal online
- [LITE • COMPLETO] Dividir o pagamento em várias formas (descontando o sinal)
- [LITE • COMPLETO] Registrar pagamento parcial
- [LITE • COMPLETO] Utilizar crédito existente
- [LITE • COMPLETO] Colocar débito na conta
- [COMPLETO] Utilizar sessão de um pacote adquirido
- [COMPLETO] “O atendimento custou R$ 180. O cliente já pagou R$ 30 de sinal e quer pagar R$ 100 no Pix e o restante no cartão.”

## SISTEMA DE COMISSÕES

- [COMPLETO] Configurar comissão por profissional.
- [COMPLETO] Definir comissão diferente por serviço.
- [COMPLETO] Definir comissão para produtos.
- [COMPLETO] Considerar descontos no cálculo.
- [COMPLETO] Visualizar comissão prevista.
- [COMPLETO] Visualizar somente comissão recebida.
- [COMPLETO] Estornar comissão após cancelamento.
- [COMPLETO] Fechar comissões do período.
- [COMPLETO] Registrar pagamento da comissão.
- [COMPLETO] Consultar memória de cálculo.
- [COMPLETO] **Comissão prevista:** criada quando o atendimento é finalizado.
- [COMPLETO] **Comissão liberada:** proporcional ao que foi efetivamente recebido.
- [COMPLETO] **Comissão paga:** quando a empresa faz o repasse ao profissional.
- [COMPLETO] **Comissão estornada:** quando pagamento ou comanda são estornados.
- [COMPLETO] Comissão sobre valor bruto ou após desconto.
- [COMPLETO] Quem absorve o desconto.
- [COMPLETO] Comissão proporcional em pagamento parcial.
- [COMPLETO] Comissão de serviço e produto.
- [COMPLETO] Comissão dividida entre profissionais.
- [COMPLETO] Comissão sobre sinal.
- [COMPLETO] Memória de cálculo imutável.

> [COMPLETO] “O serviço custa R$ 100, recebeu desconto de R$ 10 e o profissional possui comissão de 40%. Confira como a comissão foi calculada.”

## TAREFAS DE ESTOQUE

- [LITE • COMPLETO] Cadastrar produto
- [LITE • COMPLETO] Atualizar quantidade
- [LITE • COMPLETO] Baixar quantidade do estoque quando uma comanda é finalizada
- [LITE • COMPLETO] Identificar produtos com estoque crítico
- [LITE • COMPLETO] Entrada por compra.
- [LITE • COMPLETO] Saída por venda.
- [LITE • COMPLETO] Consumo interno durante serviço.
- [LITE • COMPLETO] Perda ou avaria.
- [LITE • COMPLETO] Ajuste de inventário.
- [LITE • COMPLETO] Devolução.
- [COMPLETO] Transferência entre unidades.
- [LITE • COMPLETO] Estorno de venda.
- [LITE • COMPLETO] Estorno de venda.
- [LITE • COMPLETO] Unidade de medida.
- [LITE • COMPLETO] Estoque mínimo.
- [LITE • COMPLETO] Custo médio.
- [LITE • COMPLETO] Lote e validade, quando aplicável.
- [LITE • COMPLETO] Inventário.
- [LITE • COMPLETO] Histórico da movimentação.
- [COMPLETO] Ficha de consumo do serviço.

## TAREFAS FINANCEIRAS

- [LITE • COMPLETO] Visualizar entrada e saida de caixa
- [LITE • COMPLETO] Visualizar resultado de serviços
- [LITE • COMPLETO] Estorno.
- [LITE • COMPLETO] Sangria e suprimento.
- [LITE • COMPLETO] Diferença no fechamento do caixa.
- [LITE • COMPLETO] Desconto e acréscimo.
- [LITE • COMPLETO] Gorjeta.
- [LITE • COMPLETO] Pagamento parcial.
- [LITE • COMPLETO] Vencimento e baixa.
- [COMPLETO] Recorrência de despesas.
- [COMPLETO] Categoria e centro de custo.
- [LITE • COMPLETO] Anexos de comprovantes.

## TAREFAS DE GESTÃO

- [BÁSICO • LITE • COMPLETO] Quanto faturamos hoje?
- [LITE • COMPLETO] Quanto ainda temos para receber?
- [LITE • COMPLETO] Qual profissional mais faturou?
- [BÁSICO • LITE • COMPLETO] Qual serviço é mais procurado?
- [COMPLETO] Qual horário fica mais ocioso?
- [BÁSICO • LITE • COMPLETO] Quantos clientes faltaram?
- [COMPLETO] Quanto os cancelamentos representam?
- [COMPLETO] Quais clientes estão inativos?
- [LITE • COMPLETO] Qual é o ticket médio?
- [COMPLETO] Quanto será pago em comissão?
- [LITE • COMPLETO] Quais produtos precisam ser comprados?
- [COMPLETO] Qual unidade é mais rentável?
- [BÁSICO: comparação básica • LITE • COMPLETO: detalhada] O faturamento aumentou ou caiu?
- [COMPLETO] Quantos agendamentos vieram pelo link público?

Exemplo:

> [COMPLETO] “Compare o faturamento deste mês com o mês anterior e identifique qual serviço mais contribuiu para a diferença.”

## TAREFAS DE SEGURANÇA

- [LITE • COMPLETO] Criar, editar e desativar usuários.
- [LITE • COMPLETO] Limitar profissional à própria agenda.
- [COMPLETO] Impedir recepcionista de alterar comissão.
- [LITE • COMPLETO] Restringir visualização financeira.
- [COMPLETO] Consultar quem cancelou um agendamento.
- [COMPLETO] Consultar histórico de alteração de preço.
- [COMPLETO] Trocar um funcionário de unidade.
- [LITE • COMPLETO] Revogar acesso de funcionário desligado.
- [BÁSICO • LITE • COMPLETO] Exportar os dados da empresa.
- [BÁSICO • LITE • COMPLETO] Restaurar um registro excluído ou inativado.
- [COMPLETO] Consultar tentativas de acesso e ações sensíveis.

## PLANOS

### Plano BÁSICO

- [BÁSICO] 1 usuário
- [BÁSICO] 3 profissionais
- [BÁSICO • LITE • COMPLETO] Cadastro de clientes.
- [BÁSICO • LITE • COMPLETO] Cadastro de serviços.
- [BÁSICO • LITE • COMPLETO — limitado a 3 no BÁSICO] Cadastro de profissionais (limitado a 3)
- [BÁSICO • LITE • COMPLETO] Agenda diária, semanal e mensal.
- [BÁSICO • LITE • COMPLETO] Agendamento manual.
- [BÁSICO • LITE • COMPLETO] Reagendamento e cancelamento.
- [BÁSICO • LITE • COMPLETO] Bloqueio de horários, folgas e férias.
- [BÁSICO • LITE • COMPLETO — completo a partir do LITE] Histórico básico do cliente.
- [BÁSICO • LITE • COMPLETO — completo a partir do LITE] Histórico básico de atendimentos
- [BÁSICO • LITE • COMPLETO] Registro de atendimento.
- [BÁSICO • LITE • COMPLETO — financeiro completo a partir do LITE] Registro simples de recebimento.
- [BÁSICO • LITE • COMPLETO — avançado conforme o plano] Dashboard básico.

### Plano LITE

- [LITE] 5 usuários
- [LITE] 10 profissionais
- [LITE] Tudo do básico
- [LITE • COMPLETO — limitado a 10 no LITE] Cadastro de funcionários (limitado a 10).
- [LITE • COMPLETO] Agenda por profissional.
- [LITE • COMPLETO] Serviços permitidos por profissional.
- [LITE • COMPLETO] Jornada e disponibilidade individual.
- [LITE • COMPLETO] Agendamento com vários serviços.
- [LITE • COMPLETO] Status do atendimento.
- [LITE • COMPLETO] Comandas.
- [LITE • COMPLETO] Várias formas de pagamento.
- [LITE • COMPLETO] Abertura e fechamento de caixa.
- [LITE • COMPLETO] Contas a pagar e receber.
- [LITE • COMPLETO] Controle financeiro.
- [LITE • COMPLETO] Controle de estoque.
- [LITE • COMPLETO] Produtos e fornecedores.
- [LITE • COMPLETO] Histórico completo do cliente.
- [LITE • COMPLETO — avançados no COMPLETO] Relatórios financeiros básicos.
- [LITE • COMPLETO — personalizadas no COMPLETO] Permissões básicas de acesso.
- [LITE • COMPLETO — automáticas no COMPLETO] Lembretes e confirmações manuais pelo WhatsApp.

### Plano COMPLETO

- [COMPLETO] Usuários ilimitados
- [COMPLETO] Profissionais ilimitados
- [COMPLETO] Tudo do LITE
- [COMPLETO] Site profissional integrado sem taxa de adesão
- [COMPLETO] Agendamento online pelo cliente.
- [COMPLETO] Link e QR Code para agendamento.
- [COMPLETO] Agendamento pelo site ou aplicativo.
- [COMPLETO] Confirmações e lembretes automáticos.
- [COMPLETO] Reagendamento e cancelamento pelo cliente.
- [COMPLETO] Lista de espera.
- [COMPLETO] Preenchimento de horários cancelados.
- [COMPLETO] Cálculo de comissões.
- [COMPLETO] Regras diferentes por profissional, serviço e produto.
- [COMPLETO] Pacotes de serviços e controle de sessões.
- [COMPLETO] Assinaturas e mensalidades.
- [COMPLETO] Avaliação pós-atendimento.
- [COMPLETO] Relatórios e dashboards avançados.
- [COMPLETO] Metas por profissional.
- [COMPLETO] Permissões personalizadas.
- [COMPLETO] Auditoria das alterações.
