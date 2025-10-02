# Configuração no Bitrix24

## URL para Automação

Cole esta URL completa na automação do Bitrix24:

```
http://167.235.49.166:3000/webhook/pgfn?cnpjws=cnpjws&dominio=https://grupovillela.bitrix24.com.br/rest/28/bn790kn8m1oo1aw2/&entidade=CP&id_valor={{ID}}&cnpj_valor={{CNPJ}}&UF_CRM_1758806120={{UF_CRM_1758806120}}&UF_CRM_1758806167={{UF_CRM_1758806167}}&UF_CRM_1758808716={{UF_CRM_1758808716}}&UF_CRM_1758806267={{UF_CRM_1758806267}}&UF_CRM_1758806322={{UF_CRM_1758806322}}&UF_CRM_1758806337={{UF_CRM_1758806337}}&UF_CRM_1758806357={{UF_CRM_1758806357}}&UF_CRM_1758806370={{UF_CRM_1758806370}}&UF_CRM_1758806394={{UF_CRM_1758806394}}
```

## Campos Mapeados

- **TOTAL DIVIDA ATIVA**: UF_CRM_1758806120
- **EXECUÇÃO FISCAL ATIVA?**: UF_CRM_1758806167
- **CPF SOCIO RESPONDE PELA DIVIDA?**: UF_CRM_1758808716
- **TRANSAÇÃO COM IMPUGNAÇÃO OU RESCISÃO**: UF_CRM_1758806267
- **Nº PARCELAMENTOS FEITOS ULTIMOS 5 ANOS**: UF_CRM_1758806322
- **Nº PARCELAMENTOS ATIVOS**: UF_CRM_1758806337
- **TOTAL PARCELADO PGFN**: UF_CRM_1758806357
- **TOTAL SALDO DEVEDOR PGFN**: UF_CRM_1758806370
- **POSSUI TRANSAÇÃO COM BENEFICIO?**: UF_CRM_1758806394

## Como usar

1. Na automação do Bitrix24, adicione um webhook
2. Cole a URL completa acima
3. Substitua apenas:
   - `{{ID}}` pelo ID do negócio
   - `{{CNPJ}}` pelo CNPJ do negócio
4. Os outros campos serão preenchidos automaticamente
