const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '167.235.49.166',
  database: 'bitrix',
  user: 'ville_admin',
  password: '20@?9uVw0-w@',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  console.log('🔍 Testando conexão com banco...');
  
  const start = Date.now();
  
  try {
    const client = await pool.connect();
    console.log(`✅ Conexão estabelecida em ${Date.now() - start}ms`);
    
    // Testar consulta
    const queryStart = Date.now();
    const result = await client.query('SELECT COUNT(*) FROM convencional_sn LIMIT 1');
    console.log(`✅ Consulta executada em ${Date.now() - queryStart}ms`);
    console.log(`📊 Resultado:`, result.rows[0]);
    
    client.release();
    
    // Testar CNPJ específico
    const cnpjStart = Date.now();
    const cnpjResult = await testCNPJ('08.930.359/0001-70');
    console.log(`✅ Busca por CNPJ executada em ${Date.now() - cnpjStart}ms`);
    console.log(`📊 Resultado:`, cnpjResult);
    
    pool.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    pool.end();
  }
}

async function testCNPJ(cnpj) {
  const client = await pool.connect();
  
  try {
    const cleanedCNPJ = cnpj.replace(/[^\d]/g, '');
    const formattedCNPJ = cnpj;
    
    console.log(`🔍 Buscando CNPJ: ${cnpj} (limpo: ${cleanedCNPJ})`);
    
    // Buscar em convencional_sn
    const query = `
      SELECT 
        COUNT(*) as total_parcelamentos,
        SUM(CASE WHEN saldo_devedor > 0 THEN 1 ELSE 0 END) as parcelamentos_ativos,
        SUM(valor_parcelado) as total_parcelado,
        SUM(saldo_devedor) as total_saldo_devedor
      FROM convencional_sn 
      WHERE cnpj = $1 OR cnpj = $2
    `;
    
    const start = Date.now();
    const result = await client.query(query, [cleanedCNPJ, formattedCNPJ]);
    console.log(`⏱️ Consulta demorou ${Date.now() - start}ms`);
    
    client.release();
    
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    client.release();
    throw error;
  }
}

testConnection();
