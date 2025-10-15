/**
 * Generic Chain Adapter Interface
 * 
 * This interface defines the contract that all chain adapters must implement.
 * It provides a unified API for interacting with different blockchain networks
 * regardless of their underlying technology (EVM, UTXO, etc.).
 * 
 * Design Principles:
 * - Chain-agnostic: Works for any blockchain technology
 * - Technology-neutral: Interface doesn't assume specific chain features
 * - Extensible: Allows for chain-specific extensions via options
 * - Performance-focused: Supports batch operations and async patterns
 */

export interface IChainAdapter {
  /**
   * Chain identification
   */
  readonly chainName: string;
  readonly chainId: string | number;
  readonly nativeToken: string;

  /**
   * Connection management
   */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): Promise<ConnectionStatus>;

  /**
   * Address and wallet operations
   */
  generateAddress(options: AddressGenerationOptions): Promise<WalletAddress>;
  validateAddress(address: string): Promise<boolean>;
  deriveAddresses(options: BulkAddressOptions): Promise<WalletAddress[]>;

  /**
   * Balance and asset operations
   */
  getBalance(address: string, options?: BalanceOptions): Promise<Balance>;
  getBalances(addresses: string[], options?: BalanceOptions): Promise<BalanceResult[]>;
  getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance>;
  getTokenBalances(address: string, tokenAddresses: string[]): Promise<TokenBalance[]>;

  /**
   * Transaction operations
   */
  createTransaction(request: TransactionRequest): Promise<UnsignedTransaction>;
  signTransaction(transaction: UnsignedTransaction, privateKey: string): Promise<SignedTransaction>;
  broadcastTransaction(signedTransaction: SignedTransaction): Promise<TransactionHash>;
  getTransaction(hash: string): Promise<Transaction | null>;
  getTransactionStatus(hash: string): Promise<TransactionStatus>;

  /**
   * Monitoring and history
   */
  getTransactionHistory(address: string, options?: HistoryOptions): Promise<Transaction[]>;
  subscribeToAddress(address: string, callback: TransactionCallback): Promise<string>;
  unsubscribeFromAddress(subscriptionId: string): Promise<void>;
  getLatestBlock(): Promise<BlockInfo>;
  getBlockByNumber(blockNumber: number): Promise<BlockInfo>;

  /**
   * Fee and gas operations
   */
  estimateFee(request: TransactionRequest): Promise<FeeEstimate>;
  getCurrentFeeRates(): Promise<FeeRates>;

  /**
   * Batch operations for performance
   */
  batchGetBalances(requests: BatchBalanceRequest[]): Promise<BatchBalanceResult>;
  batchCreateTransactions(requests: TransactionRequest[]): Promise<UnsignedTransaction[]>;

  /**
   * Chain-specific utilities
   */
  validateTransactionRequest(request: TransactionRequest): Promise<TransactionValidationResult>;
  getChainParameters(): ChainParameters;
  healthCheck(): Promise<HealthStatus>;
}

/**
 * Address generation options
 */
export interface AddressGenerationOptions {
  seed?: string;           // BIP39 seed phrase
  privateKey?: string;     // Direct private key
  derivationPath?: string; // BIP44 derivation path
  index?: number;         // Address index for HD wallets
  compressed?: boolean;   // For UTXO chains
}

/**
 * Generated wallet address
 */
export interface WalletAddress {
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath?: string;
  index?: number;
}

/**
 * Bulk address generation options
 */
export interface BulkAddressOptions extends AddressGenerationOptions {
  count: number;          // Number of addresses to generate
  startIndex?: number;    // Starting index for batch generation
}

/**
 * Balance query options
 */
export interface BalanceOptions {
  includeUnconfirmed?: boolean;
  minConfirmations?: number;
  blockHeight?: number;  // Query balance at specific block
}

/**
 * Balance information
 */
export interface Balance {
  address: string;
  balance: string;        // In smallest unit (wei, satoshi, etc.)
  confirmed: string;      // Confirmed balance
  unconfirmed?: string;   // Pending balance
  blockHeight: number;    // Block height when queried
}

/**
 * Batch balance result
 */
export interface BalanceResult {
  address: string;
  balance: Balance | null;
  error?: string;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  balance: string;
  balanceFormatted: string;
}

/**
 * Transaction request
 */
export interface TransactionRequest {
  from: string;
  to: string;
  amount: string;         // In smallest unit
  tokenAddress?: string;  // For token transfers
  gasPrice?: string;      // EVM chains
  gasLimit?: string;      // EVM chains
  feeRate?: number;       // UTXO chains (sat/byte)
  data?: string;          // Contract call data
  memo?: string;          // Transaction memo
  options?: ChainSpecificOptions;
}

/**
 * Unsigned transaction
 */
export interface UnsignedTransaction {
  chainId: string | number;
  from: string;
  to: string;
  amount: string;
  fee: string;
  data?: string;
  nonce?: number;
  gasPrice?: string;
  gasLimit?: string;
  rawTransaction?: string;
  hash?: string;
}

/**
 * Signed transaction
 */
export interface SignedTransaction extends UnsignedTransaction {
  signature: string;
  signedRawTransaction: string;
  txid?: string;
}

/**
 * Transaction information
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp: Date;
  tokenAddress?: string;
  tokenSymbol?: string;
  data?: string;
  memo?: string;
}

/**
 * Transaction status
 */
export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'not_found';
  confirmations: number;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  error?: string;
}

/**
 * Transaction history options
 */
export interface HistoryOptions {
  limit?: number;
  offset?: number;
  fromBlock?: number;
  toBlock?: number;
  includeTokens?: boolean;
  tokenAddress?: string;
}

/**
 * Block information
 */
export interface BlockInfo {
  number: number;
  hash: string;
  timestamp: Date;
  transactionCount: number;
  parentHash: string;
  difficulty?: string;
  gasLimit?: string;
  gasUsed?: string;
}

/**
 * Fee estimation
 */
export interface FeeEstimate {
  low: string;           // Low priority fee
  medium: string;        // Medium priority fee
  high: string;          // High priority fee
  gasPrice?: string;     // EVM chains
  gasLimit?: string;     // EVM chains
  feeRate?: number;      // UTXO chains
  totalFee: string;      // Total estimated fee
}

/**
 * Current fee rates
 */
export interface FeeRates {
  slow: string | number;
  standard: string | number;
  fast: string | number;
  instant: string | number;
  unit: string;                   // e.g., 'gwei', 'sat/byte', 'lamports', etc.
}

/**
 * Batch balance request
 */
export interface BatchBalanceRequest {
  address: string;
  tokenAddresses?: string[];
  options?: BalanceOptions;
}

/**
 * Batch balance result
 */
export interface BatchBalanceResult {
  results: BalanceResult[];
  errors: string[];
}

/**
 * Connection status
 */
export interface ConnectionStatus {
  connected: boolean;
  latency: number;
  blockHeight: number;
  syncing: boolean;
  peerCount?: number;
  networkId?: string | number;
}

/**
 * Chain parameters
 */
export interface ChainParameters {
  chainType: string;              // e.g., 'evm', 'utxo', 'cosmos', 'substrate', etc.
  nativeTokenDecimals: number;
  averageBlockTime: number;
  confirmationThreshold: number;
  maxTransactionSize?: number;
  addressFormat: string;
  supportedFeatures: ChainFeature[];
}

/**
 * Chain features
 */
export type ChainFeature = 
  | 'smart_contracts' 
  | 'tokens' 
  | 'multisig' 
  | 'memo' 
  | 'rbf'           // Replace-by-fee
  | 'batching'      // Transaction batching
  | 'delegation';   // Proof-of-stake delegation

/**
 * Health status
 */
export interface HealthStatus {
  healthy: boolean;
  latency: number;
  lastBlockTime: Date;
  syncStatus: 'synced' | 'syncing' | 'out_of_sync';
  issues: string[];
}

/**
 * Transaction validation result
 */
export interface TransactionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Chain-specific options
 */
export interface ChainSpecificOptions {
  [key: string]: unknown;
}

/**
 * Transaction callback for monitoring
 */
export type TransactionCallback = (transaction: Transaction) => void | Promise<void>;

/**
 * Transaction hash
 */
export type TransactionHash = string;

/**
 * Abstract base class for chain adapters
 * Provides common functionality and enforces interface compliance
 */
export abstract class BaseChainAdapter implements IChainAdapter {
  protected config: unknown;
  protected connection: unknown;
  
  constructor(config: unknown) {
    this.config = config;
  }

  // All interface methods must be implemented by concrete classes
  abstract readonly chainName: string;
  abstract readonly chainId: string | number;
  abstract readonly nativeToken: string;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  abstract getConnectionStatus(): Promise<ConnectionStatus>;

  abstract generateAddress(options: AddressGenerationOptions): Promise<WalletAddress>;
  abstract validateAddress(address: string): Promise<boolean>;
  abstract deriveAddresses(options: BulkAddressOptions): Promise<WalletAddress[]>;

  abstract getBalance(address: string, options?: BalanceOptions): Promise<Balance>;
  abstract getBalances(addresses: string[], options?: BalanceOptions): Promise<BalanceResult[]>;
  abstract getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance>;
  abstract getTokenBalances(address: string, tokenAddresses: string[]): Promise<TokenBalance[]>;

  abstract createTransaction(request: TransactionRequest): Promise<UnsignedTransaction>;
  abstract signTransaction(transaction: UnsignedTransaction, privateKey: string): Promise<SignedTransaction>;
  abstract broadcastTransaction(signedTransaction: SignedTransaction): Promise<TransactionHash>;
  abstract getTransaction(hash: string): Promise<Transaction | null>;
  abstract getTransactionStatus(hash: string): Promise<TransactionStatus>;

  abstract getTransactionHistory(address: string, options?: HistoryOptions): Promise<Transaction[]>;
  abstract subscribeToAddress(address: string, callback: TransactionCallback): Promise<string>;
  abstract unsubscribeFromAddress(subscriptionId: string): Promise<void>;
  abstract getLatestBlock(): Promise<BlockInfo>;
  abstract getBlockByNumber(blockNumber: number): Promise<BlockInfo>;

  abstract estimateFee(request: TransactionRequest): Promise<FeeEstimate>;
  abstract getCurrentFeeRates(): Promise<FeeRates>;

  abstract batchGetBalances(requests: BatchBalanceRequest[]): Promise<BatchBalanceResult>;
  abstract batchCreateTransactions(requests: TransactionRequest[]): Promise<UnsignedTransaction[]>;

  abstract validateTransactionRequest(request: TransactionRequest): Promise<TransactionValidationResult>;
  abstract getChainParameters(): ChainParameters;
  abstract healthCheck(): Promise<HealthStatus>;

  /**
   * Common utility methods that can be shared across implementations
   */
  protected formatBalance(balance: string, decimals: number): string {
    // Common balance formatting logic
    const divisor = Math.pow(10, decimals);
    return (parseFloat(balance) / divisor).toString();
  }

  protected validateAmount(amount: string): boolean {
    // Common amount validation
    return /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) > 0;
  }

  protected generateSubscriptionId(): string {
    // Common subscription ID generation
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
