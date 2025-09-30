# 🧪 Teste Manual do Webhook PGFN

## 1. Verificar se o servidor está rodando

```bash
# Health check
curl http://167.235.49.166:3000/health

# Resposta esperada:
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

## 2. Testar busca de dados

```bash
# Testar com CNPJ específico
curl http://167.235.49.166:3000/test/25.091.198/0001-97

# Resposta esperada:
{
  "success": true,
  "cnpj": "25.091.198/0001-97",
  "data": {
    "total_parcelamentos": 1,
    "parcelamentos_ativos": 1,
    "total_parcelado": 5497.01,
    "total_saldo_devedor": 2656.58
  }
}
```

## 3. Testar webhook completo

```bash
# Testar webhook com payload
curl -X POST http://167.235.49.166:3000/webhook/pgfn \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "25.091.198/0001-97",
    "id": "12345"
  }'

# Resposta esperada:
{
  "success": true,
  "message": "Dados PGFN atualizados com sucesso",
  "data": {
    "contact_id": "12345",
    "cnpj": "25.091.198/0001-97",
    "pgfn_data": {
      "total_parcelamentos": 1,
      "parcelamentos_ativos": 1,
      "total_parcelado": 5497.01,
      "total_saldo_devedor": 2656.58
    }
  }
}
```

## 4. Testar CNPJs inválidos

```bash
# CNPJ inexistente
curl http://167.235.49.166:3000/test/123.456.789/0001-00

# Resposta esperada:
{
  "success": true,
  "cnpj": "123.456.789/0001-00",
  "data": {
    "total_parcelamentos": 0,
    "parcelamentos_ativos": 0,
    "total_parcelado": 0,
    "total_saldo_devedor": 0
  }
}
```

## 5. Testar payload inválido

```bash
# Payload sem CNPJ
curl -X POST http://167.235.49.166:3000/webhook/pgfn \
  -H "Content-Type: application/json" \
  -d '{"id": "12345"}'

# Resposta esperada:
{
  "success": false,
  "error": "CNPJ e ID são obrigatórios"
}
```

## 6. Verificar logs

```bash
# Ver logs do PM2
pm2 logs webhook-pgfn

# Ver logs em tempo real
pm2 logs webhook-pgfn --lines 50
```

## 7. Testar performance

```bash
# Teste de carga simples
for i in {1..10}; do
  curl -s http://167.235.49.166:3000/test/25.091.198/0001-97 > /dev/null
  echo "Requisição $i concluída"
done
```

## 8. Verificar status do PM2

```bash
# Status geral
pm2 status

# Status específico
pm2 show webhook-pgfn

# Monitoramento
pm2 monit
```

## 9. Testar reinicialização

```bash
# Reiniciar serviço
pm2 restart webhook-pgfn

# Verificar se voltou
curl http://167.235.49.166:3000/health
```

## 10. Testar com dados reais do Bitrix24

```bash
# Simular chamada do Bitrix24
curl -X POST http://167.235.49.166:3000/webhook/pgfn \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "40.667.823/0001-90",
    "id": "67890"
  }'
```

## ✅ Checklist de Testes

- [ ] Servidor responde ao health check
- [ ] Busca de dados funciona com CNPJs válidos
- [ ] Busca retorna dados corretos
- [ ] Webhook completo funciona
- [ ] CNPJs inválidos são tratados corretamente
- [ ] Payloads inválidos retornam erro
- [ ] Performance está adequada
- [ ] Logs estão sendo gerados
- [ ] PM2 está gerenciando o processo
- [ ] Reinicialização funciona

## 🐛 Troubleshooting

### Servidor não responde:
```bash
pm2 status
pm2 logs webhook-pgfn
pm2 restart webhook-pgfn
```

### Erro de conexão com banco:
```bash
psql -h 167.235.49.166 -U ville_admin -d bitrix -c "SELECT COUNT(*) FROM convencional_sn;"
```

### Erro no Bitrix24:
```bash
# Verificar se o webhook está acessível
curl -I http://167.235.49.166:3000/webhook/pgfn

# Testar com dados reais
curl -X POST http://167.235.49.166:3000/webhook/pgfn \
  -H "Content-Type: application/json" \
  -d '{"cnpj": "CNPJ_REAL", "id": "ID_REAL"}'
```
