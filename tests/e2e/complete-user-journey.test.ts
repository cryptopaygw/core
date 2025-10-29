/**
 * Complete User Journey End-to-End Tests
 * 
 * This test suite simulates real-world user scenarios from start to finish,
 * testing the entire cryptocurrency payment ecosystem integration:
 * 
 * - Wallet creation and monitoring setup
 * - Deposit detection and processing pipeline
 * - Treasury management integration
 * - Withdrawal processing and execution
 * - Cross-system error handling and recovery
 * - Complete payment lifecycle validation
 */

import { WalletMonitor, createWalletMonitor } from '../../src/monitoring/wallet-monitor';
import { TreasuryManager, createTreasuryManager } from '../../src/treasury/treasury-manager';
import { PaymentProcessor, createPaymentProcessor } from '../../src/payment/payment-processor';
import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';

describe('Complete User Journey E2E Tests', () => {
  let walletMonitor: WalletMonitor;
  let treasuryManager: TreasuryManager;
  let paymentProcessor: PaymentProcessor;
  let ethAdapter: any;
  let btcAdapter: any;

  // Test user data
  const testUser = {
    id: 'user_001',
    depositWallets: {
      ethereum: '',
      bitcoin: ''
    },
    expectedDeposits: new Map(),
    withdrawalRequests: new Map()
  };

  const testSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  beforeAll(async () => {
    console.log('🚀 Setting up Complete E2E Test Environment...');

    // Initialize adapters
    ethAdapter = EVMAdapterFactory.createEthereum('https://eth-sepolia.g.alchemy.com/v2/demo');
    btcAdapter = UTXOAdapterFactory.createBitcoinTestnet('https://blockstream.info/testnet/api');

    // Initialize monitoring system
    walletMonitor = createWalletMonitor({
      balanceCheckInterval: 5000, // 5 seconds for faster testing
      transactionCheckInterval: 3000, // 3 seconds
      confirmationThreshold: 1, // Lower for testnet
      maxConcurrentChecks: 5,
      retryAttempts: 2,
      retryDelay: 1000,
      evmChains: [{
        name: 'ethereum-sepolia',
        chainId: 11155111,
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
        nativeTokenSymbol: 'ETH'
      }],
      utxoChains: [{
        name: 'bitcoin-testnet',
        network: 'testnet',
        apiBaseUrl: 'https://blockstream.info/testnet/api',
        nativeTokenSymbol: 'tBTC'
      }]
    });

    // Initialize treasury management
    treasuryManager = createTreasuryManager({
      multiSigRequired: true,
      requiredSignatures: 1, // Simplified for testing
      maxDailyWithdrawal: '1.0',
      emergencyStopEnabled: true,
      hotWalletThreshold: '0.1',
      coldWalletRatio: 0.7,
      autoPooling: true,
      autoDistribution: false,
      rebalanceThreshold: '0.05',
      maxSingleTransaction: '0.5',
      dailyTransactionLimit: 10,
      whitelistedAddresses: [],
      blacklistedAddresses: [],
      auditTrailEnabled: true,
      complianceReporting: true,
      kycRequired: false,
      evmChains: [{
        name: 'ethereum-sepolia',
        chainId: 11155111,
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
        nativeTokenSymbol: 'ETH'
      }],
      utxoChains: [{
        name: 'bitcoin-testnet',
        network: 'testnet',
        apiBaseUrl: 'https://blockstream.info/testnet/api',
        nativeTokenSymbol: 'tBTC'
      }]
    });

    // Initialize payment processor
    paymentProcessor = createPaymentProcessor({
      enableAutomatedProcessing: true,
      processingInterval: 2000, // 2 seconds for testing
      batchSize: 3,
      maxRetryAttempts: 2,
      depositConfirmations: {
        'ethereum-sepolia': 1,
        'bitcoin-testnet': 1
      },
      minimumDepositAmounts: {
        'ethereum-sepolia': '0.001',
        'bitcoin-testnet': '0.00001'
      },
      depositProcessingDelay: 5000, // 5 seconds
      withdrawalLimits: {
        'ethereum-sepolia': '0.5',
        'bitcoin-testnet': '0.001'
      },
      withdrawalFeeSettings: {
        strategy: 'fixed',
        fixedFees: {
          'ethereum-sepolia': '0.001',
          'bitcoin-testnet': '0.00001'
        },
        percentageFees: {},
        dynamicFeeMultiplier: 1.2,
        maxFeePercentage: 5
      },
      withdrawalBatchingEnabled: true,
      withdrawalProcessingWindows: [],
      requireApprovalForLargeAmounts: true,
      largeAmountThreshold: '0.1',
      hotWalletLimits: {
        'ethereum-sepolia': '0.2',
        'bitcoin-testnet': '0.002'
      },
      walletMonitorEnabled: true,
      treasuryIntegrationEnabled: true,
      complianceCheckEnabled: true,
      evmChains: [{
        name: 'ethereum-sepolia',
        chainId: 11155111,
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
        nativeTokenSymbol: 'ETH'
      }],
      utxoChains: [{
        name: 'bitcoin-testnet',
        network: 'testnet',
        apiBaseUrl: 'https://blockstream.info/testnet/api',
        nativeTokenSymbol: 'tBTC'
      }]
    });

    console.log('✅ E2E Test Environment Setup Complete');
  }, 30000);

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E Test Environment...');
    
    if (walletMonitor) await walletMonitor.shutdown();
    if (treasuryManager) await treasuryManager.shutdown();
    if (paymentProcessor) await paymentProcessor.shutdown();
  }, 10000);

  describe('Journey 1: Complete Payment Lifecycle', () => {
    test('should complete full deposit-to-withdrawal lifecycle', async () => {
      console.log('🎯 Starting Complete Payment Lifecycle Test...');
      
      // Step 1: Initialize all systems
      await walletMonitor.initialize();
      await treasuryManager.initialize();
      await paymentProcessor.initialize();

      // Step 2: Integrate systems
      paymentProcessor.setWalletMonitor(walletMonitor);
      paymentProcessor.setTreasuryManager(treasuryManager);

      // Step 3: Generate user deposit wallets
      const ethWallet = await ethAdapter.generateAddress({
        seed: testSeed,
        index: 0
      });
      
      const btcWallet = await btcAdapter.generateAddress({
        seed: testSeed,
        index: 0
      });

      testUser.depositWallets.ethereum = ethWallet.address;
      testUser.depositWallets.bitcoin = btcWallet.address;

      console.log(`📝 Generated deposit wallets:
        ETH: ${ethWallet.address}
        BTC: ${btcWallet.address}`);

      // Step 4: Add wallets to monitoring
      walletMonitor.addWallet({
        id: `${testUser.id}_eth`,
        address: ethWallet.address,
        chainType: 'evm',
        chainName: 'ethereum-sepolia',
        label: `${testUser.id} Ethereum Deposit`
      });

      walletMonitor.addWallet({
        id: `${testUser.id}_btc`,
        address: btcWallet.address,
        chainType: 'utxo',
        chainName: 'bitcoin-testnet',
        label: `${testUser.id} Bitcoin Deposit`
      });

      // Step 5: Start monitoring
      await walletMonitor.startMonitoring();
      await paymentProcessor.startProcessing();

      console.log('✅ Monitoring and processing started');

      // Step 6: Add treasury wallets
      const hotWalletId = await treasuryManager.addTreasuryWallet({
        id: 'hot_eth_001',
        address: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6', // Mock hot wallet
        chainName: 'ethereum-sepolia',
        type: 'hot',
        purpose: 'operational',
        threshold: '0.1',
        label: 'ETH Hot Wallet'
      });

      const coldWalletId = await treasuryManager.addTreasuryWallet({
        id: 'cold_eth_001',
        address: '0x8ba1f109551bD432803012645Hac136c32960442', // Mock cold wallet
        chainName: 'ethereum-sepolia',
        type: 'cold',
        purpose: 'reserve',
        label: 'ETH Cold Wallet'
      });

      console.log(`🏛️ Treasury wallets added: Hot=${hotWalletId}, Cold=${coldWalletId}`);

      // Step 7: Simulate incoming deposit
      const mockDepositEvent = {
        walletId: `${testUser.id}_eth`,
        txHash: '0xabc123def456789012345678901234567890abcdef123456789012345678901234',
        from: '0x1234567890123456789012345678901234567890',
        to: ethWallet.address,
        amount: '0.05', // 0.05 ETH
        blockHeight: 12345678,
        confirmations: 1,
        timestamp: new Date(),
        chainName: 'ethereum-sepolia',
        type: 'incoming' as const,
        status: 'confirmed' as const
      };

      // Step 8: Track events through system
      const events: string[] = [];
      
      walletMonitor.on('balanceChange', (event) => {
        console.log(`💰 Balance changed: ${event.address} - ${event.difference}`);
        events.push('balance_changed');
      });

      paymentProcessor.on('depositDetected', (deposit) => {
        console.log(`📥 Deposit detected: ${deposit.id} - ${deposit.amount}`);
        events.push('deposit_detected');
      });

      paymentProcessor.on('depositCredited', (deposit) => {
        console.log(`💳 Deposit credited: ${deposit.id} - ${deposit.amount}`);
        events.push('deposit_credited');
      });

      treasuryManager.on('operationExecuted', (operation) => {
        console.log(`⚡ Treasury operation executed: ${operation.type}`);
        events.push('treasury_operation');
      });

      // Step 9: Emit deposit event
      walletMonitor.emit('newTransaction', mockDepositEvent);

      // Step 10: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 11: Verify deposit was processed
      const depositStats = paymentProcessor.getPaymentStats();
      console.log('📊 Deposit Stats:', depositStats);

      expect(events).toContain('deposit_detected');

      // Step 12: Create withdrawal request
      const withdrawalId = await paymentProcessor.createWithdrawal({
        userId: testUser.id,
        destinationAddress: '0x9876543210987654321098765432109876543210',
        chainName: 'ethereum-sepolia',
        amount: '0.02', // 0.02 ETH
        priority: 'normal'
      });

      console.log(`📤 Withdrawal created: ${withdrawalId}`);

      // Step 13: Track withdrawal processing
      paymentProcessor.on('withdrawalProcessing', (withdrawal) => {
        console.log(`💸 Withdrawal processing: ${withdrawal.id}`);
        events.push('withdrawal_processing');
      });

      paymentProcessor.on('withdrawalCompleted', (withdrawal) => {
        console.log(`✅ Withdrawal completed: ${withdrawal.id}`);
        events.push('withdrawal_completed');
      });

      // Step 14: Wait for withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Step 15: Verify complete lifecycle
      const finalStats = paymentProcessor.getPaymentStats();
      console.log('📊 Final Stats:', finalStats);

      expect(events).toContain('deposit_detected');
      expect(finalStats.withdrawals.total).toBeGreaterThanOrEqual(1);

      console.log('🎉 Complete Payment Lifecycle Test Successful!');
    }, 60000);
  });

  describe('Journey 2: Multi-Chain Operations', () => {
    test('should handle cross-chain deposit and withdrawal', async () => {
      console.log('🌐 Starting Multi-Chain Operations Test...');

      // Step 1: Create wallets on different chains
      const ethWallet2 = await ethAdapter.generateAddress({
        seed: testSeed,
        index: 1
      });

      const btcWallet2 = await btcAdapter.generateAddress({
        seed: testSeed,
        index: 1
      });

      // Step 2: Add to monitoring
      walletMonitor.addWallet({
        id: 'multichain_eth',
        address: ethWallet2.address,
        chainType: 'evm',
        chainName: 'ethereum-sepolia',
        label: 'Multi-chain ETH'
      });

      walletMonitor.addWallet({
        id: 'multichain_btc',
        address: btcWallet2.address,
        chainType: 'utxo',
        chainName: 'bitcoin-testnet',
        label: 'Multi-chain BTC'
      });

      // Step 3: Simulate deposits on both chains
      const ethDeposit = {
        walletId: 'multichain_eth',
        txHash: '0xdef123abc456789012345678901234567890abcdef123456789012345678901234',
        from: '0x1111111111111111111111111111111111111111',
        to: ethWallet2.address,
        amount: '0.08',
        blockHeight: 12345679,
        confirmations: 1,
        timestamp: new Date(),
        chainName: 'ethereum-sepolia',
        type: 'incoming' as const,
        status: 'confirmed' as const
      };

      const btcDeposit = {
        walletId: 'multichain_btc',
        txHash: 'abc123def456789012345678901234567890abcdef123456789012345678901234567',
        from: 'tb1q1234567890123456789012345678901234567890',
        to: btcWallet2.address,
        amount: '0.001',
        blockHeight: 2345678,
        confirmations: 1,
        timestamp: new Date(),
        chainName: 'bitcoin-testnet',
        type: 'incoming' as const,
        status: 'confirmed' as const
      };

      const multiChainEvents: string[] = [];

      paymentProcessor.on('depositDetected', (deposit) => {
        multiChainEvents.push(`deposit_${deposit.chainName}`);
        console.log(`📥 Multi-chain deposit: ${deposit.chainName} - ${deposit.amount}`);
      });

      // Step 4: Emit both deposits
      walletMonitor.emit('newTransaction', ethDeposit);
      walletMonitor.emit('newTransaction', btcDeposit);

      // Step 5: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Step 6: Create withdrawals on different chains
      const ethWithdrawalId = await paymentProcessor.createWithdrawal({
        userId: 'multichain_user',
        destinationAddress: '0x5555555555555555555555555555555555555555',
        chainName: 'ethereum-sepolia',
        amount: '0.03',
        priority: 'high'
      });

      const btcWithdrawalId = await paymentProcessor.createWithdrawal({
        userId: 'multichain_user',
        destinationAddress: 'tb1q5555555555555555555555555555555555555',
        chainName: 'bitcoin-testnet',
        amount: '0.0005',
        priority: 'normal'
      });

      console.log(`🔄 Cross-chain withdrawals: ETH=${ethWithdrawalId}, BTC=${btcWithdrawalId}`);

      // Step 7: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 8: Verify multi-chain operations
      const stats = paymentProcessor.getPaymentStats();
      
      expect(multiChainEvents).toContain('deposit_ethereum-sepolia');
      expect(multiChainEvents).toContain('deposit_bitcoin-testnet');
      expect(stats.deposits.total).toBeGreaterThanOrEqual(2);
      expect(stats.withdrawals.total).toBeGreaterThanOrEqual(2);

      console.log('🌟 Multi-Chain Operations Test Successful!');
    }, 45000);
  });

  describe('Journey 3: Treasury Management Workflow', () => {
    test('should execute complete treasury management workflow', async () => {
      console.log('🏛️ Starting Treasury Management Workflow Test...');

      // Step 1: Setup treasury operations monitoring
      const treasuryEvents: string[] = [];
      
      treasuryManager.on('operationCreated', (operation) => {
        console.log(`📝 Treasury operation created: ${operation.type}`);
        treasuryEvents.push(`created_${operation.type}`);
      });

      treasuryManager.on('operationExecuted', (operation) => {
        console.log(`⚡ Treasury operation executed: ${operation.type}`);
        treasuryEvents.push(`executed_${operation.type}`);
      });

      treasuryManager.on('balanceChanged', (event) => {
        console.log(`💰 Treasury balance changed: ${event.walletId}`);
        treasuryEvents.push('balance_changed');
      });

      // Step 2: Create treasury operation
      const transferOperationId = await treasuryManager.createOperation({
        type: 'transfer',
        fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
        amount: '0.05',
        chainName: 'ethereum-sepolia',
        requiredSignatures: 1,
        approvedBy: [],
        reason: 'E2E Test Transfer',
        requestedBy: 'test-system'
      });

      console.log(`🔄 Treasury transfer created: ${transferOperationId}`);

      // Step 3: Approve operation
      await treasuryManager.approveOperation(transferOperationId, 'test-approver');

      // Step 4: Wait for execution
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 5: Test rebalancing
      const rebalanceId = await treasuryManager.createOperation({
        type: 'rebalance',
        fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
        amount: '0.02',
        chainName: 'ethereum-sepolia',
        requiredSignatures: 1,
        approvedBy: [],
        reason: 'Hot wallet rebalancing',
        requestedBy: 'auto-rebalancer'
      });

      await treasuryManager.approveOperation(rebalanceId, 'auto-system');

      // Step 6: Test emergency stop
      treasuryManager.enableEmergencyStop('security-admin');
      expect(treasuryManager.isEmergencyStopped()).toBe(true);

      // Step 7: Try to create operation during emergency stop
      await expect(
        treasuryManager.createOperation({
          type: 'transfer',
          fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
          toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
          amount: '0.01',
          chainName: 'ethereum-sepolia',
          requiredSignatures: 1,
          approvedBy: [],
          reason: 'Should fail',
          requestedBy: 'test'
        })
      ).rejects.toThrow('Emergency stop');

      // Step 8: Disable emergency stop
      treasuryManager.disableEmergencyStop('security-admin');
      expect(treasuryManager.isEmergencyStopped()).toBe(false);

      // Step 9: Generate treasury report
      const report = treasuryManager.getTreasuryReport();
      console.log('📊 Treasury Report:', report);

      // Step 10: Verify audit trail
      const auditTrail = treasuryManager.getAuditTrail(10);
      expect(auditTrail.length).toBeGreaterThan(0);

      // Step 11: Verify operations completed
      expect(treasuryEvents).toContain('created_transfer');
      expect(treasuryEvents).toContain('created_rebalance');
      expect(report.summary.totalOperations).toBeGreaterThanOrEqual(2);

      console.log('🏆 Treasury Management Workflow Test Successful!');
    }, 30000);
  });

  describe('Journey 4: Error Handling and Recovery', () => {
    test('should handle system failures and recover gracefully', async () => {
      console.log('🛡️ Starting Error Handling and Recovery Test...');

      const errorEvents: string[] = [];

      // Step 1: Monitor error events
      paymentProcessor.on('depositFailed', (deposit) => {
        console.log(`❌ Deposit failed: ${deposit.id}`);
        errorEvents.push('deposit_failed');
      });

      paymentProcessor.on('withdrawalFailed', (withdrawal) => {
        console.log(`❌ Withdrawal failed: ${withdrawal.id}`);
        errorEvents.push('withdrawal_failed');
      });

      treasuryManager.on('operationFailed', ({ operation, error }) => {
        console.log(`❌ Treasury operation failed: ${operation.id}`);
        errorEvents.push('operation_failed');
      });

      // Step 2: Test invalid deposit scenario
      const invalidDeposit = {
        walletId: 'nonexistent_wallet',
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000000',
        amount: '-0.01', // Invalid negative amount
        blockHeight: 0,
        confirmations: 0,
        timestamp: new Date(),
        chainName: 'nonexistent-chain',
        type: 'incoming' as const,
        status: 'failed' as const
      };

      walletMonitor.emit('newTransaction', invalidDeposit);

      // Step 3: Test invalid withdrawal
      await expect(
        paymentProcessor.createWithdrawal({
          userId: 'test_user',
          destinationAddress: 'invalid-address',
          chainName: 'ethereum-sepolia',
          amount: '0.01',
          priority: 'normal'
        })
      ).rejects.toThrow();

      // Step 4: Test treasury operation with insufficient funds
      await expect(
        treasuryManager.createOperation({
          type: 'transfer',
          fromWallet: '0x0000000000000000000000000000000000000000',
          toWallet: '0x1111111111111111111111111111111111111111',
          amount: '999999.99', // Unrealistic amount
          chainName: 'ethereum-sepolia',
          requiredSignatures: 1,
          approvedBy: [],
          reason: 'Should fail - insufficient funds',
          requestedBy: 'test'
        })
      ).rejects.toThrow();

      // Step 5: Test connection failure recovery
      await walletMonitor.shutdown();
      
      // Try to restart
      await walletMonitor.initialize();
      expect(walletMonitor).toBeDefined();

      // Step 6: Test rapid restart capability
      await paymentProcessor.stopProcessing();
      await paymentProcessor.startProcessing();

      // Step 7: Verify system resilience
      const stats = paymentProcessor.getPaymentStats();
      expect(stats).toBeDefined();

      const treasuryReport = treasuryManager.getTreasuryReport();
      expect(treasuryReport).toBeDefined();

      // Step 8: Test memory and resource management
      const monitoringStats = await walletMonitor.getMonitoringStats();
      expect(monitoringStats.isMonitoring).toBe(true);

      console.log('💪 Error Handling and Recovery Test Successful!');
    }, 25000);
  });

  describe('Journey 5: Performance and Scalability', () => {
    test('should handle high-volume operations efficiently', async () => {
      console.log('⚡ Starting Performance and Scalability Test...');

      const startTime = Date.now();
      const operations: Promise<any>[] = [];

      // Step 1: Generate multiple wallets concurrently
      const walletPromises = [];
      for (let i = 0; i < 10; i++) {
        walletPromises.push(
          ethAdapter.generateAddress({ seed: testSeed, index: i + 100 })
        );
      }

      const wallets = await Promise.all(walletPromises);
      expect(wallets).toHaveLength(10);

      // Step 2: Add all wallets to monitoring
      wallets.forEach((wallet, index) => {
        walletMonitor.addWallet({
          id: `perf_test_${index}`,
          address: wallet.address,
          chainType: 'evm',
          chainName: 'ethereum-sepolia',
          label: `Performance Test Wallet ${index}`
        });
      });

      // Step 3: Generate multiple deposit events
      const depositEvents = wallets.map((wallet, index) => ({
        walletId: `perf_test_${index}`,
        txHash: `0x${index.toString().padStart(64, '0')}`,
        from: '0x1111111111111111111111111111111111111111',
        to: wallet.address,
        amount: (0.001 + index * 0.001).toString(),
        blockHeight: 12345680 + index,
        confirmations: 1,
        timestamp: new Date(),
        chainName: 'ethereum-sepolia',
        type: 'incoming' as const,
        status: 'confirmed' as const
      }));

      // Step 4: Process all deposits concurrently
      depositEvents.forEach(deposit => {
        walletMonitor.emit('newTransaction', deposit);
      });

      // Step 5: Create multiple withdrawal requests
      for (let i = 0; i < 5; i++) {
        operations.push(
          paymentProcessor.createWithdrawal({
            userId: `perf_user_${i}`,
            destinationAddress: `0x${(i + 1).toString().padStart(40, '0')}`,
            chainName: 'ethereum-sepolia',
            amount: (0.005 + i * 0.001).toString(),
            priority: 'normal'
          })
        );
      }

      // Step 6: Create multiple treasury operations
      for (let i = 0; i < 3; i++) {
        operations.push(
          treasuryManager.createOperation({
            type: 'transfer',
            fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
            toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
            amount: (0.01 + i * 0.005).toString(),
            chainName: 'ethereum-sepolia',
            requiredSignatures: 1,
            approvedBy: [],
            reason: `Performance test operation ${i}`,
            requestedBy: 'performance-test'
          })
        );
      }

      // Step 7: Wait for all operations to complete
      await Promise.allSettled(operations);

      // Step 8: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Step 9: Verify performance metrics
      const finalStats = paymentProcessor.getPaymentStats();
      const treasuryReport = treasuryManager.getTreasuryReport();
      const monitoringStats = await walletMonitor.getMonitoringStats();

      console.log(`⏱️ Performance Test Results:
        Duration: ${duration}ms
        Wallets Created: ${wallets.length}
        Deposits Processed: ${finalStats.deposits.total}
        Withdrawals Created: ${finalStats.withdrawals.total}
        Treasury Operations: ${treasuryReport.summary.totalOperations}
        Monitoring Status: ${monitoringStats.isMonitoring}
      `);

      // Step 10: Verify all operations completed within reasonable time
      expect(duration).toBeLessThan(45000); // 45 seconds max
      expect(finalStats.deposits.total).toBeGreaterThanOrEqual(10);
      expect(finalStats.withdrawals.total).toBeGreaterThanOrEqual(5);
      expect(treasuryReport.summary.totalOperations).toBeGreaterThanOrEqual(3);

      console.log('⚡ Performance and Scalability Test Successful!');
    }, 50000);
  });
});
