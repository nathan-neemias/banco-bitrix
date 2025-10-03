# 🚀 Guia de Deploy - Automação PGFN

## 📋 Pré-requisitos

- Node.js 16+ instalado
- PM2 instalado globalmente
- Acesso ao servidor/produção
- Configurações corretas no Bitrix24

## 🔧 Instalação Rápida

### 1. Preparar Ambiente
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Instalar dependências do projeto
cd automation
npm install

# Criar diretório de logs
mkdir -p logs
```

### 2. Configurar PM2
```bash
# Iniciar automação
npm run pm2:start

# Verificar status
npm run pm2:status

# Ver logs
npm run pm2:logs
```

### 3. Configurar Start Automático
```bash
# Salvar configuração atual do PM2
pm2 save

# Configurar startup automático
pm2 startup

# Seguir as instruções exibidas pelo comando acima
```

## 🌐 Monitoramento Web

### Servidor de Monitoramento (Porta 3001)
```bash
# Iniciar servidor web
npm run server

# Endpoints disponíveis:
# http://localhost:3001/health  - Status geral
# http://localhost:3001/status  - Status da automação
# POST http://localhost:3001/run - Executar manualmente
```

### Comandos Úteis
```bash
# Status completo
npm run pm2:status

# Logs em tempo real
npm run pm2:logs --lines 50

# Monitor de recursos
npm run pm2:monit

# Reiniciar serviço
npm run pm2:restart

# Parar serviço
npm run pm2:stop
```

## ⚙️ Configurações de Produção

### Ecosystem Config (ecosystem.config.js)
- **Instâncias**: 1 processo por CPU
- **Auto-restart**: Habilitado
- **Memory restart**: 1GB
- **Cron restart**: A cada 2 horas
- **Logs**: Rotação automática

### Variáveis de Ambiente
Configurar no `ecosystem.config.js` ou ambiente:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,
  LOG_LEVEL: 'info'
}
```

## 🔍 Verificação Pós-Deploy

### 1. Testar Conectividades
```bash
npm run test
```

### 2. Verificar Status
```bash
npm run pm2:status
```

### 3. Verificar Health Check
```bash
curl http://localhost:3001/health
```

### 4. Monitorar Logs
```bash
npm run pm2:logs --lines 20
```

## 📊 Monitoramento Contínuo

### Métricas de Saúde
- ✅ Processos PM2 ativos
- ✅ Uso de memória < 512MB
- ✅ Tempo de resposta APIs < 30s
- ✅ Taxa de sucesso > 95%

### Alertas Recomendados
- Processo morto (não respondendo)
- Memória > 1GB
- Taxa de erro > 10%
- Downtime > 5 minutos

### Logs Importantes
- `logs/automation.log` - Logs da automação
- `logs/pm2-*.log` - Logs do PM2
- PM2 built-in logs (`pm2 logs`)

## 🔧 Troubleshooting

### Problema: PM2 não inicia
```bash
# Verificar instalação
pm2 --version

# Reinstalar se necessário
npm install -g pm2

# Verificar permissions
sudo chown -R $USER:$ГROUP ~/.pm2
```

### Problema: Porta ocupada
```bash
# Verificar processos na porta 3001
lsof -i :3001

# Parar processo conflitante ou mudar porta no ecosystem.config.js
```

### Problema: Logs não aparecem
```bash
# Verificar diretório logs
ls -la logs/

# Recriar se necessário
mkdir -p logs
chmod 755 logs
```

## 📈 Escalabilidade

### Para Alta Demanda
1. **Aumentar instâncias PM2**: `instances: max`
2. **Ajustar lote**: `batch_size: 5` no settings.js
3. **Reduzir delay**: `delay_between_deals: 250`
4. **Monitoring adicional**: New Relic, DataDog, etc.

### Performance
- **Baseline**: 100 negócios/hora
- **Máximo**: 500 negócios/hora (com ajustes)
- **Latência**: < 2 segundos por negócio

## 🔄 Atualizações

### Deploy de Nova Versão
```bash
# Parar serviço atual
npm run pm2:stop

# Fazer backup das configurações
cp config/settings.js settings.backup.js

# Atualizar código
git pull origin main

# Restaurar configurações se necessário
cp settings.backup.js config/settings.js

# Reiniciar serviço
npm run pm2:start

# Verificar funcionamento
npm run pm2:logs
```

## 📞 Suporte

### Informações do Sistema
```bash
# Status completo
npm run pm2:status

# Informações detalhadas
pm2 show pgfn-automation

# Logs de erro
pm2 logs pgfn-automation --err
```

### Contatos
- **Equipe Técnica**: Desenvolvedores Villela Digital
- **Monitoramento**: Sistema PM2 + Logs
- **Urgências**: Verificar logs e status primeiro

---
**Última atualização**: Outubro 2025  
**Versão**: 1.0.0
