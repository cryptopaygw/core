/**
 * Example 4: Automated Payment Processing
 * 
 * This example demonstrates comprehensive automated payment processing:
 * - Automated deposit detection and processing
 * - Intelligent withdrawal queue management
 * - Batch processing and fee optimization
 * - Integration with wallet monitoring and treasury
 * - Real-time payment lifecycle management
 * 
 * Use Case: Crypto exchange or payment processor automation
 */

import { PaymentProcessor, createPaymentProcessor } from '../src/payment/payment-processor';
import { WalletMonitor, createWalletMonitor } from '../src/monitoring/wallet-monitor';
import { TreasuryManager, createTreasuryManager } from '../src/treasury/treasury-manager';
import { EVMAdapterFactory } from '../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../packages/utxo-adapter/src/utxo-chain-adapter';
import { SeedGenerator } from '../packages/core/crypto/implementations/seed-generator';

async function automatedPaymentProcessing() {
  console.log('💳 Automated Payment Processing Example');
  console.log('=======================================');

  // Step 1: Initialize payment processing system
  console.log('\n⚙️ Step 1: Initialize Payment Processing System');
  
  const paymentProcessor = createPaymentProcessor({
    enableAutomatedProcessing: true,
    processingInterval: 5000, // Process every 5 seconds
    batchSize: 10,
    maxRetryAttempts: 3,
    
    // Deposit configuration
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
    depositProcessingDelay: 60000, // 1 minute security delay
    
    // Withdrawal configuration
    withdrawalLimits: {
      ethereum: '100.0',
      bitcoin: '10.0',
      polygon: '50000.0',
      bsc: '5000.0'
    },
    withdrawalFeeSettings: {
      strategy: 'hybrid', // Use both fixed and percentage fees
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
      dynamicFeeMultiplier: 1.2,
      maxFeePercentage: 5
    },
    withdrawalBatchingEnabled: true,
    withdrawalProcessingWindows: [
      {
        chainName: 'ethereum',
        startHour: 0,
        endHour: 23,
        timezone: 'UTC',
        enabled: true
      },
      {
        chainName: 'bitcoin',
        startHour: 6,
        endHour: 22,
        timezone: 'UTC',
        enabled: true
      }
    ],
    
    // Security settings
    requireApprovalForLargeAmounts: true,
    largeAmountThreshold: '10.0',
    hotWalletLimits: {
      ethereum: '50.0',
      bitcoin: '5.0',
      polygon: '25000.0',
      bsc: '2500.0'
    },
    
    // Integration settings
    walletMonitorEnabled: true,
    treasuryIntegrationEnabled: true,
    complianceCheckEnabled: true,
    
    // Chain configurations
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

  await paymentProcessor.initialize();
  console.log('✅ Payment processor initialized');

  // Step 2: Initialize supporting systems
  console.log('\n🔧 Step 2: Initialize Supporting Systems');
  
  // Wallet monitoring system
  const walletMonitor = createWalletMonitor({
    balanceCheckInterval: 15000,
    transactionCheckInterval: 10000,
    confirmationThreshold: 12,
    maxConcurrentChecks: 20,
    retryAttempts: 3,
    retryDelay: 2000,
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
  const treasuryManager = createTreasuryManager({
    multiSigRequired: true,
    requiredSignatures: 2,
    maxDailyWithdrawal: '500.0',
    emergencyStopEnabled: true,
    hotWalletThreshold: '25.0',
    coldWalletRatio: 0.8,
    autoPooling: true,
    autoDistribution: false,
    rebalanceThreshold: '10.0',
    maxSingleTransaction: '100.0',
    dailyTransactionLimit: 100,
    whitelistedAddresses: [],
    blacklistedAddresses: [],
    auditTrailEnabled: true,
    complianceReporting: true,
    kycRequired: false,
    evmChains: [
      {
        name: 'ethereum',
        chainId: 1,
        rpcUrl: 'https://mainnet.infura.io/v3/demo',
        nativeTokenSymbol: 'ETH'
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

  await walletMonitor.initialize();
  await treasuryManager.initialize();
  
  console.log('✅ Wallet monitor initialized');
  console.log('✅ Treasury manager initialized');

  // Step 3: Integrate systems
  console.log('\n🔗 Step 3: Integrate Payment Systems');
  
  paymentProcessor.setWalletMonitor(walletMonitor);
  paymentProcessor.setTreasuryManager(treasuryManager);
  
  console.log('✅ Systems integrated successfully');

  // Step 4: Setup customer wallets
  console.log('\n👥 Step 4: Setup Customer Wallet Portfolio');
  
  const seedGenerator = new SeedGenerator();
  const ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/demo');
  const btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
  
  await ethAdapter.connect();
  await btcAdapter.connect();

  // Create customer deposit addresses
  const customers: any[] = [];
  for (let i = 0; i < 5; i++) {
    const customerSeed = await seedGenerator.generateSeed({ strength: 128 });
    
    const ethWallet = await ethAdapter.generateAddress({
      seed: customerSeed.mnemonic,
      index: 0
    });
    
    const btcWallet = await btcAdapter.generateAddress({
      seed: customerSeed.mnemonic,
      index: 0
    });

    const customer = {
      id: `customer_${i + 1}`,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      wallets: {
        ethereum: ethWallet,
        bitcoin: btcWallet
      },
      depositHistory: [],
      withdrawalHistory: []
    };
    
    customers.push(customer);
    
    // Add to monitoring
    walletMonitor.addWallet({
      id: `${customer.id}_eth`,
      address: ethWallet.address,
      chainType: 'evm',
      chainName: 'ethereum',
      label: `${customer.name} ETH Deposit`
    });
    
    walletMonitor.addWallet({
      id: `${customer.id}_btc`,
      address: btcWallet.address,
      chainType: 'utxo',
      chainName: 'bitcoin',
      label: `${customer.name} BTC Deposit`
    });

    console.log(`👤 Created ${customer.name}:`);
    console.log(`   ETH: ${ethWallet.address}`);
    console.log(`   BTC: ${btcWallet.address}`);
  }

  // Step 5: Setup event tracking
  console.log('\n📡 Step 5: Setup Payment Event Tracking');
  
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalFees = 0;
  let batchCount = 0;

  // Deposit events
  paymentProcessor.on('depositDetected', (deposit) => {
    console.log(`\n📥 DEPOSIT DETECTED:`);
    console.log(`   ID: ${deposit.id}`);
    console.log(`   User: ${deposit.userId}`);
    console.log(`   Amount: ${deposit.amount} ${deposit.tokenSymbol || 'native'}`);
    console.log(`   Chain: ${deposit.chainName}`);
    console.log(`   Confirmations: ${deposit.confirmations}`);
    console.log(`   Status: ${deposit.status}`);
  });

  paymentProcessor.on('depositCredited', (deposit) => {
    totalDeposits++;
    console.log(`\n💳 DEPOSIT CREDITED:`);
    console.log(`   ID: ${deposit.id}`);
    console.log(`   Amount: ${deposit.amount}`);
    console.log(`   Total Deposits: ${totalDeposits}`);
    
    // Add to customer history
    const customer = customers.find(c => c.id === deposit.userId);
    if (customer) {
      customer.depositHistory.push({
        amount: deposit.amount,
        chain: deposit.chainName,
        timestamp: new Date(),
        txHash: deposit.txHash
      });
    }
  });

  // Withdrawal events
  paymentProcessor.on('withdrawalCreated', (withdrawal) => {
    console.log(`\n📤 WITHDRAWAL CREATED:`);
    console.log(`   ID: ${withdrawal.id}`);
    console.log(`   User: ${withdrawal.userId}`);
    console.log(`   Amount: ${withdrawal.amount}`);
    console.log(`   Fee: ${withdrawal.fee}`);
    console.log(`   Priority: ${withdrawal.priority}`);
    console.log(`   Status: ${withdrawal.status}`);
  });

  paymentProcessor.on('withdrawalCompleted', (withdrawal) => {
    totalWithdrawals++;
    totalFees += parseFloat(withdrawal.fee);
    console.log(`\n✅ WITHDRAWAL COMPLETED:`);
    console.log(`   ID: ${withdrawal.id}`);
    console.log(`   Amount: ${withdrawal.amount}`);
    console.log(`   Fee: ${withdrawal.fee}`);
    console.log(`   Total Withdrawals: ${totalWithdrawals}`);
    
    // Add to customer history
    const customer = customers.find(c => c.id === withdrawal.userId);
    if (customer) {
      customer.withdrawalHistory.push({
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        chain: withdrawal.chainName,
        timestamp: new Date(),
        txHash: withdrawal.txHash
      });
    }
  });

  // Batch events
  paymentProcessor.on('batchCreated', (batch) => {
    batchCount++;
    console.log(`\n📦 BATCH CREATED:`);
    console.log(`   ID: ${batch.id}`);
    console.log(`   Chain: ${batch.chainName}`);
    console.log(`   Withdrawals: ${batch.withdrawalIds.length}`);
    console.log(`   Total Amount: ${batch.totalAmount}`);
    console.log(`   Total Fee: ${batch.totalFee}`);
    console.log(`   Batch Count: ${batchCount}`);
  });

  paymentProcessor.on('batchCompleted', (batch) => {
    console.log(`\n✅ BATCH COMPLETED:`);
    console.log(`   ID: ${batch.id}`);
    console.log(`   Transaction Hash: ${batch.txHash}`);
  });

  // Step 6: Start payment processing
  console.log('\n🚀 Step 6: Start Automated Payment Processing');
  
  await walletMonitor.startMonitoring();
  await paymentProcessor.startProcessing();
  
  console.log('✅ Automated payment processing started');

  // Step 7: Simulate customer activity
  console.log('\n🎭 Step 7: Simulate Customer Activity');
  
  // Simulate deposits
  setTimeout(() => {
    console.log('\n💰 Simulating customer deposits...');
    
    customers.forEach((customer, index) => {
      setTimeout(() => {
        // Simulate ETH deposit
        walletMonitor.emit('newTransaction', {
          walletId: `${customer.id}_eth`,
          txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          from: '0x' + Math.random().toString(16).substring(2, 42),
          to: customer.wallets.ethereum.address,
          amount: (Math.random() * 2 + 0.1).toFixed(4),
          blockHeight: 18500000 + index,
          confirmations: 12,
          timestamp: new Date(),
          chainName: 'ethereum',
          type: 'incoming',
          status: 'confirmed'
        });
      }, index * 2000);
    });
  }, 3000);

  // Simulate Bitcoin deposits
  setTimeout(() => {
    console.log('\n🟡 Simulating Bitcoin deposits...');
    
    customers.slice(0, 2).forEach((customer, index) => {
      setTimeout(() => {
        walletMonitor.emit('newTransaction', {
          walletId: `${customer.id}_btc`,
          txHash: Math.random().toString(16).substring(2, 66),
          from: 'bc1q' + Math.random().toString(16).substring(2, 35),
          to: customer.wallets.bitcoin.address,
          amount: (Math.random() * 0.01 + 0.001).toFixed(6),
          blockHeight: 810000 + index,
          confirmations: 6,
          timestamp: new Date(),
          chainName: 'bitcoin',
          type: 'incoming',
          status: 'confirmed'
        });
      }, index * 3000);
    });
  }, 8000);

  // Step 8: Create withdrawal requests
  setTimeout(async () => {
    console.log('\n📤 Step 8: Create Customer Withdrawal Requests');
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      try {
        // Create ETH withdrawal
        const ethWithdrawalId = await paymentProcessor.createWithdrawal({
          userId: customer.id,
          destinationAddress: '0x' + Math.random().toString(16).substring(2, 42),
          chainName: 'ethereum',
          amount: (Math.random() * 0.5 + 0.1).toFixed(4),
          priority: ['low', 'normal', 'high'][i % 3] as any
        });
        
        console.log(`📋 Created ETH withdrawal for ${customer.name}: ${ethWithdrawalId}`);
        
        // Create Bitcoin withdrawal for some customers
        if (i < 2) {
          const btcWithdrawalId = await paymentProcessor.createWithdrawal({
            userId: customer.id,
            destinationAddress: 'bc1q' + Math.random().toString(16).substring(2, 35),
            chainName: 'bitcoin',
            amount: (Math.random() * 0.001 + 0.0001).toFixed(6),
            priority: 'normal'
          });
          
          console.log(`📋 Created BTC withdrawal for ${customer.name}: ${btcWithdrawalId}`);
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Failed to create withdrawal for ${customer.name}: ${error.message}`);
      }
    }
  }, 15000);

  // Step 9: Large withdrawal requiring approval
  setTimeout(async () => {
    console.log('\n🔐 Step 9: Large Withdrawal Approval Demo');
    
    try {
      const largeWithdrawalId = await paymentProcessor.createWithdrawal({
        userId: customers[0].id,
        destinationAddress: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        chainName: 'ethereum',
        amount: '15.0', // Above threshold
        priority: 'urgent'
      });
      
      console.log(`⏳ Large withdrawal created (requires approval): ${largeWithdrawalId}`);
      
      // Approve after delay
      setTimeout(async () => {
        await paymentProcessor.approveWithdrawal(largeWithdrawalId, 'admin@company.com');
        console.log(`✅ Large withdrawal approved: ${largeWithdrawalId}`);
      }, 5000);
      
    } catch (error) {
      console.log(`❌ Large withdrawal failed: ${error.message}`);
    }
  }, 25000);

  // Step 10: Performance monitoring
  const displayStats = async () => {
    const stats = paymentProcessor.getPaymentStats();
    console.log(`\n📊 PAYMENT PROCESSING STATS (${new Date().toLocaleTimeString()}):`);
    console.log(`   💰 Deposits:`);
    console.log(`     Total: ${stats.deposits.total}`);
    console.log(`     Confirmed: ${stats.deposits.confirmed}`);
    console.log(`     Pending: ${stats.deposits.pending}`);
    console.log(`     Value: ${stats.deposits.totalValue}`);
    console.log(`   📤 Withdrawals:`);
    console.log(`     Total: ${stats.withdrawals.total}`);
    console.log(`     Completed: ${stats.withdrawals.completed}`);
    console.log(`     Pending: ${stats.withdrawals.pending}`);
    console.log(`     Value: ${stats.withdrawals.totalValue}`);
    console.log(`   📦 Batches:`);
    console.log(`     Active: ${stats.batches.active}`);
    console.log(`     Completed: ${stats.batches.completed}`);
    console.log(`     Failed: ${stats.batches.failed}`);
    console.log(`   💸 Fees:`);
    console.log(`     Collected: ${stats.fees.totalCollected}`);
    console.log(`     Paid: ${stats.fees.totalPaid}`);
    console.log(`     Net: ${stats.fees.netFees}`);
  };

  // Display stats every 15 seconds
  const statsInterval = setInterval(displayStats, 15000);
  
  // Initial stats
  setTimeout(displayStats, 5000);

  // Step 11: Customer portfolio summary
  setTimeout(() => {
    console.log('\n👥 Step 11: Customer Portfolio Summary');
    
    customers.forEach(customer => {
      console.log(`\n👤 ${customer.name}:`);
      console.log(`   📧 ${customer.email}`);
      console.log(`   💰 Deposits: ${customer.depositHistory.length}`);
      console.log(`   📤 Withdrawals: ${customer.withdrawalHistory.length}`);
      
      const totalDeposited = customer.depositHistory.reduce(
        (sum: number, d: any) => sum + parseFloat(d.amount), 0
      );
      const totalWithdrawn = customer.withdrawalHistory.reduce(
        (sum: number, w: any) => sum + parseFloat(w.amount), 0
      );
      const totalFeesPaid = customer.withdrawalHistory.reduce(
        (sum: number, w: any) => sum + parseFloat(w.fee || '0'), 0
      );
      
      console.log(`   📊 Total Deposited: ${totalDeposited.toFixed(6)}`);
      console.log(`   📊 Total Withdrawn: ${totalWithdrawn.toFixed(6)}`);
      console.log(`   📊 Fees Paid: ${totalFeesPaid.toFixed(6)}`);
      console.log(`   📊 Net Balance: ${(totalDeposited - totalWithdrawn).toFixed(6)}`);
    });
  }, 35000);

  // Step 12: Cleanup
  setTimeout(async () => {
    console.log('\n🧹 Step 12: System Cleanup');
    
    clearInterval(statsInterval);
    
    // Final stats
    await displayStats();
    
    // Stop systems
    walletMonitor.stopMonitoring();
    await paymentProcessor.stopProcessing();
    
    // Disconnect
    await ethAdapter.disconnect();
    await btcAdapter.disconnect();
    await walletMonitor.shutdown();
    await treasuryManager.shutdown();
    await paymentProcessor.shutdown();
    
    console.log('\n🎉 Automated Payment Processing Example Complete!');
    console.log('==================================================');
    
    setTimeout(() => process.exit(0), 2000);
  }, 45000);
}

// Export for use in other examples
export { automatedPaymentProcessing };

// Run if called directly
if (require.main === module) {
  automatedPaymentProcessing()
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
