/**
 * Coletor de estatísticas para execução de automação
 */
class StatsCollector {
  constructor() {
    this.reset();
  }
  
  /**
   * Resetar estatísticas
   */
  reset() {
    this.executionStartTime = null;
    this.executionEndTime = null;
    this.totalDeals = 0;
    this.processedDeals = 0;
    this.successfulDeals = 0;
    this.failedDeals = 0;
    this.skippedDeals = 0;
    this.noCnpjDeals = 0;
    this.existingDataDeals = 0;
    this.errors = [];
    this.cnpjStats = {};
    this.performanceStats = {
      avgDealProcessingTime: 0,
      totalPGFNApiTime: 0,
      totalBitrixApiTime: 0
    };
  }
  
  /**
   * Iniciar coleta
   */
  startExecution() {
    this.reset();
    this.executionStartTime = new Date();
  }
  
  /**
   * Finalizar coleta
   */
  endExecution() {
    this.executionEndTime = new Date();
    this.calculatePerformanceStats();
  }
  
  /**
   * Adicionar negócio para processamento
   */
  addDeal(dealId, cnpj = null, hasExistingData = false) {
    this.totalDeals++;
    
    if (hasExistingData) {
      this.existingDataDeals++;
    }
    
    if (cnpj) {
      this.cnpjStats[cnpj] = (this.cnpjStats[cnpj] || 0) + 1;
    } else {
      this.noCnpjDeals++;
    }
  }
  
  /**
   * Registrar sucesso
   */
  recordSuccess(dealId, processingTime) {
    this.processedDeals++;
    this.successfulDeals++;
    
    if (processingTime) {
      this.updateProcessingTime(processingTime);
    }
  }
  
  /**
   * Registrar falha
   */
  recordFailure(dealId, error) {
    this.processedDeals++;
    this.failedDeals++;
    
    if (error) {
      this.errors.push({
        dealId,
        error: error.message || error,
        timestamp: new Date().getTime()
      });
    }
  }
  
  /**
   * Registrar skip (já tem dados, erro conhecido, etc.)
   */
  recordSkip(dealId, reason) {
    this.skippedDeals++;
  }
  
  /**
   * Atualizar tempo de processamento
   */
  updateProcessingTime(timeMs) {
    if (!this.performanceStats.avgDealProcessingTime) {
      this.performanceStats.avgDealProcessingTime = timeMs;
    } else {
      // Média móvel
      this.performanceStats.avgDealProcessingTime = 
        (this.performanceStats.avgDealProcessingTime + timeMs) / 2;
    }
  }
  
  /**
   * Adicionar tempo de API
   */
  addApiTime(api, timeMs) {
    switch (api) {
      case 'pgfn':
        this.performanceStats.totalPGFNApiTime += timeMs;
        break;
      case 'bitrix':
        this.performanceStats.totalBitrixApiTime += timeMs;
        break;
    }
  }
  
  /**
   * Calcular estatísticas de performance
   */
  calculatePerformanceStats() {
    if (this.executionStartTime && this.executionEndTime) {
      const totalTime = this.executionEndTime.getTime() - this.executionStartTime.getTime();
      
      this.performanceStats.totalExecutionTime = totalTime;
      this.performanceStats.dealsPerMinute = this.totalDeals > 0 ? 
        (this.totalDeals / (totalTime / 60000)).toFixed(2) : 0;
    }
  }
  
  /**
   * Obter estatísticas resumidas
   */
  getSummary() {
    return {
      execution: {
        startTime: this.executionStartTime,
        endTime: this.executionEndTime,
        duration: this.executionEndTime && this.executionStartTime ? 
          this.executionEndTime.getTime() - this.executionStartTime.getTime() : 0
      },
      deals: {
        total: this.totalDeals,
        processed: this.processedDeals,
        successful: this.successfulDeals,
        failed: this.failedDeals,
        skipped: this.skippedDeals,
        noCnpj: this.noCnpjDeals,
        existingData: this.existingDataDeals
      },
      performance: this.performanceStats,
      successRate: this.processedDeals > 0 ? 
        ((this.successfulDeals / this.processedDeals) * 100).toFixed(2) : 0,
      errorCount: this.errors.length,
      topCnpjs: this.getTopCnpjs()
    };
  }
  
  /**
   * Obter CNPJs mais consultados
   */
  getTopCnpjs() {
    return Object.entries(this.cnpjStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cnpj, count]) => ({ cnpj, count }));
  }
  
  /**
   * Obter estatísticas em formato string simples
   */
  getSimpleSummary() {
    const summary = this.getSummary();
    return `
📊 ESTATÍSTICAS DA EXECUÇÃO:
┌─────────────────────────────────────────┐
│ Duração total: ${summary.execution.duration}ms
│ Negócios encontrados: ${summary.deals.total}
│ Negócios processados: ${summary.deals.processed}
│ Sucessos: ${summary.deals.successful}
│ Falhas: ${summary.deals.failed}
│ Ignorados: ${summary.deals.skipped}
│ Taxa de sucesso: ${summary.successRate}%
│ CNPJs sem dados: ${summary.deals.noCnpj}
└─────────────────────────────────────────┘`;
  }
}

module.exports = StatsCollector;
