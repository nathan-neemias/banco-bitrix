#!/bin/bash
# Script para corrigir o loop do PM2

echo "🔧 === CORRIGINDO LOOP DO PM2 ==="

# Parar todos os processos PM2
echo "🛑 Parando todos os processos PM2..."
pm2 stop all
pm2 delete all

# Criar diretório de logs
echo "📁 Criando diretório de logs..."
mkdir -p logs
touch logs/err.log logs/out.log logs/combined.log

# Verificar se o arquivo server.js existe
echo "🔍 Verificando arquivo server.js..."
if [ ! -f "server.js" ]; then
    echo "❌ Arquivo server.js não encontrado!"
    exit 1
fi

# Verificar se as dependências estão instaladas
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Testar o servidor manualmente primeiro
echo "🧪 Testando servidor manualmente..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Servidor funcionando manualmente"
    kill $SERVER_PID
else
    echo "❌ Servidor não funcionou manualmente"
    echo "📋 Verificando erros..."
    node server.js
    exit 1
fi

# Limpar logs antigos
echo "🧹 Limpando logs antigos..."
> logs/err.log
> logs/out.log
> logs/combined.log

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow 3000

# Iniciar com PM2
echo "🚀 Iniciando com PM2..."
pm2 start ecosystem.config.js

# Aguardar um pouco
sleep 3

# Verificar status
echo "📊 Status do PM2:"
pm2 status

# Verificar se está funcionando
echo "🧪 Testando servidor..."
if curl -s http://167.235.49.166:3000/health > /dev/null; then
    echo "✅ Servidor funcionando!"
    echo "📡 URL: http://167.235.49.166:3000"
    echo "🧪 Teste: http://167.235.49.166:3000/test/08.930.359/0001-70"
else
    echo "❌ Servidor não está respondendo"
    echo "📋 Logs de erro:"
    pm2 logs webhook-pgfn --lines 20
fi

echo "✅ Correção concluída!"
