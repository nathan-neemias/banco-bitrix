// Configurações do sistema de automação PGFN
module.exports = {
  // Configurações do Bitrix24
  bitrix: {
    domain: 'https://grupovillela.bitrix24.com.br',
    webhook: '/rest/28/2js7aupbd48aed3o/',
    api_url: 'https://grupovillela.bitrix24.com.br/rest/28/2js7aupbd48aed3o',
    
    // Pipeline e fases para processar
    target_pipeline: 17,
    target_phases: ['C17:NEW'],
    
    // Campos do Bitrix para campos PGFN
    pgfn_fields_mapping: {
      'UF_CRM_1758806120': 'total_divida_ativa',           // Total dívida ativa
      'UF_CRM_1758806167': 'execucao_fiscal_ativa',       // Execução fiscal ativa
      'UF_CRM_1758808716': 'cpf_socio_responde',          // CPF sócio responde pela dívida
      'UF_CRM_1758806267': 'transacao_impugnacao',        // Transação com impugnação
      'UF_CRM_1758806322': 'parcelamentos_5_anos',        // Parcelamentos últimos 5 anos
      'UF_CRM_1758806337': 'parcelamentos_ativos',        // Parcelamentos ativos
      'UF_CRM_1758806357': 'total_parcelado',             // Total parcelado PGFN
      'UF_CRM_1758806370': 'total_saldo_devedor',        // Total saldo devedor PGFN
      'UF_CRM_1758806394': 'possui_transacao_beneficio'  // Possui transação com benefício
    },
    
    // Campos da empresa para buscar CNPJ
    company_cnpj_field: 'UF_CRM_68613360'
  },
  
  // Configurações da nossa API PGFN
  pgfn_api: {
    base_url: 'http://167.235.49.166:3000',
    timeout: 30000, // 30 segundos
    max_retries: 3
  },
  
  // Configurações de execução
  automation: {
    batch_size: 10,           // Processar em lotes de 10
    delay_between_batches: 2000, // 2 segundos entre lotes
    delay_between_deals: 500,    // 500ms entre negócios
    max_deals_per_execution: 100, // Máximo 100 negócios por execução
    
    // Filtrar apenas negócios criados a partir desta data (execução contínua)
    get_start_date: () => {
      // Pegar desde o início do dia atual para capturar todos os negócios criados hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Começo do dia (00:00:00)
      return today.toISOString();
    },
    
    // Configurações de monitoramento contínuo
    continuous_mode: true,          // Rodar em loop infinito
    interval_seconds: 10,          // Verificar a cada 10 segundos
    keep_monitoring: true,         // Continuar mesmo quando não há negócios novos
    
    // Arquivo para armazenar IDs de negócios já processados (evita reprocessamento)
    processed_deals_file: './logs/processed_deals.json',
    
    // Lista em memória de negócios já processados
    processed_deals: new Set(),
    
    // Campos obrigatórios para processar um negócio
    required_fields: ['ID', 'TITLE', 'COMPANY_ID', 'STAGE_ID']
  },
  
  // Configurações de logging
  logging: {
    log_to_file: true,
    log_to_console: true,
    log_level: 'info', // debug, info, warn, error
    log_file_path: './logs/automation.log',
    max_log_files: 10,
    max_log_size_mb: 50
  },
  
  // Configurações de erro
  error_handling: {
    continue_on_error: true,
    max_consecutive_errors: 5,
    error_cooldown_minutes: 10
  },
  
  // Scheduler (se implementado)
  scheduler: {
    enabled: true,
    interval_minutes: 30, // Executar a cada 30 minutos
    run_on_weekends: false,
    start_time: '08:00',
    end_time: '18:00'
  }
};
