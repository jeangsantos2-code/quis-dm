# Deploy Vercel

## Estado atual

O projeto já tem:

- `vercel.json` com rewrites para `/quiz`.
- Endpoints serverless em `/api/track` e `/api/green-webhook`.
- `.env.example` com as variáveis necessárias.
- `dev-server.js` para teste local.

Produção atual:

```txt
https://quis-dm.vercel.app
```

Projeto Vercel:

```txt
quis-dm
```

## Variáveis necessárias na Vercel

Obrigatórias para dashboard:

```txt
NOTION_TOKEN=
NOTION_LEADS_DATABASE_ID=80fe2a3d1f6e47a7a4d8a5f34ada02c7
NOTION_EVENTS_DATABASE_ID=ec7bb87797b74f7daecdce25ddcefea3
NOTION_SALES_DATABASE_ID=4cd3941c785e4c70b15c2f649853e504
```

Obrigatória para Green:

```txt
GREEN_WEBHOOK_TOKEN=
```

Opcionais:

```txt
META_PIXEL_ID=628985112811133
META_CAPI_TOKEN=
META_TEST_EVENT_CODE=
CN9_TRACK_DEBUG=false
```

## Deploy automático

A forma correta é conectar o repositório Git na Vercel:

1. Subir este projeto para GitHub/GitLab/Bitbucket.
2. Na Vercel, importar o repositório.
3. Framework preset: Other.
4. Build command: vazio.
5. Output directory: vazio.
6. Adicionar as variáveis acima.
7. Deploy.

Depois disso, cada push na branch principal gera deploy automático.

Quando o remote Git existir, rode:

```bash
vercel git connect https://github.com/OWNER/REPO --scope jeangsantos1-s-projects
```

Estado atual: ainda não há remote Git no repositório local.

## Webhook Green

Configurar na Green:

```txt
POST https://SEU-DOMINIO.vercel.app/api/green-webhook
Header x-green-token: GREEN_WEBHOOK_TOKEN
```

Se a Green não permitir header customizado, usar:

```txt
https://SEU-DOMINIO.vercel.app/api/green-webhook?token=GREEN_WEBHOOK_TOKEN
```
