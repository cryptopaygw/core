/**
 * Mock implementation of bitcoinjs-lib for testing
 */

// Mock network configurations
export const networks = {
  bitcoin: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  testnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  },
  regtest: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  }
};

// Mock address utilities
export const address = {
  toOutputScript: jest.fn().mockImplementation((addr: string, network: any) => {
    // Mock Bitcoin address validation - specific test addresses
    const validTestAddresses = [
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // P2WPKH test address
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // P2PKH test address
      '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH test address
      'bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du' // P2TR test address
    ];
    
    // Explicit invalid addresses from tests
    const invalidTestAddresses = [
      'invalid',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN', // Truncated
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t', // Truncated
      '',
      '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6' // Ethereum address
    ];
    
    // Check invalid addresses first
    if (invalidTestAddresses.includes(addr)) {
      throw new Error('Invalid address');
    }
    
    // Check valid addresses
    if (validTestAddresses.includes(addr)) {
      return Buffer.from('mock-script');
    }
    
    // Fallback: use regex patterns for other addresses
    const validPatterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2PKH and P2SH
      /^bc1[a-z0-9]{39,59}$/, // P2WPKH and P2WSH
      /^bc1p[a-z0-9]{58}$/, // P2TR (Taproot)
      /^tb1[a-z0-9]{39,59}$/, // Testnet P2WPKH
      /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Testnet P2PKH and P2SH
    ];
    
    const isValid = validPatterns.some(pattern => pattern.test(addr));
    if (!isValid) {
      throw new Error('Invalid address');
    }
    
    return Buffer.from('mock-script');
  })
};

// Mock payment types
export const payments = {
  p2pkh: jest.fn().mockImplementation(({ pubkey, network }) => ({
    address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    output: Buffer.from('mock-p2pkh-output'),
    pubkey,
    network
  })),
  
  p2wpkh: jest.fn().mockImplementation(({ pubkey, network }) => ({
    address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    output: Buffer.from('mock-p2wpkh-output'),
    pubkey,
    network
  })),
  
  p2sh: jest.fn().mockImplementation(({ redeem, network }) => ({
    address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    output: Buffer.from('mock-p2sh-output'),
    redeem,
    network
  })),
  
  p2tr: jest.fn().mockImplementation(({ pubkey, network }) => ({
    address: 'bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du',
    output: Buffer.from('mock-p2tr-output'),
    pubkey,
    network
  }))
};

// Mock TransactionBuilder
export class TransactionBuilder {
  private inputs: any[] = [];
  private outputs: any[] = [];
  private network: any;

  constructor(network: any = networks.bitcoin) {
    this.network = network;
  }

  static fromTransaction = jest.fn().mockImplementation((tx: any, network: any) => {
    const builder = new TransactionBuilder(network);
    // Mock: copy transaction data
    return builder;
  });

  addInput = jest.fn().mockImplementation((txHash: string, vout: number) => {
    this.inputs.push({ txHash, vout });
    return this.inputs.length - 1;
  });

  addOutput = jest.fn().mockImplementation((address: string, value: number) => {
    this.outputs.push({ address, value });
    return this.outputs.length - 1;
  });

  sign = jest.fn().mockImplementation((
    vin: number, 
    keyPair: any, 
    redeemScript?: any, 
    hashType?: any, 
    witnessValue?: number
  ) => {
    // Mock signing - just return success
    return true;
  });

  build = jest.fn().mockImplementation(() => {
    return {
      getId: () => '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      toHex: () => '020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff'
    };
  });

  buildIncomplete = jest.fn().mockImplementation(() => {
    return {
      toHex: () => '020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff'
    };
  });
}

// Mock Transaction class
export class Transaction {
  static fromHex = jest.fn().mockImplementation((hex: string) => {
    return {
      version: 2,
      locktime: 0,
      ins: [],
      outs: [],
      getId: () => '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      toHex: () => hex
    };
  });

  getId(): string {
    return '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  }

  toHex(): string {
    return '020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff';
  }
}

// Mock ECPair
export const ECPair = {
  fromWIF: jest.fn().mockImplementation((wif: string, network: any) => ({
    publicKey: Buffer.from('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 'hex'),
    privateKey: Buffer.from('1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF', 'hex'),
    toWIF: () => wif,
    network
  })),
  
  fromPrivateKey: jest.fn().mockImplementation((privateKey: Buffer, options: any) => ({
    publicKey: Buffer.from('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 'hex'),
    privateKey,
    toWIF: () => 'L4rK1yDtCWekvXuE6oXD9jCYfFNV2cWRpVuPLBcCU2z8TrisoyY1',
    network: options?.network
  }))
};

export default {
  networks,
  address,
  payments,
  TransactionBuilder,
  Transaction,
  ECPair
};
