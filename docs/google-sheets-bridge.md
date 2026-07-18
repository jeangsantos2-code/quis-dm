# Ponte automatica Google Sheets

A planilha principal ja possui as abas `Dashboard`, `Eventos`, `Leads`, `Vendas` e `Resumo`.

O arquivo `docs/google-apps-script.js` e o receptor que deve ser publicado como Web App no Apps Script. Ele usa a propriedade de script `WEBHOOK_SECRET` e grava na planilha sem expor uma credencial de conta Google na Vercel.

Depois da publicacao, configurar na Vercel:

```txt
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=um-segredo-longo-e-aleatorio
```

O mesmo valor de `GOOGLE_SHEETS_WEBHOOK_SECRET` deve ser salvo em `Project Settings > Script properties` com o nome `WEBHOOK_SECRET`.

O Web App deve executar como o proprietario e aceitar acesso de qualquer pessoa. A autenticacao continua obrigatoria porque cada POST precisa conter o segredo, validado antes de qualquer escrita.
