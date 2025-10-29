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
  getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance>;
  getTokenBalances(address: string, tokenAddresses: string[]): Promise<TokenBalance[]>;
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

interface TokenBalance {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  balance: string;
  balanceFormatted: string;
}

interface TransactionRequest {
  from: string;
  to: string;
  amount: string;
  tokenAddress?: string;
  gasPrice?: string;
  gasLimit?: string;
  data?: string;
}

interface UnsignedTransaction {
  chainId: number;
  from: string;
  to: string;
  amount: string;
  fee: string;
  data?: string;
  nonce?: number;
  gasPrice?: string;
  gasLimit?: string;
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
  syncing?: boolean;
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
import { ethers } from 'ethers';

/**
 * Configuration interface for EVM chains
 */
export interface EVMChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals?: number;
  blockTime?: number;
  confirmations?: number;
  gasMultiplier?: number;
  maxGasPrice?: string;
  options?: Record<string, unknown>;
}

/**
 * EVM Chain Adapter Implementation
 * 
 * Supports Ethereum, Binance Smart Chain, Polygon, and other EVM-compatible chains.
 * Provides unified interface for all EVM operations using ethers.js v6.
 * 
 * Features:
 * - HD wallet generation (BIP44)
 * - Native and ERC-20 token support  
 * - Gas optimization and fee estimation
 * - Batch operations for high throughput
 * - Real-time transaction monitoring
 * - Comprehensive error handling
 */
export class EVMChainAdapter implements IChainAdapter {
  private provider: ethers.JsonRpcProvider | null = null;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private connected = false;
  
  // Chain-specific configurations
  private readonly defaultGasLimit = 21000;
  private readonly erc20TransferGasLimit = 65000;
  
  constructor(private readonly config: EVMChainConfig) {
    // Validate configuration
    if (!config.name || !config.chainId || !config.rpcUrl || !config.nativeTokenSymbol) {
      throw new Error('Invalid EVM chain configuration: name, chainId, rpcUrl, and nativeTokenSymbol are required');
    }
  }

  // =============================================================================
  // Chain Properties
  // =============================================================================

  get chainName(): string {
    return this.config.name;
  }

  get chainId(): number {
    return this.config.chainId;
  }

  get nativeToken(): string {
    return this.config.nativeTokenSymbol;
  }

  // =============================================================================
  // Connection Management
  // =============================================================================

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Initialize HTTP provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      // Initialize WebSocket provider if available
      if (this.config.wsUrl) {
        this.wsProvider = new ethers.WebSocketProvider(this.config.wsUrl);
      }
      
      // Test connection by getting network info
      const network = await this.provider.getNetwork();
      
      // Verify chain ID matches
      if (Number(network.chainId) !== this.config.chainId) {
        throw new Error(`Chain ID mismatch: expected ${this.config.chainId}, got ${network.chainId}`);
      }
      
      this.connected = true;
    } catch (error) {
      this.provider = null;
      this.wsProvider = null;
      throw new Error(`Failed to connect to ${this.config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      // Clean up WebSocket provider
      if (this.wsProvider) {
        await this.wsProvider.destroy();
        this.wsProvider = null;
      }
      
      // Clean up HTTP provider
      this.provider = null;
      this.connected = false;
    } catch (error) {
      console.warn(`Error during disconnect from ${this.config.name}:`, error);
    }
  }

  isConnected(): boolean {
    return this.connected && this.provider !== null;
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    if (!this.isConnected() || !this.provider) {
      return {
        connected: false,
        latency: 0,
        blockHeight: 0,
        syncing: false,
        networkId: this.config.chainId
      };
    }

    try {
      const startTime = Date.now();
      const [network, blockHeight] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber()
      ]);
      const latency = Date.now() - startTime;

      return {
        connected: true,
        latency,
        blockHeight,
        syncing: false, // EVM chains don't typically expose sync status via standard RPC
        networkId: Number(network.chainId)
      };
    } catch (error) {
      return {
        connected: false,
        latency: 0,
        blockHeight: 0,
        syncing: false,
        networkId: this.config.chainId
      };
    }
  }

  // =============================================================================
  // Address and Wallet Operations
  // =============================================================================

  async generateAddress(options: AddressGenerationOptions): Promise<WalletAddress> {
    const { seed, privateKey, derivationPath, index = 0 } = options;

    try {
      let wallet: ethers.HDNodeWallet | ethers.Wallet;
      let finalDerivationPath: string;

      if (privateKey) {
        // Generate from private key directly
        wallet = new ethers.Wallet(privateKey);
        finalDerivationPath = 'direct';
        
        return {
          address: wallet.address,
          privateKey: wallet.privateKey,
          publicKey: '', // Wallet type doesn't expose public key directly
          derivationPath: finalDerivationPath,
          index
        };
      } else if (seed) {
        // Generate from seed with HD derivation (BIP44 standard for Ethereum)
        const hdNode = ethers.HDNodeWallet.fromPhrase(seed);
        const basePath = derivationPath || `m/44'/60'/0'/0`;
        finalDerivationPath = `${basePath}/${index}`;
        wallet = hdNode.derivePath(finalDerivationPath);
        
        return {
          address: wallet.address,
          privateKey: wallet.privateKey,
          publicKey: wallet.publicKey,
          derivationPath: finalDerivationPath,
          index
        };
      } else {
        throw new Error('Either seed or privateKey must be provided');
      }
    } catch (error) {
      throw new Error(`Failed to generate address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  async deriveAddresses(options: BulkAddressOptions): Promise<WalletAddress[]> {
    const { seed, count, startIndex = 0, derivationPath } = options;
    const addresses: WalletAddress[] = [];

    if (!seed) {
      throw new Error('Seed is required for bulk address derivation');
    }

    try {
      const hdNode = ethers.HDNodeWallet.fromPhrase(seed);
      const basePath = derivationPath || "m/44'/60'/0'/0"; // BIP44 standard for Ethereum

      for (let i = 0; i < count; i++) {
        const index = startIndex + i;
        const fullPath = `${basePath}/${index}`;
        const derivedWallet = hdNode.derivePath(fullPath);

        addresses.push({
          address: derivedWallet.address,
          privateKey: derivedWallet.privateKey,
          publicKey: derivedWallet.publicKey,
          derivationPath: fullPath,
          index
        });
      }

      return addresses;
    } catch (error) {
      throw new Error(`Failed to derive addresses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // Balance Operations
  // =============================================================================

  async getBalance(address: string, options?: BalanceOptions): Promise<Balance> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    try {
      const [balance, blockHeight] = await Promise.all([
        this.provider.getBalance(address, options?.blockHeight ? Number(options.blockHeight) : 'latest'),
        this.provider.getBlockNumber()
      ]);

      return {
        address,
        balance: balance.toString(),
        confirmed: balance.toString(),
        unconfirmed: '0', // EVM doesn't distinguish pending balance in standard way
        blockHeight
      };
    } catch (error) {
      throw new Error(`Failed to get balance for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalances(addresses: string[], options?: BalanceOptions): Promise<BalanceResult[]> {
    const results: BalanceResult[] = [];

    // Process in batches to avoid RPC rate limits
    const batchSize = 10;
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

  async getTokenBalance(address: string, tokenAddress: string): Promise<TokenBalance> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    if (!ethers.isAddress(address) || !ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid address format');
    }

    try {
      // Standard ERC-20 contract ABI for balance and metadata queries
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      
      // Parallel execution for better performance
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf!(address),
        contract.decimals!(),
        contract.symbol!()
      ]);

      const balanceFormatted = ethers.formatUnits(balance, decimals);

      return {
        tokenAddress,
        tokenSymbol: symbol,
        tokenDecimals: Number(decimals),
        balance: balance.toString(),
        balanceFormatted
      };
    } catch (error) {
      throw new Error(`Failed to get token balance for ${address} (token: ${tokenAddress}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTokenBalances(address: string, tokenAddresses: string[]): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];

    // Process in smaller batches for token calls (more expensive)
    const batchSize = 5;
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
      const batch = tokenAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map(async (tokenAddress) => {
        try {
          return await this.getTokenBalance(address, tokenAddress);
        } catch (error) {
          console.warn(`Failed to get balance for token ${tokenAddress}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      balances.push(...batchResults.filter(Boolean) as TokenBalance[]);
    }

    return balances;
  }

  // =============================================================================
  // Transaction Operations
  // =============================================================================

  async createTransaction(request: TransactionRequest): Promise<UnsignedTransaction> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const { from, to, amount, tokenAddress, gasPrice, gasLimit, data } = request;

      // Validate addresses
      if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        throw new Error('Invalid from or to address');
      }

      let txData = data || '0x';
      let txValue = '0';
      let estimatedGas = this.defaultGasLimit;

      if (tokenAddress) {
        // ERC-20 token transfer
        if (!ethers.isAddress(tokenAddress)) {
          throw new Error('Invalid token address');
        }
        
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const iface = new ethers.Interface(erc20Abi);
        txData = iface.encodeFunctionData('transfer', [to, amount]);
        txValue = '0';
        estimatedGas = this.erc20TransferGasLimit;
      } else {
        // Native token transfer
        txValue = amount;
      }

      // Get current gas price if not provided
      const feeData = await this.provider.getFeeData();
      const currentGasPrice = gasPrice || feeData.gasPrice?.toString() || '20000000000'; // 20 gwei fallback

      // Estimate gas if not provided
      let finalGasLimit = gasLimit || estimatedGas.toString();
      
      if (!gasLimit) {
        try {
          const estimatedGasFromRPC = await this.provider.estimateGas({
            from,
            to: tokenAddress || to,
            value: txValue,
            data: txData
          });
          finalGasLimit = estimatedGasFromRPC.toString();
        } catch (error) {
          // Use default if estimation fails
          console.warn('Gas estimation failed, using default:', error);
        }
      }

      // Get nonce
      const nonce = await this.provider.getTransactionCount(from, 'pending');

      // Calculate total fee
      const fee = (BigInt(finalGasLimit) * BigInt(currentGasPrice)).toString();

      return {
        chainId: this.config.chainId,
        from,
        to: tokenAddress || to,
        amount: txValue,
        fee,
        data: txData,
        nonce,
        gasPrice: currentGasPrice,
        gasLimit: finalGasLimit
      };
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signTransaction(transaction: UnsignedTransaction, privateKey: string): Promise<SignedTransaction> {
    try {
      const wallet = new ethers.Wallet(privateKey);

      const txRequest = {
        to: transaction.to,
        value: transaction.amount,
        gasLimit: transaction.gasLimit || null,
        gasPrice: transaction.gasPrice || null,
        nonce: transaction.nonce || null,
        data: transaction.data || null,
        chainId: this.config.chainId
      };

      const signedTx = await wallet.signTransaction(txRequest);
      
      // Parse the signed transaction to get hash and other details
      const parsedTx = ethers.Transaction.from(signedTx);

      return {
        ...transaction,
        signature: `${parsedTx.signature?.r}${parsedTx.signature?.s}${parsedTx.signature?.v}`, 
        signedRawTransaction: signedTx,
        txid: parsedTx.hash || ''
      };
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async broadcastTransaction(signedTransaction: SignedTransaction): Promise<TransactionHash> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const response = await this.provider.broadcastTransaction(signedTransaction.signedRawTransaction);
      return response.hash;
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // Utility Methods & Chain Parameters
  // =============================================================================

  getChainParameters(): ChainParameters {
    const nativeDecimals = this.config.nativeTokenDecimals || 18;
    const blockTime = this.config.blockTime || (this.config.name === 'ethereum' ? 12000 : 3000);
    const confirmations = this.config.confirmations || (this.config.name === 'ethereum' ? 12 : 20);

    return {
      chainType: 'evm',
      nativeTokenDecimals: nativeDecimals,
      averageBlockTime: blockTime,
      confirmationThreshold: confirmations,
      addressFormat: 'ethereum',
      supportedFeatures: ['smart_contracts', 'tokens', 'batching']
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      if (!this.isConnected()) {
        return {
          healthy: false,
          latency: 0,
          lastBlockTime: new Date(),
          syncStatus: 'out_of_sync',
          issues: ['Not connected to provider']
        };
      }

      const startTime = Date.now();
      const blockNumber = await this.provider!.getBlockNumber();
      const latency = Date.now() - startTime;

      // Get latest block to check timestamp
      const latestBlock = await this.provider!.getBlock('latest');
      const lastBlockTime = new Date(latestBlock!.timestamp * 1000);

      return {
        healthy: true,
        latency,
        lastBlockTime,
        syncStatus: 'synced',
        issues: []
      };
    } catch (error) {
      return {
        healthy: false,
        latency: 0,
        lastBlockTime: new Date(),
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
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const tx = await this.provider.getTransaction(hash);
      if (!tx) {
        return null;
      }

      const receipt = await this.provider.getTransactionReceipt(hash);
      const currentBlock = await this.provider.getBlockNumber();
      
      const transaction: Transaction = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        amount: tx.value.toString(),
        fee: receipt ? (BigInt(receipt.gasUsed) * BigInt(tx.gasPrice || '0')).toString() : '0',
        confirmations: receipt ? currentBlock - receipt.blockNumber + 1 : 0,
        timestamp: receipt ? new Date((await this.provider.getBlock(receipt.blockNumber))!.timestamp * 1000) : new Date(),
        status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending'
      };

      if (receipt?.blockNumber !== undefined) {
        transaction.blockHeight = receipt.blockNumber;
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to get transaction ${hash}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(hash),
        this.provider.getTransactionReceipt(hash)
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      let status: 'pending' | 'confirmed' | 'failed';
      let confirmations = 0;
      let blockHeight: number | undefined;
      let timestamp: Date | undefined;

      if (receipt) {
        const currentBlock = await this.provider.getBlockNumber();
        confirmations = currentBlock - receipt.blockNumber + 1;
        blockHeight = receipt.blockNumber;
        status = receipt.status === 1 ? 'confirmed' : 'failed';
        
        const block = await this.provider.getBlock(receipt.blockNumber);
        timestamp = new Date(block!.timestamp * 1000);
      } else {
        status = 'pending';
      }

      const transactionStatus: TransactionStatus = {
        hash,
        status,
        confirmations
      };

      if (blockHeight !== undefined) {
        transactionStatus.blockHeight = blockHeight;
      }

      if (timestamp !== undefined) {
        transactionStatus.timestamp = timestamp;
      }

      return transactionStatus;
    } catch (error) {
      throw new Error(`Failed to get transaction status for ${hash}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTransactionHistory(address: string, options?: HistoryOptions): Promise<Transaction[]> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    try {
      // Note: This is a basic implementation using event logs
      // For production, you'd want to use a blockchain indexer API like Alchemy, Infura, or Moralis
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks
      
      const sentFilter = {
        fromBlock: startBlock,
        toBlock: 'latest',
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          ethers.zeroPadValue(address, 32)
        ]
      };

      const receivedFilter = {
        fromBlock: startBlock, 
        toBlock: 'latest',
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          null,
          ethers.zeroPadValue(address, 32)
        ]
      };

      const [sentLogs, receivedLogs] = await Promise.all([
        this.provider.getLogs(sentFilter),
        this.provider.getLogs(receivedFilter)
      ]);

      const allLogs = [...sentLogs, ...receivedLogs];
      const transactions: Transaction[] = [];

      // Process logs to build transaction history
      for (const log of allLogs.slice(0, options?.limit || 50)) {
        try {
          const tx = await this.provider.getTransaction(log.transactionHash);
          const receipt = await this.provider.getTransactionReceipt(log.transactionHash);
          const block = await this.provider.getBlock(log.blockNumber);
          
          if (tx && receipt && block) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to || '',
              amount: tx.value.toString(),
              fee: (BigInt(receipt.gasUsed) * BigInt(tx.gasPrice || '0')).toString(),
              blockHeight: receipt.blockNumber,
              confirmations: currentBlock - receipt.blockNumber + 1,
              timestamp: new Date(block.timestamp * 1000),
              status: receipt.status === 1 ? 'confirmed' : 'failed'
            });
          }
        } catch (error) {
          console.warn(`Failed to process log for tx ${log.transactionHash}:`, error);
        }
      }

      // Sort by timestamp descending and apply filters
      let filteredTransactions = transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (options?.startDate) {
        filteredTransactions = filteredTransactions.filter(tx => tx.timestamp >= options.startDate!);
      }

      if (options?.endDate) {
        filteredTransactions = filteredTransactions.filter(tx => tx.timestamp <= options.endDate!);
      }

      return filteredTransactions.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50));
    } catch (error) {
      throw new Error(`Failed to get transaction history for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async subscribeToAddress(address: string, callback: TransactionCallback): Promise<string> {
    if (!this.wsProvider) {
      throw new Error('WebSocket provider not available for subscriptions');
    }

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    try {
      // Create a unique subscription ID
      const subscriptionId = `addr_${address}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Subscribe to pending transactions involving this address
      const filter = {
        address: null, // Listen to all contracts
        topics: [
          null, // Any event
          [ethers.zeroPadValue(address, 32), null], // Either from or to this address
          [null, ethers.zeroPadValue(address, 32)]
        ]
      };

      // Listen for new blocks and check transactions
      this.wsProvider.on('block', async (blockNumber: number) => {
        try {
          const block = await this.wsProvider!.getBlock(blockNumber, true);
          if (!block || !block.transactions) return;

          for (const tx of block.transactions) {
            if (typeof tx === 'string') continue; // Skip transaction hashes, we need full objects
            
            const txObj = tx as any;
            if (txObj.from === address || txObj.to === address) {
              const receipt = await this.wsProvider!.getTransactionReceipt(txObj.hash);
              const transaction: Transaction = {
                hash: txObj.hash,
                from: txObj.from,
                to: txObj.to || '',
                amount: txObj.value.toString(),
                fee: receipt ? (BigInt(receipt.gasUsed) * BigInt(txObj.gasPrice || '0')).toString() : '0',
                blockHeight: blockNumber,
                confirmations: 1,
                timestamp: new Date(block.timestamp * 1000),
                status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending'
              };

              callback(transaction);
            }
          }
        } catch (error) {
          console.warn('Error processing block for subscription:', error);
        }
      });

      return subscriptionId;
    } catch (error) {
      throw new Error(`Failed to subscribe to address ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async unsubscribeFromAddress(subscriptionId: string): Promise<void> {
    if (!this.wsProvider) {
      throw new Error('WebSocket provider not available');
    }

    try {
      // Remove all listeners (simplified implementation)
      // In a production system, you'd track individual subscriptions
      this.wsProvider.removeAllListeners('block');
    } catch (error) {
      throw new Error(`Failed to unsubscribe ${subscriptionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLatestBlock(): Promise<BlockInfo> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const block = await this.provider.getBlock('latest');
      if (!block) {
        throw new Error('Unable to fetch latest block');
      }

      return {
        number: block.number,
        hash: block.hash || '',
        timestamp: new Date(block.timestamp * 1000),
        transactionCount: block.transactions.length
      };
    } catch (error) {
      throw new Error(`Failed to get latest block: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBlockByNumber(blockNumber: number): Promise<BlockInfo> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const block = await this.provider.getBlock(blockNumber);
      if (!block) {
        throw new Error(`Block ${blockNumber} not found`);
      }

      return {
        number: block.number,
        hash: block.hash || '',
        timestamp: new Date(block.timestamp * 1000),
        transactionCount: block.transactions.length
      };
    } catch (error) {
      throw new Error(`Failed to get block ${blockNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async estimateFee(request: TransactionRequest): Promise<FeeEstimate> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const { from, to, amount, tokenAddress, data } = request;

      // Validate addresses
      if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        throw new Error('Invalid from or to address');
      }

      let txData = data || '0x';
      let txValue = '0';

      if (tokenAddress) {
        // ERC-20 token transfer
        if (!ethers.isAddress(tokenAddress)) {
          throw new Error('Invalid token address');
        }
        
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const iface = new ethers.Interface(erc20Abi);
        txData = iface.encodeFunctionData('transfer', [to, amount]);
        txValue = '0';
      } else {
        // Native token transfer
        txValue = amount;
      }

      // Get current fee data
      const feeData = await this.provider.getFeeData();
      
      // Estimate gas
      const estimatedGas = await this.provider.estimateGas({
        from,
        to: tokenAddress || to,
        value: txValue,
        data: txData
      });

      // Get base fee per gas (for EIP-1559 chains)
      const baseFeePerGas = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Calculate fee estimates (slow, standard, fast)
      const slowGasPrice = baseFeePerGas;
      const standardGasPrice = (BigInt(baseFeePerGas) * BigInt(120)) / BigInt(100); // 20% higher
      const fastGasPrice = (BigInt(baseFeePerGas) * BigInt(150)) / BigInt(100); // 50% higher

      return {
        slow: (BigInt(estimatedGas) * BigInt(slowGasPrice)).toString(),
        standard: (BigInt(estimatedGas) * BigInt(standardGasPrice)).toString(),
        fast: (BigInt(estimatedGas) * BigInt(fastGasPrice)).toString()
      };
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentFeeRates(): Promise<FeeRates> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const feeData = await this.provider.getFeeData();
      const baseFeePerGas = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Return fee rates in gwei (gas price per unit)
      const slowRate = ethers.formatUnits(baseFeePerGas, 'gwei');
      const standardRate = ethers.formatUnits((BigInt(baseFeePerGas) * BigInt(120)) / BigInt(100), 'gwei');
      const fastRate = ethers.formatUnits((BigInt(baseFeePerGas) * BigInt(150)) / BigInt(100), 'gwei');

      return {
        slow: slowRate,
        standard: standardRate,
        fast: fastRate
      };
    } catch (error) {
      throw new Error(`Failed to get current fee rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchGetBalances(requests: BatchBalanceRequest[]): Promise<BatchBalanceResult> {
    const results: BalanceResult[] = [];
    const errors: string[] = [];

    try {
      // Process all requests in parallel batches
      const batchSize = 5; // Smaller batches for balance requests
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (request) => {
          try {
            return await this.getBalances(request.addresses, request.options);
          } catch (error) {
            const errorMsg = `Batch ${i / batchSize + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        // Flatten results from all batches
        for (const batchResult of batchResults) {
          results.push(...batchResult);
        }
      }

      return {
        results,
        errors
      };
    } catch (error) {
      return {
        results: [],
        errors: [`Failed to process batch balance requests: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async batchCreateTransactions(requests: TransactionRequest[]): Promise<UnsignedTransaction[]> {
    const transactions: UnsignedTransaction[] = [];

    try {
      // Process requests in smaller batches to avoid overwhelming the RPC
      const batchSize = 10;
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (request) => {
          try {
            return await this.createTransaction(request);
          } catch (error) {
            throw new Error(`Transaction ${i + batch.indexOf(request) + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        const batchResults = await Promise.all(batchPromises);
        transactions.push(...batchResults);
      }

      return transactions;
    } catch (error) {
      throw new Error(`Failed to create batch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateTransactionRequest(request: TransactionRequest): Promise<TransactionValidationResult> {
    const errors: string[] = [];

    try {
      const { from, to, amount, tokenAddress, gasPrice, gasLimit } = request;

      // Validate addresses
      if (!from) {
        errors.push('From address is required');
      } else if (!ethers.isAddress(from)) {
        errors.push('Invalid from address format');
      }

      if (!to) {
        errors.push('To address is required');
      } else if (!ethers.isAddress(to)) {
        errors.push('Invalid to address format');
      }

      if (!amount) {
        errors.push('Amount is required');
      } else {
        try {
          const amountBigInt = BigInt(amount);
          if (amountBigInt < 0) {
            errors.push('Amount cannot be negative');
          }
        } catch {
          errors.push('Invalid amount format');
        }
      }

      // Validate token address if provided
      if (tokenAddress && !ethers.isAddress(tokenAddress)) {
        errors.push('Invalid token address format');
      }

      // Validate gas price if provided
      if (gasPrice) {
        try {
          const gasPriceBigInt = BigInt(gasPrice);
          if (gasPriceBigInt <= 0) {
            errors.push('Gas price must be positive');
          }
        } catch {
          errors.push('Invalid gas price format');
        }
      }

      // Validate gas limit if provided
      if (gasLimit) {
        try {
          const gasLimitBigInt = BigInt(gasLimit);
          if (gasLimitBigInt <= 0) {
            errors.push('Gas limit must be positive');
          }
          if (gasLimitBigInt > 30000000) { // Reasonable upper limit
            errors.push('Gas limit too high');
          }
        } catch {
          errors.push('Invalid gas limit format');
        }
      }

      // Additional validation if provider is available
      if (this.provider && errors.length === 0) {
        try {
          // Check if from address has sufficient balance
          const balance = await this.provider.getBalance(from);
          const requiredAmount = tokenAddress ? BigInt(0) : BigInt(amount);
          
          if (balance < requiredAmount) {
            errors.push('Insufficient balance for transaction');
          }

          // For token transfers, check token balance
          if (tokenAddress) {
            try {
              const tokenBalance = await this.getTokenBalance(from, tokenAddress);
              if (BigInt(tokenBalance.balance) < BigInt(amount)) {
                errors.push('Insufficient token balance');
              }
            } catch (error) {
              errors.push('Unable to verify token balance');
            }
          }
        } catch (error) {
          errors.push('Unable to verify account balance');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

/**
 * Factory function to create EVM adapter instances for specific chains
 */
export class EVMAdapterFactory {
  /**
   * Create Ethereum adapter
   */
  static createEthereum(rpcUrl: string, wsUrl?: string): EVMChainAdapter {
    const config: EVMChainConfig = {
      name: 'ethereum',
      chainId: 1,
      rpcUrl,
      nativeTokenSymbol: 'ETH',
      nativeTokenDecimals: 18,
      blockTime: 12000,
      confirmations: 12
    };
    
    if (wsUrl) {
      config.wsUrl = wsUrl;
    }
    
    return new EVMChainAdapter(config);
  }

  /**
   * Create Binance Smart Chain adapter  
   */
  static createBSC(rpcUrl: string, wsUrl?: string): EVMChainAdapter {
    const config: EVMChainConfig = {
      name: 'binance-smart-chain',
      chainId: 56,
      rpcUrl,
      nativeTokenSymbol: 'BNB',
      nativeTokenDecimals: 18,
      blockTime: 3000,
      confirmations: 20
    };
    
    if (wsUrl) {
      config.wsUrl = wsUrl;
    }
    
    return new EVMChainAdapter(config);
  }

  /**
   * Create Polygon adapter
   */
  static createPolygon(rpcUrl: string, wsUrl?: string): EVMChainAdapter {
    const config: EVMChainConfig = {
      name: 'polygon',
      chainId: 137,
      rpcUrl,
      nativeTokenSymbol: 'MATIC',
      nativeTokenDecimals: 18,
      blockTime: 2000,
      confirmations: 30
    };
    
    if (wsUrl) {
      config.wsUrl = wsUrl;
    }
    
    return new EVMChainAdapter(config);
  }

  /**
   * Create custom EVM chain adapter
   */
  static createCustom(config: EVMChainConfig): EVMChainAdapter {
    return new EVMChainAdapter(config);
  }
}
