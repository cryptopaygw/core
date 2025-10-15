# Crypto Payment Gateway

A modular, scalable Node.js library for cryptocurrency payment operations supporting enterprise-scale deployments while maintaining simplicity for basic use cases.

## Features

### Core Functionality
- **Wallet Monitoring**: Track transactions for native tokens and custom tokens across multiple blockchain networks
- **Seed Generation**: Create encrypted or unencrypted seed phrases with configurable encryption
- **Wallet Creation**: Generate wallets from seeds with automatic decryption support
- **Treasury Management**: Advanced multi-signature and governance patterns for fund management
- **Payment Processing**: Automated deposit detection and withdrawal management

### Architecture Highlights
- **Chain Agnostic**: Pluggable architecture supporting any blockchain via adapter pattern
- **High Performance**: Designed to handle hundreds of thousands of wallets across multiple chains and tokens
- **Flexible Usage**: Simple API for basic use cases, advanced features for enterprise deployments
- **Interface Driven**: SOLID principles with dependency injection and modular design
- **Backend Only**: Standalone library with no database or cache dependencies

## Installation

```bash
npm install @cryptopaygw/core
```

## Quick Start

### Simple Wallet Monitoring
```typescript
import { CryptoPaymentGW } from '@cryptopaygw/core';

const gateway = new CryptoPaymentGW({
  chains: [{
    name: 'ethereum',
    adapter: '@cryptopaygw/evm-adapter',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY'
  }]
});

// Monitor single wallet for 10 minutes
const monitor = gateway.createSimpleMonitor();
const session = monitor.monitorWallet({
  address: '0x742d35cc621c0532925a3b8d6b9ddd67ec9e7649',
  chain: 'ethereum',
  token: 'USDT',
  duration: 10, // minutes
  callback: (tx) => console.log('New transaction:', tx)
});
```

### Seed and Wallet Management
```typescript
const gateway = new CryptoPaymentGW({
  chains: [{
    name: 'ethereum',
    adapter: '@cryptopaygw/evm-adapter',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY'
  }],
  encryption: {
    key: 'your-secret-encryption-key',
    algorithm: 'aes-256-gcm'
  }
});

// Generate encrypted seed
const seedGenerator = gateway.createSeedGenerator();
const encryptedSeed = await seedGenerator.generateSeed(true);

// Create wallet from seed
const walletFactory = gateway.createWalletFactory();
const wallet = await walletFactory.createWallet({
  seed: encryptedSeed,
  chain: 'ethereum',
  index: 0
});

console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### Historical Transaction Queries
```typescript
// Get transactions from specific date
const transactions = await monitor.getTransactions({
  address: '0x742d35cc621c0532925a3b8d6b9ddd67ec9e7649',
  chain: 'ethereum',
  fromDate: new Date('2023-10-01')
});
```

## Advanced Usage

### Enterprise Scale Configuration
```typescript
const gateway = new CryptoPaymentGW({
  mode: 'enterprise',
  chains: [
    { name: 'ethereum', adapter: '@cryptopaygw/evm-adapter' },
    { name: 'bitcoin', adapter: '@cryptopaygw/utxo-adapter' },
    { name: 'bsc', adapter: '@cryptopaygw/evm-adapter' }
  ],
  performance: {
    maxConcurrentChains: 10,
    walletsPerBatch: 100,
    connectionPoolSize: 20,
    workerThreads: 4
  }
});
```

### Treasury Management
```typescript
const treasuryManager = gateway.createTreasuryManager({
  type: 'multisig',
  threshold: 2,
  signers: ['0x...', '0x...', '0x...'],
  governance: {
    votingPeriod: 86400, // 24 hours
    executionDelay: 3600  // 1 hour
  }
});

// Deploy treasury contract
const treasury = await treasuryManager.deployTreasury({
  chain: 'ethereum',
  initialFunds: '1000000' // USDT
});
```

### External Integration
```typescript
// Use with existing Redis queue
const monitor = gateway.createMonitor({
  mode: 'lightweight',
  useInternalQueue: false
});

monitor.setQueueAdapter({
  enqueue: async (data) => await redis.lpush('crypto-tx', JSON.stringify(data)),
  dequeue: async () => JSON.parse(await redis.rpop('crypto-tx')),
  getQueueSize: async () => await redis.llen('crypto-tx')
});
```

## Chain Adapters

The library uses a plugin architecture for blockchain support. Each chain requires its own adapter:

```bash
# Install chain adapters as needed
npm install @cryptopaygw/evm-adapter
npm install @cryptopaygw/utxo-adapter
```

### Supported Chains
- EVM-compatible chains (Ethereum, BSC, Polygon, Avalanche, etc.)
- Bitcoin and Bitcoin-like chains
- Custom adapters via `IChainAdapter` interface

## Configuration

### Complete Configuration
```typescript
const gateway = new CryptoPaymentGW({
  // Operating mode
  mode: 'lightweight' | 'enterprise',
  
  // Chain configurations
  chains: [
    {
      name: 'ethereum',
      adapter: '@cryptopaygw/evm-adapter',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
      wsUrl: 'wss://mainnet.infura.io/ws/v3/YOUR_KEY', // optional
      options: {
        gasPrice: 'auto',
        confirmations: 6
      }
    }
  ],
  
  // Encryption settings
  encryption: {
    key: 'your-secret-encryption-key',
    algorithm: 'aes-256-gcm', // or 'aes-256-cbc'
    keyDerivation: {
      iterations: 100000,
      salt: 'custom-salt' // optional
    }
  },
  
  // Monitoring configuration
  monitoring: {
    pollingInterval: 5000,        // ms between checks
    batchSize: 100,               // addresses per batch
    maxRetries: 3,                // failed request retries
    timeout: 30000,               // request timeout ms
    useWebSockets: true,          // prefer ws over polling
    fallbackToPolling: true       // fallback if ws fails
  },
  
  // Performance settings
  performance: {
    maxConcurrentChains: 10,
    walletsPerBatch: 100,
    connectionPoolSize: 20,
    workerThreads: 4,
    maxMemoryUsage: '512MB',
    rateLimitRpm: 1000
  },
  
  // Treasury management
  treasury: {
    defaultType: 'multisig',
    gasOptimization: true,
    batchTransactions: true
  },
  
  // Notification strategies
  notifications: {
    strategies: ['callback', 'events'],
    fallback: 'polling',
    queueSize: 10000,
    retryAttempts: 3
  },
  
  // Logging configuration
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    destination: 'console', // or file path
    includeTimestamp: true,
    includeLevel: true
  }
});
```

### Basic Configuration Interface
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

interface ChainConfig {
  name: string;
  adapter: string;
  rpcUrl: string;
  wsUrl?: string;
  options?: {
    gasPrice?: 'auto' | string;
    confirmations?: number;
    timeout?: number;
  };
}

interface EncryptionConfig {
  key: string;
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc';
  keyDerivation?: {
    iterations?: number;
    salt?: string;
  };
}

interface MonitoringConfig {
  pollingInterval?: number;
  batchSize?: number;
  maxRetries?: number;
  timeout?: number;
  useWebSockets?: boolean;
  fallbackToPolling?: boolean;
}

interface PerformanceConfig {
  maxConcurrentChains?: number;
  walletsPerBatch?: number;
  connectionPoolSize?: number;
  workerThreads?: number;
  maxMemoryUsage?: string;
  rateLimitRpm?: number;
}
```

## Notification Strategies

Multiple notification methods supported:

- **Callbacks**: Simple function callbacks
- **Events**: EventEmitter pattern
- **Polling**: Configurable interval checking
- **WebSockets**: Real-time connections where supported

```typescript
// Configure multiple notification strategies
const monitor = gateway.createMonitor({
  notifications: {
    strategies: ['callback', 'events', 'websocket'],
    fallback: 'polling'
  }
});
```

## Security Features

- **Encrypted Seed Storage**: Configurable encryption for seed phrases
- **Private Key Management**: Secure key handling with worker thread isolation
- **Multi-signature Support**: Advanced treasury security patterns
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive parameter validation

## Performance

### Scalability Targets
- **Wallets**: Hundreds of thousands of simultaneous monitoring
- **Chains**: Multiple blockchain networks
- **Tokens**: Multiple tokens per wallet
- **Throughput**: High-frequency transaction processing
- **Memory**: Configurable usage limits

### Optimization Features
- Connection pooling and reuse
- Batch processing for efficiency
- Worker threads for CPU-intensive operations
- Intelligent caching strategies
- Graceful degradation under load

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Run with coverage
npm run test:coverage
```

## Development

This project follows strict development principles:

- **TDD Methodology**: Test-driven development
- **SOLID Principles**: Clean architecture patterns
- **Interface Segregation**: Focused, minimal interfaces
- **Dependency Injection**: Pluggable components
- **Incremental Development**: Feature-by-feature implementation

## Contributing

1. Follow the established coding standards in `.clinerules/crypto-payment-gw-standards.md`
2. Write tests before implementation (TDD)
3. Ensure all SOLID principles are followed
4. Maintain chain-agnostic design patterns
5. Include performance considerations for scale

## License

MIT License

## Support

For questions, issues, or feature requests, please refer to the project documentation or create an issue in the repository.
