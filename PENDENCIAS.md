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
Também está preparado para receber `publicScore`, `category`, `mainDimension`, `cta` e origem completa quando a Green devolver esses parâmetros.

## Pendências de publicação

1. Configurar `NOTION_TOKEN` na Vercel.
2. Configurar `GREEN_WEBHOOK_TOKEN` na Vercel e na Green.
3. Confirmar se a Green preserva metadata/query params no webhook.
4. Validar deploy automático da Vercel no próximo push para `main`.
5. Fazer um teste real de compra com valor controlado.
6. Validar no Notion se as bases `CN9 - Leads`, `CN9 - Eventos` e `CN9 - Vendas` receberam os dados corretamente.
7. Publicar `docs/google-apps-script.js` como Web App e configurar `GOOGLE_SHEETS_WEBHOOK_URL` e `GOOGLE_SHEETS_WEBHOOK_SECRET` na Vercel.

O dashboard Google Sheets já está estruturado com funil, gargalo, origem, campanha, categoria e dimensão principal. A publicação do Apps Script é a única etapa restante para a alimentação automática; o conector do Drive usado pelo Codex permite editar a planilha, mas não fornece uma credencial exportável para o runtime da Vercel.

## Produção Vercel

- URL publicada: https://quis-dm.vercel.app
- Projeto Vercel: `quis-dm`
- Repositório GitHub: https://github.com/jeangsantos2-code/quis-dm
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

## Dashboard Notion

Tela inicial reorganizada com:

- Funil principal: visita, início, conclusão, lead, diagnóstico, oferta, preço, checkout e compra.
- Gargalos por etapa do funil.
- Origem completa dos leads e eventos.
- Nota média, categorias e dimensão principal pela base de leads.
- Status de compra e vendas por origem.

Views criadas:

- `Leads por status do funil`
- `Leads por origem`
- `Diagnósticos por dimensão`
- `Funil principal por evento`
- `Eventos por origem`
- `Vendas por origem`

## IDs do Notion

- Dashboard: https://app.notion.com/p/39d940870e90811cb504e2f687841f55
- Leads: `80fe2a3d1f6e47a7a4d8a5f34ada02c7`
- Eventos: `ec7bb87797b74f7daecdce25ddcefea3`
- Vendas: `4cd3941c785e4c70b15c2f649853e504`

## Status revisado em 15/07/2026

### Resolvido sem acao do usuario

- Corrigido o carregamento da URL `https://quis-dm.vercel.app/quiz`.
- Corrigidos os caminhos de scripts, CSS, imagem e links legais no clean URL `/quiz`.
- Adicionado versionamento dos assets para evitar cache antigo no navegador.
- Validado o deploy automatico GitHub -> Vercel apos push em `main`.
- Criados graficos nativos de barras no dashboard para funil, origem, dimensao, categoria e compras por origem.
- Mantidos boards para status do funil, origem, dimensao e vendas.

### Depende de acao do usuario ou de terceiros

- Youze precisa enviar a origem completa no link do quiz.
- Usuario precisa configurar `NOTION_TOKEN` na Vercel.
- Usuario precisa configurar `GREEN_WEBHOOK_TOKEN` na Vercel e cadastrar o mesmo segredo na Green.
- Usuario precisa realizar uma venda real com valor controlado.
- Green precisa confirmar/preservar `leadId`, `sessionId`, UTMs, metadata e dados do diagnostico no webhook.
- `META_CAPI_TOKEN` so e necessario se for ativar Purchase via Meta CAPI.
