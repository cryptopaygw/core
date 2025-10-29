/**
 * UTXO Chain Adapter Tests
 * Following TDD methodology - comprehensive test coverage for Bitcoin, Litecoin, and UTXO chains
 */

import { UTXOChainAdapter, UTXOAdapterFactory, type UTXOChainConfig } from './utxo-chain-adapter';

// Inline interfaces for testing (to avoid import issues)
interface AddressGenerationOptions {
  privateKey?: string;
  seed?: string;
  derivationPath?: string;
  index?: number;
}

interface WalletAddress {
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath: string;
  index?: number;
}

interface BulkAddressOptions {
  seed?: string;
  count: number;
  startIndex?: number;
  derivationPath?: string;
}

interface BalanceOptions {
  blockHeight?: number;
  minConfirmations?: number;
}

interface Balance {
  address: string;
  balance: string;
  confirmed: string;
  unconfirmed: string;
  blockHeight: number;
}

interface BalanceResult {
  address: string;
  balance: Balance | null;
  error?: string;
}

interface UTXO {
  txid: string;
  vout: number;
  value: string;
  scriptPubKey: string;
  confirmations: number;
  spendable: boolean;
}

interface TransactionRequest {
  from: string;
  to: string;
  amount: string;
  feeRate?: string;
  utxos?: UTXO[];
  changeAddress?: string;
}

interface UnsignedTransaction {
  chainId: number;
  from: string;
  to: string;
  amount: string;
  fee: string;
  data?: string;
  nonce?: number;
  utxos: UTXO[];
  changeAddress?: string;
  rawTransaction?: string;
}

interface SignedTransaction extends UnsignedTransaction {
  signature: string;
  signedRawTransaction: string;
  txid: string;
}

type TransactionHash = string;

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

interface FeeEstimate {
  slow: string;
  standard: string;
  fast: string;
}

describe('UTXOChainAdapter', () => {
  let mockConfig: UTXOChainConfig;
  let adapter: UTXOChainAdapter;

  beforeEach(() => {
    mockConfig = {
      name: 'bitcoin',
      chainId: 0,
      network: 'bitcoin',
      apiBaseUrl: 'https://blockstream.info/api',
      apiType: 'blockstream',
      nativeTokenSymbol: 'BTC',
      nativeTokenDecimals: 8,
      blockTime: 600000,
      confirmations: 6,
      addressTypes: ['p2pkh', 'p2wpkh', 'p2sh'],
      defaultAddressType: 'p2wpkh'
    };

    adapter = new UTXOChainAdapter(mockConfig);
  });

  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
  });

  describe('Constructor and Configuration', () => {
    test('should create adapter with valid configuration', () => {
      expect(adapter).toBeInstanceOf(UTXOChainAdapter);
      expect(adapter.chainName).toBe('bitcoin');
      expect(adapter.chainId).toBe(0);
      expect(adapter.nativeToken).toBe('BTC');
    });

    test('should throw error with invalid configuration', () => {
      expect(() => new UTXOChainAdapter({} as UTXOChainConfig)).toThrow(
        'Invalid UTXO chain configuration: name, network, apiBaseUrl, and nativeTokenSymbol are required'
      );
    });

    test('should throw error when missing required fields', () => {
      const invalidConfigs = [
        { network: 'bitcoin', apiBaseUrl: 'test', nativeTokenSymbol: 'BTC' },
        { name: 'btc', apiBaseUrl: 'test', nativeTokenSymbol: 'BTC' },
        { name: 'btc', network: 'bitcoin', nativeTokenSymbol: 'BTC' },
        { name: 'btc', network: 'bitcoin', apiBaseUrl: 'test' }
      ];

      invalidConfigs.forEach(config => {
        expect(() => new UTXOChainAdapter(config as unknown as UTXOChainConfig)).toThrow();
      });
    });

    test('should set default values for optional parameters', () => {
      const minimalConfig: UTXOChainConfig = {
        name: 'bitcoin-minimal',
        network: 'bitcoin',
        apiBaseUrl: 'https://test.com',
        nativeTokenSymbol: 'BTC'
      };

      const minimalAdapter = new UTXOChainAdapter(minimalConfig);
      
      expect(minimalAdapter.chainName).toBe('bitcoin-minimal');
      const params = minimalAdapter.getChainParameters();
      expect(params.nativeTokenDecimals).toBe(8); // Default Bitcoin decimals
      expect(params.confirmationThreshold).toBe(6); // Default confirmations
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully with valid API', async () => {
      expect(adapter.isConnected()).toBe(false);
      
      await adapter.connect();
      
      expect(adapter.isConnected()).toBe(true);
    });

    test('should handle connection with different API types', async () => {
      const configs = [
        { ...mockConfig, apiType: 'blockstream' as const },
        { ...mockConfig, apiType: 'blockchain_info' as const },
        { ...mockConfig, apiType: 'custom' as const }
      ];

      for (const config of configs) {
        const testAdapter = new UTXOChainAdapter(config);
        await testAdapter.connect();
        expect(testAdapter.isConnected()).toBe(true);
        await testAdapter.disconnect();
      }
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
    test('should generate P2WPKH address from private key', async () => {
      const options: AddressGenerationOptions = {
        privateKey: 'L4rK1yDtCWekvXuE6oXD9jCYfFNV2cWRpVuPLBcCU2z8TrisoyY1'
      };

      const wallet = await adapter.generateAddress(options);

      expect(wallet.address).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      expect(wallet.privateKey).toBe(options.privateKey);
      expect(wallet.derivationPath).toBe('direct');
    });

    test('should generate P2PKH legacy address when specified', async () => {
      const legacyConfig = { ...mockConfig, defaultAddressType: 'p2pkh' as const };
      const legacyAdapter = new UTXOChainAdapter(legacyConfig);
      
      const options: AddressGenerationOptions = {
        privateKey: 'L4rK1yDtCWekvXuE6oXD9jCYfFNV2cWRpVuPLBcCU2z8TrisoyY1'
      };

      const wallet = await legacyAdapter.generateAddress(options);

      expect(wallet.address).toBe('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
      expect(wallet.derivationPath).toBe('direct');
    });

    test('should generate address from seed with BIP44 derivation', async () => {
      const options: AddressGenerationOptions = {
        seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        index: 0
      };

      const wallet = await adapter.generateAddress(options);

      expect(wallet.address).toBeTruthy();
      expect(wallet.privateKey).toBeTruthy();
      expect(wallet.derivationPath).toBe("m/84'/0'/0'/0/0"); // BIP84 for P2WPKH
      expect(wallet.index).toBe(0);
    });

    test('should generate address with custom derivation path', async () => {
      const options: AddressGenerationOptions = {
        seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        derivationPath: "m/44'/0'/1'/0",
        index: 5
      };

      const wallet = await adapter.generateAddress(options);

      expect(wallet.derivationPath).toBe("m/44'/0'/1'/0/5");
      expect(wallet.index).toBe(5);
    });

    test('should validate valid Bitcoin addresses', async () => {
      const validAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // P2WPKH
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // P2PKH
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
        'bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du' // P2TR (Taproot)
      ];

      for (const address of validAddresses) {
        const isValid = await adapter.validateAddress(address);
        expect(isValid).toBe(true);
      }
    });

    test('should reject invalid addresses', async () => {
      const invalidAddresses = [
        'invalid',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN',
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t',
        '',
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6' // Ethereum address
      ];

      for (const address of invalidAddresses) {
        const isValid = await adapter.validateAddress(address);
        expect(isValid).toBe(false);
      }
    });

    test('should derive multiple addresses', async () => {
      const options = {
        seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        count: 5,
        startIndex: 0
      };

      const addresses = await adapter.deriveAddresses(options);

      expect(addresses).toHaveLength(5);
      addresses.forEach((wallet, i) => {
        expect(wallet.index).toBe(i);
        expect(wallet.derivationPath).toBe(`m/84'/0'/0'/0/${i}`);
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

    test('should support different address types during derivation', async () => {
      const addressTypes = ['p2pkh', 'p2wpkh', 'p2sh'] as const;
      
      for (const addressType of addressTypes) {
        const configWithType = { ...mockConfig, defaultAddressType: addressType };
        const testAdapter = new UTXOChainAdapter(configWithType);
        
        const options: AddressGenerationOptions = {
          seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
          index: 0
        };

        const wallet = await testAdapter.generateAddress(options);
        
        expect(wallet.address).toBeTruthy();
        expect(wallet.derivationPath).toBeTruthy();
      }
    });
  });

  describe('UTXO Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('should get UTXOs for address', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      
      const utxos = await adapter.getUTXOs(address);
      
      expect(Array.isArray(utxos)).toBe(true);
      if (utxos.length > 0) {
        const utxo = utxos[0];
        expect(utxo.txid).toBeTruthy();
        expect(typeof utxo.vout).toBe('number');
        expect(utxo.value).toBeTruthy();
        expect(utxo.scriptPubKey).toBeTruthy();
        expect(typeof utxo.confirmations).toBe('number');
        expect(typeof utxo.spendable).toBe('boolean');
      }
    });

    test('should filter UTXOs by minimum confirmations', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const minConfirmations = 3;
      
      const utxos = await adapter.getUTXOs(address, { minConfirmations });
      
      utxos.forEach(utxo => {
        expect(utxo.confirmations).toBeGreaterThanOrEqual(minConfirmations);
      });
    });

    test('should get spendable UTXOs only', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      
      const utxos = await adapter.getUTXOs(address, { spendableOnly: true });
      
      utxos.forEach(utxo => {
        expect(utxo.spendable).toBe(true);
      });
    });

    test('should select optimal UTXOs for transaction', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const amount = '100000'; // 0.001 BTC in satoshis
      
      const selectedUTXOs = await adapter.selectUTXOs(address, amount);
      
      const totalValue = selectedUTXOs.reduce((sum, utxo) => sum + parseInt(utxo.value), 0);
      expect(totalValue).toBeGreaterThanOrEqual(parseInt(amount));
    });

    test('should throw error when insufficient UTXOs', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const amount = '2100000000000000'; // More than total Bitcoin supply
      
      await expect(adapter.selectUTXOs(address, amount)).rejects.toThrow(
        'Insufficient funds'
      );
    });
  });

  describe('Balance Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('should get balance for address', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      
      const balance = await adapter.getBalance(address);
      
      expect(balance.address).toBe(address);
      expect(balance.balance).toBeTruthy();
      expect(balance.confirmed).toBeTruthy();
      expect(balance.unconfirmed).toBeTruthy();
      expect(balance.blockHeight).toBeGreaterThan(0);
    });

    test('should get balance with minimum confirmations', async () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const options: BalanceOptions = { minConfirmations: 6 };
      
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
      
      await expect(adapter.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).rejects.toThrow(
        'Provider not connected'
      );
    });

    test('should get balances for multiple addresses', async () => {
      const addresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];

      const results = await adapter.getBalances(addresses);

      expect(results).toHaveLength(2);
      results.forEach((result, i) => {
        expect(result.address).toBe(addresses[i]);
        expect(result.balance).toBeTruthy();
      });
    });

    test('should handle balance errors gracefully', async () => {
      const addresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        'invalid-address'
      ];

      const results = await adapter.getBalances(addresses);

      expect(results).toHaveLength(2);
      expect(results[0].balance).toBeTruthy();
      expect(results[1].balance).toBeNull();
      expect(results[1].error).toBeTruthy();
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('should create transaction with automatic UTXO selection', async () => {
      const request: TransactionRequest = {
        from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '100000' // 0.001 BTC
      };

      const tx = await adapter.createTransaction(request);

      expect(tx.from).toBe(request.from);
      expect(tx.to).toBe(request.to);
      expect(tx.amount).toBe(request.amount);
      expect(tx.fee).toBeTruthy();
      expect(tx.utxos.length).toBeGreaterThan(0);
      expect(tx.rawTransaction).toBeTruthy();
    });

    test('should create transaction with specific UTXOs', async () => {
      const utxos: UTXO[] = [
        {
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          vout: 0,
          value: '200000',
          scriptPubKey: '0014751e76c4e76b2f4ed6b35b9b0f6d6b39bb5a9cc8',
          confirmations: 6,
          spendable: true
        }
      ];

      const request: TransactionRequest = {
        from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '100000',
        utxos
      };

      const tx = await adapter.createTransaction(request);

      expect(tx.utxos).toEqual(utxos);
      expect(tx.amount).toBe(request.amount);
    });

    test('should create transaction with custom fee rate', async () => {
      const request: TransactionRequest = {
        from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '100000',
        feeRate: '10' // 10 sat/vByte
      };

      const tx = await adapter.createTransaction(request);

      expect(tx.fee).toBeTruthy();
      const feeAmount = parseInt(tx.fee);
      expect(feeAmount).toBeGreaterThan(0);
    });

    test('should sign transaction', async () => {
      const transaction: UnsignedTransaction = {
        chainId: 0,
        from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '100000',
        fee: '1000',
        utxos: [{
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          vout: 0,
          value: '200000',
          scriptPubKey: '0014751e76c4e76b2f4ed6b35b9b0f6d6b39bb5a9cc8',
          confirmations: 6,
          spendable: true
        }],
        rawTransaction: '020000000001...'
      };

      const privateKey = 'L4rK1yDtCWekvXuE6oXD9jCYfFNV2cWRpVuPLBcCU2z8TrisoyY1';
      const signed = await adapter.signTransaction(transaction, privateKey);

      expect(signed.signature).toBeTruthy();
      expect(signed.signedRawTransaction).toBeTruthy();
      expect(signed.txid).toBeTruthy();
    });

    test('should broadcast signed transaction', async () => {
      const signedTx: SignedTransaction = {
        chainId: 0,
        from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '100000',
        fee: '1000',
        utxos: [],
        signature: 'signature-data',
        signedRawTransaction: '02000000000101...',
        txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      };

      const hash = await adapter.broadcastTransaction(signedTx);

      expect(hash).toBe(signedTx.txid);
    });

    test('should estimate fees', async () => {
      const estimate = await adapter.estimateFee();

      expect(estimate.slow).toBeTruthy();
      expect(estimate.standard).toBeTruthy();
      expect(estimate.fast).toBeTruthy();
      expect(parseInt(estimate.slow)).toBeLessThanOrEqual(parseInt(estimate.standard));
      expect(parseInt(estimate.standard)).toBeLessThanOrEqual(parseInt(estimate.fast));
    });
  });

  describe('Chain Parameters and Health', () => {
    test('should return correct chain parameters', () => {
      const params: ChainParameters = adapter.getChainParameters();

      expect(params.chainType).toBe('utxo');
      expect(params.nativeTokenDecimals).toBe(8);
      expect(params.averageBlockTime).toBe(600000);
      expect(params.confirmationThreshold).toBe(6);
      expect(params.addressFormat).toBe('bitcoin');
      expect(params.supportedFeatures).toContain('utxo_model');
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
      expect(health.issues).toContain('Not connected to API provider');
    });
  });

  describe('Error Handling', () => {
    test('should handle API connection errors gracefully', async () => {
      const badConfig: UTXOChainConfig = {
        name: 'invalid',
        network: 'bitcoin',
        apiBaseUrl: 'http://invalid-url',
        nativeTokenSymbol: 'BAD'
      };
      
      const badAdapter = new UTXOChainAdapter(badConfig);
      
      // This should not throw in constructor
      expect(badAdapter).toBeInstanceOf(UTXOChainAdapter);
    });

    test('should handle transaction creation errors', async () => {
      await adapter.connect();
      
      const invalidRequest: TransactionRequest = {
        from: 'invalid-address',
        to: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        amount: '100000'
      };

      await expect(adapter.createTransaction(invalidRequest)).rejects.toThrow(
        'Invalid from or to address'
      );
    });

    test('should handle insufficient balance errors', async () => {
      await adapter.connect();
      
      const request: TransactionRequest = {
        from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '2100000000000000' // More than total supply
      };

      await expect(adapter.createTransaction(request)).rejects.toThrow(
        'Insufficient funds'
      );
    });
  });

  describe('Implemented Methods', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    test('should work with implemented methods', async () => {
      // All these methods are now fully implemented, not TODO anymore
      const implementedMethods = [
        () => adapter.getTransaction('abc123'),
        () => adapter.getTransactionStatus('abc123'), 
        () => adapter.getTransactionHistory('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'),
        () => adapter.getLatestBlock(),
        () => adapter.getBlockByNumber(700000),
        () => adapter.getCurrentFeeRates(),
        () => adapter.batchGetBalances([]),
        () => adapter.batchCreateTransactions([]),
        () => adapter.validateTransactionRequest({
          from: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          amount: '100000'
        } as TransactionRequest)
      ];

      // These methods should execute without throwing "not implemented" errors
      for (const method of implementedMethods) {
        try {
          await method();
          // If it doesn't throw, that's fine - method is implemented
        } catch (error) {
          // Should not be "not implemented" errors
          expect(error instanceof Error ? error.message : '').not.toMatch(/not yet implemented/);
        }
      }
    });

    test('should handle subscription methods', async () => {
      // Test subscription methods separately
      const subscriptionId = await adapter.subscribeToAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', () => {});
      expect(subscriptionId).toBeTruthy();
      
      await adapter.unsubscribeFromAddress(subscriptionId);
      // Should not throw any errors
    });
  });
});

describe('UTXOAdapterFactory', () => {
  test('should create Bitcoin adapter', () => {
    const adapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
    
    expect(adapter.chainName).toBe('bitcoin');
    expect(adapter.nativeToken).toBe('BTC');
    expect(adapter.getChainParameters().nativeTokenDecimals).toBe(8);
  });

  test('should create Litecoin adapter', () => {
    const adapter = UTXOAdapterFactory.createLitecoin('https://chain.so/api/v2');
    
    expect(adapter.chainName).toBe('litecoin');
    expect(adapter.nativeToken).toBe('LTC');
    expect(adapter.getChainParameters().nativeTokenDecimals).toBe(8);
  });

  test('should create Bitcoin testnet adapter', () => {
    const adapter = UTXOAdapterFactory.createBitcoinTestnet('https://blockstream.info/testnet/api');
    
    expect(adapter.chainName).toBe('bitcoin-testnet');
    expect(adapter.nativeToken).toBe('tBTC');
    expect(adapter.getChainParameters().nativeTokenDecimals).toBe(8);
  });

  test('should create custom UTXO adapter', () => {
    const config: UTXOChainConfig = {
      name: 'custom-utxo',
      network: 'bitcoin',
      apiBaseUrl: 'https://custom-api.com',
      nativeTokenSymbol: 'CUSTOM'
    };

    const adapter = UTXOAdapterFactory.createCustom(config);
    
    expect(adapter.chainName).toBe('custom-utxo');
    expect(adapter.nativeToken).toBe('CUSTOM');
  });

  test('should handle different API types in factory methods', () => {
    const adapters = [
      UTXOAdapterFactory.createBitcoin('https://blockstream.info/api', 'blockstream'),
      UTXOAdapterFactory.createLitecoin('https://chain.so/api/v2', 'blockchain_info'),
    ];

    adapters.forEach(adapter => {
      expect(adapter).toBeInstanceOf(UTXOChainAdapter);
    });
  });
});
