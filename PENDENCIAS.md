# Pendências do Fluxo Completo

## Pendências externas críticas

1. Youze enviar origem completa no link do quiz.

Parâmetros mínimos esperados:

```txt
utm_source=instagram
utm_medium=dm
utm_campaign=
utm_content=
utm_term=nota
source_post=
subscriber_id=
cuid=
```

2. Fazer venda real para validar se a Green devolve `leadId` e `sessionId` no webhook.

O quiz já envia `leadId` e `sessionId` para o checkout. O webhook da Green já está preparado para capturar esses campos se eles voltarem como campos diretos, metadata ou dentro de `data.metadata`.

## Pendências de publicação

1. Configurar `NOTION_TOKEN` na Vercel.
2. Configurar `GREEN_WEBHOOK_TOKEN` na Vercel e na Green.
3. Confirmar se a Green preserva metadata/query params no webhook.
4. Conectar repositório Git à Vercel para deploy automático a cada push.
5. Fazer um teste real de compra com valor controlado.
6. Validar no Notion se as bases `CN9 - Leads`, `CN9 - Eventos` e `CN9 - Vendas` receberam os dados corretamente.
7. Liberar/criar um repositório GitHub acessível para este projeto. O GitHub conectado no Codex ainda não retornou repositórios disponíveis.
8. Depois do remote Git existir, rodar `vercel git connect <git-url>` para ativar deploy automático por push.

## Produção Vercel

- URL publicada: https://quis-dm.vercel.app
- Projeto Vercel: `quis-dm`
- Project ID local: `prj_0P4hG1GgZn3Umvb1E94xN7DZrTwU`
- Org ID local: `team_FvMkzZ0SYWAy0zMFXQS1HBe8`

Variáveis não secretas já configuradas em produção:

- `NOTION_LEADS_DATABASE_ID`
- `NOTION_EVENTS_DATABASE_ID`
- `NOTION_SALES_DATABASE_ID`
- `META_PIXEL_ID`
- `CN9_TRACK_DEBUG`

Variáveis secretas ainda pendentes:

- `NOTION_TOKEN`
- `GREEN_WEBHOOK_TOKEN`
- `META_CAPI_TOKEN`, se for usar Purchase via Meta CAPI.

## IDs do Notion

- Dashboard: https://app.notion.com/p/39d940870e90811cb504e2f687841f55
- Leads: `80fe2a3d1f6e47a7a4d8a5f34ada02c7`
- Eventos: `ec7bb87797b74f7daecdce25ddcefea3`
- Vendas: `4cd3941c785e4c70b15c2f649853e504`
