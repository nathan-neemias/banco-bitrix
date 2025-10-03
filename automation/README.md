# 🚀 Automação PGFN para Bitrix24

Sistema automatizado que consulta dados da Receita Federal (PGFN), através da nossa API própria, e atualiza campos específicos no Bitrix24 CRM para negócios da pipeline 17.

## 🎯 Funcionalidades

- ✅ **Consulta automática** aos dados PGFN via nossa API
- ✅ **Atualização automática** de campos fiscais no Bitrix24
- ✅ **Filtro temporal** - processa apenas negócios criados apartir de agora
- ✅ **Inclui nome da empresa** automaticamente
- ✅ **Conversão automática** para formato correto do Bitrix
- ✅ **Logs detalhados** e monitoramento via PM2
- ✅ **Tratamento de erros** e retry automático

## 📋 Campos Atualizados

| Campo Bitrix | Descrição | Tipo de Dados |
|-------------|-----------|---------------|
| `UF_CRM_1557101315015` | Nome da Empresa | Texto |
| `UF_CRM_1758806120` | Total Dívida Ativa | Monetário |
| `UF_CRM_1758806167` | Execução Fiscal Ativa | Booleano (1/0) |
| `UF_CRM_1758808716` | CPF Sócio Responde pela Dívida | Booleano (1/0) |
| `UF_CRM_1758806267` | Transação com Impugnação | Booleano (1/0) |
| `UF_CRM_1758806322` | Parcelamentos Últimos 5 Anos | Numérico |
| `UF_CRM_1758806337` | Parcelamentos Ativos | Numérico |
| `UF_CRM_1758806357` | Total Parcelado PGFN | Monetário |
| `UF_CRM_1758806370` | Total Saldo Devedor PGFN | Monetário |
| `UF_CRM_1758806394` | Possui Transação com Benefício | Booleano (1/0) |

## 🛠️ Instalação

### Pré-requisitos

- Node.js 16+ 
- PM2 instalado globalmente
- Ambiente configurado no Bitrix24

### Configuração

1. **Instalar dependências:**
```bash
npm install
```

2. **Instalar PM2 globalmente (se não instalado):**
```bash
npm install -g pm2
```

3. **Configurar variáveis de ambiente:**
Edite o arquivo `config/settings.js` conforme necessário.

## 🚀 Execução

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção com PM2
```bash
# Iniciar automação
npm run pm2:start

# Verificar status
npm run pm2:status

# Ver logs em tempo real
npm run pm2:logs

# Monitorar recursos
npm run pm2:monit

# Parar automação
npm run pm2:stop

# Reiniciar automação
npm run pm2:restart
```

## 📊 Monitoramento

### Logs
- **Arquivo de log:** `logs/automation.log`
- **Log PM2:** `logs/pm2-*.log`
- **Visualizar logs:** `npm run logs` ou `npm run pm2:logs`

### Status e Saúde
- **Status:** `pm2 status`
- **Recursos:** `pm2 monit`
- **Processo:** `pm2 show pgfn-automation`

## ⚙️ Configurações

### Arquivo `config/settings.js`

```javascript
// Principais configurações
module.exports = {
  bitrix: {
    api_url: 'https://grupovillela.bitrix24.com.br/rest/28/2js7aupbd48aed3o',
    target_pipeline: 17,
    target_phases: ['C17:NEW'] // Fases a serem processadas
  },
  
  automation: {
    start_date: new Date().toISOString(), // Data de início do processamento
    batch_size: 10, // Lotes de processamento
    delay_between_deals: 500 // Delay entre negócios (ms)
  }
}
```

## 🔄 Como Funciona

### Fluxo de Processamento

1. **🕐 Execução** - Roda baseado no cron do PM2
2. **🔍 Busca Negócios** - Filtra negócios da pipeline 17 criados apartir da data configurada
3. **📝 Extração CNPJ** - Busca CNPJ no campo `UF_CRM_1745494235` do negócio
4. **🔍 Consulta PGFN** - Consulta nossa API PGFN (`http://167.235.49.166:3000`)
5. **🔧 Conversão** - Converte dados para formato correto do Bitrix
6. **✅ Atualização** - Atualiza campos do negócio no Bitrix24
7. **📊 Logs** - Registra todas as operações

### Critérios de Processamento

- ✅ Negócios da **pipeline 17**
- ✅ Fases configuradas em `target_phases`
- ✅ Negócios criados **apartir da data** configurada
- ✅ Negócios com **CNPJ válido** no campo `UF_CRM_1745494235`
- ❌ Negócios **já processados** anteriormente (ignora se já tem dados PGFN)

## 📈 Estrutura do Projeto

```
automation/
├── config/
│   └── settings.js          # Configurações gerais
├── services/
│   ├── BitrixService.js     # Serviços Bitrix24 API
│   └── PGFNService.js       # Serviços API PGFN
├── utils/
│   ├── Logger.js            # Sistema de logs
│   └── StatsCollector.js    # Coleta de estatísticas
├── logs/                    # Arquivos de log
├── AutomationEngine.js       # Engine principal
├── run.js                   # Arquivo de entrada
├── ecosystem.config.js      # Configuração PM2
└── package.json             # Dependências e scripts
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **"Negócios não encontrados"**
   - Verifique se há negócios novos na pipeline 17
   - Confirme se a data de início não é muito recente

2. **"API PGFN não responde"**
   - Verifique se o servidor da API PGFN está ativo
   - Teste: `curl http://167.235.49.166:3000/api/cnpj/44718903000188`

3. **"Campos não atualizam no Bitrix"**
   - Verifique tokens de API do Bitrix24
   - Confirme permissões para atualizar negócios

4. **"PM2 não inicia"**
   - Instale PM2: `npm install -g pm2`
   - Verifique Node.js 16+: `node --version`

### Comandos de Debug

```bash
# Testar conexões
node run.js --test-connections

# Ver logs detalhados
npm run pm2:logs --lines 100

# Verificar configurações
node -e "console.log(require('./config/settings'))"
```

## 📝 Histórico de Versões

### v1.0.0 (03/10/2025)
- ✅ Implementação inicial completa
- ✅ Integração com Bitrix24
- ✅ Consulta API PGFN própria  
- ✅ Atualização automática de campos
- ✅ Sistema de logs e monitoramento PM2
- ✅ Filtro temporal para negócios novos
- ✅ Conversão correta de formatos de dados
- ✅ Inclusão de nome da empresa

## 🤝 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs: `npm run pm2:logs`
2. Confirme configurações: `cat config/settings.js`
3. Teste conectividades manualmente
4. Entre em contato com a equipe técnica

---

**Desenvolvido por:** Villela Digital  
**Versão:** 1.0.0  
**Data:** Outubro 2025