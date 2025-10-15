/**
 * Configuration validator for CryptoPaymentConfig
 * Implements validation logic following TDD test requirements
 */

import { URL } from 'node:url';
import {
  CryptoPaymentConfig,
  ChainConfig,
  EncryptionConfig,
  ValidationResult,
  ChainOptions,
  MonitoringConfig,
  PerformanceConfig
} from '../types/index';

/**
 * Static validator class for configuration validation
 */
export class ConfigurationValidator {
  /**
   * Validates the complete CryptoPaymentConfig
   */
  static validate(config: CryptoPaymentConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!config.chains) {
      errors.push('chains field is required');
    } else if (!Array.isArray(config.chains)) {
      errors.push('chains must be an array');
    } else if (config.chains.length === 0) {
      errors.push('chains array cannot be empty');
    } else {
      // Validate each chain configuration
      config.chains.forEach((chain, index) => {
        const chainValidation = this.validateChainConfig(chain);
        if (!chainValidation.isValid) {
          chainValidation.errors.forEach(error => {
            errors.push(`Chain ${index} (${chain.name || 'unnamed'}): ${error}`);
          });
        }
        chainValidation.warnings.forEach(warning => {
          warnings.push(`Chain ${index} (${chain.name || 'unnamed'}): ${warning}`);
        });
      });
    }

    // Validate mode if provided
    if (config.mode && !['lightweight', 'enterprise'].includes(config.mode)) {
      errors.push('mode must be either "lightweight" or "enterprise"');
    }

    // Validate encryption config if provided
    if (config.encryption) {
      const encryptionValidation = this.validateEncryptionConfig(config.encryption);
      if (!encryptionValidation.isValid) {
        encryptionValidation.errors.forEach(error => {
          errors.push(`Encryption: ${error}`);
        });
      }
      encryptionValidation.warnings.forEach(warning => {
        warnings.push(`Encryption: ${warning}`);
      });
    }

    // Validate monitoring config if provided
    if (config.monitoring) {
      const monitoringValidation = this.validateMonitoringConfig(config.monitoring);
      if (!monitoringValidation.isValid) {
        monitoringValidation.errors.forEach(error => {
          errors.push(`Monitoring: ${error}`);
        });
      }
      monitoringValidation.warnings.forEach(warning => {
        warnings.push(`Monitoring: ${warning}`);
      });
    }

    // Validate performance config if provided
    if (config.performance) {
      const performanceValidation = this.validatePerformanceConfig(config.performance);
      if (!performanceValidation.isValid) {
        performanceValidation.errors.forEach(error => {
          errors.push(`Performance: ${error}`);
        });
      }
      performanceValidation.warnings.forEach(warning => {
        warnings.push(`Performance: ${warning}`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a single chain configuration
   */
  static validateChainConfig(chainConfig: ChainConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!chainConfig.name || typeof chainConfig.name !== 'string') {
      errors.push('name is required and must be a string');
    }

    if (!chainConfig.adapter || typeof chainConfig.adapter !== 'string') {
      errors.push('adapter is required and must be a string');
    } else if (!chainConfig.adapter.startsWith('@cryptopaygw/')) {
      warnings.push('adapter should use @cryptopaygw/ namespace for official adapters');
    }

    if (!chainConfig.rpcUrl || typeof chainConfig.rpcUrl !== 'string') {
      errors.push('rpcUrl is required and must be a string');
    } else {
      // Validate URL format
      try {
        const url = new URL(chainConfig.rpcUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('rpcUrl must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('rpcUrl must be a valid URL');
      }
    }

    // Validate optional wsUrl if provided
    if (chainConfig.wsUrl) {
      try {
        const url = new URL(chainConfig.wsUrl);
        if (!['ws:', 'wss:'].includes(url.protocol)) {
          errors.push('wsUrl must use WS or WSS protocol');
        }
      } catch {
        errors.push('wsUrl must be a valid WebSocket URL');
      }
    }

    // Validate chain options if provided
    if (chainConfig.options) {
      const optionsValidation = this.validateChainOptions(chainConfig.options);
      if (!optionsValidation.isValid) {
        optionsValidation.errors.forEach(error => {
          errors.push(`Options: ${error}`);
        });
      }
      optionsValidation.warnings.forEach(warning => {
        warnings.push(`Options: ${warning}`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates encryption configuration
   */
  static validateEncryptionConfig(encryptionConfig: EncryptionConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required key
    if (!encryptionConfig.key || typeof encryptionConfig.key !== 'string') {
      errors.push('key is required and must be a string');
    } else {
      // Check key length
      if (encryptionConfig.key.length < 32) {
        errors.push('key must be at least 32 characters long for security');
      } else if (encryptionConfig.key.length < 64) {
        warnings.push('consider using a longer key (64+ characters) for enhanced security');
      }
    }

    // Validate algorithm if provided
    if (encryptionConfig.algorithm && 
        !['aes-256-gcm', 'aes-256-cbc'].includes(encryptionConfig.algorithm)) {
      errors.push('algorithm must be either "aes-256-gcm" or "aes-256-cbc"');
    }

    // Validate key derivation if provided
    if (encryptionConfig.keyDerivation) {
      const { iterations, salt, keyLength } = encryptionConfig.keyDerivation;
      
      if (iterations !== undefined && (iterations < 10000 || iterations > 1000000)) {
        warnings.push('iterations should be between 10,000 and 1,000,000 for optimal security/performance balance');
      }
      
      if (salt !== undefined && salt.length < 8) {
        warnings.push('salt should be at least 8 characters long');
      }
      
      if (keyLength !== undefined && (keyLength < 16 || keyLength > 64)) {
        errors.push('keyLength must be between 16 and 64 bytes');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates chain options configuration
   */
  private static validateChainOptions(options: ChainOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (options.confirmations !== undefined) {
      if (typeof options.confirmations !== 'number' || options.confirmations < 0) {
        errors.push('confirmations must be a non-negative number');
      } else if (options.confirmations === 0) {
        warnings.push('using 0 confirmations is risky for production use');
      }
    }

    if (options.timeout !== undefined) {
      if (typeof options.timeout !== 'number' || options.timeout < 1000) {
        errors.push('timeout must be at least 1000 milliseconds');
      }
    }

    if (options.maxRetries !== undefined) {
      if (typeof options.maxRetries !== 'number' || options.maxRetries < 0) {
        errors.push('maxRetries must be a non-negative number');
      }
    }

    if (options.rateLimitRpm !== undefined) {
      if (typeof options.rateLimitRpm !== 'number' || options.rateLimitRpm < 1) {
        errors.push('rateLimitRpm must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates monitoring configuration
   */
  private static validateMonitoringConfig(monitoring: MonitoringConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (monitoring.pollingInterval !== undefined) {
      if (typeof monitoring.pollingInterval !== 'number' || monitoring.pollingInterval < 1000) {
        errors.push('pollingInterval must be at least 1000 milliseconds');
      }
    }

    if (monitoring.batchSize !== undefined) {
      if (typeof monitoring.batchSize !== 'number' || monitoring.batchSize < 1) {
        errors.push('batchSize must be a positive number');
      } else if (monitoring.batchSize > 1000) {
        warnings.push('large batch sizes may cause memory issues');
      }
    }

    if (monitoring.maxRetries !== undefined) {
      if (typeof monitoring.maxRetries !== 'number' || monitoring.maxRetries < 0) {
        errors.push('maxRetries must be a non-negative number');
      }
    }

    if (monitoring.timeout !== undefined) {
      if (typeof monitoring.timeout !== 'number' || monitoring.timeout < 1000) {
        errors.push('timeout must be at least 1000 milliseconds');
      }
    }

    if (monitoring.blockRange !== undefined) {
      if (typeof monitoring.blockRange !== 'number' || monitoring.blockRange < 1) {
        errors.push('blockRange must be a positive number');
      }
    }

    if (monitoring.maxConcurrentRequests !== undefined) {
      if (typeof monitoring.maxConcurrentRequests !== 'number' || monitoring.maxConcurrentRequests < 1) {
        errors.push('maxConcurrentRequests must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates performance configuration
   */
  private static validatePerformanceConfig(performance: PerformanceConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (performance.maxConcurrentChains !== undefined) {
      if (typeof performance.maxConcurrentChains !== 'number' || performance.maxConcurrentChains < 1) {
        errors.push('maxConcurrentChains must be a positive number');
      }
    }

    if (performance.walletsPerBatch !== undefined) {
      if (typeof performance.walletsPerBatch !== 'number' || performance.walletsPerBatch < 1) {
        errors.push('walletsPerBatch must be a positive number');
      }
    }

    if (performance.connectionPoolSize !== undefined) {
      if (typeof performance.connectionPoolSize !== 'number' || performance.connectionPoolSize < 1) {
        errors.push('connectionPoolSize must be a positive number');
      }
    }

    if (performance.workerThreads !== undefined) {
      if (typeof performance.workerThreads !== 'number' || performance.workerThreads < 1) {
        errors.push('workerThreads must be a positive number');
      }
    }

    if (performance.rateLimitRpm !== undefined) {
      if (typeof performance.rateLimitRpm !== 'number' || performance.rateLimitRpm < 1) {
        errors.push('rateLimitRpm must be a positive number');
      }
    }

    if (performance.cacheSize !== undefined) {
      if (typeof performance.cacheSize !== 'number' || performance.cacheSize < 0) {
        errors.push('cacheSize must be a non-negative number');
      }
    }

    if (performance.gcInterval !== undefined) {
      if (typeof performance.gcInterval !== 'number' || performance.gcInterval < 1000) {
        errors.push('gcInterval must be at least 1000 milliseconds');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
