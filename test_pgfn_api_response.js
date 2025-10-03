#!/usr/bin/env node

const axios = require('axios');

async function testPGFNAPIResponse() {
  try {
    console.log('🔍 TESTANDO RESPOSTA DA API PGFN');
    console.log('==========================================');
    
    const CNPJ = '44718903000188';
    const URL = `http://167.235.49.166:3000/api/cnpj/${CNPJ}`;
    
    console.log(`📡 Chamando: ${URL}`);
    console.log('');

    const response = await axios.get(URL);
    const data = response.data;
    
    console.log('📊 ESTRUTURA DA RESPOSTA:');
    console.log('====================');
    console.log('✅ Success:', data.success);
    console.log('🔢 CNPJ consultado:', data.cnpj_consultado);
    console.log('');
    
    if (data.empresa) {
      console.log('🏢 EMPRESA DATA:');
      console.log('================');
      console.log('✅ Nome:', data.empresa.nome || 'N/A');
      console.log('📍 Municipio:', data.empresa.municipio || 'N/A');
      console.log('🗺️ UF:', data.empresa.uf || 'N/A');
      console.log('🏭 CNAE:', data.empresa.cnae || 'N/A');
      console.log('📏 Porte:', data.empresa.porte || 'N/A');
      console.log('');
    }
    
    if (data.dados_receita) {
      console.log('💰 DADOS RECEITA:');
      console.log('=================');
      console.log('💵 Total Divida Ativa:', data.dados_receita.total_divida_ativa || 'N/A');
      console.log('⚖️ Execução Fiscal Ativa:', data.dados_receita.execucao_fiscal_ativa || 'N/A');
      console.log('👤 CPF Sócio Responde:', data.dados_receita.cpf_socio_responde || 'N/A');
      console.log('⚔️ Transação Impugnação:', data.dados_receita.transacao_impugnacao || 'N/A');
      console.log('🔢 Parcelamentos 5 Anos:', data.dados_receita.parcelamentos_5_anos || 'N/A');
      console.log('🔄 Parcelamentos Ativos:', data.dados_receita.parcelamentos_ativos || 'N/A');
      console.log('💳 Total Parcelado:', data.dados_receita.total_parcelado || 'N/A');
      console.log('💸 Total Saldo Devedor:', data.dados_receita.total_saldo_devedor || 'N/A');
      console.log('🎁 Possui Transação Benefício:', data.dados_receita.possui_transacao_beneficio || 'N/A');
      console.log('');
    }
    
    // Testar a função de conversão simulando
    console.log('🧪 TESTANDO CONVERSÃO PARA BITRIX:');
    console.log('===================================');
    
    const bitrixFields = {
      // Campos monetários
      'UF_CRM_1758806120': data.dados_receita.total_divida_ativa?.replace(/[R$\s.]/g, '').replace(',', '.'),
      'UF_CRM_1758806370': data.dados_receita.total_saldo_devedor?.replace(/[R$\s.]/g, '').replace(',', '.'),
      'UF_CRM_1758806357': data.dados_receita.total_parcelado?.replace(/[R$\s.]/g, '').replace(',', '.'),
      
      // Campos booleanos
      'UF_CRM_1758806167': data.dados_receita.execucao_fiscal_ativa === 'SIM' ? '1' : '0',
      'UF_CRM_1758808716': data.dados_receita.cpf_socio_responde === 'SIM' ? '1' : '0',
      'UF_CRM_1758806267': data.dados_receita.transacao_impugnacao === 'SIM' ? '1' : '0',
      'UF_CRM_1758806394': data.dados_receita.possui_transacao_beneficio === 'SIM' ? '1' : '0',
      
      // Campos numéricos
      'UF_CRM_1758806322': String(data.dados_receita.parcelamentos_5_anos || 0),
      'UF_CRM_1758806337': String(data.dados_receita.parcelamentos_ativos || 0),
      
      // Nome empresa
      'UF_CRM_1557101315015': data.empresa?.nome || ''
    };
    
    for (const [fieldId, value] of Object.entries(bitrixFields)) {
      const fieldMap = {
        'UF_CRM_1758806120': '💰 Total Dívida Ativa',
        'UF_CRM_1758806167': '⚖️ Execução Fiscal Ativa',
        'UF_CRM_1758808716': '👤 CPF Sócio Responde',
        'UF_CRM_1758806267': '⚔️ Transação Impugnação',
        'UF_CRM_1758806322': '🔢 Parcelamentos 5 Anos',
        'UF_CRM_1758806337': '🔄 Parcelamentos Ativos',
        'UF_CRM_1758806357': '💳 Total Parcelado',
        'UF_CRM_1758806370': '💸 Total Saldo Devedor',
        'UF_CRM_1758806394': '🎁 Posui Transação Benefício',
        'UF_CRM_1557101315015': '🏢 Nome Empresa'
      };
      
      console.log(`${fieldMap[fieldId]} (${fieldId}):`);
      console.log(`   Valor origem: "${data.dados_receita[Object.keys(data.dados_receita).find(k => 
        Object.values(bitrixFields).some(v => v === String(data.dados_receita[k]))
      )] || 'N/A'}"`);
      console.log(`   Valor convertido: "${value}"`);
      console.log(`   Status: ${value ? '✅ Preenchido' : '❌ Vazio'}`);
      console.log('');
    }
    
  } catch (error) {
    console.log('');
    console.log('❌ ERRO:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPGFNAPIResponse();
