#!/usr/bin/env python3
const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: '167.235.49.166',
  database: 'bitrix',
  user: 'ville_admin',
  password: '20@?9uVw0-w@',
  port: 5432
});

async function debugQuery() {
  const client = await pool.connect();
  const cnpj = '44.718.903/0001-88';
  
  try {
    console.log('='.repeat(50));
    console.log(`🔍 Debugando CNPJ: ${cnpj}`);
    
    // 1. Busca exata
    console.log('\n1. Busca exata:');
    let result = await client.query('SELECT * FROM convencional_sn WHERE cnpj = $1', [cnpj]);
    console.log(`Encontrados: ${result.rowCount}`);
    if (result.rows.length > 0) {
      console.log('Primeiro registro:', result.rows[0]);
    }
    
    // 2. Busca com LIKE
    console.log('\n2. Busca com LIKE:');
    result = await client.query('SELECT * FROM convencional_sn WHERE cnpj LIKE $1', [cnpj]);
    console.log(`Encontrados: ${result.rowCount}`);
    if (result.rows.length > 0) {
      console.log('Primeiro registro:', result.rows[0]);
    }
    
    // 3. Verificar formato exato do CNPJ no banco
    console.log('\n3. Formato do CNPJ no banco:');
    result = await client.query(`
      SELECT cnpj, LENGTH(cnpj) as tamanho, 
             CASE WHEN cnpj ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$' 
                  THEN 'Formatado' ELSE 'Não formatado' END as formato
      FROM convencional_sn 
      WHERE cnpj LIKE '%44718903%' OR cnpj LIKE '%44.718.903%'
    `);
    console.log(`Encontrados: ${result.rowCount}`);
    result.rows.forEach(row => {
      console.log('CNPJ:', row.cnpj);
      console.log('Tamanho:', row.tamanho);
      console.log('Formato:', row.formato);
    });
    
    // 4. Testar query completa
    console.log('\n4. Query completa:');
    const fullQuery = `
      WITH dados_consolidados AS (
        SELECT 
          COUNT(*) as total_parcelamentos,
          COUNT(CASE WHEN saldo_devedor > 0 THEN 1 END) as parcelamentos_ativos,
          COALESCE(SUM(valor_parcelado), 0) as total_parcelado,
          COALESCE(SUM(saldo_devedor), 0) as total_saldo_devedor,
          false as tem_responsabilidade_socio,
          false as tem_impugnacao,
          false as tem_beneficio
        FROM convencional_sn 
        WHERE cnpj = $1::text
      )
      SELECT * FROM dados_consolidados;
    `;
    
    result = await client.query(fullQuery, [cnpj]);
    console.log('Resultado:', result.rows[0]);
    
    // 5. Mostrar alguns CNPJs do banco
    console.log('\n5. Exemplos de CNPJs no banco:');
    result = await client.query('SELECT DISTINCT cnpj FROM convencional_sn LIMIT 5');
    result.rows.forEach(row => {
      console.log('CNPJ:', row.cnpj);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    pool.end();
  }
}

debugQuery().catch(console.error);
