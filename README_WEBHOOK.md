# 🔗 Webhook PGFN - Bitrix24

Webhook em Node.js para preencher automaticamente os campos PGFN no Bitrix24 com base nos dados do banco PostgreSQL.

## 📋 Funcionalidades

- **Busca automática** de dados PGFN no banco
- **Preenchimento** dos campos no Bitrix24
- **Suporte** a múltiplas tabelas (convencional_sn, empresas, especial_pj_pf)
- **Limpeza** e formatação de CNPJ
- **Logs** detalhados
- **PM2** para gerenciamento de processos

## 🗄️ Campos Mapeados

| Campo PGFN | Campo Bitrix24 | Descrição |
|------------|----------------|-----------|
| TOTAL DIVIDA ATIVA | UF_CRM_1758806120 | Valor total da dívida ativa |
| EXECUÇÃO FISCAL ATIVA? | UF_CRM_1758806167 | Se possui execução fiscal ativa |
| CPF SOCIO RESPONDE PELA DIVIDA? | UF_CRM_1758808716 | Se CPF do sócio responde pela dívida |
| TRANSAÇÃO COM IMPUGNAÇÃO OU RESCISÃO | UF_CRM_1758806267 | Se possui transação com impugnação |
| Nº PARCELAMENTOS FEITOS ULTIMOS 5 ANOS | UF_CRM_1758806322 | Quantidade de parcelamentos |
| Nº PARCELAMENTOS ATIVOS | UF_CRM_1758806337 | Quantidade de parcelamentos ativos |
| TOTAL PARCELADO PGFN | UF_CRM_1758806357 | Valor total parcelado |
| TOTAL SALDO DEVEDOR PGFN | UF_CRM_1758806370 | Valor total do saldo devedor |
| POSSUI TRANSAÇÃO COM BENEFICIO? | UF_CRM_1758806394 | Se possui transação com benefício |

## 🚀 Instalação

### 1. Na VPS, execute:

```bash
# Conectar na VPS
ssh root@167.235.49.166

# Executar script de instalação
bash install_webhook.sh
```

### 2. Configuração manual (alternativa):

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Instalar dependências
npm install

# Configurar ambiente
cp env.example .env

# Iniciar com PM2
pm2 start ecosystem.config.js
```

## 📡 Uso

### Endpoint do Webhook

```
POST http://167.235.49.166:3000/webhook/pgfn
```

**Payload:**
```json
{
  "cnpj": "12.345.678/0001-90",
  "id": "12345"
}
```

### Exemplo de Uso no Bitrix24

```javascript
// Webhook URL no Bitrix24
https://167.235.49.166:3000/webhook/pgfn?cnpj={{CNPJ}}&id={{ID}}

// Ou via POST
{
  "cnpj": "{{CNPJ}}",
  "id": "{{ID}}"
}
```

### Teste Manual

```bash
# Testar com CNPJ específico
curl http://167.235.49.166:3000/test/12.345.678/0001-90

# Testar webhook
curl -X POST http://167.235.49.166:3000/webhook/pgfn \
  -H "Content-Type: application/json" \
  -d '{"cnpj": "12.345.678/0001-90", "id": "12345"}'
```

## 🔧 Comandos PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs webhook-pgfn

# Reiniciar
pm2 restart webhook-pgfn

# Parar
pm2 stop webhook-pgfn

# Iniciar
pm2 start webhook-pgfn

# Monitorar
pm2 monit
```

## 📊 Estrutura do Banco

O webhook busca dados nas seguintes tabelas:

- **convencional_sn**: Parcelamentos convencionais
- **empresas**: Dados de empresas
- **especial_pj_pf**: Parcelamentos especiais

### Campos utilizados:

- `cnpj` / `cpf_cnpj`: Identificação da empresa
- `valor_parcelado`: Valor total parcelado
- `saldo_devedor`: Saldo devedor atual
- `qtde_parcelas`: Quantidade de parcelas

## 🔍 Logs

Os logs são salvos em:
- `./logs/out.log`: Logs de saída
- `./logs/err.log`: Logs de erro
- `./logs/combined.log`: Logs combinados

## 🛡️ Segurança

- **Helmet** para headers de segurança
- **CORS** configurado
- **Validação** de entrada
- **Tratamento** de erros

## 📈 Monitoramento

### Health Check

```bash
curl http://167.235.49.166:3000/health
```

### Métricas

- Uptime do servidor
- Status das conexões com banco
- Logs de requisições

## 🔄 Automação no Bitrix24

Para configurar a automação no Bitrix24:

1. **Criar automação** que dispara quando um contato é criado/atualizado
2. **Configurar webhook** para chamar o endpoint
3. **Mapear campos** conforme a tabela acima
4. **Testar** com dados reais

### Exemplo de automação:

```
Trigger: Contato criado/atualizado
Condição: Campo CNPJ preenchido
Ação: Chamar webhook
URL: http://167.235.49.166:3000/webhook/pgfn
Método: POST
Payload: {"cnpj": "{{CNPJ}}", "id": "{{ID}}"}
```

## 🐛 Troubleshooting

### Erro de conexão com banco:

```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -h 167.235.49.166 -U ville_admin -d bitrix
```

### Erro no Bitrix24:

```bash
# Verificar logs
pm2 logs webhook-pgfn

# Testar endpoint
curl -X POST http://167.235.49.166:3000/webhook/pgfn \
  -H "Content-Type: application/json" \
  -d '{"cnpj": "teste", "id": "123"}'
```

### Reiniciar serviço:

```bash
pm2 restart webhook-pgfn
```

## 📞 Suporte

Para suporte ou dúvidas:
- Verificar logs: `pm2 logs webhook-pgfn`
- Testar endpoint: `/test/CNPJ`
- Health check: `/health`
