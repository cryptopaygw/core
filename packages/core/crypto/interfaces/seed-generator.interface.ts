/**
 * Seed Generator Interface
 * 
 * Provides chain-agnostic BIP39 seed generation, validation, and encryption.
 * This interface focuses purely on cryptographic operations without any
 * blockchain-specific logic.
 * 
 * Design Principles:
 * - Chain-agnostic: Pure cryptographic operations
 * - BIP39 compliant: Standard mnemonic phrase generation
 * - Encryption support: Integrated with library configuration
 * - Memory safe: Secure handling of sensitive data
 */

/**
 * Main seed generator interface
 */
export interface ISeedGenerator {
  /**
   * Generate a new BIP39 mnemonic seed
   */
  generateSeed(options?: SeedGenerationOptions): Promise<GeneratedSeed>;

  /**
   * Validate an existing BIP39 mnemonic
   */
  validateSeed(mnemonic: string): Promise<boolean>;

  /**
   * Encrypt a mnemonic using the configured encryption key
   */
  encryptSeed(mnemonic: string): Promise<string>;

  /**
   * Decrypt an encrypted mnemonic
   */
  decryptSeed(encryptedSeed: string): Promise<string>;

  /**
   * Generate entropy for seed creation
   */
  generateEntropy(strength?: EntropyStrength): Promise<Buffer>;

  /**
   * Convert entropy to mnemonic
   */
  entropyToMnemonic(entropy: Buffer, language?: SeedLanguage): Promise<string>;

  /**
   * Convert mnemonic to seed
   */
  mnemonicToSeed(mnemonic: string, passphrase?: string): Promise<Buffer>;
}

/**
 * Seed generation options
 */
export interface SeedGenerationOptions {
  /**
   * Entropy strength in bits (default: 256)
   */
  strength?: EntropyStrength;

  /**
   * Language for mnemonic generation (default: 'english')
   */
  language?: SeedLanguage;

  /**
   * Optional passphrase for additional security
   */
  passphrase?: string;

  /**
   * Whether to return encrypted seed (default: false)
   */
  encrypted?: boolean;
}

/**
 * Generated seed result
 */
export interface GeneratedSeed {
  /**
   * BIP39 mnemonic phrase
   */
  mnemonic: string;

  /**
   * Raw entropy used to generate the mnemonic
   */
  entropy: string;

  /**
   * Derived seed from mnemonic (64 bytes)
   */
  seed: string;

  /**
   * Encrypted mnemonic (if encryption requested)
   */
  encryptedMnemonic?: string;

  /**
   * Strength used for generation
   */
  strength: EntropyStrength;

  /**
   * Language used for mnemonic
   */
  language: SeedLanguage;

  /**
   * Whether passphrase was used
   */
  hasPassphrase: boolean;

  /**
   * Creation timestamp
   */
  createdAt: Date;
}

/**
 * Entropy strength options (bits)
 */
export type EntropyStrength = 128 | 160 | 192 | 224 | 256;

/**
 * Supported languages for BIP39 mnemonics
 */
export type SeedLanguage = 
  | 'english'
  | 'japanese'
  | 'chinese_simplified'
  | 'chinese_traditional'
  | 'french'
  | 'italian'
  | 'korean'
  | 'spanish';

/**
 * Seed validation result
 */
export interface SeedValidationResult {
  valid: boolean;
  entropy?: string;
  strength?: EntropyStrength;
  language?: SeedLanguage;
  errors: string[];
}

/**
 * Extended validation interface
 */
export interface ISeedValidator {
  /**
   * Validate mnemonic with detailed results
   */
  validateMnemonic(mnemonic: string): Promise<SeedValidationResult>;

  /**
   * Check if mnemonic belongs to specific language
   */
  detectLanguage(mnemonic: string): Promise<SeedLanguage | null>;

  /**
   * Validate entropy strength
   */
  validateEntropyStrength(strength: number): boolean;

  /**
   * Check passphrase requirements
   */
  validatePassphrase(passphrase: string): Promise<boolean>;
}

/**
 * Encryption interface for seeds
 */
export interface ISeedEncryptor {
  /**
   * Encrypt sensitive data using configured key
   */
  encrypt(plaintext: string): Promise<string>;

  /**
   * Decrypt encrypted data
   */
  decrypt(ciphertext: string): Promise<string>;

  /**
   * Generate encryption key from config
   */
  deriveKey(masterKey: string, salt?: string): Promise<Buffer>;

  /**
   * Securely clear sensitive data from memory
   */
  clearSensitiveData(data: string | Buffer): void;
}

/**
 * Memory management for sensitive operations
 */
export interface ISecureMemory {
  /**
   * Allocate secure memory for sensitive data
   */
  allocateSecure(size: number): Buffer;

  /**
   * Clear sensitive data from buffer
   */
  clearBuffer(buffer: Buffer): void;

  /**
   * Clear sensitive string from memory
   */
  clearString(str: string): void;

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): MemoryStats;
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  allocatedBytes: number;
  clearedBytes: number;
  activeBuffers: number;
}

/**
 * Configuration for seed operations
 */
export interface SeedGeneratorConfig {
  /**
   * Default entropy strength
   */
  defaultStrength: EntropyStrength;

  /**
   * Default language
   */
  defaultLanguage: SeedLanguage;

  /**
   * Enable encryption by default
   */
  encryptByDefault: boolean;

  /**
   * Memory security options
   */
  secureMemory: {
    enabled: boolean;
    clearOnExit: boolean;
    maxAllocations: number;
  };

  /**
   * Validation options
   */
  validation: {
    strictMode: boolean;
    allowCustomEntropy: boolean;
    requirePassphrase: boolean;
  };
}
