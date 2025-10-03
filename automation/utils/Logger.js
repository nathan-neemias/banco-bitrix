const fs = require('fs');
const path = require('path');
const settings = require('../config/settings');

/**
 * Sistema de logging para automação
 */
class Logger {
  constructor() {
    this.logFile = settings.logging.log_file_path;
    this.logLevel = settings.logging.log_level;
    this.maxLogSize = settings.logging.max_log_size_mb * 1024 * 1024; // Converter para bytes
    
    this.ensureLogDirectory();
  }
  
  /**
   * Garantir que diretório de logs existe
   */
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  /**
   * Verificar se deve logar baseado no nível
   */
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }
  
  /**
   * Escrever mensagem de log
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}\n`;
    
    if (settings.logging.log_to_console && this.shouldLog(level)) {
      const colorCodes = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m' // Red
      };
      
      console.log(`${colorCodes[level] || ''}${logMessage.trim()}\x1b[0m`);
    }
    
    if (settings.logging.log_to_file && this.shouldLog(level)) {
      this.writeToFile(logMessage);
    }
  }
  
  /**
   * Escrever no arquivo de log
   */
  writeToFile(message) {
    try {
      // Verificar tamanho do arquivo e rotacionar se necessário
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxLogSize) {
          this.rotateLogs();
        }
      }
      
      fs.appendFileSync(this.logFile, message);
      
    } catch (error) {
      console.error('❌ Erro ao escrever no log:', error.message);
    }
  }
  
  /**
   * Rotacionar arquivos de log
   */
  rotateLogs() {
    try {
      const logDir = path.dirname(this.logFile);
      const logName = path.basename(this.logFile, '.log');
      
      // Mover arquivo atual para backup
      const backupName = `${logName}_${new Date().toISOString().split('T')[0]}.log`;
      const backupPath = path.join(logDir, backupName);
      
      fs.renameSync(this.logFile, backupPath);
      
      console.log(`📁 Log rotacionado: ${backupName}`);
      
      // Manter apenas os últimos arquivos
      const files = fs.readdirSync(logDir)
        .filter(file => file.startsWith(logName))
        .sort()
        .reverse();
      
      if (files.length > settings.logging.max_log_files) {
        files.slice(settings.logging.max_log_files).forEach(file => {
          fs.unlinkSync(path.join(logDir, file));
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao rotacionar logs:', error.message);
    }
  }
  
  /**
   * Log métodos de conveniência
   */
  debug(message, data) {
    this.log('debug', message, data);
  }
  
  info(message, data) {
    this.log('info', message, data);
  }
  
  warn(message, data) {
    this.log('warn', message, data);
  }
  
  error(message, data) {
    this.log('error', message, data);
  }
  
  /**
   * Log de execução de automação
   */
  automationStart(executionId, totalDeals) {
    this.info(`🚀 AUTOMAÇÃO INICIADA`, { executionId, totalDeals });
  }
  
  automationComplete(executionId, stats) {
    this.info(`✅ AUTOMAÇÃO COMPLETA`, { executionId, stats });
  }
  
  dealProcessed(dealId, cnpj, success, stats) {
    this.info(`📋 Negócio processado: ${dealId}`, { 
      dealId, 
      cnpj: cnpj || 'N/A', 
      success, 
      stats 
    });
  }
  
  dealError(dealId, error, cnpj) {
    this.error(`❌ Erro ao processar negócio: ${dealId}`, { 
      dealId, 
      error: error.message, 
      cnpj: cnpj || 'N/A' 
    });
  }
}

module.exports = Logger;
