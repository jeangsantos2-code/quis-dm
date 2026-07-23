# Quiz Casamento Nota 9

Experiência mobile-first de diagnóstico e conversão para o Movimento Casamento Nota 9.

## Estrutura

- `linkbio/index.html`: hub editorial do link da bio para diagnóstico, mentorias e suporte.
- `linkbio/assets/css/styles.css`: extensão responsiva do design system do quiz.
- `linkbio/assets/js/config.js`: URLs oficiais, WhatsApp e atribuição padrão.
- `linkbio/assets/js/app.js`: links seguros, passagem de UTMs e eventos da página.
- `mentoria-em-grupo/index.html`: landing da Mentoria Casamento Nota 9.
- `mentoria-em-grupo/assets/`: estilos, configuração de oferta e tracking da landing.
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

Prioridade de análise:

- **Funil principal:** origem da automação de DM -> visita ao quiz -> início -> perguntas/interstícios -> captura -> diagnóstico/oferta -> checkout -> `Purchase` confirmado pela Green.
- **Fluxos auxiliares:** LinkBio e landing da Mentoria em Grupo. Eles são medidos para otimização própria, mas não devem ser somados ao funil principal da DM.
- **Segmentação obrigatória:** comparar sessões únicas por `entry_point`, UTMs, `ref`, campanha e `quiz_entry`.

Eventos disponíveis:

- `linkbio_view`: visita ao hub editorial do link da bio.
- `linkbio_section_view`: alcance de cada bloco da LinkBio.
- `linkbio_destination_click`: clique em um destino, identificado como `diagnostico`, `mentoria_grupo`, `mentoria_individual` ou `time_cuidados`.
- `mentoring_landing_view`: visita à landing da Mentoria em Grupo.
- `mentoring_section_view`: alcance de cada seção da landing, da hero ao CTA final.
- `mentoring_cta_click`: clique em CTA interno da landing, identificado por posição e destino.
- `mentoring_checkout_click`: clique no checkout, identificado por posição do CTA.
- `mentoring_testimonial_view`: visualização de cada relato.
- `mentoring_faq_open`: abertura de uma pergunta frequente.
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

A LinkBio adiciona `quiz_entry=instruction` ao diagnóstico. O quiz só pula a introdução quando essa flag aparece junto de `entry_point=link_bio_page`. A visita, o início e a saída contextual da introdução continuam registrados; DM, acesso direto e outras origens mantêm a tela inicial.

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

O dashboard possui uma visão macro do funil, uma visão detalhada com ranking dos 10 maiores gargalos e uma área de atribuição por `source_post`. Essa área compara visitas, inícios, conclusões, leads, checkout, compras e conversão por post de origem. Os dados detalhados devem ser avaliados somente depois de acumular volume suficiente de sessões na versão instrumentada.

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
3. Publique normalmente. O `vercel.json` mantém o quiz em `/` e `/quiz`, a ponte em `/linkbio` e a landing em `/mentoria-em-grupo`.
4. Configure a Green para enviar webhook `POST` para `/api/green-webhook` com o token definido.

O domínio canônico é `casamentonota9.vercel.app`. O host anterior `quis-dm.vercel.app` permanece ativo apenas para redirecionar permanentemente, com caminho e parâmetros preservados. A rota legada `/mentoria` redireciona com 308 para `/mentoria-em-grupo`.

Detalhes em `docs/vercel-deploy.md`.

## Teste local

Rode:

```bash
node dev-server.js
```

Abra o quiz em `http://127.0.0.1:4173/quiz/`, a página do link da bio em `http://127.0.0.1:4173/linkbio` e a landing em `http://127.0.0.1:4173/mentoria-em-grupo`.

## Checklist manual

- Abrir em 360px, 390px, 430px, 768px e 1024px.
- Responder as 10 perguntas e confirmar nota entre 2 e 9.
- Conferir lead gate com botão bloqueado até nome, WhatsApp e e-mail válidos.
- Verificar que o diagnóstico mostra evidências, primeiro passo e oferta.
- Clicar no checkout e confirmar UTMs, `sessionId` e `leadId` na URL.
- Abrir `obrigado.html` e confirmar que só dispara `ThankYouViewed`.
- Testar `/api/track` com POST JSON.
- Testar `/api/green-webhook` com status pago e token válido.
