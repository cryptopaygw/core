import type {
  ICryptoPaymentGW,
  GatewayStatus,
  GatewayInitOptions,
  ChainRegistrationInfo
} from '../../src/core/interfaces';
import type { CryptoPaymentConfig } from '../../src/core/types';
import type { ISeedGenerator } from '../../src/crypto/interfaces';
import type { IWalletFactory } from '../../src/wallet/interfaces';
import type { IChainAdapter } from '../../src/core/interfaces';

/**
 * Mock implementation of CryptoPaymentGW for testing
 * This will be replaced with the real implementation once created
 */
class MockCryptoPaymentGW implements ICryptoPaymentGW {
  private initialized = false;
  private readonly config: CryptoPaymentConfig;
  private readonly chainAdapters = new Map<string, IChainAdapter>();
  private readonly chainRegistrations = new Map<string, ChainRegistrationInfo>();
  private readonly startTime = Date.now();

  constructor(config: CryptoPaymentConfig) {
    this.config = config;
    
    // Initialize chain registrations from config
    if (Array.isArray(this.config.chains)) {
      this.config.chains.forEach(chainConfig => {
        this.chainRegistrations.set(chainConfig.name, {
          chainName: chainConfig.name,
          chainType: 'evm', // Mock chain type
          adapterPath: chainConfig.adapter,
          isActive: false,
          lastHealthCheck: null
        });
      });
    }
  }

  async initialize(options?: GatewayInitOptions): Promise<void> {
    if (this.initialized) {
      throw new Error('Gateway is already initialized');
    }

    // Simulate initialization process
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (options?.validateChains !== false) {
      const isValid = await this.validateConfiguration();
      if (!isValid) {
        throw new Error('Configuration validation failed');
      }
    }

    this.initialized = true;
  }

  async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Clean up resources
    this.chainAdapters.clear();
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getStatus(): GatewayStatus {
    return {
      isInitialized: this.initialized,
      supportedChains: Array.from(this.chainRegistrations.keys()),
      activeAdapters: Array.from(this.chainAdapters.keys()),
      version: '1.0.0',
      uptime: Date.now() - this.startTime
    };
  }

  async validateConfiguration(): Promise<boolean> {
    // Mock validation - check if chains config exists
    return Array.isArray(this.config.chains) && this.config.chains.length > 0;
  }

  async performHealthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const chainName of this.chainRegistrations.keys()) {
      // Mock health check - return true for test chains
      results.set(chainName, chainName.includes('test') || chainName === 'ethereum');
    }
    
    return results;
  }

  getSupportedChains(): string[] {
    return Array.from(this.chainRegistrations.keys());
  }

  isChainSupported(chainName: string): boolean {
    return this.chainRegistrations.has(chainName);
  }

  async getChainAdapter(chainName: string): Promise<IChainAdapter> {
    if (!this.isChainSupported(chainName)) {
      throw new Error(`Chain '${chainName}' is not supported`);
    }

    if (!this.initialized) {
      throw new Error('Gateway is not initialized');
    }

    // Return cached adapter if exists
    if (this.chainAdapters.has(chainName)) {
      return this.chainAdapters.get(chainName)!;
    }

    // Create new mock adapter
    const mockAdapter: IChainAdapter = {
      chainName,
      chainId: 1,
      nativeToken: 'ETH',
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getConnectionStatus: jest.fn().mockResolvedValue({
        connected: true,
        latency: 100,
        blockHeight: 1000000,
        syncing: false
      }),
      generateAddress: jest.fn().mockResolvedValue({
        address: '0x123',
        privateKey: '0xabc',
        publicKey: '0xdef'
      }),
      validateAddress: jest.fn().mockResolvedValue(true),
      deriveAddresses: jest.fn().mockResolvedValue([]),
      getBalance: jest.fn().mockResolvedValue({
        address: '0x123',
        balance: '1000000000000000000',
        confirmed: '1000000000000000000',
        blockHeight: 1000000
      }),
      getBalances: jest.fn().mockResolvedValue([]),
      getTokenBalance: jest.fn().mockResolvedValue({
        tokenAddress: '0x456',
        tokenSymbol: 'MOCK',
        tokenDecimals: 18,
        balance: '500000000000000000',
        balanceFormatted: '0.5'
      }),
      getTokenBalances: jest.fn().mockResolvedValue([]),
      createTransaction: jest.fn().mockResolvedValue({
        chainId: 1,
        from: '0x123',
        to: '0x456',
        amount: '1000000000000000000',
        fee: '21000000000000000'
      }),
      signTransaction: jest.fn().mockResolvedValue({
        chainId: 1,
        from: '0x123',
        to: '0x456',
        amount: '1000000000000000000',
        fee: '21000000000000000',
        signature: '0xsig',
        signedRawTransaction: '0xsigned'
      }),
      broadcastTransaction: jest.fn().mockResolvedValue('0x123456789'),
      getTransaction: jest.fn().mockResolvedValue(null),
      getTransactionStatus: jest.fn().mockResolvedValue({
        hash: '0x123',
        status: 'confirmed',
        confirmations: 12
      }),
      getTransactionHistory: jest.fn().mockResolvedValue([]),
      subscribeToAddress: jest.fn().mockResolvedValue('sub123'),
      unsubscribeFromAddress: jest.fn().mockResolvedValue(undefined),
      getLatestBlock: jest.fn().mockResolvedValue({
        number: 1000000,
        hash: '0xblock',
        timestamp: new Date(),
        transactionCount: 100,
        parentHash: '0xparent'
      }),
      getBlockByNumber: jest.fn().mockResolvedValue({
        number: 1000000,
        hash: '0xblock',
        timestamp: new Date(),
        transactionCount: 100,
        parentHash: '0xparent'
      }),
      estimateFee: jest.fn().mockResolvedValue({
        low: '1000000000',
        medium: '2000000000',
        high: '3000000000',
        totalFee: '21000000000000000'
      }),
      getCurrentFeeRates: jest.fn().mockResolvedValue({
        slow: 10,
        standard: 20,
        fast: 30,
        instant: 40,
        unit: 'gwei'
      }),
      batchGetBalances: jest.fn().mockResolvedValue({
        results: [],
        errors: []
      }),
      batchCreateTransactions: jest.fn().mockResolvedValue([]),
      validateTransactionRequest: jest.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      }),
      getChainParameters: jest.fn().mockReturnValue({
        chainType: 'evm',
        nativeTokenDecimals: 18,
        averageBlockTime: 12000,
        confirmationThreshold: 12,
        addressFormat: 'ethereum',
        supportedFeatures: ['smart_contracts', 'tokens']
      }),
      healthCheck: jest.fn().mockResolvedValue({
        healthy: true,
        latency: 100,
        lastBlockTime: new Date(),
        syncStatus: 'synced',
        issues: []
      })
    };

    this.chainAdapters.set(chainName, mockAdapter);
    return mockAdapter;
  }

  createSeedGenerator(): ISeedGenerator {
    // Return mock seed generator
    return {
      generateSeed: jest.fn().mockResolvedValue({
        mnemonic: 'test test test test test test test test test test test junk',
        entropy: 'mock-entropy',
        seed: 'mock-seed',
        strength: 128,
        language: 'english',
        hasPassphrase: false,
        createdAt: new Date()
      }),
      validateSeed: jest.fn().mockResolvedValue(true),
      encryptSeed: jest.fn().mockResolvedValue('encrypted-seed'),
      decryptSeed: jest.fn().mockResolvedValue('decrypted-seed'),
      generateEntropy: jest.fn().mockResolvedValue(Buffer.from('mock-entropy', 'hex')),
      entropyToMnemonic: jest.fn().mockResolvedValue('test test test test test test test test test test test junk'),
      mnemonicToSeed: jest.fn().mockResolvedValue(Buffer.from('mock-seed', 'hex'))
    } as ISeedGenerator;
  }

  async getWalletFactory(chainName: string): Promise<IWalletFactory> {
    await this.getChainAdapter(chainName);
    // Return mock wallet factory with required properties
    const mockFactory: IWalletFactory = {
      chainName,
      chainType: 'evm',
      networkId: 1,
      createWallet: jest.fn().mockResolvedValue({
        address: '0x123',
        privateKey: '0xabc',
        publicKey: '0xdef',
        derivationPath: "m/44'/60'/0'/0/0",
        addressIndex: 0,
        chainName,
        chainType: 'evm',
        networkId: 1,
        hasPassphrase: false,
        createdAt: new Date()
      }),
      importWallet: jest.fn().mockResolvedValue({
        address: '0x456',
        privateKey: '0x789',
        publicKey: '0xghi',
        derivationPath: "m/44'/60'/0'/0/0",
        addressIndex: 0,
        chainName,
        chainType: 'evm',
        networkId: 1,
        hasPassphrase: false,
        createdAt: new Date()
      }),
      validateWallet: jest.fn().mockResolvedValue({
        valid: true,
        checks: {
          addressFormat: true,
          privateKeyFormat: true,
          publicKeyMatch: true,
          derivationPathValid: true,
          chainCompatibility: true
        },
        errors: [],
        warnings: []
      }),
      createWallets: jest.fn().mockResolvedValue([]),
      deriveAddresses: jest.fn().mockResolvedValue([]),
      generateAddressAtIndex: jest.fn().mockResolvedValue({
        address: '0x789',
        privateKey: '0x321',
        publicKey: '0x654',
        derivationPath: "m/44'/60'/0'/0/1",
        index: 1
      }),
      getDefaultOptions: jest.fn().mockReturnValue({
        seed: '',
        addressIndex: 0
      }),
      validateSeed: jest.fn().mockResolvedValue(true),
      getSupportedFeatures: jest.fn().mockReturnValue(['hd_wallets', 'batch_creation'])
    };
    
    return mockFactory;
  }

  async registerChain(chainName: string, adapterPath: string): Promise<void> {
    if (this.chainRegistrations.has(chainName)) {
      throw new Error(`Chain '${chainName}' is already registered`);
    }

    this.chainRegistrations.set(chainName, {
      chainName,
      chainType: 'unknown',
      adapterPath,
      isActive: false,
      lastHealthCheck: null
    });
  }

  async unregisterChain(chainName: string): Promise<void> {
    if (!this.chainRegistrations.has(chainName)) {
      throw new Error(`Chain '${chainName}' is not registered`);
    }

    this.chainRegistrations.delete(chainName);
    this.chainAdapters.delete(chainName);
  }

  getChainRegistrations(): ChainRegistrationInfo[] {
    return Array.from(this.chainRegistrations.values());
  }

  getConfiguration(): Readonly<CryptoPaymentConfig> {
    return Object.freeze({ ...this.config });
  }

  async updateChainConfig(chainName: string, config: Record<string, unknown>): Promise<void> {
    if (!this.isChainSupported(chainName)) {
      throw new Error(`Chain '${chainName}' is not supported`);
    }

    // Update config (mock implementation for array-based structure)
    const chainConfig = this.config.chains.find(c => c.name === chainName);
    if (chainConfig && chainConfig.options) {
      Object.assign(chainConfig.options, config);
    }
  }
}

describe('CryptoPaymentGW', () => {
  let mockConfig: CryptoPaymentConfig;
  let gateway: ICryptoPaymentGW;

  beforeEach(() => {
    mockConfig = {
      chains: [
        {
          name: 'ethereum',
          adapter: '@cryptopaygw/evm-adapter',
          rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/test',
          options: {
            confirmations: 12,
            gasPrice: 'auto'
          }
        },
        {
          name: 'bitcoin', 
          adapter: '@cryptopaygw/utxo-adapter',
          rpcUrl: 'https://blockstream.info/api',
          options: {
            confirmations: 6
          }
        }
      ],
      encryption: {
        key: 'test-key-32-characters-long!!!',
        algorithm: 'aes-256-gcm'
      },
      monitoring: {
        pollingInterval: 30000,
        maxRetries: 3,
        timeout: 5000
      }
    };

    gateway = new MockCryptoPaymentGW(mockConfig);
  });

  afterEach(async () => {
    if (gateway.isInitialized()) {
      await gateway.dispose();
    }
  });

  describe('Constructor and Basic Properties', () => {
    test('should create gateway instance with valid configuration', () => {
      expect(gateway).toBeDefined();
      expect(gateway.isInitialized()).toBe(false);
    });

    test('should provide configuration access', () => {
      const config = gateway.getConfiguration();
      expect(config).toEqual(mockConfig);
      expect(config.chains.find(c => c.name === 'ethereum')).toBeDefined();
      expect(config.chains.find(c => c.name === 'bitcoin')).toBeDefined();
    });

    test('should return frozen configuration object', () => {
      const config = gateway.getConfiguration();
      expect(Object.isFrozen(config)).toBe(true);
    });

    test('should have chains from configuration available', () => {
      const supportedChains = gateway.getSupportedChains();
      expect(supportedChains).toContain('ethereum');
      expect(supportedChains).toContain('bitcoin');
      expect(supportedChains).toHaveLength(2);
    });
  });

  describe('Lifecycle Management', () => {
    test('should initialize successfully with default options', async () => {
      expect(gateway.isInitialized()).toBe(false);
      
      await gateway.initialize();
      
      expect(gateway.isInitialized()).toBe(true);
    });

    test('should initialize with custom options', async () => {
      const options: GatewayInitOptions = {
        validateChains: true,
        performHealthChecks: false,
        timeout: 5000
      };

      await gateway.initialize(options);
      
      expect(gateway.isInitialized()).toBe(true);
    });

    test('should validate configuration during initialization', async () => {
      await gateway.initialize({ validateChains: true });
      expect(gateway.isInitialized()).toBe(true);
    });

    test('should skip validation when requested', async () => {
      await gateway.initialize({ validateChains: false });
      expect(gateway.isInitialized()).toBe(true);
    });

    test('should throw error when initializing already initialized gateway', async () => {
      await gateway.initialize();
      
      await expect(gateway.initialize()).rejects.toThrow(
        'Gateway is already initialized'
      );
    });

    test('should dispose successfully', async () => {
      await gateway.initialize();
      expect(gateway.isInitialized()).toBe(true);
      
      await gateway.dispose();
      expect(gateway.isInitialized()).toBe(false);
    });

    test('should handle dispose when not initialized', async () => {
      expect(gateway.isInitialized()).toBe(false);
      
      await expect(gateway.dispose()).resolves.toBeUndefined();
      expect(gateway.isInitialized()).toBe(false);
    });
  });

  describe('Status and Health Monitoring', () => {
    test('should provide correct status when not initialized', () => {
      const status = gateway.getStatus();
      
      expect(status.isInitialized).toBe(false);
      expect(status.supportedChains).toContain('ethereum');
      expect(status.supportedChains).toContain('bitcoin');
      expect(status.activeAdapters).toHaveLength(0);
      expect(status.version).toBe('1.0.0');
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should provide correct status when initialized', async () => {
      await gateway.initialize();
      const status = gateway.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.supportedChains).toHaveLength(2);
    });

    test('should validate configuration successfully', async () => {
      const isValid = await gateway.validateConfiguration();
      expect(isValid).toBe(true);
    });

    test('should perform health checks on all chains', async () => {
      const healthResults = await gateway.performHealthCheck();
      
      expect(healthResults.size).toBe(2);
      expect(healthResults.has('ethereum')).toBe(true);
      expect(healthResults.has('bitcoin')).toBe(true);
      expect(healthResults.get('ethereum')).toBe(true);
    });
  });

  describe('Chain Management', () => {
    test('should return supported chains', () => {
      const chains = gateway.getSupportedChains();
      expect(chains).toEqual(['ethereum', 'bitcoin']);
    });

    test('should check if chain is supported', () => {
      expect(gateway.isChainSupported('ethereum')).toBe(true);
      expect(gateway.isChainSupported('bitcoin')).toBe(true);
      expect(gateway.isChainSupported('unsupported')).toBe(false);
    });

    test('should get chain adapter for supported chain', async () => {
      await gateway.initialize();
      
      const ethAdapter = await gateway.getChainAdapter('ethereum');
      expect(ethAdapter).toBeDefined();
      expect(ethAdapter.chainName).toBe('ethereum');
    });

    test('should throw error for unsupported chain adapter', async () => {
      await gateway.initialize();
      
      await expect(gateway.getChainAdapter('unsupported')).rejects.toThrow(
        "Chain 'unsupported' is not supported"
      );
    });

    test('should throw error when getting adapter before initialization', async () => {
      await expect(gateway.getChainAdapter('ethereum')).rejects.toThrow(
        'Gateway is not initialized'
      );
    });

    test('should register new chain', async () => {
      const chainName = 'polygon';
      const adapterPath = '@cryptopaygw/polygon-adapter';
      
      expect(gateway.isChainSupported(chainName)).toBe(false);
      
      await gateway.registerChain(chainName, adapterPath);
      
      expect(gateway.isChainSupported(chainName)).toBe(true);
    });

    test('should throw error when registering existing chain', async () => {
      await expect(gateway.registerChain('ethereum', 'some-path')).rejects.toThrow(
        "Chain 'ethereum' is already registered"
      );
    });

    test('should unregister existing chain', async () => {
      expect(gateway.isChainSupported('ethereum')).toBe(true);
      
      await gateway.unregisterChain('ethereum');
      
      expect(gateway.isChainSupported('ethereum')).toBe(false);
    });

    test('should throw error when unregistering non-existing chain', async () => {
      await expect(gateway.unregisterChain('nonexistent')).rejects.toThrow(
        "Chain 'nonexistent' is not registered"
      );
    });

    test('should get chain registrations', () => {
      const registrations = gateway.getChainRegistrations();
      
      expect(registrations).toHaveLength(2);
      expect(registrations.find(r => r.chainName === 'ethereum')).toBeDefined();
      expect(registrations.find(r => r.chainName === 'bitcoin')).toBeDefined();
    });
  });

  describe('Factory Access Methods', () => {
    test('should create seed generator', () => {
      const seedGenerator = gateway.createSeedGenerator();
      
      expect(seedGenerator).toBeDefined();
      expect(seedGenerator.generateSeed).toBeDefined();
      expect(seedGenerator.validateSeed).toBeDefined();
    });

    test('should get wallet factory for supported chain', async () => {
      await gateway.initialize();
      
      const walletFactory = await gateway.getWalletFactory('ethereum');
      
      expect(walletFactory).toBeDefined();
    });

    test('should throw error for wallet factory of unsupported chain', async () => {
      await gateway.initialize();
      
      await expect(gateway.getWalletFactory('unsupported')).rejects.toThrow(
        "Chain 'unsupported' is not supported"
      );
    });

    test('should create multiple seed generators', () => {
      const seedGen1 = gateway.createSeedGenerator();
      const seedGen2 = gateway.createSeedGenerator();
      
      expect(seedGen1).toBeDefined();
      expect(seedGen2).toBeDefined();
      // Should be different instances
      expect(seedGen1).not.toBe(seedGen2);
    });

    test('should get wallet factories for multiple chains', async () => {
      await gateway.initialize();
      
      const ethFactory = await gateway.getWalletFactory('ethereum');
      const btcFactory = await gateway.getWalletFactory('bitcoin');
      
      expect(ethFactory).toBeDefined();
      expect(btcFactory).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    test('should update chain configuration', async () => {
      const newConfig = { confirmations: 15 };
      
      await gateway.updateChainConfig('ethereum', newConfig);
      
      const config = gateway.getConfiguration();
      const ethChain = config.chains.find(c => c.name === 'ethereum');
      expect(ethChain?.options?.confirmations).toBe(15);
    });

    test('should throw error when updating unsupported chain config', async () => {
      await expect(
        gateway.updateChainConfig('unsupported', { test: true })
      ).rejects.toThrow("Chain 'unsupported' is not supported");
    });

    test('should preserve other chain configurations when updating', async () => {
      const originalBtcConfig = { ...gateway.getConfiguration().chains.find(c => c.name === 'bitcoin') };
      
      await gateway.updateChainConfig('ethereum', { gasMultiplier: 2.0 });
      
      const config = gateway.getConfiguration();
      const currentBtcConfig = config.chains.find(c => c.name === 'bitcoin');
      expect(currentBtcConfig).toEqual(originalBtcConfig);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete workflow: initialize -> create wallet -> dispose', async () => {
      // Initialize gateway
      await gateway.initialize();
      expect(gateway.isInitialized()).toBe(true);
      
      // Create seed generator
      const seedGenerator = gateway.createSeedGenerator();
      expect(seedGenerator).toBeDefined();
      
      // Get wallet factory
      const walletFactory = await gateway.getWalletFactory('ethereum');
      expect(walletFactory).toBeDefined();
      
      // Dispose gateway
      await gateway.dispose();
      expect(gateway.isInitialized()).toBe(false);
    });

    test('should handle multiple chain operations', async () => {
      await gateway.initialize();
      
      // Get adapters for different chains
      const ethAdapter = await gateway.getChainAdapter('ethereum');
      const btcAdapter = await gateway.getChainAdapter('bitcoin');
      
      expect(ethAdapter.chainName).toBe('ethereum');
      expect(btcAdapter.chainName).toBe('bitcoin');
      
      // Get wallet factories for different chains
      const ethFactory = await gateway.getWalletFactory('ethereum');
      const btcFactory = await gateway.getWalletFactory('bitcoin');
      
      expect(ethFactory).toBeDefined();
      expect(btcFactory).toBeDefined();
    });

    test('should handle chain registration and usage', async () => {
      await gateway.initialize();
      
      // Register new chain
      await gateway.registerChain('polygon', '@cryptopaygw/polygon-adapter');
      expect(gateway.isChainSupported('polygon')).toBe(true);
      
      // Update its configuration
      await gateway.updateChainConfig('polygon', { gasMultiplier: 1.1 });
      
      // Should be in supported chains
      const supportedChains = gateway.getSupportedChains();
      expect(supportedChains).toContain('polygon');
    });

    test('should maintain status consistency throughout lifecycle', async () => {
      // Initial status
      let status = gateway.getStatus();
      expect(status.isInitialized).toBe(false);
      expect(status.activeAdapters).toHaveLength(0);
      
      // After initialization
      await gateway.initialize();
      status = gateway.getStatus();
      expect(status.isInitialized).toBe(true);
      
      // After using adapters
      await gateway.getChainAdapter('ethereum');
      await gateway.getChainAdapter('bitcoin');
      status = gateway.getStatus();
      expect(status.activeAdapters).toHaveLength(2);
      
      // After disposal
      await gateway.dispose();
      status = gateway.getStatus();
      expect(status.isInitialized).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid configuration gracefully', () => {
      const invalidConfig = { chains: {} } as CryptoPaymentConfig;
      const invalidGateway = new MockCryptoPaymentGW(invalidConfig);
      
      expect(invalidGateway.getSupportedChains()).toHaveLength(0);
    });

    test('should handle initialization failure', async () => {
      // Create gateway with invalid config that will fail validation
      const invalidConfig = { chains: {} } as CryptoPaymentConfig;
      const invalidGateway = new MockCryptoPaymentGW(invalidConfig);
      
      await expect(invalidGateway.initialize()).rejects.toThrow(
        'Configuration validation failed'
      );
    });

    test('should handle multiple initialization attempts', async () => {
      await gateway.initialize();
      
      // Second initialization should fail
      await expect(gateway.initialize()).rejects.toThrow(
        'Gateway is already initialized'
      );
      
      // Gateway should still be initialized
      expect(gateway.isInitialized()).toBe(true);
    });

    test('should handle operations before initialization', async () => {
      // Should work without initialization
      expect(gateway.getSupportedChains()).toHaveLength(2);
      expect(gateway.isChainSupported('ethereum')).toBe(true);
      expect(gateway.createSeedGenerator()).toBeDefined();
      
      // Should fail before initialization
      await expect(gateway.getChainAdapter('ethereum')).rejects.toThrow(
        'Gateway is not initialized'
      );
    });

    test('should handle chain operations with empty chain list', async () => {
      const emptyConfig = { chains: {} } as CryptoPaymentConfig;
      const emptyGateway = new MockCryptoPaymentGW(emptyConfig);
      
      expect(emptyGateway.getSupportedChains()).toHaveLength(0);
      expect(emptyGateway.isChainSupported('ethereum')).toBe(false);
      expect(emptyGateway.getChainRegistrations()).toHaveLength(0);
    });
  });

  describe('Performance and Resource Management', () => {
    test('should track uptime correctly', async () => {
      const status1 = gateway.getStatus();
      const uptime1 = status1.uptime;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const status2 = gateway.getStatus();
      const uptime2 = status2.uptime;
      
      expect(uptime2).toBeGreaterThan(uptime1);
    });

    test('should handle multiple adapter requests efficiently', async () => {
      await gateway.initialize();
      
      // Request same adapter multiple times
      const adapter1 = await gateway.getChainAdapter('ethereum');
      const adapter2 = await gateway.getChainAdapter('ethereum');
      
      // Should return the same instance (caching)
      expect(adapter1).toBe(adapter2);
    });

    test('should clean up resources on disposal', async () => {
      await gateway.initialize();
      
      // Create some adapters
      await gateway.getChainAdapter('ethereum');
      await gateway.getChainAdapter('bitcoin');
      
      let status = gateway.getStatus();
      expect(status.activeAdapters).toHaveLength(2);
      
      // Dispose should clean up
      await gateway.dispose();
      
      status = gateway.getStatus();
      expect(status.isInitialized).toBe(false);
      expect(status.activeAdapters).toHaveLength(0);
    });
  });
});
