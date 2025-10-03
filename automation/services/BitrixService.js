const axios = require('axios');
const settings = require('../config/settings');

/**
 * Serviço para interação com a API do Bitrix24
 */
class BitrixService {
  constructor() {
    this.baseURL = settings.bitrix.api_url;
    this.timeout = settings.pgfn_api.timeout;
  }
  
  /**
   * Buscar negócios da pipeline alvo
   */
  async getDealsToProcess() {
    try {
      const deals = [];
      
      // Buscar negócios de cada fase definida
      for (const phase of settings.bitrix.target_phases) {
        const phaseDeals = await this.getDealsByPhase(phase);
        deals.push(...phaseDeals);
      }
      
      console.log(`📋 Total de negócios encontrados para processar: ${deals.length}`);
      return deals;
      
    } catch (error) {
      console.error('❌ Erro ao buscar negócios:', error.message);
      throw error;
    }
  }
  
  /**
   * Buscar negócios de uma fase específica
   */
  async getDealsByPhase(stageId) {
    try {
      const url = `${this.baseURL}/crm.deal.list`;
      const params = {
        filter: {
          CATEGORY_ID: settings.bitrix.target_pipeline.toString(),
          STAGE_ID: stageId,
          '>=DATE_CREATE': settings.automation.get_start_date() // Apenas negócios criados a partir de agora
        },
        select: [...settings.automation.required_fields, 'UF_CRM_1745494235', 'DATE_CREATE'], // Incluir campo CNPJ e data de criação
        start: 0
      };
      
      const response = await axios.get(url, { params, timeout: this.timeout });
      
      if (response.data.result) {
        const dealsCount = response.data.result.length;
        const filteredByDate = dealsCount > 0 ? 
          ` (desde: ${new Date(settings.automation.get_start_date()).toLocaleString('pt-BR')})` : 
          ' (nenhum negócio novo encontrado)';
        
        console.log(`✅ Fase ${stageId}: ${dealsCount} negócios${filteredByDate}`);
        
        // Log dos negócios encontrados (apenas os primeiros para não poluir)
        if (dealsCount > 0 && dealsCount <= 5) {
          response.data.result.forEach(deal => {
            console.log(`   📋 ${deal.ID}: "${deal.TITLE}" (criado: ${new Date(deal.DATE_CREATE).toLocaleString('pt-BR')})`);
          });
        } else if (dealsCount > 5) {
          console.log(`   📋 Mostrando apenas os 5 primeiros:`);
          response.data.result.slice(0, 5).forEach(deal => {
            console.log(`   📋 ${deal.ID}: "${deal.TITLE}" (criado: ${new Date(deal.DATE_CREATE).toLocaleString('pt-BR')})`);
          });
          console.log(`   ... e mais ${dealsCount - 5} negócios`);
        }
        
        return response.data.result.map(deal => ({
          ...deal,
          target_stage: stageId
        }));
      }
      
      return [];
      
    } catch (error) {
      console.error(`❌ Erro ao buscar negócios da fase ${stageId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Buscar detalhes completos de um negócio
   */
  async getDealDetails(dealId) {
    try {
      const url = `${this.baseURL}/crm.deal.get`;
      const params = { id: dealId };
      
      const response = await axios.get(url, { params, timeout: this.timeout });
      return response.data.result;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do negócio ${dealId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Buscar informações da empresa para obter CNPJ
   */
  async getCompanyCNPJ(companyId) {
    try {
      if (!companyId || companyId === '0') {
        return null;
      }
      
      const url = `${this.baseURL}/crm.company.get`;
      const params = { id: companyId };
      
      const response = await axios.get(url, { params, timeout: this.timeout });
      const company = response.data.result;
      
      if (company && company[settings.bitrix.company_cnpj_field]) {
        return company[settings.bitrix.company_cnpj_field];
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar CNPJ da empresa ${companyId}:`, error.message);
      return null;
    }
  }
  
  /**
   * Atualizar campos do negócio
   */
  async updateDealFields(dealId, fields) {
    try {
      const url = `${this.baseURL}/crm.deal.update`;
      const data = {
        id: dealId,
        fields: fields
      };
      
      const response = await axios.post(url, data, { timeout: this.timeout });
      
      if (response.data.result) {
        console.log(`✅ Negócio ${dealId} atualizado com sucesso`);
        return true;
      }
      
      console.log(`❌ Falha ao atualizar negócio ${dealId}:`, response.data);
      return false;
      
    } catch (error) {
      console.error(`❌ Erro ao atualizar negócio ${dealId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Verificar campos PGFN já preenchidos
   */
  async checkExistingPGFNFields(dealId) {
    try {
      const deal = await this.getDealDetails(dealId);
      
      const existingFields = {};
      Object.keys(settings.bitrix.pgfn_fields_mapping).forEach(bitrixField => {
        if (deal[bitrixField] && deal[bitrixField] !== '') {
          existingFields[bitrixField] = deal[bitrixField];
        }
      });
      
      return existingFields;
      
    } catch (error) {
      console.error(`❌ Erro ao verificar campos existentes do negócio ${dealId}, error.message`);
      return {};
    }
  }
  
  /**
   * Testar conexão com Bitrix
   */
  async testConnection() {
    try {
      const url = `${this.baseURL}/crm.deal.fields`;
      const response = await axios.get(url, { timeout: 5000 });
      
      return response.status === 200;
      
    } catch (error) {
      console.error('❌ Erro ao testar conexão com Bitrix:', error.message);
      return false;
    }
  }
}

module.exports = BitrixService;
