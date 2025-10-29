/**
 * Example 2: Real-time Wallet Monitoring
 * 
 * This example demonstrates advanced wallet monitoring capabilities:
 * - Real-time transaction detection across multiple chains
 * - Balance change notifications
 * - Webhook integration for external systems
 * - Portfolio tracking and analytics
 * 
 * Use Case: Exchange hot wallet monitoring, user deposit detection
 */

import { WalletMonitor, createWalletMonitor } from '../src/monitoring/wallet-monitor';
import { EVMAdapterFactory } from '../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../packages/utxo-adapter/src/utxo-chain-adapter';
import { SeedGenerator } from '../packages/core/crypto/implementations/seed-generator';

async function realTimeWalletMonitoring() {
  console.log('🔍 Real-time Wallet Monitoring Example');
  console.log('======================================');

  // Step 1: Initialize monitoring system
  console.log('\n⚙️ Step 1: Initialize Monitoring System');
  
  const walletMonitor = createWalletMonitor({
    balanceCheckInterval: 10000,    // Check balances every 10 seconds
    transactionCheckInterval: 5000, // Check transactions every 5 seconds
    confirmationThreshold: 12,      // Wait for 12 confirmations
    maxConcurrentChecks: 10,
    retryAttempts: 3,
    retryDelay: 2000,
    
    // Configure multiple chains
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

  await walletMonitor.initialize();
  console.log('✅ Wallet monitoring system initialized');

  // Step 2: Create sample wallets to monitor
  console.log('\n💼 Step 2: Create Sample Wallets');
  
  const seedGenerator = new SeedGenerator();
  const masterSeed = await seedGenerator.generateSeed({ strength: 256 });
  
  const ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/demo');
  const btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
  
  await ethAdapter.connect();
  await btcAdapter.connect();

  // Generate user wallets
  const users: any[] = [];
  for (let i = 0; i < 3; i++) {
    const ethWallet = await ethAdapter.generateAddress({
      seed: masterSeed.mnemonic,
      index: i
    });
    
    const btcWallet = await btcAdapter.generateAddress({
      seed: masterSeed.mnemonic,
      index: i
    });

    const user = {
      id: `user_${i + 1}`,
      name: `Demo User ${i + 1}`,
      wallets: {
        ethereum: ethWallet,
        bitcoin: btcWallet
      }
    };
    
    users.push(user);
    console.log(`👤 Created user ${user.name}:`);
    console.log(`   ETH: ${ethWallet.address}`);
    console.log(`   BTC: ${btcWallet.address}`);
  }

  // Step 3: Add wallets to monitoring
  console.log('\n🎯 Step 3: Add Wallets to Monitoring');
  
  for (const user of users) {
    // Add Ethereum wallet
    walletMonitor.addWallet({
      id: `${user.id}_eth`,
      address: user.wallets.ethereum.address,
      chainType: 'evm',
      chainName: 'ethereum',
      label: `${user.name} - Ethereum Wallet`,
      // Note: metadata field would be available in production implementation
      // metadata: { userId: user.id, userName: user.name, walletType: 'deposit' }
    });

    // Add Bitcoin wallet
    walletMonitor.addWallet({
      id: `${user.id}_btc`,
      address: user.wallets.bitcoin.address,
      chainType: 'utxo',
      chainName: 'bitcoin',
      label: `${user.name} - Bitcoin Wallet`,
      // Note: metadata field would be available in production implementation
      // metadata: { userId: user.id, userName: user.name, walletType: 'deposit' }
    });

    console.log(`✅ Added monitoring for ${user.name} (ETH + BTC)`);
  }

  // Add some well-known addresses for demonstration
  const knownAddresses = [
    {
      id: 'binance_hot_wallet',
      address: '0x28C6c06298d514Db089934071355E5743bf21d60',
      chainType: 'evm' as const,
      chainName: 'ethereum',
      label: 'Binance Hot Wallet',
      metadata: { type: 'exchange', exchange: 'binance' }
    },
    {
      id: 'btc_whale_wallet',
      address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF',
      chainType: 'utxo' as const,
      chainName: 'bitcoin',
      label: 'Bitcoin Whale Wallet',
      metadata: { type: 'whale', estimated_btc: '50000+' }
    }
  ];

  for (const wallet of knownAddresses) {
    walletMonitor.addWallet(wallet);
    console.log(`🐋 Added monitoring for ${wallet.label}`);
  }

  // Step 4: Set up event listeners
  console.log('\n📡 Step 4: Setup Event Listeners');
  
  let transactionCount = 0;
  let balanceChangeCount = 0;

  // Listen for new transactions
  walletMonitor.on('newTransaction', (transaction) => {
    transactionCount++;
    console.log(`\n🔔 NEW TRANSACTION #${transactionCount}:`);
    console.log(`   Wallet: ${transaction.walletId}`);
    console.log(`   Chain: ${transaction.chainName}`);
    console.log(`   Type: ${transaction.type}`);
    console.log(`   Amount: ${transaction.amount} ${transaction.tokenSymbol || 'native'}`);
    console.log(`   Hash: ${transaction.txHash}`);
    console.log(`   Confirmations: ${transaction.confirmations}`);
    console.log(`   Status: ${transaction.status}`);
  });

  // Listen for balance changes
  walletMonitor.on('balanceChange', (change) => {
    balanceChangeCount++;
    console.log(`\n💰 BALANCE CHANGE #${balanceChangeCount}:`);
    console.log(`   Wallet: ${change.walletId}`);
    console.log(`   Address: ${change.address}`);
    console.log(`   Chain: ${change.chainName}`);
    console.log(`   Previous: ${change.previousBalance}`);
    console.log(`   Current: ${change.currentBalance}`);
    console.log(`   Difference: ${change.difference}`);
    console.log(`   Token: ${change.tokenSymbol || 'native'}`);
  });

  // Listen for confirmations
  walletMonitor.on('transactionConfirmed', (transaction) => {
    console.log(`\n✅ TRANSACTION CONFIRMED:`);
    console.log(`   Hash: ${transaction.txHash}`);
    console.log(`   Confirmations: ${transaction.confirmations}`);
    console.log(`   Amount: ${transaction.amount}`);
  });

  // Listen for errors
  walletMonitor.on('error', (error) => {
    console.log(`\n❌ MONITORING ERROR: ${error.message}`);
    console.log(`   Type: ${error.type}`);
    console.log(`   Wallet: ${error.walletId || 'unknown'}`);
  });

  // Listen for system events
  walletMonitor.on('monitoringStarted', () => {
    console.log(`\n🟢 Monitoring started at ${new Date().toISOString()}`);
  });

  walletMonitor.on('monitoringStopped', () => {
    console.log(`\n🔴 Monitoring stopped at ${new Date().toISOString()}`);
  });

  // Step 5: Start monitoring
  console.log('\n🚀 Step 5: Start Real-time Monitoring');
  await walletMonitor.startMonitoring();

  // Step 6: Display monitoring statistics
  console.log('\n📊 Step 6: Monitor Statistics');
  
  const displayStats = async () => {
    const stats = await walletMonitor.getMonitoringStats();
    console.log(`\n📈 MONITORING STATS (${new Date().toLocaleTimeString()}):`);
    console.log(`   🔍 Is Monitoring: ${stats.isMonitoring}`);
    console.log(`   💼 Total Wallets: ${stats.totalWallets}`);
    console.log(`   🔷 EVM Wallets: ${stats.evmWallets}`);
    console.log(`   🟡 UTXO Wallets: ${stats.utxoWallets}`);
    console.log(`   🔄 Active Checks: ${stats.activeChecks}`);
    console.log(`   ✅ Successful Checks: ${stats.successfulChecks}`);
    console.log(`   ❌ Failed Checks: ${stats.failedChecks}`);
    console.log(`   📊 Check Success Rate: ${stats.successRate}%`);
    console.log(`   🎯 Transactions Detected: ${transactionCount}`);
    console.log(`   💰 Balance Changes: ${balanceChangeCount}`);
  };

  // Show stats every 30 seconds
  const statsInterval = setInterval(displayStats, 30000);
  
  // Display initial stats
  await displayStats();

  // Step 7: Simulate some transactions for demonstration
  console.log('\n🎭 Step 7: Simulation Mode (Demo Transactions)');
  console.log('💡 In production, real blockchain transactions would trigger these events');

  // Simulate incoming deposit
  setTimeout(() => {
    console.log('\n🎬 Simulating incoming ETH deposit...');
    walletMonitor.emit('newTransaction', {
      walletId: `${users[0].id}_eth`,
      txHash: '0x' + Math.random().toString(16).substring(2, 66),
      from: '0x1234567890123456789012345678901234567890',
      to: users[0].wallets.ethereum.address,
      amount: '0.1',
      blockHeight: 18500000,
      confirmations: 1,
      timestamp: new Date(),
      chainName: 'ethereum',
      type: 'incoming',
      status: 'pending'
    });
  }, 5000);

  // Simulate Bitcoin transaction
  setTimeout(() => {
    console.log('\n🎬 Simulating Bitcoin transaction...');
    walletMonitor.emit('newTransaction', {
      walletId: `${users[1].id}_btc`,
      txHash: Math.random().toString(16).substring(2, 66),
      from: 'bc1qtest123456789',
      to: users[1].wallets.bitcoin.address,
      amount: '0.001',
      blockHeight: 810000,
      confirmations: 2,
      timestamp: new Date(),
      chainName: 'bitcoin',
      type: 'incoming',
      status: 'confirming'
    });
  }, 10000);

  // Step 8: Portfolio tracking demo
  setTimeout(async () => {
    console.log('\n💎 Step 8: Portfolio Tracking Demo');
    
    for (const user of users) {
      try {
        // Get Ethereum balance
        const ethBalance = await ethAdapter.getBalance(user.wallets.ethereum.address);
        
        // Get Bitcoin balance  
        const btcBalance = await btcAdapter.getBalance(user.wallets.bitcoin.address);
        
        console.log(`\n👤 ${user.name} Portfolio:`);
        console.log(`   💎 ETH: ${ethBalance.balance} ETH`);
        console.log(`   🟡 BTC: ${btcBalance.balance} BTC`);
        console.log(`   🏦 Total Addresses: 2`);
      } catch (error) {
        console.log(`⚠️ Could not fetch ${user.name} portfolio: ${error.message}`);
      }
    }
  }, 15000);

  // Step 9: Demonstrate stopping and cleanup
  setTimeout(async () => {
    console.log('\n🛑 Step 9: Cleanup and Shutdown');
    
    clearInterval(statsInterval);
    
    // Stop monitoring
    walletMonitor.stopMonitoring();
    
    // Final stats
    await displayStats();
    
    // Cleanup connections
    await ethAdapter.disconnect();
    await btcAdapter.disconnect();
    await walletMonitor.shutdown();
    
    console.log('\n🎉 Real-time Wallet Monitoring Example Complete!');
    console.log('================================================');
    
    // Exit after demo
    setTimeout(() => process.exit(0), 2000);
  }, 25000);
}

// Export for use in other examples
export { realTimeWalletMonitoring };

// Run if called directly
if (require.main === module) {
  realTimeWalletMonitoring()
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
