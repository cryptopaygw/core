# Examples - Crypto Payment Gateway

Bu dizinde crypto payment gateway library'sinin gerçek dünya kullanım senaryolarını gösteren kapsamlı örnekler bulunmaktadır.

## 📋 Örnek Listesi

### 1. 🎯 [Basic Wallet Operations](./01-basic-wallet-operations.ts)
**Temel wallet operasyonları ve blockchain etkileşimleri**

```bash
# Çalıştırma
npm run example:basic

# Veya direkt olarak
npx ts-node examples/01-basic-wallet-operations.ts
```

**Ne öğrenirsiniz:**
- ✅ Güvenli seed generation (BIP39)
- ✅ HD wallet creation (Ethereum + Bitcoin)
- ✅ Address validation across chains
- ✅ Balance checking operations
- ✅ Seed encryption/decryption

**Use Case:** Basit cryptocurrency wallet uygulaması

---

### 2. 🔍 [Real-time Wallet Monitoring](./02-real-time-wallet-monitoring.ts)
**Gerçek zamanlı wallet monitoring ve event tracking**

```bash
# Çalıştırma
npm run example:monitoring

# Veya direkt olarak
npx ts-node examples/02-real-time-wallet-monitoring.ts
```

**Ne öğrenirsiniz:**
- ✅ Real-time transaction detection
- ✅ Balance change notifications
- ✅ Multi-chain portfolio tracking
- ✅ Event-driven monitoring system
- ✅ Performance statistics

**Use Case:** Exchange hot wallet monitoring, user deposit detection

---

### 3. 🏛️ [Enterprise Treasury Management](./03-enterprise-treasury-management.ts)
**Enterprise-grade treasury management ve security**

```bash
# Çalıştırma
npm run example:treasury

# Veya direkt olarak
npx ts-node examples/03-enterprise-treasury-management.ts
```

**Ne öğrenirsiniz:**
- ✅ Multi-signature wallet operations
- ✅ Hot/cold wallet rebalancing
- ✅ Risk assessment and compliance
- ✅ Emergency stop mechanisms
- ✅ Audit trail and reporting

**Use Case:** Büyük ölçekli crypto exchange veya kurumsal treasury

---

### 4. 💳 [Automated Payment Processing](./04-automated-payment-processing.ts)
**Otomatik payment processing ve lifecycle management**

```bash
# Çalıştırma
npm run example:payments

# Veya direkt olarak
npx ts-node examples/04-automated-payment-processing.ts
```

**Ne öğrenirsiniz:**
- ✅ Automated deposit detection & processing
- ✅ Intelligent withdrawal queue management
- ✅ Batch processing ve fee optimization
- ✅ System integration (monitoring + treasury)
- ✅ Real-time payment lifecycle management

**Use Case:** Crypto exchange veya payment processor automation

---

### 5. 🌟 [Complete System Integration](./05-complete-system-integration.ts)
**Tam entegre cryptocurrency payment platform**

```bash
# Çalıştırma
npm run example:complete

# Veya direkt olarak
npx ts-node examples/05-complete-system-integration.ts
```

**Ne öğrenirsiniz:**
- ✅ Complete multi-chain payment gateway
- ✅ Merchant & customer management
- ✅ Real-world production scenario
- ✅ Enterprise-scale operations
- ✅ End-to-end workflow demonstration

**Use Case:** Coinbase Commerce benzeri complete crypto payment platform

---

## 🚀 Hızlı Başlangıç

### Önkoşullar

```bash
# Repository'yi clone edin
git clone <repo-url>
cd crypto-payment-gateway

# Dependencies yükleyin
npm install

# TypeScript build edin
npm run build
```

### Tüm Örnekleri Çalıştırma

```bash
# Tüm örnekleri sırayla çalıştır
npm run examples:all

# Veya tek tek
npm run example:basic
npm run example:monitoring  
npm run example:treasury
npm run example:payments
npm run example:complete
```

## 📊 Örnek Karşılaştırması

| Örnek | Karmaşıklık | Süre | Özellikler |
|-------|-------------|------|------------|
| Basic Wallet | ⭐ | 2 dk | Temel operations |
| Monitoring | ⭐⭐ | 5 dk | Real-time events |
| Treasury | ⭐⭐⭐ | 8 dk | Enterprise security |
| Payments | ⭐⭐⭐⭐ | 10 dk | Full automation |
| Complete | ⭐⭐⭐⭐⭐ | 15 dk | Production platform |

## 🔧 Configuration

Her örnek kendi içinde yapılandırılabilir. Ana configuration seçenekleri:

```typescript
// Blockchain Network Seçimi
const config = {
  testnet: true,  // testnet kullan
  enableRealBlockchain: false,  // gerçek blockchain bağlantısı
  
  // Performance Settings
  processingInterval: 5000,  // ms
  batchSize: 10,
  maxRetryAttempts: 3,
  
  // Security Settings
  requireApprovalForLargeAmounts: true,
  largeAmountThreshold: '10.0',
  
  // Chain Configurations
  evmChains: [...],
  utxoChains: [...]
};
```

## 📝 Log Output Örnekleri

### Basic Wallet Operations
```
🚀 Basic Wallet Operations Example
=====================================

📝 Step 1: Generate Secure Seed
✅ Generated seed: abandon abandon abandon abandon...
🔒 Encrypted seed available: true
💪 Seed strength: 256 bits (24 words)

🔗 Step 2: Initialize Blockchain Adapters
✅ Connected to Ethereum mainnet
✅ Connected to Bitcoin mainnet
```

### Real-time Monitoring
```
🔍 Real-time Wallet Monitoring Example
======================================

📡 Step 4: Setup Event Listeners

🔔 NEW TRANSACTION #1:
   Wallet: user_1_eth
   Chain: ethereum
   Type: incoming
   Amount: 0.1 ETH
   Hash: 0xabc123...
   Confirmations: 12
   Status: confirmed
```

### Treasury Management
```
🏛️ Enterprise Treasury Management Example
==========================================

📝 TREASURY OPERATION CREATED #1:
   Operation ID: op_1633024800_abc123
   Type: transfer
   Amount: 5.0 ETHEREUM
   From: 0x742d35...
   To: 0x8ba1f1...
   Required Signatures: 3
   Current Signatures: 0
   Reason: Hot wallet rebalancing - low balance alert
```

## 🎯 Use Case Scenarios

### E-commerce Integration
```typescript
// Basic wallet operations + monitoring
const walletSystem = new WalletOperations();
const monitor = new WalletMonitor();

// Customer deposit address generation
const customerWallet = await walletSystem.generateAddress({
  seed: customerSeed,
  index: 0
});

// Real-time payment detection
monitor.on('newTransaction', handleCustomerPayment);
```

### Exchange Backend
```typescript
// Complete payment processing + treasury
const paymentProcessor = new PaymentProcessor();
const treasury = new TreasuryManager();

// Automated deposit processing
paymentProcessor.on('depositCredited', updateCustomerBalance);

// Automated withdrawal processing
paymentProcessor.on('withdrawalCompleted', notifyCustomer);

// Treasury rebalancing
treasury.on('rebalanceNeeded', executeRebalancing);
```

### Enterprise Treasury
```typescript
// Multi-sig treasury operations
const treasury = new TreasuryManager({
  multiSigRequired: true,
  requiredSignatures: 3,
  hotWalletThreshold: '100.0'
});

// Risk assessment
treasury.on('riskAssessment', evaluateRisk);

// Compliance reporting  
treasury.on('complianceReport', generateReport);
```

## 🔍 Debug ve Testing

### Debug Mode
```bash
# Debug logs ile çalıştırma
DEBUG=crypto-payment:* npm run example:complete
```

### Mock Mode
```typescript
// Mock blockchain için
const config = {
  enableRealBlockchain: false,
  mockTransactionDelay: 2000
};
```

### Performance Testing
```bash
# Performance metrics ile
ENABLE_METRICS=true npm run example:payments
```

## 🌐 Multi-Chain Support

Tüm örnekler şu blockchain'leri destekler:

- **Ethereum** (EVM) - ETH, ERC-20 tokens
- **Bitcoin** (UTXO) - BTC, native transactions  
- **Polygon** (EVM) - MATIC, ERC-20 tokens
- **Binance Smart Chain** (EVM) - BNB, BEP-20 tokens

### Chain-Specific Features

#### Ethereum
- Smart contract interactions
- ERC-20 token support
- Gas fee optimization
- MEV protection

#### Bitcoin  
- UTXO model transactions
- Multiple address types (P2PKH, P2WPKH, P2SH, P2TR)
- Transaction batching
- Fee estimation

#### Polygon
- Low-cost transactions
- Fast confirmations
- Ethereum compatibility
- DeFi integrations

#### Binance Smart Chain
- Cross-chain bridges
- Fast block times
- Low transaction fees
- DeFi ecosystem

## 📚 Ek Kaynaklar

- [API Documentation](../docs/api/)
- [Architecture Guide](../docs/architecture.md)
- [Configuration Reference](../docs/configuration.md)
- [Testing Guide](../tests/README.md)

## 🆘 Troubleshooting

### Yaygın Sorunlar

#### "Provider not connected" hatası
```bash
# Network bağlantısını kontrol edin
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
  https://mainnet.infura.io/v3/demo
```

#### TypeScript import hataları
```bash
# Build işlemini tekrar çalıştırın
npm run build
npm run example:basic
```

#### Memory issues (large datasets)
```typescript
// Batch size'ı azaltın
const config = {
  batchSize: 5,  // default: 10
  maxConcurrentChecks: 10  // default: 20
};
```

### Performance Optimization

```typescript
// Production settings
const productionConfig = {
  processingInterval: 30000,  // 30 seconds
  balanceCheckInterval: 60000,  // 1 minute
  maxConcurrentChecks: 50,
  retryAttempts: 5,
  
  // Memory optimization
  cleanupInterval: 300000,  // 5 minutes
  maxHistoryEntries: 10000
};
```

## 🎉 Sonuç

Bu örnekler crypto payment gateway library'sinin gücünü ve esnekliğini göstermektedir. Basit wallet operasyonlarından enterprise-grade treasury yönetimine kadar tüm use case'leri kapsar.

**Bir sonraki adımınız için öneriler:**
1. **Basic Wallet** ile başlayın
2. **Monitoring** ile real-time events öğrenin
3. **Treasury** ile enterprise security kavrayın
4. **Payments** ile automation master edin
5. **Complete** ile production deployment hazırlanın

**Happy Coding! 🚀**
