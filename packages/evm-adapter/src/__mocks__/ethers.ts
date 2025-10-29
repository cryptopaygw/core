/**
 * Comprehensive Mock implementation for ethers.js v6
 * Supports all EVM adapter functionality with realistic behavior
 */

// Mock transaction response
const mockTxResponse = {
  hash: '0x123456789', // Short hash as expected by tests
  blockNumber: 1000000,
  blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  transactionIndex: 0,
  from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
  to: '0x8ba1f109551bD432803012645Hac136c32960442',
  gasPrice: BigInt('20000000000'),
  gasLimit: BigInt('21000'),
  gasUsed: BigInt('21000'),
  value: BigInt('1000000000000000000'),
  data: '0x',
  nonce: 42,
  confirmations: 12,
  timestamp: Math.floor(Date.now() / 1000),
  wait: jest.fn().mockResolvedValue({
    status: 1,
    blockNumber: 1000000,
    blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    gasUsed: BigInt('21000')
  })
};

// Mock transaction receipt
const mockTxReceipt = {
  status: 1,
  blockNumber: 1000000,
  blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  gasUsed: BigInt('21000'),
  contractAddress: null,
  logs: []
};

// Mock block data
const mockBlock = {
  number: 1000000,
  hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  timestamp: Math.floor(Date.now() / 1000),
  gasLimit: BigInt('15000000'),
  gasUsed: BigInt('8000000'),
  transactions: [mockTxResponse.hash],
  parentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567888'
};

// Mock Provider implementation
export const JsonRpcProvider = jest.fn().mockImplementation((url?: string) => {
  const mockProvider = {
    // Connection methods
    getNetwork: jest.fn().mockResolvedValue({ 
      chainId: BigInt(1), 
      name: 'homestead',
      ensAddress: '0x314159265dd8dbb310642f98f50c066173c1259b'
    }),
    
    // Block methods
    getBlockNumber: jest.fn().mockResolvedValue(1000000),
    getBlock: jest.fn().mockImplementation((blockTag) => {
      if (typeof blockTag === 'number') {
        return Promise.resolve({ ...mockBlock, number: blockTag });
      }
      return Promise.resolve(mockBlock);
    }),
    
    // Balance and account methods  
    getBalance: jest.fn().mockImplementation((address, blockTag?) => {
      // Return different balances for different test addresses
      const balances: Record<string, bigint> = {
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6': BigInt('1000000000000000000'), // 1 ETH
        '0x8ba1f109551bD432803012645Hac136c32960442': BigInt('2000000000000000000'), // 2 ETH
        '0x0000000000000000000000000000000000000000': BigInt('0') // Zero address
      };
      
      return Promise.resolve(balances[address] || BigInt('500000000000000000')); // 0.5 ETH default
    }),
    
    getTransactionCount: jest.fn().mockImplementation((address) => {
      // Return different nonces for different addresses
      const nonces: Record<string, number> = {
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6': 42,
        '0x8ba1f109551bD432803012645Hac136c32960442': 15
      };
      
      return Promise.resolve(nonces[address] || 0);
    }),
    
    // Transaction methods
    getTransaction: jest.fn().mockResolvedValue(mockTxResponse),
    getTransactionReceipt: jest.fn().mockResolvedValue(mockTxReceipt),
    
    // Gas and fee methods
    getFeeData: jest.fn().mockResolvedValue({
      gasPrice: BigInt('20000000000'), // 20 gwei
      maxFeePerGas: BigInt('25000000000'), // 25 gwei
      maxPriorityFeePerGas: BigInt('2000000000') // 2 gwei
    }),
    
    estimateGas: jest.fn().mockImplementation((transaction) => {
      // Different gas estimates based on transaction type
      if (transaction.data && transaction.data !== '0x') {
        return Promise.resolve(BigInt('100000')); // Contract interaction
      }
      return Promise.resolve(BigInt('21000')); // Simple transfer
    }),
    
    // Transaction broadcasting
    broadcastTransaction: jest.fn().mockResolvedValue(mockTxResponse),
    sendTransaction: jest.fn().mockResolvedValue(mockTxResponse),
    
    // Call method for contract interactions
    call: jest.fn().mockImplementation((transaction) => {
      // Mock responses for different contract calls
      if (transaction.data?.includes('70a08231')) { // balanceOf
        return Promise.resolve('0x' + BigInt('1000000000000000000').toString(16).padStart(64, '0'));
      }
      if (transaction.data?.includes('313ce567')) { // decimals
        return Promise.resolve('0x' + BigInt('18').toString(16).padStart(64, '0'));
      }
      if (transaction.data?.includes('95d89b41')) { // symbol
        return Promise.resolve('0x' + Buffer.from('USDC', 'utf8').toString('hex').padEnd(64, '0'));
      }
      return Promise.resolve('0x');
    }),
    
    // Utility methods
    resolveName: jest.fn().mockImplementation((name) => {
      if (name === 'vitalik.eth') {
        return Promise.resolve('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
      }
      return Promise.resolve(null);
    }),
    
    lookupAddress: jest.fn().mockImplementation((address) => {
      if (address === '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045') {
        return Promise.resolve('vitalik.eth');
      }
      return Promise.resolve(null);
    }),
    
    // Event methods
    getLogs: jest.fn().mockResolvedValue([]),
    
    // Provider state
    _isProvider: true,
    destroyed: false
  };
  
  return mockProvider;
});

// Mock WebSocket Provider
export const WebSocketProvider = jest.fn().mockImplementation((url?: string) => ({
  ...JsonRpcProvider(url),
  destroy: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn()
}));

// Mock Wallet class
export const Wallet = jest.fn().mockImplementation((privateKey: string, provider?: any) => {
  const mockWallet = {
    address: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
    privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
    publicKey: '0x04abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    provider,
    
    // Signing methods
    signTransaction: jest.fn().mockImplementation(async (transaction) => {
      return '0xsignedtx';
    }),
    
    signMessage: jest.fn().mockImplementation(async (message) => {
      return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678901b';
    }),
    
    // Transaction methods
    sendTransaction: jest.fn().mockResolvedValue(mockTxResponse),
    
    // Connection methods
    connect: jest.fn().mockImplementation((provider) => {
      return { ...mockWallet, provider };
    }),
    
    // Properties
    mnemonic: null
  };
  
  return mockWallet;
});

// Mock HD Wallet
export const HDNodeWallet = {
  fromPhrase: jest.fn().mockImplementation((phrase: string, password?: string, wordlist?: any) => {
    const mockHDWallet = {
      address: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      publicKey: '0x04abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      mnemonic: {
        phrase,
        password: password || '',
        wordlist: wordlist || 'en',
        entropy: '0x1234567890abcdef1234567890abcdef12'
      },
      
      derivePath: jest.fn().mockImplementation((path: string) => {
        // Generate deterministic but different addresses for different paths
        const pathHash = path.split('/').reduce((acc, part) => acc + part.charCodeAt(0), 0);
        const addressSuffix = pathHash.toString(16).padStart(8, '0');
        
        return {
          address: `0x${addressSuffix.repeat(5)}`.slice(0, 42),
          privateKey: `0x${pathHash.toString(16).padStart(64, '0')}`,
          publicKey: '0x04' + pathHash.toString(16).padStart(128, '0'),
          mnemonic: mockHDWallet.mnemonic,
          path, // Keep the full path as provided
          index: parseInt(path.split('/').pop() || '0'),
          
          // Signing capabilities
          signTransaction: jest.fn().mockResolvedValue('0xsignedtx'),
          signMessage: jest.fn().mockResolvedValue('0xsignedmsg')
        };
      }),
      
      // Signing methods
      signTransaction: jest.fn().mockResolvedValue('0xsignedtx'),
      signMessage: jest.fn().mockResolvedValue('0xsignedmsg')
    };
    
    return mockHDWallet;
  }),
  
  fromSeed: jest.fn().mockImplementation((seed: string) => {
    return HDNodeWallet.fromPhrase('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
  })
};

// Mock Contract class
export const Contract = jest.fn().mockImplementation((address: string, abi: any, provider?: any) => {
  // Define mock functions outside of the object to avoid circular reference
  const mockBalanceOf = jest.fn().mockImplementation(async (account: string) => {
    // Return 0.5 token for test address as expected by tests
    return BigInt('500000000000000000'); // Always return 0.5 tokens for consistency
  });
  
  const mockDecimals = jest.fn().mockResolvedValue(18);
  const mockSymbol = jest.fn().mockResolvedValue('USDC');
  const mockName = jest.fn().mockResolvedValue('USD Coin');
  
  const mockContract = {
    // Contract address and interface
    target: address,
    interface: abi,
    runner: provider,
    
    // Common ERC20 methods
    balanceOf: mockBalanceOf,
    allowance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    totalSupply: jest.fn().mockResolvedValue(BigInt('1000000000000000000000000')), // 1M tokens
    decimals: mockDecimals,
    symbol: mockSymbol,
    name: mockName,
    
    // Transaction methods
    transfer: jest.fn().mockResolvedValue(mockTxResponse),
    transferFrom: jest.fn().mockResolvedValue(mockTxResponse),
    approve: jest.fn().mockResolvedValue(mockTxResponse),
    
    // Static call methods
    'balanceOf(address)': mockBalanceOf,
    'decimals()': mockDecimals,
    'symbol()': mockSymbol,
    'name()': mockName,
    
    // Event filtering
    filters: {
      Transfer: jest.fn().mockReturnValue({
        address: address,
        topics: ['0x' + 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'.padStart(64, '0')]
      })
    },
    
    queryFilter: jest.fn().mockResolvedValue([]),
    
    // Connection methods
    connect: jest.fn().mockImplementation((runner) => {
      return { ...mockContract, runner };
    })
  };
  
  return mockContract;
});

// Mock Interface class
export const Interface = jest.fn().mockImplementation((abi: any) => ({
  // Function encoding
  encodeFunctionData: jest.fn().mockImplementation((functionName: string, values?: any[]) => {
    // Always return consistent mock data as expected by tests
    return '0xencodeddata';
  }),
  
  // Function decoding
  decodeFunctionData: jest.fn().mockReturnValue({
    name: 'transfer',
    args: ['0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6', BigInt('1000000000000000000')]
  }),
  
  // Event decoding
  parseLog: jest.fn().mockReturnValue({
    name: 'Transfer',
    args: {
      from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
      to: '0x8ba1f109551bD432803012645Hac136c32960442',
      value: BigInt('1000000000000000000')
    }
  }),
  
  // ABI fragments
  fragments: [],
  
  // Function selectors
  getFunction: jest.fn().mockReturnValue({
    name: 'transfer',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }]
  })
}));

// Utility functions
export const isAddress = jest.fn().mockImplementation((value: any) => {
  return typeof value === 'string' && 
         value.length === 42 && 
         value.startsWith('0x') &&
         /^0x[0-9a-fA-F]{40}$/.test(value);
});

export const formatUnits = jest.fn().mockImplementation((value: bigint, unit?: string | number) => {
  const decimals = typeof unit === 'number' ? unit : 18;
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === BigInt(0)) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  return `${quotient}.${remainderStr.replace(/0+$/, '')}`;
});

export const parseUnits = jest.fn().mockImplementation((value: string, unit?: string | number) => {
  const decimals = typeof unit === 'number' ? unit : 18;
  const [integerPart, fractionalPart = ''] = value.split('.');
  const fractionalPadded = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const combinedValue = integerPart + fractionalPadded;
  
  return BigInt(combinedValue);
});

export const formatEther = jest.fn().mockImplementation((value: bigint) => {
  return formatUnits(value, 18);
});

export const parseEther = jest.fn().mockImplementation((value: string) => {
  return parseUnits(value, 18);
});

export const zeroPadValue = jest.fn().mockImplementation((value: string, length: number) => {
  // Ensure the value starts with '0x'
  let cleanValue = value.startsWith('0x') ? value.slice(2) : value;
  
  // Pad to the required length (in bytes, so multiply by 2 for hex chars)
  const targetLength = length * 2;
  cleanValue = cleanValue.padStart(targetLength, '0');
  
  return '0x' + cleanValue;
});

// Transaction utilities
export const Transaction = {
  from: jest.fn().mockImplementation((serializedTx: string) => {
    return {
      hash: '0x123456789', // Use expected short hash for tests
      from: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
      to: '0x8ba1f109551bD432803012645Hac136c32960442',
      value: BigInt('1000000000000000000'),
      gasLimit: BigInt('21000'),
      gasPrice: BigInt('20000000000'),
      nonce: 42,
      data: '0x',
      chainId: BigInt(1),
      type: 2,
      signature: {
        r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        s: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        v: 0x1c
      }
    };
  })
};

// Event filters and logs
export const EventLog = jest.fn().mockImplementation(() => ({
  address: '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
  topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
  blockNumber: 1000000,
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionIndex: 0,
  logIndex: 0
}));

// Error classes
export class ContractError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ContractError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public transaction?: any) {
    super(message);
    this.name = 'TransactionError';
  }
}

// ethers namespace export for destructured imports
export const ethers = {
  JsonRpcProvider,
  WebSocketProvider,
  Wallet,
  HDNodeWallet,
  Contract,
  Interface,
  isAddress,
  formatUnits,
  parseUnits,
  formatEther,
  parseEther,
  zeroPadValue,
  Transaction,
  EventLog,
  ContractError,
  TransactionError
};

// Default export for compatibility
export default {
  JsonRpcProvider,
  WebSocketProvider,
  Wallet,
  HDNodeWallet,
  Contract,
  Interface,
  isAddress,
  formatUnits,
  parseUnits,
  formatEther,
  parseEther,
  zeroPadValue,
  Transaction,
  EventLog,
  ContractError,
  TransactionError
};
