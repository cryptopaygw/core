# CryptoPaymentConfig Documentation

Comprehensive guide to configuring the Crypto Payment Gateway library.

## Table of Contents

1. [Overview](#overview)
2. [Configuration Interface](#configuration-interface)
3. [Operating Modes](#operating-modes)
4. [Chain Configuration](#chain-configuration)
5. [Encryption Settings](#encryption-settings)
6. [Monitoring Configuration](#monitoring-configuration)
7. [Performance Settings](#performance-settings)
8. [Treasury Management](#treasury-management)
9. [Notification Strategies](#notification-strategies)
10. [Logging Configuration](#logging-configuration)
11. [Complete Examples](#complete-examples)
12. [Best Practices](#best-practices)

## Overview

The `CryptoPaymentConfig` interface is the main configuration object used to initialize the Crypto Payment Gateway library. It provides comprehensive control over all aspects of the library's behavior, from basic wallet monitoring to enterprise-scale operations handling hundreds of thousands of wallets.

## Configuration Interface

```typescript
interface CryptoPaymentConfig {
  mode?: 'lightweight' | 'enterprise';
  chains: ChainConfig[];
  encryption?: EncryptionConfig;
  monitoring?: MonitoringConfig;
  performance?: PerformanceConfig;
  treasury?: TreasuryConfig;
  notifications?: NotificationConfig;
  logging?: LoggingConfig;
}
```

## Operating Modes

The library supports two primary operating modes that determine default behavior and resource allocation.

### Lightweight Mode

**Purpose:** Optimized for simple use cases with minimal resource consumption.

**Default Settings:**
- Single wallet monitoring
- Minimal memory usage
- Basic error handling
- Polling-based monitoring
- No internal queues

**Use Cases:**
- Development and testing
- Small-scale applications
- Single-wallet monitoring
- Resource-constrained environments

```typescript
const config: CryptoPaymentConfig = {
  mode: 'lightweight',
  chains: [/* chain configs */]
};
```

### Enterprise Mode

**Purpose:** Designed for high-scale operations with advanced features.

**Default Settings:**
- Batch processing enabled
- Connection pooling
- Advanced caching
- Worker thread utilization
- Internal queue management
- Performance monitoring

**Use Cases:**
- Production environments
- Multiple chain monitoring
- High-volume transaction processing
- Advanced treasury management

```typescript
const config: CryptoPaymentConfig = {
  mode: 'enterprise',
  chains: [/* chain configs */]
};
```

## Chain Configuration

Each blockchain network requires a specific configuration that defines how the library interacts with that network.

### ChainConfig Interface

```typescript
interface ChainConfig {
  name: string;                    // Unique identifier for the chain
  adapter: string;                 // NPM package name for the chain adapter
  rpcUrl: string;                 // Primary RPC endpoint URL
  wsUrl?: string;                 // WebSocket endpoint (optional)
  options?: ChainOptions;         // Chain-specific options
}

interface ChainOptions {
  gasPrice?: 'auto' | string;     // Gas price strategy or fixed value
  confirmations?: number;         // Required confirmations for finality
  timeout?: number;               // Request timeout in milliseconds
  maxRetries?: number;            // Maximum retry attempts
  rateLimitRpm?: number;          // Rate limit (requests per minute)
}
```

### Supported Chain Adapters

#### EVM-Compatible Chains
```typescript
// Ethereum Mainnet
{
  name: 'ethereum',
  adapter: '@cryptopaygw/evm-adapter',
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  wsUrl: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
  options: {
    gasPrice: 'auto',
    confirmations: 12,
    timeout: 30000
  }
}

// Binance Smart Chain
{
  name: 'bsc',
  adapter: '@cryptopaygw/evm-adapter',
  rpcUrl: 'https://bsc-dataseed1.binance.org',
  options: {
    gasPrice: '5000000000', // 5 Gwei
    confirmations: 3
  }
}

// Polygon
{
  name: 'polygon',
  adapter: '@cryptopaygw/evm-adapter',
  rpcUrl: 'https://polygon-rpc.com',
  options: {
    gasPrice: '30000000000', // 30 Gwei
    confirmations: 20
  }
}
```

#### Bitcoin-Like Chains
```typescript
// Bitcoin (UTXO-based)
{
  name: 'bitcoin',
  adapter: '@cryptopaygw/utxo-adapter',
  rpcUrl: 'https://bitcoin-rpc.com',
  options: {
    confirmations: 6,
    timeout: 60000
  }
}
```

### Chain Configuration Best Practices

1. **Use WebSocket connections** when available for real-time monitoring
2. **Set appropriate confirmation counts** based on chain security requirements
3. **Configure timeouts** based on network characteristics
4. **Implement rate limiting** to avoid API throttling

## Encryption Settings

Encryption configuration controls how sensitive data (seeds, private keys) is handled within the library.

### EncryptionConfig Interface

```typescript
interface EncryptionConfig {
  key: string;                     // Master encryption key
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc';  // Encryption algorithm
  keyDerivation?: KeyDerivationConfig;         // Key derivation settings
}

interface KeyDerivationConfig {
  iterations?: number;             // PBKDF2 iterations (default: 100000)
  salt?: string;                  // Custom salt (auto-generated if not provided)
  keyLength?: number;             // Derived key length in bytes
}
```

### Encryption Examples

#### Basic Encryption
```typescript
const encryptionConfig: EncryptionConfig = {
  key: 'your-256-bit-secret-key-here-must-be-32-chars!!',
  algorithm: 'aes-256-gcm'
};
```

#### Advanced Encryption with Custom Derivation
```typescript
const encryptionConfig: EncryptionConfig = {
  key: 'master-password',
  algorithm: 'aes-256-gcm',
  keyDerivation: {
    iterations: 200000,
    salt: 'custom-application-salt',
    keyLength: 32
  }
};
```

### Security Considerations

1. **Key Length:** Use 256-bit keys for maximum security
2. **Algorithm Choice:** AES-256-GCM provides authentication and encryption
3. **Key Storage:** Store master keys securely (environment variables, key vaults)
4. **Salt Randomization:** Use unique salts for each deployment
5. **Iteration Count:** Higher iterations increase security but impact performance

## Monitoring Configuration

Controls how the library monitors blockchain networks for transactions and events.

### MonitoringConfig Interface

```typescript
interface MonitoringConfig {
  pollingInterval?: number;        // Milliseconds between polling checks
  batchSize?: number;             // Addresses processed per batch
  maxRetries?: number;            // Maximum retry attempts for failed requests
  timeout?: number;               // Request timeout in milliseconds
  useWebSockets?: boolean;        // Prefer WebSocket connections
  fallbackToPolling?: boolean;    // Fall back to polling if WebSocket fails
  blockRange?: number;            // Number of blocks to scan per query
  maxConcurrentRequests?: number; // Maximum simultaneous requests
}
```

### Monitoring Examples

#### Lightweight Monitoring
```typescript
const monitoringConfig: MonitoringConfig = {
  pollingInterval: 10000,         // 10 seconds
  batchSize: 10,                  // Small batches
  maxRetries: 2,
  useWebSockets: false,
  fallbackToPolling: true
};
```

#### Enterprise Monitoring
```typescript
const monitoringConfig: MonitoringConfig = {
  pollingInterval: 5000,          // 5 seconds
  batchSize: 100,                 // Large batches for efficiency
  maxRetries: 5,
  timeout: 30000,
  useWebSockets: true,
  fallbackToPolling: true,
  blockRange: 50,
  maxConcurrentRequests: 20
};
```

### Monitoring Strategy Guidelines

1. **Polling Interval:** Balance between real-time updates and API usage
2. **Batch Size:** Larger batches reduce API calls but increase memory usage
3. **WebSocket Usage:** Enables real-time monitoring with lower latency
4. **Fallback Strategies:** Always have polling as backup for WebSocket failures

## Performance Settings

Fine-tune the library's performance characteristics for your specific use case.

### PerformanceConfig Interface

```typescript
interface PerformanceConfig {
  maxConcurrentChains?: number;    // Maximum chains processed simultaneously
  walletsPerBatch?: number;        // Wallets processed per batch operation
  connectionPoolSize?: number;     // HTTP connection pool size per chain
  workerThreads?: number;          // Number of worker threads for CPU-intensive tasks
  maxMemoryUsage?: string;         // Maximum memory usage limit
  rateLimitRpm?: number;           // Global rate limit (requests per minute)
  cacheSize?: number;              // Cache size for frequently accessed data
  gcInterval?: number;             // Garbage collection interval in milliseconds
}
```

### Performance Examples

#### Development Performance
```typescript
const performanceConfig: PerformanceConfig = {
  maxConcurrentChains: 2,
  walletsPerBatch: 50,
  connectionPoolSize: 5,
  workerThreads: 2,
  maxMemoryUsage: '128MB',
  rateLimitRpm: 600
};
```

#### Production Performance
```typescript
const performanceConfig: PerformanceConfig = {
  maxConcurrentChains: 10,
  walletsPerBatch: 500,
  connectionPoolSize: 25,
  workerThreads: 8,
  maxMemoryUsage: '2GB',
  rateLimitRpm: 5000,
  cacheSize: 10000,
  gcInterval: 300000              // 5 minutes
};
```

### Performance Optimization Tips

1. **Worker Threads:** Use CPU core count as starting point for worker threads
2. **Connection Pooling:** Size pools based on expected concurrent requests
3. **Memory Limits:** Set appropriate limits to prevent memory leaks
4. **Batch Processing:** Optimize batch sizes based on API limits and memory

## Treasury Management

Configuration for advanced treasury operations including multi-signature wallets and governance.

### TreasuryConfig Interface

```typescript
interface TreasuryConfig {
  defaultType?: 'multisig' | 'governance' | 'timelock';
  gasOptimization?: boolean;       // Enable gas optimization strategies
  batchTransactions?: boolean;     // Batch multiple operations
  approvalThreshold?: number;      // Default approval threshold
  executionDelay?: number;         // Delay before execution (seconds)
  maxSigners?: number;             // Maximum number of signers
  emergencyPause?: boolean;        // Enable emergency pause functionality
}
```

### Treasury Examples

#### Basic Multi-Signature Treasury
```typescript
const treasuryConfig: TreasuryConfig = {
  defaultType: 'multisig',
  gasOptimization: true,
  batchTransactions: true,
  approvalThreshold: 2,
  maxSigners: 5
};
```

#### Advanced Governance Treasury
```typescript
const treasuryConfig: TreasuryConfig = {
  defaultType: 'governance',
  gasOptimization: true,
  batchTransactions: true,
  approvalThreshold: 3,
  executionDelay: 86400,          // 24 hours
  maxSigners: 10,
  emergencyPause: true
};
```

## Notification Strategies

Configure how the library delivers transaction notifications and events.

### NotificationConfig Interface

```typescript
interface NotificationConfig {
  strategies?: ('callback' | 'events' | 'websocket' | 'polling')[];
  fallback?: 'callback' | 'events' | 'polling';
  queueSize?: number;              // Internal notification queue size
  retryAttempts?: number;          // Retry attempts for failed notifications
  retryDelay?: number;             // Delay between retries (milliseconds)
  batchNotifications?: boolean;    // Batch multiple notifications
  filterDuplicates?: boolean;      // Filter out duplicate notifications
}
```

### Notification Examples

#### Simple Callback Notifications
```typescript
const notificationConfig: NotificationConfig = {
  strategies: ['callback'],
  fallback: 'callback',
  queueSize: 1000,
  retryAttempts: 3,
  filterDuplicates: true
};
```

#### Enterprise Event-Driven Notifications
```typescript
const notificationConfig: NotificationConfig = {
  strategies: ['websocket', 'events', 'callback'],
  fallback: 'events',
  queueSize: 10000,
  retryAttempts: 5,
  retryDelay: 5000,
  batchNotifications: true,
  filterDuplicates: true
};
```

## Logging Configuration

Control the library's logging behavior for debugging and monitoring.

### LoggingConfig Interface

```typescript
interface LoggingConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  destination?: 'console' | string;    // 'console' or file path
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeModule?: boolean;
  maxFileSize?: string;                // Maximum log file size
  maxFiles?: number;                   // Maximum number of log files to keep
  format?: 'json' | 'text';          // Log format
}
```

### Logging Examples

#### Development Logging
```typescript
const loggingConfig: LoggingConfig = {
  level: 'debug',
  destination: 'console',
  includeTimestamp: true,
  includeLevel: true,
  includeModule: true,
  format: 'text'
};
```

#### Production Logging
```typescript
const loggingConfig: LoggingConfig = {
  level: 'info',
  destination: '/var/log/cryptopaygw/app.log',
  includeTimestamp: true,
  includeLevel: true,
  includeModule: true,
  maxFileSize: '100MB',
  maxFiles: 5,
  format: 'json'
};
```

## Complete Examples

### Minimal Configuration
```typescript
import { CryptoPaymentGW } from '@cryptopaygw/core';

const minimalConfig: CryptoPaymentConfig = {
  chains: [{
    name: 'ethereum',
    adapter: '@cryptopaygw/evm-adapter',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY'
  }]
};

const gateway = new CryptoPaymentGW(minimalConfig);
```

### Development Configuration
```typescript
const developmentConfig: CryptoPaymentConfig = {
  mode: 'lightweight',
  chains: [{
    name: 'ethereum',
    adapter: '@cryptopaygw/evm-adapter',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
    options: {
      gasPrice: 'auto',
      confirmations: 1
    }
  }],
  encryption: {
    key: process.env.CRYPTO_GW_ENCRYPTION_KEY!,
    algorithm: 'aes-256-gcm'
  },
  monitoring: {
    pollingInterval: 10000,
    batchSize: 10,
    useWebSockets: false
  },
  logging: {
    level: 'debug',
    destination: 'console',
    format: 'text'
  }
};
```

### Production Configuration
```typescript
const productionConfig: CryptoPaymentConfig = {
  mode: 'enterprise',
  chains: [
    {
      name: 'ethereum',
      adapter: '@cryptopaygw/evm-adapter',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
      wsUrl: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY',
      options: {
        gasPrice: 'auto',
        confirmations: 12,
        timeout: 30000,
        rateLimitRpm: 3000
      }
    },
    {
      name: 'bsc',
      adapter: '@cryptopaygw/evm-adapter',
      rpcUrl: 'https://bsc-dataseed1.binance.org',
      options: {
        gasPrice: '5000000000',
        confirmations: 3,
        rateLimitRpm: 2000
      }
    },
    {
      name: 'bitcoin',
      adapter: '@cryptopaygw/utxo-adapter',
      rpcUrl: process.env.BITCOIN_RPC_URL!,
      options: {
        confirmations: 6,
        timeout: 60000
      }
    }
  ],
  encryption: {
    key: process.env.CRYPTO_GW_MASTER_KEY!,
    algorithm: 'aes-256-gcm',
    keyDerivation: {
      iterations: 150000,
      salt: process.env.CRYPTO_GW_SALT
    }
  },
  monitoring: {
    pollingInterval: 5000,
    batchSize: 100,
    maxRetries: 5,
    timeout: 30000,
    useWebSockets: true,
    fallbackToPolling: true,
    blockRange: 100,
    maxConcurrentRequests: 25
  },
  performance: {
    maxConcurrentChains: 10,
    walletsPerBatch: 500,
    connectionPoolSize: 30,
    workerThreads: 8,
    maxMemoryUsage: '4GB',
    rateLimitRpm: 10000,
    cacheSize: 20000
  },
  treasury: {
    defaultType: 'multisig',
    gasOptimization: true,
    batchTransactions: true,
    approvalThreshold: 3,
    maxSigners: 7,
    emergencyPause: true
  },
  notifications: {
    strategies: ['websocket', 'events'],
    fallback: 'events',
    queueSize: 50000,
    retryAttempts: 5,
    retryDelay: 3000,
    batchNotifications: true,
    filterDuplicates: true
  },
  logging: {
    level: 'info',
    destination: '/var/log/cryptopaygw/app.log',
    includeTimestamp: true,
    includeLevel: true,
    includeModule: true,
    maxFileSize: '500MB',
    maxFiles: 10,
    format: 'json'
  }
};
```

## Best Practices

### Security Best Practices

1. **Environment Variables:** Store all sensitive configuration in environment variables
2. **Key Rotation:** Regularly rotate encryption keys
3. **Network Security:** Use HTTPS/WSS endpoints only
4. **Access Control:** Implement proper access controls for configuration files

### Performance Best Practices

1. **Resource Monitoring:** Monitor memory and CPU usage in production
2. **Connection Limits:** Respect API provider rate limits
3. **Batch Operations:** Use batching for better efficiency
4. **Caching Strategy:** Implement appropriate caching for frequently accessed data

### Operational Best Practices

1. **Configuration Validation:** Validate configuration on startup
2. **Graceful Degradation:** Configure fallback mechanisms
3. **Monitoring & Alerts:** Set up monitoring for all critical components
4. **Documentation:** Document all custom configuration choices

### Error Handling Best Practices

1. **Retry Logic:** Implement exponential backoff for retries
2. **Circuit Breakers:** Use circuit breakers for external service calls
3. **Logging:** Comprehensive logging for troubleshooting
4. **Health Checks:** Implement health check endpoints

## Configuration Validation

The library automatically validates configuration on initialization and provides detailed error messages for invalid configurations:

```typescript
try {
  const gateway = new CryptoPaymentGW(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
    console.error('Invalid fields:', error.invalidFields);
  }
}
```

Common validation errors:
- Missing required fields (chains array cannot be empty)
- Invalid URLs (must be valid HTTP/HTTPS/WS/WSS URLs)  
- Invalid encryption key length
- Performance settings exceeding system limits
- Invalid chain adapter package names

This comprehensive configuration system provides the flexibility needed to run the Crypto Payment Gateway in any environment, from simple development setups to large-scale production deployments.
