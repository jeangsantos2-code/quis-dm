# Ponte automatica Google Sheets

A planilha principal ja possui as abas `Dashboard`, `Eventos`, `Leads`, `Vendas` e `Resumo`.

A aba `Eventos` usa as colunas `W:AC` para `Stage ID`, ordem, grupo, nome legivel, duracao, motivo de saida e abandono potencial. O dashboard detalhado tambem le esses campos do JSON da coluna `V`, portanto continua funcionando durante a transicao mesmo antes de uma nova publicacao do Apps Script.

Na aba `Dashboard`:

- o topo mostra o funil macro por sessoes unicas;
- `Gargalo detalhado` mostra a maior perda medida;
- a tabela inferior compara todas as perguntas, intersticios e secoes da oferta;
- o grafico `Top 10 gargalos detalhados` ordena as maiores perdas entre etapas consecutivas.

O arquivo `docs/google-apps-script.js` e o receptor que deve ser publicado como Web App no Apps Script. Ele usa a propriedade de script `WEBHOOK_SECRET` e grava na planilha sem expor uma credencial de conta Google na Vercel.

Depois da publicacao, configurar na Vercel:

```txt
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=um-segredo-longo-e-aleatorio
```

O mesmo valor de `GOOGLE_SHEETS_WEBHOOK_SECRET` deve ser salvo em `Project Settings > Script properties` com o nome `WEBHOOK_SECRET`.

O Web App deve executar como o proprietario e aceitar acesso de qualquer pessoa. A autenticacao continua obrigatoria porque cada POST precisa conter o segredo, validado antes de qualquer escrita.

Ao atualizar `docs/google-apps-script.js`, publique uma nova versao do mesmo Web App para preencher diretamente as colunas `W:AC`. Sem essa republicacao, os campos continuam chegando dentro do JSON da coluna `V` e alimentando o dashboard.
