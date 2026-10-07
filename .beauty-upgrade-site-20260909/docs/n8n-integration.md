# Integração de lembretes com n8n

O site e o banco já deixam a fila, tentativas, idempotência e respostas prontas. O n8n fica responsável somente por chamar o provedor de e-mail/WhatsApp.

## Segurança

Defina o mesmo segredo longo em `N8N_INTEGRATION_SECRET` no site e em uma credencial Header Auth do n8n. Envie `Authorization: Bearer SEU_SEGREDO`. A `service_role` continua apenas no servidor Next.js e nunca entra no workflow.

## Workflow de saída

1. Schedule Trigger a cada minuto.
2. HTTP Request `POST /api/integrations/n8n/messages/claim`, body `{ "limit": 20 }`.
3. Split Out em `messages`.
4. Switch por `canal`: `email` ou `whatsapp`.
5. Envie `destinatario`, `assunto` e `conteudo` pelo provedor escolhido.
6. Em sucesso, chame `POST /api/integrations/n8n/messages/result` com `{ "messageId": 123, "status": "enviada", "externalId": "id-do-provedor" }`.
7. No ramo de erro, chame a mesma rota com `{ "messageId": 123, "status": "erro", "error": "mensagem resumida" }`.

Se o workflow cair depois de reservar uma mensagem, ela volta automaticamente à fila após 10 minutos. As tentativas usam backoff e têm limite.

## Respostas 1 e 2 do WhatsApp

O webhook do provedor deve normalizar a entrada e chamar `POST /api/integrations/n8n/whatsapp/inbound`:

```json
{ "companyId": 1, "externalId": "wamid-unico", "from": "+5516999999999", "text": "1" }
```

`1` confirma (se não houver sinal pendente). `2` devolve um link seguro de reagendamento. Repetir o mesmo `externalId` não repete a ação.

Use `GET /api/integrations/n8n/health` para testar credencial e URL antes de ativar os workflows.
