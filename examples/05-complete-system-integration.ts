/**
 * Example 5: Complete System Integration
 * 
 * This example demonstrates the full ecosystem working together:
 * - Complete multi-chain cryptocurrency payment gateway
 * - Integration of all major components
 * - Real-world production-like scenario
 * - Enterprise-scale operations simulation
 * - End-to-end workflow demonstration
 * 
 * Use Case: Complete crypto payment platform like Coinbase Commerce
 */

import { WalletMonitor, createWalletMonitor } from '../src/monitoring/wallet-monitor';
import { TreasuryManager, createTreasuryManager } from '../src/treasury/treasury-manager';
import { PaymentProcessor, createPaymentProcessor } from '../src/payment/payment-processor';
import { EVMAdapterFactory } from '../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../packages/utxo-adapter/src/utxo-chain-adapter';
import { SeedGenerator } from '../packages/core/crypto/implementations/seed-generator';

interface Platform {
  walletMonitor: WalletMonitor;
  treasuryManager: TreasuryManager;
  paymentProcessor: PaymentProcessor;
  seedGenerator: SeedGenerator;
  adapters: {
    ethereum: any;
    bitcoin: any;
    polygon: any;
    bsc: any;
  };
  merchants: any[];
  customers: any[];
  isInitialized: boolean;
}

class CompleteCryptoPaymentPlatform {
  private platform: Platform;
  private stats = {
    totalMerchants: 0,
    totalCustomers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    uptime: Date.now()
  };

  constructor() {
    this.platform = {} as Platform;
  }

  async initialize(): Promise<void> {
    console.log('🌐 Complete Crypto Payment Platform');
    console.log('===================================');
    console.log('🚀 Initializing Enterprise Cryptocurrency Payment Gateway...');

    try {
      // Step 1: Initialize core components
      await this.initializeCoreComponents();
      
      // Step 2: Initialize blockchain adapters
      await this.initializeBlockchainAdapters();
      
      // Step 3: Integrate all systems
      await this.integrateSystems();
      
      // Step 4: Setup monitoring and analytics
      await this.setupMonitoringAndAnalytics();
      
      this.platform.isInitialized = true;
      console.log('✅ Platform initialization complete!');
      
    } catch (error) {
      console.error('❌ Platform initialization failed:', error);
      throw error;
    }
  }

  private async initializeCoreComponents(): Promise<void> {
    console.log('\n🔧 Initializing Core Components...');
    
    // Seed generator for wallet creation
    this.platform.seedGenerator = new SeedGenerator('master-encryption-key-enterprise-2024');
    
    // Wallet monitoring system
    this.platform.walletMonitor = createWalletMonitor({
      balanceCheckInterval: 30000,
      transactionCheckInterval: 15000,
      confirmationThreshold: 12,
      maxConcurrentChecks: 50,
      retryAttempts: 5,
      retryDelay: 3000,
      evmChains: [
        {
          name: 'ethereum',
          chainId: 1,
          rpcUrl: 'https://mainnet.infura.io/v3/demo',
          nativeTokenSymbol: 'ETH'
        },
        {
          name: 'polygon',
          chainId: 137,
          rpcUrl: 'https://polygon-rpc.com/',
          nativeTokenSymbol: 'MATIC'
        },
        {
          name: 'bsc',
          chainId: 56,
          rpcUrl: 'https://bsc-dataseed.binance.org/',
          nativeTokenSymbol: 'BNB'
        }
      ],
      utxoChains: [
        {
          name: 'bitcoin',
          network: 'bitcoin',
          apiBaseUrl: 'https://blockstream.info/api',
          nativeTokenSymbol: 'BTC'
        }
      ]
    });

    // Treasury management system
    this.platform.treasuryManager = createTreasuryManager({
      multiSigRequired: true,
      requiredSignatures: 3,
      maxDailyWithdrawal: '1000.0',
      emergencyStopEnabled: true,
      hotWalletThreshold: '100.0',
      coldWalletRatio: 0.85,
      autoPooling: true,
      autoDistribution: true,
      rebalanceThreshold: '50.0',
      maxSingleTransaction: '500.0',
      dailyTransactionLimit: 1000,
      whitelistedAddresses: [
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        '0x8ba1f109551bD432803012645Hac136c32960442'
      ],
      blacklistedAddresses: [],
      auditTrailEnabled: true,
      complianceReporting: true,
      kycRequired: true,
      evmChains: [
        {
          name: 'ethereum',
          chainId: 1,
          rpcUrl: 'https://mainnet.infura.io/v3/demo',
          nativeTokenSymbol: 'ETH'
        },
        {
          name: 'polygon',
          chainId: 137,
          rpcUrl: 'https://polygon-rpc.com/',
          nativeTokenSymbol: 'MATIC'
        }
      ],
      utxoChains: [
        {
          name: 'bitcoin',
          network: 'bitcoin',
          apiBaseUrl: 'https://blockstream.info/api',
          nativeTokenSymbol: 'BTC'
        }
      ]
    });

    // Payment processor
    this.platform.paymentProcessor = createPaymentProcessor({
      enableAutomatedProcessing: true,
      processingInterval: 10000,
      batchSize: 25,
      maxRetryAttempts: 5,
      depositConfirmations: {
        ethereum: 12,
        bitcoin: 6,
        polygon: 20,
        bsc: 15
      },
      minimumDepositAmounts: {
        ethereum: '0.001',
        bitcoin: '0.00001',
        polygon: '1.0',
        bsc: '0.01'
      },
      depositProcessingDelay: 120000, // 2 minutes
      withdrawalLimits: {
        ethereum: '1000.0',
        bitcoin: '100.0',
        polygon: '500000.0',
        bsc: '50000.0'
      },
      withdrawalFeeSettings: {
        strategy: 'hybrid',
        fixedFees: {
          ethereum: '0.005',
          bitcoin: '0.0001',
          polygon: '2.0',
          bsc: '0.1'
        },
        percentageFees: {
          ethereum: 0.1,
          bitcoin: 0.05,
          polygon: 0.02,
          bsc: 0.05
        },
        dynamicFeeMultiplier: 1.3,
        maxFeePercentage: 3
      },
      withdrawalBatchingEnabled: true,
      withdrawalProcessingWindows: [
        {
          chainName: 'ethereum',
          startHour: 0,
          endHour: 23,
          timezone: 'UTC',
          enabled: true
        }
      ],
      requireApprovalForLargeAmounts: true,
      largeAmountThreshold: '50.0',
      hotWalletLimits: {
        ethereum: '200.0',
        bitcoin: '20.0',
        polygon: '100000.0',
        bsc: '10000.0'
      },
      walletMonitorEnabled: true,
      treasuryIntegrationEnabled: true,
      complianceCheckEnabled: true,
      evmChains: [
        {
          name: 'ethereum',
          chainId: 1,
          rpcUrl: 'https://mainnet.infura.io/v3/demo',
          nativeTokenSymbol: 'ETH'
        },
        {
          name: 'polygon',
          chainId: 137,
          rpcUrl: 'https://polygon-rpc.com/',
          nativeTokenSymbol: 'MATIC'
        },
        {
          name: 'bsc',
          chainId: 56,
          rpcUrl: 'https://bsc-dataseed.binance.org/',
          nativeTokenSymbol: 'BNB'
        }
      ],
      utxoChains: [
        {
          name: 'bitcoin',
          network: 'bitcoin',
          apiBaseUrl: 'https://blockstream.info/api',
          nativeTokenSymbol: 'BTC'
        }
      ]
    });

    await this.platform.walletMonitor.initialize();
    await this.platform.treasuryManager.initialize();
    await this.platform.paymentProcessor.initialize();

    console.log('✅ Core components initialized');
  }

  private async initializeBlockchainAdapters(): Promise<void> {
    console.log('\n🔗 Initializing Blockchain Adapters...');
    
    this.platform.adapters = {
      ethereum: EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/demo'),
      bitcoin: UTXOAdapterFactory.createBitcoin('https://blockstream.info/api'),
      polygon: EVMAdapterFactory.createPolygon('https://polygon-rpc.com/'),
      bsc: EVMAdapterFactory.createBSC('https://bsc-dataseed.binance.org/')
    };

    await Promise.all([
      this.platform.adapters.ethereum.connect(),
      this.platform.adapters.bitcoin.connect(),
      this.platform.adapters.polygon.connect(),
      this.platform.adapters.bsc.connect()
    ]);

    console.log('✅ All blockchain adapters connected');
  }

  private async integrateSystems(): Promise<void> {
    console.log('\n🔄 Integrating Systems...');
    
    // Connect payment processor with supporting systems
    this.platform.paymentProcessor.setWalletMonitor(this.platform.walletMonitor);
    this.platform.paymentProcessor.setTreasuryManager(this.platform.treasuryManager);

    // Start systems
    await this.platform.walletMonitor.startMonitoring();
    await this.platform.paymentProcessor.startProcessing();

    console.log('✅ Systems integrated and started');
  }

  private async setupMonitoringAndAnalytics(): Promise<void> {
    console.log('\n📊 Setting up Monitoring & Analytics...');
    
    // System event listeners
    this.setupSystemEventListeners();
    
    console.log('✅ Monitoring and analytics configured');
  }

  private setupSystemEventListeners(): void {
    // Payment processor events
    this.platform.paymentProcessor.on('depositCredited', (deposit) => {
      this.stats.totalTransactions++;
      this.stats.totalVolume += parseFloat(deposit.amount);
      console.log(`💰 DEPOSIT: +${deposit.amount} ${deposit.chainName.toUpperCase()} (Total: ${this.stats.totalTransactions})`);
    });

    this.platform.paymentProcessor.on('withdrawalCompleted', (withdrawal) => {
      this.stats.totalTransactions++;
      this.stats.totalVolume += parseFloat(withdrawal.amount);
      this.stats.totalFees += parseFloat(withdrawal.fee);
      console.log(`💸 WITHDRAWAL: -${withdrawal.amount} ${withdrawal.chainName.toUpperCase()} (Fee: ${withdrawal.fee})`);
    });

    this.platform.paymentProcessor.on('batchCompleted', (batch) => {
      console.log(`📦 BATCH: ${batch.withdrawalIds.length} withdrawals processed (${batch.totalAmount})`);
    });

    // Treasury events
    this.platform.treasuryManager.on('operationExecuted', (operation) => {
      console.log(`🏛️ TREASURY: ${operation.type} executed (${operation.amount})`);
    });

    // Monitoring events
    this.platform.walletMonitor.on('newTransaction', (transaction) => {
      console.log(`🔍 DETECTED: ${transaction.type} transaction (${transaction.amount})`);
    });
  }

  async createMerchant(merchantData: any): Promise<string> {
    console.log(`\n🏪 Creating merchant: ${merchantData.name}`);
    
    const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Generate merchant master seed
    const merchantSeed = await this.platform.seedGenerator.generateSeed({
      strength: 256,
      encrypted: true
    });

    // Create deposit addresses for all supported chains
    const depositAddresses = {
      ethereum: await this.platform.adapters.ethereum.generateAddress({
        seed: merchantSeed.mnemonic,
        index: 0
      }),
      bitcoin: await this.platform.adapters.bitcoin.generateAddress({
        seed: merchantSeed.mnemonic,
        index: 0
      }),
      polygon: await this.platform.adapters.polygon.generateAddress({
        seed: merchantSeed.mnemonic,
        index: 0
      }),
      bsc: await this.platform.adapters.bsc.generateAddress({
        seed: merchantSeed.mnemonic,
        index: 0
      })
    };

    const merchant = {
      id: merchantId,
      ...merchantData,
      seed: merchantSeed,
      depositAddresses,
      transactions: [],
      stats: {
        totalReceived: 0,
        totalWithdrawn: 0,
        transactionCount: 0
      },
      createdAt: new Date()
    };

    // Add addresses to monitoring
    Object.entries(depositAddresses).forEach(([chain, address]) => {
      this.platform.walletMonitor.addWallet({
        id: `${merchantId}_${chain}`,
        address: address.address,
        chainType: chain === 'bitcoin' ? 'utxo' : 'evm',
        chainName: chain,
        label: `${merchantData.name} - ${chain.toUpperCase()}`
      });
    });

    if (!this.platform.merchants) {
      this.platform.merchants = [];
    }
    this.platform.merchants.push(merchant);
    this.stats.totalMerchants++;

    console.log(`✅ Merchant created: ${merchantData.name}`);
    console.log(`   ID: ${merchantId}`);
    console.log(`   ETH: ${depositAddresses.ethereum.address}`);
    console.log(`   BTC: ${depositAddresses.bitcoin.address}`);
    console.log(`   MATIC: ${depositAddresses.polygon.address}`);
    console.log(`   BNB: ${depositAddresses.bsc.address}`);

    return merchantId;
  }

  async createCustomerWallet(customerData: any): Promise<string> {
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Generate customer seed
    const customerSeed = await this.platform.seedGenerator.generateSeed({
      strength: 128
    });

    // Create wallet addresses
    const walletAddresses = {
      ethereum: await this.platform.adapters.ethereum.generateAddress({
        seed: customerSeed.mnemonic,
        index: 0
      }),
      bitcoin: await this.platform.adapters.bitcoin.generateAddress({
        seed: customerSeed.mnemonic,
        index: 0
      })
    };

    const customer = {
      id: customerId,
      ...customerData,
      seed: customerSeed,
      wallets: walletAddresses,
      transactions: [],
      createdAt: new Date()
    };

    if (!this.platform.customers) {
      this.platform.customers = [];
    }
    this.platform.customers.push(customer);
    this.stats.totalCustomers++;

    console.log(`👤 Customer created: ${customerData.name} (${customerId})`);
    return customerId;
  }

  async simulateRealWorldOperations(): Promise<void> {
    console.log('\n🎭 Starting Real-World Operations Simulation...');

    // Create merchants
    const merchants = await Promise.all([
      this.createMerchant({
        name: 'TechShop Pro',
        email: 'payments@techshop.com',
        website: 'https://techshop.com',
        category: 'Electronics'
      }),
      this.createMerchant({
        name: 'Crypto Cafe',
        email: 'orders@cryptocafe.com',
        website: 'https://cryptocafe.com',
        category: 'Food & Beverage'
      }),
      this.createMerchant({
        name: 'NFT Marketplace',
        email: 'support@nftmarket.io',
        website: 'https://nftmarket.io',
        category: 'Digital Assets'
      })
    ]);

    // Create customers
    const customers = await Promise.all([
      this.createCustomerWallet({
        name: 'Alice Johnson',
        email: 'alice@example.com'
      }),
      this.createCustomerWallet({
        name: 'Bob Smith',
        email: 'bob@example.com'
      }),
      this.createCustomerWallet({
        name: 'Carol Davis',
        email: 'carol@example.com'
      })
    ]);

    // Simulate customer payments to merchants
    setTimeout(() => {
      this.simulateCustomerPayments(merchants);
    }, 5000);

    // Simulate merchant withdrawals
    setTimeout(() => {
      this.simulateMerchantWithdrawals(merchants);
    }, 15000);

    // Treasury operations
    setTimeout(() => {
      this.simulateTreasuryOperations();
    }, 25000);
  }

  private async simulateCustomerPayments(merchantIds: string[]): Promise<void> {
    console.log('\n💳 Simulating customer payments...');

    const paymentScenarios = [
      { merchantIndex: 0, chain: 'ethereum', amount: '0.05', description: 'Laptop purchase' },
      { merchantIndex: 1, chain: 'bitcoin', amount: '0.001', description: 'Coffee order' },
      { merchantIndex: 2, chain: 'polygon', amount: '100', description: 'NFT purchase' },
      { merchantIndex: 0, chain: 'bsc', amount: '0.5', description: 'Phone accessory' },
      { merchantIndex: 1, chain: 'ethereum', amount: '0.02', description: 'Lunch order' }
    ];

    for (let i = 0; i < paymentScenarios.length; i++) {
      setTimeout(() => {
        const scenario = paymentScenarios[i];
        const merchant = this.platform.merchants[scenario.merchantIndex];
        const chainName = scenario.chain;
        const depositAddress = merchant.depositAddresses[chainName];

        console.log(`💰 Payment: ${scenario.amount} ${chainName.toUpperCase()} to ${merchant.name} (${scenario.description})`);

        // Emit transaction
        this.platform.walletMonitor.emit('newTransaction', {
          walletId: `${merchant.id}_${chainName}`,
          txHash: chainName === 'bitcoin' 
            ? Math.random().toString(16).substring(2, 66)
            : `0x${Math.random().toString(16).substring(2, 66)}`,
          from: chainName === 'bitcoin' 
            ? 'bc1q' + Math.random().toString(16).substring(2, 35)
            : '0x' + Math.random().toString(16).substring(2, 42),
          to: depositAddress.address,
          amount: scenario.amount,
          blockHeight: chainName === 'bitcoin' ? 810000 + i : 18500000 + i,
          confirmations: chainName === 'bitcoin' ? 6 : 12,
          timestamp: new Date(),
          chainName,
          type: 'incoming',
          status: 'confirmed'
        });
      }, i * 3000);
    }
  }

  private async simulateMerchantWithdrawals(merchantIds: string[]): Promise<void> {
    console.log('\n📤 Simulating merchant withdrawals...');

    for (let i = 0; i < merchantIds.length; i++) {
      setTimeout(async () => {
        const merchant = this.platform.merchants[i];
        
        try {
          const withdrawalId = await this.platform.paymentProcessor.createWithdrawal({
            userId: merchant.id,
            destinationAddress: '0x' + Math.random().toString(16).substring(2, 42),
            chainName: 'ethereum',
            amount: (Math.random() * 0.02 + 0.01).toFixed(4),
            priority: 'normal'
          });

          console.log(`📋 Withdrawal created for ${merchant.name}: ${withdrawalId}`);
        } catch (error) {
          console.log(`⚠️ Withdrawal failed for ${merchant.name}: ${error.message}`);
        }
      }, i * 2000);
    }
  }

  private async simulateTreasuryOperations(): Promise<void> {
    console.log('\n🏛️ Simulating treasury operations...');

    try {
      // Create a rebalancing operation
      const rebalanceId = await this.platform.treasuryManager.createOperation({
        type: 'rebalance',
        fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
        amount: '10.0',
        chainName: 'ethereum',
        requiredSignatures: 2,
        approvedBy: [],
        reason: 'Hot wallet rebalancing - automated',
        requestedBy: 'treasury-system'
      });

      // Auto-approve
      await this.platform.treasuryManager.approveOperation(rebalanceId, 'treasury-admin');
      await this.platform.treasuryManager.approveOperation(rebalanceId, 'ceo-approval');

      console.log(`✅ Treasury rebalancing completed: ${rebalanceId}`);
    } catch (error) {
      console.log(`❌ Treasury operation failed: ${error.message}`);
    }
  }

  async generatePlatformReport(): Promise<any> {
    const uptime = Date.now() - this.stats.uptime;
    
    const paymentStats = this.platform.paymentProcessor.getPaymentStats();
    const treasuryReport = this.platform.treasuryManager.getTreasuryReport();
    const monitoringStats = await this.platform.walletMonitor.getMonitoringStats();

    return {
      platform: {
        uptime: Math.floor(uptime / 1000),
        totalMerchants: this.stats.totalMerchants,
        totalCustomers: this.stats.totalCustomers,
        totalTransactions: this.stats.totalTransactions,
        totalVolume: this.stats.totalVolume,
        totalFees: this.stats.totalFees
      },
      payments: paymentStats,
      treasury: treasuryReport,
      monitoring: monitoringStats,
      merchants: this.platform.merchants?.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        transactionCount: m.transactions?.length || 0,
        createdAt: m.createdAt
      })) || []
    };
  }

  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down platform...');

    try {
      await this.platform.paymentProcessor.shutdown();
      await this.platform.treasuryManager.shutdown();
      await this.platform.walletMonitor.shutdown();
      
      await Promise.all([
        this.platform.adapters.ethereum.disconnect(),
        this.platform.adapters.bitcoin.disconnect(),
        this.platform.adapters.polygon.disconnect(),
        this.platform.adapters.bsc.disconnect()
      ]);

      console.log('✅ Platform shutdown complete');
    } catch (error) {
      console.error('❌ Shutdown error:', error);
    }
  }
}

async function completeSystemIntegration() {
  console.log('🌟 Complete System Integration Example');
  console.log('=====================================');

  const platform = new CompleteCryptoPaymentPlatform();

  try {
    // Initialize the complete platform
    await platform.initialize();

    // Start real-world simulation
    await platform.simulateRealWorldOperations();

    // Generate reports periodically
    const reportInterval = setInterval(async () => {
      const report = await platform.generatePlatformReport();
      
      console.log(`\n📈 PLATFORM STATUS REPORT (${new Date().toLocaleTimeString()}):`);
      console.log('================================================');
      console.log(`🏢 Platform Overview:`);
      console.log(`   Uptime: ${report.platform.uptime}s`);
      console.log(`   Merchants: ${report.platform.totalMerchants}`);
      console.log(`   Customers: ${report.platform.totalCustomers}`);
      console.log(`   Transactions: ${report.platform.totalTransactions}`);
      console.log(`   Volume: ${report.platform.totalVolume.toFixed(6)}`);
      console.log(`   Fees Collected: ${report.platform.totalFees.toFixed(6)}`);

      console.log(`\n💳 Payment Processing:`);
      console.log(`   Deposits: ${report.payments.deposits.total} (${report.payments.deposits.confirmed} confirmed)`);
      console.log(`   Withdrawals: ${report.payments.withdrawals.total} (${report.payments.withdrawals.completed} completed)`);
      console.log(`   Active Batches: ${report.payments.batches.active}`);

      console.log(`\n🏛️ Treasury Status:`);
      console.log(`   Total Wallets: ${report.treasury.summary.totalWallets}`);
      console.log(`   Active Operations: ${report.treasury.summary.activeOperations}`);
      console.log(`   Risk Level: ${report.treasury.riskMetrics.currentRiskLevel}`);

      console.log(`\n🔍 Monitoring:`);
      console.log(`   Monitored Wallets: ${report.monitoring.totalWallets}`);
      console.log(`   Success Rate: ${report.monitoring.successRate}%`);
      console.log(`   Active Checks: ${report.monitoring.activeChecks}`);

      if (report.merchants.length > 0) {
        console.log(`\n🏪 Top Merchants:`);
        report.merchants.slice(0, 3).forEach((merchant: any, index: number) => {
          console.log(`   ${index + 1}. ${merchant.name} (${merchant.category}) - ${merchant.transactionCount} txns`);
        });
      }
    }, 20000);

    // Run demo for 2 minutes
    setTimeout(async () => {
      clearInterval(reportInterval);
      
      // Final comprehensive report
      const finalReport = await platform.generatePlatformReport();
      
      console.log('\n🏆 FINAL PLATFORM REPORT');
      console.log('========================');
      console.log(JSON.stringify(finalReport, null, 2));

      // Shutdown platform
      await platform.shutdown();

      console.log('\n🎉 Complete System Integration Example Complete!');
      console.log('🚀 Enterprise Crypto Payment Gateway Demo Finished!');
      console.log('================================================');
      
      setTimeout(() => process.exit(0), 3000);
    }, 120000); // 2 minutes

  } catch (error) {
    console.error('❌ Platform error:', error);
    await platform.shutdown();
    process.exit(1);
  }
}

// Export for use in other examples
export { completeSystemIntegration, CompleteCryptoPaymentPlatform };

// Run if called directly
if (require.main === module) {
  completeSystemIntegration();
}
