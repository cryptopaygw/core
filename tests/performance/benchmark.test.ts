/**
 * Performance Benchmark Tests
 * 
 * Comprehensive performance testing for the Crypto Payment Gateway library.
 * Tests various scenarios including bulk operations, concurrent processing,
 * memory usage, and scalability limits.
 * 
 * This suite validates:
 * - High-throughput wallet generation
 * - Concurrent balance queries
 * - Memory efficiency at scale
 * - Transaction processing speed
 * - Multi-chain performance characteristics
 */

import { performance } from 'perf_hooks';
import { EVMAdapterFactory } from '../../packages/evm-adapter/src/evm-chain-adapter';
import { UTXOAdapterFactory } from '../../packages/utxo-adapter/src/utxo-chain-adapter';

// Performance test configuration
const PERFORMANCE_CONFIG = {
  // Wallet generation benchmarks
  BULK_WALLET_COUNT: 1000,
  BULK_WALLET_BATCH_SIZE: 100,
  
  // Balance query benchmarks
  CONCURRENT_BALANCE_COUNT: 50,
  BALANCE_QUERY_TIMEOUT: 30000,
  
  // Memory usage thresholds (MB)
  MEMORY_LIMIT_SMALL: 50,
  MEMORY_LIMIT_LARGE: 200,
  
  // Performance thresholds (ms)
  WALLET_GENERATION_THRESHOLD: 100,
  BALANCE_QUERY_THRESHOLD: 5000,
  CONNECTION_THRESHOLD: 2000
};

describe('Performance Benchmark Tests', () => {
  let ethAdapter: any;
  let btcAdapter: any;
  
  const testSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  beforeAll(async () => {
    ethAdapter = EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/test');
    btcAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
  });

  afterAll(async () => {
    if (ethAdapter?.isConnected()) await ethAdapter.disconnect();
    if (btcAdapter?.isConnected()) await btcAdapter.disconnect();
  });

  // Utility functions for performance measurement
  const measureMemory = () => {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100
    };
  };

  const measurePerformance = async <T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number; memory: any }> => {
    const startMemory = measureMemory();
    const startTime = performance.now();
    
    const result = await operation();
    
    const endTime = performance.now();
    const endMemory = measureMemory();
    const duration = endTime - startTime;
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    console.log(`Memory - Start: ${startMemory.heapUsed}MB, End: ${endMemory.heapUsed}MB`);
    
    return { result, duration, memory: { start: startMemory, end: endMemory } };
  };

  describe('Wallet Generation Performance', () => {
    test('should generate single wallet within performance threshold', async () => {
      const { duration } = await measurePerformance(async () => {
        return await ethAdapter.generateAddress({
          seed: testSeed,
          index: 0
        });
      }, 'Single Wallet Generation');

      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
    });

    test('should handle bulk wallet generation efficiently', async () => {
      const walletCount = PERFORMANCE_CONFIG.BULK_WALLET_COUNT;
      
      const { result, duration, memory } = await measurePerformance(async () => {
        const wallets: any[] = [];
        
        for (let i = 0; i < walletCount; i++) {
          const wallet = await ethAdapter.generateAddress({
            seed: testSeed,
            index: i
          });
          wallets.push(wallet);
          
          // Periodic memory check
          if (i > 0 && i % 100 === 0) {
            const currentMemory = measureMemory();
            console.log(`Generated ${i} wallets, Memory: ${currentMemory.heapUsed}MB`);
          }
        }
        
        return wallets;
      }, `Bulk Wallet Generation (${walletCount} wallets)`);

      expect(result).toHaveLength(walletCount);
      expect(memory.end.heapUsed - memory.start.heapUsed).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_SMALL);
      
      // Performance should scale reasonably
      const avgTimePerWallet = duration / walletCount;
      expect(avgTimePerWallet).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
    });

    test('should handle batch address derivation efficiently', async () => {
      const { result, duration } = await measurePerformance(async () => {
        return await ethAdapter.deriveAddresses({
          seed: testSeed,
          count: PERFORMANCE_CONFIG.BULK_WALLET_BATCH_SIZE,
          startIndex: 0
        });
      }, `Batch Address Derivation (${PERFORMANCE_CONFIG.BULK_WALLET_BATCH_SIZE} addresses)`);

      expect(result).toHaveLength(PERFORMANCE_CONFIG.BULK_WALLET_BATCH_SIZE);
      
      const avgTimePerAddress = duration / PERFORMANCE_CONFIG.BULK_WALLET_BATCH_SIZE;
      expect(avgTimePerAddress).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD / 2); // Batch should be faster
    });

    test('should maintain performance across different chains', async () => {
      const operations = [
        {
          name: 'Ethereum Wallet Generation',
          operation: () => ethAdapter.generateAddress({ seed: testSeed, index: 0 })
        },
        {
          name: 'Bitcoin Wallet Generation',
          operation: () => btcAdapter.generateAddress({ seed: testSeed, index: 0 })
        }
      ];

      const results: Array<{ name: string; duration: number }> = [];

      for (const op of operations) {
        const { duration } = await measurePerformance(op.operation, op.name);
        results.push({ name: op.name, duration });
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
      }

      // Log comparison
      console.log('Chain Performance Comparison:', results);
    });
  });

  describe('Connection Performance', () => {
    test('should connect within performance threshold', async () => {
      // Test EVM connection
      const { duration: ethDuration } = await measurePerformance(async () => {
        await ethAdapter.connect();
        return ethAdapter.isConnected();
      }, 'Ethereum Connection');

      expect(ethDuration).toBeLessThan(PERFORMANCE_CONFIG.CONNECTION_THRESHOLD);

      // Test UTXO connection
      const { duration: btcDuration } = await measurePerformance(async () => {
        await btcAdapter.connect();
        return btcAdapter.isConnected();
      }, 'Bitcoin Connection');

      expect(btcDuration).toBeLessThan(PERFORMANCE_CONFIG.CONNECTION_THRESHOLD);
    });

    test('should handle concurrent connections efficiently', async () => {
      // Create multiple adapters
      const adapters = [
        EVMAdapterFactory.createEthereum('https://mainnet.infura.io/v3/test1'),
        EVMAdapterFactory.createBSC('https://bsc-dataseed.binance.org/'),
        EVMAdapterFactory.createPolygon('https://polygon-rpc.com/'),
        UTXOAdapterFactory.createBitcoin('https://blockstream.info/api'),
        UTXOAdapterFactory.createLitecoin('https://chain.so/api/v2')
      ];

      const { duration } = await measurePerformance(async () => {
        const connections = adapters.map(adapter => adapter.connect());
        await Promise.all(connections);
        return adapters.map(adapter => adapter.isConnected());
      }, 'Concurrent Multi-Chain Connections');

      // All should be connected
      expect(adapters.every(adapter => adapter.isConnected())).toBe(true);
      
      // Should be faster than sequential connections
      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.CONNECTION_THRESHOLD * 2);

      // Cleanup
      await Promise.all(adapters.map(adapter => adapter.disconnect()));
    });
  });

  describe('Balance Query Performance', () => {
    beforeAll(async () => {
      await ethAdapter.connect();
      await btcAdapter.connect();
    });

    test('should query single balance within threshold', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6';

      const { duration } = await measurePerformance(async () => {
        return await ethAdapter.getBalance(testAddress);
      }, 'Single Balance Query');

      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.BALANCE_QUERY_THRESHOLD);
    });

    test('should handle concurrent balance queries efficiently', async () => {
      const addresses: string[] = [];
      for (let i = 0; i < PERFORMANCE_CONFIG.CONCURRENT_BALANCE_COUNT; i++) {
        addresses.push(`0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa${i.toString().padStart(6, '0')}`);
      }

      const { result, duration } = await measurePerformance(async () => {
        const balancePromises = addresses.map(address => 
          ethAdapter.getBalance(address).catch(() => null) // Handle invalid addresses gracefully
        );
        return await Promise.all(balancePromises);
      }, `Concurrent Balance Queries (${PERFORMANCE_CONFIG.CONCURRENT_BALANCE_COUNT} addresses)`);

      expect(result).toHaveLength(PERFORMANCE_CONFIG.CONCURRENT_BALANCE_COUNT);
      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.BALANCE_QUERY_TIMEOUT);

      const avgTimePerQuery = duration / PERFORMANCE_CONFIG.CONCURRENT_BALANCE_COUNT;
      console.log(`Average time per balance query: ${avgTimePerQuery.toFixed(2)}ms`);
    });

    test('should handle batch balance queries efficiently', async () => {
      const addresses = [
        '0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6',
        '0x8ba1f109551bD432803012645Hac136c32960442',
        '0x0000000000000000000000000000000000000000'
      ];

      const { result, duration } = await measurePerformance(async () => {
        return await ethAdapter.getBalances(addresses);
      }, 'Batch Balance Queries');

      expect(result).toHaveLength(addresses.length);
      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.BALANCE_QUERY_THRESHOLD);
    });
  });

  describe('Memory Usage Performance', () => {
    test('should maintain reasonable memory usage during bulk operations', async () => {
      const initialMemory = measureMemory();
      
      // Perform memory-intensive operations
      const operations = [
        // Generate many wallets
        async () => {
          const wallets = [];
          for (let i = 0; i < 500; i++) {
            const wallet = await ethAdapter.generateAddress({ seed: testSeed, index: i });
            wallets.push(wallet);
          }
          return wallets;
        },
        
        // Force garbage collection if available
        async () => {
          if (global.gc) {
            global.gc();
          }
        }
      ];

      for (const operation of operations) {
        await operation();
        const currentMemory = measureMemory();
        console.log('Current memory usage:', currentMemory);
      }

      const finalMemory = measureMemory();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory increase: ${memoryIncrease}MB`);
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_LARGE);
    });

    test('should handle memory pressure gracefully', async () => {
      const startMemory = measureMemory();
      
      // Create large data structures
      const largeDataSet = [];
      for (let i = 0; i < 1000; i++) {
        const wallet = await ethAdapter.generateAddress({ seed: testSeed, index: i });
        largeDataSet.push({
          wallet,
          metadata: {
            created: new Date(),
            id: i,
            tags: ['test', 'performance', 'bulk'],
            history: new Array(10).fill({ timestamp: Date.now(), action: 'created' })
          }
        });
      }

      const peakMemory = measureMemory();
      
      // Clean up
      largeDataSet.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const endMemory = measureMemory();
      
      console.log('Memory usage:', {
        start: startMemory.heapUsed,
        peak: peakMemory.heapUsed,
        end: endMemory.heapUsed
      });

      // Memory should not grow indefinitely
      expect(peakMemory.heapUsed - startMemory.heapUsed).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_LARGE);
    });
  });

  describe('Chain-Specific Performance Characteristics', () => {
    test('should compare EVM vs UTXO performance characteristics', async () => {
      const testOperations = [
        {
          name: 'Address Generation',
          evmOp: () => ethAdapter.generateAddress({ seed: testSeed, index: 0 }),
          utxoOp: () => btcAdapter.generateAddress({ seed: testSeed, index: 0 })
        },
        {
          name: 'Address Validation',
          evmOp: () => ethAdapter.validateAddress('0x742d35Cc6634C0532925a3b8D6B9DCC4c7dd0Aa6'),
          utxoOp: () => btcAdapter.validateAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
        }
      ];

      const results: any = {};

      for (const operation of testOperations) {
        // Test EVM performance
        const { duration: evmDuration } = await measurePerformance(
          operation.evmOp,
          `EVM ${operation.name}`
        );

        // Test UTXO performance
        const { duration: utxoDuration } = await measurePerformance(
          operation.utxoOp,
          `UTXO ${operation.name}`
        );

        results[operation.name] = {
          evm: evmDuration,
          utxo: utxoDuration,
          ratio: evmDuration / utxoDuration
        };

        // Both should be within reasonable limits
        expect(evmDuration).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
        expect(utxoDuration).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
      }

      console.log('Performance Comparison Results:', results);
    });

    test('should handle chain-specific bulk operations', async () => {
      const bulkSize = 100;

      // EVM bulk operations
      const { duration: evmBulkDuration } = await measurePerformance(async () => {
        return await ethAdapter.deriveAddresses({
          seed: testSeed,
          count: bulkSize,
          startIndex: 0
        });
      }, `EVM Bulk Generation (${bulkSize} addresses)`);

      // UTXO bulk operations
      const { duration: utxoBulkDuration } = await measurePerformance(async () => {
        return await btcAdapter.deriveAddresses({
          seed: testSeed,
          count: bulkSize,
          startIndex: 0
        });
      }, `UTXO Bulk Generation (${bulkSize} addresses)`);

      const avgEvmTime = evmBulkDuration / bulkSize;
      const avgUtxoTime = utxoBulkDuration / bulkSize;

      console.log('Average times per address:', {
        evm: avgEvmTime.toFixed(2) + 'ms',
        utxo: avgUtxoTime.toFixed(2) + 'ms'
      });

      expect(avgEvmTime).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
      expect(avgUtxoTime).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
    });
  });

  describe('Scalability Testing', () => {
    test('should maintain linear performance scaling', async () => {
      const scales = [10, 50, 100, 200];
      const results = [];

      for (const scale of scales) {
        const { duration } = await measurePerformance(async () => {
          const wallets = [];
          for (let i = 0; i < scale; i++) {
            const wallet = await ethAdapter.generateAddress({ seed: testSeed, index: i });
            wallets.push(wallet);
          }
          return wallets;
        }, `Scale Test (${scale} wallets)`);

        const avgTimePerWallet = duration / scale;
        results.push({ scale, duration, avgTimePerWallet });
      }

      console.log('Scalability Results:', results);

      // Performance should remain relatively linear
      const firstAvg = results[0].avgTimePerWallet;
      const lastAvg = results[results.length - 1].avgTimePerWallet;
      
      // Average time shouldn't degrade more than 2x
      expect(lastAvg).toBeLessThan(firstAvg * 2);
    });

    test('should handle enterprise-scale operations', async () => {
      const enterpriseScale = 1000; // Simulate enterprise usage
      
      const { result, duration, memory } = await measurePerformance(async () => {
        // Simulate enterprise operations
        const operations = [];
        
        for (let batch = 0; batch < 10; batch++) {
          operations.push(
            ethAdapter.deriveAddresses({
              seed: testSeed,
              count: enterpriseScale / 10,
              startIndex: batch * (enterpriseScale / 10)
            })
          );
        }
        
        const results = await Promise.all(operations);
        return results.flat();
      }, `Enterprise Scale Test (${enterpriseScale} addresses)`);

      expect(result).toHaveLength(enterpriseScale);
      
      const avgTimePerAddress = duration / enterpriseScale;
      console.log(`Enterprise performance: ${avgTimePerAddress.toFixed(2)}ms per address`);
      
      expect(avgTimePerAddress).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
      expect(memory.end.heapUsed - memory.start.heapUsed).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_LIMIT_LARGE);
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain consistent performance over time', async () => {
      const iterations = 5;
      const durations = [];

      // Run same operation multiple times
      for (let i = 0; i < iterations; i++) {
        const { duration } = await measurePerformance(async () => {
          return await ethAdapter.generateAddress({ seed: testSeed, index: i });
        }, `Consistency Test Iteration ${i + 1}`);
        
        durations.push(duration);
      }

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = maxDuration - minDuration;

      console.log('Performance consistency:', {
        average: avgDuration.toFixed(2) + 'ms',
        min: minDuration.toFixed(2) + 'ms',
        max: maxDuration.toFixed(2) + 'ms',
        variance: variance.toFixed(2) + 'ms'
      });

      // Performance should be consistent (variance < 50% of average)
      expect(variance).toBeLessThan(avgDuration * 0.5);
      expect(avgDuration).toBeLessThan(PERFORMANCE_CONFIG.WALLET_GENERATION_THRESHOLD);
    });
  });
});
