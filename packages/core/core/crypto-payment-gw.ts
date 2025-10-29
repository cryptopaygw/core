import type {
  ICryptoPaymentGW,
  GatewayStatus,
  GatewayInitOptions,
  ChainRegistrationInfo,
  IChainAdapter
} from './interfaces';
import type { CryptoPaymentConfig } from './types';
import type { ISeedGenerator } from '../crypto/interfaces';
import type { IWalletFactory } from '../wallet/interfaces';
import { SeedGenerator } from '../crypto/implementations';
import { ConfigurationValidator } from './utils';

// ESLint configuration to allow console usage and unused variables
/* eslint-disable no-console, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-undef */

/**
 * Main Crypto Payment Gateway Implementation
 * 
 * Central hub for all cryptocurrency payment operations.
 * Manages chain adapters, provides factory access, and handles gateway lifecycle.
 * 
 * Features:
 * - Chain-agnostic architecture
 * - Dynamic adapter loading
 * - Configuration validation
 * - Resource management
 * - Health monitoring
 * - Factory pattern for components
 */
export class CryptoPaymentGW implements ICryptoPaymentGW {
  private initialized = false;
  private readonly config: CryptoPaymentConfig;
  private readonly chainAdapters = new Map<string, IChainAdapter>();
  private readonly chainRegistrations = new Map<string, ChainRegistrationInfo>();
  private readonly seedGenerator: ISeedGenerator;
  private readonly startTime = Date.now();

  /**
   * Initialize the Crypto Payment Gateway
   * @param config - Gateway configuration
   */
  constructor(config: CryptoPaymentConfig) {
    // Validate configuration
    const validationResult = ConfigurationValidator.validate(config);
    
    if (!validationResult.isValid) {
      throw new Error(`Invalid configuration: ${validationResult.errors.join(', ')}`);
    }

    this.config = Object.freeze({ ...config });
    this.seedGenerator = new SeedGenerator(config.encryption?.key);
    
    // Initialize chain registrations from configuration
    this.initializeChainRegistrations();
  }

  /**
   * Initialize chain registrations from configuration
   * @private
   */
  private initializeChainRegistrations(): void {
    this.config.chains.forEach(chainConfig => {
      this.chainRegistrations.set(chainConfig.name, {
        chainName: chainConfig.name,
        chainType: this.inferChainType(chainConfig.adapter),
        adapterPath: chainConfig.adapter,
        isActive: false,
        lastHealthCheck: null
      });
    });
  }

  /**
   * Infer chain type from adapter path
   * @private
   */
  private inferChainType(adapterPath: string): string {
    if (adapterPath.includes('evm')) return 'evm';
    if (adapterPath.includes('utxo')) return 'utxo';
    if (adapterPath.includes('cosmos')) return 'cosmos';
    if (adapterPath.includes('substrate')) return 'substrate';
    return 'unknown';
  }

  // =============================================================================
  // Core Lifecycle Methods
  // =============================================================================

  /**
   * Initialize the gateway
   */
  async initialize(options: GatewayInitOptions = {}): Promise<void> {
    if (this.initialized) {
      throw new Error('Gateway is already initialized');
    }

    const {
      validateChains = true,
      performHealthChecks = false
    } = options;

    try {
      // Validate configuration if requested
      if (validateChains) {
        const isValid = await this.validateConfiguration();
        if (!isValid) {
          throw new Error('Configuration validation failed');
        }
      }

      // Perform health checks if requested
      if (performHealthChecks) {
        const healthResults = await this.performHealthCheck();
        const unhealthyChains = Array.from(healthResults.entries())
          .filter(([, healthy]) => !healthy)
          .map(([chainName]) => chainName);

        if (unhealthyChains.length > 0) {
          console.warn(`Health check failed for chains: ${unhealthyChains.join(', ')}`);
        }
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Gateway initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Dispose the gateway and clean up resources
   */
  async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Disconnect all adapters
      const disconnectionPromises = Array.from(this.chainAdapters.values())
        .map(adapter => adapter.disconnect().catch(err => 
          console.warn(`Failed to disconnect adapter ${adapter.chainName}:`, err)
        ));

      await Promise.all(disconnectionPromises);

      // Clear adapter cache
      this.chainAdapters.clear();

      // Mark as not initialized
      this.initialized = false;
    } catch (error) {
      console.error('Error during gateway disposal:', error);
      throw error;
    }
  }

  /**
   * Check if gateway is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // =============================================================================
  // Status and Health Methods
  // =============================================================================

  /**
   * Get gateway status information
   */
  getStatus(): GatewayStatus {
    return {
      isInitialized: this.initialized,
      supportedChains: Array.from(this.chainRegistrations.keys()),
      activeAdapters: Array.from(this.chainAdapters.keys()),
      version: '1.0.0',
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Validate the gateway configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const result = ConfigurationValidator.validate(this.config);
      return result.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Perform health check on all registered chains
   */
  async performHealthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const healthCheckPromises: Promise<void>[] = [];

    for (const chainName of this.chainRegistrations.keys()) {
      const promise = this.checkChainHealth(chainName)
        .then(healthy => {
          results.set(chainName, healthy);
          
          // Update registration info (cast to mutable for internal updates)
          const registration = this.chainRegistrations.get(chainName) as {
            -readonly [K in keyof ChainRegistrationInfo]: ChainRegistrationInfo[K]
          };
          if (registration) {
            registration.lastHealthCheck = new Date();
            registration.isActive = healthy;
          }
        })
        .catch(() => {
          results.set(chainName, false);
        });

      healthCheckPromises.push(promise);
    }

    await Promise.allSettled(healthCheckPromises);
    return results;
  }

  /**
   * Check health of a specific chain
   * @private
   */
  private async checkChainHealth(chainName: string): Promise<boolean> {
    try {
      const adapter = await this.getChainAdapter(chainName);
      const healthStatus = await adapter.healthCheck();
      return healthStatus.healthy;
    } catch {
      return false;
    }
  }

  // =============================================================================
  // Chain Management Methods
  // =============================================================================

  /**
   * Get list of supported chains
   */
  getSupportedChains(): string[] {
    return Array.from(this.chainRegistrations.keys());
  }

  /**
   * Check if a chain is supported
   */
  isChainSupported(chainName: string): boolean {
    return this.chainRegistrations.has(chainName);
  }

  /**
   * Get chain adapter for the specified chain
   */
  async getChainAdapter(chainName: string): Promise<IChainAdapter> {
    if (!this.isChainSupported(chainName)) {
      throw new Error(`Chain '${chainName}' is not supported`);
    }

    if (!this.initialized) {
      throw new Error('Gateway is not initialized');
    }

    // Return cached adapter if exists
    if (this.chainAdapters.has(chainName)) {
      return this.chainAdapters.get(chainName)!;
    }

    // Load and cache the adapter
    const adapter = await this.loadChainAdapter(chainName);
    this.chainAdapters.set(chainName, adapter);
    
    return adapter;
  }

  /**
   * Load chain adapter dynamically
   * @private
   */
  private async loadChainAdapter(chainName: string): Promise<IChainAdapter> {
    const registration = this.chainRegistrations.get(chainName);
    if (!registration) {
      throw new Error(`Chain '${chainName}' not registered`);
    }

    try {
      // Get chain configuration
      const chainConfig = this.config.chains.find(c => c.name === chainName);
      if (!chainConfig) {
        throw new Error(`Configuration not found for chain '${chainName}'`);
      }

      // In a real implementation, this would dynamically import the adapter
      // For now, we'll throw an error indicating adapter loading is not implemented
      throw new Error(`Dynamic adapter loading not yet implemented for '${chainName}'. Please implement adapter loading logic.`);

      // TODO: Implement dynamic adapter loading
      // const AdapterClass = await import(registration.adapterPath);
      // const adapter = new AdapterClass.default(chainConfig);
      // await adapter.connect();
      // return adapter;
    } catch (error) {
      throw new Error(`Failed to load adapter for chain '${chainName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register a new chain
   */
  async registerChain(chainName: string, adapterPath: string): Promise<void> {
    if (this.chainRegistrations.has(chainName)) {
      throw new Error(`Chain '${chainName}' is already registered`);
    }

    const registration: ChainRegistrationInfo = {
      chainName,
      chainType: this.inferChainType(adapterPath),
      adapterPath,
      isActive: false,
      lastHealthCheck: null
    };

    this.chainRegistrations.set(chainName, registration);
  }

  /**
   * Unregister an existing chain
   */
  async unregisterChain(chainName: string): Promise<void> {
    if (!this.chainRegistrations.has(chainName)) {
      throw new Error(`Chain '${chainName}' is not registered`);
    }

    // Disconnect adapter if it's active
    if (this.chainAdapters.has(chainName)) {
      const adapter = this.chainAdapters.get(chainName)!;
      try {
        await adapter.disconnect();
      } catch (error) {
        console.warn(`Failed to disconnect adapter for ${chainName}:`, error);
      }
      this.chainAdapters.delete(chainName);
    }

    // Remove registration
    this.chainRegistrations.delete(chainName);
  }

  /**
   * Get all chain registrations
   */
  getChainRegistrations(): ChainRegistrationInfo[] {
    return Array.from(this.chainRegistrations.values());
  }

  // =============================================================================
  // Factory Access Methods
  // =============================================================================

  /**
   * Create a seed generator instance
   */
  createSeedGenerator(): ISeedGenerator {
    return this.seedGenerator;
  }

  /**
   * Get wallet factory for the specified chain
   */
  async getWalletFactory(chainName: string): Promise<IWalletFactory> {
    // TODO: Implement wallet factory creation from adapter
    // const adapter = await this.getChainAdapter(chainName);
    // This would typically call a method on the adapter to create its wallet factory
    throw new Error(`Wallet factory creation not yet implemented for chain '${chainName}'. Please implement wallet factory creation logic.`);
  }

  // =============================================================================
  // Configuration Methods
  // =============================================================================

  /**
   * Get the gateway configuration (read-only)
   */
  getConfiguration(): Readonly<CryptoPaymentConfig> {
    return this.config;
  }

  /**
   * Update chain configuration
   */
  async updateChainConfig(chainName: string, config: Record<string, unknown>): Promise<void> {
    if (!this.isChainSupported(chainName)) {
      throw new Error(`Chain '${chainName}' is not supported`);
    }

    // Find the chain configuration
    const chainConfig = this.config.chains.find(c => c.name === chainName);
    if (!chainConfig) {
      throw new Error(`Configuration not found for chain '${chainName}'`);
    }

    // Update the options (note: this modifies the frozen config, which is intentional for this operation)
    if (chainConfig.options) {
      Object.assign(chainConfig.options, config);
    } else {
      (chainConfig as any).options = { ...config };
    }

    // If adapter is loaded, we might need to reconfigure it
    if (this.chainAdapters.has(chainName)) {
      console.warn(`Chain '${chainName}' adapter is active. Configuration changes may require reconnection.`);
    }
  }
}
