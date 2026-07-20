# Quiz Casamento Nota 9

Experiência mobile-first de diagnóstico e conversão para o Movimento Casamento Nota 9.

## Estrutura

- `quiz/index.html`: experiência principal do quiz.
- `quiz/obrigado.html`: página de obrigado, sem disparar `Purchase`.
- `quiz/politica-de-privacidade.html`: política de privacidade.
- `quiz/termos-de-uso.html`: termos de uso.
- `quiz/assets/css/styles.css`: design system e responsividade.
- `quiz/assets/js/config.js`: constantes públicas do funil.
- `quiz/assets/js/scoring.js`: perguntas, dimensões, nota e primeiro passo.
- `quiz/assets/js/tracking.js`: sessão, origem, eventos, Meta Pixel opcional e checkout.
- `api/track.js`: endpoint Vercel para eventos e leads.
- `api/green-webhook.js`: webhook Green para compra confirmada.
- `lib/google-sheets.js`: envio automático para a planilha visual do funil.
- `docs/google-apps-script.js`: receptor da ponte Vercel -> Google Sheets.

## Tracking do funil

Eventos principais para decisão:

- `QuizLandingViewed`: visita.
- `QuizStarted`: início do quiz.
- `QuizCompleted`: conclusão das perguntas.
- `LeadCaptured`: lead capturado.
- `ResultViewed` / `DiagnosticViewed`: diagnóstico visto.
- `OfferViewed`: oferta vista.
- `PriceBlockViewed`: preço visto.
- `InitiateCheckout`: clique no checkout Green.
- `Purchase`: compra confirmada somente pelo webhook Green.

O checkout recebe `sessionId`, `leadId`, UTMs, `cta`, `publicScore`, `category` e `mainDimension`.
As bases do Notion têm colunas separadas para origem completa, campanha, post, nota, categoria, dimensão e status de compra.

O acompanhamento detalhado usa dois eventos padronizados sem remover os eventos históricos:

- `FunnelStageViewed`: uma visualização única por sessão para cada etapa.
- `FunnelStageExited`: tempo aproximado na etapa, motivo da saída e indicação de abandono potencial.

As etapas possuem `stageId`, `stageOrder`, `stageGroup` e `stageLabel`. O mapa cobre entrada, orientações, 10 perguntas, 3 interstícios, processamento, captura, todas as seções do diagnóstico e da oferta, checkout e página de obrigado. O dashboard calcula conversão e perda entre etapas por sessões únicas.

## Configuração pública

Edite `quiz/assets/js/config.js`:

- `CHECKOUT_URL`: URL do checkout Green.
- `TRACK_ENDPOINT`: padrão `/api/track`.
- `META_PIXEL_ID`: deixe vazio para desativar Meta Pixel no browser.
- `SUPPORT_URL`: link opcional para suporte na página de obrigado.
- `FAQ_RECORDINGS_ENABLED`: escolha a resposta correta sobre gravações.

## Variáveis Vercel opcionais

Use `.env.example` como referência.

- `GREEN_WEBHOOK_TOKEN`: token obrigatório para aceitar webhooks da Green.
- `NOTION_TOKEN`: token de integração Notion.
- `NOTION_LEADS_DATABASE_ID`: base de leads.
- `NOTION_EVENTS_DATABASE_ID`: base de eventos.
- `NOTION_SALES_DATABASE_ID`: base de vendas.
- `META_PIXEL_ID`: Pixel usado pelo CAPI, se ativado.
- `META_CAPI_TOKEN`: token CAPI para enviar `Purchase` após pagamento confirmado.
- `CN9_TRACK_DEBUG=true`: logs sanitizados de diagnóstico.
- `GOOGLE_SHEETS_WEBHOOK_URL`: URL publicada do Web App no Apps Script.
- `GOOGLE_SHEETS_WEBHOOK_SECRET`: segredo compartilhado entre Vercel e Apps Script.

Dashboard Google Sheets:

- https://docs.google.com/spreadsheets/d/1t3R57-jZsPCVMc0atfkvCm-EHjFxOHYi7mVGg0xQqiw/edit

O dashboard possui uma visão macro do funil e uma visão detalhada com ranking dos 10 maiores gargalos. Os dados detalhados devem ser avaliados somente depois de acumular volume suficiente de sessões na versão instrumentada.

Dashboard Notion criado:

- Dashboard: https://app.notion.com/p/39d940870e90811cb504e2f687841f55
- Leads: `80fe2a3d1f6e47a7a4d8a5f34ada02c7`
- Eventos: `ec7bb87797b74f7daecdce25ddcefea3`
- Vendas: `4cd3941c785e4c70b15c2f649853e504`

Views criadas no Notion:

- Leads recentes, Leads por status do funil, Leads por origem, Diagnósticos por dimensão.
- Eventos recentes, Eventos por etapa, Funil principal por evento, Eventos por origem.
- Vendas confirmadas, Vendas por origem.

## Deploy na Vercel

1. Crie o projeto na Vercel apontando para este repositório.
2. Configure as variáveis de ambiente necessárias.
3. Publique normalmente. O `vercel.json` reescreve `/` e `/quiz` para o quiz.
4. Configure a Green para enviar webhook `POST` para `/api/green-webhook` com o token definido.

Detalhes em `docs/vercel-deploy.md`.

## Teste local

Rode:

```bash
node dev-server.js
```

Abra `http://127.0.0.1:4173/quiz/`.

## Checklist manual

- Abrir em 360px, 390px, 430px, 768px e 1024px.
- Responder as 10 perguntas e confirmar nota entre 2 e 9.
- Conferir lead gate com botão bloqueado até nome, WhatsApp e e-mail válidos.
- Verificar que o diagnóstico mostra evidências, primeiro passo e oferta.
- Clicar no checkout e confirmar UTMs, `sessionId` e `leadId` na URL.
- Abrir `obrigado.html` e confirmar que só dispara `ThankYouViewed`.
- Testar `/api/track` com POST JSON.
- Testar `/api/green-webhook` com status pago e token válido.
