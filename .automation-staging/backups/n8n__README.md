# Automações WhatsApp (n8n + Evolution + Supabase)

Estes workflows são modelos importáveis e nascem **desativados**. Eles usam a
instância nova `estudos-whatsapp`; nenhum segredo e nenhum telefone real fica
versionado.

## Arquivos

- `workflows/01-whatsapp-queue-sender.json`: reserva somente itens WhatsApp da
  fila, envia pela Evolution e registra sucesso/erro no Supabase.
- `workflows/02-evolution-inbound-and-receipts.json`: recebe o webhook único da
  Evolution, encaminha mensagens ao chatbot e aplica confirmações de
  entrega/leitura de forma idempotente.
- `workflows/03-marketing-lifecycle-scheduler.json`: avalia regras de aniversário,
  retorno e reativação; somente enfileira mensagens elegíveis.
- `workflows/04-post-service-survey-recovery.json`: recupera solicitações de
  avaliação que não tenham sido geradas pelo gatilho do banco.

Campanhas são criadas/publicadas pelo sistema web. A fila, as confirmações de
entrega/leitura e a atribuição de agendamentos alimentam os resultados exibidos
na tela de Marketing.

Valide os arquivos antes de importar:

```bash
node n8n/validate-workflows.mjs
```

## Variáveis do serviço n8n (EasyPanel)

Defina no contêiner do n8n, nunca dentro dos arquivos JSON:

```text
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SEGREDO_SOMENTE_DO_SERVIDOR
EVOLUTION_API_URL=https://evolution.murakamitech.tech
EVOLUTION_API_KEY=SEGREDO_DA_EVOLUTION
EVOLUTION_INSTANCE=estudos-whatsapp
EVOLUTION_WEBHOOK_SECRET=SEGREDO_ALEATORIO_DE_32_OU_MAIS_CARACTERES
WHATSAPP_COMPANY_ID=10
N8N_QUEUE_BATCH_SIZE=5
EVOLUTION_SEND_DELAY_MS=1200
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

`SUPABASE_SERVICE_ROLE_KEY` ignora RLS. Ela deve existir exclusivamente no
servidor do n8n/Supabase e jamais no Vite, navegador, repositório ou mensagem de
suporte. Se a instalação do n8n bloquear `$env` por política, prefira migrar os
headers para credenciais criptografadas do n8n em vez de colar as chaves em cada
nó.

## Pré-requisitos de banco e funções

Aplicar a migration `20260922100000_marketing_whatsapp_foundation.sql` e publicar
as Edge Functions `whatsapp-bot` e `marketing-ai`. Os contratos usados são:

```text
n8n_reservar_mensagens_whatsapp(p_limite)
n8n_registrar_resultado_mensagem(p_id_mensagem, p_status, p_identificador_externo, p_erro)
n8n_registrar_evento_evolution(p_id_empresa, p_instancia_evolution, p_identificador_externo, p_evento, p_payload, p_assinatura_valida)
n8n_processar_automacoes_marketing(p_limite)
n8n_listar_agendamentos_para_avaliacao(p_limite)
n8n_criar_solicitacao_avaliacao(p_id_empresa, p_id_agendamento)
```

O worker usa deliberadamente `n8n_reservar_mensagens_whatsapp`; não troque pelo
RPC legado sem filtro de canal.

## Instalação segura

1. Importe os quatro JSONs e mantenha todos inativos.
2. Gere um segredo URL-safe (`A-Z`, `a-z`, `0-9`, `_` e `-`) de no mínimo 32
   caracteres. Defina-o em
   `EVOLUTION_WEBHOOK_SECRET` e troque
   `evolution-whatsapp-REPLACE_WITH_32_RANDOM_CHARS` por
   `evolution-whatsapp-SEU_SEGREDO`. O primeiro nó rejeita a requisição se nem
   o caminho secreto nem o header `x-webhook-secret` coincidirem.
3. Na instância `estudos-whatsapp`, configure a URL de produção exibida pelo n8n
   (`https://SEU-N8N/webhook/evolution-whatsapp-SEU_SEGREDO`) e habilite apenas
   `MESSAGES_UPSERT` e `MESSAGES_UPDATE`. Se a sua Evolution permitir header
   personalizado, use `x-webhook-secret` e um caminho aleatório independente.
   Nunca remova as duas validações ao mesmo tempo.
4. Não aponte a instância antiga. O normalizador aceita exatamente
   `estudos-whatsapp` (ou o valor de `EVOLUTION_INSTANCE`).
5. Ative primeiro o webhook, depois os dois schedulers e, por último, o sender.

Desative qualquer workflow antigo que chame as rotas
`/api/integrations/n8n/claim` ou `/api/integrations/n8n/inbound`. Elas pertencem
ao contrato anterior; executar os dois pipelines em paralelo pode reservar ou
responder a mesma mensagem duas vezes.

Os workflows não salvam execuções de sucesso/erro para reduzir retenção de
telefone e texto. Use uma execução manual apenas com dados fictícios ao depurar.

## Primeiro teste: obrigatoriamente sandbox

O número conectado na Evolution é o **remetente**. `p_telefone_teste` precisa
ser outro número controlado por você, no formato DDI + DDD + número.

No SQL Editor, configure somente sandbox (substitua o telefone):

```sql
select public.n8n_configurar_whatsapp_empresa(
  p_id_empresa => 10,
  p_ativo => true,
  p_modo => 'sandbox',
  p_instancia_evolution => 'estudos-whatsapp',
  p_telefone_teste => '55DDDNUMERODETESTE',
  p_chatbot_ativo => true,
  p_campanhas_ativas => true,
  p_automacoes_ativas => true,
  p_avaliacoes_ativas => true,
  p_limite_por_minuto => 3,
  p_url_avaliacao_google => null,
  p_site_base_url => 'https://SEU-SITE-DE-TESTE'
);
```

Mesmo que uma campanha tenha muitos destinatários, o modo sandbox substitui o
destino pelo telefone de teste no banco e novamente na reserva da fila.

Checklist antes de produção:

1. Com a integração desativada, confirme que o sender retorna zero itens.
2. Em sandbox, publique uma campanha para uma base fictícia com opt-in e confira
   `pendente -> processando -> enviada -> entregue -> lida`.
3. Reenvie o mesmo webhook: o estado não pode regredir nem duplicar.
4. Envie `oi`, uma pergunta sobre serviços e `SAIR` a partir do telefone de teste.
5. Confirme que `SAIR` bloqueia novas campanhas para aquele cliente.
6. Finalize um atendimento fictício e valide um único convite de avaliação.
7. Confirme que uma automação repetida no mesmo dia não cria nova execução.
8. Só depois reduza a base, revise consentimentos e mude para `producao`.

Para desligamento de emergência, execute a mesma função com
`p_ativo => false` e `p_modo => 'desativado'`. Isso também cancela mensagens de
marketing ainda pendentes/processando.

## Limites funcionais intencionais

- O chatbot consulta dados públicos e entrega um link seguro de agendamento. Ele
  não grava um horário diretamente pelo WhatsApp, pois disponibilidade, conflito
  e sinal precisam da validação transacional do site.
- `receita_associada_estimada` é atribuição por último toque em até 30 dias,
  não prova causalidade. Receita confirmada só considera pagamento `pago`.
- Uma mensagem conta como `lida` somente quando a Evolution entregar um recibo
  de leitura. Privacidade/configuração do WhatsApp pode impedir esse recibo; o
  sistema não deve inventar visualizações.
- Disparos iniciados pela empresa exigem consentimento válido e devem respeitar
  a política aplicável do WhatsApp. A Evolution não elimina risco de bloqueio.
