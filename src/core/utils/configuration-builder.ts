/**
 * Configuration builder for creating pre-configured CryptoPaymentConfig instances
 * Implements builder patterns for lightweight and enterprise configurations
 */

import {
  CryptoPaymentConfig,
  ChainConfig,
  MonitoringConfig,
  PerformanceConfig,
  NotificationConfig,
  LoggingConfig
} from '../types/index';

/**
 * Static builder class for creating optimized configurations
 */
export class ConfigurationBuilder {
  /**
   * Creates a lightweight configuration optimized for simple use cases
   * 
   * Features:
   * - Single wallet monitoring
   * - Minimal memory usage
   * - Basic error handling
   * - Polling-based monitoring
   * - No internal queues
   */
  static createLightweightConfig(chains: ChainConfig[]): CryptoPaymentConfig {
    if (!chains || chains.length === 0) {
      throw new Error('At least one chain configuration is required');
    }

    const monitoring: MonitoringConfig = {
      pollingInterval: 10000,          // 10 seconds - less frequent polling
      batchSize: 10,                   // Small batches
      maxRetries: 2,                   // Minimal retries
      timeout: 30000,                  // 30 second timeout
      useWebSockets: false,            // Disable WebSockets for simplicity
      fallbackToPolling: true,         // Always use polling
      blockRange: 10,                  // Small block range
      maxConcurrentRequests: 3         // Limited concurrent requests
    };

    const performance: PerformanceConfig = {
      maxConcurrentChains: 2,          // Limited concurrent chains
      walletsPerBatch: 50,             // Small wallet batches
      connectionPoolSize: 3,           // Minimal connection pool
      workerThreads: 1,                // Single worker thread
      maxMemoryUsage: '128MB',         // Limited memory usage
      rateLimitRpm: 600,               // Conservative rate limiting
      cacheSize: 100,                  // Small cache
      gcInterval: 300000               // 5 minutes GC interval
    };

    const notifications: NotificationConfig = {
      strategies: ['callback'],        // Simple callback only
      fallback: 'callback',
      queueSize: 100,                  // Small queue
      retryAttempts: 2,                // Minimal retries
      retryDelay: 5000,                // 5 second delay
      batchNotifications: false,       // No batching
      filterDuplicates: true           // Filter duplicates
    };

    const logging: LoggingConfig = {
      level: 'info',                   // Standard logging level
      destination: 'console',          // Console only
      includeTimestamp: true,
      includeLevel: true,
      includeModule: false,            // Minimal logging
      format: 'text'                   // Simple text format
    };

    return {
      mode: 'lightweight',
      chains: chains.map(chain => ({
        ...chain,
        options: {
          // Apply conservative defaults
          confirmations: chain.options?.confirmations ?? 3,
          timeout: chain.options?.timeout ?? 30000,
          maxRetries: chain.options?.maxRetries ?? 2,
          rateLimitRpm: chain.options?.rateLimitRpm ?? 600,
          ...chain.options
        }
      })),
      monitoring,
      performance,
      notifications,
      logging
    };
  }

  /**
   * Creates an enterprise configuration optimized for high-scale operations
   * 
   * Features:
   * - Batch processing enabled
   * - Connection pooling
   * - Advanced caching
   * - Worker thread utilization
   * - Internal queue management
   * - Performance monitoring
   */
  static createEnterpriseConfig(chains: ChainConfig[]): CryptoPaymentConfig {
    if (!chains || chains.length === 0) {
      throw new Error('At least one chain configuration is required');
    }

    const monitoring: MonitoringConfig = {
      pollingInterval: 5000,           // 5 seconds - frequent polling
      batchSize: 100,                  // Large batches for efficiency
      maxRetries: 5,                   // Multiple retries
      timeout: 30000,                  // 30 second timeout
      useWebSockets: true,             // Enable WebSockets for real-time
      fallbackToPolling: true,         // Fallback available
      blockRange: 100,                 // Large block range
      maxConcurrentRequests: 25        // High concurrency
    };

    const performance: PerformanceConfig = {
      maxConcurrentChains: 10,         // High concurrent chains
      walletsPerBatch: 500,            // Large wallet batches
      connectionPoolSize: 25,          // Large connection pool
      workerThreads: 8,                // Multiple worker threads
      maxMemoryUsage: '4GB',           // High memory allowance
      rateLimitRpm: 10000,             // High rate limits
      cacheSize: 20000,                // Large cache
      gcInterval: 300000               // 5 minutes GC interval
    };

    const notifications: NotificationConfig = {
      strategies: ['websocket', 'events', 'callback'], // Multiple strategies
      fallback: 'events',
      queueSize: 50000,                // Large queue
      retryAttempts: 5,                // Multiple retries
      retryDelay: 3000,                // 3 second delay
      batchNotifications: true,        // Enable batching
      filterDuplicates: true           // Filter duplicates
    };

    const logging: LoggingConfig = {
      level: 'info',                   // Standard logging level
      destination: 'console',          // Can be overridden
      includeTimestamp: true,
      includeLevel: true,
      includeModule: true,             // Full logging
      format: 'json'                   // Structured format for analysis
    };

    return {
      mode: 'enterprise',
      chains: chains.map(chain => ({
        ...chain,
        options: {
          // Apply enterprise defaults
          confirmations: chain.options?.confirmations ?? 
            (chain.name === 'ethereum' ? 12 : 
             chain.name === 'bitcoin' ? 6 : 3),
          timeout: chain.options?.timeout ?? 30000,
          maxRetries: chain.options?.maxRetries ?? 5,
          rateLimitRpm: chain.options?.rateLimitRpm ?? 3000,
          ...chain.options
        }
      })),
      monitoring,
      performance,
      notifications,
      logging
    };
  }

  /**
   * Creates a development configuration suitable for testing and development
   */
  static createDevelopmentConfig(chains: ChainConfig[]): CryptoPaymentConfig {
    if (!chains || chains.length === 0) {
      throw new Error('At least one chain configuration is required');
    }

    const config = this.createLightweightConfig(chains);
    
    // Override with development-specific settings
    config.monitoring = {
      ...config.monitoring,
      pollingInterval: 5000,           // Faster for development
      useWebSockets: true,             // Enable for testing
      fallbackToPolling: true
    };

    config.logging = {
      level: 'debug',                  // Verbose logging for development
      destination: 'console',
      includeTimestamp: true,
      includeLevel: true,
      includeModule: true,
      format: 'text'
    };

    // Set minimal confirmations for faster testing
    config.chains = config.chains.map(chain => ({
      ...chain,
      options: {
        ...chain.options,
        confirmations: 1,              // Fast confirmations for testing
        timeout: 10000                 // Shorter timeouts
      }
    }));

    return config;
  }

  /**
   * Creates a production configuration with security-focused defaults
   */
  static createProductionConfig(chains: ChainConfig[]): CryptoPaymentConfig {
    if (!chains || chains.length === 0) {
      throw new Error('At least one chain configuration is required');
    }

    const config = this.createEnterpriseConfig(chains);
    
    // Override with production-specific security settings
    config.logging = {
      level: 'warn',                   // Minimal logging for security
      destination: '/var/log/cryptopaygw/app.log',
      includeTimestamp: true,
      includeLevel: true,
      includeModule: false,            // Don't expose internal structure
      maxFileSize: '100MB',
      maxFiles: 5,
      format: 'json'
    };

    // Set conservative confirmations for security
    config.chains = config.chains.map(chain => ({
      ...chain,
      options: {
        ...chain.options,
        // Override confirmations for security (don't use existing values)
        confirmations: chain.name === 'ethereum' ? 15 : 
                      chain.name === 'bitcoin' ? 6 : 5,
        timeout: 60000,                // Longer timeouts for reliability
        maxRetries: 3                  // Conservative retries
      }
    }));

    return config;
  }
}
