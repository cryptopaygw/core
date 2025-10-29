/**
 * Wallet Monitor System
 * 
 * Real-time cryptocurrency wallet monitoring system that tracks:
 * - Incoming transactions across multiple chains
 * - Balance changes and notifications
 * - Transaction confirmations
 * - Multi-wallet portfolio tracking
 * - Event-driven architecture with webhooks
 */

import { EventEmitter } from 'events';
import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface WalletMonitorConfig {
  // Polling intervals (in milliseconds)
  balanceCheckInterval: number;
  transactionCheckInterval: number;
  confirmationThreshold: number;
  
  // Notification settings
  webhookUrl?: string;
  emailNotifications?: boolean;
  slackWebhook?: string;
  
  // Performance settings
  maxConcurrentChecks: number;
  retryAttempts: number;
  retryDelay: number;
  
  // Chain configurations
  evmChains: EVMChainConfig[];
  utxoChains: UTXOChainConfig[];
}

interface EVMChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  nativeTokenSymbol: string;
}

interface UTXOChainConfig {
  name: string;
  network: 'bitcoin' | 'litecoin' | 'testnet';
  apiBaseUrl: string;
  nativeTokenSymbol: string;
}

export interface WalletConfig {
  id: string;
  address: string;
  chainType: 'evm' | 'utxo';
  chainName: string;
  label?: string;
  threshold?: string; // Minimum amount to trigger notification
  tokens?: string[]; // Token addresses to monitor (EVM only)
}

export interface TransactionEvent {
  walletId: string;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  token?: string;
  tokenSymbol?: string;
  blockHeight: number;
  confirmations: number;
  timestamp: Date;
  chainName: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'confirmed' | 'failed';
}

export interface BalanceChangeEvent {
  walletId: string;
  address: string;
  chainName: string;
  previousBalance: string;
  currentBalance: string;
  difference: string;
  token?: string;
  tokenSymbol?: string;
  timestamp: Date;
}

export interface NotificationConfig {
  type: 'webhook' | 'email' | 'slack' | 'console';
  endpoint?: string;
  template?: string;
  enabled: boolean;
}

// =============================================================================
// Wallet Monitor Implementation
// =============================================================================

export class WalletMonitor extends EventEmitter {
  private config: WalletMonitorConfig;
  private wallets: Map<string, WalletConfig> = new Map();
  private adapters: Map<string, any> = new Map();
  private balanceCache: Map<string, string> = new Map();
  private transactionCache: Map<string, Set<string>> = new Map();
  private monitoring = false;
  private intervals: NodeJS.Timeout[] = [];
  private notifications: NotificationConfig[] = [];

  constructor(config: WalletMonitorConfig) {
    super();
    this.config = config;
    this.setupNotifications();
  }

  // =============================================================================
  // Initialization and Setup
  // =============================================================================

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Wallet Monitor System...');

    try {
      // Initialize EVM adapters
      for (const chainConfig of this.config.evmChains) {
        const adapter = EVMAdapterFactory.createCustom(chainConfig);
        await adapter.connect();
        this.adapters.set(chainConfig.name, adapter);
        console.log(`✅ Connected to ${chainConfig.name} (EVM)`);
      }

      // Initialize UTXO adapters
      for (const chainConfig of this.config.utxoChains) {
        const adapter = UTXOAdapterFactory.createCustom(chainConfig);
        await adapter.connect();
        this.adapters.set(chainConfig.name, adapter);
        console.log(`✅ Connected to ${chainConfig.name} (UTXO)`);
      }

      console.log('🎯 Wallet Monitor System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Wallet Monitor:', error);
      throw error;
    }
  }

  private setupNotifications(): void {
    // Setup default console notifications
    this.notifications.push({
      type: 'console',
      enabled: true
    });

    // Setup webhook notifications if configured
    if (this.config.webhookUrl) {
      this.notifications.push({
        type: 'webhook',
        endpoint: this.config.webhookUrl,
        enabled: true
      });
    }

    // Setup Slack notifications if configured
    if (this.config.slackWebhook) {
      this.notifications.push({
        type: 'slack',
        endpoint: this.config.slackWebhook,
        enabled: true
      });
    }
  }

  // =============================================================================
  // Wallet Management
  // =============================================================================

  addWallet(wallet: WalletConfig): void {
    this.wallets.set(wallet.id, wallet);
    
    // Initialize balance cache
    const cacheKey = `${wallet.chainName}:${wallet.address}`;
    this.balanceCache.set(cacheKey, '0');
    this.transactionCache.set(wallet.id, new Set());

    console.log(`📝 Added wallet: ${wallet.label || wallet.id} (${wallet.address})`);
    this.emit('walletAdded', wallet);
  }

  removeWallet(walletId: string): void {
    const wallet = this.wallets.get(walletId);
    if (wallet) {
      this.wallets.delete(walletId);
      
      // Clean up cache
      const cacheKey = `${wallet.chainName}:${wallet.address}`;
      this.balanceCache.delete(cacheKey);
      this.transactionCache.delete(walletId);

      console.log(`🗑️ Removed wallet: ${walletId}`);
      this.emit('walletRemoved', { walletId, wallet });
    }
  }

  getWallets(): WalletConfig[] {
    return Array.from(this.wallets.values());
  }

  getWallet(walletId: string): WalletConfig | undefined {
    return this.wallets.get(walletId);
  }

  // =============================================================================
  // Monitoring Control
  // =============================================================================

  async startMonitoring(): Promise<void> {
    if (this.monitoring) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    this.monitoring = true;
    console.log('🎯 Starting wallet monitoring...');

    // Start balance monitoring
    const balanceInterval = setInterval(
      () => this.checkBalances(),
      this.config.balanceCheckInterval
    );
    this.intervals.push(balanceInterval);

    // Start transaction monitoring  
    const transactionInterval = setInterval(
      () => this.checkTransactions(),
      this.config.transactionCheckInterval
    );
    this.intervals.push(transactionInterval);

    // Perform initial checks
    await this.checkBalances();
    await this.checkTransactions();

    console.log('✅ Wallet monitoring started');
    this.emit('monitoringStarted');
  }

  stopMonitoring(): void {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    console.log('🔴 Wallet monitoring stopped');
    this.emit('monitoringStopped');
  }

  isMonitoring(): boolean {
    return this.monitoring;
  }

  // =============================================================================
  // Balance Monitoring
  // =============================================================================

  private async checkBalances(): Promise<void> {
    if (!this.monitoring) return;

    const promises = Array.from(this.wallets.values()).map(wallet =>
      this.checkWalletBalance(wallet).catch(error => {
        console.error(`❌ Balance check failed for ${wallet.id}:`, error.message);
      })
    );

    await Promise.allSettled(promises);
  }

  private async checkWalletBalance(wallet: WalletConfig): Promise<void> {
    const adapter = this.adapters.get(wallet.chainName);
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${wallet.chainName}`);
    }

    const cacheKey = `${wallet.chainName}:${wallet.address}`;
    const previousBalance = this.balanceCache.get(cacheKey) || '0';

    try {
      // Get native token balance
      const balance = await adapter.getBalance(wallet.address);
      const currentBalance = balance.balance;

      // Check for balance changes
      if (currentBalance !== previousBalance) {
        this.balanceCache.set(cacheKey, currentBalance);
        
        const balanceChange: BalanceChangeEvent = {
          walletId: wallet.id,
          address: wallet.address,
          chainName: wallet.chainName,
          previousBalance,
          currentBalance,
          difference: (parseFloat(currentBalance) - parseFloat(previousBalance)).toString(),
          timestamp: new Date()
        };

        this.emit('balanceChange', balanceChange);
        await this.sendNotification('balanceChange', balanceChange);
      }

      // Check token balances (EVM only)
      if (wallet.chainType === 'evm' && wallet.tokens) {
        for (const tokenAddress of wallet.tokens) {
          await this.checkTokenBalance(wallet, tokenAddress, adapter);
        }
      }

    } catch (error) {
      console.error(`❌ Failed to check balance for ${wallet.id}:`, error);
    }
  }

  private async checkTokenBalance(wallet: WalletConfig, tokenAddress: string, adapter: any): Promise<void> {
    const cacheKey = `${wallet.chainName}:${wallet.address}:${tokenAddress}`;
    const previousBalance = this.balanceCache.get(cacheKey) || '0';

    try {
      const tokenBalance = await adapter.getTokenBalance(wallet.address, tokenAddress);
      const currentBalance = tokenBalance.balance;

      if (currentBalance !== previousBalance) {
        this.balanceCache.set(cacheKey, currentBalance);
        
        const balanceChange: BalanceChangeEvent = {
          walletId: wallet.id,
          address: wallet.address,
          chainName: wallet.chainName,
          previousBalance,
          currentBalance,
          difference: (parseFloat(currentBalance) - parseFloat(previousBalance)).toString(),
          token: tokenAddress,
          tokenSymbol: tokenBalance.tokenSymbol,
          timestamp: new Date()
        };

        this.emit('tokenBalanceChange', balanceChange);
        await this.sendNotification('tokenBalanceChange', balanceChange);
      }
    } catch (error) {
      console.error(`❌ Failed to check token balance for ${wallet.id}:`, error);
    }
  }

  // =============================================================================
  // Transaction Monitoring  
  // =============================================================================

  private async checkTransactions(): Promise<void> {
    if (!this.monitoring) return;

    const promises = Array.from(this.wallets.values()).map(wallet =>
      this.checkWalletTransactions(wallet).catch(error => {
        console.error(`❌ Transaction check failed for ${wallet.id}:`, error.message);
      })
    );

    await Promise.allSettled(promises);
  }

  private async checkWalletTransactions(wallet: WalletConfig): Promise<void> {
    // Note: This is a simplified implementation
    // In a real system, you would use WebSocket connections or event logs
    // to monitor for new transactions more efficiently
    
    console.log(`🔍 Checking transactions for wallet ${wallet.id} (${wallet.address})`);
    
    // For demonstration, we'll simulate finding a new transaction
    // In reality, you'd query the blockchain for recent transactions
    
    // Emit mock transaction event for demonstration
    if (Math.random() < 0.1) { // 10% chance of "finding" a transaction
      const mockTransaction: TransactionEvent = {
        walletId: wallet.id,
        txHash: '0x' + Math.random().toString(16).substring(2, 66),
        from: '0x' + Math.random().toString(16).substring(2, 42),
        to: wallet.address,
        amount: (Math.random() * 10).toFixed(6),
        blockHeight: Math.floor(Math.random() * 1000000),
        confirmations: Math.floor(Math.random() * 20),
        timestamp: new Date(),
        chainName: wallet.chainName,
        type: 'incoming',
        status: 'confirmed'
      };

      this.emit('newTransaction', mockTransaction);
      await this.sendNotification('newTransaction', mockTransaction);
    }
  }

  // =============================================================================
  // Notification System
  // =============================================================================

  private async sendNotification(eventType: string, data: any): Promise<void> {
    for (const notification of this.notifications) {
      if (!notification.enabled) continue;

      try {
        await this.deliverNotification(notification, eventType, data);
      } catch (error) {
        console.error(`❌ Failed to send ${notification.type} notification:`, error);
      }
    }
  }

  private async deliverNotification(config: NotificationConfig, eventType: string, data: any): Promise<void> {
    switch (config.type) {
      case 'console':
        this.sendConsoleNotification(eventType, data);
        break;
        
      case 'webhook':
        await this.sendWebhookNotification(config.endpoint!, eventType, data);
        break;
        
      case 'slack':
        await this.sendSlackNotification(config.endpoint!, eventType, data);
        break;
        
      default:
        console.warn(`⚠️ Unknown notification type: ${config.type}`);
    }
  }

  private sendConsoleNotification(eventType: string, data: any): void {
    const timestamp = new Date().toISOString();
    
    switch (eventType) {
      case 'balanceChange':
        console.log(`💰 [${timestamp}] Balance Change: ${data.address} (${data.chainName})`);
        console.log(`   Previous: ${data.previousBalance}`);
        console.log(`   Current: ${data.currentBalance}`);
        console.log(`   Difference: ${data.difference}`);
        break;
        
      case 'newTransaction':
        console.log(`🔄 [${timestamp}] New Transaction: ${data.txHash}`);
        console.log(`   Wallet: ${data.walletId}`);
        console.log(`   Amount: ${data.amount}`);
        console.log(`   Type: ${data.type}`);
        console.log(`   Status: ${data.status}`);
        break;
        
      default:
        console.log(`📢 [${timestamp}] ${eventType}:`, data);
    }
  }

  private async sendWebhookNotification(url: string, eventType: string, data: any): Promise<void> {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoPayGW-Monitor/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private async sendSlackNotification(webhookUrl: string, eventType: string, data: any): Promise<void> {
    let message = '';
    let color = '#36a64f'; // Green

    switch (eventType) {
      case 'balanceChange':
        const change = parseFloat(data.difference);
        color = change > 0 ? '#36a64f' : '#ff0000'; // Green for increase, red for decrease
        message = `💰 Balance Change Alert\n` +
                 `Wallet: ${data.address}\n` +
                 `Chain: ${data.chainName}\n` +
                 `Change: ${data.difference}\n` +
                 `Current Balance: ${data.currentBalance}`;
        break;
        
      case 'newTransaction':
        message = `🔄 New Transaction Detected\n` +
                 `Hash: ${data.txHash}\n` +
                 `Wallet: ${data.walletId}\n` +
                 `Amount: ${data.amount}\n` +
                 `Type: ${data.type}\n` +
                 `Status: ${data.status}`;
        break;
        
      default:
        message = `📢 ${eventType}\n${JSON.stringify(data, null, 2)}`;
    }

    const payload = {
      attachments: [{
        color,
        text: message,
        timestamp: Math.floor(new Date().getTime() / 1000)
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  async getWalletStatus(walletId: string): Promise<any> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    const adapter = this.adapters.get(wallet.chainName);
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${wallet.chainName}`);
    }

    try {
      const balance = await adapter.getBalance(wallet.address);
      const cacheKey = `${wallet.chainName}:${wallet.address}`;
      const cachedBalance = this.balanceCache.get(cacheKey) || '0';

      return {
        walletId: wallet.id,
        address: wallet.address,
        chainName: wallet.chainName,
        label: wallet.label,
        currentBalance: balance.balance,
        cachedBalance,
        lastChecked: new Date(),
        isMonitoring: this.monitoring
      };
    } catch (error) {
      throw new Error(`Failed to get wallet status: ${error.message}`);
    }
  }

  async getMonitoringStats(): Promise<any> {
    return {
      isMonitoring: this.monitoring,
      totalWallets: this.wallets.size,
      connectedChains: this.adapters.size,
      balanceCheckInterval: this.config.balanceCheckInterval,
      transactionCheckInterval: this.config.transactionCheckInterval,
      activeNotifications: this.notifications.filter(n => n.enabled).length,
      uptime: this.monitoring ? Date.now() - (this as any).startTime : 0
    };
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Wallet Monitor...');
    
    this.stopMonitoring();
    
    // Disconnect all adapters
    for (const [chainName, adapter] of this.adapters) {
      try {
        await adapter.disconnect();
        console.log(`🔌 Disconnected from ${chainName}`);
      } catch (error) {
        console.error(`❌ Failed to disconnect from ${chainName}:`, error);
      }
    }
    
    this.adapters.clear();
    this.wallets.clear();
    this.balanceCache.clear();
    this.transactionCache.clear();
    
    console.log('✅ Wallet Monitor shutdown complete');
    this.emit('shutdown');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createWalletMonitor(config: WalletMonitorConfig): WalletMonitor {
  return new WalletMonitor(config);
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_MONITOR_CONFIG: WalletMonitorConfig = {
  balanceCheckInterval: 30000, // 30 seconds
  transactionCheckInterval: 15000, // 15 seconds  
  confirmationThreshold: 12,
  maxConcurrentChecks: 10,
  retryAttempts: 3,
  retryDelay: 5000,
  evmChains: [],
  utxoChains: []
};
