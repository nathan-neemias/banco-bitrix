const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || '167.235.49.166',
  database: process.env.DB_NAME || 'bitrix',
  user: process.env.DB_USER || 'ville_admin',
  password: process.env.DB_PASSWORD || '20@?9uVw0-w@',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuração Bitrix24
const BITRIX_CONFIG = {
  domain: process.env.BITRIX_DOMAIN || 'https://grupovillela.bitrix24.com.br',
  webhook: process.env.BITRIX_WEBHOOK || '/rest/28/bn790kn8m1oo1aw2/',
  fields: {
    total_divida_ativa: 'UF_CRM_1758806120',
    execucao_fiscal_ativa: 'UF_CRM_1758806167',
    cpf_socio_responde: 'UF_CRM_1758808716',
    transacao_impugnacao: 'UF_CRM_1758806267',
    parcelamentos_5_anos: 'UF_CRM_1758806322',
    parcelamentos_ativos: 'UF_CRM_1758806337',
    total_parcelado: 'UF_CRM_1758806357',
    total_saldo_devedor: 'UF_CRM_1758806370',
    transacao_beneficio: 'UF_CRM_1758806394'
  }
};

// Função para limpar CNPJ
function cleanCNPJ(cnpj) {
  if (!cnpj) return null;
  // Remove tudo que não é número
  return cnpj.replace(/[^\d]/g, '');
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
  if (!cnpj) return null;
  const cleaned = cleanCNPJ(cnpj);
  
  // Se tem 14 dígitos, formata como CNPJ
  if (cleaned.length === 14) {
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  // Se tem 11 dígitos, formata como CPF
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  // Se não tem tamanho correto, retorna como está
  return cnpj;
}

// Função para buscar dados PGFN no banco
async function getPGFNData(cnpj) {
  const client = await pool.connect();
  
  try {
    console.time('busca-pgfn');
    const cleanedCNPJ = cleanCNPJ(cnpj);
    const formattedCNPJ = formatCNPJ(cnpj);
    
    console.log(`🔍 Buscando dados PGFN para CNPJ: ${cnpj}`);
    console.log(`📝 CNPJ limpo: ${cleanedCNPJ}`);
    console.log(`📝 CNPJ formatado: ${formattedCNPJ}`);
    console.log('⏳ Iniciando consulta no banco...');
    
    // Query otimizada com UNION ALL para buscar em todas as tabelas de uma vez
    const query = `
      WITH dados_consolidados AS (
        -- Dados de convencional_sn
        SELECT 
          COUNT(*) as total_parcelamentos,
          SUM(CASE WHEN saldo_devedor > 0 THEN 1 ELSE 0 END) as parcelamentos_ativos,
          COALESCE(SUM(valor_parcelado), 0) as total_parcelado,
          COALESCE(SUM(saldo_devedor), 0) as total_saldo_devedor,
          false as tem_responsabilidade_socio,
          false as tem_impugnacao,
          false as tem_beneficio
        FROM convencional_sn 
        WHERE cnpj = $1
        
        UNION ALL
        
        -- Dados de empresas
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
        
        -- Dados de especial_pj_pf com flags adicionais
        SELECT 
          COUNT(*) as total_parcelamentos,
          SUM(CASE WHEN saldo_devedor > 0 THEN 1 ELSE 0 END) as parcelamentos_ativos,
          COALESCE(SUM(valor_parcelado), 0) as total_parcelado,
          COALESCE(SUM(saldo_devedor), 0) as total_saldo_devedor,
          -- Verifica responsabilidade do sócio
          BOOL_OR(modalidade ILIKE '%SOCIO%' OR modalidade ILIKE '%RESPONSÁVEL%') as tem_responsabilidade_socio,
          -- Verifica impugnação
          BOOL_OR(modalidade ILIKE '%IMPUGNAÇÃO%' OR modalidade ILIKE '%IMPUGNACAO%') as tem_impugnacao,
          -- Verifica benefício
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
    
    console.log('📊 Executando query...');
    console.time('query-execution');
    const result = await client.query(query, [cleanedCNPJ, formattedCNPJ]);
    console.timeEnd('query-execution');
    
    const consolidated = result.rows[0];
    console.log('✅ Query executada com sucesso');
    console.log('📊 Resultado bruto:', result.rows[0]);
    
    // Converter para números
    consolidated.total_parcelamentos = parseInt(consolidated.total_parcelamentos) || 0;
    consolidated.parcelamentos_ativos = parseInt(consolidated.parcelamentos_ativos) || 0;
    consolidated.total_parcelado = parseFloat(consolidated.total_parcelado) || 0;
    consolidated.total_saldo_devedor = parseFloat(consolidated.total_saldo_devedor) || 0;
    
    console.log('📊 Dados consolidados:', consolidated);
    console.timeEnd('busca-pgfn');
    console.log('✅ Busca concluída!');
    return consolidated;
    
  } catch (error) {
    console.error('Erro ao buscar dados PGFN:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para atualizar contato no Bitrix24
async function updateBitrixContact(contactId, pgfnData) {
  try {
    const url = `${BITRIX_CONFIG.domain}${BITRIX_CONFIG.webhook}crm.contact.update`;
    
    const fields = {
      id: contactId,
      fields: {
        [BITRIX_CONFIG.fields.total_divida_ativa]: pgfnData.total_saldo_devedor || 0,
        [BITRIX_CONFIG.fields.execucao_fiscal_ativa]: pgfnData.parcelamentos_ativos > 0 ? 'sim' : 'não',
        [BITRIX_CONFIG.fields.cpf_socio_responde]: 'campo vazio', // Não temos essa informação
        [BITRIX_CONFIG.fields.transacao_impugnacao]: 'NÃO', // Não temos essa informação
        [BITRIX_CONFIG.fields.parcelamentos_5_anos]: pgfnData.total_parcelamentos || 0,
        [BITRIX_CONFIG.fields.parcelamentos_ativos]: pgfnData.parcelamentos_ativos || 0,
        [BITRIX_CONFIG.fields.total_parcelado]: pgfnData.total_parcelado || 0,
        [BITRIX_CONFIG.fields.total_saldo_devedor]: pgfnData.total_saldo_devedor || 0,
        [BITRIX_CONFIG.fields.transacao_beneficio]: 'campo vazio' // Não temos essa informação
      }
    };
    
    console.log('Atualizando contato no Bitrix24:', fields);
    
    const response = await axios.post(url, fields);
    
    if (response.data.result) {
      console.log('Contato atualizado com sucesso:', response.data.result);
      return { success: true, data: response.data.result };
    } else {
      console.error('Erro ao atualizar contato:', response.data);
      return { success: false, error: response.data };
    }
    
  } catch (error) {
    console.error('Erro na requisição para Bitrix24:', error.message);
    return { success: false, error: error.message };
  }
}

// Endpoint principal do webhook
app.post('/webhook/pgfn', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('='.repeat(50));
    console.log('📥 Webhook PGFN recebido:', req.body);
    console.log('⏰ Hora:', new Date().toISOString());
    
    const { cnpj, id } = req.body;
    
    if (!cnpj || !id) {
      return res.status(400).json({
        success: false,
        error: 'CNPJ e ID são obrigatórios'
      });
    }
    
    // Buscar dados PGFN
    const pgfnData = await getPGFNData(cnpj);
    
    // Atualizar no Bitrix24
    const result = await updateBitrixContact(id, pgfnData);
    
    if (result.success) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Formatar valores monetários
      const formatMoney = (value) => {
        // Converter para número e garantir 2 casas decimais
        const numero = parseFloat(value || 0);
        // Formatar com separador de milhares e 2 casas decimais
        const formatado = numero.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          style: 'decimal'
        });
        // Adicionar R$ e remover espaço após R$
        return `R$ ${formatado}`.replace('R$ ', 'R$');
      };
      
      // Preparar dados formatados
      // Validar dados específicos
      const validarExecucaoFiscal = (data) => {
        // Verifica se tem execução fiscal ativa baseado em parcelamentos e saldo
        return data.parcelamentos_ativos > 0 && data.total_saldo_devedor > 0 ? "SIM" : "NÃO";
      };

      const validarCpfSocio = (data) => {
        // Verifica na tabela especial_pj_pf se tem responsabilidade de sócio
        return data.tem_responsabilidade_socio ? "SIM" : "NÃO";
      };

      const validarTransacaoImpugnacao = (data) => {
        // Verifica se tem transação com impugnação
        return data.tem_impugnacao ? "SIM" : "NÃO";
      };

      const validarTransacaoBeneficio = (data) => {
        // Verifica se tem transação com benefício
        return data.tem_beneficio ? "SIM" : "NÃO";
      };

      // Formatar números inteiros sem casas decimais
      const formatInt = (value) => {
        return parseInt(value || 0).toString();
      };

      const dadosReceita = {
        total_divida_ativa: formatMoney(pgfnData.total_saldo_devedor),
        execucao_fiscal_ativa: validarExecucaoFiscal(pgfnData),
        cpf_socio_responde: validarCpfSocio(pgfnData),
        transacao_impugnacao: validarTransacaoImpugnacao(pgfnData),
        parcelamentos_5_anos: formatInt(pgfnData.total_parcelamentos),
        parcelamentos_ativos: formatInt(pgfnData.parcelamentos_ativos),
        total_parcelado: formatMoney(pgfnData.total_parcelado),
        total_saldo_devedor: formatMoney(pgfnData.total_saldo_devedor),
        possui_transacao_beneficio: validarTransacaoBeneficio(pgfnData)
      };
      
      console.log('✅ Webhook executado com sucesso');
      console.log(`⏱️ Tempo total: ${duration}ms`);
      console.log('📊 Dados encontrados:', dadosReceita);
      console.log('='.repeat(50));
      
      res.json({
        success: true,
        message: 'Dados Receita atualizados com sucesso',
        data: {
          deal_id: id,
          cnpj: cnpj,
          dados_receita: dadosReceita,
          execution_time_ms: duration
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar dados no Bitrix24',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Erro no webhook PGFN:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para o Make.com - dados formatados
app.get('/api/cnpj/:cnpj', async (req, res) => {
  try {
    const startTime = Date.now();
    const { cnpj } = req.params;
    
    console.log('='.repeat(50));
    console.log('📥 Requisição GET para CNPJ:', cnpj);
    console.log('⏰ Hora:', new Date().toISOString());
    
    if (!cnpj) {
      return res.status(400).json({
        success: false,
        error: 'CNPJ é obrigatório',
        cnpj_provided: null
      });
    }
    
    // Buscar dados PGFN
    const pgfnData = await getPGFNData(cnpj);
    
    // Formatar valores monetários
    const formatMoney = (value) => {
      const numero = parseFloat(value || 0);
      const formatado = numero.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'decimal'
      });
      return `R$ ${formatado}`.replace('R$ ', 'R$');
    };
    
    // Validar dados específicos
    const validarExecucaoFiscal = (data) => {
      return data.parcelamentos_ativos > 0 && data.total_saldo_devedor > 0 ? "SIM" : "NÃO";
    };

    const validarCpfSocio = (data) => {
      return data.tem_responsabilidade_socio ? "SIM" : "NÃO";
    };

    const validarTransacaoImpugnacao = (data) => {
      return data.tem_impugnacao ? "SIM" : "NÃO";
    };

    const validarTransacaoBeneficio = (data) => {
      return data.tem_beneficio ? "SIM" : "NÃO";
    };

    // Formatar números inteiros
    const formatInt = (value) => {
      return parseInt(value || 0).toString();
    };

    const dadosReceita = {
      total_divida_ativa: formatMoney(pgfnData.total_saldo_devedor),
      execucao_fiscal_ativa: validarExecucaoFiscal(pgfnData),
      cpf_socio_responde: validarCpfSocio(pgfnData),
      transacao_impugnacao: validarTransacaoImpugnacao(pgfnData),
      parcelamentos_5_anos: formatInt(pgfnData.total_parcelamentos),
      parcelamentos_ativos: formatInt(pgfnData.parcelamentos_ativos),
      total_parcelado: formatMoney(pgfnData.total_parcelado),
      total_saldo_devedor: formatMoney(pgfnData.total_saldo_devedor),
      possui_transacao_beneficio: validarTransacaoBeneficio(pgfnData)
    };
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Consulta CNPJ executada com sucesso');
    console.log(`⏱️ Tempo total: ${duration}ms`);
    console.log('📊 Dados encontrados:', dadosReceita);
    console.log('='.repeat(50));
    
    res.json({
      success: true,
      cnpj_consultado: formatCNPJ(cnpj),
      dados_receita: dadosReceita,
      execution_time_ms: duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na consulta CNPJ:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      cnpj_provided: cnpj || null
    });
  }
});

// Endpoint de teste (legado)
app.get('/test/:cnpj', async (req, res) => {
  try {
    const { cnpj } = req.params;
    const pgfnData = await getPGFNData(cnpj);
    
    res.json({
      success: true,
      cnpj: cnpj,
      data: pgfnData
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Iniciar servidor
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`🌐 Servidor escutando em: ${HOST}:${PORT}`);
  console.log(`🔗 Endereço externo: http://167.235.49.166:${PORT}`);
  console.log(`🚀 Servidor webhook PGFN rodando na porta ${PORT}`);
  console.log(`📊 Banco: ${process.env.DB_HOST || '167.235.49.166'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'bitrix'}`);
  console.log(`🔊 Bitrix24: ${BITRIX_CONFIG.domain}`);
  console.log(`📡 Webhook: http://167.235.49.166:${PORT}/webhook/pgfn`);
  console.log(`🔍 API CNPJ: http://167.235.49.166:${PORT}/api/cnpj/CNPJ_AQUI`);
  console.log(`🧪 Teste: http://167.235.49.166:${PORT}/test/CNPJ_AQUI`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    console.log('Servidor HTTP fechado');
    pool.end(() => {
      console.log('Pool de conexões fechado');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
