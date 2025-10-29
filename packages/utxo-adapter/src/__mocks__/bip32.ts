/**
 * Mock implementation of bip32 for testing
 */

interface MockHDNode {
  privateKey: Buffer | null;
  publicKey: Buffer;
  chainCode: Buffer;
  depth: number;
  index: number;
  parentFingerprint: number;
  derivePath(path: string): MockHDNode;
  derive(index: number): MockHDNode;
  deriveHardened(index: number): MockHDNode;
  toBase58(): string;
  toWIF(): string;
}

class MockBIP32Node implements MockHDNode {
  public privateKey: Buffer | null;
  public publicKey: Buffer;
  public chainCode: Buffer;
  public depth: number;
  public index: number;
  public parentFingerprint: number;

  constructor(
    privateKey: Buffer | null = null,
    publicKey: Buffer = Buffer.from('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 'hex'),
    chainCode: Buffer = Buffer.from('873DFF81C02F525623FD1FE5167EAC3A55A049DE3D314BB42EE227FFED37D508', 'hex'),
    depth: number = 0,
    index: number = 0,
    parentFingerprint: number = 0
  ) {
    this.privateKey = privateKey || Buffer.from('1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF', 'hex');
    this.publicKey = publicKey;
    this.chainCode = chainCode;
    this.depth = depth;
    this.index = index;
    this.parentFingerprint = parentFingerprint;
  }

  derivePath(path: string): MockHDNode {
    // Parse derivation path like "m/44'/0'/0'/0/5"
    const parts = path.split('/').slice(1); // Remove 'm'
    let node: MockHDNode = this;
    
    parts.forEach((part, i) => {
      const hardened = part.includes("'");
      const index = parseInt(part.replace("'", ''));
      
      // Generate deterministic but different keys for different paths
      const pathHash = this.hashPath(path + i.toString());
      const privateKey = Buffer.from(pathHash.slice(0, 64), 'hex');
      
      node = new MockBIP32Node(
        privateKey,
        Buffer.from('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 'hex'),
        Buffer.from('873DFF81C02F525623FD1FE5167EAC3A55A049DE3D314BB42EE227FFED37D508', 'hex'),
        i + 1,
        index,
        0
      );
    });
    
    return node;
  }

  derive(index: number): MockHDNode {
    const pathHash = this.hashPath(`derive_${index}`);
    const privateKey = Buffer.from(pathHash.slice(0, 64), 'hex');
    
    return new MockBIP32Node(
      privateKey,
      this.publicKey,
      this.chainCode,
      this.depth + 1,
      index,
      this.parentFingerprint
    );
  }

  deriveHardened(index: number): MockHDNode {
    return this.derive(index + 0x80000000);
  }

  private hashPath(path: string): string {
    // Simple deterministic hash for testing
    let hash = '';
    for (let i = 0; i < path.length; i++) {
      hash += path.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hash.padEnd(64, '0').slice(0, 64);
  }

  toBase58(): string {
    return 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi';
  }

  toWIF(): string {
    return 'L4rK1yDtCWekvXuE6oXD9jCYfFNV2cWRpVuPLBcCU2z8TrisoyY1';
  }
}

// Mock bip32 exports
export const fromSeed = jest.fn().mockImplementation((seed: Buffer, network?: any): MockHDNode => {
  return new MockBIP32Node();
});

export const fromBase58 = jest.fn().mockImplementation((base58: string, network?: any): MockHDNode => {
  return new MockBIP32Node();
});

export const fromPrivateKey = jest.fn().mockImplementation(
  (privateKey: Buffer, chainCode: Buffer, network?: any): MockHDNode => {
    return new MockBIP32Node(privateKey, undefined, chainCode);
  }
);

export const fromPublicKey = jest.fn().mockImplementation(
  (publicKey: Buffer, chainCode: Buffer, network?: any): MockHDNode => {
    return new MockBIP32Node(null, publicKey, chainCode);
  }
);

// Mock BIP32Factory function
export const BIP32Factory = jest.fn().mockImplementation((ecc: any) => {
  return {
    fromSeed,
    fromBase58,
    fromPrivateKey,
    fromPublicKey
  };
});

// Default export
export default {
  fromSeed,
  fromBase58,
  fromPrivateKey,
  fromPublicKey,
  BIP32Factory
};

// BIP32Interface type for compatibility
export interface BIP32Interface extends MockHDNode {}
