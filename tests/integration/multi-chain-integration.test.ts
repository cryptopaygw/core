/**
 * Multi-Chain Integration Tests
 * 
 * Tests the integration between different chain adapters,
 * ensuring they work together seamlessly in a unified ecosystem.
 * 
 * This test suite validates:
 * - Cross-chain wallet generation consistency
 * - Multi-chain balance operations
 * - Unified transaction processing
 * - Chain adapter factory integration
 * - Error handling across adapters
 */

import { EVMChainAdapter, EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOChainAdapter, UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';

describe('Multi-Chain Integration Tests', () => {
  let ethAdapter: EVMChainAdapter;
  let btcAdapter: UTXOChainAdapter;
  
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';

  beforeAll(async () => {
    // Initialize adapters
    ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/test');
    btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
  });

  afterAll(async () => {
    // Cleanup connections
    if (ethAdapter.isConnected()) {
      await ethAdapter.disconnect();
    }
    if (btcAdapter.isConnected()) {
      await btcAdapter.disconnect();
    }
  });

  describe('Unified Wallet Generation', () => {
    test('should generate consistent HD wallets across chains', async () => {
      // Generate Ethereum wallet from mnemonic
      const ethWallet = await ethAdapter.generateAddress({
        seed: testMnemonic,
        index: 0
      });

      // Generate Bitcoin wallet from mnemonic
      const btcWallet = await btcAdapter.generateAddress({
        seed: testMnemonic,
        index: 0
      });

      // Both should be generated successfully
      expect(ethWallet.address).toBeTruthy();
      expect(ethWallet.privateKey).toBeTruthy();
      expect(ethWallet.derivationPath).toBe("m/44'/60'/0'/0/0");

      expect(btcWallet.address).toBeTruthy();
      expect(btcWallet.privateKey).toBeTruthy();
      expect(btcWallet.derivationPath).toBe("m/84'/0'/0'/0/0");

      // Addresses should be different (different chains)
      expect(ethWallet.address).not.toBe(btcWallet.address);
      
      // But both should be derived from same seed
      expect(ethWallet.index).toBe(btcWallet.index);
    });

    test('should generate wallets from private key across chains', async () => {
      // Generate Ethereum wallet from private key
      const ethWallet = await ethAdapter.generateAddress({
        privateKey: testPrivateKey
      });

      // Bitcoin uses WIF format, so we'll use a different test
      const btcPrivateKey = 'L4rK1yDtCWekvXuE6oXD9jCYfFNV2cWRpVuPLBcCU2z8TrisoyY1';
      const btcWallet = await btcAdapter.generateAddress({
        privateKey: btcPrivateKey
      });

      expect(ethWallet.address).toBeTruthy();
      expect(ethWallet.derivationPath).toBe('direct');
      
      expect(btcWallet.address).toBeTruthy();
      expect(btcWallet.derivationPath).toBe('direct');
    });

    test('should derive multiple addresses consistently', async () => {
      const addressCount = 5;

      // Generate multiple Ethereum addresses
      const ethAddresses = await ethAdapter.deriveAddresses({
        seed: testMnemonic,
        count: addressCount,
        startIndex: 0
      });

      // Generate multiple Bitcoin addresses
      const btcAddresses = await btcAdapter.deriveAddresses({
        seed: testMnemonic,
        count: addressCount,
        startIndex: 0
      });

      expect(ethAddresses).toHaveLength(addressCount);
      expect(btcAddresses).toHaveLength(addressCount);

      // Check that each pair has the same index
      for (let i = 0; i < addressCount; i++) {
        expect(ethAddresses[i].index).toBe(i);
        expect(btcAddresses[i].index).toBe(i);
        expect(ethAddresses[i].derivationPath).toBe(`m/44'/60'/0'/0/${i}`);
        expect(btcAddresses[i].derivationPath).toBe(`m/84'/0'/0'/0/${i}`);
      }
    });
  });

  describe('Chain Adapter Properties', () => {
    test('should have different chain identifiers', () => {
      expect(ethAdapter.chainName).toBe('ethereum');
      expect(ethAdapter.chainId).toBe(1);
      expect(ethAdapter.nativeToken).toBe('ETH');

      expect(btcAdapter.chainName).toBe('bitcoin');
      expect(btcAdapter.chainId).toBe(0);
      expect(btcAdapter.nativeToken).toBe('BTC');
    });

    test('should return different chain parameters', () => {
      const ethParams = ethAdapter.getChainParameters();
      const btcParams = btcAdapter.getChainParameters();

      expect(ethParams.chainType).toBe('evm');
      expect(ethParams.nativeTokenDecimals).toBe(18);
      expect(ethParams.addressFormat).toBe('ethereum');

      expect(btcParams.chainType).toBe('utxo');
      expect(btcParams.nativeTokenDecimals).toBe(8);
      expect(btcParams.addressFormat).toBe('bitcoin');

      // Both should have basic features
      expect(ethParams.supportedFeatures).toContain('smart_contracts');
      expect(btcParams.supportedFeatures).toContain('utxo_model');
    });
  });

  describe('Address Validation Consistency', () => {
    test('should validate addresses correctly for each chain', async () => {
      // Valid Ethereum addresses
      const validEthAddresses = [
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        '0x8ba1f109551bD432803012645Hac136c32960442',
        '0x0000000000000000000000000000000000000000'
      ];

      // Valid Bitcoin addresses
      const validBtcAddresses = [
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
      ];

      // Test Ethereum address validation
      for (const address of validEthAddresses) {
        expect(await ethAdapter.validateAddress(address)).toBe(true);
        expect(await btcAdapter.validateAddress(address)).toBe(false);
      }

      // Test Bitcoin address validation
      for (const address of validBtcAddresses) {
        expect(await btcAdapter.validateAddress(address)).toBe(true);
        expect(await ethAdapter.validateAddress(address)).toBe(false);
      }

      // Test invalid addresses
      const invalidAddresses = ['invalid', '', '123', 'not-an-address'];
      for (const address of invalidAddresses) {
        expect(await ethAdapter.validateAddress(address)).toBe(false);
        expect(await btcAdapter.validateAddress(address)).toBe(false);
      }
    });
  });

  describe('Connection Management Integration', () => {
    test('should manage connections independently', async () => {
      // Initially both should be disconnected
      expect(ethAdapter.isConnected()).toBe(false);
      expect(btcAdapter.isConnected()).toBe(false);

      // Connect Ethereum adapter
      await ethAdapter.connect();
      expect(ethAdapter.isConnected()).toBe(true);
      expect(btcAdapter.isConnected()).toBe(false);

      // Connect Bitcoin adapter
      await btcAdapter.connect();
      expect(ethAdapter.isConnected()).toBe(true);
      expect(btcAdapter.isConnected()).toBe(true);

      // Disconnect Ethereum adapter
      await ethAdapter.disconnect();
      expect(ethAdapter.isConnected()).toBe(false);
      expect(btcAdapter.isConnected()).toBe(true);

      // Disconnect Bitcoin adapter
      await btcAdapter.disconnect();
      expect(ethAdapter.isConnected()).toBe(false);
      expect(btcAdapter.isConnected()).toBe(false);
    });

    test('should provide connection status independently', async () => {
      await ethAdapter.connect();
      await btcAdapter.connect();

      const ethStatus = await ethAdapter.getConnectionStatus();
      const btcStatus = await btcAdapter.getConnectionStatus();

      expect(ethStatus.connected).toBe(true);
      expect(ethStatus.networkId).toBe(1);
      expect(ethStatus.blockHeight).toBeGreaterThan(0);

      expect(btcStatus.connected).toBe(true);
      expect(btcStatus.blockHeight).toBeGreaterThan(0);

      await ethAdapter.disconnect();
      await btcAdapter.disconnect();
    });
  });

  describe('Health Check Integration', () => {
    test('should perform health checks independently', async () => {
      // Health check when disconnected
      const ethHealthDisconnected = await ethAdapter.healthCheck();
      const btcHealthDisconnected = await btcAdapter.healthCheck();

      expect(ethHealthDisconnected.healthy).toBe(false);
      expect(ethHealthDisconnected.issues).toContain('Not connected to provider');

      expect(btcHealthDisconnected.healthy).toBe(false);
      expect(btcHealthDisconnected.issues).toContain('Not connected to API provider');

      // Health check when connected
      await ethAdapter.connect();
      await btcAdapter.connect();

      const ethHealthConnected = await ethAdapter.healthCheck();
      const btcHealthConnected = await btcAdapter.healthCheck();

      expect(ethHealthConnected.healthy).toBe(true);
      expect(ethHealthConnected.syncStatus).toBe('synced');
      expect(ethHealthConnected.latency).toBeGreaterThanOrEqual(0);

      expect(btcHealthConnected.healthy).toBe(true);
      expect(btcHealthConnected.syncStatus).toBe('synced');
      expect(btcHealthConnected.latency).toBeGreaterThanOrEqual(0);

      await ethAdapter.disconnect();
      await btcAdapter.disconnect();
    });
  });

  describe('Factory Integration', () => {
    test('should create different chain adapters using factories', () => {
      // Create multiple EVM adapters
      const ethereum = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/test');
      const bsc = EVMAdapterFactory.createBSC('https://bsc-dataseed.binance.org/');
      const polygon = EVMAdapterFactory.createPolygon('https://polygon-rpc.com/');

      expect(ethereum.chainName).toBe('ethereum');
      expect(ethereum.chainId).toBe(1);
      expect(ethereum.nativeToken).toBe('ETH');

      expect(bsc.chainName).toBe('binance-smart-chain');
      expect(bsc.chainId).toBe(56);
      expect(bsc.nativeToken).toBe('BNB');

      expect(polygon.chainName).toBe('polygon');
      expect(polygon.chainId).toBe(137);
      expect(polygon.nativeToken).toBe('MATIC');

      // Create multiple UTXO adapters
      const bitcoin = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
      const litecoin = UTXOAdapterFactory.createLitecoin('https://chain.so/api/v2');
      const testnet = UTXOAdapterFactory.createBitcoinTestnet('https://blockstream.info/testnet/api');

      expect(bitcoin.chainName).toBe('bitcoin');
      expect(bitcoin.chainId).toBe(0);
      expect(bitcoin.nativeToken).toBe('BTC');

      expect(litecoin.chainName).toBe('litecoin');
      expect(litecoin.chainId).toBe(2);
      expect(litecoin.nativeToken).toBe('LTC');

      expect(testnet.chainName).toBe('bitcoin-testnet');
      expect(testnet.chainId).toBe(1);
      expect(testnet.nativeToken).toBe('tBTC');
    });

    test('should create custom adapters', () => {
      const customEVM = EVMAdapterFactory.createCustom({
        name: 'custom-evm',
        chainId: 9999,
        rpcUrl: 'https://custom-rpc.com',
        nativeTokenSymbol: 'CUSTOM',
        nativeTokenDecimals: 18
      });

      expect(customEVM.chainName).toBe('custom-evm');
      expect(customEVM.chainId).toBe(9999);
      expect(customEVM.nativeToken).toBe('CUSTOM');

      const customUTXO = UTXOAdapterFactory.createCustom({
        name: 'custom-utxo',
        network: 'bitcoin',
        apiBaseUrl: 'https://custom-api.com',
        nativeTokenSymbol: 'CUSTOM-BTC'
      });

      expect(customUTXO.chainName).toBe('custom-utxo');
      expect(customUTXO.nativeToken).toBe('CUSTOM-BTC');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle errors independently across adapters', async () => {
      await ethAdapter.connect();
      await btcAdapter.connect();

      // Test invalid address errors
      await expect(ethAdapter.getBalance('invalid-address')).rejects.toThrow('Invalid address format');
      await expect(btcAdapter.getBalance('invalid-address')).rejects.toThrow('Invalid address format');

      // Test disconnected errors
      await ethAdapter.disconnect();
      await expect(ethAdapter.getBalance('0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6')).rejects.toThrow('Provider not connected');
      
      // Bitcoin adapter should still work
      const btcBalance = await btcAdapter.getBalance('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      expect(btcBalance.address).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');

      await btcAdapter.disconnect();
    });
  });

  describe('Multi-Chain Wallet Portfolio', () => {
    test('should manage wallets across multiple chains', async () => {
      interface PortfolioEntry {
        index: number;
        ethereum: any;
        bitcoin: any;
      }
      
      const portfolioAddresses: PortfolioEntry[] = [];

      // Generate addresses for same user across chains
      for (let i = 0; i < 3; i++) {
        const ethAddress = await ethAdapter.generateAddress({
          seed: testMnemonic,
          index: i
        });

        const btcAddress = await btcAdapter.generateAddress({
          seed: testMnemonic,
          index: i
        });

        portfolioAddresses.push({
          index: i,
          ethereum: ethAddress,
          bitcoin: btcAddress
        });
      }

      // Validate portfolio structure
      expect(portfolioAddresses).toHaveLength(3);
      
      portfolioAddresses.forEach((portfolio, index) => {
        expect(portfolio.index).toBe(index);
        expect(portfolio.ethereum.index).toBe(index);
        expect(portfolio.bitcoin.index).toBe(index);
        expect(portfolio.ethereum.derivationPath).toBe(`m/44'/60'/0'/0/${index}`);
        expect(portfolio.bitcoin.derivationPath).toBe(`m/84'/0'/0'/0/${index}`);
      });

      // Validate unique addresses across chains
      const allEthAddresses = portfolioAddresses.map(p => p.ethereum.address);
      const allBtcAddresses = portfolioAddresses.map(p => p.bitcoin.address);
      
      expect(new Set(allEthAddresses)).toHaveProperty('size', 3);
      expect(new Set(allBtcAddresses)).toHaveProperty('size', 3);
      expect(new Set([...allEthAddresses, ...allBtcAddresses])).toHaveProperty('size', 6);
    });
  });
});
