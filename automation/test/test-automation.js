#!/usr/bin/env node

/**
 * Teste específico para o negócio "teste nathan"
 */
const axios = require('axios');

const BITRIX_CONFIG = {
  api_url: 'https://grupovillela.bitrix24.com.br/rest/28/2js7aupbd48aed3o'
};

async function testNathanDeal() {
  console.log('='.repeat(80));
  console.log('🧪 TESTE ESPECÍFICO - NEGÓCIO "TESTE NATHAN"');
  console.log('='.repeat(80));
  
  try {
    // Etapa 1: Buscar negócio "teste nathan"
    console.log('\n📋 ETAPA 1: Buscando negócio "teste nathan"...');
    
    const url = `${BITRIX_CONFIG.api_url}/crm.deal.list`;
    const params = {
      filter: {
        CATEGORY_ID: "17",
        STAGE_ID: "C17:NEW",
        TITLE: "teste nathan"
      },
      select: ["ID", "TITLE", "STAGE_ID", "CATEGORY_ID", "COMPANY_ID"]
    };
    
    const response = await axios.get(url, { params });
    const data = response.data;
    
    if (!data.result || data.result.length === 0) {
      throw new Error('Negócio "teste nathan" não encontrado');
    }
    
    const deal = data.result[0];
    console.log(`✅ Negócio encontrado: ID ${deal.ID} - "${deal.TITLE}"`);
    console.log(`   Pipeline: ${deal.CATEGORY_ID}, Fase: ${deal.STAGE_ID}`);
    console.log(`   Empresa ID: ${deal.COMPANY_ID || 'Não informado'}`);
    
    // Etapa 2: Buscar detalhes completos do negócio
    console.log('\n📊 ETAPA 2: Buscando detalhes completos do negócio...');
    
    const dealUrl = `${BITRIX_CONFIG.api_url}/crm.deal.get`;
    const dealParams = { id: deal.ID };
    const dealResponse = await axios.get(dealUrl, { params: dealParams });
    const dealData = dealResponse.data;
    
    const dealDetail = dealData.result;
    console.log(`✅ Dados completos obtidos para negócio ${deal.ID}`);
    
    // Verificar campos PGFN atuais
    console.log('\n🔍 ETAPA 3: Verificando campos PGFN atuais...');
    
    const pgfnFields = [
      'UF_CRM_1758806120', 'UF_CRM_1758806167', 'UF_CRM_1758808716',
      'UF_CRM_1758806267', 'UF_CRM_1758806322', 'UF_CRM_1758806337',
      'UF_CRM_1758806357', 'UF_CRM_1758806370', 'UF_CRM_1758806394'
    ];
    
    console.log('📋 Campos PGFN atuais:');
    pgfnFields.forEach(field => {
      console.log(`   ${field}: ${dealDetail[field] || 'VAZIO'}`);
    });
    
    // Etapa 4: Consultar API PGFN com CNPJ de teste
    console.log('\n🔍 ETAPA 4: Consultando API PGFN...');
    
    const testCNPJ = '44718903000188'; // CNPJ que sabemos que tem dados
    console.log(`📝 Usando CNPJ de teste: ${testCNPJ}`);
    
    // Consultar nossa API PGFN diretamente
    const pgfnUrl = 'http://167.235.49.166:3000/api/cnpj/44718903000188';
    const pgfnResponse = await axios.get(pgfnUrl);
    
    if (!pgfnResponse.data.success) {
      throw new Error('API PGFN retornou erro: ' + pgfnResponse.data.error);
    }
    
    // Formatear dados para campos Bitrix
    const pgfnData = {
      bitrix_fields: {
        'UF_CRM_1758806120': pgfnResponse.data.dados_receita.total_divida_ativa,
        'UF_CRM_1758806167': pgfnResponse.data.dados_receita.execucao_fiscal_ativa,
        'UF_CRM_1758808716': pgfnResponse.data.dados_receita.cpf_socio_responde,
        'UF_CRM_1758806267': pgfnResponse.data.dados_receita.transacao_impugnacao,
        'UF_CRM_1758806322': pgfnResponse.data.dados_receita.parcelamentos_5_anos,
        'UF_CRM_1758806337': pgfnResponse.data.dados_receita.parcelamentos_ativos,
        'UF_CRM_1758806357': pgfnResponse.data.dados_receita.total_parcelado,
        'UF_CRM_1758806370': pgfnResponse.data.dados_receita.total_saldo_devedor,
        'UF_CRM_1758806394': pgfnResponse.data.dados_receita.possui_transacao_beneficio
      },
      cnpj: pgfnResponse.data.cnpj_consultado,
      execution_time: pgfnResponse.data.execution_time_ms
    };
    console.log('✅ Dados PGFN obtidos com sucesso!');
    console.log(`   CNPJ consultado: ${pgfnData.cnpj}`);
    console.log(`   Tempo de consulta: ${pgfnData.execution_time}ms`);
    
    // Etapa 5: Preparar campos para atualização
    console.log('\n📝 ETAPA 5: Preparando campos para atualização...');
    
    const fieldsToUpdate = pgfnData.bitrix_fields;
    console.log('📋 Campos que serão atualizados:');
    Object.keys(fieldsToUpdate).forEach(field => {
      console.log(`   ${field}: ${fieldsToUpdate[field]}`);
    });
    
    // Etapa 6: Atualizar campos no Bitrix
    console.log('\n🔄 ETAPA 6: Atualizando campos no Bitrix...');
    
    const updateUrl = `${BITRIX_CONFIG.api_url}/crm.deal.update`;
    const updateData = {
      id: deal.ID,
      fields: fieldsToUpdate
    };
    
    const updateResponse = await axios.post(updateUrl, updateData);
    const updateResult = updateResponse.data;
    
    if (updateResult.result) {
      console.log('✅ Campos atualizados com sucesso!');
      console.log(`   Resultado: ${updateResult.result}`);
    } else {
      console.log('❌ Falha ao atualizar campos:', updateResult);
    }
    
    // Etapa 7: Verificar campos após atualização
    console.log('\n✅ ETAPA 7: Verificando campos após atualização...');
    
    const verifyResponse = await axios.get(dealUrl, { params: dealParams });
    const verifyData = verifyResponse.data;
    const updatedDeal = verifyData.result;
    
    console.log('📋 Campos PGFN após atualização:');
    pgfnFields.forEach(field => {
      const oldValue = dealDetail[field] || 'VAZIO';
      const newValue = updatedDeal[field] || 'VAZIO';
      console.log(`   ${field}: "${oldValue}" → "${newValue}"`);
    });
    
    console.log('\n🎉 TESTE COMPLETO EXECUTADO COM SUCESSO!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error(error.message);
    console.error('');
    
    console.log('\n🔍 POSSÍVEIS CAUSAS:');
    console.log('- Negócio "teste nathan" não encontrado');
    console.log('- Erro na consulta à API PGFN');
    console.log('- Falha ao atualizar campos no Bitrix');
    console.log('- Problema de conectividade');
  }
}

// Executar teste específico
testNathanDeal().catch(console.error);
