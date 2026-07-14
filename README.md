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

Dashboard Notion criado:

- Dashboard: https://app.notion.com/p/39d940870e90811cb504e2f687841f55
- Leads: `80fe2a3d1f6e47a7a4d8a5f34ada02c7`
- Eventos: `ec7bb87797b74f7daecdce25ddcefea3`
- Vendas: `4cd3941c785e4c70b15c2f649853e504`

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
