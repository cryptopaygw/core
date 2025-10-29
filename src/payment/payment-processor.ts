/**
 * Automated Payment Processing System
 * 
 * Enterprise-grade automated payment processing for:
 * - Automated deposit detection and processing
 * - Intelligent withdrawal queue management
 * - Multi-chain payment routing optimization
 * - Smart fee optimization and batching
 * - Compliance and risk management integration
 * - Real-time payment status tracking
 */

import { EventEmitter } from 'events';
import { WalletMonitor } from '../monitoring/wallet-monitor';
import { TreasuryManager } from '../treasury/treasury-manager';
import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface PaymentProcessorConfig {
  // Processing settings
  enableAutomatedProcessing: boolean;
  processingInterval: number;
  batchSize: number;
  maxRetryAttempts: number;
  
  // Deposit settings
  depositConfirmations: { [chainName: string]: number };
  minimumDepositAmounts: { [chainName: string]: string };
  depositProcessingDelay: number;
  
  // Withdrawal settings
  withdrawalLimits: { [chainName: string]: string };
  withdrawalFeeSettings: WithdrawalFeeSettings;
  withdrawalBatchingEnabled: boolean;
  withdrawalProcessingWindows: ProcessingWindow[];
  
  // Security settings
  requireApprovalForLargeAmounts: boolean;
  largeAmountThreshold: string;
  hotWalletLimits: { [chainName: string]: string };
  
  // Integration settings
  walletMonitorEnabled: boolean;
  treasuryIntegrationEnabled: boolean;
  complianceCheckEnabled: boolean;
  
  // Chain configurations
  evmChains: EVMChainConfig[];
  utxoChains: UTXOChainConfig[];
}

interface EVMChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeTokenSymbol: string;
}

interface UTXOChainConfig {
  name: string;
  network: 'bitcoin' | 'litecoin' | 'testnet';
  apiBaseUrl: string;
  nativeTokenSymbol: string;
}

interface WithdrawalFeeSettings {
  strategy: 'fixed' | 'percentage' | 'dynamic' | 'hybrid';
  fixedFees: { [chainName: string]: string };
  percentageFees: { [chainName: string]: number };
  dynamicFeeMultiplier: number;
  maxFeePercentage: number;
}

interface ProcessingWindow {
  chainName: string;
  startHour: number;
  endHour: number;
  timezone: string;
  enabled: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  walletAddress: string;
  chainName: string;
  amount: string;
  token?: string;
  tokenSymbol?: string;
  txHash: string;
  blockHeight: number;
  confirmations: number;
  status: DepositStatus;
  detectedAt: Date;
  confirmedAt?: Date;
  creditedAt?: Date;
  metadata?: any;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  destinationAddress: string;
  chainName: string;
  amount: string;
  token?: string;
  tokenSymbol?: string;
  fee: string;
  status: WithdrawalStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  batchId?: string;
  txHash?: string;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  metadata?: any;
}

export type DepositStatus = 
  | 'detected' 
  | 'confirming' 
  | 'confirmed' 
  | 'credited' 
  | 'failed';

export type WithdrawalStatus = 
  | 'pending' 
  | 'queued' 
  | 'batched' 
  | 'processing' 
  | 'broadcast' 
  | 'confirmed' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface PaymentBatch {
  id: string;
  chainName: string;
  withdrawalIds: string[];
  totalAmount: string;
  totalFee: string;
  status: 'created' | 'processing' | 'broadcast' | 'confirmed' | 'failed';
  txHash?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface PaymentStats {
  deposits: {
    total: number;
    confirmed: number;
    pending: number;
    totalValue: string;
  };
  withdrawals: {
    total: number;
    completed: number;
    pending: number;
    totalValue: string;
  };
  batches: {
    active: number;
    completed: number;
    failed: number;
  };
  fees: {
    totalCollected: string;
    totalPaid: string;
    netFees: string;
  };
}

// =============================================================================
// Payment Processor Implementation
// =============================================================================

export class PaymentProcessor extends EventEmitter {
  private config: PaymentProcessorConfig;
  private adapters: Map<string, any> = new Map();
  private deposits: Map<string, DepositRequest> = new Map();
  private withdrawals: Map<string, WithdrawalRequest> = new Map();
  private batches: Map<string, PaymentBatch> = new Map();
  private processing = false;
  private intervals: NodeJS.Timeout[] = [];
  private walletMonitor?: WalletMonitor;
  private treasuryManager?: TreasuryManager;
  private isInitialized = false;

  constructor(config: PaymentProcessorConfig) {
    super();
    this.config = config;
  }

  // =============================================================================
  // Initialization
  // =============================================================================

  async initialize(): Promise<void> {
    console.log('💰 Initializing Payment Processor...');

    try {
      // Initialize EVM adapters
      for (const chainConfig of this.config.evmChains) {
        const adapter = EVMAdapterFactory.createCustom(chainConfig);
        await adapter.connect();
        this.adapters.set(chainConfig.name, adapter);
        console.log(`✅ Payment processor connected to ${chainConfig.name} (EVM)`);
      }

      // Initialize UTXO adapters
      for (const chainConfig of this.config.utxoChains) {
        const adapter = UTXOAdapterFactory.createCustom(chainConfig);
        await adapter.connect();
        this.adapters.set(chainConfig.name, adapter);
        console.log(`✅ Payment processor connected to ${chainConfig.name} (UTXO)`);
      }

      this.isInitialized = true;
      console.log('🎯 Payment Processor initialized successfully');

      // Start automated processing
      if (this.config.enableAutomatedProcessing) {
        await this.startProcessing();
      }

      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Payment Processor:', error);
      throw error;
    }
  }

  setWalletMonitor(walletMonitor: WalletMonitor): void {
    this.walletMonitor = walletMonitor;
    
    // Listen for new transactions (deposits)
    this.walletMonitor.on('newTransaction', (transaction) => {
      this.handleNewTransaction(transaction).catch(console.error);
    });

    console.log('🔗 Wallet Monitor integrated with Payment Processor');
  }

  setTreasuryManager(treasuryManager: TreasuryManager): void {
    this.treasuryManager = treasuryManager;
    console.log('🏛️ Treasury Manager integrated with Payment Processor');
  }

  // =============================================================================
  // Processing Control
  // =============================================================================

  async startProcessing(): Promise<void> {
    if (this.processing) {
      console.log('⚠️ Payment processing already running');
      return;
    }

    this.processing = true;
    console.log('⚡ Starting automated payment processing...');

    // Deposit processing
    const depositInterval = setInterval(
      () => this.processDeposits(),
      this.config.processingInterval
    );
    this.intervals.push(depositInterval);

    // Withdrawal processing
    const withdrawalInterval = setInterval(
      () => this.processWithdrawals(),
      this.config.processingInterval
    );
    this.intervals.push(withdrawalInterval);

    // Batch processing
    const batchInterval = setInterval(
      () => this.processBatches(),
      this.config.processingInterval * 2
    );
    this.intervals.push(batchInterval);

    // Status monitoring
    const monitoringInterval = setInterval(
      () => this.monitorTransactionStatus(),
      this.config.processingInterval / 2
    );
    this.intervals.push(monitoringInterval);

    console.log('✅ Automated payment processing started');
    this.emit('processingStarted');
  }

  stopProcessing(): void {
    if (!this.processing) {
      return;
    }

    this.processing = false;

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    console.log('🔴 Payment processing stopped');
    this.emit('processingStopped');
  }

  // =============================================================================
  // Deposit Processing
  // =============================================================================

  private async handleNewTransaction(transaction: any): Promise<void> {
    if (transaction.type !== 'incoming') return;

    console.log(`📥 New deposit detected: ${transaction.txHash}`);

    const depositId = this.generateId();
    const deposit: DepositRequest = {
      id: depositId,
      userId: transaction.walletId, // Using wallet ID as user ID for demo
      walletAddress: transaction.to,
      chainName: transaction.chainName,
      amount: transaction.amount,
      token: transaction.token,
      tokenSymbol: transaction.tokenSymbol,
      txHash: transaction.txHash,
      blockHeight: transaction.blockHeight,
      confirmations: transaction.confirmations,
      status: 'detected',
      detectedAt: new Date()
    };

    this.deposits.set(depositId, deposit);
    this.emit('depositDetected', deposit);

    console.log(`💎 Deposit registered: ${depositId} (${deposit.amount} ${deposit.tokenSymbol || 'native'})`);
  }

  private async processDeposits(): Promise<void> {
    if (!this.processing) return;

    const pendingDeposits = Array.from(this.deposits.values()).filter(
      d => d.status === 'detected' || d.status === 'confirming'
    );

    for (const deposit of pendingDeposits) {
      try {
        await this.processDeposit(deposit);
      } catch (error) {
        console.error(`❌ Failed to process deposit ${deposit.id}:`, error);
        deposit.status = 'failed';
        deposit.metadata = { ...deposit.metadata, error: error.message };
        this.emit('depositFailed', deposit);
      }
    }
  }

  private async processDeposit(deposit: DepositRequest): Promise<void> {
    const adapter = this.adapters.get(deposit.chainName);
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${deposit.chainName}`);
    }

    // Check confirmation requirements
    const requiredConfirmations = this.config.depositConfirmations[deposit.chainName] || 12;
    
    if (deposit.confirmations < requiredConfirmations) {
      if (deposit.status !== 'confirming') {
        deposit.status = 'confirming';
        this.emit('depositConfirming', deposit);
      }
      return;
    }

    // Check minimum deposit amount
    const minimumAmount = parseFloat(this.config.minimumDepositAmounts[deposit.chainName] || '0');
    const depositAmount = parseFloat(deposit.amount);
    
    if (depositAmount < minimumAmount) {
      deposit.status = 'failed';
      deposit.metadata = { 
        ...deposit.metadata, 
        error: `Amount below minimum: ${depositAmount} < ${minimumAmount}` 
      };
      this.emit('depositFailed', deposit);
      return;
    }

    // Mark as confirmed
    if (deposit.status !== 'confirmed') {
      deposit.status = 'confirmed';
      deposit.confirmedAt = new Date();
      this.emit('depositConfirmed', deposit);
    }

    // Apply processing delay for security
    const delayPassed = Date.now() - deposit.confirmedAt!.getTime() >= this.config.depositProcessingDelay;
    
    if (!delayPassed) {
      return;
    }

    // Credit the deposit
    await this.creditDeposit(deposit);
  }

  private async creditDeposit(deposit: DepositRequest): Promise<void> {
    console.log(`💳 Crediting deposit: ${deposit.id} (${deposit.amount})`);

    // In a real implementation, this would update the user's account balance
    // For demo purposes, we'll just mark as credited
    
    deposit.status = 'credited';
    deposit.creditedAt = new Date();

    // If treasury integration is enabled, move funds to cold storage
    if (this.config.treasuryIntegrationEnabled && this.treasuryManager) {
      try {
        await this.treasuryManager.createOperation({
          type: 'pool',
          fromWallet: deposit.walletAddress,
          amount: deposit.amount,
          chainName: deposit.chainName,
          token: deposit.token,
          requiredSignatures: 0,
          approvedBy: [],
          reason: `Deposit pooling: ${deposit.id}`,
          requestedBy: 'payment-processor'
        });
      } catch (error) {
        console.warn(`⚠️ Failed to create treasury pooling operation: ${error.message}`);
      }
    }

    this.emit('depositCredited', deposit);
    console.log(`✅ Deposit credited: ${deposit.id}`);
  }

  // =============================================================================
  // Withdrawal Processing
  // =============================================================================

  async createWithdrawal(withdrawalData: Omit<WithdrawalRequest, 'id' | 'status' | 'createdAt' | 'fee'>): Promise<string> {
    this.requireInitialized();

    // Calculate withdrawal fee
    const fee = await this.calculateWithdrawalFee(
      withdrawalData.chainName, 
      withdrawalData.amount, 
      withdrawalData.token
    );

    const withdrawalId = this.generateId();
    const withdrawal: WithdrawalRequest = {
      ...withdrawalData,
      id: withdrawalId,
      fee,
      status: 'pending',
      createdAt: new Date()
    };

    // Validate withdrawal
    await this.validateWithdrawal(withdrawal);

    // Check if requires approval
    const requiresApproval = this.config.requireApprovalForLargeAmounts && 
                            parseFloat(withdrawal.amount) >= parseFloat(this.config.largeAmountThreshold);

    if (requiresApproval) {
      withdrawal.metadata = { ...withdrawal.metadata, requiresApproval: true };
      console.log(`⏳ Withdrawal requires approval: ${withdrawalId}`);
    } else {
      withdrawal.status = 'queued';
    }

    this.withdrawals.set(withdrawalId, withdrawal);
    this.emit('withdrawalCreated', withdrawal);

    console.log(`📤 Withdrawal request created: ${withdrawalId} (${withdrawal.amount})`);
    return withdrawalId;
  }

  async approveWithdrawal(withdrawalId: string, approver: string): Promise<void> {
    const withdrawal = this.withdrawals.get(withdrawalId);
    if (!withdrawal) {
      throw new Error(`Withdrawal not found: ${withdrawalId}`);
    }

    if (withdrawal.status !== 'pending') {
      throw new Error(`Withdrawal is not pending approval: ${withdrawal.status}`);
    }

    withdrawal.status = 'queued';
    withdrawal.metadata = { ...withdrawal.metadata, approvedBy: approver, approvedAt: new Date() };

    this.emit('withdrawalApproved', { withdrawal, approver });
    console.log(`✅ Withdrawal approved: ${withdrawalId} by ${approver}`);
  }

  private async processWithdrawals(): Promise<void> {
    if (!this.processing) return;

    const queuedWithdrawals = Array.from(this.withdrawals.values()).filter(
      w => w.status === 'queued'
    );

    // Sort by priority and creation time
    queuedWithdrawals.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Process withdrawals within processing windows
    const processableWithdrawals = queuedWithdrawals.filter(w => 
      this.isWithinProcessingWindow(w.chainName)
    );

    // Batch withdrawals if enabled
    if (this.config.withdrawalBatchingEnabled) {
      await this.processBatchedWithdrawals(processableWithdrawals);
    } else {
      // Process individual withdrawals
      const toProcess = processableWithdrawals.slice(0, this.config.batchSize);
      
      for (const withdrawal of toProcess) {
        try {
          await this.processWithdrawal(withdrawal);
        } catch (error) {
          console.error(`❌ Failed to process withdrawal ${withdrawal.id}:`, error);
          withdrawal.status = 'failed';
          withdrawal.metadata = { ...withdrawal.metadata, error: error.message };
          this.emit('withdrawalFailed', withdrawal);
        }
      }
    }
  }

  private async processBatchedWithdrawals(withdrawals: WithdrawalRequest[]): Promise<void> {
    // Group withdrawals by chain and token
    const groupedWithdrawals = new Map<string, WithdrawalRequest[]>();
    
    for (const withdrawal of withdrawals) {
      const key = `${withdrawal.chainName}:${withdrawal.token || 'native'}`;
      const group = groupedWithdrawals.get(key) || [];
      group.push(withdrawal);
      groupedWithdrawals.set(key, group);
    }

    // Create batches
    for (const [key, group] of groupedWithdrawals) {
      if (group.length >= 2) { // Only batch if we have multiple withdrawals
        const batchSize = Math.min(group.length, this.config.batchSize);
        const batchWithdrawals = group.slice(0, batchSize);
        
        await this.createWithdrawalBatch(batchWithdrawals);
      } else {
        // Process single withdrawal
        try {
          await this.processWithdrawal(group[0]);
        } catch (error) {
          console.error(`❌ Failed to process withdrawal ${group[0].id}:`, error);
        }
      }
    }
  }

  private async createWithdrawalBatch(withdrawals: WithdrawalRequest[]): Promise<void> {
    const batchId = this.generateId();
    const chainName = withdrawals[0].chainName;
    
    const totalAmount = withdrawals.reduce(
      (sum, w) => (parseFloat(sum) + parseFloat(w.amount)).toString(), '0'
    );
    
    const totalFee = withdrawals.reduce(
      (sum, w) => (parseFloat(sum) + parseFloat(w.fee)).toString(), '0'
    );

    const batch: PaymentBatch = {
      id: batchId,
      chainName,
      withdrawalIds: withdrawals.map(w => w.id),
      totalAmount,
      totalFee,
      status: 'created',
      createdAt: new Date()
    };

    // Update withdrawal statuses
    for (const withdrawal of withdrawals) {
      withdrawal.status = 'batched';
      withdrawal.batchId = batchId;
    }

    this.batches.set(batchId, batch);
    this.emit('batchCreated', batch);

    console.log(`📦 Created withdrawal batch: ${batchId} (${withdrawals.length} withdrawals)`);
  }

  private async processWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
    console.log(`💸 Processing withdrawal: ${withdrawal.id} (${withdrawal.amount})`);

    withdrawal.status = 'processing';
    withdrawal.processedAt = new Date();
    this.emit('withdrawalProcessing', withdrawal);

    const adapter = this.adapters.get(withdrawal.chainName);
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${withdrawal.chainName}`);
    }

    try {
      // Create transaction
      const transaction = await adapter.createTransaction({
        from: withdrawal.metadata?.sourceWallet || 'hot-wallet-address',
        to: withdrawal.destinationAddress,
        amount: withdrawal.amount,
        tokenAddress: withdrawal.token,
        gasPrice: withdrawal.metadata?.gasPrice,
        gasLimit: withdrawal.metadata?.gasLimit
      });

      // For demo purposes, simulate transaction broadcasting
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      withdrawal.txHash = mockTxHash;
      withdrawal.status = 'broadcast';

      this.emit('withdrawalBroadcast', withdrawal);
      console.log(`📡 Withdrawal broadcast: ${withdrawal.id} (${mockTxHash})`);

    } catch (error) {
      withdrawal.status = 'failed';
      withdrawal.metadata = { ...withdrawal.metadata, error: error.message };
      throw error;
    }
  }

  // =============================================================================
  // Batch Processing
  // =============================================================================

  private async processBatches(): Promise<void> {
    if (!this.processing) return;

    const createdBatches = Array.from(this.batches.values()).filter(
      b => b.status === 'created'
    );

    for (const batch of createdBatches) {
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error(`❌ Failed to process batch ${batch.id}:`, error);
        batch.status = 'failed';
        
        // Update withdrawal statuses
        batch.withdrawalIds.forEach(id => {
          const withdrawal = this.withdrawals.get(id);
          if (withdrawal) {
            withdrawal.status = 'failed';
            withdrawal.metadata = { ...withdrawal.metadata, batchError: error.message };
          }
        });
        
        this.emit('batchFailed', batch);
      }
    }
  }

  private async processBatch(batch: PaymentBatch): Promise<void> {
    console.log(`📦 Processing batch: ${batch.id} (${batch.withdrawalIds.length} withdrawals)`);

    batch.status = 'processing';
    batch.processedAt = new Date();
    this.emit('batchProcessing', batch);

    const adapter = this.adapters.get(batch.chainName);
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${batch.chainName}`);
    }

    // For demo purposes, simulate batch transaction
    const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
    batch.txHash = mockTxHash;
    batch.status = 'broadcast';

    // Update withdrawal statuses
    batch.withdrawalIds.forEach(id => {
      const withdrawal = this.withdrawals.get(id);
      if (withdrawal) {
        withdrawal.status = 'broadcast';
        withdrawal.txHash = mockTxHash;
      }
    });

    this.emit('batchBroadcast', batch);
    console.log(`📡 Batch broadcast: ${batch.id} (${mockTxHash})`);
  }

  // =============================================================================
  // Fee Calculation
  // =============================================================================

  private async calculateWithdrawalFee(chainName: string, amount: string, token?: string): Promise<string> {
    const feeSettings = this.config.withdrawalFeeSettings;
    const amountNum = parseFloat(amount);
    let fee = 0;

    switch (feeSettings.strategy) {
      case 'fixed':
        fee = parseFloat(feeSettings.fixedFees[chainName] || '0');
        break;

      case 'percentage':
        const percentage = feeSettings.percentageFees[chainName] || 0;
        fee = amountNum * (percentage / 100);
        break;

      case 'dynamic':
        // Get current network fee and apply multiplier
        try {
          const adapter = this.adapters.get(chainName);
          if (adapter) {
            const gasPrice = await adapter.provider?.getFeeData?.();
            const baseFee = gasPrice?.gasPrice ? parseFloat(gasPrice.gasPrice.toString()) : 0;
            fee = baseFee * feeSettings.dynamicFeeMultiplier;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get dynamic fee for ${chainName}, using fixed fee`);
          fee = parseFloat(feeSettings.fixedFees[chainName] || '0');
        }
        break;

      case 'hybrid':
        const fixedFee = parseFloat(feeSettings.fixedFees[chainName] || '0');
        const percentageFee = amountNum * ((feeSettings.percentageFees[chainName] || 0) / 100);
        fee = Math.max(fixedFee, percentageFee);
        break;

      default:
        fee = 0;
    }

    // Apply maximum fee percentage limit
    const maxFee = amountNum * (feeSettings.maxFeePercentage / 100);
    fee = Math.min(fee, maxFee);

    return fee.toString();
  }

  // =============================================================================
  // Status Monitoring
  // =============================================================================

  private async monitorTransactionStatus(): Promise<void> {
    if (!this.processing) return;

    // Monitor broadcast withdrawals
    const broadcastWithdrawals = Array.from(this.withdrawals.values()).filter(
      w => w.status === 'broadcast' && w.txHash
    );

    for (const withdrawal of broadcastWithdrawals) {
      try {
        const adapter = this.adapters.get(withdrawal.chainName);
        if (!adapter) continue;

        // In a real implementation, you would check transaction status
        // For demo, randomly complete some transactions
        if (Math.random() < 0.1) { // 10% chance to complete
          withdrawal.status = 'confirmed';
          withdrawal.completedAt = new Date();
          this.emit('withdrawalCompleted', withdrawal);
          console.log(`✅ Withdrawal completed: ${withdrawal.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to monitor withdrawal ${withdrawal.id}:`, error);
      }
    }

    // Monitor broadcast batches
    const broadcastBatches = Array.from(this.batches.values()).filter(
      b => b.status === 'broadcast' && b.txHash
    );

    for (const batch of broadcastBatches) {
      try {
        if (Math.random() < 0.1) { // 10% chance to complete
          batch.status = 'confirmed';
          
          // Update withdrawal statuses
          batch.withdrawalIds.forEach(id => {
            const withdrawal = this.withdrawals.get(id);
            if (withdrawal) {
              withdrawal.status = 'completed';
              withdrawal.completedAt = new Date();
            }
          });

          this.emit('batchCompleted', batch);
          console.log(`✅ Batch completed: ${batch.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to monitor batch ${batch.id}:`, error);
      }
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private async validateWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
    // Validate amount
    const amount = parseFloat(withdrawal.amount);
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    // Validate withdrawal limits
    const chainLimit = this.config.withdrawalLimits[withdrawal.chainName];
    if (chainLimit && amount > parseFloat(chainLimit)) {
      throw new Error(`Withdrawal amount exceeds chain limit: ${amount} > ${chainLimit}`);
    }

    // Validate address
    const adapter = this.adapters.get(withdrawal.chainName);
    if (adapter) {
      const isValid = await adapter.validateAddress(withdrawal.destinationAddress);
      if (!isValid) {
        throw new Error(`Invalid destination address: ${withdrawal.destinationAddress}`);
      }
    }
  }

  private isWithinProcessingWindow(chainName: string): boolean {
    const window = this.config.withdrawalProcessingWindows.find(w => w.chainName === chainName);
    
    if (!window || !window.enabled) {
      return true; // No window restriction
    }

    const now = new Date();
    const currentHour = now.getHours();
    
    return currentHour >= window.startHour && currentHour <= window.endHour;
  }

  getPaymentStats(): PaymentStats {
    const deposits = Array.from(this.deposits.values());
    const withdrawals = Array.from(this.withdrawals.values());
    const batches = Array.from(this.batches.values());

    const depositTotalValue = deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0).toString();
    const withdrawalTotalValue = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0).toString();
    const totalFeesCollected = deposits.reduce((sum, d) => sum + parseFloat(d.metadata?.fee || '0'), 0);
    const totalFeesPaid = withdrawals.reduce((sum, w) => sum + parseFloat(w.fee), 0);

    return {
      deposits: {
        total: deposits.length,
        confirmed: deposits.filter(d => d.status === 'confirmed' || d.status === 'credited').length,
        pending: deposits.filter(d => d.status === 'detected' || d.status === 'confirming').length,
        totalValue: depositTotalValue
      },
      withdrawals: {
        total: withdrawals.length,
        completed: withdrawals.filter(w => w.status === 'completed').length,
        pending: withdrawals.filter(w => ['pending', 'queued', 'processing'].includes(w.status)).length,
        totalValue: withdrawalTotalValue
      },
      batches: {
        active: batches.filter(b => ['created', 'processing', 'broadcast'].includes(b.status)).length,
        completed: batches.filter(b => b.status === 'confirmed').length,
        failed: batches.filter(b => b.status === 'failed').length
      },
      fees: {
        totalCollected: totalFeesCollected.toString(),
        totalPaid: totalFeesPaid.toString(),
        netFees: (totalFeesCollected - totalFeesPaid).toString()
      }
    };
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private generateId(): string {
    return 'pay_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private requireInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Payment Processor not initialized');
    }
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Payment Processor...');

    this.stopProcessing();

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
    this.deposits.clear();
    this.withdrawals.clear();
    this.batches.clear();
    this.isInitialized = false;

    console.log('✅ Payment Processor shutdown complete');
    this.emit('shutdown');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createPaymentProcessor(config: PaymentProcessorConfig): PaymentProcessor {
  return new PaymentProcessor(config);
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_PAYMENT_CONFIG: PaymentProcessorConfig = {
  enableAutomatedProcessing: true,
  processingInterval: 30000, // 30 seconds
  batchSize: 20,
  maxRetryAttempts: 3,
  
  depositConfirmations: {
    ethereum: 12,
    bitcoin: 6,
    polygon: 20
  },
  minimumDepositAmounts: {
    ethereum: '0.01',
    bitcoin: '0.001',
    polygon: '1'
  },
  depositProcessingDelay: 300000, // 5 minutes
  
  withdrawalLimits: {
    ethereum: '100',
    bitcoin: '10',
    polygon: '1000'
  },
  withdrawalFeeSettings: {
    strategy: 'hybrid',
    fixedFees: {
      ethereum: '0.005',
      bitcoin: '0.0001',
      polygon: '0.1'
    },
    percentageFees: {
      ethereum: 0.5,
      bitcoin: 0.25,
      polygon: 0.1
    },
    dynamicFeeMultiplier: 1.2,
    maxFeePercentage: 5
  },
  withdrawalBatchingEnabled: true,
  withdrawalProcessingWindows: [],
  
  requireApprovalForLargeAmounts: true,
  largeAmountThreshold: '10',
  hotWalletLimits: {
    ethereum: '50',
    bitcoin: '5',
    polygon: '500'
  },
  
  walletMonitorEnabled: true,
  treasuryIntegrationEnabled: true,
  complianceCheckEnabled: true,
  
  evmChains: [],
  utxoChains: []
};
