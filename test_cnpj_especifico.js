const axios = require('axios');

// CNPJ de teste específico
const TEST_CNPJ = '08.930.359/0001-70';
const WEBHOOK_URL = 'http://167.235.49.166:3000';

console.log(`🧪 === TESTANDO CNPJ ESPECÍFICO: ${TEST_CNPJ} ===\n`);

// Função para testar busca de dados
async function testDataSearch() {
    console.log('🔍 1. Testando busca de dados...');
    try {
        const response = await axios.get(`${WEBHOOK_URL}/test/${TEST_CNPJ}`);
        console.log('✅ Dados encontrados:');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Erro na busca:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar webhook completo
async function testWebhook() {
    console.log('\n📡 2. Testando webhook completo...');
    try {
        const payload = {
            cnpj: TEST_CNPJ,
            id: 'test_contact_123'
        };
        
        console.log('📤 Enviando payload:', payload);
        
        const response = await axios.post(`${WEBHOOK_URL}/webhook/pgfn`, payload);
        console.log('✅ Webhook executado com sucesso:');
        console.log(JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Erro no webhook:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar diferentes formatos do CNPJ
async function testCNPJFormats() {
    console.log('\n🔄 3. Testando diferentes formatos do CNPJ...');
    
    const formats = [
        '08.930.359/0001-70',  // Formato completo
        '08930359000170',      // Apenas números
        '08.930.359/0001-70',  // Com pontos e barra
        '08930359/0001-70'     // Sem pontos
    ];
    
    for (const format of formats) {
        console.log(`\n🔍 Testando formato: ${format}`);
        try {
            const response = await axios.get(`${WEBHOOK_URL}/test/${format}`);
            console.log('✅ Resultado:', response.data.data);
        } catch (error) {
            console.log('❌ Erro:', error.response?.data?.error || error.message);
        }
    }
}

// Função para verificar se o CNPJ existe no banco
async function checkCNPJInDatabase() {
    console.log('\n🗄️ 4. Verificando se CNPJ existe no banco...');
    
    // Simular consulta direta no banco (via webhook)
    try {
        const response = await axios.get(`${WEBHOOK_URL}/test/${TEST_CNPJ}`);
        const data = response.data.data;
        
        if (data.total_parcelamentos > 0) {
            console.log('✅ CNPJ encontrado no banco!');
            console.log(`📊 Total de parcelamentos: ${data.total_parcelamentos}`);
            console.log(`📊 Parcelamentos ativos: ${data.parcelamentos_ativos}`);
            console.log(`💰 Total parcelado: R$ ${data.total_parcelado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
            console.log(`💸 Saldo devedor: R$ ${data.total_saldo_devedor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
        } else {
            console.log('⚠️ CNPJ não encontrado no banco ou sem parcelamentos');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error.message);
        return null;
    }
}

// Função para testar simulação do Bitrix24
async function simulateBitrix24() {
    console.log('\n🎯 5. Simulando chamada do Bitrix24...');
    
    try {
        // Simular como o Bitrix24 chamaria o webhook
        const bitrixPayload = {
            cnpj: TEST_CNPJ,
            id: 'bitrix_contact_456'
        };
        
        console.log('📤 Payload do Bitrix24:', bitrixPayload);
        
        const response = await axios.post(`${WEBHOOK_URL}/webhook/pgfn`, bitrixPayload);
        
        if (response.data.success) {
            console.log('✅ Simulação do Bitrix24 bem-sucedida!');
            console.log('📋 Dados que seriam enviados para o Bitrix24:');
            
            const pgfnData = response.data.data.pgfn_data;
            console.log(`   • Total Dívida Ativa: R$ ${pgfnData.total_saldo_devedor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
            console.log(`   • Execução Fiscal Ativa: ${pgfnData.parcelamentos_ativos > 0 ? 'Sim' : 'Não'}`);
            console.log(`   • Parcelamentos (5 anos): ${pgfnData.total_parcelamentos}`);
            console.log(`   • Parcelamentos Ativos: ${pgfnData.parcelamentos_ativos}`);
            console.log(`   • Total Parcelado: R$ ${pgfnData.total_parcelado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
            console.log(`   • Saldo Devedor: R$ ${pgfnData.total_saldo_devedor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
        } else {
            console.log('❌ Erro na simulação:', response.data.error);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Erro na simulação:', error.response?.data || error.message);
        return null;
    }
}

// Função principal
async function runSpecificTest() {
    console.log(`🚀 Iniciando testes específicos para CNPJ: ${TEST_CNPJ}\n`);
    
    // 1. Testar busca de dados
    const searchResult = await testDataSearch();
    
    // 2. Testar webhook completo
    const webhookResult = await testWebhook();
    
    // 3. Testar diferentes formatos
    await testCNPJFormats();
    
    // 4. Verificar no banco
    const dbResult = await checkCNPJInDatabase();
    
    // 5. Simular Bitrix24
    const bitrixResult = await simulateBitrix24();
    
    // Resumo final
    console.log('\n📊 === RESUMO DOS TESTES ===');
    console.log(`CNPJ testado: ${TEST_CNPJ}`);
    console.log(`Busca de dados: ${searchResult ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`Webhook completo: ${webhookResult ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`Verificação no banco: ${dbResult ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`Simulação Bitrix24: ${bitrixResult ? '✅ OK' : '❌ FALHOU'}`);
    
    if (dbResult && dbResult.total_parcelamentos > 0) {
        console.log('\n🎉 CNPJ possui dados PGFN! Pronto para usar no Bitrix24.');
    } else {
        console.log('\n⚠️ CNPJ não possui dados PGFN ou não foi encontrado no banco.');
        console.log('💡 Sugestão: Teste com outro CNPJ que tenha parcelamentos.');
    }
    
    console.log('\n📋 Próximos passos:');
    console.log('1. Se todos os testes passaram, configurar no Bitrix24');
    console.log('2. Usar este CNPJ como exemplo na automação');
    console.log('3. Monitorar logs: pm2 logs webhook-pgfn');
}

// Executar teste específico
runSpecificTest().catch(error => {
    console.error('❌ Erro geral no teste:', error);
    process.exit(1);
});
