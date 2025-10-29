/**
 * UTXO Chain Adapter Package Entry Point
 * 
 * A comprehensive adapter for UTXO-based cryptocurrencies including Bitcoin, Litecoin, 
 * Dogecoin and other compatible chains.
 * 
 * @example
 * ```typescript
 * import { UTXOChainAdapter, UTXOAdapterFactory } from '@cryptopaygw/utxo-adapter';
 * 
 * // Create a Bitcoin adapter
 * const bitcoinAdapter = UTXOAdapterFactory.createBitcoin('https://blockstream.info/api');
 * 
 * // Or create a custom adapter
 * const customAdapter = new UTXOChainAdapter({
 *   name: 'custom-chain',
 *   network: 'bitcoin',
 *   apiBaseUrl: 'https://api.example.com',
 *   nativeTokenSymbol: 'CUSTOM'
 * });
 * ```
 */

// Export main classes and interfaces
export { UTXOChainAdapter, UTXOAdapterFactory } from './utxo-chain-adapter';
export type { UTXOChainConfig } from './utxo-chain-adapter';

// Import for default export
import { UTXOChainAdapter, UTXOAdapterFactory } from './utxo-chain-adapter';

// Version info
export const version = '1.0.0';

// Default export for convenience
export default {
  UTXOChainAdapter,
  UTXOAdapterFactory,
  version
};
