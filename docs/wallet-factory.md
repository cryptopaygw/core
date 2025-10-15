# Wallet Factory Documentation

Comprehensive guide to the Crypto Payment Gateway Wallet Factory functionality.

## Table of Contents

1. [Overview](#overview)
2. [Wallet Factory Interface](#wallet-factory-interface)
3. [Chain-Agnostic Architecture](#chain-agnostic-architecture)
4. [Wallet Creation & Management](#wallet-creation--management)
5. [BIP44 HD Wallet Support](#bip44-hd-wallet-support)
6. [Import & Export Functions](#import--export-functions)
7. [Batch Operations](#batch-operations)
8. [Validation System](#validation-system)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)
11. [Error Handling](#error-handling)
12. [Performance Considerations](#performance-considerations)

## Overview

The Wallet Factory module provides chain-agnostic wallet creation and management functionality. It handles BIP44 hierarchical deterministic (HD) wallet generation from BIP39 seeds, with each chain adapter implementing chain-specific derivation paths and address formats.

### Key Features

- **Chain-Agnostic Interface**: Unified API for all blockchain networks
- **BIP44 HD Wallets**: Hierarchical deterministic wallet support
- **Hidden Complexity**: Derivation paths managed internally by chain adapters
- **Batch Operations**: Efficient multi-wallet creation and address derivation
- **Import/Export**: Multiple wallet import formats (private key, WIF, keystore)
- **Validation System**: Comprehensive wallet and address validation
- **Memory Safe**: Secure handling of private key material
- **Gateway Integration**: Seamless integration with CryptoPaymentGW

## Wallet Factory Interface

### Primary Interface

```typescript
interface IWalletFactory {
  // Chain identification
  readonly chainName: string;
  readonly chainType: string;
  readonly networkId: string | number;

  // Single wallet operations
  createWallet(options: WalletCreationOptions): Promise<WalletInfo>;
  importWallet(options: WalletImportOptions): Promise<WalletInfo>;
  validateWallet(wallet: WalletInfo): Promise<WalletValidationResult>;

  // Batch operations
  createWallets(requests: BatchWalletCreationRequest[]): Promise<WalletCreationResult[]>;
  deriveAddresses(options: AddressDerivationOptions): Promise<WalletAddress[]>;

  // Address management
  generateAddressAtIndex(seed: string, index: number): Promise<WalletAddress>;

  // Utility operations
  getDefaultOptions(): WalletCreationOptions;
  validateSeed(seed: string): Promise<boolean>;
  getSupportedFeatures(): WalletFeature[];
}
```

### Core Types

```typescript
interface WalletCreationOptions {
  seed: string;                    // BIP39 mnemonic seed (required)
  addressIndex?: number;           // Address index (default: 0)
  passphrase?: string;            // Optional BIP39 passphrase
  compressed?: boolean;           // Compressed keys (UTXO chains)
  label?: string;                 // Custom wallet label
  metadata?: Record<string, unknown>; // Additional metadata
}

interface WalletInfo {
  address: string;                // Wallet address
  privateKey: string;            // Private key (hex format)
  publicKey: string;             // Public key (hex format)
  derivationPath: string;        // Full BIP44 derivation path
  addressIndex: number;          // Address index used
  chainName: string;             // Chain identifier
  chainType: string;             // Chain type (evm, utxo, etc.)
  networkId: string | number;    // Network ID
  label?: string;                // Wallet label
  compressed?: boolean;          // Key compression flag
  hasPassphrase: boolean;        // Passphrase usage flag
  createdAt: Date;               // Creation timestamp
  metadata?: Record<string, unknown>; // Custom metadata
}
```

## Chain-Agnostic Architecture

### Gateway Integration

The Wallet Factory operates through the main gateway, providing chain-specific factories:

```typescript
import { CryptoPaymentGW } from '@cryptopaygw/core';

const gateway = new CryptoPaymentGW(config);

// Get chain-specific wallet factories
const ethFactory = gateway.getWalletFactory('ethereum');
const btcFactory = gateway.getWalletFactory('bitcoin');
const bscFactory = gateway.getWalletFactory('bsc');

// All factories implement the same interface
const ethWallet = await ethFactory.createWallet({ seed: mnemonic, addressIndex: 0 });
const btcWallet = await btcFactory.createWallet({ seed: mnemonic, addressIndex: 0 });
```

### Chain Adapter Implementation

Each chain adapter implements `IWalletFactory` with chain-specific logic:

```typescript
// EVM chains (Ethereum, BSC, Polygon, etc.)
class EVMWalletFactory extends BaseWalletFactory {
  private readonly derivationPath = "m/44'/60'/0'/0"; // Ethereum derivation path
  
  async createWallet(options: WalletCreationOptions): Promise<WalletInfo> {
    const index = options.addressIndex || 0;
    const fullPath = `${this.derivationPath}/${index}`;
    
    // Generate wallet using EVM-specific logic
    const hdWallet = HDNode.fromSeed(seed).derivePath(fullPath);
    const address = computeAddress(hdWallet.publicKey);
    
    return this.createWalletInfo(address, hdWallet.privateKey, hdWallet.publicKey, index, options);
  }
}

// UTXO chains (Bitcoin, Litecoin, etc.)
class UTXOWalletFactory extends BaseWalletFactory {
  private readonly derivationPath = "m/44'/0'/0'/0"; // Bitcoin derivation path
  
  async createWallet(options: WalletCreationOptions): Promise<WalletInfo> {
    const index = options.addressIndex || 0;
    const fullPath = `${this.derivationPath}/${index}`;
    
    // Generate wallet using UTXO-specific logic
    const hdWallet = HDNode.fromSeed(seed).derivePath(fullPath);
    const address = generateBitcoinAddress(hdWallet.publicKey, options.compressed);
    
    return this.createWalletInfo(address, hdWallet.privateKey, hdWallet.publicKey, index, options);
  }
}
```

### Supported Chain Types

| Chain Type | Example Chains | BIP44 Coin Type | Derivation Path |
|------------|----------------|-----------------|-----------------|
| EVM        | Ethereum, BSC, Polygon | 60 (ETH) | m/44'/60'/0'/0/index |
| UTXO       | Bitcoin, Litecoin, Dogecoin | 0 (BTC), 2 (LTC) | m/44'/coin_type'/0'/0/index |
| Cosmos     | Cosmos Hub, Osmosis | 118 (ATOM) | m/44'/118'/0'/0/index |
| Substrate  | Polkadot, Kusama | 354 (DOT) | Custom derivation |

## Wallet Creation & Management

### Basic Wallet Creation

```typescript
// Create wallet from seed
const seedGenerator = gateway.createSeedGenerator();
const seed = await seedGenerator.generateSeed({ strength: 256 });

const walletFactory = gateway.getWalletFactory('ethereum');
const wallet = await walletFactory.createWallet({
  seed: seed.mnemonic,
  addressIndex: 0
});

console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Derivation Path:', wallet.derivationPath); // m/44'/60'/0'/0/0
```

### Multi-Chain Wallet Creation

```typescript
// Create wallets for multiple chains from same seed
const seed = await seedGenerator.generateSeed();
const chains = ['ethereum', 'bitcoin', 'bsc'];

const wallets = {};
for (const chainName of chains) {
  const factory = gateway.getWalletFactory(chainName);
  wallets[chainName] = await factory.createWallet({
    seed: seed.mnemonic,
    addressIndex: 0
  });
}

// Same seed, different addresses per chain
console.log('ETH Address:', wallets.ethereum.address);
console.log('BTC Address:', wallets.bitcoin.address);
console.log('BSC Address:', wallets.bsc.address);
```

### Address Index Management

```typescript
// Generate multiple addresses from same seed
const walletFactory = gateway.getWalletFactory('ethereum');
const addresses = [];

for (let i = 0; i < 10; i++) {
  const wallet = await walletFactory.createWallet({
    seed: seed.mnemonic,
    addressIndex: i
  });
  addresses.push({
    index: i,
    address: wallet.address,
    path: wallet.derivationPath
  });
}

// Results in:
// Index 0: m/44'/60'/0'/0/0 -> 0x...
// Index 1: m/44'/60'/0'/0/1 -> 0x...
// Index 2: m/44'/60'/0'/0/2 -> 0x...
```

### Wallet Metadata

```typescript
// Create wallet with metadata
const wallet = await walletFactory.createWallet({
  seed: seed.mnemonic,
  addressIndex: 0,
  label: 'Primary Payment Wallet',
  metadata: {
    purpose: 'e-commerce',
    orderId: 'order_12345',
    customerEmail: 'customer@example.com'
  }
});

console.log('Label:', wallet.label);
console.log('Metadata:', wallet.metadata);
```

## BIP44 HD Wallet Support

### BIP44 Standard Implementation

The Wallet Factory implements BIP44 (Multi-Account Hierarchy for Deterministic Wallets) with the following structure:

```
m / purpose' / coin_type' / account' / change / address_index

Where:
- purpose: Always 44' (BIP44)
- coin_type: Chain-specific (60' for Ethereum, 0' for Bitcoin)
- account: Always 0' (first account)
- change: Always 0 (external addresses)
- address_index: Incremental index (0, 1, 2, ...)
```

### Chain-Specific Derivation Paths

```typescript
// Derivation paths are handled internally by adapters
const ethFactory = gateway.getWalletFactory('ethereum');
const btcFactory = gateway.getWalletFactory('bitcoin');

// Users only specify index, path is automatic
const ethWallet = await ethFactory.createWallet({ seed, addressIndex: 0 });
// Internal path: m/44'/60'/0'/0/0

const btcWallet = await btcFactory.createWallet({ seed, addressIndex: 0 });
// Internal path: m/44'/0'/0'/0/0

console.log('ETH Path:', ethWallet.derivationPath); // m/44'/60'/0'/0/0
console.log('BTC Path:', btcWallet.derivationPath); // m/44'/0'/0'/0/0
```

### Passphrase Support

BIP39 passphrases are supported for additional security:

```typescript
// Create wallet with passphrase
const walletWithPassphrase = await walletFactory.createWallet({
  seed: seed.mnemonic,
  passphrase: 'my-secret-passphrase',
  addressIndex: 0
});

// Same seed + index, different passphrase = different wallet
const wallet1 = await walletFactory.createWallet({ seed, passphrase: 'pass1', addressIndex: 0 });
const wallet2 = await walletFactory.createWallet({ seed, passphrase: 'pass2', addressIndex: 0 });

console.log('Different addresses:', wallet1.address !== wallet2.address);
```

## Import & Export Functions

### Supported Import Types

```typescript
type WalletImportType =
  | 'private_key'      // Raw private key (hex)
  | 'mnemonic'         // BIP39 mnemonic phrase
  | 'keystore'         // Ethereum keystore file
  | 'wif'              // Wallet Import Format (Bitcoin)
  | 'extended_key';    // BIP32 extended keys

interface WalletImportOptions {
  type: WalletImportType;
  data: string;                  // Import data
  label?: string;               // Wallet label
  validate?: boolean;           // Validate imported wallet
}
```

### Import Examples

```typescript
const walletFactory = gateway.getWalletFactory('ethereum');

// Import from private key
const privateKeyWallet = await walletFactory.importWallet({
  type: 'private_key',
  data: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  label: 'Imported Private Key Wallet',
  validate: true
});

// Import from mnemonic
const mnemonicWallet = await walletFactory.importWallet({
  type: 'mnemonic',
  data: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  label: 'Imported Mnemonic Wallet'
});

// Import from WIF (Bitcoin)
const btcFactory = gateway.getWalletFactory('bitcoin');
const wifWallet = await btcFactory.importWallet({
  type: 'wif',
  data: 'KxFC1jmwwCoACiCAWZ3eXa96mBM6tb3TYzGmf6YwgdGWZgawvrtJ',
  validate: true
});

// Import from keystore
const keystoreWallet = await walletFactory.importWallet({
  type: 'keystore',
  data: JSON.stringify(keystoreJson),
  validate: true
});
```

### Validation During Import

```typescript
// Import with validation
try {
  const wallet = await walletFactory.importWallet({
    type: 'private_key',
    data: 'invalid-private-key',
    validate: true
  });
} catch (error) {
  console.error('Import failed:', error.message);
}

// Check validation result
const validationResult = await walletFactory.validateWallet(importedWallet);
if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
  console.warn('Warnings:', validationResult.warnings);
}
```

## Batch Operations

### Batch Wallet Creation

```typescript
// Create multiple wallets in batch
const requests: BatchWalletCreationRequest[] = [
  { requestId: 'wallet_1', options: { seed, addressIndex: 0, label: 'Primary' } },
  { requestId: 'wallet_2', options: { seed, addressIndex: 1, label: 'Secondary' } },
  { requestId: 'wallet_3', options: { seed, addressIndex: 2, label: 'Backup' } },
];

const results = await walletFactory.createWallets(requests);

results.forEach(result => {
  if (result.success) {
    console.log(`${result.requestId}: ${result.wallet!.address}`);
  } else {
    console.error(`${result.requestId} failed: ${result.error}`);
  }
});
```

### Bulk Address Derivation

```typescript
// Derive multiple addresses efficiently
const addresses = await walletFactory.deriveAddresses({
  seed: seed.mnemonic,
  count: 100,                    // Generate 100 addresses
  startIndex: 0,                 // Starting from index 0
  passphrase: 'optional-passphrase'
});

addresses.forEach((addr, i) => {
  console.log(`Address ${i}: ${addr.address} (${addr.derivationPath})`);
});

// Generate addresses with specific range
const addressRange = await walletFactory.deriveAddresses({
  seed: seed.mnemonic,
  count: 10,
  startIndex: 50,               // Start from index 50
});
// Results: indices 50-59
```

### Performance Optimization

```typescript
// Efficient batch processing for large numbers
const BATCH_SIZE = 100;
const TOTAL_WALLETS = 1000;

const allWallets = [];
for (let i = 0; i < TOTAL_WALLETS; i += BATCH_SIZE) {
  const batchRequests = [];
  for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_WALLETS; j++) {
    batchRequests.push({
      requestId: `wallet_${i + j}`,
      options: { seed: seed.mnemonic, addressIndex: i + j }
    });
  }
  
  const batchResults = await walletFactory.createWallets(batchRequests);
  allWallets.push(...batchResults.filter(r => r.success).map(r => r.wallet!));
  
  // Small delay to prevent overwhelming the system
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log(`Created ${allWallets.length} wallets successfully`);
```

## Validation System

### Wallet Validation

```typescript
interface WalletValidationResult {
  valid: boolean;
  checks: {
    addressFormat: boolean;        // Address format validation
    privateKeyFormat: boolean;     // Private key format validation
    publicKeyMatch: boolean;       // Public key derivation match
    derivationPathValid: boolean;  // BIP44 path validation
    chainCompatibility: boolean;   // Chain compatibility check
  };
  errors: string[];              // Validation errors
  warnings: string[];            // Validation warnings
}

// Validate wallet
const validation = await walletFactory.validateWallet(wallet);

if (validation.valid) {
  console.log('Wallet is valid');
} else {
  console.log('Validation failed:');
  validation.errors.forEach(error => console.error('- ' + error));
  
  if (validation.warnings.length > 0) {
    console.log('Warnings:');
    validation.warnings.forEach(warning => console.warn('- ' + warning));
  }
}
```

### Comprehensive Validation

```typescript
// Custom validation with detailed checks
async function validateWalletComprehensively(wallet: WalletInfo): Promise<boolean> {
  const result = await walletFactory.validateWallet(wallet);
  
  // Check individual validation components
  if (!result.checks.addressFormat) {
    console.error('Invalid address format for chain:', wallet.chainName);
  }
  
  if (!result.checks.privateKeyFormat) {
    console.error('Invalid private key format');
  }
  
  if (!result.checks.publicKeyMatch) {
    console.error('Public key does not match private key');
  }
  
  if (!result.checks.derivationPathValid) {
    console.error('Invalid BIP44 derivation path:', wallet.derivationPath);
  }
  
  if (!result.checks.chainCompatibility) {
    console.error('Wallet not compatible with chain:', wallet.chainName);
  }
  
  return result.valid;
}
```

### Seed Validation

```typescript
// Validate seed before wallet creation
const isValidSeed = await walletFactory.validateSeed(seed.mnemonic);
if (!isValidSeed) {
  throw new Error('Invalid BIP39 mnemonic seed');
}

// Validate seed with comprehensive checking
async function validateSeedThoroughly(mnemonic: string): Promise<boolean> {
  // Basic format validation
  if (!await walletFactory.validateSeed(mnemonic)) {
    return false;
  }
  
  // Word count validation
  const words = mnemonic.trim().split(/\s+/);
  const validWordCounts = [12, 15, 18, 21, 24];
  if (!validWordCounts.includes(words.length)) {
    return false;
  }
  
  // Try creating a test wallet to verify functionality
  try {
    const testWallet = await walletFactory.createWallet({
      seed: mnemonic,
      addressIndex: 0
    });
    return testWallet.address.length > 0;
  } catch {
    return false;
  }
}
```

## Usage Examples

### E-commerce Payment Processing

```typescript
// Generate unique wallet for each order
async function createOrderPaymentWallet(orderId: string, chainName: string) {
  const seedGenerator = gateway.createSeedGenerator();
  const walletFactory = gateway.getWalletFactory(chainName);
  
  // Generate unique seed for this order
  const seed = await seedGenerator.generateSeed({
    strength: 256,
    encrypted: true
  });
  
  // Create payment wallet
  const paymentWallet = await walletFactory.createWallet({
    seed: seed.mnemonic,
    addressIndex: 0,
    label: `Order ${orderId} Payment`,
    metadata: {
      orderId,
      purpose: 'payment',
      createdFor: 'e-commerce'
    }
  });
  
  // Store encrypted seed for later access
  await database.storeOrderSeed(orderId, seed.encryptedMnemonic!);
  
  return {
    orderId,
    paymentAddress: paymentWallet.address,
    chainName: paymentWallet.chainName
  };
}
```

### Multi-Chain User Wallet System

```typescript
// Create user wallets across multiple chains
async function createUserMultiChainWallet(userId: string) {
  const supportedChains = ['ethereum', 'bitcoin', 'bsc', 'polygon'];
  const seedGenerator = gateway.createSeedGenerator();
  
  // Generate master seed for user
  const masterSeed = await seedGenerator.generateSeed({
    strength: 256,
    language: 'english'
  });
  
  const userWallets = {};
  
  // Create wallet for each supported chain
  for (const chainName of supportedChains) {
    const factory = gateway.getWalletFactory(chainName);
    const wallet = await factory.createWallet({
      seed: masterSeed.mnemonic,
      addressIndex: 0,
      label: `${userId} ${chainName.toUpperCase()} Wallet`,
      metadata: {
        userId,
        isPrimary: true,
        chainName
      }
    });
    
    userWallets[chainName] = {
      address: wallet.address,
      derivationPath: wallet.derivationPath,
      chainType: wallet.chainType
    };
  }
  
  // Store encrypted master seed
  const encryptedSeed = await seedGenerator.encryptSeed(masterSeed.mnemonic);
  await userService.storeMasterSeed(userId, encryptedSeed);
  
  return {
    userId,
    masterSeed: masterSeed.mnemonic, // Show once to user for backup
    wallets: userWallets
  };
}
```

### Hierarchical Wallet Management

```typescript
// Generate hierarchical wallet structure
async function createHierarchicalWallets(seed: string, chainName: string) {
  const factory = gateway.getWalletFactory(chainName);
  
  const walletStructure = {
    primary: null,      // Index 0 - Primary wallet
    backup: null,       // Index 1 - Backup wallet
    savings: null,      // Index 2 - Savings wallet
    trading: []         // Indices 10-19 - Trading wallets
  };
  
  // Create primary wallets
  walletStructure.primary = await factory.createWallet({
    seed,
    addressIndex: 0,
    label: 'Primary Wallet'
  });
  
  walletStructure.backup = await factory.createWallet({
    seed,
    addressIndex: 1,
    label: 'Backup Wallet'
  });
  
  walletStructure.savings = await factory.createWallet({
    seed,
    addressIndex: 2,
    label: 'Savings Wallet'
  });
  
  // Create trading wallets (indices 10-19)
  for (let i = 10; i < 20; i++) {
    const tradingWallet = await factory.createWallet({
      seed,
      addressIndex: i,
      label: `Trading Wallet ${i - 9}`,
      metadata: { purpose: 'trading', walletNumber: i - 9 }
    });
    walletStructure.trading.push(tradingWallet);
  }
  
  return walletStructure;
}
```

### Treasury Management System

```typescript
// Multi-signature treasury wallet creation
async function createTreasuryWallets(organizationId: string, chainNames: string[]) {
  const seedGenerator = gateway.createSeedGenerator();
  const treasuryStructure = {};
  
  // Generate separate seeds for each signer
  const signerSeeds = [];
  for (let i = 0; i < 5; i++) { // 5 signers
    const seed = await seedGenerator.generateSeed({ strength: 256 });
    signerSeeds.push(seed);
  }
  
  for (const chainName of chainNames) {
    const factory = gateway.getWalletFactory(chainName);
    const chainTreasury = {
      signers: [],
      operational: null,
      reserve: null
    };
    
    // Create signer wallets
    for (let i = 0; i < signerSeeds.length; i++) {
      const signerWallet = await factory.createWallet({
        seed: signerSeeds[i].mnemonic,
        addressIndex: 0,
        label: `Treasury Signer ${i + 1}`,
        metadata: {
          organizationId,
          role: 'signer',
          signerIndex: i
        }
      });
      chainTreasury.signers.push(signerWallet);
    }
    
    // Create operational wallet (using first signer's seed, index 1)
    chainTreasury.operational = await factory.createWallet({
      seed: signerSeeds[0].mnemonic,
      addressIndex: 1,
      label: 'Treasury Operational',
      metadata: {
        organizationId,
        role: 'operational'
      }
    });
    
    // Create reserve wallet (using first signer's seed, index 2)
    chainTreasury.reserve = await factory.createWallet({
      seed: signerSeeds[0].mnemonic,
      addressIndex: 2,
      label: 'Treasury Reserve',
      metadata: {
        organizationId,
        role: 'reserve'
      }
    });
    
    treasuryStructure[chainName] = chainTreasury;
  }
  
  return treasuryStructure;
}
```

## Best Practices

### Security Best Practices

1. **Seed Management**: Always use encrypted storage for seeds
2. **Private Key Handling**: Never log or persist private keys
3. **Index Management**: Use systematic index allocation
4. **Validation**: Always validate wallets before use
5. **Access Control**: Implement proper access controls

```typescript
// Secure wallet creation pattern
async function createSecureWallet(encryptedSeed: string, addressIndex: number) {
  const seedGenerator = gateway.createSeedGenerator();
  
  try {
    // Decrypt seed in memory only
    const seed = await seedGenerator.decryptSeed(encryptedSeed);
    
    // Create wallet
    const wallet = await walletFactory.createWallet({
      seed,
      addressIndex
    });
    
    // Clear seed from memory (best effort)
    seed.replace(/./g, '0');
    
    // Return wallet without private key for logging
    return {
      address: wallet.address,
      derivationPath: wallet.derivationPath,
      chainName: wallet.chainName
    };
  } catch (error) {
    console.error('Secure wallet creation failed:', error.message);
    throw error;
  }
}
```

### Performance Best Practices

1. **Batch Operations**: Use batch methods for multiple wallets
2. **Factory Reuse**: Reuse wallet factory instances
3. **Connection Pooling**: Configure appropriate connection pools
4. **Memory Management**: Clear sensitive data when possible

```typescript
// Efficient wallet creation
class WalletManager {
  private factories: Map<string, IWalletFactory> = new Map();
  
  async initializeFactories(chainNames: string[]) {
    for (const chainName of chainNames) {
      const factory = gateway.getWalletFactory(chainName);
      this.factories.set(chainName, factory);
    }
  }
  
  async createWalletsEfficiently(chainName: string, seed: string, count: number) {
    const factory = this.factories.get(chainName);
    if (!factory) throw new Error(`Factory for ${chainName} not initialized`);
    
    // Use batch operations for better performance
    const addresses = await factory.deriveAddresses({
      seed,
      count,
      startIndex: 0
    });
    
    return addresses;
  }
}
```

### Operational Best Practices

1. **Error Handling**: Implement comprehensive error handling
2. **Logging**: Log operations without sensitive data
3. **Monitoring**: Monitor wallet creation performance
4. **Backup**: Always backup wallet creation parameters

## Error Handling

### Common Error Scenarios

```typescript
// Comprehensive error handling
async function createWalletWithErrorHandling(options: WalletCreationOptions) {
  try {
    // Validate seed first
    const isValidSeed = await walletFactory.validateSeed(options.seed);
    if (!isValidSeed) {
      throw new Error('Invalid BIP39 mnemonic seed');
    }
    
    // Create wallet
    const wallet = await walletFactory.createWallet(options);
    
    // Validate created wallet
    const validation = await walletFactory.validateWallet(wallet);
    if (!validation.valid) {
      throw new Error(`Wallet validation failed: ${validation.errors.join(', ')}`);
    }
    
    return wallet;
  } catch (error) {
    if (error.message.includes('Invalid seed')) {
      console.error('Seed validation error:', error.message);
    } else if (error.message.includes('derivation')) {
      console.error('Derivation path error:', error.message);
    } else if (error.message.includes('address generation')) {
      console.error('Address generation error:', error.message);
    } else {
      console.error('Unexpected wallet creation error:', error.message);
    }
    throw error;
  }
}
```

### Error Recovery Strategies

```typescript
// Retry mechanism for wallet creation
async function createWalletWithRetry(
  options: WalletCreationOptions,
  maxRetries: number = 3
): Promise<WalletInfo> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const wallet = await walletFactory.createWallet(options);
      
      // Validate wallet
      const validation = await walletFactory.validateWallet(wallet);
      if (validation.valid) {
        return wallet;
      } else {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      lastError = error;
      console.warn(`Wallet creation attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Wallet creation failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Performance Considerations

### Creation Performance

- **Single Wallet**: ~5-10ms per wallet
- **Batch Creation**: ~2-5ms per wallet (in batches of 100)
- **Address Derivation**: ~1-3ms per address
- **Validation**: ~1-2ms per wallet

### Memory Usage

- **
