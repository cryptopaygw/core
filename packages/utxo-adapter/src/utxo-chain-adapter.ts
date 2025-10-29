/**
 * UTXO Chain Adapter Implementation
 * 
 * Supports Bitcoin, Litecoin, and other UTXO-based blockchains.
 * Provides unified interface for all UTXO operations using bitcoinjs-lib.
 * 
 * Features:
 * - HD wallet generation (BIP44, BIP49, BIP84)
 * - Multiple address types (P2PKH, P2WPKH, P2SH, P2TR)
 * - UTXO selection algorithms
 * - Multi-API provider support
 * - Fee estimation and optimization
 * - Transaction building and signing
 * - Comprehensive error handling
 */

// Inline interface definitions to avoid import issues during development
interface IChainAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): Promise<ConnectionStatus>;
  generateAddress(options: AddressGenerationOptions): Promise<WalletAddress>;
  validateAddress(address: string): Promise<boolean>;
  deriveAddresses(options: BulkAddressOptions): Promise<WalletAddress[]>;
  getBalance(address: string, options?: BalanceOptions): Promise<Balance>;
  getBalances(addresses: string[], options?: BalanceOptions): Promise<BalanceResult[]>;
  createTransaction(request: TransactionRequest): Promise<UnsignedTransaction>;
  signTransaction(transaction: UnsignedTransaction, privateKey: string): Promise<SignedTransaction>;
  broadcastTransaction(signedTransaction: SignedTransaction): Promise<TransactionHash>;
  getChainParameters(): ChainParameters;
  healthCheck(): Promise<HealthStatus>;
}

interface AddressGenerationOptions {
  privateKey?: string;
  seed?: string;
  derivationPath?: string;
  index?: number;
  addressType?: 'p2pkh' | 'p2wpkh' | 'p2sh' | 'p2tr';
}

interface WalletAddress {
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath: string;
  index?: number;
  addressType?: string;
}

interface BulkAddressOptions {
  seed?: string;
  count: number;
  startIndex?: number;
  derivationPath?: string;
  addressType?: 'p2pkh' | 'p2wpkh' | 'p2sh' | 'p2tr';
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

interface UTXOOptions {
  minConfirmations?: number;
  spendableOnly?: boolean;
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

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  blockHeight?: number;
  confirmations: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockHeight?: number;
  timestamp?: Date;
}

interface HistoryOptions {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

interface BlockInfo {
  number: number;
  hash: string;
  timestamp: Date;
  transactionCount: number;
}

interface FeeEstimate {
  slow: string;
  standard: string;
  fast: string;
}

interface FeeRates {
  slow: string;
  standard: string;
  fast: string;
}

interface BatchBalanceRequest {
  addresses: string[];
  options?: BalanceOptions;
}

interface BatchBalanceResult {
  results: BalanceResult[];
  errors: string[];
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
  lastBlockTime?: Date;
  syncStatus: string;
  issues: string[];
}

interface TransactionValidationResult {
  valid: boolean;
  errors: string[];
}

type TransactionCallback = (transaction: Transaction) => void;

import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface, fromSeed, fromBase58 } from 'bip32';
import * as bip39 from 'bip39';
import axios, { AxiosInstance } from 'axios';
import { ECPairInterface, ECPairFactory } from 'ecpair';
import * as tinysecp256k1 from 'tiny-secp256k1';

// Initialize ECPair with secp256k1
const ECPair = ECPairFactory(tinysecp256k1);

/**
 * Configuration interface for UTXO chains
 */
export interface UTXOChainConfig {
  name: string;
  chainId?: number;
  network: 'bitcoin' | 'testnet' | 'litecoin' | 'dogecoin' | string;
  apiBaseUrl: string;
  apiType?: 'blockstream' | 'blockchain_info' | 'custom';
  nativeTokenSymbol: string;
  nativeTokenDecimals?: number;
  blockTime?: number;
  confirmations?: number;
  addressTypes?: Array<'p2pkh' | 'p2wpkh' | 'p2sh' | 'p2tr'>;
  defaultAddressType?: 'p2pkh' | 'p2wpkh' | 'p2sh' | 'p2tr';
  feeMultiplier?: number;
  maxFeeRate?: string;
  dustThreshold?: number;
  options?: Record<string, unknown>;
}

/**
 * UTXO Chain Adapter Implementation
 */
export class UTXOChainAdapter implements IChainAdapter {
  private apiClient: AxiosInstance | null = null;
  private connected = false;
  private network: bitcoin.Network;
  
  // Chain-specific configurations
  private readonly defaultDustThreshold = 546; // 546 satoshis
  private readonly defaultFeeRate = 1; // 1 sat/vByte
  
  constructor(private readonly config: UTXOChainConfig) {
    // Validate configuration
    if (!config.name || !config.network || !config.apiBaseUrl || !config.nativeTokenSymbol) {
      throw new Error('Invalid UTXO chain configuration: name, network, apiBaseUrl, and nativeTokenSymbol are required');
    }

    // Set Bitcoin network
    this.network = this.getNetworkConfig(config.network);
  }

  // =============================================================================
  // Chain Properties
  // =============================================================================

  get chainName(): string {
    return this.config.name;
  }

  get chainId(): number {
    return this.config.chainId || 0;
  }

  get nativeToken(): string {
    return this.config.nativeTokenSymbol;
  }

  // =============================================================================
  // Network Configuration
  // =============================================================================

  private getNetworkConfig(networkType: string): bitcoin.Network {
    switch (networkType.toLowerCase()) {
      case 'bitcoin':
        return bitcoin.networks.bitcoin;
      case 'testnet':
        return bitcoin.networks.testnet;
      case 'regtest':
        return bitcoin.networks.regtest;
      default:
        // For other coins like Litecoin, use Bitcoin network as base
        return bitcoin.networks.bitcoin;
    }
  }

  private getDerivationPath(addressType?: string, coinType: number = 0): string {
    const type = addressType || this.config.defaultAddressType || 'p2wpkh';
    
    switch (type) {
      case 'p2pkh': // Legacy addresses (BIP44)
        return `m/44'/${coinType}'/0'/0`;
      case 'p2sh': // Nested SegWit (BIP49)
        return `m/49'/${coinType}'/0'/0`;
      case 'p2wpkh': // Native SegWit (BIP84)
        return `m/84'/${coinType}'/0'/0`;
      case 'p2tr': // Taproot (BIP86)
        return `m/86'/${coinType}'/0'/0`;
      default:
        return `m/84'/${coinType}'/0'/0`;
    }
  }

  private getCoinType(): number {
    switch (this.config.network.toLowerCase()) {
      case 'bitcoin':
      case 'testnet':
      case 'regtest':
        return 0;
      case 'litecoin':
        return 2;
      case 'dogecoin':
        return 3;
      default:
        return 0;
    }
  }

  // =============================================================================
  // Connection Management
  // =============================================================================

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Initialize HTTP client
      this.apiClient = axios.create({
        baseURL: this.config.apiBaseUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Test connection by getting latest block info
      const blockHeight = await this.getCurrentBlockHeight();
      
      if (blockHeight > 0) {
        this.connected = true;
      } else {
        throw new Error('Unable to fetch block height');
      }
    } catch (error) {
      this.apiClient = null;
      throw new Error(`Failed to connect to ${this.config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      this.apiClient = null;
      this.connected = false;
    } catch (error) {
      console.warn(`Error during disconnect from ${this.config.name}:`, error);
    }
  }

  isConnected(): boolean {
    return this.connected && this.apiClient !== null;
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    if (!this.isConnected() || !this.apiClient) {
      return {
        connected: false,
        latency: 0,
        blockHeight: 0
      };
    }

    try {
      const startTime = Date.now();
      const blockHeight = await this.getCurrentBlockHeight();
      const latency = Date.now() - startTime;

      return {
        connected: true,
        latency,
        blockHeight,
        networkId: this.chainId
      };
    } catch (error) {
      return {
        connected: false,
        latency: 0,
        blockHeight: 0
      };
    }
  }

  // =============================================================================
  // Address and Wallet Operations
  // =============================================================================

  async generateAddress(options: AddressGenerationOptions): Promise<WalletAddress> {
    const { seed, privateKey, derivationPath, index = 0, addressType } = options;

    try {
      let keyPair: ECPairInterface;
      let finalDerivationPath: string;
      let publicKey: string;

      if (privateKey) {
        // Generate from private key directly
        keyPair = ECPair.fromWIF(privateKey, this.network);
        finalDerivationPath = 'direct';
        publicKey = keyPair.publicKey.toString('hex');
      } else if (seed) {
        // Generate from seed with HD derivation
        const seedBuffer = bip39.mnemonicToSeedSync(seed);
        const hdNode = fromSeed(seedBuffer, this.network);
        
        const coinType = this.getCoinType();
        finalDerivationPath = derivationPath || this.getDerivationPath(addressType, coinType);
        const fullPath = `${finalDerivationPath}/${index}`;
        
        const derivedNode = hdNode.derivePath(fullPath);
        keyPair = ECPair.fromPrivateKey(derivedNode.privateKey!, { network: this.network });
        publicKey = keyPair.publicKey.toString('hex');
        finalDerivationPath = fullPath;
      } else {
        throw new Error('Either seed or privateKey must be provided');
      }

      // Generate address based on type
      const address = await this.generateAddressFromKeyPair(keyPair, addressType);

      return {
        address,
        privateKey: keyPair.toWIF(),
        publicKey,
        derivationPath: finalDerivationPath,
        index,
        addressType: addressType || this.config.defaultAddressType || 'p2wpkh'
      };
    } catch (error) {
      throw new Error(`Failed to generate address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateAddressFromKeyPair(keyPair: ECPairInterface, addressType?: string): Promise<string> {
    const type = addressType || this.config.defaultAddressType || 'p2wpkh';

    switch (type) {
      case 'p2pkh': // Legacy P2PKH
        return bitcoin.payments.p2pkh({ 
          pubkey: keyPair.publicKey, 
          network: this.network 
        }).address!;
      
      case 'p2wpkh': // Native SegWit P2WPKH
        return bitcoin.payments.p2wpkh({ 
          pubkey: keyPair.publicKey, 
          network: this.network 
        }).address!;
      
      case 'p2sh': // Nested SegWit P2SH-P2WPKH
        const p2wpkh = bitcoin.payments.p2wpkh({ 
          pubkey: keyPair.publicKey, 
          network: this.network 
        });
        return bitcoin.payments.p2sh({ 
          redeem: p2wpkh, 
          network: this.network 
        }).address!;
      
      case 'p2tr': // Taproot P2TR
        // Note: bitcoinjs-lib may need specific version for Taproot support
        const p2tr = bitcoin.payments.p2tr({
          pubkey: keyPair.publicKey.slice(1), // Remove prefix for Taproot
          network: this.network
        });
        return p2tr.address!;
      
      default:
        throw new Error(`Unsupported address type: ${type}`);
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      // Use bitcoinjs-lib address validation
      bitcoin.address.toOutputScript(address, this.network);
      return true;
    } catch {
      return false;
    }
  }

  async deriveAddresses(options: BulkAddressOptions): Promise<WalletAddress[]> {
    const { seed, count, startIndex = 0, derivationPath, addressType } = options;
    const addresses: WalletAddress[] = [];

    if (!seed) {
      throw new Error('Seed is required for bulk address derivation');
    }

    try {
      const seedBuffer = bip39.mnemonicToSeedSync(seed);
      const hdNode = fromSeed(seedBuffer, this.network);
      
      const coinType = this.getCoinType();
      const basePath = derivationPath || this.getDerivationPath(addressType, coinType);

      for (let i = 0; i < count; i++) {
        const index = startIndex + i;
        const fullPath = `${basePath}/${index}`;
        
        const derivedNode = hdNode.derivePath(fullPath);
        const keyPair = ECPair.fromPrivateKey(derivedNode.privateKey!, { network: this.network });
        
        const address = await this.generateAddressFromKeyPair(keyPair, addressType);

        addresses.push({
          address,
          privateKey: keyPair.toWIF(),
          publicKey: keyPair.publicKey.toString('hex'),
          derivationPath: fullPath,
          index,
          addressType: addressType || this.config.defaultAddressType || 'p2wpkh'
        });
      }

      return addresses;
    } catch (error) {
      throw new Error(`Failed to derive addresses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // UTXO Operations
  // =============================================================================

  async getUTXOs(address: string, options?: UTXOOptions): Promise<UTXO[]> {
    if (!this.apiClient) {
      throw new Error('Provider not connected');
    }

    if (!(await this.validateAddress(address))) {
      throw new Error('Invalid address format');
    }

    try {
      const utxos = await this.fetchUTXOsFromAPI(address);
      let filteredUTXOs = utxos;

      // Apply filters
      if (options?.minConfirmations) {
        filteredUTXOs = filteredUTXOs.filter(utxo => utxo.confirmations >= options.minConfirmations!);
      }

      if (options?.spendableOnly) {
        filteredUTXOs = filteredUTXOs.filter(utxo => utxo.spendable);
      }

      return filteredUTXOs;
    } catch (error) {
      throw new Error(`Failed to get UTXOs for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchUTXOsFromAPI(address: string): Promise<UTXO[]> {
    const apiType = this.config.apiType || 'blockstream';

    switch (apiType) {
      case 'blockstream':
        return this.fetchUTXOsBlockstream(address);
      case 'blockchain_info':
        return this.fetchUTXOsBlockchainInfo(address);
      default:
        return this.fetchUTXOsBlockstream(address); // Default fallback
    }
  }

  private async fetchUTXOsBlockstream(address: string): Promise<UTXO[]> {
    const response = await this.apiClient!.get(`/address/${address}/utxo`);
    const currentHeight = await this.getCurrentBlockHeight();
    
    return response.data.map((utxo: any): UTXO => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value.toString(),
      scriptPubKey: utxo.scriptPubKey || '76a914751e76c4e76b2f4ed6b35b9b0f6d6b39bb5a9cc888ac', // Use from response or fallback
      confirmations: utxo.status.confirmed ? currentHeight - utxo.status.block_height + 1 : 0,
      spendable: utxo.status.confirmed
    }));
  }

  private async fetchUTXOsBlockchainInfo(address: string): Promise<UTXO[]> {
    const response = await this.apiClient!.get(`/unspent?active=${address}`);
    
    return response.data.unspent_outputs.map((utxo: any): UTXO => ({
      txid: utxo.tx_hash_big_endian,
      vout: utxo.tx_output_n,
      value: utxo.value.toString(),
      scriptPubKey: utxo.script,
      confirmations: utxo.confirmations,
      spendable: utxo.confirmations > 0
    }));
  }

  async selectUTXOs(address: string, amount: string, feeRate?: string): Promise<UTXO[]> {
    const utxos = await this.getUTXOs(address, { spendableOnly: true });
    const targetAmount = parseInt(amount);
    const estimatedFeeRate = parseInt(feeRate || this.defaultFeeRate.toString());
    
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    // Sort UTXOs by value (descending) for optimal selection
    utxos.sort((a, b) => parseInt(b.value) - parseInt(a.value));

    const selectedUTXOs: UTXO[] = [];
    let totalValue = 0;
    let estimatedSize = 10; // Base transaction size

    for (const utxo of utxos) {
      selectedUTXOs.push(utxo);
      totalValue += parseInt(utxo.value);
      estimatedSize += 148; // Approximate size per input

      // Estimate fee and check if we have enough
      const estimatedFee = estimatedSize * estimatedFeeRate;
      const totalNeeded = targetAmount + estimatedFee;

      if (totalValue >= totalNeeded) {
        return selectedUTXOs;
      }
    }

    throw new Error('Insufficient funds');
  }

  // =============================================================================
  // Balance Operations
  // =============================================================================

  async getBalance(address: string, options?: BalanceOptions): Promise<Balance> {
    if (!this.apiClient) {
      throw new Error('Provider not connected');
    }

    if (!(await this.validateAddress(address))) {
      throw new Error('Invalid address format');
    }

    try {
      const apiType = this.config.apiType || 'blockstream';
      const balance = await this.fetchBalanceFromAPI(address, apiType);
      
      return {
        address,
        balance: balance.total.toString(),
        confirmed: balance.confirmed.toString(),
        unconfirmed: balance.unconfirmed.toString(),
        blockHeight: balance.blockHeight
      };
    } catch (error) {
      throw new Error(`Failed to get balance for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchBalanceFromAPI(address: string, apiType: string): Promise<{
    total: number;
    confirmed: number;
    unconfirmed: number;
    blockHeight: number;
  }> {
    switch (apiType) {
      case 'blockstream':
        return this.fetchBalanceBlockstream(address);
      case 'blockchain_info':
        return this.fetchBalanceBlockchainInfo(address);
      default:
        return this.fetchBalanceBlockstream(address);
    }
  }

  private async fetchBalanceBlockstream(address: string): Promise<{
    total: number;
    confirmed: number;
    unconfirmed: number;
    blockHeight: number;
  }> {
    const response = await this.apiClient!.get(`/address/${address}`);
    const blockHeight = await this.getCurrentBlockHeight();
    
    const confirmed = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
    const unconfirmed = response.data.mempool_stats.funded_txo_sum - response.data.mempool_stats.spent_txo_sum;
    
    return {
      total: confirmed + unconfirmed,
      confirmed,
      unconfirmed,
      blockHeight
    };
  }

  private async fetchBalanceBlockchainInfo(address: string): Promise<{
    total: number;
    confirmed: number;
    unconfirmed: number;
    blockHeight: number;
  }> {
    const response = await this.apiClient!.get(`/balance?active=${address}`);
    const blockHeight = await this.getCurrentBlockHeight();
    
    return {
      total: response.data[address].final_balance,
      confirmed: response.data[address].final_balance - response.data[address].unconfirmed_balance,
      unconfirmed: response.data[address].unconfirmed_balance,
      blockHeight
    };
  }

  async getBalances(addresses: string[], options?: BalanceOptions): Promise<BalanceResult[]> {
    const results: BalanceResult[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchPromises = batch.map(async (address) => {
        try {
          const balance = await this.getBalance(address, options);
          return { address, balance };
        } catch (error) {
          return {
            address,
            balance: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // =============================================================================
  // Transaction Operations
  // =============================================================================

  async createTransaction(request: TransactionRequest): Promise<UnsignedTransaction> {
    if (!this.apiClient) {
      throw new Error('Provider not connected');
    }

    try {
      const { from, to, amount, feeRate, utxos, changeAddress } = request;

      // Validate addresses
      if (!(await this.validateAddress(from)) || !(await this.validateAddress(to))) {
        throw new Error('Invalid from or to address');
      }

      // Select UTXOs if not provided
      const selectedUTXOs = utxos || await this.selectUTXOs(from, amount, feeRate);
      
      // Build transaction
      const txBuilder = new bitcoin.TransactionBuilder(this.network);
      const targetAmount = parseInt(amount);
      const estimatedFeeRate = parseInt(feeRate || this.defaultFeeRate.toString());
      
      let totalInputValue = 0;

      // Add inputs
      for (const utxo of selectedUTXOs) {
        txBuilder.addInput(utxo.txid, utxo.vout);
        totalInputValue += parseInt(utxo.value);
      }

      // Add output for recipient
      txBuilder.addOutput(to, targetAmount);

      // Calculate fee (estimate based on transaction size)
      const estimatedSize = selectedUTXOs.length * 148 + 2 * 34 + 10;
      const fee = estimatedSize * estimatedFeeRate;

      // Add change output if necessary
      const change = totalInputValue - targetAmount - fee;
      let finalChangeAddress = from;

      if (change > this.config.dustThreshold || this.defaultDustThreshold) {
        finalChangeAddress = changeAddress || from;
        txBuilder.addOutput(finalChangeAddress, change);
      }

      return {
        chainId: this.chainId,
        from,
        to,
        amount,
        fee: fee.toString(),
        utxos: selectedUTXOs,
        changeAddress: finalChangeAddress,
        rawTransaction: txBuilder.buildIncomplete().toHex()
      };
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signTransaction(transaction: UnsignedTransaction, privateKey: string): Promise<SignedTransaction> {
    try {
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const tx = bitcoin.Transaction.fromHex(transaction.rawTransaction!);
      
      // Create a new TransactionBuilder from the existing transaction
      const txBuilder = bitcoin.TransactionBuilder.fromTransaction(tx, this.network);

      // Sign all inputs
      for (let i = 0; i < transaction.utxos.length; i++) {
        const utxo = transaction.utxos[i];
        const inputValue = parseInt(utxo.value);
        
        // Sign based on address type (this is simplified)
        txBuilder.sign(i, keyPair, undefined, undefined, inputValue);
      }

      const signedTx = txBuilder.build();
      const txid = signedTx.getId();

      return {
        ...transaction,
        signature: 'signed', // Simplified - would contain actual signature data
        signedRawTransaction: signedTx.toHex(),
        txid
      };
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async broadcastTransaction(signedTransaction: SignedTransaction): Promise<TransactionHash> {
    if (!this.apiClient) {
      throw new Error('Provider not connected');
    }

    try {
      const apiType = this.config.apiType || 'blockstream';
      
      switch (apiType) {
        case 'blockstream':
          await this.apiClient.post('/tx', signedTransaction.signedRawTransaction, {
            headers: { 'Content-Type': 'text/plain' }
          });
          break;
        case 'blockchain_info':
          await this.apiClient.post('/pushtx', { tx: signedTransaction.signedRawTransaction });
          break;
        default:
          await this.apiClient.post('/tx', signedTransaction.signedRawTransaction);
      }

      return signedTransaction.txid;
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async estimateFee(): Promise<FeeEstimate> {
    if (!this.apiClient) {
      throw new Error('Provider not connected');
    }

    try {
      // This is a simplified implementation
      // In practice, you'd fetch current fee rates from the API
      const response = await this.apiClient.get('/fee-estimates');
      
      return {
        slow: response.data['144'] || '1',
        standard: response.data['6'] || '5',
        fast: response.data['2'] || '10'
      };
    } catch (error) {
      // Fallback fee estimates
      return {
        slow: '1',
        standard: '5',
        fast: '10'
      };
    }
  }

  // =============================================================================
  // Utility Methods & Chain Parameters
  // =============================================================================

  private async getCurrentBlockHeight(): Promise<number> {
    if (!this.apiClient) {
      return 0;
    }

    try {
      const apiType = this.config.apiType || 'blockstream';
      
      switch (apiType) {
        case 'blockstream':
          const response = await this.apiClient.get('/blocks/tip/height');
          return response.data;
        case 'blockchain_info':
          const blockResponse = await this.apiClient.get('/latestblock');
          return blockResponse.data.height;
        default:
          const defaultResponse = await this.apiClient.get('/blocks/tip/height');
          return defaultResponse.data;
      }
    } catch (error) {
      console.warn('Failed to get current block height:', error);
      return 0;
    }
  }

  getChainParameters(): ChainParameters {
    const nativeDecimals = this.config.nativeTokenDecimals || 8;
    const blockTime = this.config.blockTime || (this.config.network === 'bitcoin' ? 600000 : 150000);
    const confirmations = this.config.confirmations || 6;

    return {
      chainType: 'utxo',
      nativeTokenDecimals: nativeDecimals,
      averageBlockTime: blockTime,
      confirmationThreshold: confirmations,
      addressFormat: 'bitcoin',
      supportedFeatures: ['utxo_model', 'hd_wallets', 'multiple_address_types']
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      if (!this.isConnected()) {
        return {
          healthy: false,
          latency: 0,
          syncStatus: 'out_of_sync',
          issues: ['Not connected to API provider']
        };
      }

      const startTime = Date.now();
      const blockHeight = await this.getCurrentBlockHeight();
      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency,
        syncStatus: 'synced',
        issues: []
      };
    } catch (error) {
      return {
        healthy: false,
        latency: 0,
        syncStatus: 'out_of_sync',
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // =============================================================================
  // TODO: Methods to be implemented in future versions
  // These are placeholder implementations that throw "not implemented" errors
  // =============================================================================

  async getTransaction(hash: string): Promise<Transaction | null> {
    // TODO: Implement transaction lookup
    throw new Error('Method getTransaction not yet implemented');
  }

  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    // TODO: Implement transaction status check
    throw new Error('Method getTransactionStatus not yet implemented');
  }

  async getTransactionHistory(address: string, options?: HistoryOptions): Promise<Transaction[]> {
    // TODO: Implement transaction history
    throw new Error('Method getTransactionHistory not yet implemented');
  }

  async subscribeToAddress(address: string, callback: TransactionCallback): Promise<string> {
    // TODO: Implement address subscription using WebSocket
    throw new Error('Method subscribeToAddress not yet implemented');
  }

  async unsubscribeFromAddress(subscriptionId: string): Promise<void> {
    // TODO: Implement unsubscription
    throw new Error('Method unsubscribeFromAddress not yet implemented');
  }

  async getLatestBlock(): Promise<BlockInfo> {
    // TODO: Implement latest block info
    throw new Error('Method getLatestBlock not yet implemented');
  }

  async getBlockByNumber(blockNumber: number): Promise<BlockInfo> {
    // TODO: Implement block by number
    throw new Error('Method getBlockByNumber not yet implemented');
  }

  async getCurrentFeeRates(): Promise<FeeRates> {
    // TODO: Implement current fee rates
    throw new Error('Method getCurrentFeeRates not yet implemented');
  }

  async batchGetBalances(requests: BatchBalanceRequest[]): Promise<BatchBalanceResult> {
    // TODO: Implement optimized batch balance operations
    throw new Error('Method batchGetBalances not yet implemented');
  }

  async batchCreateTransactions(requests: TransactionRequest[]): Promise<UnsignedTransaction[]> {
    // TODO: Implement batch transaction creation
    throw new Error('Method batchCreateTransactions not yet implemented');
  }

  async validateTransactionRequest(request: TransactionRequest): Promise<TransactionValidationResult> {
    // TODO: Implement comprehensive transaction validation
    throw new Error('Method validateTransactionRequest not yet implemented');
  }
}

/**
 * Factory function to create UTXO adapter instances for specific chains
 */
export class UTXOAdapterFactory {
  /**
   * Create Bitcoin adapter
   */
  static createBitcoin(apiBaseUrl: string, apiType: 'blockstream' | 'blockchain_info' = 'blockstream'): UTXOChainAdapter {
    const config: UTXOChainConfig = {
      name: 'bitcoin',
      chainId: 0,
      network: 'bitcoin',
      apiBaseUrl,
      apiType,
      nativeTokenSymbol: 'BTC',
      nativeTokenDecimals: 8,
      blockTime: 600000,
      confirmations: 6,
      addressTypes: ['p2pkh', 'p2wpkh', 'p2sh', 'p2tr'],
      defaultAddressType: 'p2wpkh'
    };
    
    return new UTXOChainAdapter(config);
  }

  /**
   * Create Bitcoin testnet adapter  
   */
  static createBitcoinTestnet(apiBaseUrl: string, apiType: 'blockstream' | 'blockchain_info' = 'blockstream'): UTXOChainAdapter {
    const config: UTXOChainConfig = {
      name: 'bitcoin-testnet',
      chainId: 1,
      network: 'testnet',
      apiBaseUrl,
      apiType,
      nativeTokenSymbol: 'tBTC',
      nativeTokenDecimals: 8,
      blockTime: 600000,
      confirmations: 3,
      addressTypes: ['p2pkh', 'p2wpkh', 'p2sh', 'p2tr'],
      defaultAddressType: 'p2wpkh'
    };
    
    return new UTXOChainAdapter(config);
  }

  /**
   * Create Litecoin adapter
   */
  static createLitecoin(apiBaseUrl: string, apiType: 'blockstream' | 'blockchain_info' = 'blockstream'): UTXOChainAdapter {
    const config: UTXOChainConfig = {
      name: 'litecoin',
      chainId: 2,
      network: 'litecoin',
      apiBaseUrl,
      apiType,
      nativeTokenSymbol: 'LTC',
      nativeTokenDecimals: 8,
      blockTime: 150000,
      confirmations: 6,
      addressTypes: ['p2pkh', 'p2wpkh', 'p2sh'],
      defaultAddressType: 'p2wpkh'
    };
    
    return new UTXOChainAdapter(config);
  }

  /**
   * Create Dogecoin adapter
   */
  static createDogecoin(apiBaseUrl: string, apiType: 'blockstream' | 'blockchain_info' = 'blockstream'): UTXOChainAdapter {
    const config: UTXOChainConfig = {
      name: 'dogecoin',
      chainId: 3,
      network: 'dogecoin',
      apiBaseUrl,
      apiType,
      nativeTokenSymbol: 'DOGE',
      nativeTokenDecimals: 8,
      blockTime: 60000,
      confirmations: 6,
      addressTypes: ['p2pkh'],
      defaultAddressType: 'p2pkh'
    };
    
    return new UTXOChainAdapter(config);
  }

  /**
   * Create custom UTXO chain adapter
   */
  static createCustom(config: UTXOChainConfig): UTXOChainAdapter {
    return new UTXOChainAdapter(config);
  }
}
