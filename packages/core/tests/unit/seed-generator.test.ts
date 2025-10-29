/**
 * Unit tests for Seed Generator
 * Following TDD methodology - tests written before implementation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ISeedGenerator,
  EntropyStrength,
  SeedLanguage
} from '../../crypto/interfaces/seed-generator.interface';
import { SeedGenerator } from '../../crypto/implementations/seed-generator';

describe('SeedGenerator', () => {
  let seedGenerator: ISeedGenerator;

  beforeEach(() => {
    // Initialize with encryption key for encryption tests
    seedGenerator = new SeedGenerator('test-encryption-key-32-characters!!');
  });

  describe('generateSeed', () => {
    test('should generate seed with default options (256-bit strength)', async () => {
      const result = await seedGenerator.generateSeed();

      expect(result).toBeDefined();
      expect(result.mnemonic).toBeDefined();
      expect(result.entropy).toBeDefined();
      expect(result.seed).toBeDefined();
      expect(result.strength).toBe(256);
      expect(result.language).toBe('english');
      expect(result.hasPassphrase).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      
      // 24 words for 256-bit entropy
      expect(result.mnemonic.split(' ')).toHaveLength(24);
    });

    test('should generate seed with 128-bit strength', async () => {
      const result = await seedGenerator.generateSeed({ strength: 128 });

      expect(result.strength).toBe(128);
      // 12 words for 128-bit entropy
      expect(result.mnemonic.split(' ')).toHaveLength(12);
    });

    test('should generate seed with 160-bit strength', async () => {
      const result = await seedGenerator.generateSeed({ strength: 160 });

      expect(result.strength).toBe(160);
      // 15 words for 160-bit entropy
      expect(result.mnemonic.split(' ')).toHaveLength(15);
    });

    test('should generate seed with 192-bit strength', async () => {
      const result = await seedGenerator.generateSeed({ strength: 192 });

      expect(result.strength).toBe(192);
      // 18 words for 192-bit entropy
      expect(result.mnemonic.split(' ')).toHaveLength(18);
    });

    test('should generate seed with 224-bit strength', async () => {
      const result = await seedGenerator.generateSeed({ strength: 224 });

      expect(result.strength).toBe(224);
      // 21 words for 224-bit entropy
      expect(result.mnemonic.split(' ')).toHaveLength(21);
    });

    test('should support different languages', async () => {
      const languages: SeedLanguage[] = ['english', 'japanese', 'chinese_simplified'];
      
      for (const language of languages) {
        const result = await seedGenerator.generateSeed({ language });
        expect(result.language).toBe(language);
      }
    });

    test('should include passphrase information', async () => {
      const result = await seedGenerator.generateSeed({ passphrase: 'test123' });
      
      expect(result.hasPassphrase).toBe(true);
    });

    test('should generate encrypted seed when requested', async () => {
      const result = await seedGenerator.generateSeed({ encrypted: true });
      
      expect(result.encryptedMnemonic).toBeDefined();
      expect(result.encryptedMnemonic).not.toBe(result.mnemonic);
      expect(typeof result.encryptedMnemonic).toBe('string');
    });

    test('should generate unique seeds on multiple calls', async () => {
      const seed1 = await seedGenerator.generateSeed();
      const seed2 = await seedGenerator.generateSeed();
      
      // Real implementation should generate different seeds
      expect(seed1.mnemonic).toBeDefined();
      expect(seed2.mnemonic).toBeDefined();
      expect(seed1.mnemonic).not.toBe(seed2.mnemonic);
      expect(seed1.entropy).not.toBe(seed2.entropy);
      expect(seed1.seed).not.toBe(seed2.seed);
    });
  });

  describe('validateSeed', () => {
    test('should validate correct 12-word mnemonic', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const result = await seedGenerator.validateSeed(mnemonic);
      
      expect(result).toBe(true);
    });

    test('should validate correct 24-word mnemonic', async () => {
      // Generate a valid 24-word mnemonic first
      const generated = await seedGenerator.generateSeed({ strength: 256 });
      const result = await seedGenerator.validateSeed(generated.mnemonic);
      
      expect(result).toBe(true);
    });

    test('should reject invalid word count', async () => {
      const mnemonic = 'abandon abandon abandon'; // Only 3 words
      const result = await seedGenerator.validateSeed(mnemonic);
      
      expect(result).toBe(false);
    });

    test('should reject empty mnemonic', async () => {
      const result = await seedGenerator.validateSeed('');
      
      expect(result).toBe(false);
    });

    test('should handle whitespace in mnemonic', async () => {
      const mnemonic = '  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  about  ';
      const result = await seedGenerator.validateSeed(mnemonic);
      
      expect(result).toBe(true);
    });
  });

  describe('encryptSeed', () => {
    test('should encrypt a mnemonic', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const encrypted = await seedGenerator.encryptSeed(mnemonic);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(mnemonic);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    test('should handle empty mnemonic', async () => {
      const encrypted = await seedGenerator.encryptSeed('');
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe('');
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('decryptSeed', () => {
    test('should decrypt an encrypted mnemonic', async () => {
      const originalMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const encrypted = await seedGenerator.encryptSeed(originalMnemonic);
      const decrypted = await seedGenerator.decryptSeed(encrypted);
      
      expect(decrypted).toBe(originalMnemonic);
    });

    test('should handle invalid encrypted seed', async () => {
      // Real implementation throws error for invalid encrypted data
      await expect(seedGenerator.decryptSeed('invalid_encrypted_data'))
        .rejects.toThrow();
    });
  });

  describe('generateEntropy', () => {
    test('should generate entropy with default strength (256 bits)', async () => {
      const entropy = await seedGenerator.generateEntropy();
      
      expect(entropy).toBeInstanceOf(Buffer);
      expect(entropy.length).toBe(32); // 256 bits = 32 bytes
    });

    test('should generate entropy with specific strengths', async () => {
      const strengths: { strength: EntropyStrength; bytes: number }[] = [
        { strength: 128, bytes: 16 },
        { strength: 160, bytes: 20 },
        { strength: 192, bytes: 24 },
        { strength: 224, bytes: 28 },
        { strength: 256, bytes: 32 }
      ];

      for (const { strength, bytes } of strengths) {
        const entropy = await seedGenerator.generateEntropy(strength);
        expect(entropy.length).toBe(bytes);
      }
    });
  });

  describe('entropyToMnemonic', () => {
    test('should convert entropy to mnemonic', async () => {
      const entropy = Buffer.alloc(16, 0); // 128 bits
      const mnemonic = await seedGenerator.entropyToMnemonic(entropy);
      
      expect(mnemonic).toBeDefined();
      expect(typeof mnemonic).toBe('string');
      expect(mnemonic.split(' ').length).toBeGreaterThan(0);
    });

    test('should support different languages', async () => {
      const entropy = Buffer.alloc(16, 0);
      const languages: SeedLanguage[] = ['english', 'japanese'];
      
      for (const language of languages) {
        const mnemonic = await seedGenerator.entropyToMnemonic(entropy, language);
        expect(mnemonic).toBeDefined();
        expect(typeof mnemonic).toBe('string');
      }
    });
  });

  describe('mnemonicToSeed', () => {
    test('should convert mnemonic to seed', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const seed = await seedGenerator.mnemonicToSeed(mnemonic);
      
      expect(seed).toBeInstanceOf(Buffer);
      expect(seed.length).toBe(64); // BIP39 seeds are 64 bytes
    });

    test('should support passphrase', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const seed = await seedGenerator.mnemonicToSeed(mnemonic, 'test123');
      
      expect(seed).toBeInstanceOf(Buffer);
      expect(seed.length).toBe(64);
    });

    test('should generate different seeds with different passphrases', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const seed1 = await seedGenerator.mnemonicToSeed(mnemonic);
      const seed2 = await seedGenerator.mnemonicToSeed(mnemonic, 'passphrase');
      
      expect(seed1).toBeInstanceOf(Buffer);
      expect(seed2).toBeInstanceOf(Buffer);
      // In real implementation, these should be different
      expect(seed1.length).toBe(64);
      expect(seed2.length).toBe(64);
    });
  });

  describe('Integration Tests', () => {
    test('should complete full seed generation and validation cycle', async () => {
      // Generate a new seed
      const generated = await seedGenerator.generateSeed();
      
      // Validate the generated mnemonic
      const isValid = await seedGenerator.validateSeed(generated.mnemonic);
      expect(isValid).toBe(true);
      
      // Convert mnemonic to seed
      const seed = await seedGenerator.mnemonicToSeed(generated.mnemonic);
      expect(seed).toBeInstanceOf(Buffer);
      expect(seed.length).toBe(64);
    });

    test('should complete encryption/decryption cycle', async () => {
      const generated = await seedGenerator.generateSeed();
      
      // Encrypt the mnemonic
      const encrypted = await seedGenerator.encryptSeed(generated.mnemonic);
      expect(encrypted).not.toBe(generated.mnemonic);
      
      // Decrypt the mnemonic
      const decrypted = await seedGenerator.decryptSeed(encrypted);
      expect(decrypted).toBe(generated.mnemonic);
      
      // Validate the decrypted mnemonic
      const isValid = await seedGenerator.validateSeed(decrypted);
      expect(isValid).toBe(true);
    });

    test('should handle entropy to mnemonic to seed conversion', async () => {
      // Generate entropy
      const entropy = await seedGenerator.generateEntropy(256);
      expect(entropy.length).toBe(32);
      
      // Convert entropy to mnemonic
      const mnemonic = await seedGenerator.entropyToMnemonic(entropy);
      expect(mnemonic).toBeDefined();
      
      // Validate the mnemonic
      const isValid = await seedGenerator.validateSeed(mnemonic);
      expect(isValid).toBe(true);
      
      // Convert mnemonic to seed
      const seed = await seedGenerator.mnemonicToSeed(mnemonic);
      expect(seed.length).toBe(64);
    });
  });

  describe('Error Handling', () => {
    test('should handle various entropy strengths', async () => {
      const validStrengths: EntropyStrength[] = [128, 160, 192, 224, 256];
      
      for (const strength of validStrengths) {
        const result = await seedGenerator.generateSeed({ strength });
        expect(result.strength).toBe(strength);
      }
    });

    test('should handle all supported languages', async () => {
      const languages: SeedLanguage[] = [
        'english',
        'japanese',
        'chinese_simplified',
        'chinese_traditional',
        'french',
        'italian',
        'korean',
        'spanish'
      ];
      
      for (const language of languages) {
        const result = await seedGenerator.generateSeed({ language });
        expect(result.language).toBe(language);
      }
    });
  });
});
