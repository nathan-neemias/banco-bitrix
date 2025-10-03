#!/usr/bin/env node

const { Pool } = require('pg');

// Configuração do banco
const dbConfig = {
  host: '167.235.49.166',
  port: 5432,
  database: 'bitrix',
  user: 'ville_admin',
  password: '20@?9uVw0-w@',
  ssl: false
};

async function testCNPJ() {
  const pool = new Pool(dbConfig);
  const testCNPJ = '00277489000143';
  const formattedCNPJ = '00.277.489/0001-43';
  
  try {
    console.log('🔍 VERIFICANDO DADOS DO CNPJ');
    console.log('==========================================');
    console.log(`🔢 CNPJ Limpo: ${testCNPJ}`);
    console.log(`📝 CNPJ Formatado: ${formattedCNPJ}`);
    console.log('');

    // 1. Testar tabela convencional_sn
    console.log('📊 TABELA: convencional_sn');
    console.log('-'.repeat(40));
    const sql1 = `
      SELECT 
        cnpj, 
        nome, 
        municipio, 
        uf, 
        valor_parcelado, 
        saldo_devedor,
        qtde_parcelas
      FROM convencional_sn 
      WHERE cnpj = $1 OR cnpj = $2
      LIMIT 5;
    `;
    
    const result1 = await pool.query(sql1, [testCNPJ, formattedCNPJ]);
    console.log(`📋 Registros encontrados: ${result1.rows.length}`);
    
    if (result1.rows.length > 0) {
      result1.rows.forEach((row, index) => {
        console.log(`📄 ${index + 1}. CNPJ: ${row.cnpj}`);
        console.log(`   Nome: ${row.nome}`);
        console.log(`   Municipio: ${row.municipio}`);
        console.log(`   UF: ${row.uf}`);
        console.log(`   Valor Parcelado: R$ ${row.valor_parcelado || '0,00'}`);
        console.log(`   Saldo Devedor: R$ ${row.saldo_devedor || '0,00'}`);
        console.log(`   Qtde Parcelas: ${row.qtde_parcelas || 0}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum registro encontrado');
    }

    // 2. Testar tabela empresas
    console.log('📊 TABELA: empresas');
    console.log('-'.repeat(40));
    const sql2 = `
      SELECT 
        cpf_cnpj, 
        tipo,
        nome, 
        municipio, 
        uf, 
        valor_parcelado, 
        saldo_devedor
      FROM empresas 
      WHERE cpf_cnpj = $1 OR cpf_cnpj = $2
      LIMIT 5;
    `;
    
    const result2 = await pool.query(sql2, [testCNPJ, formattedCNPJ]);
    console.log(`📋 Registros encontrados: ${result2.rows.length}`);
    
    if (result2.rows.length > 0) {
      result2.rows.forEach((row, index) => {
        console.log(`📄 ${index + 1}. CPF/CNPJ: ${row.cpf_cnpj}`);
        console.log(`   Tipo: ${row.tipo}`);
        console.log(`   Nome: ${row.nome}`);
        console.log(`   Municipio: ${row.municipio}`);
        console.log(`   UF: ${row.uf}`);
        console.log(`   Valor Parcelado: R$ ${row.valor_parcelado || '0,00'}`);
        console.log(`   Saldo Devedor: R$ ${row.saldo_devedor || '0,00'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum registro encontrado');
    }

    // 3. Testar tabela especial_pj_pf
    console.log('📊 TABELA: especial_pj_pf');
    console.log('-'.repeat(40));
    const sql3 = `
      SELECT 
        cpf_cnpj, 
        tipo,
        nome, 
        municipio, 
        uf, 
        modalidade,
        valor_parcelado, 
        saldo_devedor
      FROM especial_pj_pf 
      WHERE cpf_cnpj = $1 OR cpf_cnpj = $2
      LIMIT 5;
    `;
    
    const result3 = await pool.query(sql3, [testCNPJ, formattedCNPJ]);
    console.log(`📋 Registros encontrados: ${result3.rows.length}`);
    
    if (result3.rows.length > 0) {
      result3.rows.forEach((row, index) => {
        console.log(`📄 ${index + 1}. CPF/CNPJ: ${row.cpf_cnpj}`);
        console.log(`   Tipo: ${row.tipo}`);
        console.log(`   Nome: ${row.nome}`);
        console.log(`   Municipio: ${row.municipio}`);
        console.log(`   UF: ${row.uf}`);
        console.log(`   Modalidade: ${row.modalidade}`);
        console.log(`   Valor Parcelado: R$ ${row.valor_parcelado || '0,00'}`);
        console.log(`   Saldo Devedor: R$ ${row.saldo_devedor || '0,00'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum registro encontrado');
    }

    // 4. Executar a query da API para ver resultado final
    console.log('🔍 API QUERY (SAME AS SERVER.JS)');
    console.log('-'.repeat(50));
    const apiQuery = `
      WITH dados_consolidados AS (
        SELECT 
          COUNT(*) as total_parcelamentos,
          SUM(CASE WHEN saldo_devedor > 0 THEN 1 ELSE 0 END) as parcelamentos_ativos,
          COALESCE(SUM(valor_parcelado), 0) as total_parcelado,
          COALESCE(SUM(saldo_devedor), 0) as total_saldo_devedor,
          false as tem_responsabilidade_socio,
          false as tem_impugnacao,
          false as tem_beneficio
        FROM convencional_sn 
        WHERE cnpj = $1 OR cnpj = $2
        
        UNION ALL
        
        SELECT 
          COUNT(*) as total_parcelamentos,
          SUM(CASE WHEN saldo_devedor > 0 THEN 1 ELSE 0 END) as parcelamentos_ativos,
          COALESCE(SUM(valor_parcelado), 0) as total_parcelado,
          COALESCE(SUM(saldo_devedor), 0) as total_saldo_devedor,
          false as tem_responsabilidade_socio,
          false as tem_impugnacao,
          false as tem_beneficio
        FROM empresas 
        WHERE cpf_cnpj = $1 OR cpf_cnpj = $2
        
        UNION ALL
        
        SELECT 
          COUNT(*) as total_parcelamentos,
          SUM(CASE WHEN saldo_devedor > 0 THEN 1 ELSE 0 END) as parcelamentos_ativos,
          COALESCE(SUM(valor_parcelado), 0) as total_parcelado,
          COALESCE(SUM(saldo_devedor), 0) as total_saldo_devedor,
          BOOL_OR(modalidade ILIKE '%SOCIO%' OR modalidade ILIKE '%RESPONSÁVEL%') as tem_responsabilidade_socio,
          BOOL_OR(modalidade ILIKE '%IMPUGNAÇÃO%' OR modalidade ILIKE '%IMPUGNACAO%') as tem_impugnacao,
          BOOL_OR(modalidade ILIKE '%BENEFÍCIO%' OR modalidade ILIKE '%BENEFICIO%') as tem_beneficio
        FROM especial_pj_pf 
        WHERE cpf_cnpj = $1 OR cpf_cnpj = $2
      )
      SELECT 
        SUM(total_parcelamentos) as total_parcelamentos,
        SUM(parcelamentos_ativos) as parcelamentos_ativos,
        SUM(total_parcelado) as total_parcelado,
        SUM(total_saldo_devedor) as total_saldo_devedor,
        BOOL_OR(tem_responsabilidade_socio) as tem_responsabilidade_socio,
        BOOL_OR(tem_impugnacao) as tem_impugnacao,
        BOOL_OR(tem_beneficio) as tem_beneficio
      FROM dados_consolidados
    `;
    
    const apiResult = await pool.query(apiQuery, [testCNPJ, formattedCNPJ]);
    console.log('📊 RESULTADO DA API QUERY:');
    console.log('Total Parcelamentos:', apiResult.rows[0].total_parcelamentos);
    console.log('Parcelamentos Ativos:', apiResult.rows[0].parcelamentos_ativos);
    console.log('Total Parcelado:', apiResult.rows[0].total_parcelado);
    console.log('Total Saldo Devedor:', apiResult.rows[0].total_saldo_devedor);
    console.log('Tem Responsabilidade Soc:', apiResult.rows[0].tem_responsabilidade_socio);
    console.log('Tem Impugnação:', apiResult.rows[0].tem_impugnacao);
    console.log('Tem Benefício:', apiResult.rows[0].tem_beneficio);
    
    // Resumo final
    console.log('');
    console.log('📋 RESUMO FINAL:');
    console.log('================');
    if (apiResult.rows[0].total_parcelamentos > 0) {
      console.log('✅ CNPJ encontrado com dados PGFN');
      console.log(`💰 Total de dívida: R$ ${apiResult.rows[0].total_saldo_devedor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
    } else {
      console.log('❌ CNPJ não encontrado ou sem dados PGFN');
    }
    
  } catch (error) {
    console.log('');
    console.log('❌ ERRO:', error.message);
    if (error.code) console.log('Código:', error.code);
  } finally {
    await pool.end();
  }
}

testCNPJ();
