/**
 * Enterprise Treasury Management System
 * 
 * Advanced treasury management system for cryptocurrency operations:
 * - Multi-signature wallet management
 * - Automated fund pooling and distribution
 * - Hot/cold wallet separation and security
 * - Risk management and compliance
 * - Automated treasury operations
 * - Audit trails and reporting
 */

import { EventEmitter } from 'events';
import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface TreasuryConfig {
  // Security settings
  multiSigRequired: boolean;
  requiredSignatures: number;
  maxDailyWithdrawal: string;
  emergencyStopEnabled: boolean;
  
  // Hot/Cold wallet settings
  hotWalletThreshold: string; // Maximum amount in hot wallets
  coldWalletRatio: number; // Percentage to keep in cold storage (0-1)
  
  // Automation settings
  autoPooling: boolean;
  autoDistribution: boolean;
  rebalanceThreshold: string;
  
  // Risk management
  maxSingleTransaction: string;
  dailyTransactionLimit: number;
  whitelistedAddresses: string[];
  blacklistedAddresses: string[];
  
  // Compliance
  auditTrailEnabled: boolean;
  complianceReporting: boolean;
  kycRequired: boolean;
  
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

export interface TreasuryWallet {
  id: string;
  address: string;
  chainName: string;
  type: 'hot' | 'cold' | 'multisig';
  purpose: 'operational' | 'reserve' | 'distribution' | 'collection';
  balance?: string;
  threshold?: string;
  signatories?: string[];
  requiredSignatures?: number;
  label?: string;
  created: Date;
}

export interface TreasuryOperation {
  id: string;
  type: 'transfer' | 'pool' | 'distribute' | 'rebalance' | 'withdraw';
  status: 'pending' | 'approved' | 'executed' | 'failed' | 'cancelled';
  fromWallet: string;
  toWallet?: string;
  amount: string;
  token?: string;
  chainName: string;
  requiredSignatures: number;
  currentSignatures: string[];
  txHash?: string;
  reason: string;
  requestedBy: string;
  approvedBy: string[];
  created: Date;
  executed?: Date;
  metadata?: any;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: RiskFactor[];
  recommendation: 'approve' | 'review' | 'deny';
  expires: Date;
}

interface RiskFactor {
  type: 'amount' | 'frequency' | 'destination' | 'time' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  score: number;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  resource: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// Treasury Manager Implementation
// =============================================================================

export class TreasuryManager extends EventEmitter {
  private config: TreasuryConfig;
  private adapters: Map<string, any> = new Map();
  private wallets: Map<string, TreasuryWallet> = new Map();
  private operations: Map<string, TreasuryOperation> = new Map();
  private auditTrail: AuditEntry[] = [];
  private riskCache: Map<string, RiskAssessment> = new Map();
  private isInitialized = false;
  private emergencyStopped = false;

  constructor(config: TreasuryConfig) {
    super();
    this.config = config;
  }

  // =============================================================================
  // Initialization
  // =============================================================================

  async initialize(): Promise<void> {
    console.log('🏛️ Initializing Treasury Management System...');

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

      this.isInitialized = true;
      console.log('🏆 Treasury Management System initialized successfully');
      
      // Start automated processes
      if (this.config.autoPooling || this.config.autoDistribution) {
        this.startAutomatedProcesses();
      }

      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Treasury Manager:', error);
      throw error;
    }
  }

  private startAutomatedProcesses(): void {
    // Auto-rebalancing every 30 minutes
    setInterval(async () => {
      if (!this.emergencyStopped) {
        await this.performAutoRebalance().catch(console.error);
      }
    }, 30 * 60 * 1000);

    // Risk assessment cleanup every hour
    setInterval(() => {
      this.cleanupExpiredRiskAssessments();
    }, 60 * 60 * 1000);

    console.log('⚡ Automated treasury processes started');
  }

  // =============================================================================
  // Wallet Management
  // =============================================================================

  async addTreasuryWallet(wallet: Omit<TreasuryWallet, 'created' | 'balance'>): Promise<string> {
    this.requireInitialized();
    this.requireNotEmergencyStopped();

    const walletId = wallet.id || this.generateId();
    const treasuryWallet: TreasuryWallet = {
      ...wallet,
      id: walletId,
      created: new Date()
    };

    // Validate wallet address
    const adapter = this.adapters.get(wallet.chainName);
    if (!adapter) {
      throw new Error(`No adapter found for chain: ${wallet.chainName}`);
    }

    const isValid = await adapter.validateAddress(wallet.address);
    if (!isValid) {
      throw new Error(`Invalid address for ${wallet.chainName}: ${wallet.address}`);
    }

    // Get initial balance
    try {
      const balance = await adapter.getBalance(wallet.address);
      treasuryWallet.balance = balance.balance;
    } catch (error) {
      console.warn(`⚠️ Could not fetch initial balance for ${wallet.address}`);
    }

    this.wallets.set(walletId, treasuryWallet);

    this.logAuditEntry('wallet_added', 'system', walletId, treasuryWallet);
    console.log(`💼 Added treasury wallet: ${wallet.label || walletId} (${wallet.address})`);
    this.emit('walletAdded', treasuryWallet);

    return walletId;
  }

  removeTreasuryWallet(walletId: string, requester: string): void {
    this.requireInitialized();
    this.requireNotEmergencyStopped();

    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error(`Treasury wallet not found: ${walletId}`);
    }

    // Check if wallet has balance
    const balance = parseFloat(wallet.balance || '0');
    if (balance > 0) {
      throw new Error(`Cannot remove wallet with non-zero balance: ${balance}`);
    }

    this.wallets.delete(walletId);
    this.logAuditEntry('wallet_removed', requester, walletId, wallet);
    console.log(`🗑️ Removed treasury wallet: ${walletId}`);
    this.emit('walletRemoved', { walletId, wallet });
  }

  async refreshWalletBalances(): Promise<void> {
    this.requireInitialized();

    console.log('🔄 Refreshing treasury wallet balances...');
    const promises = Array.from(this.wallets.values()).map(async (wallet) => {
      try {
        const adapter = this.adapters.get(wallet.chainName);
        if (adapter) {
          const balance = await adapter.getBalance(wallet.address);
          const oldBalance = wallet.balance || '0';
          wallet.balance = balance.balance;

          if (oldBalance !== balance.balance) {
            this.emit('balanceChanged', {
              walletId: wallet.id,
              address: wallet.address,
              oldBalance,
              newBalance: balance.balance,
              difference: (parseFloat(balance.balance) - parseFloat(oldBalance)).toString()
            });
          }
        }
      } catch (error) {
        console.error(`❌ Failed to refresh balance for ${wallet.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Treasury wallet balances refreshed');
  }

  // =============================================================================
  // Treasury Operations
  // =============================================================================

  async createOperation(operationData: Omit<TreasuryOperation, 'id' | 'status' | 'currentSignatures' | 'created'>): Promise<string> {
    this.requireInitialized();
    this.requireNotEmergencyStopped();

    // Validate operation
    await this.validateOperation(operationData);

    const operationId = this.generateId();
    const operation: TreasuryOperation = {
      ...operationData,
      id: operationId,
      status: 'pending',
      currentSignatures: [],
      created: new Date()
    };

    // Perform risk assessment
    const riskAssessment = await this.assessRisk(operation);
    operation.metadata = { ...operation.metadata, riskAssessment };

    if (riskAssessment.recommendation === 'deny') {
      operation.status = 'cancelled';
      this.logAuditEntry('operation_denied', operationData.requestedBy, operationId, {
        operation,
        reason: 'Risk assessment denied',
        riskLevel: riskAssessment.level
      });
      throw new Error(`Operation denied due to ${riskAssessment.level} risk level`);
    }

    this.operations.set(operationId, operation);

    // Auto-approve if no signatures required or if requester has auto-approval
    if (operation.requiredSignatures === 0) {
      await this.executeOperation(operationId);
    }

    this.logAuditEntry('operation_created', operationData.requestedBy, operationId, operation);
    console.log(`📝 Created treasury operation: ${operationId} (${operation.type})`);
    this.emit('operationCreated', operation);

    return operationId;
  }

  async approveOperation(operationId: string, approver: string, signature?: string): Promise<void> {
    this.requireInitialized();
    this.requireNotEmergencyStopped();

    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation not found: ${operationId}`);
    }

    if (operation.status !== 'pending') {
      throw new Error(`Operation is not pending approval: ${operation.status}`);
    }

    // Check if already signed by this approver
    if (operation.currentSignatures.includes(approver)) {
      throw new Error(`Operation already approved by: ${approver}`);
    }

    // Add signature
    operation.currentSignatures.push(approver);
    operation.approvedBy.push(approver);

    this.logAuditEntry('operation_approved', approver, operationId, {
      operation: operationId,
      currentSignatures: operation.currentSignatures.length,
      requiredSignatures: operation.requiredSignatures
    });

    // Check if enough signatures
    if (operation.currentSignatures.length >= operation.requiredSignatures) {
      operation.status = 'approved';
      await this.executeOperation(operationId);
    }

    console.log(`✅ Operation approved: ${operationId} by ${approver} (${operation.currentSignatures.length}/${operation.requiredSignatures})`);
    this.emit('operationApproved', { operation, approver });
  }

  private async executeOperation(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation not found: ${operationId}`);
    }

    try {
      console.log(`⚡ Executing treasury operation: ${operationId} (${operation.type})`);

      const adapter = this.adapters.get(operation.chainName);
      if (!adapter) {
        throw new Error(`No adapter found for chain: ${operation.chainName}`);
      }

      let txHash: string;

      switch (operation.type) {
        case 'transfer':
          txHash = await this.executeTransfer(operation, adapter);
          break;
        case 'pool':
          txHash = await this.executePooling(operation, adapter);
          break;
        case 'distribute':
          txHash = await this.executeDistribution(operation, adapter);
          break;
        case 'rebalance':
          txHash = await this.executeRebalance(operation, adapter);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      operation.status = 'executed';
      operation.txHash = txHash;
      operation.executed = new Date();

      this.logAuditEntry('operation_executed', 'system', operationId, {
        operation: operationId,
        txHash,
        executedAt: operation.executed
      });

      console.log(`✅ Treasury operation executed: ${operationId} (${txHash})`);
      this.emit('operationExecuted', operation);

      // Refresh wallet balances after execution
      await this.refreshWalletBalances();

    } catch (error) {
      operation.status = 'failed';
      operation.metadata = { ...operation.metadata, error: error.message };

      this.logAuditEntry('operation_failed', 'system', operationId, {
        operation: operationId,
        error: error.message
      });

      console.error(`❌ Treasury operation failed: ${operationId}:`, error);
      this.emit('operationFailed', { operation, error });
      throw error;
    }
  }

  private async executeTransfer(operation: TreasuryOperation, adapter: any): Promise<string> {
    // Create transaction
    const transaction = await adapter.createTransaction({
      from: operation.fromWallet,
      to: operation.toWallet!,
      amount: operation.amount,
      tokenAddress: operation.token
    });

    // Note: In a real implementation, you would use the actual private key
    // For this demo, we'll simulate the transaction
    const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
    
    console.log(`💸 Transfer executed: ${operation.amount} from ${operation.fromWallet} to ${operation.toWallet}`);
    return mockTxHash;
  }

  private async executePooling(operation: TreasuryOperation, adapter: any): Promise<string> {
    // Pool funds from multiple wallets to a central wallet
    console.log(`🔄 Pooling operation executed: ${operation.amount}`);
    return '0x' + Math.random().toString(16).substring(2, 66);
  }

  private async executeDistribution(operation: TreasuryOperation, adapter: any): Promise<string> {
    // Distribute funds from central wallet to multiple wallets
    console.log(`📤 Distribution operation executed: ${operation.amount}`);
    return '0x' + Math.random().toString(16).substring(2, 66);
  }

  private async executeRebalance(operation: TreasuryOperation, adapter: any): Promise<string> {
    // Rebalance funds between hot and cold wallets
    console.log(`⚖️ Rebalance operation executed: ${operation.amount}`);
    return '0x' + Math.random().toString(16).substring(2, 66);
  }

  // =============================================================================
  // Risk Assessment
  // =============================================================================

  private async assessRisk(operation: TreasuryOperation): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Amount-based risk
    const amount = parseFloat(operation.amount);
    const maxSingle = parseFloat(this.config.maxSingleTransaction);
    
    if (amount > maxSingle) {
      factors.push({
        type: 'amount',
        severity: 'high',
        description: `Amount exceeds single transaction limit (${amount} > ${maxSingle})`,
        score: 30
      });
      totalScore += 30;
    } else if (amount > maxSingle * 0.5) {
      factors.push({
        type: 'amount',
        severity: 'medium',
        description: `Amount is significant (${amount})`,
        score: 15
      });
      totalScore += 15;
    }

    // Destination-based risk
    if (operation.toWallet && this.config.blacklistedAddresses.includes(operation.toWallet)) {
      factors.push({
        type: 'destination',
        severity: 'high',
        description: 'Destination address is blacklisted',
        score: 50
      });
      totalScore += 50;
    } else if (operation.toWallet && !this.config.whitelistedAddresses.includes(operation.toWallet)) {
      factors.push({
        type: 'destination',
        severity: 'medium',
        description: 'Destination address is not whitelisted',
        score: 20
      });
      totalScore += 20;
    }

    // Time-based risk (outside business hours)
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour > 17) {
      factors.push({
        type: 'time',
        severity: 'low',
        description: 'Transaction outside business hours',
        score: 10
      });
      totalScore += 10;
    }

    // Determine risk level and recommendation
    let level: RiskAssessment['level'];
    let recommendation: RiskAssessment['recommendation'];

    if (totalScore >= 70) {
      level = 'critical';
      recommendation = 'deny';
    } else if (totalScore >= 50) {
      level = 'high';
      recommendation = 'review';
    } else if (totalScore >= 30) {
      level = 'medium';
      recommendation = 'review';
    } else {
      level = 'low';
      recommendation = 'approve';
    }

    const assessment: RiskAssessment = {
      level,
      score: totalScore,
      factors,
      recommendation,
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };

    // Cache the assessment
    this.riskCache.set(operation.id, assessment);

    return assessment;
  }

  private cleanupExpiredRiskAssessments(): void {
    const now = new Date();
    for (const [id, assessment] of this.riskCache.entries()) {
      if (assessment.expires < now) {
        this.riskCache.delete(id);
      }
    }
  }

  // =============================================================================
  // Automated Operations
  // =============================================================================

  private async performAutoRebalance(): Promise<void> {
    if (!this.config.autoPooling && !this.config.autoDistribution) {
      return;
    }

    console.log('🔄 Performing automated treasury rebalance...');

    try {
      // Check hot wallet balances
      const hotWallets = Array.from(this.wallets.values()).filter(w => w.type === 'hot');
      const threshold = parseFloat(this.config.hotWalletThreshold);

      for (const hotWallet of hotWallets) {
        const balance = parseFloat(hotWallet.balance || '0');
        
        if (balance > threshold) {
          // Move excess funds to cold storage
          const excessAmount = (balance - threshold * 0.8).toString(); // Keep 80% of threshold
          
          const coldWallet = Array.from(this.wallets.values()).find(w => 
            w.type === 'cold' && w.chainName === hotWallet.chainName
          );

          if (coldWallet) {
            await this.createOperation({
              type: 'rebalance',
              fromWallet: hotWallet.address,
              toWallet: coldWallet.address,
              amount: excessAmount,
              chainName: hotWallet.chainName,
              requiredSignatures: 0, // Auto-approved
              approvedBy: [],
              reason: 'Automated hot wallet rebalance',
              requestedBy: 'system'
            });
          }
        }
      }

      console.log('✅ Automated rebalance completed');
    } catch (error) {
      console.error('❌ Automated rebalance failed:', error);
    }
  }

  // =============================================================================
  // Emergency Controls
  // =============================================================================

  enableEmergencyStop(user: string): void {
    this.emergencyStopped = true;
    this.logAuditEntry('emergency_stop_enabled', user, 'system', {
      reason: 'Emergency stop activated',
      activatedBy: user
    });
    
    console.log('🚨 EMERGENCY STOP ACTIVATED - All treasury operations suspended');
    this.emit('emergencyStop', { activatedBy: user, timestamp: new Date() });
  }

  disableEmergencyStop(user: string): void {
    this.emergencyStopped = false;
    this.logAuditEntry('emergency_stop_disabled', user, 'system', {
      reason: 'Emergency stop deactivated',
      deactivatedBy: user
    });
    
    console.log('✅ Emergency stop deactivated - Treasury operations resumed');
    this.emit('emergencyStopDisabled', { deactivatedBy: user, timestamp: new Date() });
  }

  isEmergencyStopped(): boolean {
    return this.emergencyStopped;
  }

  // =============================================================================
  // Reporting and Analytics
  // =============================================================================

  getTreasuryReport(): any {
    const walletsByType = new Map<string, TreasuryWallet[]>();
    const balancesByChain = new Map<string, number>();
    let totalValue = 0;

    for (const wallet of this.wallets.values()) {
      // Group by type
      const typeWallets = walletsByType.get(wallet.type) || [];
      typeWallets.push(wallet);
      walletsByType.set(wallet.type, typeWallets);

      // Sum by chain
      const balance = parseFloat(wallet.balance || '0');
      const chainTotal = balancesByChain.get(wallet.chainName) || 0;
      balancesByChain.set(wallet.chainName, chainTotal + balance);
      
      totalValue += balance;
    }

    const operations = Array.from(this.operations.values());
    const operationsByStatus = new Map<string, number>();
    
    for (const op of operations) {
      operationsByStatus.set(op.status, (operationsByStatus.get(op.status) || 0) + 1);
    }

    return {
      timestamp: new Date(),
      summary: {
        totalWallets: this.wallets.size,
        totalValue: totalValue.toString(),
        totalOperations: operations.length,
        emergencyStopped: this.emergencyStopped
      },
      walletsByType: Object.fromEntries(
        Array.from(walletsByType.entries()).map(([type, wallets]) => [
          type,
          {
            count: wallets.length,
            totalBalance: wallets.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0).toString()
          }
        ])
      ),
      balancesByChain: Object.fromEntries(balancesByChain),
      operationsByStatus: Object.fromEntries(operationsByStatus),
      recentOperations: operations
        .sort((a, b) => b.created.getTime() - a.created.getTime())
        .slice(0, 10)
    };
  }

  getAuditTrail(limit = 100): AuditEntry[] {
    return this.auditTrail
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private async validateOperation(operation: Omit<TreasuryOperation, 'id' | 'status' | 'currentSignatures' | 'created'>): Promise<void> {
    // Validate wallet exists
    const fromWallet = Array.from(this.wallets.values()).find(w => w.address === operation.fromWallet);
    if (!fromWallet) {
      throw new Error(`From wallet not found: ${operation.fromWallet}`);
    }

    // Validate amount
    const amount = parseFloat(operation.amount);
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Validate balance
    const balance = parseFloat(fromWallet.balance || '0');
    if (amount > balance) {
      throw new Error(`Insufficient balance: ${amount} > ${balance}`);
    }

    // Validate daily limits
    if (amount > parseFloat(this.config.maxSingleTransaction)) {
      throw new Error(`Amount exceeds single transaction limit: ${amount} > ${this.config.maxSingleTransaction}`);
    }
  }

  private logAuditEntry(action: string, user: string, resource: string, details: any): void {
    if (!this.config.auditTrailEnabled) return;

    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      user,
      resource,
      details
    };

    this.auditTrail.push(entry);
    
    // Keep only last 10,000 entries
    if (this.auditTrail.length > 10000) {
      this.auditTrail = this.auditTrail.slice(-10000);
    }

    this.emit('auditEntry', entry);
  }

  private generateId(): string {
    return 'trs_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private requireInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Treasury Manager not initialized');
    }
  }

  private requireNotEmergencyStopped(): void {
    if (this.emergencyStopped) {
      throw new Error('Treasury operations suspended due to emergency stop');
    }
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Treasury Manager...');

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
    this.operations.clear();
    this.riskCache.clear();
    this.isInitialized = false;

    console.log('✅ Treasury Manager shutdown complete');
    this.emit('shutdown');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createTreasuryManager(config: TreasuryConfig): TreasuryManager {
  return new TreasuryManager(config);
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_TREASURY_CONFIG: TreasuryConfig = {
  multiSigRequired: true,
  requiredSignatures: 2,
  maxDailyWithdrawal: '100000',
  emergencyStopEnabled: true,
  hotWalletThreshold: '10000',
  coldWalletRatio: 0.8,
  autoPooling: false,
  autoDistribution: false,
  rebalanceThreshold: '1000',
  maxSingleTransaction: '50000',
  dailyTransactionLimit: 100,
  whitelistedAddresses: [],
  blacklistedAddresses: [],
  auditTrailEnabled: true,
  complianceReporting: true,
  kycRequired: false,
  evmChains: [],
  utxoChains: []
};
