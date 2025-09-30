#!/bin/bash
# Script para corrigir o servidor e reiniciar

echo "🔧 === CORRIGINDO SERVIDOR WEBHOOK ==="

# Parar PM2 se estiver rodando
echo "🛑 Parando PM2..."
pm2 stop webhook-pgfn 2>/dev/null || echo "PM2 não estava rodando"

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Verificar se a porta 3000 está sendo usada
echo "🔍 Verificando porta 3000..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️ Porta 3000 em uso, liberando..."
    fuser -k 3000/tcp 2>/dev/null || echo "Não foi possível liberar a porta"
    sleep 2
fi

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow 3000

# Iniciar servidor com PM2
echo "🚀 Iniciando servidor..."
pm2 start ecosystem.config.js

# Verificar status
echo "📊 Status do servidor:"
pm2 status

# Testar se está funcionando
echo "🧪 Testando servidor..."
sleep 3

if curl -s http://167.235.49.166:3000/health > /dev/null; then
    echo "✅ Servidor funcionando!"
    echo "📡 URL: http://167.235.49.166:3000"
    echo "🧪 Teste: http://167.235.49.166:3000/test/08.930.359/0001-70"
else
    echo "❌ Servidor não está respondendo"
    echo "📋 Logs:"
    pm2 logs webhook-pgfn --lines 10
fi

echo "✅ Correção concluída!"
