/**
 * EVM Chain Adapter Tests
 * Following TDD methodology - comprehensive test coverage
 */

import { EVMChainAdapter, EVMAdapterFactory, type EVMChainConfig } from './evm-chain-adapter';

// Inline interfaces for testing (to avoid import issues)
interface AddressGenerationOptions {
  privateKey?: string;
  seed?: string;
  derivationPath?: string;
  index?: number;
}

interface BalanceOptions {
  blockHeight?: number;
}

interface TransactionRequest {
  from: string;
  to: string;
  amount: string;
  tokenAddress?: string;
}

interface ConnectionStatus {
  connected: boolean;
  networkId?: string | number;
  blockHeight?: number;
  latency?: number;
}

interface ChainParameters {
  chainType: string;
  nativeTokenDecimals: number;
  averageBlockTime: number;
  confirmationThreshold: number;
  addressFormat: string;
  supportedFeatures: string[];
}

interface HealthStatus {
  healthy: boolean;
  latency: number;
  syncStatus: string;
  issues: string[];
}


describe('EVMChainAdapter', () => {
  let mockConfig: EVMChainConfig;
  let adapter: EVMChainAdapter;

  beforeEach(() => {
    mockConfig = {
      name: 'ethereum',
      chainId: 1,
      rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/test',
      wsUrl: 'wss://eth-mainnet.alchemyapi.io/v2/test',
      nativeTokenSymbol: 'ETH',
      nativeTokenDecimals: 18,
      blockTime: 12000,
      confirmations: 12
    };

    adapter = new EVMChainAdapter(mockConfig);
  });

  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
  });

  describe('Constructor and Configuration', () => {
    test('should create adapter with valid configuration', () => {
      expect(adapter).toBeInstanceOf(EVMChainAdapter);
      expect(adapter.chainName).toBe('ethereum');
      expect(adapter.chainId).toBe(1);
      expect(adapter.nativeToken).toBe('ETH');
    });

    test('should throw error with invalid configuration', () => {
      expect(() => new EVMChainAdapter({} as EVMChainConfig)).toThrow(
        'Invalid EVM chain configuration: name, chainId, rpcUrl, and nativeTokenSymbol are required'
      );
    });

    test('should throw error when missing required fields', () => {
      const invalidConfigs = [
        { chainId: 1, rpcUrl: 'test', nativeTokenSymbol: 'ETH' },
        { name: 'eth', rpcUrl: 'test', nativeTokenSymbol: 'ETH' },
        { name: 'eth', chainId: 1, nativeTokenSymbol: 'ETH' },
        { name: 'eth', chainId: 1, rpcUrl: 'test' }
      ];

      invalidConfigs.forEach(config => {
        expect(() => new EVMChainAdapter(config as unknown as EVMChainConfig)).toThrow();
      });
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully with valid RPC', async () => {
      expect(adapter.isConnected()).toBe(false);
      
      await adapter.connect();
      
      expect(adapter.isConnected()).toBe(true);
    });

    test('should handle connection with WebSocket URL', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
    });

    test('should disconnect successfully', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
      
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });

    test('should handle multiple connection attempts', async () => {
      await adapter.connect();
      await adapter.connect(); // Should not throw
      
      expect(adapter.isConnected()).toBe(true);
    });

    test('should handle disconnect when not connected', async () => {
      expect(adapter.isConnected()).toBe(false);
      await adapter.disconnect(); // Should not throw
    });

    test('should get connection status when connected', async () => {
      await adapter.connect();
      
      const status: ConnectionStatus = await adapter.getConnectionStatus();
      
      expect(status.connected).toBe(true);
      expect(status.networkId).toBe(1);
      expect(status.blockHeight).toBeGreaterThan(0);
      expect(typeof status.latency).toBe('number');
    });

    test('should get connection status when disconnected', async () => {
      const status = await adapter.getConnectionStatus();
      
      expect(status.connected).toBe(false);
      expect(status.latency).toBe(0);
      expect(status.blockHeight).toBe(0);
    });
  });

  describe('Address and Wallet Operations', () => {
    test('should generate address from private key', async () => {
      const options: AddressGenerationOptions = {
        privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234'
      };

      const wallet = await adapter.generateAddress(options);

      expect(wallet.address).toBe('0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6');
      expect(wallet.privateKey).toBe(options.privateKey);
      expect(wallet.derivationPath).toBe('direct');
    });

    test('should generate address from seed with default derivation', async () => {
      const options: AddressGenerationOptions = {
        seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        index: 0
      };

      const wallet = await adapter.generateAddress(options);

      expect(wallet.address).toBeTruthy();
      expect(wallet.privateKey).toBeTruthy();
      expect(wallet.derivationPath).toBe("m/44'/60'/0'/0/0");
      expect(wallet.index).toBe(0);
    });

    test('should generate address with custom derivation path', async () => {
      const options: AddressGenerationOptions = {
        seed: 'test test test test test test test test test test test junk',
        derivationPath: "m/44'/60'/1'/0",
        index: 5
      };

      const wallet = await adapter.generateAddress(options);

      expect(wallet.derivationPath).toBe("m/44'/60'/1'/0/5");
      expect(wallet.index).toBe(5);
    });

    test('should validate valid Ethereum addresses', async () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        '0x0000000000000000000000000000000000000000'
      ];

      for (const address of validAddresses) {
        const isValid = await adapter.validateAddress(address);
        expect(isValid).toBe(true);
      }
    });

    test('should reject invalid addresses', async () => {
      const invalidAddresses = [
        'invalid',
        '0x123',
        '742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        ''
      ];

      for (const address of invalidAddresses) {
        const isValid = await adapter.validateAddress(address);
        expect(isValid).toBe(false);
      }
    });

    test('should derive multiple addresses', async () => {
      const options = {
        seed: 'test test test test test test test test test test test junk',
        count: 5,
        startIndex: 0
      };

      const addresses = await adapter.deriveAddresses(options);

      expect(addresses).toHaveLength(5);
      addresses.forEach((wallet, i) => {
        expect(wallet.index).toBe(i);
        expect(wallet.derivationPath).toBe(`m/44'/60'/0'/0/${i}`);
        expect(wallet.address).toBeTruthy();
      });
    });

    test('should throw error when deriving addresses without seed', async () => {
      const options = {
        count: 5,
        startIndex: 0
      };

      await expect(adapter.deriveAddresses(options)).rejects.toThrow(
        'Seed is required for bulk address derivation'
      );
    });
  });

  describe('Balance Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('should get native token balance', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6';
      
      const balance = await adapter.getBalance(address);
      
      expect(balance.address).toBe(address);
      expect(balance.balance).toBe('1000000000000000000'); // 1 ETH in wei
      expect(balance.confirmed).toBe(balance.balance);
      expect(balance.unconfirmed).toBe('0');
      expect(balance.blockHeight).toBeGreaterThan(0);
    });

    test('should get balance with specific block height', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6';
      const options: BalanceOptions = { blockHeight: 1000000 };
      
      const balance = await adapter.getBalance(address, options);
      
      expect(balance.address).toBe(address);
      expect(balance.balance).toBeTruthy();
    });

    test('should throw error for invalid address format', async () => {
      await expect(adapter.getBalance('invalid-address')).rejects.toThrow(
        'Invalid address format'
      );
    });

    test('should throw error when not connected', async () => {
      await adapter.disconnect();
      
      await expect(adapter.getBalance('0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6')).rejects.toThrow(
        'Provider not connected'
      );
    });

    test('should get balances for multiple addresses', async () => {
      const addresses = [
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        '0x0000000000000000000000000000000000000000'
      ];

      const results = await adapter.getBalances(addresses);

      expect(results).toHaveLength(2);
      results.forEach((result, i) => {
        expect(result.address).toBe(addresses[i]);
        expect(result.balance).toBeTruthy();
      });
    });

    test('should get token balance', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6';
      const tokenAddress = '0xA0b86a33E6441e1A51E0c6b0E8ba07A6fb5B89F0';

      const tokenBalance = await adapter.getTokenBalance(address, tokenAddress);

      expect(tokenBalance.tokenAddress).toBe(tokenAddress);
      expect(tokenBalance.tokenSymbol).toBe('USDC');
      expect(tokenBalance.tokenDecimals).toBe(18);
      expect(tokenBalance.balance).toBe('500000000000000000');
      expect(tokenBalance.balanceFormatted).toBe('0.5');
    });

    test('should get multiple token balances', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6';
      const tokenAddresses = [
        '0xA0b86a33E6441e1A51E0c6b0E8ba07A6fb5B89F0',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      ];

      const balances = await adapter.getTokenBalances(address, tokenAddresses);

      expect(balances.length).toBeGreaterThan(0);
      balances.forEach(balance => {
        expect(balance.tokenAddress).toBeTruthy();
        expect(balance.tokenSymbol).toBeTruthy();
        expect(balance.balance).toBeTruthy();
      });
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('should create native token transaction', async () => {
      const request: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        to: '0x0000000000000000000000000000000000000000',
        amount: '1000000000000000000' // 1 ETH
      };

      const tx = await adapter.createTransaction(request);

      expect(tx.chainId).toBe(1);
      expect(tx.from).toBe(request.from);
      expect(tx.to).toBe(request.to);
      expect(tx.amount).toBe(request.amount);
      expect(tx.fee).toBeTruthy();
      expect(tx.nonce).toBe(42);
      expect(tx.gasPrice).toBeTruthy();
      expect(tx.gasLimit).toBeTruthy();
    });

    test('should create ERC-20 token transaction', async () => {
      const request: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        to: '0x0000000000000000000000000000000000000000',
        amount: '1000000000000000000',
        tokenAddress: '0xA0b86a33E6441e1A51E0c6b0E8ba07A6fb5B89F0'
      };

      const tx = await adapter.createTransaction(request);

      expect(tx.chainId).toBe(1);
      expect(tx.from).toBe(request.from);
      expect(tx.to).toBe(request.tokenAddress); // Should be token contract
      expect(tx.amount).toBe('0'); // No ETH value for ERC-20
      expect(tx.data).toBe('0xencodeddata');
    });

    test('should sign transaction', async () => {
      const transaction = {
        chainId: 1,
        from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        to: '0x0000000000000000000000000000000000000000',
        amount: '1000000000000000000',
        fee: '420000000000000000',
        data: '0x',
        nonce: 42,
        gasPrice: '20000000000',
        gasLimit: '21000'
      };

      const signed = await adapter.signTransaction(transaction, '0x1234');

      expect(signed.signature).toBeTruthy();
      expect(signed.signedRawTransaction).toBe('0xsignedtx');
      expect(signed.txid).toBe('0x123456789');
    });

    test('should broadcast signed transaction', async () => {
      const signedTx = {
        chainId: 1,
        from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        to: '0x0000000000000000000000000000000000000000',
        amount: '1000000000000000000',
        fee: '420000000000000000',
        data: '0x',
        nonce: 42,
        gasPrice: '20000000000',
        gasLimit: '21000',
        signature: '0xsig',
        signedRawTransaction: '0xsignedtx',
        txid: '0x123456789'
      };

      const hash = await adapter.broadcastTransaction(signedTx);

      expect(hash).toBe('0x123456789');
    });
  });

  describe('Chain Parameters and Health', () => {
    test('should return correct chain parameters', () => {
      const params: ChainParameters = adapter.getChainParameters();

      expect(params.chainType).toBe('evm');
      expect(params.nativeTokenDecimals).toBe(18);
      expect(params.averageBlockTime).toBe(12000);
      expect(params.confirmationThreshold).toBe(12);
      expect(params.addressFormat).toBe('ethereum');
      expect(params.supportedFeatures).toContain('smart_contracts');
    });

    test('should perform health check when connected', async () => {
      await adapter.connect();
      
      const health: HealthStatus = await adapter.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(health.syncStatus).toBe('synced');
      expect(health.issues).toHaveLength(0);
    });

    test('should perform health check when disconnected', async () => {
      const health = await adapter.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.syncStatus).toBe('out_of_sync');
      expect(health.issues).toContain('Not connected to provider');
    });
  });

  describe('Error Handling', () => {
    test('should handle provider connection errors gracefully', async () => {
      const badConfig: EVMChainConfig = {
        name: 'invalid',
        chainId: 999,
        rpcUrl: 'http://invalid-url',
        nativeTokenSymbol: 'BAD'
      };
      
      const badAdapter = new EVMChainAdapter(badConfig);
      
      // This should not throw in constructor
      expect(badAdapter).toBeInstanceOf(EVMChainAdapter);
    });

    test('should handle transaction creation errors', async () => {
      await adapter.connect();
      
      const invalidRequest: TransactionRequest = {
        from: 'invalid-address',
        to: '0x0000000000000000000000000000000000000000',
        amount: '1000000000000000000'
      };

      await expect(adapter.createTransaction(invalidRequest)).rejects.toThrow(
        'Invalid from or to address'
      );
    });
  });

  describe('TODO Methods', () => {
    test('should throw not implemented errors for TODO methods', async () => {
      const notImplementedMethods = [
        () => adapter.getTransaction('0x123'),
        () => adapter.getTransactionStatus('0x123'),
        () => adapter.getTransactionHistory('0x123'),
        () => adapter.subscribeToAddress('0x123', () => {}),
        () => adapter.unsubscribeFromAddress('sub123'),
        () => adapter.getLatestBlock(),
        () => adapter.getBlockByNumber(1000000),
        () => adapter.estimateFee({} as TransactionRequest),
        () => adapter.getCurrentFeeRates(),
        () => adapter.batchGetBalances([]),
        () => adapter.batchCreateTransactions([]),
        () => adapter.validateTransactionRequest({} as TransactionRequest)
      ];

      for (const method of notImplementedMethods) {
        await expect(method()).rejects.toThrow(/not yet implemented/);
      }
    });
  });
});

describe('EVMAdapterFactory', () => {
  test('should create Ethereum adapter', () => {
    const adapter = EVMAdapterFactory.createEthereum('https://test.com');
    
    expect(adapter.chainName).toBe('ethereum');
    expect(adapter.chainId).toBe(1);
    expect(adapter.nativeToken).toBe('ETH');
  });

  test('should create BSC adapter', () => {
    const adapter = EVMAdapterFactory.createBSC('https://test.com');
    
    expect(adapter.chainName).toBe('binance-smart-chain');
    expect(adapter.chainId).toBe(56);
    expect(adapter.nativeToken).toBe('BNB');
  });

  test('should create Polygon adapter', () => {
    const adapter = EVMAdapterFactory.createPolygon('https://test.com');
    
    expect(adapter.chainName).toBe('polygon');
    expect(adapter.chainId).toBe(137);
    expect(adapter.nativeToken).toBe('MATIC');
  });

  test('should create custom adapter', () => {
    const config: EVMChainConfig = {
      name: 'custom-chain',
      chainId: 12345,
      rpcUrl: 'https://custom.com',
      nativeTokenSymbol: 'CUSTOM'
    };

    const adapter = EVMAdapterFactory.createCustom(config);
    
    expect(adapter.chainName).toBe('custom-chain');
    expect(adapter.chainId).toBe(12345);
    expect(adapter.nativeToken).toBe('CUSTOM');
  });

  test('should handle optional WebSocket URLs in factory methods', () => {
    const adapters = [
      EVMAdapterFactory.createEthereum('https://eth.com', 'wss://eth.com'),
      EVMAdapterFactory.createBSC('https://bsc.com', 'wss://bsc.com'),
      EVMAdapterFactory.createPolygon('https://polygon.com', 'wss://polygon.com')
    ];

    adapters.forEach(adapter => {
      expect(adapter).toBeInstanceOf(EVMChainAdapter);
    });
  });
});
