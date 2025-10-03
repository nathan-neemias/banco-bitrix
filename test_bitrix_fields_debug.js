#!/usr/bin/env node

const axios = require('axios');

// Configuração do Bitrix
const BITRIX_ENDPOINT = 'https://grupovillela.bitrix24.com.br/rest/28/2js7aupbd48aed3o';
const DEAL_ID = 88723; // Negócio do teste

async function debugBitrixFields() {
  try {
    console.log('🔍 DEBBUGANDO CAMPOS DO BITRIX');
    console.log('==========================================');
    console.log(`📋 Negócio ID: ${DEAL_ID}`);
    console.log('');

    // 1. Buscar dados do negócio
    console.log('📥 Buscando dados do negócio...');
    const dealResponse = await axios.get(`${BITRIX_ENDPOINT}/crm.deal.get`, {
      params: {
        ID: DEAL_ID,
        select: ['ID', 'TITLE', 'UF_CRM_1745494235'] // campos básicos + CNPJ
      }
    });

    const dealData = dealResponse.data.result;
    console.log(`✅ Negócio encontrado: "${dealData.TITLE}"`);
    console.log(`🔢 CNPJ: ${dealData.UF_CRM_1745494235 || 'N/A'}`);
    console.log('');

    // 2. Buscar TODOS os campos customizados
    console.log('🔍 Buscando todos os campos personalizados...');
    const customFieldsResponse = await axios.get(`${BITRIX_ENDPOINT}/crm.deal.fields`);
    const customFields = customFieldsResponse.data.result;

    // Filtrar apenas UF_CRM (campos customizados)
    const ufFields = Object.keys(customFields)
      .filter(key => key.startsWith('UF_CRM_'))
      .reduce((obj, key) => {
        obj[key] = customFields[key];
        return obj;
      }, {});

    console.log(`📊 Total de campos customizados: ${Object.keys(ufFields).length}`);
    console.log('');

    // 3. Buscar valores específicos dos campos PGFN
    console.log('🔍 Buscando valores dos campos PGFN...');
    const dealDetailsResponse = await axios.get(`${BITRIX_ENDPOINT}/crm.deal.get`, {
      params: {
        ID: DEAL_ID,
        select: [
          'ID',
          'TITLE',
          // Campos PGFN
          'UF_CRM_1758806120',  // total_divida_ativa
          'UF_CRM_1758806167',  // execucao_fiscal_ativa
          'UF_CRM_1758808716',  // cpf_socio_responde
          'UF_CRM_1758806267',  // transacao_impugnacao
          'UF_CRM_1758806322',  // parcelamentos_5_anos
          'UF_CRM_1758806337',  // parcelamentos_ativos
          'UF_CRM_1758806357',  // total_parcelado
          'UF_CRM_1758806370',  // total_saldo_devedor
          'UF_CRM_1758806394',  // possui_transacao_beneficio
          'UF_CRM_1557101315015' // nome_empresa
        ]
      }
    });

    const detailedData = dealDetailsResponse.data.result;
    console.log('📊 VALORES ATUAIS DOS CAMPOS:');
    console.log('');

    const fieldMapping = {
      'UF_CRM_1758806120': '💰 Total Dívida Ativa',
      'UF_CRM_1758806167': '⚖️ Execução Fiscal Ativa',
      'UF_CRM_1758808716': '👤 CPF Sócio Responde',
      'UF_CRM_1758806267': '⚔️ Transação Impugnação',
      'UF_CRM_1758806322': '🔢 Parcelamentos 5 Anos',
      'UF_CRM_1758806337': '🔄 Parcelamentos Ativos',
      'UF_CRM_1758806357': '💳 Total Parcelado',
      'UF_CRM_1758806370': '💸 Total Saldo Devedor',
      'UF_CRM_1758806394': '🎁 Possui Transação Benefício',
      'UF_CRM_1557101315015': '🏢 Nome Empresa'
    };

    for (const [fieldId, fieldName] of Object.entries(fieldMapping)) {
      const value = detailedData[fieldId];
      const status = value ? '✅' : '❌';
      console.log(`${status} ${fieldName}:`);
      console.log(`   Campo ID: ${fieldId}`);
      console.log(`   Valor: "${value}" (tipo: ${typeof value})`);
      console.log(`   Vazio: ${!value || value === '' || value === null}`);
      console.log('');
    }

    // 4. Verificar estrutura dos campos no Bitrix
    console.log('🔍 ESTRUTURA DOS CAMPOS NO BITRIX:');
    console.log('');

    const pgfnFields = ['UF_CRM_1758808716', 'UF_CRM_1758806267']; // campos que já vimos como problemáticos
    for (const fieldId of pgfnFields) {
      const fieldInfo = ufFields[fieldId];
      if (fieldInfo) {
        console.log(`📋 Campo: ${fieldId}`);
        console.log(`   Nome: ${fieldInfo.TITLE || 'N/A'}`);
        console.log(`   Tipo: ${fieldInfo.TYPE || 'N/A'}`);
        console.log(`   Multipla: ${fieldInfo.MULTIPLE || 'N/A'}`);
        console.log(`   Items: ${fieldInfo.ITEMS ? JSON.stringify(fieldInfo.ITEMS) : 'N/A'}`);
        console.log('');
      } else {
        console.log(`❌ Campo ${fieldId} não encontrado!`);
      }
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

debugBitrixFields();
