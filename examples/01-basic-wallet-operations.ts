/**
 * Example 1: Basic Wallet Operations
 * 
 * This example demonstrates the fundamental wallet operations:
 * - Secure seed generation
 * - HD wallet creation across multiple chains
 * - Address validation and management
 * - Basic blockchain interactions
 * 
 * Use Case: Simple cryptocurrency wallet application
 */

import { SeedGenerator } from '../packages/core/crypto/implementations/seed-generator';
import { EVMAdapterFactory } from '../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../packages/utxo-adapter/src/utxo-chain-adapter';

async function basicWalletOperations() {
  console.log('🚀 Basic Wallet Operations Example');
  console.log('=====================================');

  // Step 1: Generate a secure seed
  console.log('\n📝 Step 1: Generate Secure Seed');
  const seedGenerator = new SeedGenerator('my-encryption-key-256bit');
  
  const seed = await seedGenerator.generateSeed({
    strength: 256, // 24-word mnemonic
    language: 'english',
    encrypted: true // Encrypt the seed for storage
  });

  console.log(`✅ Generated seed: ${seed.mnemonic.substring(0, 50)}...`);
  console.log(`🔒 Encrypted seed available: ${!!seed.encryptedMnemonic}`);
  console.log(`💪 Seed strength: ${seed.strength} bits (${seed.mnemonic.split(' ').length} words)`);

  // Step 2: Initialize blockchain adapters
  console.log('\n🔗 Step 2: Initialize Blockchain Adapters');
  const ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/demo');
  const btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');

  await ethAdapter.connect();
  await btcAdapter.connect();
  
  console.log('✅ Connected to Ethereum mainnet');
  console.log('✅ Connected to Bitcoin mainnet');

  // Step 3: Generate wallet addresses
  console.log('\n💼 Step 3: Generate Wallet Addresses');
  
  // Generate Ethereum addresses
  const ethAddresses = await ethAdapter.deriveAddresses({
    seed: seed.mnemonic,
    count: 5,
    startIndex: 0
  });

  // Generate Bitcoin addresses
  const btcAddresses = await btcAdapter.deriveAddresses({
    seed: seed.mnemonic,
    count: 5,
    startIndex: 0
  });

  console.log('\n🔷 Ethereum Addresses:');
  ethAddresses.forEach((addr, index) => {
    console.log(`  ${index}: ${addr.address} (${addr.derivationPath})`);
  });

  console.log('\n🟡 Bitcoin Addresses:');
  btcAddresses.forEach((addr, index) => {
    console.log(`  ${index}: ${addr.address} (${addr.derivationPath})`);
  });

  // Step 4: Validate addresses
  console.log('\n✅ Step 4: Address Validation');
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    'invalid-address'
  ];

  for (const address of testAddresses) {
    const ethValid = await ethAdapter.validateAddress(address);
    const btcValid = await btcAdapter.validateAddress(address);
    
    console.log(`📍 ${address}:`);
    console.log(`   ETH: ${ethValid ? '✅' : '❌'} | BTC: ${btcValid ? '✅' : '❌'}`);
  }

  // Step 5: Check balances
  console.log('\n💰 Step 5: Check Balances');
  try {
    const ethBalance = await ethAdapter.getBalance(ethAddresses[0].address);
    console.log(`💎 ETH Balance: ${ethBalance.balance} ETH`);
  } catch (error) {
    console.log(`⚠️ Could not fetch ETH balance: ${error.message}`);
  }

  try {
    const btcBalance = await btcAdapter.getBalance(btcAddresses[0].address);
    console.log(`🟡 BTC Balance: ${btcBalance.balance} BTC`);
  } catch (error) {
    console.log(`⚠️ Could not fetch BTC balance: ${error.message}`);
  }

  // Step 6: Demonstrate seed encryption/decryption
  console.log('\n🔐 Step 6: Seed Encryption Demo');
  if (seed.encryptedMnemonic) {
    const decrypted = await seedGenerator.decryptSeed(seed.encryptedMnemonic);
    console.log(`🔓 Successfully decrypted seed: ${decrypted === seed.mnemonic ? '✅' : '❌'}`);
  }

  // Cleanup
  await ethAdapter.disconnect();
  await btcAdapter.disconnect();
  
  console.log('\n🎉 Basic Wallet Operations Complete!');
  console.log('=====================================');
}

// Export for use in other examples
export { basicWalletOperations };

// Run if called directly
if (require.main === module) {
  basicWalletOperations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
