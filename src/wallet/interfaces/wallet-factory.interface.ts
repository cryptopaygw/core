/**
 * Wallet Factory Interface
 * 
 * Provides chain-agnostic wallet creation and management.
 * Derivation paths are handled internally by chain adapters.
 * Users only specify address index and other basic options.
 * 
 * Design Principles:
 * - Chain-agnostic: Works for any blockchain through adapters
 * - Simple API: Users don't need to know derivation path details
 * - Adapter-managed: Each chain handles its own BIP44 standards
 * - Batch operations: Efficient multi-wallet creation
 */

/**
 * Main wallet factory interface
 */
export interface IWalletFactory {
  /**
   * Chain identification
   */
  readonly chainName: string;
  readonly chainType: string;
  readonly networkId: string | number;

  /**
   * Single wallet operations
   */
  createWallet(options: WalletCreationOptions): Promise<WalletInfo>;
  importWallet(options: WalletImportOptions): Promise<WalletInfo>;
  validateWallet(wallet: WalletInfo): Promise<WalletValidationResult>;

  /**
   * Batch wallet operations
   */
  createWallets(requests: BatchWalletCreationRequest[]): Promise<WalletCreationResult[]>;
  deriveAddresses(options: AddressDerivationOptions): Promise<WalletAddress[]>;

  /**
   * Address management
   */
  generateAddressAtIndex(seed: string, index: number): Promise<WalletAddress>;

  /**
   * Utility operations
   */
  getDefaultOptions(): WalletCreationOptions;
  validateSeed(seed: string): Promise<boolean>;
  getSupportedFeatures(): WalletFeature[];
}

/**
 * Wallet creation options
 */
export interface WalletCreationOptions {
  /**
   * BIP39 mnemonic seed (required)
   */
  seed: string;

  /**
   * Address index for HD wallet derivation (default: 0)
   */
  addressIndex?: number;

  /**
   * Optional passphrase for additional security
   */
  passphrase?: string;

  /**
   * Compressed public key format (UTXO chains only)
   */
  compressed?: boolean;

  /**
   * Custom label for the wallet
   */
  label?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Wallet import options
 */
export interface WalletImportOptions {
  /**
   * Import source type
   */
  type: WalletImportType;

  /**
   * Import data based on type
   */
  data: string;

  /**
   * Optional label for imported wallet
   */
  label?: string;

  /**
   * Validate imported wallet
   */
  validate?: boolean;
}

/**
 * Generated wallet information
 */
export interface WalletInfo {
  /**
   * Wallet address
   */
  address: string;

  /**
   * Private key (hex format)
   */
  privateKey: string;

  /**
   * Public key (hex format)
   */
  publicKey: string;

  /**
   * Full BIP44 derivation path used
   */
  derivationPath: string;

  /**
   * Address index in derivation path
   */
  addressIndex: number;

  /**
   * Chain information
   */
  chainName: string;
  chainType: string;
  networkId: string | number;

  /**
   * Wallet metadata
   */
  label?: string;
  compressed?: boolean;
  hasPassphrase: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Wallet address for bulk operations
 */
export interface WalletAddress {
  /**
   * Address string
   */
  address: string;

  /**
   * Private key (hex format)
   */
  privateKey: string;

  /**
   * Public key (hex format)
   */
  publicKey: string;

  /**
   * Derivation path used
   */
  derivationPath: string;

  /**
   * Address index
   */
  index: number;
}

/**
 * Address derivation options
 */
export interface AddressDerivationOptions {
  /**
   * BIP39 seed
   */
  seed: string;

  /**
   * Number of addresses to derive
   */
  count: number;

  /**
   * Starting index (default: 0)
   */
  startIndex?: number;

  /**
   * Compressed format (UTXO chains)
   */
  compressed?: boolean;

  /**
   * Optional passphrase
   */
  passphrase?: string;
}

/**
 * Batch wallet creation request
 */
export interface BatchWalletCreationRequest {
  /**
   * Unique identifier for this request
   */
  requestId: string;

  /**
   * Wallet creation options
   */
  options: WalletCreationOptions;
}

/**
 * Batch wallet creation result
 */
export interface WalletCreationResult {
  /**
   * Request identifier
   */
  requestId: string;

  /**
   * Creation success status
   */
  success: boolean;

  /**
   * Created wallet info (if successful)
   */
  wallet?: WalletInfo;

  /**
   * Error details (if failed)
   */
  error?: string;
}

/**
 * Wallet validation result
 */
export interface WalletValidationResult {
  /**
   * Overall validation status
   */
  valid: boolean;

  /**
   * Validation checks performed
   */
  checks: {
    addressFormat: boolean;
    privateKeyFormat: boolean;
    publicKeyMatch: boolean;
    derivationPathValid: boolean;
    chainCompatibility: boolean;
  };

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings
   */
  warnings: string[];
}

/**
 * Wallet import types
 */
export type WalletImportType =
  | 'private_key'      // Import from private key
  | 'mnemonic'         // Import from mnemonic
  | 'keystore'         // Import from keystore file
  | 'wif'              // Import from WIF format (Bitcoin)
  | 'extended_key';    // Import from extended key

/**
 * Wallet features supported by factory
 */
export type WalletFeature =
  | 'hd_wallets'       // Hierarchical deterministic wallets
  | 'compressed_keys'  // Compressed public keys
  | 'passphrase'       // BIP39 passphrase support
  | 'batch_creation'   // Batch wallet creation
  | 'import_export'    // Wallet import/export
  | 'validation'       // Wallet validation
  | 'metadata'         // Custom metadata support
  | 'multi_address';   // Multiple address derivation

/**
 * Factory configuration for adapters
 */
export interface WalletFactoryConfig {
  /**
   * Chain-specific configuration
   */
  chainName: string;
  chainType: string;
  networkId: string | number;

  /**
   * Default derivation path template (without index)
   * Example: "m/44'/60'/0'/0" for Ethereum
   */
  defaultDerivationPath: string;

  /**
   * BIP44 coin type for this chain
   */
  coinType: number;

  /**
   * Default options for wallet creation
   */
  defaultOptions: Partial<WalletCreationOptions>;

  /**
   * Supported features
   */
  supportedFeatures: WalletFeature[];

  /**
   * Validation rules
   */
  validation: {
    requireCompressed?: boolean;
    maxAddressIndex?: number;
    customRules?: ValidationRule[];
  };
}

/**
 * Custom validation rule
 */
export interface ValidationRule {
  name: string;
  description: string;
  validate: (wallet: WalletInfo) => boolean | Promise<boolean>;
}


/**
 * Abstract base class for wallet factories
 * Provides common functionality and enforces interface compliance
 */
export abstract class BaseWalletFactory implements IWalletFactory {
  protected config: WalletFactoryConfig;

  constructor(config: WalletFactoryConfig) {
    this.config = config;
  }

  // Interface properties
  get chainName(): string {
    return this.config.chainName;
  }

  get chainType(): string {
    return this.config.chainType;
  }

  get networkId(): string | number {
    return this.config.networkId;
  }

  // Abstract methods to be implemented by concrete classes
  abstract createWallet(options: WalletCreationOptions): Promise<WalletInfo>;
  abstract importWallet(options: WalletImportOptions): Promise<WalletInfo>;
  abstract generateAddressAtIndex(seed: string, index: number): Promise<WalletAddress>;

  // Default implementations that can be overridden
  async validateWallet(wallet: WalletInfo): Promise<WalletValidationResult> {
    const result: WalletValidationResult = {
      valid: true,
      checks: {
        addressFormat: true,
        privateKeyFormat: true,
        publicKeyMatch: true,
        derivationPathValid: true,
        chainCompatibility: true
      },
      errors: [],
      warnings: []
    };

    // Basic validation - can be extended by concrete classes
    if (!wallet.address || wallet.address.length === 0) {
      result.checks.addressFormat = false;
      result.errors.push('Invalid address format');
    }

    if (!wallet.privateKey || wallet.privateKey.length === 0) {
      result.checks.privateKeyFormat = false;
      result.errors.push('Invalid private key format');
    }

    if (wallet.chainName !== this.chainName) {
      result.checks.chainCompatibility = false;
      result.errors.push('Wallet not compatible with this chain');
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  async createWallets(requests: BatchWalletCreationRequest[]): Promise<WalletCreationResult[]> {
    const results: WalletCreationResult[] = [];

    for (const request of requests) {
      try {
        const wallet = await this.createWallet(request.options);
        results.push({
          requestId: request.requestId,
          success: true,
          wallet
        });
      } catch (error) {
        results.push({
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  async deriveAddresses(options: AddressDerivationOptions): Promise<WalletAddress[]> {
    const addresses: WalletAddress[] = [];
    const startIndex = options.startIndex || 0;

    for (let i = 0; i < options.count; i++) {
      const index = startIndex + i;
      const address = await this.generateAddressAtIndex(options.seed, index);
      addresses.push(address);
    }

    return addresses;
  }

  async validateSeed(seed: string): Promise<boolean> {
    // Basic seed validation - should be implemented by concrete classes
    return Boolean(seed && seed.trim().length > 0);
  }

  getDefaultOptions(): WalletCreationOptions {
    return {
      seed: '',
      addressIndex: 0,
      compressed: Boolean(this.config.validation.requireCompressed),
      ...this.config.defaultOptions
    };
  }

  getSupportedFeatures(): WalletFeature[] {
    return this.config.supportedFeatures;
  }

  // Protected utility methods
  protected buildDerivationPath(index: number): string {
    return `${this.config.defaultDerivationPath}/${index}`;
  }

  protected createWalletInfo(
    address: string,
    privateKey: string,
    publicKey: string,
    index: number,
    options: WalletCreationOptions
  ): WalletInfo {
    const result: WalletInfo = {
      address,
      privateKey,
      publicKey,
      derivationPath: this.buildDerivationPath(index),
      addressIndex: index,
      chainName: this.chainName,
      chainType: this.chainType,
      networkId: this.networkId,
      hasPassphrase: !!options.passphrase,
      createdAt: new Date()
    };

    if (options.label !== undefined) {
      result.label = options.label;
    }

    if (options.compressed !== undefined) {
      result.compressed = options.compressed;
    }

    if (options.metadata !== undefined) {
      result.metadata = options.metadata;
    }

    return result;
  }
}
