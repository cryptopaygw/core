/**
 * Hardhat Network Integration Tests
 * 
 * These tests run against a local Hardhat network with forked mainnet state,
 * providing realistic blockchain testing without requiring testnet tokens
 * or dealing with network latency issues.
 * 
 * Test scenarios:
 * - Contract deployment and interaction
 * - Real ERC-20 token operations
 * - Gas estimation accuracy
 * - Transaction broadcasting and confirmation
 * - Multi-block operations
 */

import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { spawn, ChildProcess } from 'child_process';
import { ethers } from 'ethers';

describe('Hardhat Network Integration Tests', () => {
  let hardhatProcess: ChildProcess;
  let adapter: any;
  
  // Test configuration
  const HARDHAT_RPC_URL = 'http://localhost:8545';
  const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
  const USDC_ADDRESS = '0xA0b86a33E6417c3db73Ae30b50c2c6E8f9F8C52c'; // Real USDC on mainnet
  const WHALE_ADDRESS = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'; // Known USDC whale
  
  // Test accounts that will be funded
  const TEST_ACCOUNTS = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat account #0
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat account #1
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'  // Hardhat account #2
  ];

  beforeAll(async () => {
    console.log('🚀 Starting Hardhat network for integration tests...');
    
    // Start Hardhat network in fork mode
    hardhatProcess = spawn('npx', [
      'hardhat', 
      'node', 
      '--fork', 
      'https://eth-mainnet.alchemyapi.io/v2/demo',
      '--hostname', 
      '0.0.0.0'
    ], {
      cwd: './packages/evm-adapter',
      stdio: 'pipe'
    });

    // Wait for network to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Hardhat network failed to start within 30 seconds'));
      }, 30000);

      hardhatProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('Hardhat:', output);
        
        if (output.includes('Started HTTP and WebSocket JSON-RPC server')) {
          clearTimeout(timeout);
          resolve(void 0);
        }
      });

      hardhatProcess.stderr?.on('data', (data) => {
        console.error('Hardhat Error:', data.toString());
      });
    });

    // Wait a bit more to ensure network is fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create adapter for local network
    adapter = EVMAdapterFactory.createCustom({
      name: 'hardhat-local',
      chainId: 31337, // Hardhat default chain ID
      rpcUrl: HARDHAT_RPC_URL,
      nativeTokenSymbol: 'ETH'
    });

    await adapter.connect();
    
    console.log('✅ Hardhat network ready and adapter connected');
  }, 45000);

  afterAll(async () => {
    if (adapter) {
      await adapter.disconnect();
    }
    
    if (hardhatProcess) {
      console.log('🔥 Stopping Hardhat network...');
      hardhatProcess.kill();
      
      // Wait for process to exit
      await new Promise((resolve) => {
        hardhatProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // Force exit after 5 seconds
      });
    }
  });

  describe('Network Connection & Basic Operations', () => {
    test('should connect to Hardhat network successfully', async () => {
      expect(adapter.isConnected()).toBe(true);
      
      const status = await adapter.getConnectionStatus();
      expect(status.connected).toBe(true);
      expect(status.networkId).toBe(31337);
      expect(status.blockHeight).toBeGreaterThan(0);
    });

    test('should get network information', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      const network = await provider.getNetwork();
      
      expect(Number(network.chainId)).toBe(31337);
      expect(network.name).toBe('unknown'); // Hardhat doesn't set a name
    });

    test('should have pre-funded test accounts', async () => {
      for (const account of TEST_ACCOUNTS) {
        const balance = await adapter.getBalance(account);
        
        // Hardhat accounts should have 10000 ETH by default
        expect(parseFloat(balance.balance)).toBeGreaterThan(1e21); // More than 1000 ETH
      }
    });
  });

  describe('Real Contract Interactions', () => {
    test('should interact with real USDC contract', async () => {
      // Get USDC contract info
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)',
          'function balanceOf(address) view returns (uint256)'
        ],
        provider
      );

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        usdcContract.name(),
        usdcContract.symbol(),
        usdcContract.decimals(),
        usdcContract.totalSupply()
      ]);

      expect(name).toBe('USD Coin');
      expect(symbol).toBe('USDC');
      expect(decimals).toBe(6);
      expect(totalSupply).toBeGreaterThan(0);
    });

    test('should get real USDC balance for whale address', async () => {
      const tokenBalance = await adapter.getTokenBalance(WHALE_ADDRESS, USDC_ADDRESS);
      
      expect(tokenBalance.tokenSymbol).toBe('USDC');
      expect(tokenBalance.tokenDecimals).toBe(6);
      expect(parseFloat(tokenBalance.balance)).toBeGreaterThan(0);
      expect(tokenBalance.tokenAddress.toLowerCase()).toBe(USDC_ADDRESS.toLowerCase());
    });

    test('should handle contract call failures gracefully', async () => {
      // Try to get balance for a non-existent token contract
      const fakeTokenAddress = '0x1234567890123456789012345678901234567890';
      
      await expect(
        adapter.getTokenBalance(TEST_ACCOUNTS[0], fakeTokenAddress)
      ).rejects.toThrow();
    });
  });

  describe('Transaction Operations', () => {
    test('should estimate gas for native ETH transfer', async () => {
      const transaction = await adapter.createTransaction({
        from: TEST_ACCOUNTS[0],
        to: TEST_ACCOUNTS[1],
        amount: '1000000000000000000' // 1 ETH
      });

      expect(transaction.gasLimit).toBe('21000'); // Standard ETH transfer
      expect(parseFloat(transaction.gasPrice || '0')).toBeGreaterThan(0);
    });

    test('should create and broadcast native ETH transaction', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      const signer = await provider.getSigner(TEST_ACCOUNTS[0]);
      
      // Get initial balances
      const initialBalance0 = await adapter.getBalance(TEST_ACCOUNTS[0]);
      const initialBalance1 = await adapter.getBalance(TEST_ACCOUNTS[1]);

      // Create transaction
      const transaction = await adapter.createTransaction({
        from: TEST_ACCOUNTS[0],
        to: TEST_ACCOUNTS[1],
        amount: '1000000000000000000' // 1 ETH
      });

      // Sign transaction using ethers directly (simulating private key signing)
      const txRequest = {
        to: transaction.to,
        value: transaction.amount,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice
      };

      const signedTx = await signer.signTransaction(txRequest);
      
      // Broadcast using adapter
      const txHash = await adapter.broadcastTransaction({
        ...transaction,
        signature: 'mock-signature',
        signedRawTransaction: signedTx,
        txid: 'will-be-overwritten'
      });

      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Wait for transaction to be mined
      await provider.waitForTransaction(txHash);

      // Check balances changed
      const finalBalance0 = await adapter.getBalance(TEST_ACCOUNTS[0]);
      const finalBalance1 = await adapter.getBalance(TEST_ACCOUNTS[1]);

      expect(parseFloat(finalBalance1.balance)).toBeGreaterThan(
        parseFloat(initialBalance1.balance)
      );
    });

    test('should handle USDC transfer (impersonation)', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      
      // Impersonate USDC whale account for testing
      await provider.send('hardhat_impersonateAccount', [WHALE_ADDRESS]);
      
      const whaleSigner = await provider.getSigner(WHALE_ADDRESS);
      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        whaleSigner
      );

      // Get initial USDC balance of test account
      const initialBalance = await adapter.getTokenBalance(TEST_ACCOUNTS[0], USDC_ADDRESS);

      // Transfer 100 USDC to test account
      const transferAmount = ethers.parseUnits('100', 6); // 100 USDC (6 decimals)
      const tx = await usdcContract.transfer(TEST_ACCOUNTS[0], transferAmount);
      await tx.wait();

      // Check balance increased
      const finalBalance = await adapter.getTokenBalance(TEST_ACCOUNTS[0], USDC_ADDRESS);
      
      expect(parseFloat(finalBalance.balance)).toBeGreaterThan(
        parseFloat(initialBalance.balance)
      );

      await provider.send('hardhat_stopImpersonatingAccount', [WHALE_ADDRESS]);
    });
  });

  describe('Multi-Block Operations', () => {
    test('should handle balance queries across different blocks', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      
      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      
      // Get balance at current block
      const currentBalance = await adapter.getBalance(TEST_ACCOUNTS[0], {
        blockHeight: currentBlock
      });

      // Get balance at previous block
      const previousBalance = await adapter.getBalance(TEST_ACCOUNTS[0], {
        blockHeight: currentBlock - 1
      });

      // Both should be valid balance responses
      expect(currentBalance.blockHeight).toBe(currentBlock);
      expect(previousBalance.blockHeight).toBe(currentBlock - 1);
      expect(parseFloat(currentBalance.balance)).toBeGreaterThan(0);
      expect(parseFloat(previousBalance.balance)).toBeGreaterThan(0);
    });

    test('should mine new blocks with transactions', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      
      const initialBlock = await provider.getBlockNumber();
      
      // Send a transaction to trigger block mining
      const signer = await provider.getSigner(TEST_ACCOUNTS[0]);
      const tx = await signer.sendTransaction({
        to: TEST_ACCOUNTS[1],
        value: ethers.parseEther('0.1')
      });

      await tx.wait();

      const finalBlock = await provider.getBlockNumber();
      
      // Block number should increase
      expect(finalBlock).toBeGreaterThan(initialBlock);
    });
  });

  describe('Gas Estimation Accuracy', () => {
    test('should estimate gas accurately for different transaction types', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      
      // Simple ETH transfer
      const simpleTransfer = await provider.estimateGas({
        from: TEST_ACCOUNTS[0],
        to: TEST_ACCOUNTS[1],
        value: ethers.parseEther('1')
      });

      expect(simpleTransfer).toBe(BigInt(21000));

      // Contract interaction (USDC transfer)
      const usdcTransfer = await provider.estimateGas({
        from: WHALE_ADDRESS,
        to: USDC_ADDRESS,
        data: '0xa9059cbb' + // transfer function selector
              '000000000000000000000000' + TEST_ACCOUNTS[0].slice(2) + // to address
              '00000000000000000000000000000000000000000000000000000000000186a0' // 100000 (100 USDC with 6 decimals)
      });

      expect(usdcTransfer).toBeGreaterThan(BigInt(50000)); // Should be more than simple transfer
      expect(usdcTransfer).toBeLessThan(BigInt(100000)); // But reasonable
    });

    test('should get accurate fee data', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      const feeData = await provider.getFeeData();

      expect(feeData.gasPrice).toBeGreaterThan(BigInt(0));
      
      // For post-London fork networks, these should exist
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        expect(feeData.maxFeePerGas).toBeGreaterThan(BigInt(0));
        expect(feeData.maxPriorityFeePerGas).toBeGreaterThan(BigInt(0));
      }
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle insufficient balance gracefully', async () => {
      // Try to send more ETH than available (shouldn't work with our test accounts, but let's try a realistic scenario)
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      
      await expect(
        provider.estimateGas({
          from: TEST_ACCOUNTS[0],
          to: TEST_ACCOUNTS[1],
          value: ethers.parseEther('99999999') // Extremely large amount
        })
      ).rejects.toThrow();
    });

    test('should handle invalid addresses', async () => {
      await expect(
        adapter.getBalance('0xinvalid')
      ).rejects.toThrow('Invalid address format');
    });

    test('should handle network disconnection gracefully', async () => {
      const tempAdapter = EVMAdapterFactory.createCustom({
        name: 'test-disconnected',
        chainId: 31337,
        rpcUrl: 'http://localhost:9999', // Non-existent port
        nativeTokenSymbol: 'ETH'
      });

      await expect(tempAdapter.connect()).rejects.toThrow();
    });
  });

  describe('Performance with Real Network', () => {
    test('should handle concurrent balance queries efficiently', async () => {
      const startTime = Date.now();
      
      // Query balances for multiple accounts concurrently
      const balancePromises = TEST_ACCOUNTS.map(address => 
        adapter.getBalance(address)
      );

      const balances = await Promise.all(balancePromises);
      const duration = Date.now() - startTime;

      expect(balances).toHaveLength(TEST_ACCOUNTS.length);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      balances.forEach(balance => {
        expect(parseFloat(balance.balance)).toBeGreaterThan(0);
      });
    });

    test('should handle multiple token balance queries', async () => {
      // Query USDC balance for whale address
      const tokenBalances = await Promise.all([
        adapter.getTokenBalance(WHALE_ADDRESS, USDC_ADDRESS)
      ]);

      expect(tokenBalances[0].tokenSymbol).toBe('USDC');
      expect(parseFloat(tokenBalances[0].balance)).toBeGreaterThan(0);
    });
  });

  describe('Chain State Consistency', () => {
    test('should maintain consistent state across operations', async () => {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      
      // Get initial state
      const initialBlock = await provider.getBlockNumber();
      const initialBalance = await adapter.getBalance(TEST_ACCOUNTS[0]);

      // Perform operation
      const signer = await provider.getSigner(TEST_ACCOUNTS[0]);
      const tx = await signer.sendTransaction({
        to: TEST_ACCOUNTS[1],
        value: ethers.parseEther('0.1')
      });
      
      const receipt = await tx.wait();

      // Verify state changes
      const finalBlock = await provider.getBlockNumber();
      const finalBalance = await adapter.getBalance(TEST_ACCOUNTS[0]);

      expect(finalBlock).toBe(initialBlock + 1);
      expect(receipt?.blockNumber).toBe(finalBlock);
      expect(parseFloat(finalBalance.balance)).toBeLessThan(
        parseFloat(initialBalance.balance)
      );
    });
  });
});
