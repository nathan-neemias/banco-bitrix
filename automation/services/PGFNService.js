const axios = require('axios');
const settings = require('../config/settings');

/**
 * Serviço para interação com nossa API PGFN
 */
class PGFNService {
  constructor() {
    this.baseURL = settings.pgfn_api.base_url;
    this.timeout = settings.pgfn_api.timeout;
    this.maxRetries = settings.pgfn_api.max_retries;
  }
  
  /**
   * Consultar dados PGFN para um CNPJ
   */
  async getPGFNData(cnpj) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔍 Tentativa ${attempt}: Consultando CNPJ ${cnpj}`);
        
        // Limpar CNPJ
        const cleanCNPJ = this.cleanCNPJ(cnpj);
        
        const url = `${this.baseURL}/api/cnpj/${cleanCNPJ}`;
        const response = await axios.get(url, { 
          timeout: this.timeout,
          headers: {
            'User-Agent': 'PGFN-Automation/1.0'
          }
        });
        
        if (response.data.success) {
          console.log(`✅ CNPJ ${cleanCNPJ} consultado com sucesso`);
          return this.formatPGFNData(response.data);
        }
        
        throw new Error(`API retornou success: false - ${response.data.error || 'Erro desconhecido'}`);
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          const delay = attempt * 1000; // Delay crescente
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Limpar CNPJ removendo caracteres especiais
   */
  cleanCNPJ(cnpj) {
    if (!cnpj) return null;
    return cnpj.replace(/[^\d]/g, '');
  }
  
  /**
   * Formatear dados PGFN para campos Bitrix
   */
  formatPGFNData(apiResponse) {
    const dadosReceita = apiResponse.dados_receita;
    
    const formattedData = {};
    Object.keys(settings.bitrix.pgfn_fields_mapping).forEach(bitrixField => {
      const pgfnField = settings.bitrix.pgfn_fields_mapping[bitrixField];
      formattedData[bitrixField] = dadosReceita[pgfnField] || this.getDefaultValue(pgfnField);
    });
    
    return {
      success: true,
      cnpj: apiResponse.cnpj_consultado,
      dados_receita: apiResponse.dados_receita,
      empresa: apiResponse.empresa,
      bitrix_fields: formattedData,
      execution_time: apiResponse.execution_time_ms
    };
  }
  
  /**
   * Obter valor padrão para campos vazios
   */
  getDefaultValue(fieldName) {
    const defaults = {
      'total_divida_ativa': '0,00',
      'execucao_fiscal_ativa': 'NÃO',
      'cpf_socio_responde': 'NÃO',
      'transacao_impugnacao': 'NÃO',
      'parcelamentos_5_anos': '0',
      'parcelamentos_ativos': '0',
      'total_parcelado': '0,00',
      'total_saldo_devedor': '0,00',
      'possui_transacao_beneficio': 'NÃO'
    };
    
    return defaults[fieldName] || '';
  }
  
  /**
   * Testar conexão com nossa API
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { 
        timeout: 5000 
      });
      
      return response.status === 200;
      
    } catch (error) {
      console.error('❌ Erro ao testar conexão com API PGFN:', error.message);
      return false;
    }
  }
  
  /**
   * Aguardar tempo especificado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Verificar se CNPJ é válido
   */
  isValidCNPJ(cnpj) {
    if (!cnpj) return false;
    
    const cleanCNPJ = this.cleanCNPJ(cnpj);
    
    // Verificar se tem 11 ou 14 dígitos
    return cleanCNPJ.length === 11 || cleanCNPJ.length === 14;
  }
}

module.exports = PGFNService;
