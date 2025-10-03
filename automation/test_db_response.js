#!/usr/bin/env node

const axios = require('axios');

/**
 * Teste para verificar resposta do banco de dados
 */
async function testDatabaseResponse() {
  const baseURL = 'http://167.235.49.166:3000';
  
  // CNPJ de teste (o "teste nathan")
  const testCNPJ = '44718903000188';

  console.log('🧪 TESTE DE RESPOSTA DO BANCO DE DADOS');
  console.log('=' .repeat(50));
  console.log(`🔍 CNPJ Teste: ${testCNPJ}`);
  console.log(`🌐 API URL: ${baseURL}/api/cnpj/${testCNPJ}`);
  console.log('');

  try {
    // Fazer requisição para API
    const startTime = Date.now();
    const response = await axios.get(`${baseURL}/api/cnpj/${testCNPJ}`, {
      timeout: 10000
    });
    const endTime = Date.now();

    console.log('✅ CONEXÃO COM API OK');
    console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
    console.log('');

    // Extrair dados
    const apiData = response.data;
    const pgfnData = apiData.dados_receita;
    
    console.log('📊 DADOS DA RECEITA FEDERAL:');
    console.log('-' .repeat(30));
    
    // Mostrar TODOS os campos retornados
    Object.keys(pgfnData).forEach(field => {
      const value = pgfnData[field];
      console.log(`📋 ${field}: ${value} (tipo: ${typeof value})`);
    });
    
    console.log('');
    console.log('📊 DADOS DA EMPRESA:');
    console.log('-' .repeat(30));
    
    if (apiData.empresa) {
      Object.keys(apiData.empresa).forEach(field => {
        const value = apiData.empresa[field];
        console.log(`🏢 ${field}: ${value} (tipo: ${typeof value})`);
      });
    }
    
    console.log('');
    console.log('🎯 ANÁLISE DOS CAMPOS IMPORTANTES:');
    console.log('-' .repeat(40));
    
    // Análise específica dos campos em questão
    const execucaoFiscal = pgfnData.execucao_fiscal_ativa;
    const transacaoBeneficio = pgfnData.possui_transacao_beneficio;
    
    console.log(`🔍 execucao_fiscal_ativa: ${execucaoFiscal}`);
    console.log(`   📝 Descrição: Execução fiscal ativa (SIM/NÃO)`);
    console.log(`   🎯 Valor atual: "${execucaoFiscal}"`);
    console.log(`   ❓ Sempre marcado? ${execucaoFiscal === 'SIM' ? 'SIM (sempre)' : 'NÃO (varia)'}`);
    
    console.log('');
    console.log(`🔍 possui_transacao_beneficio: ${transacaoBeneficio}`);
    console.log(`   📝 Descrição: Possui transação com benefício (SIM/NÃO)`);
    console.log(`   🎯 Valor atual: "${transacaoBeneficio}"`);
    console.log(`   ❓ Sempre marcado? ${transacaoBeneficio === 'SIM' ? 'SIM (sempre)' : 'NÃO (varia)'}`);
    
    console.log('');
    console.log('🔄 PADRÕES DE VALORES VISTOS:');
    console.log('-' .repeat(30));
    
    // Verificar padrões dos valores
    Object.keys(pgfnData).forEach(field => {
      const value = pgfnData[field];
      let pattern = '';
      
      if (value === 'SIM' || value === 'NÃO') {
        pattern = '✅ SIM/NÃO';
      } else if (typeof value === 'number') {
        pattern = '🔢 Numérico';
      } else if (typeof value === 'string' && value.includes('R$')) {
        pattern = '💰 Monetário';
      } else if (typeof value === 'string') {
        pattern = '📝 Texto';
      }
      
      console.log(`   ${field}: "${value}" → ${pattern}`);
    });
    
    console.log('');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.log('');
    console.log('❌ ERRO NO TESTE:');
    if (error.response) {
      console.log(`📡 Status: ${error.response.status}`);
      console.log(`📄 Resposta: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log('🌐 Erro de conexão com a API');
      console.log(`🔗 URL: ${error.request.url}`);
    } else {
      console.log(`💥 Erro: ${error.message}`);
    }
  }
}

// Executar teste
testDatabaseResponse().catch(console.error);
