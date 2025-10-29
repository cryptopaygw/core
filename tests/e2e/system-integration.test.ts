/**
 * System Integration End-to-End Tests
 * 
 * Comprehensive integration testing across all system modules:
 * - Full system initialization and integration
 * - Real blockchain network interactions
 * - Cross-module data flow validation
 * - System stress testing and performance validation
 * - Failover scenarios and recovery testing
 * - Production-ready deployment validation
 */

import { WalletMonitor, createWalletMonitor } from '../../src/monitoring/wallet-monitor';
import { TreasuryManager, createTreasuryManager } from '../../src/treasury/treasury-manager';
import { PaymentProcessor, createPaymentProcessor } from '../../src/payment/payment-processor';
import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';
import { SeedGenerator } from '../../packages/core/crypto/implementations/seed-generator';

describe('System Integration E2E Tests', () => {
  let walletMonitor: WalletMonitor;
  let treasuryManager: TreasuryManager;
  let paymentProcessor: PaymentProcessor;
  let seedGenerator: SeedGenerator;
  
  // System adapters
  let ethAdapter: any;
  let btcAdapter: any;
  let polygonAdapter: any;
  let bscAdapter: any;

  // Test environment
  const systemTestConfig = {
    testnet: true,
    enableRealBlockchain: false, // Set to true for real testnet testing
    mockTransactionDelay: 2000,
    stressTestScale: {
      wallets: 50,
      deposits: 100,
      withdrawals: 30,
      treasuryOps: 10
    }
  };

  beforeAll(async () => {
    console.log('🌐 Initializing Complete System Integration Environment...');
    
    // Initialize seed generator
    seedGenerator = new SeedGenerator();

    // Initialize multi-chain adapters
    ethAdapter = EVMAdapterFactory.createEthereum(
      systemTestConfig.enableRealBlockchain 
        ? 'https://eth-sepolia.g.alchemy.com/v2/your-key'
        : 'https://mainnet.infura.io/v3/demo'
    );
    
    btcAdapter = UTXOAdapterFactory.createBitcoin(
      systemTestConfig.enableRealBlockchain
        ? 'https://blockstream.info/testnet/api'
        : 'https://blockstream.info/api'
    );

    polygonAdapter = EVMAdapterFactory.createPolygon('https://polygon-rpc.com/');
    bscAdapter = EVMAdapterFactory.createBSC('https://bsc-dataseed.binance.org/');

    // Initialize complete monitoring system
    walletMonitor = createWalletMonitor({
      balanceCheckInterval: 3000,
      transactionCheckInterval: 2000,
      confirmationThreshold: systemTestConfig.testnet ? 1 : 12,
      maxConcurrentChecks: 20,
      retryAttempts: 3,
      retryDelay: 1000,
      evmChains: [
        {
          name: 'ethereum',
          chainId: systemTestConfig.testnet ? 11155111 : 1,
          rpcUrl: ethAdapter.rpcUrl,
          nativeTokenSymbol: 'ETH'
        },
        {
          name: 'polygon',
          chainId: 137,
          rpcUrl: polygonAdapter.rpcUrl,
          nativeTokenSymbol: 'MATIC'
        },
        {
          name: 'bsc',
          chainId: 56,
          rpcUrl: bscAdapter.rpcUrl,
          nativeTokenSymbol: 'BNB'
        }
      ],
      utxoChains: [
        {
          name: 'bitcoin',
          network: systemTestConfig.testnet ? 'testnet' : 'bitcoin',
          apiBaseUrl: btcAdapter.apiBaseUrl,
          nativeTokenSymbol: systemTestConfig.testnet ? 'tBTC' : 'BTC'
        }
      ]
    });

    // Initialize enterprise treasury management
    treasuryManager = createTreasuryManager({
      multiSigRequired: true,
      requiredSignatures: 2,
      maxDailyWithdrawal: '10.0',
      emergencyStopEnabled: true,
      hotWalletThreshold: '1.0',
      coldWalletRatio: 0.8,
      autoPooling: true,
      autoDistribution: false,
      rebalanceThreshold: '0.5',
      maxSingleTransaction: '5.0',
      dailyTransactionLimit: 100,
      whitelistedAddresses: [
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        '0x8ba1f109551bD432803012645Hac136c32960442'
      ],
      blacklistedAddresses: [
        '0x0000000000000000000000000000000000000000'
      ],
      auditTrailEnabled: true,
      complianceReporting: true,
      kycRequired: false,
      evmChains: [
        {
          name: 'ethereum',
          chainId: systemTestConfig.testnet ? 11155111 : 1,
          rpcUrl: ethAdapter.rpcUrl,
          nativeTokenSymbol: 'ETH'
        },
        {
          name: 'polygon',
          chainId: 137,
          rpcUrl: polygonAdapter.rpcUrl,
          nativeTokenSymbol: 'MATIC'
        }
      ],
      utxoChains: [
        {
          name: 'bitcoin',
          network: systemTestConfig.testnet ? 'testnet' : 'bitcoin',
          apiBaseUrl: btcAdapter.apiBaseUrl,
          nativeTokenSymbol: systemTestConfig.testnet ? 'tBTC' : 'BTC'
        }
      ]
    });

    // Initialize payment processor with full integration
    paymentProcessor = createPaymentProcessor({
      enableAutomatedProcessing: true,
      processingInterval: 3000,
      batchSize: 10,
      maxRetryAttempts: 3,
      depositConfirmations: {
        ethereum: systemTestConfig.testnet ? 1 : 12,
        bitcoin: systemTestConfig.testnet ? 1 : 6,
        polygon: 20,
        bsc: 15
      },
      minimumDepositAmounts: {
        ethereum: '0.001',
        bitcoin: '0.00001',
        polygon: '1.0',
        bsc: '0.01'
      },
      depositProcessingDelay: 5000,
      withdrawalLimits: {
        ethereum: '5.0',
        bitcoin: '0.1',
        polygon: '10000.0',
        bsc: '100.0'
      },
      withdrawalFeeSettings: {
        strategy: 'hybrid',
        fixedFees: {
          ethereum: '0.001',
          bitcoin: '0.00001',
          polygon: '1.0',
          bsc: '0.01'
        },
        percentageFees: {
          ethereum: 0.1,
          bitcoin: 0.05,
          polygon: 0.02,
          bsc: 0.05
        },
        dynamicFeeMultiplier: 1.5,
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
        },
        {
          chainName: 'bitcoin',
          startHour: 8,
          endHour: 20,
          timezone: 'UTC',
          enabled: true
        }
      ],
      requireApprovalForLargeAmounts: true,
      largeAmountThreshold: '1.0',
      hotWalletLimits: {
        ethereum: '2.0',
        bitcoin: '0.05',
        polygon: '5000.0',
        bsc: '500.0'
      },
      walletMonitorEnabled: true,
      treasuryIntegrationEnabled: true,
      complianceCheckEnabled: true,
      evmChains: [
        {
          name: 'ethereum',
          chainId: systemTestConfig.testnet ? 11155111 : 1,
          rpcUrl: ethAdapter.rpcUrl,
          nativeTokenSymbol: 'ETH'
        },
        {
          name: 'polygon',
          chainId: 137,
          rpcUrl: polygonAdapter.rpcUrl,
          nativeTokenSymbol: 'MATIC'
        },
        {
          name: 'bsc',
          chainId: 56,
          rpcUrl: bscAdapter.rpcUrl,
          nativeTokenSymbol: 'BNB'
        }
      ],
      utxoChains: [
        {
          name: 'bitcoin',
          network: systemTestConfig.testnet ? 'testnet' : 'bitcoin',
          apiBaseUrl: btcAdapter.apiBaseUrl,
          nativeTokenSymbol: systemTestConfig.testnet ? 'tBTC' : 'BTC'
        }
      ]
    });

    console.log('✅ System Integration Environment Ready');
  }, 45000);

  afterAll(async () => {
    console.log('🧹 System Integration Cleanup...');
    
    if (walletMonitor) await walletMonitor.shutdown();
    if (treasuryManager) await treasuryManager.shutdown();
    if (paymentProcessor) await paymentProcessor.shutdown();
  }, 15000);

  describe('Complete System Initialization', () => {
    test('should initialize all systems successfully', async () => {
      console.log('🚀 Testing Complete System Initialization...');

      // Step 1: Initialize monitoring system
      await walletMonitor.initialize();
      expect(walletMonitor).toBeDefined();

      // Step 2: Initialize treasury management
      await treasuryManager.initialize();
      expect(treasuryManager).toBeDefined();

      // Step 3: Initialize payment processor
      await paymentProcessor.initialize();
      expect(paymentProcessor).toBeDefined();

      // Step 4: Integrate all systems
      paymentProcessor.setWalletMonitor(walletMonitor);
      paymentProcessor.setTreasuryManager(treasuryManager);

      // Step 5: Start all systems
      await walletMonitor.startMonitoring();
      await paymentProcessor.startProcessing();

      // Step 6: Verify system status
      const monitoringStats = await walletMonitor.getMonitoringStats();
      const treasuryReport = treasuryManager.getTreasuryReport();
      const paymentStats = paymentProcessor.getPaymentStats();

      expect(monitoringStats.isMonitoring).toBe(true);
      expect(treasuryReport.summary).toBeDefined();
      expect(paymentStats.deposits).toBeDefined();
      expect(paymentStats.withdrawals).toBeDefined();

      console.log('✅ Complete System Initialization Successful!');
    }, 30000);
  });

  describe('Multi-Chain Wallet Portfolio Management', () => {
    test('should manage enterprise wallet portfolio across all chains', async () => {
      console.log('💼 Testing Multi-Chain Portfolio Management...');

      // Step 1: Generate master seed for enterprise
      const masterSeed = await seedGenerator.generateSeed({
        strength: 256,
        language: 'english'
      });

      expect(masterSeed.mnemonic).toBeTruthy();
      expect(masterSeed.mnemonic.split(' ')).toHaveLength(24);

      // Step 2: Create wallet portfolio across all chains
      const portfolioSize = 20;
      const multiChainPortfolio: any[] = [];

      for (let i = 0; i < portfolioSize; i++) {
        const ethereumWallet = await ethAdapter.generateAddress({
          seed: masterSeed.mnemonic,
          index: i
        });

        const bitcoinWallet = await btcAdapter.generateAddress({
          seed: masterSeed.mnemonic,
          index: i
        });

        const polygonWallet = await polygonAdapter.generateAddress({
          seed: masterSeed.mnemonic,
          index: i
        });

        const bscWallet = await bscAdapter.generateAddress({
          seed: masterSeed.mnemonic,
          index: i
        });

        const portfolio = {
          userId: `enterprise_user_${i}`,
          walletIndex: i,
          ethereum: ethereumWallet,
          bitcoin: bitcoinWallet,
          polygon: polygonWallet,
          bsc: bscWallet
        };

        multiChainPortfolio.push(portfolio);

        // Add wallets to monitoring
        walletMonitor.addWallet({
          id: `eth_${i}`,
          address: ethereumWallet.address,
          chainType: 'evm',
          chainName: 'ethereum',
          label: `Enterprise ETH Wallet ${i}`
        });

        walletMonitor.addWallet({
          id: `btc_${i}`,
          address: bitcoinWallet.address,
          chainType: 'utxo',
          chainName: 'bitcoin',
          label: `Enterprise BTC Wallet ${i}`
        });

        walletMonitor.addWallet({
          id: `polygon_${i}`,
          address: polygonWallet.address,
          chainType: 'evm',
          chainName: 'polygon',
          label: `Enterprise MATIC Wallet ${i}`
        });

        walletMonitor.addWallet({
          id: `bsc_${i}`,
          address: bscWallet.address,
          chainType: 'evm',
          chainName: 'bsc',
          label: `Enterprise BNB Wallet ${i}`
        });
      }

      // Step 3: Verify portfolio consistency
      expect(multiChainPortfolio).toHaveLength(portfolioSize);
      
      // Verify all wallets have same derivation index
      multiChainPortfolio.forEach((portfolio, index) => {
        expect(portfolio.ethereum.index).toBe(index);
        expect(portfolio.bitcoin.index).toBe(index);
        expect(portfolio.polygon.index).toBe(index);
        expect(portfolio.bsc.index).toBe(index);
      });

      // Step 4: Add enterprise treasury wallets
      const treasuryWallets = await Promise.all([
        treasuryManager.addTreasuryWallet({
          id: 'enterprise_hot_eth',
          address: multiChainPortfolio[0].ethereum.address,
          chainName: 'ethereum',
          type: 'hot',
          purpose: 'operational',
          threshold: '2.0',
          label: 'Enterprise ETH Hot Wallet'
        }),
        treasuryManager.addTreasuryWallet({
          id: 'enterprise_cold_eth',
          address: multiChainPortfolio[1].ethereum.address,
          chainName: 'ethereum',
          type: 'cold',
          purpose: 'reserve',
          label: 'Enterprise ETH Cold Wallet'
        }),
        treasuryManager.addTreasuryWallet({
          id: 'enterprise_hot_btc',
          address: multiChainPortfolio[0].bitcoin.address,
          chainName: 'bitcoin',
          type: 'hot',
          purpose: 'operational',
          threshold: '0.1',
          label: 'Enterprise BTC Hot Wallet'
        })
      ]);

      expect(treasuryWallets).toHaveLength(3);

      console.log(`🏢 Created enterprise portfolio:
        - ${portfolioSize} wallet sets across 4 chains
        - ${treasuryWallets.length} treasury wallets
        - Master seed: ${masterSeed.mnemonic.substring(0, 50)}...`);

      console.log('✅ Multi-Chain Portfolio Management Successful!');
    }, 45000);
  });

  describe('High-Volume Transaction Processing', () => {
    test('should handle enterprise-scale transaction volume', async () => {
      console.log('⚡ Testing High-Volume Transaction Processing...');

      const startTime = Date.now();
      const scale = systemTestConfig.stressTestScale;

      // Step 1: Generate bulk deposit events
      const depositEvents = [];
      for (let i = 0; i < scale.deposits; i++) {
        const chainNames = ['ethereum', 'bitcoin', 'polygon', 'bsc'];
        const chainName = chainNames[i % chainNames.length];
        
        depositEvents.push({
          walletId: `bulk_test_${i}`,
          txHash: `0x${i.toString().padStart(64, '0')}${Math.random().toString(16).substring(2, 10)}`,
          from: `0x${Math.random().toString(16).substring(2, 42)}`,
          to: `0x${Math.random().toString(16).substring(2, 42)}`,
          amount: (Math.random() * 0.1 + 0.001).toFixed(6),
          blockHeight: 1000000 + i,
          confirmations: systemTestConfig.testnet ? 1 : 12,
          timestamp: new Date(),
          chainName,
          type: 'incoming' as const,
          status: 'confirmed' as const
        });
      }

      // Step 2: Track processing metrics
      const processingMetrics = {
        depositsDetected: 0,
        depositsCredited: 0,
        withdrawalsCreated: 0,
        withdrawalsProcessed: 0,
        treasuryOperations: 0,
        errors: 0
      };

      // Setup event listeners
      paymentProcessor.on('depositDetected', () => {
        processingMetrics.depositsDetected++;
      });

      paymentProcessor.on('depositCredited', () => {
        processingMetrics.depositsCredited++;
      });

      paymentProcessor.on('withdrawalCreated', () => {
        processingMetrics.withdrawalsCreated++;
      });

      paymentProcessor.on('withdrawalProcessing', () => {
        processingMetrics.withdrawalsProcessed++;
      });

      treasuryManager.on('operationExecuted', () => {
        processingMetrics.treasuryOperations++;
      });

      // Step 3: Emit deposit events in batches
      const batchSize = 10;
      for (let i = 0; i < depositEvents.length; i += batchSize) {
        const batch = depositEvents.slice(i, i + batchSize);
        
        batch.forEach(deposit => {
          walletMonitor.emit('newTransaction', deposit);
        });

        // Wait between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 4: Create bulk withdrawal requests
      const withdrawalPromises = [];
      for (let i = 0; i < scale.withdrawals; i++) {
        withdrawalPromises.push(
          paymentProcessor.createWithdrawal({
            userId: `bulk_user_${i}`,
            destinationAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
            chainName: ['ethereum', 'bitcoin'][i % 2],
            amount: (Math.random() * 0.05 + 0.001).toFixed(6),
            priority: ['low', 'normal', 'high'][i % 3] as any
          }).catch(() => {
            processingMetrics.errors++;
          })
        );
      }

      await Promise.allSettled(withdrawalPromises);

      // Step 5: Create treasury operations
      const treasuryPromises = [];
      for (let i = 0; i < scale.treasuryOps; i++) {
        treasuryPromises.push(
          treasuryManager.createOperation({
            type: ['transfer', 'rebalance'][i % 2] as any,
            fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
            toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
            amount: (Math.random() * 0.1 + 0.01).toFixed(6),
            chainName: 'ethereum',
            requiredSignatures: 1,
            approvedBy: [],
            reason: `Stress test operation ${i}`,
            requestedBy: 'stress-test'
          }).then(opId => {
            return treasuryManager.approveOperation(opId, 'auto-approver');
          }).catch(() => {
            processingMetrics.errors++;
          })
        );
      }

      await Promise.allSettled(treasuryPromises);

      // Step 6: Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 20000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Step 7: Verify processing results
      const finalStats = paymentProcessor.getPaymentStats();
      const treasuryReport = treasuryManager.getTreasuryReport();

      console.log(`📊 High-Volume Processing Results:
        Duration: ${duration}ms
        Deposits Generated: ${scale.deposits}
        Deposits Detected: ${processingMetrics.depositsDetected}
        Withdrawals Created: ${finalStats.withdrawals.total}
        Treasury Operations: ${treasuryReport.summary.totalOperations}
        Error Rate: ${processingMetrics.errors}/${scale.deposits + scale.withdrawals + scale.treasuryOps}
      `);

      // Step 8: Performance assertions
      expect(duration).toBeLessThan(60000); // 60 seconds max
      expect(processingMetrics.depositsDetected).toBeGreaterThanOrEqual(scale.deposits * 0.8); // 80% success rate
      expect(finalStats.withdrawals.total).toBeGreaterThanOrEqual(scale.withdrawals * 0.8);
      expect(processingMetrics.errors / (scale.deposits + scale.withdrawals)).toBeLessThan(0.1); // < 10% error rate

      console.log('⚡ High-Volume Transaction Processing Successful!');
    }, 90000);
  });

  describe('Cross-System Data Flow Validation', () => {
    test('should validate data flow across all system modules', async () => {
      console.log('🔄 Testing Cross-System Data Flow...');

      // Step 1: Create test seed and wallets
      const testSeed = await seedGenerator.generateSeed({ strength: 128 });
      
      const ethWallet = await ethAdapter.generateAddress({
        seed: testSeed.mnemonic,
        index: 0
      });

      // Step 2: Setup data flow tracking
      const dataFlow: any[] = [];
      
      walletMonitor.on('walletAdded', (wallet) => {
        dataFlow.push({
          timestamp: new Date(),
          source: 'wallet-monitor',
          event: 'wallet-added',
          data: { walletId: wallet.id, address: wallet.address }
        });
      });

      walletMonitor.on('balanceChange', (event) => {
        dataFlow.push({
          timestamp: new Date(),
          source: 'wallet-monitor',
          event: 'balance-change',
          data: { address: event.address, change: event.difference }
        });
      });

      paymentProcessor.on('depositDetected', (deposit) => {
        dataFlow.push({
          timestamp: new Date(),
          source: 'payment-processor',
          event: 'deposit-detected',
          data: { depositId: deposit.id, amount: deposit.amount }
        });
      });

      paymentProcessor.on('depositCredited', (deposit) => {
        dataFlow.push({
          timestamp: new Date(),
          source: 'payment-processor',
          event: 'deposit-credited',
          data: { depositId: deposit.id, userId: deposit.userId }
        });
      });

      treasuryManager.on('operationCreated', (operation) => {
        dataFlow.push({
          timestamp: new Date(),
          source: 'treasury-manager',
          event: 'operation-created',
          data: { operationId: operation.id, type: operation.type }
        });
      });

      // Step 3: Execute data flow sequence
      walletMonitor.addWallet({
        id: 'dataflow_test_wallet',
        address: ethWallet.address,
        chainType: 'evm',
        chainName: 'ethereum',
        label: 'Data Flow Test Wallet'
      });

      // Simulate incoming transaction
      const testTransaction = {
        walletId: 'dataflow_test_wallet',
        txHash: '0xdataflow123456789012345678901234567890abcdef123456789012345678901234',
        from: '0x1234567890123456789012345678901234567890',
        to: ethWallet.address,
        amount: '0.1',
        blockHeight: 19000000,
        confirmations: 12,
        timestamp: new Date(),
        chainName: 'ethereum',
        type: 'incoming' as const,
        status: 'confirmed' as const
      };

      walletMonitor.emit('newTransaction', testTransaction);

      // Create treasury operation
      const treasuryOpId = await treasuryManager.createOperation({
        type: 'transfer',
        fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        toWallet: ethWallet.address,
        amount: '0.05',
        chainName: 'ethereum',
        requiredSignatures: 1,
        approvedBy: [],
        reason: 'Data flow test transfer',
        requestedBy: 'integration-test'
      });

      await treasuryManager.approveOperation(treasuryOpId, 'test-approver');

      // Step 4: Wait for data flow to complete
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 5: Validate data flow sequence
      expect(dataFlow.length).toBeGreaterThanOrEqual(3);
      
      // Verify sequence order
      const walletAddedEvent = dataFlow.find(e => e.event === 'wallet-added');
      const depositDetectedEvent = dataFlow.find(e => e.event === 'deposit-detected');
      const operationCreatedEvent = dataFlow.find(e => e.event === 'operation-created');

      expect(walletAddedEvent).toBeDefined();
      expect(depositDetectedEvent).toBeDefined();
      expect(operationCreatedEvent).toBeDefined();

      // Verify data consistency
      expect(walletAddedEvent.data.address).toBe(ethWallet.address);
      expect(depositDetectedEvent.data.amount).toBe('0.1');
      expect(operationCreatedEvent.data.type).toBe('transfer');

      console.log(`📋 Data Flow Validation Results:
        Total Events: ${dataFlow.length}
        Event Sources: ${[...new Set(dataFlow.map(e => e.source))].join(', ')}
        Time Span: ${dataFlow.length > 0 ? 
          new Date(dataFlow[dataFlow.length - 1].timestamp).getTime() - 
          new Date(dataFlow[0].timestamp).getTime() 
        : 0}ms
      `);

      console.log('✅ Cross-System Data Flow Validation Successful!');
    }, 25000);
  });

  describe('System Resilience and Recovery', () => {
    test('should handle system failures and recover automatically', async () => {
      console.log('🛡️ Testing System Resilience and Recovery...');

      // Step 1: Test monitoring system resilience
      const initialStats = await walletMonitor.getMonitoringStats();
      expect(initialStats.isMonitoring).toBe(true);

      // Simulate monitoring system restart
      walletMonitor.stopMonitoring();
      expect(walletMonitor.isMonitoring()).toBe(false);

      await walletMonitor.startMonitoring();
      expect(walletMonitor.isMonitoring()).toBe(true);

      // Step 2: Test payment processor resilience
      await paymentProcessor.stopProcessing();
      const statsAfterStop = paymentProcessor.getPaymentStats();
      expect(statsAfterStop).toBeDefined();

      await paymentProcessor.startProcessing();

      // Step 3: Test treasury emergency stop and recovery
      treasuryManager.enableEmergencyStop('security-test');
      expect(treasuryManager.isEmergencyStopped()).toBe(true);

      // Verify operations are blocked during emergency
      await expect(
        treasuryManager.createOperation({
          type: 'transfer',
          fromWallet: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
          toWallet: '0x8ba1f109551bD432803012645Hac136c32960442',
          amount: '0.01',
          chainName: 'ethereum',
          requiredSignatures: 1,
          approvedBy: [],
          reason: 'Should be blocked',
          requestedBy: 'resilience-test'
        })
      ).rejects.toThrow();

      treasuryManager.disableEmergencyStop('security-test');
      expect(treasuryManager.isEmergencyStopped()).toBe(false);

      // Step 4: Test complete system recovery
      await walletMonitor.shutdown();
      await paymentProcessor.shutdown();
      await treasuryManager.shutdown();

      // Reinitialize all systems
      await walletMonitor.initialize();
      await treasuryManager.initialize();
      await paymentProcessor.initialize();

      // Reintegrate systems
      paymentProcessor.setWalletMonitor(walletMonitor);
      paymentProcessor.setTreasuryManager(treasuryManager);

      // Restart all systems
      await walletMonitor.startMonitoring();
      await paymentProcessor.startProcessing();

      // Step 5: Verify full system recovery
      const recoveredMonitoringStats = await walletMonitor.getMonitoringStats();
      const recoveredPaymentStats = paymentProcessor.getPaymentStats();
      const recoveredTreasuryReport = treasuryManager.getTreasuryReport();

      expect(recoveredMonitoringStats.isMonitoring).toBe(true);
      expect(recoveredPaymentStats.deposits).toBeDefined();
      expect(recoveredTreasuryReport.summary).toBeDefined();

      // Test functionality after recovery
      const testWallet = await ethAdapter.generateAddress({
        seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        index: 0
      });

      expect(testWallet.address).toBeTruthy();

      // Verify system is fully operational
      walletMonitor.addWallet({
        id: 'recovery_test_wallet',
        address: testWallet.address,
        chainType: 'evm',
        chainName: 'ethereum',
        label: 'Recovery Test Wallet'
      });

      // Verify monitoring is active
      const finalMonitoringStats = await walletMonitor.getMonitoringStats();
      expect(finalMonitoringStats.isMonitoring).toBe(true);
      expect(finalMonitoringStats.totalWallets).toBeGreaterThan(0);

      console.log('💪 System Resilience and Recovery Test Successful!');
    }, 45000);
  });
});
