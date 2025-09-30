#!/bin/bash
# Script para instalar e configurar o webhook PGFN

echo "🚀 === INSTALANDO WEBHOOK PGFN ==="

# Instalar Node.js e npm
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2

# Instalar dependências do projeto
echo "📦 Instalando dependências..."
npm install

# Criar diretório de logs
echo "📁 Criando diretório de logs..."
mkdir -p logs

# Copiar arquivo de ambiente
echo "⚙️ Configurando ambiente..."
cp env.example .env

# Configurar PM2 para iniciar com o sistema
echo "🔧 Configurando PM2..."
pm2 startup
pm2 save

# Iniciar aplicação com PM2
echo "🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js

# Mostrar status
echo "📊 Status da aplicação:"
pm2 status

echo "✅ === INSTALAÇÃO CONCLUÍDA ==="
echo ""
echo "📡 Webhook disponível em:"
echo "   http://167.235.49.166:3000/webhook/pgfn"
echo ""
echo "🧪 Teste com:"
echo "   curl http://167.235.49.166:3000/test/CNPJ_AQUI"
echo ""
echo "📋 Comandos úteis:"
echo "   pm2 status          - Ver status"
echo "   pm2 logs webhook-pgfn - Ver logs"
echo "   pm2 restart webhook-pgfn - Reiniciar"
echo "   pm2 stop webhook-pgfn - Parar"
