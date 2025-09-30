const axios = require('axios');

// Configuração
const WEBHOOK_URL = 'http://167.235.49.166:3000';
const TEST_CNPJS = [
    '25.091.198/0001-97', // GPLAN COMERCIO DE MOVEIS LTDA
    '40.667.823/0001-90', // EL SHADAY PARAFUSOS E PECAS LTDA
    '31.138.551/0001-40', // ODERDENGE RESTAURANTE LTDA
    '08.175.509/0001-87', // GISELE PEREIRA BORGES
    '52.634.295/0001-51'  // R A DOS SANTOS COELHO
];

// Função para testar health check
async function testHealthCheck() {
    console.log('🏥 Testando Health Check...');
    try {
        const response = await axios.get(`${WEBHOOK_URL}/health`);
        console.log('✅ Health Check OK:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check falhou:', error.message);
        return false;
    }
}

// Função para testar busca de dados
async function testDataSearch(cnpj) {
    console.log(`\n🔍 Testando busca de dados para CNPJ: ${cnpj}`);
    try {
        const response = await axios.get(`${WEBHOOK_URL}/test/${cnpj}`);
        console.log('✅ Dados encontrados:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Erro na busca:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar webhook completo
async function testWebhook(cnpj, contactId = '12345') {
    console.log(`\n📡 Testando webhook completo para CNPJ: ${cnpj}`);
    try {
        const payload = {
            cnpj: cnpj,
            id: contactId
        };
        
        const response = await axios.post(`${WEBHOOK_URL}/webhook/pgfn`, payload);
        console.log('✅ Webhook executado com sucesso:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Erro no webhook:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar CNPJs inválidos
async function testInvalidCNPJs() {
    console.log('\n🚫 Testando CNPJs inválidos...');
    
    const invalidCNPJs = [
        '123.456.789/0001-00', // CNPJ inválido
        '000.000.000/0000-00', // CNPJ zerado
        'abc.def.ghi/jkl-mn',  // CNPJ com letras
        '',                    // CNPJ vazio
        null                   // CNPJ nulo
    ];
    
    for (const cnpj of invalidCNPJs) {
        console.log(`\n🔍 Testando CNPJ inválido: ${cnpj}`);
        try {
            const response = await axios.get(`${WEBHOOK_URL}/test/${cnpj}`);
            console.log('📊 Resultado:', response.data);
        } catch (error) {
            console.log('❌ Erro esperado:', error.response?.status, error.response?.data?.error);
        }
    }
}

// Função para testar payload inválido
async function testInvalidPayload() {
    console.log('\n🚫 Testando payloads inválidos...');
    
    const invalidPayloads = [
        {}, // Payload vazio
        { cnpj: '123.456.789/0001-00' }, // Sem ID
        { id: '12345' }, // Sem CNPJ
        { cnpj: '', id: '' }, // Campos vazios
        { cnpj: null, id: null } // Campos nulos
    ];
    
    for (const payload of invalidPayloads) {
        console.log(`\n📡 Testando payload:`, payload);
        try {
            const response = await axios.post(`${WEBHOOK_URL}/webhook/pgfn`, payload);
            console.log('📊 Resultado:', response.data);
        } catch (error) {
            console.log('❌ Erro esperado:', error.response?.status, error.response?.data?.error);
        }
    }
}

// Função para testar performance
async function testPerformance() {
    console.log('\n⚡ Testando performance...');
    
    const startTime = Date.now();
    const promises = [];
    
    // Testar 10 requisições simultâneas
    for (let i = 0; i < 10; i++) {
        const cnpj = TEST_CNPJS[i % TEST_CNPJS.length];
        promises.push(testDataSearch(cnpj));
    }
    
    try {
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ 10 requisições concluídas em ${duration}ms`);
        console.log(`📊 Média: ${duration / 10}ms por requisição`);
        
        const successCount = results.filter(r => r !== null).length;
        console.log(`📈 Taxa de sucesso: ${successCount}/10 (${(successCount/10)*100}%)`);
        
    } catch (error) {
        console.error('❌ Erro no teste de performance:', error.message);
    }
}

// Função principal
async function runTests() {
    console.log('🚀 === INICIANDO TESTES DO WEBHOOK PGFN ===\n');
    
    // 1. Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('❌ Servidor não está respondendo. Verifique se está rodando.');
        return;
    }
    
    // 2. Testar busca de dados com CNPJs válidos
    console.log('\n📊 === TESTANDO CNPJs VÁLIDOS ===');
    for (const cnpj of TEST_CNPJS) {
        await testDataSearch(cnpj);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay de 1s
    }
    
    // 3. Testar webhook completo
    console.log('\n📡 === TESTANDO WEBHOOK COMPLETO ===');
    for (const cnpj of TEST_CNPJS.slice(0, 3)) { // Testar apenas 3 para não sobrecarregar
        await testWebhook(cnpj, `test_${Date.now()}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay de 2s
    }
    
    // 4. Testar CNPJs inválidos
    await testInvalidCNPJs();
    
    // 5. Testar payloads inválidos
    await testInvalidPayload();
    
    // 6. Teste de performance
    await testPerformance();
    
    console.log('\n🎉 === TESTES CONCLUÍDOS ===');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verificar se todos os testes passaram');
    console.log('2. Configurar automação no Bitrix24');
    console.log('3. Testar com dados reais do Bitrix24');
    console.log('4. Monitorar logs: pm2 logs webhook-pgfn');
}

// Executar testes
runTests().catch(error => {
    console.error('❌ Erro geral nos testes:', error);
    process.exit(1);
});
