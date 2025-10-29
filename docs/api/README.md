# Crypto Payment Gateway - API Documentation

## Overview

The Crypto Payment Gateway is a comprehensive Node.js library for multi-chain cryptocurrency operations. It provides a unified interface for interacting with various blockchain networks including Ethereum (EVM) and Bitcoin (UTXO) based chains.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [EVM Adapter](#evm-adapter)
- [UTXO Adapter](#utxo-adapter)
- [Chain Configuration](#chain-configuration)
- [Wallet Management](#wallet-management)
- [Transaction Operations](#transaction-operations)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Quick Start

### Installation

```bash
# Install core package and adapters
npm install @cryptopaygw/core
npm install @cryptopaygw/evm-adapter
npm install @cryptopaygw/utxo-adapter
```

### Basic Usage

```typescript
import { EVMAdapterFactory } from '@cryptopaygw/evm-adapter';
import { UTXOAdapterFactory } from '@cryptopaygw/utxo-adapter';

// Create Ethereum adapter
const ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/YOUR_KEY');

// Create Bitcoin adapter  
const btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');

// Connect and start using
await ethAdapter.connect();
await btcAdapter.connect();

// Generate wallet addresses
const ethWallet = await ethAdapter.generateAddress({
  seed: 'your mnemonic phrase here...'
});

const btcWallet = await btcAdapter.generateAddress({
  seed: 'your mnemonic phrase here...'
});

console.log('Ethereum Address:', ethWallet.address);
console.log('Bitcoin Address:', btcWallet.address);
```

## Architecture

The library follows SOLID principles with a modular architecture:

```
@cryptopaygw/
├── core/           # Core interfaces and types
├── evm-adapter/    # Ethereum/EVM chain support
└── utxo-adapter/   # Bitcoin/UTXO chain support
```

### Key Principles

- **Interface-Driven**: All adapters implement common interfaces
- **Chain-Agnostic**: Unified API across different blockchain types
- **Modular**: Add support for new chains via pluggable adapters
- **Enterprise-Grade**: Built for high-throughput, scalable operations
- **Type-Safe**: Full TypeScript support with strict typing

## EVM Adapter

### Supported Chains

- Ethereum (Mainnet)
- Binance Smart Chain (BSC)
- Polygon (Matic)
- Custom EVM-compatible chains

### Key Features

- Native ETH and ERC-20 token support
- HD wallet generation (BIP44)
- Gas optimization and fee estimation
- Smart contract interactions
- WebSocket support for real-time events

### Factory Methods

```typescript
import { EVMAdapterFactory } from '@cryptopaygw/evm-adapter';

// Pre-configured networks
const ethereum = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/KEY');
const bsc = EVMAdapterFactory.createBSC('https://bsc-dataseed.binance.org/');
const polygon = EVMAdapterFactory.createPolygon('https://polygon-rpc.com/');

// Custom network
const customChain = EVMAdapterFactory.createCustom({
  name: 'my-chain',
  chainId: 1234,
  rpcUrl: 'https://my-rpc.com',
  nativeTokenSymbol: 'MYTOKEN'
});
```

## UTXO Adapter

### Supported Chains

- Bitcoin (Mainnet & Testnet)
- Litecoin
- Custom UTXO-based chains

### Key Features

- Multiple address types (P2PKH, P2WPKH, P2SH, P2TR)
- UTXO selection algorithms
- Fee estimation and optimization
- HD wallet generation (BIP44/BIP49/BIP84/BIP86)
- Multi-API provider support

### Factory Methods

```typescript
import { UTXOAdapterFactory } from '@cryptopaygw/utxo-adapter';

// Pre-configured networks
const bitcoin = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
const litecoin = UTXOAdapterFactory.createLitecoin('https://chain.so/api/v2');
const testnet = UTXOAdapterFactory.createBitcoinTestnet('https://blockstream.info/testnet/api');

// Custom UTXO chain
const customUTXO = UTXOAdapterFactory.createCustom({
  name: 'my-utxo-chain',
  network: 'bitcoin',
  apiBaseUrl: 'https://my-api.com',
  nativeTokenSymbol: 'MYBTC'
});
```

## Chain Configuration

### EVM Chain Config

```typescript
interface EVMChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals?: number;
  blockTime?: number;
  confirmations?: number;
  gasMultiplier?: number;
  maxGasPrice?: string;
}
```

### UTXO Chain Config

```typescript
interface UTXOChainConfig {
  name: string;
  network: 'bitcoin' | 'litecoin' | 'testnet';
  apiBaseUrl: string;
  apiType?: 'blockstream' | 'chain.so' | 'custom';
  nativeTokenSymbol: string;
  nativeTokenDecimals?: number;
  dustThreshold?: number;
  feeRate?: number;
  confirmations?: number;
  addressType?: 'legacy' | 'segwit' | 'native_segwit' | 'taproot';
}
```

## Wallet Management

### Address Generation

```typescript
// From mnemonic seed
const wallet = await adapter.generateAddress({
  seed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  derivationPath: "m/44'/60'/0'/0/0", // Optional custom path
  index: 0
});

// From private key
const wallet = await adapter.generateAddress({
  privateKey: '0x1234567890abcdef...'
});

// Bulk address generation
const wallets = await adapter.deriveAddresses({
  seed: 'your mnemonic here...',
  count: 10,
  startIndex: 0
});
```

### Address Validation

```typescript
const isValid = await adapter.validateAddress('0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6');
console.log('Valid address:', isValid); // true/false
```

## Transaction Operations

### Balance Queries

```typescript
// Single address balance
const balance = await adapter.getBalance('0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6');
console.log('Balance:', balance.balance, balance.confirmed, balance.unconfirmed);

// Multiple addresses
const addresses = ['addr1', 'addr2', 'addr3'];
const balances = await adapter.getBalances(addresses);

// Token balance (EVM only)
const tokenBalance = await evmAdapter.getTokenBalance(
  '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6', // wallet address
  '0xA0b86a33E6417c3db73Ae30b50c2c6E8f9F8C52c'  // token contract
);
```

### Transaction Creation and Broadcasting

```typescript
// Create transaction
const unsignedTx = await adapter.createTransaction({
  from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
  to: '0x8ba1f109551bD432803012645Hac136c32960442',
  amount: '1000000000000000000', // 1 ETH in wei
  gasPrice: '20000000000', // 20 gwei
  gasLimit: '21000'
});

// Sign transaction
const signedTx = await adapter.signTransaction(unsignedTx, privateKey);

// Broadcast transaction
const txHash = await adapter.broadcastTransaction(signedTx);
console.log('Transaction hash:', txHash);
```

### ERC-20 Token Transfer (EVM)

```typescript
const tokenTx = await evmAdapter.createTransaction({
  from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
  to: '0x8ba1f109551bD432803012645Hac136c32960442',
  amount: '1000000000000000000', // 1 token
  tokenAddress: '0xA0b86a33E6417c3db73Ae30b50c2c6E8f9F8C52c' // USDC contract
});
```

## Error Handling

The library provides comprehensive error handling with specific error types:

```typescript
try {
  const balance = await adapter.getBalance('invalid-address');
} catch (error) {
  if (error.message.includes('Invalid address format')) {
    console.log('Please provide a valid address');
  } else if (error.message.includes('not connected')) {
    console.log('Please connect to the network first');
    await adapter.connect();
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Examples

### Multi-Chain Wallet Portfolio

```typescript
import { EVMAdapterFactory } from '@cryptopaygw/evm-adapter';
import { UTXOAdapterFactory } from '@cryptopaygw/utxo-adapter';

async function createMultiChainPortfolio() {
  // Initialize adapters
  const ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/KEY');
  const btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
  
  await ethAdapter.connect();
  await btcAdapter.connect();
  
  const seed = 'your twelve word mnemonic phrase here for wallet generation';
  const portfolio = [];
  
  // Generate addresses for same user across chains
  for (let i = 0; i < 5; i++) {
    const ethWallet = await ethAdapter.generateAddress({ seed, index: i });
    const btcWallet = await btcAdapter.generateAddress({ seed, index: i });
    
    // Get balances
    const ethBalance = await ethAdapter.getBalance(ethWallet.address);
    const btcBalance = await btcAdapter.getBalance(btcWallet.address);
    
    portfolio.push({
      index: i,
      ethereum: {
        address: ethWallet.address,
        balance: ethBalance.balance
      },
      bitcoin: {
        address: btcWallet.address,
        balance: btcBalance.balance
      }
    });
  }
  
  return portfolio;
}
```

### Automated Token Transfer

```typescript
async function transferTokens() {
  const adapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/KEY');
  await adapter.connect();
  
  const privateKey = 'your-private-key-here';
  const tokenContract = '0xA0b86a33E6417c3db73Ae30b50c2c6E8f9F8C52c'; // USDC
  
  // Create token transfer transaction
  const transaction = await adapter.createTransaction({
    from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
    to: '0x8ba1f109551bD432803012645Hac136c32960442',
    amount: '1000000', // 1 USDC (6 decimals)
    tokenAddress: tokenContract
  });
  
  // Sign and broadcast
  const signedTx = await adapter.signTransaction(transaction, privateKey);
  const txHash = await adapter.broadcastTransaction(signedTx);
  
  console.log('Token transfer completed:', txHash);
}
```

### Health Monitoring

```typescript
async function monitorAdapterHealth() {
  const adapters = [
    EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/KEY'),
    UTXOAdapterFactory.createBitcoin('https://blockstream.info/api')
  ];
  
  for (const adapter of adapters) {
    await adapter.connect();
    
    const health = await adapter.healthCheck();
    const status = await adapter.getConnectionStatus();
    
    console.log(`${adapter.chainName} Health:`, {
      healthy: health.healthy,
      latency: health.latency,
      connected: status.connected,
      blockHeight: status.blockHeight
    });
  }
}
```

### Fee Estimation

```typescript
async function estimateTransactionFees() {
  const adapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/KEY');
  await adapter.connect();
  
  // Get current gas prices
  const feeData = await adapter.provider.getFeeData();
  
  console.log('Current gas prices:', {
    gasPrice: feeData.gasPrice?.toString(),
    maxFeePerGas: feeData.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
  });
  
  // Estimate gas for transaction
  const gasEstimate = await adapter.provider.estimateGas({
    from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
    to: '0x8ba1f109551bD432803012645Hac136c32960442',
    value: '1000000000000000000' // 1 ETH
  });
  
  console.log('Estimated gas:', gasEstimate.toString());
}
```

## Advanced Usage

### Custom Chain Integration

```typescript
// Define custom EVM chain
const myChain = EVMAdapterFactory.createCustom({
  name: 'my-custom-chain',
  chainId: 1234,
  rpcUrl: 'https://my-rpc-endpoint.com',
  nativeTokenSymbol: 'CUSTOM',
  nativeTokenDecimals: 18,
  blockTime: 3000,
  confirmations: 12
});

// Define custom UTXO chain
const myUTXO = UTXOAdapterFactory.createCustom({
  name: 'my-utxo-chain',
  network: 'bitcoin',
  apiBaseUrl: 'https://my-api.com/api/v1',
  nativeTokenSymbol: 'MYCOIN',
  dustThreshold: 546,
  feeRate: 10
});
```

### Batch Operations

```typescript
// Batch balance queries
const addresses = [
  '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
  '0x8ba1f109551bD432803012645Hac136c32960442',
  '0x0000000000000000000000000000000000000000'
];

const balances = await adapter.getBalances(addresses);
balances.forEach((result, index) => {
  if (result.balance) {
    console.log(`Address ${addresses[index]}: ${result.balance.balance}`);
  } else {
    console.log(`Error for ${addresses[index]}: ${result.error}`);
  }
});

// Batch token balances (EVM)
const tokenAddresses = [
  '0xA0b86a33E6417c3db73Ae30b50c2c6E8f9F8C52c', // USDC
  '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
  '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'  // MATIC
];

const tokenBalances = await evmAdapter.getTokenBalances(userAddress, tokenAddresses);
```

## Best Practices

1. **Connection Management**: Always connect before using adapters and disconnect when done
2. **Error Handling**: Implement comprehensive error handling for all operations
3. **Private Key Security**: Never expose private keys in code or logs
4. **Fee Optimization**: Use current network conditions for gas/fee estimation
5. **Address Validation**: Always validate addresses before transactions
6. **Testing**: Use testnets for development and testing

## Support

For technical support and questions:
- GitHub Issues: [cryptopaygw/core/issues](https://github.com/cryptopaygw/core/issues)
- Documentation: [docs.cryptopaygw.com](https://docs.cryptopaygw.com)
- Community Discord: [discord.gg/cryptopaygw](https://discord.gg/cryptopaygw)
