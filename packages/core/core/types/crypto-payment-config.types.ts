/**
 * Core configuration types for Crypto Payment Gateway
 * These interfaces define the structure of the main configuration system
 */

/**
 * Main configuration interface for initializing the Crypto Payment Gateway
 */
export interface CryptoPaymentConfig {
  /** Operating mode - determines default behavior and resource allocation */
  mode?: 'lightweight' | 'enterprise';
  
  /** Array of blockchain chain configurations (required) */
  chains: ChainConfig[];
  
  /** Optional encryption settings for sensitive data */
  encryption?: EncryptionConfig;
  
  /** Optional monitoring configuration for blockchain networks */
  monitoring?: MonitoringConfig;
  
  /** Optional performance settings for optimization */
  performance?: PerformanceConfig;
  
  /** Optional treasury management configuration */
  treasury?: TreasuryConfig;
  
  /** Optional notification strategies configuration */
  notifications?: NotificationConfig;
  
  /** Optional logging configuration */
  logging?: LoggingConfig;
}

/**
 * Configuration for individual blockchain networks
 */
export interface ChainConfig {
  /** Unique identifier for the chain (e.g., 'ethereum', 'bitcoin') */
  name: string;
  
  /** NPM package name for the chain adapter (e.g., '@cryptopaygw/evm-adapter') */
  adapter: string;
  
  /** Primary RPC endpoint URL for blockchain communication */
  rpcUrl: string;
  
  /** Optional WebSocket endpoint URL for real-time monitoring */
  wsUrl?: string;
  
  /** Optional chain-specific configuration options */
  options?: ChainOptions;
}

/**
 * Chain-specific options for fine-tuning blockchain interactions
 */
export interface ChainOptions {
  /** Gas price strategy: 'auto' for automatic or string value for fixed price */
  gasPrice?: 'auto' | string;
  
  /** Number of confirmations required for transaction finality */
  confirmations?: number;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum number of retry attempts for failed requests */
  maxRetries?: number;
  
  /** Rate limit in requests per minute */
  rateLimitRpm?: number;
}

/**
 * Encryption configuration for securing sensitive data
 */
export interface EncryptionConfig {
  /** Master encryption key - must be securely stored */
  key: string;
  
  /** Encryption algorithm to use */
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc';
  
  /** Optional key derivation settings for enhanced security */
  keyDerivation?: KeyDerivationConfig;
}

/**
 * Key derivation configuration for PBKDF2-based key generation
 */
export interface KeyDerivationConfig {
  /** Number of PBKDF2 iterations (default: 100000) */
  iterations?: number;
  
  /** Custom salt for key derivation (auto-generated if not provided) */
  salt?: string;
  
  /** Derived key length in bytes */
  keyLength?: number;
}

/**
 * Monitoring configuration for blockchain network observation
 */
export interface MonitoringConfig {
  /** Milliseconds between polling checks */
  pollingInterval?: number;
  
  /** Number of addresses processed per batch */
  batchSize?: number;
  
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Prefer WebSocket connections when available */
  useWebSockets?: boolean;
  
  /** Fall back to polling if WebSocket connections fail */
  fallbackToPolling?: boolean;
  
  /** Number of blocks to scan per query */
  blockRange?: number;
  
  /** Maximum simultaneous requests */
  maxConcurrentRequests?: number;
}

/**
 * Performance configuration for system optimization
 */
export interface PerformanceConfig {
  /** Maximum number of chains processed simultaneously */
  maxConcurrentChains?: number;
  
  /** Number of wallets processed per batch operation */
  walletsPerBatch?: number;
  
  /** HTTP connection pool size per chain */
  connectionPoolSize?: number;
  
  /** Number of worker threads for CPU-intensive tasks */
  workerThreads?: number;
  
  /** Maximum memory usage limit (e.g., '2GB', '512MB') */
  maxMemoryUsage?: string;
  
  /** Global rate limit in requests per minute */
  rateLimitRpm?: number;
  
  /** Cache size for frequently accessed data */
  cacheSize?: number;
  
  /** Garbage collection interval in milliseconds */
  gcInterval?: number;
}

/**
 * Treasury management configuration for advanced fund operations
 */
export interface TreasuryConfig {
  /** Default treasury type */
  defaultType?: 'multisig' | 'governance' | 'timelock';
  
  /** Enable gas optimization strategies */
  gasOptimization?: boolean;
  
  /** Batch multiple operations for efficiency */
  batchTransactions?: boolean;
  
  /** Default approval threshold for multi-signature operations */
  approvalThreshold?: number;
  
  /** Delay before execution in seconds (for timelock/governance) */
  executionDelay?: number;
  
  /** Maximum number of signers allowed */
  maxSigners?: number;
  
  /** Enable emergency pause functionality */
  emergencyPause?: boolean;
}

/**
 * Notification configuration for event delivery
 */
export interface NotificationConfig {
  /** Available notification strategies */
  strategies?: ('callback' | 'events' | 'websocket' | 'polling')[];
  
  /** Fallback strategy when primary strategies fail */
  fallback?: 'callback' | 'events' | 'polling';
  
  /** Internal notification queue size */
  queueSize?: number;
  
  /** Number of retry attempts for failed notifications */
  retryAttempts?: number;
  
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  
  /** Batch multiple notifications for efficiency */
  batchNotifications?: boolean;
  
  /** Filter out duplicate notifications */
  filterDuplicates?: boolean;
}

/**
 * Logging configuration for debugging and monitoring
 */
export interface LoggingConfig {
  /** Log level for filtering messages */
  level?: 'debug' | 'info' | 'warn' | 'error';
  
  /** Log destination: 'console' or file path */
  destination?: 'console' | string;
  
  /** Include timestamp in log messages */
  includeTimestamp?: boolean;
  
  /** Include log level in messages */
  includeLevel?: boolean;
  
  /** Include module name in messages */
  includeModule?: boolean;
  
  /** Maximum log file size before rotation */
  maxFileSize?: string;
  
  /** Maximum number of log files to keep */
  maxFiles?: number;
  
  /** Log format: 'json' or 'text' */
  format?: 'json' | 'text';
}

/**
 * Result of configuration validation
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  
  /** Array of validation error messages */
  errors: string[];
  
  /** Array of validation warning messages */
  warnings: string[];
}
