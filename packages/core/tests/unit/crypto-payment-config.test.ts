/**
 * Unit tests for CryptoPaymentConfig interface and validation
 * Following TDD methodology - tests written before implementation
 */

import { describe, test, expect } from '@jest/globals';
import {
  CryptoPaymentConfig,
  ChainConfig,
  EncryptionConfig,
  MonitoringConfig,
  PerformanceConfig,
  TreasuryConfig,
  NotificationConfig,
  LoggingConfig,
  ConfigurationValidator,
  ConfigurationBuilder
} from '../../core/index';

describe('CryptoPaymentConfig', () => {
  describe('Configuration Structure', () => {
    test('should have required chains array', () => {
      const config: CryptoPaymentConfig = {
        chains: [{
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://mainnet.infura.io/v3/test'
        }]
      };

      expect(config.chains).toBeDefined();
      expect(Array.isArray(config.chains)).toBe(true);
      expect(config.chains.length).toBeGreaterThan(0);
    });

    test('should allow optional mode specification', () => {
      const lightweightConfig: CryptoPaymentConfig = {
        mode: 'lightweight',
        chains: [/* mock chains */]
      };

      const enterpriseConfig: CryptoPaymentConfig = {
        mode: 'enterprise',
        chains: [/* mock chains */]
      };

      expect(lightweightConfig.mode).toBe('lightweight');
      expect(enterpriseConfig.mode).toBe('enterprise');
    });

    test('should allow all optional configuration sections', () => {
      const fullConfig: CryptoPaymentConfig = {
        mode: 'enterprise',
        chains: [{
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://mainnet.infura.io/v3/test'
        }],
        encryption: {
          key: 'test-key-32-characters-long-!!!!',
          algorithm: 'aes-256-gcm'
        },
        monitoring: {
          pollingInterval: 5000,
          batchSize: 100
        },
        performance: {
          maxConcurrentChains: 10,
          walletsPerBatch: 500
        },
        treasury: {
          defaultType: 'multisig',
          gasOptimization: true
        },
        notifications: {
          strategies: ['websocket', 'events'],
          fallback: 'events'
        },
        logging: {
          level: 'info',
          destination: 'console'
        }
      };

      expect(fullConfig.encryption).toBeDefined();
      expect(fullConfig.monitoring).toBeDefined();
      expect(fullConfig.performance).toBeDefined();
      expect(fullConfig.treasury).toBeDefined();
      expect(fullConfig.notifications).toBeDefined();
      expect(fullConfig.logging).toBeDefined();
    });
  });

  describe('Chain Configuration', () => {
    test('should require name, adapter, and rpcUrl for each chain', () => {
      const chainConfig: ChainConfig = {
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://mainnet.infura.io/v3/test'
      };

      expect(chainConfig.name).toBeDefined();
      expect(chainConfig.adapter).toBeDefined();
      expect(chainConfig.rpcUrl).toBeDefined();
      expect(typeof chainConfig.name).toBe('string');
      expect(typeof chainConfig.adapter).toBe('string');
      expect(typeof chainConfig.rpcUrl).toBe('string');
    });

    test('should allow optional wsUrl and options', () => {
      const chainConfig: ChainConfig = {
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://mainnet.infura.io/v3/test',
        wsUrl: 'wss://mainnet.infura.io/ws/v3/test',
        options: {
          gasPrice: 'auto',
          confirmations: 12,
          timeout: 30000
        }
      };

      expect(chainConfig.wsUrl).toBeDefined();
      expect(chainConfig.options).toBeDefined();
      expect(chainConfig.options?.gasPrice).toBe('auto');
      expect(chainConfig.options?.confirmations).toBe(12);
    });

    test('should support multiple chain configurations', () => {
      const config: CryptoPaymentConfig = {
        chains: [
          {
            name: 'ethereum',
            adapter: '@cryptopaygw/evm-adapter',
            rpcUrl: 'https://mainnet.infura.io/v3/test'
          },
          {
            name: 'bsc',
            adapter: '@cryptopaygw/evm-adapter',
            rpcUrl: 'https://bsc-dataseed1.binance.org'
          },
          {
            name: 'bitcoin',
            adapter: '@cryptopaygw/utxo-adapter',
            rpcUrl: 'https://bitcoin-rpc.com'
          }
        ]
      };

      expect(config.chains).toHaveLength(3);
      expect(config.chains[0].name).toBe('ethereum');
      expect(config.chains[1].name).toBe('bsc');
      expect(config.chains[2].name).toBe('bitcoin');
    });
  });

  describe('Encryption Configuration', () => {
    test('should require encryption key', () => {
      const encryptionConfig: EncryptionConfig = {
        key: 'test-encryption-key-32-characters!!'
      };

      expect(encryptionConfig.key).toBeDefined();
      expect(typeof encryptionConfig.key).toBe('string');
      expect(encryptionConfig.key.length).toBeGreaterThan(0);
    });

    test('should support encryption algorithms', () => {
      const gcmConfig: EncryptionConfig = {
        key: 'test-key',
        algorithm: 'aes-256-gcm'
      };

      const cbcConfig: EncryptionConfig = {
        key: 'test-key',
        algorithm: 'aes-256-cbc'
      };

      expect(gcmConfig.algorithm).toBe('aes-256-gcm');
      expect(cbcConfig.algorithm).toBe('aes-256-cbc');
    });

    test('should support key derivation configuration', () => {
      const encryptionConfig: EncryptionConfig = {
        key: 'master-password',
        algorithm: 'aes-256-gcm',
        keyDerivation: {
          iterations: 200000,
          salt: 'custom-salt',
          keyLength: 32
        }
      };

      expect(encryptionConfig.keyDerivation).toBeDefined();
      expect(encryptionConfig.keyDerivation?.iterations).toBe(200000);
      expect(encryptionConfig.keyDerivation?.salt).toBe('custom-salt');
      expect(encryptionConfig.keyDerivation?.keyLength).toBe(32);
    });
  });

  describe('Monitoring Configuration', () => {
    test('should support polling configuration', () => {
      const monitoringConfig: MonitoringConfig = {
        pollingInterval: 5000,
        batchSize: 100,
        maxRetries: 3,
        timeout: 30000
      };

      expect(monitoringConfig.pollingInterval).toBe(5000);
      expect(monitoringConfig.batchSize).toBe(100);
      expect(monitoringConfig.maxRetries).toBe(3);
      expect(monitoringConfig.timeout).toBe(30000);
    });

    test('should support WebSocket configuration', () => {
      const monitoringConfig: MonitoringConfig = {
        useWebSockets: true,
        fallbackToPolling: true
      };

      expect(monitoringConfig.useWebSockets).toBe(true);
      expect(monitoringConfig.fallbackToPolling).toBe(true);
    });

    test('should support advanced monitoring options', () => {
      const monitoringConfig: MonitoringConfig = {
        blockRange: 100,
        maxConcurrentRequests: 25
      };

      expect(monitoringConfig.blockRange).toBe(100);
      expect(monitoringConfig.maxConcurrentRequests).toBe(25);
    });
  });

  describe('Performance Configuration', () => {
    test('should support concurrency settings', () => {
      const performanceConfig: PerformanceConfig = {
        maxConcurrentChains: 10,
        walletsPerBatch: 500,
        connectionPoolSize: 25,
        workerThreads: 8
      };

      expect(performanceConfig.maxConcurrentChains).toBe(10);
      expect(performanceConfig.walletsPerBatch).toBe(500);
      expect(performanceConfig.connectionPoolSize).toBe(25);
      expect(performanceConfig.workerThreads).toBe(8);
    });

    test('should support resource limits', () => {
      const performanceConfig: PerformanceConfig = {
        maxMemoryUsage: '2GB',
        rateLimitRpm: 5000,
        cacheSize: 10000
      };

      expect(performanceConfig.maxMemoryUsage).toBe('2GB');
      expect(performanceConfig.rateLimitRpm).toBe(5000);
      expect(performanceConfig.cacheSize).toBe(10000);
    });

    test('should support garbage collection configuration', () => {
      const performanceConfig: PerformanceConfig = {
        gcInterval: 300000 // 5 minutes
      };

      expect(performanceConfig.gcInterval).toBe(300000);
    });
  });

  describe('Treasury Configuration', () => {
    test('should support treasury types', () => {
      const multisigConfig: TreasuryConfig = {
        defaultType: 'multisig'
      };

      const governanceConfig: TreasuryConfig = {
        defaultType: 'governance'
      };

      const timelockConfig: TreasuryConfig = {
        defaultType: 'timelock'
      };

      expect(multisigConfig.defaultType).toBe('multisig');
      expect(governanceConfig.defaultType).toBe('governance');
      expect(timelockConfig.defaultType).toBe('timelock');
    });

    test('should support optimization settings', () => {
      const treasuryConfig: TreasuryConfig = {
        gasOptimization: true,
        batchTransactions: true
      };

      expect(treasuryConfig.gasOptimization).toBe(true);
      expect(treasuryConfig.batchTransactions).toBe(true);
    });

    test('should support governance parameters', () => {
      const treasuryConfig: TreasuryConfig = {
        approvalThreshold: 3,
        executionDelay: 86400, // 24 hours
        maxSigners: 10,
        emergencyPause: true
      };

      expect(treasuryConfig.approvalThreshold).toBe(3);
      expect(treasuryConfig.executionDelay).toBe(86400);
      expect(treasuryConfig.maxSigners).toBe(10);
      expect(treasuryConfig.emergencyPause).toBe(true);
    });
  });

  describe('Notification Configuration', () => {
    test('should support notification strategies', () => {
      const notificationConfig: NotificationConfig = {
        strategies: ['websocket', 'events', 'callback'],
        fallback: 'events'
      };

      expect(notificationConfig.strategies).toContain('websocket');
      expect(notificationConfig.strategies).toContain('events');
      expect(notificationConfig.strategies).toContain('callback');
      expect(notificationConfig.fallback).toBe('events');
    });

    test('should support queue and retry configuration', () => {
      const notificationConfig: NotificationConfig = {
        queueSize: 10000,
        retryAttempts: 5,
        retryDelay: 3000
      };

      expect(notificationConfig.queueSize).toBe(10000);
      expect(notificationConfig.retryAttempts).toBe(5);
      expect(notificationConfig.retryDelay).toBe(3000);
    });

    test('should support notification optimization', () => {
      const notificationConfig: NotificationConfig = {
        batchNotifications: true,
        filterDuplicates: true
      };

      expect(notificationConfig.batchNotifications).toBe(true);
      expect(notificationConfig.filterDuplicates).toBe(true);
    });
  });

  describe('Logging Configuration', () => {
    test('should support log levels', () => {
      const debugConfig: LoggingConfig = { level: 'debug' };
      const infoConfig: LoggingConfig = { level: 'info' };
      const warnConfig: LoggingConfig = { level: 'warn' };
      const errorConfig: LoggingConfig = { level: 'error' };

      expect(debugConfig.level).toBe('debug');
      expect(infoConfig.level).toBe('info');
      expect(warnConfig.level).toBe('warn');
      expect(errorConfig.level).toBe('error');
    });

    test('should support console and file destinations', () => {
      const consoleConfig: LoggingConfig = {
        destination: 'console'
      };

      const fileConfig: LoggingConfig = {
        destination: '/var/log/cryptopaygw/app.log'
      };

      expect(consoleConfig.destination).toBe('console');
      expect(fileConfig.destination).toBe('/var/log/cryptopaygw/app.log');
    });

    test('should support log formatting options', () => {
      const loggingConfig: LoggingConfig = {
        includeTimestamp: true,
        includeLevel: true,
        includeModule: true,
        format: 'json'
      };

      expect(loggingConfig.includeTimestamp).toBe(true);
      expect(loggingConfig.includeLevel).toBe(true);
      expect(loggingConfig.includeModule).toBe(true);
      expect(loggingConfig.format).toBe('json');
    });

    test('should support file rotation settings', () => {
      const loggingConfig: LoggingConfig = {
        maxFileSize: '100MB',
        maxFiles: 5
      };

      expect(loggingConfig.maxFileSize).toBe('100MB');
      expect(loggingConfig.maxFiles).toBe(5);
    });
  });
});

describe('Configuration Validation', () => {
  describe('Valid Configurations', () => {
    test('should validate minimal valid configuration', () => {
      const result = ConfigurationValidator.validate({
        chains: [{
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://mainnet.infura.io/v3/test'
        }]
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate complete enterprise configuration', () => {
      const config: CryptoPaymentConfig = {
        mode: 'enterprise',
        chains: [{
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://mainnet.infura.io/v3/test',
          wsUrl: 'wss://mainnet.infura.io/ws/v3/test',
          options: {
            gasPrice: 'auto',
            confirmations: 12,
            timeout: 30000
          }
        }],
        encryption: {
          key: 'test-encryption-key-32-characters!!',
          algorithm: 'aes-256-gcm'
        },
        monitoring: {
          pollingInterval: 5000,
          batchSize: 100,
          useWebSockets: true
        },
        performance: {
          maxConcurrentChains: 10,
          walletsPerBatch: 500
        }
      };

      const result = ConfigurationValidator.validate(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Invalid Configurations', () => {
    test('should reject configuration with empty chains array', () => {
      const result = ConfigurationValidator.validate({
        chains: []
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('chains array cannot be empty');
    });

    test('should reject chain configuration with invalid URL', () => {
      const result = ConfigurationValidator.validateChainConfig({
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'invalid-url'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('rpcUrl must be a valid URL');
    });

    test('should reject encryption configuration with short key', () => {
      const result = ConfigurationValidator.validateEncryptionConfig({
        key: 'short'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('key must be at least 32 characters long for security');
    });

    test('should reject invalid mode values', () => {
      const result = ConfigurationValidator.validate({
        mode: 'invalid' as any,
        chains: [{
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://mainnet.infura.io/v3/test'
        }]
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('mode must be either "lightweight" or "enterprise"');
    });
  });
});

describe('Configuration Builders', () => {
  describe('Lightweight Configuration Builder', () => {
    test('should create lightweight configuration with appropriate defaults', () => {
      const chains: ChainConfig[] = [{
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://mainnet.infura.io/v3/test'
      }];

      const config = ConfigurationBuilder.createLightweightConfig(chains);

      expect(config.mode).toBe('lightweight');
      expect(config.chains).toHaveLength(1);
      expect(config.monitoring?.pollingInterval).toBe(10000);
      expect(config.monitoring?.batchSize).toBe(10);
      expect(config.monitoring?.useWebSockets).toBe(false);
      expect(config.performance?.maxConcurrentChains).toBe(2);
      expect(config.performance?.walletsPerBatch).toBe(50);
      expect(config.performance?.maxMemoryUsage).toBe('128MB');
      expect(config.logging?.level).toBe('info');
      expect(config.logging?.destination).toBe('console');
    });

    test('should throw error for empty chains array', () => {
      expect(() => {
        ConfigurationBuilder.createLightweightConfig([]);
      }).toThrow('At least one chain configuration is required');
    });

    test('should apply conservative chain defaults', () => {
      const chains: ChainConfig[] = [{
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://mainnet.infura.io/v3/test'
      }];

      const config = ConfigurationBuilder.createLightweightConfig(chains);

      expect(config.chains[0].options?.confirmations).toBe(3);
      expect(config.chains[0].options?.timeout).toBe(30000);
      expect(config.chains[0].options?.maxRetries).toBe(2);
      expect(config.chains[0].options?.rateLimitRpm).toBe(600);
    });
  });

  describe('Enterprise Configuration Builder', () => {
    test('should create enterprise configuration with performance optimizations', () => {
      const chains: ChainConfig[] = [{
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://mainnet.infura.io/v3/test'
      }];

      const config = ConfigurationBuilder.createEnterpriseConfig(chains);

      expect(config.mode).toBe('enterprise');
      expect(config.chains).toHaveLength(1);
      expect(config.monitoring?.pollingInterval).toBe(5000);
      expect(config.monitoring?.batchSize).toBe(100);
      expect(config.monitoring?.useWebSockets).toBe(true);
      expect(config.performance?.maxConcurrentChains).toBe(10);
      expect(config.performance?.walletsPerBatch).toBe(500);
      expect(config.performance?.maxMemoryUsage).toBe('4GB');
      expect(config.notifications?.strategies).toContain('websocket');
      expect(config.notifications?.strategies).toContain('events');
      expect(config.logging?.format).toBe('json');
    });

    test('should apply chain-specific confirmation defaults', () => {
      const chains: ChainConfig[] = [
        {
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://mainnet.infura.io/v3/test'
        },
        {
          name: 'bitcoin',
          adapter: '@cryptopaygw/utxo-adapter',
          rpcUrl: 'https://bitcoin-rpc.com'
        }
      ];

      const config = ConfigurationBuilder.createEnterpriseConfig(chains);

      expect(config.chains[0].options?.confirmations).toBe(12); // Ethereum default
      expect(config.chains[1].options?.confirmations).toBe(6);  // Bitcoin default
    });

    test('should throw error for empty chains array', () => {
      expect(() => {
        ConfigurationBuilder.createEnterpriseConfig([]);
      }).toThrow('At least one chain configuration is required');
    });
  });

  describe('Development Configuration Builder', () => {
    test('should create development configuration with debug settings', () => {
      const chains: ChainConfig[] = [{
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://sepolia.infura.io/v3/test'
      }];

      const config = ConfigurationBuilder.createDevelopmentConfig(chains);

      expect(config.monitoring?.pollingInterval).toBe(5000);
      expect(config.monitoring?.useWebSockets).toBe(true);
      expect(config.logging?.level).toBe('debug');
      expect(config.chains[0].options?.confirmations).toBe(1); // Fast testing
      expect(config.chains[0].options?.timeout).toBe(10000);
    });
  });

  describe('Production Configuration Builder', () => {
    test('should create production configuration with security focus', () => {
      const chains: ChainConfig[] = [{
        name: 'ethereum',
        adapter: '@cryptopaygw/evm-adapter',
        rpcUrl: 'https://mainnet.infura.io/v3/test'
      }];

      const config = ConfigurationBuilder.createProductionConfig(chains);

      expect(config.logging?.level).toBe('warn');
      expect(config.logging?.destination).toBe('/var/log/cryptopaygw/app.log');
      expect(config.logging?.includeModule).toBe(false);
      expect(config.chains[0].options?.confirmations).toBe(15); // High security
      expect(config.chains[0].options?.timeout).toBe(60000);
      expect(config.chains[0].options?.maxRetries).toBe(3);
    });
  });
});
