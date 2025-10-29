/**
 * Example 3: Enterprise Treasury Management
 * 
 * This example demonstrates enterprise-grade treasury management:
 * - Multi-signature wallet operations
 * - Hot/cold wallet rebalancing
 * - Risk assessment and compliance
 * - Emergency stop mechanisms
 * - Audit trail and reporting
 * 
 * Use Case: Large-scale crypto exchange or institutional treasury
 */

import { TreasuryManager, createTreasuryManager } from '../src/treasury/treasury-manager';
import { EVMAdapterFactory } from '../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../packages/utxo-adapter/src/utxo-chain-adapter';
import { SeedGenerator } from '../packages/core/crypto/implementations/seed-generator';

async function enterpriseTreasuryManagement() {
  console.log('🏛️ Enterprise Treasury Management Example');
  console.log('==========================================');

  // Step 1: Initialize treasury management system
  console.log('\n⚙️ Step 1: Initialize Treasury Management System');
  
  const treasuryManager = createTreasuryManager({
    multiSigRequired: true,
    requiredSignatures: 3,  // Require 3 out of 5 signatures
    maxDailyWithdrawal: '100.0', // 100 ETH daily limit
    emergencyStopEnabled: true,
    hotWalletThreshold: '10.0', // 10 ETH hot wallet max
    coldWalletRatio: 0.9, // Keep 90% in cold storage
    autoPooling: true,
    autoDistribution: false,
    rebalanceThreshold: '5.0', // Rebalance when hot wallet > 5 ETH
    maxSingleTransaction: '50.0', // 50 ETH max single tx
    dailyTransactionLimit: 20,
    whitelistedAddresses: [
      '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
      '0x8ba1f109551bD432803012645Hac136c32960442',
      '0x28C6c06298d514Db089934071355E5743bf21d60'
    ],
    blacklistedAddresses: [
      '0x0000000000000000000000000000000000000000',
      '0x1234567890123456789012345678901234567890'
    ],
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

  await treasuryManager.initialize();
  console.log('✅ Treasury management system initialized');

  // Step 2: Setup treasury wallets
  console.log('\n💼 Step 2: Setup Enterprise Treasury Wallets');
  
  const seedGenerator = new SeedGenerator();
  const treasurySeed = await seedGenerator.generateSeed({ 
    strength: 256,
    encrypted: true 
  });

  const ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/demo');
  const btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
  
  await ethAdapter.connect();
  await btcAdapter.connect();

  // Generate treasury wallet addresses
  const treasuryWallets = {
    ethereum: {
      hot: await ethAdapter.generateAddress({ seed: treasurySeed.mnemonic, index: 0 }),
      warm: await ethAdapter.generateAddress({ seed: treasurySeed.mnemonic, index: 1 }),
      cold: await ethAdapter.generateAddress({ seed: treasurySeed.mnemonic, index: 2 })
    },
    bitcoin: {
      hot: await btcAdapter.generateAddress({ seed: treasurySeed.mnemonic, index: 10 }),
      cold: await btcAdapter.generateAddress({ seed: treasurySeed.mnemonic, index: 11 })
    }
  };

  console.log('🔑 Generated Treasury Wallet Addresses:');
  console.log(`   ETH Hot:  ${treasuryWallets.ethereum.hot.address}`);
  console.log(`   ETH Warm: ${treasuryWallets.ethereum.warm.address}`);
  console.log(`   ETH Cold: ${treasuryWallets.ethereum.cold.address}`);
  console.log(`   BTC Hot:  ${treasuryWallets.bitcoin.hot.address}`);
  console.log(`   BTC Cold: ${treasuryWallets.bitcoin.cold.address}`);

  // Add wallets to treasury management
  const walletIds = await Promise.all([
    treasuryManager.addTreasuryWallet({
      id: 'eth_hot_001',
      address: treasuryWallets.ethereum.hot.address,
      chainName: 'ethereum',
      type: 'hot',
      purpose: 'operational',
      threshold: '10.0',
      label: 'Ethereum Hot Wallet #1'
    }),
    treasuryManager.addTreasuryWallet({
      id: 'eth_warm_001',
      address: treasuryWallets.ethereum.warm.address,
      chainName: 'ethereum',
      type: 'hot',
      purpose: 'distribution',
      threshold: '50.0',
      label: 'Ethereum Warm Wallet #1'
    }),
    treasuryManager.addTreasuryWallet({
      id: 'eth_cold_001',
      address: treasuryWallets.ethereum.cold.address,
      chainName: 'ethereum',
      type: 'cold',
      purpose: 'reserve',
      label: 'Ethereum Cold Storage #1'
    }),
    treasuryManager.addTreasuryWallet({
      id: 'btc_hot_001',
      address: treasuryWallets.bitcoin.hot.address,
      chainName: 'bitcoin',
      type: 'hot',
      purpose: 'operational',
      threshold: '1.0',
      label: 'Bitcoin Hot Wallet #1'
    }),
    treasuryManager.addTreasuryWallet({
      id: 'btc_cold_001',
      address: treasuryWallets.bitcoin.cold.address,
      chainName: 'bitcoin',
      type: 'cold',
      purpose: 'reserve',
      label: 'Bitcoin Cold Storage #1'
    })
  ]);

  console.log(`✅ Added ${walletIds.length} treasury wallets to management`);

  // Step 3: Setup event listeners for treasury operations
  console.log('\n📡 Step 3: Setup Treasury Event Monitoring');
  
  let operationCount = 0;
  let approvalCount = 0;

  treasuryManager.on('operationCreated', (operation) => {
    operationCount++;
    console.log(`\n📝 TREASURY OPERATION CREATED #${operationCount}:`);
    console.log(`   Operation ID: ${operation.id}`);
    console.log(`   Type: ${operation.type}`);
    console.log(`   Amount: ${operation.amount} ${operation.chainName.toUpperCase()}`);
    console.log(`   From: ${operation.fromWallet}`);
    console.log(`   To: ${operation.toWallet || 'N/A'}`);
    console.log(`   Required Signatures: ${operation.requiredSignatures}`);
    console.log(`   Current Signatures: ${operation.approvedBy.length}`);
    console.log(`   Reason: ${operation.reason}`);
  });

  treasuryManager.on('operationApproved', (data) => {
    approvalCount++;
    console.log(`\n✅ OPERATION APPROVED #${approvalCount}:`);
    console.log(`   Operation ID: ${data.operation.id}`);
    console.log(`   Approved by: ${data.approver}`);
    console.log(`   Total Approvals: ${data.operation.approvedBy.length}/${data.operation.requiredSignatures}`);
  });

  treasuryManager.on('operationExecuted', (operation) => {
    console.log(`\n⚡ OPERATION EXECUTED:`);
    console.log(`   Operation ID: ${operation.id}`);
    console.log(`   Type: ${operation.type}`);
    console.log(`   Amount: ${operation.amount}`);
    console.log(`   Status: ${operation.status}`);
  });

  treasuryManager.on('balanceChanged', (change) => {
    console.log(`\n💰 TREASURY BALANCE CHANGED:`);
    console.log(`   Wallet: ${change.walletId}`);
    console.log(`   Previous: ${change.previousBalance}`);
    console.log(`   Current: ${change.currentBalance}`);
    console.log(`   Difference: ${change.difference}`);
  });

  treasuryManager.on('riskAssessment', (assessment) => {
    console.log(`\n⚠️ RISK ASSESSMENT:`);
    console.log(`   Level: ${assessment.riskLevel}`);
    console.log(`   Score: ${assessment.riskScore}`);
    console.log(`   Factors: ${assessment.factors.join(', ')}`);
  });

  // Step 4: Create and approve treasury operations
  console.log('\n💸 Step 4: Treasury Operations Demo');

  // Create a transfer operation
  const transferOpId = await treasuryManager.createOperation({
    type: 'transfer',
    fromWallet: treasuryWallets.ethereum.cold.address,
    toWallet: treasuryWallets.ethereum.hot.address,
    amount: '5.0',
    chainName: 'ethereum',
    requiredSignatures: 3,
    approvedBy: [],
    reason: 'Hot wallet rebalancing - low balance alert',
    requestedBy: 'treasury-admin'
  });

  console.log(`📋 Created transfer operation: ${transferOpId}`);

  // Approve the operation with multiple signers
  const signers = ['alice@company.com', 'bob@company.com', 'charlie@company.com'];
  
  for (const signer of signers) {
    await treasuryManager.approveOperation(transferOpId, signer);
    console.log(`✍️ Operation approved by ${signer}`);
    
    // Small delay between approvals
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Step 5: Risk assessment demo
  console.log('\n🛡️ Step 5: Risk Assessment Demo');

  // Create a high-risk operation
  try {
    const highRiskOpId = await treasuryManager.createOperation({
      type: 'transfer',
      fromWallet: treasuryWallets.ethereum.cold.address,
      toWallet: '0x1234567890123456789012345678901234567890', // Not whitelisted
      amount: '75.0', // Large amount
      chainName: 'ethereum',
      requiredSignatures: 3,
      approvedBy: [],
      reason: 'Emergency payout to external address',
      requestedBy: 'emergency-response'
    });

    console.log(`⚠️ High-risk operation created: ${highRiskOpId}`);
  } catch (error) {
    console.log(`❌ High-risk operation blocked: ${error.message}`);
  }

  // Step 6: Emergency stop demonstration
  console.log('\n🚨 Step 6: Emergency Stop Demo');

  console.log('Activating emergency stop...');
  treasuryManager.enableEmergencyStop('security-officer');
  console.log(`🛑 Emergency stop active: ${treasuryManager.isEmergencyStopped()}`);

  // Try to create operation during emergency stop
  try {
    await treasuryManager.createOperation({
      type: 'transfer',
      fromWallet: treasuryWallets.ethereum.hot.address,
      toWallet: treasuryWallets.ethereum.warm.address,
      amount: '1.0',
      chainName: 'ethereum',
      requiredSignatures: 3,
      approvedBy: [],
      reason: 'Should be blocked by emergency stop',
      requestedBy: 'test'
    });
  } catch (error) {
    console.log(`✅ Operation correctly blocked: ${error.message}`);
  }

  // Disable emergency stop
  treasuryManager.disableEmergencyStop('security-officer');
  console.log(`🟢 Emergency stop disabled: ${!treasuryManager.isEmergencyStopped()}`);

  // Step 7: Rebalancing demo
  console.log('\n⚖️ Step 7: Automated Rebalancing Demo');

  const rebalanceOpId = await treasuryManager.createOperation({
    type: 'rebalance',
    fromWallet: treasuryWallets.ethereum.warm.address,
    toWallet: treasuryWallets.ethereum.hot.address,
    amount: '8.0',
    chainName: 'ethereum',
    requiredSignatures: 2, // Lower signature requirement for rebalancing
    approvedBy: [],
    reason: 'Automated hot wallet rebalancing - threshold exceeded',
    requestedBy: 'auto-rebalancer'
  });

  // Auto-approve rebalancing operations
  await treasuryManager.approveOperation(rebalanceOpId, 'auto-system');
  await treasuryManager.approveOperation(rebalanceOpId, 'treasury-manager');

  console.log(`⚖️ Rebalancing operation completed: ${rebalanceOpId}`);

  // Step 8: Treasury reporting
  setTimeout(async () => {
    console.log('\n📊 Step 8: Treasury Reporting');
    
    const report = treasuryManager.getTreasuryReport();
    console.log('\n📈 TREASURY REPORT:');
    console.log('================');
    console.log(`📊 Summary:`);
    console.log(`   Total Wallets: ${report.summary.totalWallets}`);
    console.log(`   Active Operations: ${report.summary.activeOperations}`);
    console.log(`   Total Operations: ${report.summary.totalOperations}`);
    console.log(`   Pending Approvals: ${report.summary.pendingApprovals}`);
    console.log(`   Daily Limit Usage: ${report.summary.dailyLimitUsage}%`);

    console.log(`\n🏦 Wallet Distribution:`);
    report.walletDistribution.forEach(wallet => {
      console.log(`   ${wallet.type.toUpperCase()} (${wallet.chainName}): ${wallet.count} wallets, ${wallet.totalBalance} balance`);
    });

    console.log(`\n⚠️ Risk Metrics:`);
    console.log(`   Current Risk Level: ${report.riskMetrics.currentRiskLevel}`);
    console.log(`   Risk Score: ${report.riskMetrics.riskScore}`);
    console.log(`   High Risk Operations: ${report.riskMetrics.highRiskOperations}`);

    console.log(`\n✅ Compliance Status:`);
    console.log(`   KYC Required: ${report.compliance.kycRequired}`);
    console.log(`   Audit Trail: ${report.compliance.auditTrailEnabled}`);
    console.log(`   Compliance Score: ${report.compliance.complianceScore}%`);

    // Audit trail
    console.log('\n📋 Audit Trail (Last 10 Operations):');
    const auditTrail = treasuryManager.getAuditTrail(10);
    auditTrail.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.timestamp.toISOString()}: ${entry.action} by ${entry.user}`);
      console.log(`      Details: ${entry.details}`);
    });

    // Performance metrics would be available in production implementation
    console.log('\n⚡ Performance Metrics: (Demo values)');
    console.log(`   Average Operation Time: 150ms`);
    console.log(`   Operations per Hour: ${operationCount * 4}`);
    console.log(`   Success Rate: 99.8%`);
    console.log(`   System Uptime: 99.9%`);

  }, 5000);

  // Step 9: Cleanup
  setTimeout(async () => {
    console.log('\n🧹 Step 9: Treasury System Cleanup');
    
    // Final report
    const finalReport = treasuryManager.getTreasuryReport();
    console.log(`\n📋 FINAL TREASURY STATUS:`);
    console.log(`   Total Operations Processed: ${finalReport.summary.totalOperations}`);
    console.log(`   Emergency Stops: ${finalReport.summary.emergencyStops || 0}`);
    console.log(`   Compliance Violations: ${finalReport.summary.complianceViolations || 0}`);
    console.log(`   System Status: ${treasuryManager.isEmergencyStopped() ? '🛑 Emergency Stop' : '🟢 Operational'}`);

    // Disconnect adapters
    await ethAdapter.disconnect();
    await btcAdapter.disconnect();
    await treasuryManager.shutdown();

    console.log('\n🎉 Enterprise Treasury Management Example Complete!');
    console.log('===================================================');

    // Exit
    setTimeout(() => process.exit(0), 2000);
  }, 15000);
}

// Export for use in other examples
export { enterpriseTreasuryManagement };

// Run if called directly
if (require.main === module) {
  enterpriseTreasuryManagement()
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
