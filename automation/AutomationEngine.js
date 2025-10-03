const BitrixService = require('./services/BitrixService');
const PGFNService = require('./services/PGFNService');
const Logger = require('./utils/Logger');
const StatsCollector = require('./utils/StatsCollector');
const settings = require('./config/settings');
const { v4: uuidv4 } = require('uuid');

/**
 * Engine principal de automação PGFN
 */
class AutomationEngine {
  constructor() {
    this.bitrixService = new BitrixService();
    this.pgfnService = new PGFNService();
    this.logger = new Logger();
    this.stats = new StatsCollector();
    this.executionId = null;
    this.isRunning = false;
  }
  
  /**
   * Converter dados PGFN para formato correto do Bitrix
   */
  convertToBitrixFormat(pgfnData, empresaData = null) {
    const bitrixFields = {};
    
    // Campos monetários (valores em Reais) - sem formatação brasileira
    if (pgfnData.total_divida_ativa) {
      bitrixFields['UF_CRM_1758806120'] = pgfnData.total_divida_ativa
        .replace(/[R$\s.]/g, '')
        .replace(',', '.');
    }
    
    if (pgfnData.total_saldo_devedor) {
      bitrixFields['UF_CRM_1758806370'] = pgfnData.total_saldo_devedor
        .replace(/[R$\s.]/g, '')
        .replace(',', '.');
    }
    
    if (pgfnData.total_parcelado) {
      bitrixFields['UF_CRM_1758806357'] = pgfnData.total_parcelado
        .replace(/[R$\s.]/g, '')
        .replace(',', '.');
    }
    
    // Campos booleanos tipo SIM/NÃO no Bitrix
    bitrixFields['UF_CRM_1758806167'] = pgfnData.execucao_fiscal_ativa; // Já vem como 'SIM' ou 'NÃO'
    bitrixFields['UF_CRM_1758808716'] = pgfnData.cpf_socio_responde;   // Já vem como 'SIM' ou 'NÃO'  
    bitrixFields['UF_CRM_1758806267'] = pgfnData.transacao_impugnacao; // Já vem como 'SIM' ou 'NÃO'
    bitrixFields['UF_CRM_1758806394'] = pgfnData.possui_transacao_beneficio; // Já vem como 'SIM' ou 'NÃO'
    
    // Campos numéricos simples
    bitrixFields['UF_CRM_1758806322'] = String(pgfnData.parcelamentos_5_anos || 0);
    bitrixFields['UF_CRM_1758806337'] = String(pgfnData.parcelamentos_ativos || 0);
    
    // Campo nome da empresa
    if (empresaData && empresaData.nome) {
      bitrixFields['UF_CRM_1557101315015'] = empresaData.nome;
    }
    
    return bitrixFields;
  }
  
  /**
   * Executar automação completa
   */
  async run() {
    // Se modo contínuo está habilitado, iniciar monitoramento infinito
    if (settings.automation.continuous_mode) {
      return this.startContinuousMonitoring();
    }
    
    // Modo único (execução uma vez)
    if (this.isRunning) {
      throw new Error('Automação já está em execução');
    }
    
    this.isRunning = true;
    this.executionId = uuidv4();
    
    try {
      this.logger.automationStart(this.executionId, 0);
      this.stats.startExecution();
      
      // Verificar conexões
      await this.checkConnections();
      
      // Buscar negócios para processar
      const deals = await this.getDealsToProcess();
      this.stats.totalDeals = deals.length;
      
      this.logger.info(`📋 Encontrados ${deals.length} negócios para processar`);
      
      if (deals.length === 0) {
        this.logger.warn('⚠️ Nenhum negócio encontrado para processar');
        return this.getFinalStats();
      }
      
      // Processar negócios em lotes
      await this.processDealsInBatches(deals);
      
      // Finalizar execução
      this.stats.endExecution();
      this.logger.automationComplete(this.executionId, this.stats.getSummary());
      
      return this.getFinalStats();
      
    } catch (error) {
      this.logger.error('💥 Erro crítico na automação:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Monitoramento contínuo - roda infinitamente verificando novos negócios
   */
  async startContinuousMonitoring() {
    if (this.isRunning) {
      throw new Error('Monitoramento contínuo já está em execução');
    }
    
    this.isRunning = true;
    this.isContinuousMode = true;
    
    this.logger.info(`🔄 INICIANDO MONITORAMENTO CONTÍNUO`);
    this.logger.info(`⏰ Verificando a cada ${settings.automation.interval_seconds} segundos`);
    this.logger.info(`🕒 Desde: ${new Date(settings.automation.get_start_date()).toLocaleString('pt-BR')}`);
    this.logger.info(`📋 Pipeline: ${settings.bitrix.target_pipeline}`);
    this.logger.info(`🎯 Fases: ${settings.bitrix.target_phases.join(', ')}`);
    this.logger.info('');
    
    try {
      // Verificar conexões uma vez no início
      this.logger.info('🔍 Verificando conexões...');
      await this.checkConnections();
      this.logger.info('✅ Todas as conexões OK');
      
      let cycleCount = 0;
      
      while (this.isRunning && settings.automation.keep_monitoring) {
        cycleCount++;
        const cycleStart = Date.now();
        
        try {
          this.logger.info(`\n🔄 Ciclo ${cycleCount} - ${new Date().toLocaleString('pt-BR')}`);
          
          // Buscar negócios novos
          const deals = await this.getDealsToProcess();
          
          if (deals.length > 0) {
            this.logger.info(`🆕 ${deals.length} novos negócios encontrados - PROCESSANDO`);
            await this.processDealsInBatches(deals);
            this.logger.info(`✅ Ciclo ${cycleCount} concluído - ${deals.length} negócios processados`);
          } else {
            this.logger.info(`⏳ Ciclo ${cycleCount} concluído - nenhum negócio novo`);
          }
          
        } catch (error) {
          this.logger.error(`❌ Erro no ciclo ${cycleCount}:`, error.message);
          
          // Se configuração permite continuar com erro, aguarda e continua
          if (settings.error_handling.continue_on_error) {
            this.logger.warn('⚠️ Continuando monitoramento apesar do erro...');
          } else {
            throw error;
          }
        }
        
        const cycleTotalTime = Date.now() - cycleStart;
        this.logger.info(`⏱️ Ciclo ${cycleCount} - Duração: ${cycleTotalTime}ms`);
        
        // Aguardar próximo ciclo
        if (this.isRunning) {
          this.logger.info(`😴 Aguardando ${settings.automation.interval_seconds}s para próximo ciclo...`);
          await this.sleep(settings.automation.interval_seconds * 1000);
        }
      }
      
    } catch (error) {
      this.logger.error('💥 Erro crítico no monitoramento contínuo:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
      this.isContinuousMode = false;
      this.logger.info('🛑 MONITORAMENTO CONTÍNUO FINALIZADO');
    }
  }
  
  /**
   * Verificar conexões com APIs
   */
  async checkConnections() {
    this.logger.info('🔍 Verificando conexões...');
    
    // Testar Bitrix
    const bitrixOk = await this.bitrixService.testConnection();
    if (!bitrixOk) {
      throw new Error('Não foi possível conectar ao Bitrix24');
    }
    this.logger.info('✅ Conexão com Bitrix24 OK');
    
    // Testar nossa API PGFN
    const pgfnOk = await this.pgfnService.testConnection();
    if (!pgfnOk) {
      throw new Error('Não foi possível conectar à API PGFN');
    }
    this.logger.info('✅ Conexão com API PGFN OK');
  }
  
  /**
   * Buscar negócios para processar
   */
  async getDealsToProcess() {
    this.logger.info('🔎 Buscando negócios na pipeline de destino...');
    
    const allDeals = await this.bitrixService.getDealsToProcess();
    
    // Separar entre novos e já processados para mostrar estatísticas
    const newDeals = allDeals.filter(deal => 
      !settings.automation.processed_deals.has(deal.ID.toString())
    );
    const alreadyProcessed = allDeals.filter(deal => 
      settings.automation.processed_deals.has(deal.ID.toString())
    );
    
    // Verificar quais negócios novos têm CNPJ ou não
    const dealsWithCNPJ = newDeals.filter(deal => deal.UF_CRM_1745494235);
    const dealsWithoutCNPJ = newDeals.filter(deal => !deal.UF_CRM_1745494235);
    
    this.logger.info(`📊 Encontrados ${allDeals.length} negócios disponíveis no dia`);
    this.logger.info(`🆕 ${newDeals.length} negócios novos para processar`);
    this.logger.info(`✅ ${alreadyProcessed.length} negócios já processados anteriormente`);
    
    if (dealsWithCNPJ.length > 0) {
      this.logger.info(`📄 ${dealsWithCNPJ.length} negócios COM CNPJ: ${dealsWithCNPJ.map(d => `${d.ID}(${d.UF_CRM_1745494235})`).join(', ')}`);
    }
    
    if (dealsWithoutCNPJ.length > 0) {
      this.logger.info(`❌ ${dealsWithoutCNPJ.length} negócios SEM CNPJ: ${dealsWithoutCNPJ.map(d => d.ID).join(', ')}`);
    }
    
    if (newDeals.length > 0) {
      this.logger.info(`📋 IDs dos novos negócios: ${newDeals.map(d => d.ID).join(', ')}`);
    }
    if (alreadyProcessed.length > 0) {
      this.logger.info(`📋 IDs já processados: ${alreadyProcessed.map(d => d.ID).join(', ')}`);
    }
    
    // Processar APENAS negócios novos (não já processados)
    const dealsToProcess = newDeals;
    
    // Limitar quantidade se configurado
    if (dealsToProcess.length > settings.automation.max_deals_per_execution) {
      this.logger.warn(`⚠️ Limitando processamento a ${settings.automation.max_deals_per_execution} negócios`);
      return dealsToProcess.slice(0, settings.automation.max_deals_per_execution);
    }
    
    return dealsToProcess;
  }
  
  /**
   * Processar negócios em lotes
   */
  async processDealsInBatches(deals) {
    const batchSize = settings.automation.batch_size;
    const batches = [];
    
    // Dividir em lotes
    for (let i = 0; i < deals.length; i += batchSize) {
      batches.push(deals.slice(i, i + batchSize));
    }
    
    this.logger.info(`📦 Processando ${batches.length} lotes de até ${batchSize} negócios`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      this.logger.info(`🔄 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} negócios)`);
      
      await this.processBatch(batch);
      
      // Delay entre lotes (exceto último)
      if (batchIndex < batches.length - 1) {
        await this.sleep(settings.automation.delay_between_batches);
      }
    }
  }
  
  /**
   * Processar lote de negócios
   */
  async processBatch(batchDeals) {
    for (const deal of batchDeals) {
      const dealStartTime = Date.now();
      
      try {
        await this.processSingleDeal(deal);
        
        const processingTime = Date.now() - dealStartTime;
        this.stats.recordSuccess(deal.ID, processingTime);
        
        this.logger.dealProcessed(deal.ID, null, true, { processingTime });
        
      } catch (error) {
        const processingTime = Date.now() - dealStartTime;
        this.stats.recordFailure(deal.ID, error);
        
        this.logger.dealError(deal.ID, error);
        
        if (!settings.error_handling.continue_on_error) {
          throw error;
        }
      }
      
      // Delay entre negócios
      await this.sleep(settings.automation.delay_between_deals);
    }
  }
  
  /**
   * Processar um único negócio
   */
  async processSingleDeal(deal) {
    this.logger.debug(`📋 Processando negócio ${deal.ID}: ${deal.TITLE}`);
    
    // 1. Verificar se já tem dados PGFN válidos (skip se completo)
    const existingFields = await this.bitrixService.checkExistingPGFNFields(deal.ID);
    if (await this.hasValidPGFNData(existingFields)) {
      this.logger.debug(`⏭️ Negócio ${deal.ID} já possui dados PGFN válidos, ignorando`);
      this.stats.recordSkip(deal.ID, 'valid_existing_data');
      return;
    }
    
    // 2. Buscar CNPJ da empresa ou do próprio negócio
    const startCnpjTime = Date.now();
    let cnpj = null;
    
    // Primeiro tenta no campo do próprio negócio (se existir)
    if (deal.UF_CRM_1745494235) {
      cnpj = deal.UF_CRM_1745494235;
      this.logger.debug(`🔍 CNPJ encontrado no campo do negócio ${deal.ID}: ${cnpj}`);
    } 
    // Depois tenta na empresa associada
    else if (deal.COMPANY_ID && deal.COMPANY_ID !== '0') {
      cnpj = await this.bitrixService.getCompanyCNPJ(deal.COMPANY_ID);
      this.logger.debug(`🔍 CNPJ encontrado na empresa do negócio ${deal.ID}: ${cnpj}`);
    }
    
    const cnpjTime = Date.now() - startCnpjTime;
    this.stats.addApiTime('bitrix', cnpjTime);
    
    if (!cnpj) {
      this.logger.info(`❌ Negócio ${deal.ID} sem CNPJ válido - será reprocessado no próximo ciclo`);
      this.stats.recordSkip(deal.ID, 'no_cnpj');
      return;
    }
    
    this.logger.debug(`🔍 CNPJ encontrado para negócio ${deal.ID}: ${cnpj}`);
    
    // 3. Consultar dados PGFN
    const startPgfntime = Date.now();
    const pgfnData = await this.pgfnService.getPGFNData(cnpj);
    const pgfnTime = Date.now() - startPgfntime;
    this.stats.addApiTime('pgfn', pgfnTime);
    
    // 4. Verificar se tem dados válidos antes de converter
    if (!pgfnData || !pgfnData.dados_receita) {
      this.logger.error(`❌ Dados PGFN inválidos para negócio ${deal.ID}`);
      this.stats.recordSkip(deal.ID, 'invalid_pgfn_data');
      return;
    }
    
    // 5. Converter dados para formato correto do Bitrix (incluindo dados da empresa)
    const bitrixFields = this.convertToBitrixFormat(pgfnData.dados_receita, pgfnData.empresa);
    
    this.logger.debug(`🔧 Convertendo dados para formato Bitrix: ${Object.keys(bitrixFields).length} campos`);
    
    // 6. Atualizar campos no Bitrix com formato corrigido
    const startUpdateTime = Date.now();
    const updateSuccess = await this.bitrixService.updateDealFields(deal.ID, bitrixFields);
    const updateTime = Date.now() - startUpdateTime;
    this.stats.addApiTime('bitrix', updateTime);
    
    if (updateSuccess) {
      // Marcar negócio como processado para não reprocessar
      settings.automation.processed_deals.add(deal.ID.toString());
      
      this.logger.dealProcessed(deal.ID, cnpj, true, {
        fieldsUpdated: Object.keys(bitrixFields).length,
        processingTime: pgfnData.execution_time
      });
    } else {
      throw new Error('Falha ao atualizar campos no Bitrix');
    }
  }
  
  /**
   * Verificar se negócio já tem dados PGFN válidos
   */
  async hasValidPGFNData(existingFields) {
    // Campos essenciais que devem estar preenchidos (TODOS VARIÁVEIS!)
    const essentialFields = [
      'UF_CRM_1758806167',    // execucao_fiscal_ativa
      'UF_CRM_1758808716',    // cpf_socio_responde 
      'UF_CRM_1758806267',    // transacao_impugnacao
      'UF_CRM_1758806322',    // parcelamentos_5_anos
      'UF_CRM_1758806337',    // parcelamentos_ativos
      'UF_CRM_1758806357',    // total_parcelado
      'UF_CRM_1758806370',    // total_saldo_devedor
      'UF_CRM_1758806394',    // possui_transacao_beneficio
      'UF_CRM_1557101315015'  // nome_empresa
    ];
    
    // Verificar se todos os campos essenciais estão preenchidos
    for (const fieldId of essentialFields) {
      const value = existingFields[fieldId];
      
      // Campos podem estar vazios, null, undefined ou string vazia
      if (!value || value === '' || value === null || value === undefined) {
        return false; // Campo não preenchido
      }
      
      // Para campos booleanos, aceitar diversos formatos válidos
      const booleanFields = ['UF_CRM_1758806167', 'UF_CRM_1758808716', 'UF_CRM_1758806267', 'UF_CRM_1758806394'];
      if (booleanFields.includes(fieldId)) {
        // Aceitar: "SIM", "NÃO", "1", "0", valores que indicam que foi processado
        if (!['SIM', 'NÃO', '1', '0', 'sim', 'não'].includes(String(value).toUpperCase())) {
          return false; // Valor não reconhecido para campo booleano
        }
      }
    }
    
    return true; // Todos os campos essenciais estão preenchidos
  }

  /**
   * Aguardar tempo especificado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Obter estatísticas finais
   */
  getFinalStats() {
    return {
      executionId: this.executionId,
      summary: this.stats.getSummary(),
      simpleSummary: this.stats.getSimpleSummary(),
      isComplete: !this.isRunning
    };
  }
  
  /**
   * Verificar se automação está rodando
   */
  isActive() {
    return this.isRunning;
  }
  
  /**
   * Parar automação (se implementado)
   */
  async stop() {
    if (this.isRunning) {
      this.logger.warn('🏁 Parando automação...');
      this.isRunning = false;
    }
  }
}

module.exports = AutomationEngine;
