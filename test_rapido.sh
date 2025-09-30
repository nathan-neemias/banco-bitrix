#!/bin/bash
# Teste rápido para CNPJ específico

CNPJ="08.930.359/0001-70"
WEBHOOK_URL="http://167.235.49.166:3000"

echo "🧪 === TESTE RÁPIDO - CNPJ: $CNPJ ==="

# 1. Health check
echo "🏥 1. Verificando servidor..."
if curl -s $WEBHOOK_URL/health > /dev/null; then
    echo "✅ Servidor OK"
else
    echo "❌ Servidor não responde"
    exit 1
fi

# 2. Teste de busca
echo "🔍 2. Testando busca de dados..."
curl -s "$WEBHOOK_URL/test/$CNPJ" | jq '.' 2>/dev/null || curl -s "$WEBHOOK_URL/test/$CNPJ"

# 3. Teste do webhook
echo -e "\n📡 3. Testando webhook..."
curl -X POST "$WEBHOOK_URL/webhook/pgfn" \
  -H "Content-Type: application/json" \
  -d "{\"cnpj\": \"$CNPJ\", \"id\": \"test_123\"}" | jq '.' 2>/dev/null || \
curl -X POST "$WEBHOOK_URL/webhook/pgfn" \
  -H "Content-Type: application/json" \
  -d "{\"cnpj\": \"$CNPJ\", \"id\": \"test_123\"}"

echo -e "\n✅ Teste concluído!"
