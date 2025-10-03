#!/usr/bin/env node

const AutomationEngine = require('./AutomationEngine');
const settings = require('./config/settings');
const express = require('express');

/**
 * Script principal para executar a automação PGFN
 */
async function main() {
  const engine = new AutomationEngine();
  
  try {
    console.log('🚀 Iniciando automação PGFN...');
    console.log('📅', new Date().toLocaleString('pt-BR'));
    console.log(`🎯 Pipeline: ${settings.bitrix.target_pipeline}`);
    console.log(`📋 Fases: ${settings.bitrix.target_phases.join(', ')}`);
    console.log(`📅 Últimas 24h: ${new Date(settings.automation.get_start_date()).toLocaleString('pt-BR')}`);
    console.log('');
    
    const result = await engine.run();
    
    console.log('');
    console.log('✅ AUTOMAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log(result.simpleSummary);
    
  } catch (error) {
    console.error('');
    console.error('💥 ERRO CRÍTICO NA AUTOMAÇÃO:');
    console.error(error.message);
    console.error('');
    
    process.exit(1);
  }
}

/**
 * Criar servidor Express para monitoramento
 */
function createMonitorServer() {
  const app = express();
  const port = process.env.PORT || 3001;
  
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'pgfn-automation',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    });
  });
  
  // Status da automação
  app.get('/status', (req, res) => {
    const automationEngine = new AutomationEngine();
    res.json({
      isRunning: automationEngine.isActive(),
      timestamp: new Date().toISOString(),
      config: {
        pipeline: settings.bitrix.target_pipeline,
        phases: settings.bitrix.target_phases,
        start_date: settings.automation.start_date,
        port: port
      }
    });
  });
  
  // Executar automação manualmente
  app.post('/run', async (req, res) => {
    try {
      console.log('🔄 Execução manual iniciada via HTTP');
      await main();
      res.json({ success: true, message: 'Automação executada com sucesso' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  app.listen(port, () => {
    console.log(`🖥️ Servidor de monitoramento rodando na porta ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📋 Status: http://localhost:${port}/status`);
    console.log(`🔄 Executar: POST http://localhost:${port}/run`);
  });
  
  return app;
}

// Processar argumentos de linha de comando
const args = process.argv.slice(2);

if (args.includes('--server') || args.includes('-s')) {
  // Rodar servidor de monitoramento
  createMonitorServer();
} else if (args.includes('--test') || args.includes('-t')) {
  // Teste de conectividade
  console.log('🧪 Testando conectividades...');
  
  const engine = new AutomationEngine();
  engine.checkConnections()
    .then(() => {
      console.log('✅ Todas as conectividades OK');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha na conectividade:', error.message);
      process.exit(1);
    });
} else {
  // Execução normal
  main().catch(console.error);
}

module.exports = { main, createMonitorServer };
