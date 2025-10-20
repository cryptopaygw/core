import type { CryptoPaymentConfig } from '../types';
import type { ISeedGenerator } from '../../crypto/interfaces';
import type { IWalletFactory } from '../../wallet/interfaces';
import type { IChainAdapter } from './chain-adapter.interface';

/**
 * Gateway Status Information
 */
export interface GatewayStatus {
  readonly isInitialized: boolean;
  readonly supportedChains: string[];
  readonly activeAdapters: string[];
  readonly version: string;
  readonly uptime: number;
}

/**
 * Chain Registration Info
 */
export interface ChainRegistrationInfo {
  readonly chainName: string;
  readonly chainType: string;
  readonly adapterPath: string;
  readonly isActive: boolean;
  readonly lastHealthCheck: Date | null;
}

/**
 * Gateway Initialization Options
 */
export interface GatewayInitOptions {
  readonly validateChains?: boolean;
  readonly performHealthChecks?: boolean;
  readonly timeout?: number;
}

/**
 * Main Crypto Payment Gateway Interface
 * Central hub for all cryptocurrency payment operations
 */
export interface ICryptoPaymentGW {
  // Core lifecycle
  initialize(options?: GatewayInitOptions): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;

  // Status and health
  getStatus(): GatewayStatus;
  validateConfiguration(): Promise<boolean>;
  performHealthCheck(): Promise<Map<string, boolean>>;

  // Chain management
  getSupportedChains(): string[];
  isChainSupported(chainName: string): boolean;
  getChainAdapter(chainName: string): Promise<IChainAdapter>;
  
  // Factory access methods
  createSeedGenerator(): ISeedGenerator;
  getWalletFactory(chainName: string): Promise<IWalletFactory>;

  // Chain operations
  registerChain(chainName: string, adapterPath: string): Promise<void>;
  unregisterChain(chainName: string): Promise<void>;
  getChainRegistrations(): ChainRegistrationInfo[];

  // Configuration access
  getConfiguration(): Readonly<CryptoPaymentConfig>;
  updateChainConfig(chainName: string, config: Record<string, unknown>): Promise<void>;
}

/**
 * Gateway Events
 */
export interface IGatewayEvents {
  // Lifecycle events
  onInitialized: (gateway: ICryptoPaymentGW) => void;
  onDisposed: (gateway: ICryptoPaymentGW) => void;
  
  // Chain events
  onChainRegistered: (chainName: string) => void;
  onChainUnregistered: (chainName: string) => void;
  onChainHealthChanged: (chainName: string, isHealthy: boolean) => void;
  
  // Error events
  onError: (error: Error, context: string) => void;
  onWarning: (warning: string, context: string) => void;
}

/**
 * Gateway Configuration Validation Result
 */
export interface GatewayValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly chainValidations: Map<string, { valid: boolean; errors: string[] }>;
}
