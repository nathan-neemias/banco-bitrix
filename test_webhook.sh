#!/bin/bash
# Script para testar o webhook PGFN

echo "🚀 === TESTANDO WEBHOOK PGFN ==="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Verificar se axios está instalado
if ! npm list axios &> /dev/null; then
    echo "📦 Instalando axios..."
    npm install axios
fi

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if curl -s http://167.235.49.166:3000/health > /dev/null; then
    echo "✅ Servidor está rodando"
else
    echo "❌ Servidor não está rodando. Iniciando..."
    pm2 start ecosystem.config.js
    sleep 5
fi

# Executar testes
echo "🧪 Executando testes..."
node test_webhook.js

echo "✅ Testes concluídos!"
