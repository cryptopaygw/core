/**
 * Core Monitoring System Interface
 * 
 * This interface defines the contract for all external monitoring implementations.
 * It provides a unified API for managing monitoring lifecycle, configuration,
 * and event handling regardless of the underlying monitoring technology.
 * 
 * Design Principles:
 * - Provider-agnostic: Works with any external monitoring system
 * - Lifecycle-aware: Supports full monitoring lifecycle management
 * - Event-driven: Built on standardized event publishing patterns
 * - Extensible: Allows for custom monitoring strategies and extensions
 * - Performance-focused: Supports batch operations and async patterns
 * 
 * @example
 * ```typescript
 * const customMonitor: IMonitoringSystem = new CustomExternalMonitor({
 *   provider: 'elasticsearch',
 *   endpoints: ['http://localhost:9200'],
 *   filters: { minAmount: '0.01', confirmations: 3 }
 * });
 * 
 * await customMonitor.initialize();
 * await customMonitor.start();
 * 
 * customMonitor.subscribe('transaction', (event) => {
 *   console.log('New transaction detected:', event);
 * });
 * ```
 */

import { EventEmitter } from 'events';

/**
 * Core monitoring system interface that all external monitoring implementations must implement
 */
export interface IMonitoringSystem extends EventEmitter {
  /**
   * System identification
   */
  readonly systemId: string;
  readonly providerName: string;
  readonly version: string;

  /**
   * Lifecycle management
   */
  initialize(config?: IMonitoringConfiguration): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  dispose(): Promise<void>;
  
  /**
   * State management
   */
  getState(): MonitoringState;
  isInitialized(): boolean;
  isRunning(): boolean;
  isPaused(): boolean;
  
  /**
   * Configuration management
   */
  updateConfiguration(config: Partial<IMonitoringConfiguration>): Promise<void>;
  getConfiguration(): Readonly<IMonitoringConfiguration>;
  validateConfiguration(config: IMonitoringConfiguration): Promise<MonitoringValidationResult>;
  
  /**
   * Monitoring operations
   */
  addTarget(target: MonitoringTarget): Promise<string>;
  removeTarget(targetId: string): Promise<void>;
  updateTarget(targetId: string, updates: Partial<MonitoringTarget>): Promise<void>;
  getTargets(): Promise<MonitoringTarget[]>;
  getTarget(targetId: string): Promise<MonitoringTarget | null>;
  
  /**
   * Event subscription and management
   */
  subscribe(eventType: MonitoringEventType, listener: MonitoringEventListener): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  publish(event: MonitoringEvent): Promise<void>;
  
  /**
   * Query and filtering
   */
  query(filter: ITransactionFilter): Promise<MonitoringQueryResult>;
  getHistory(targetId: string, options?: HistoryQueryOptions): Promise<MonitoringEvent[]>;
  
  /**
   * Health and diagnostics
   */
  healthCheck(): Promise<MonitoringHealthStatus>;
  getMetrics(): Promise<MonitoringMetrics>;
  getDiagnostics(): Promise<MonitoringDiagnostics>;
  
  /**
   * Batch operations
   */
  batchAddTargets(targets: MonitoringTarget[]): Promise<BatchOperationResult>;
  batchRemoveTargets(targetIds: string[]): Promise<BatchOperationResult>;
  batchQuery(filters: ITransactionFilter[]): Promise<MonitoringQueryResult[]>;
}

/**
 * Monitoring system state enumeration
 */
export enum MonitoringState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSING = 'pausing',
  PAUSED = 'paused',
  RESUMING = 'resuming',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  DISPOSING = 'disposing',
  DISPOSED = 'disposed',
  ERROR = 'error'
}

/**
 * Monitoring configuration interface
 */
export interface IMonitoringConfiguration {
  readonly systemId: string;
  readonly providerName: string;
  readonly endpoints?: string[];
  readonly authentication?: MonitoringAuthentication;
  readonly retryStrategy?: IRetryStrategy;
  readonly performance?: PerformanceConfiguration;
  readonly filters?: GlobalFilterConfiguration;
  readonly notifications?: NotificationConfiguration;
  readonly extensions?: ExtensionConfiguration;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Authentication configuration for external monitoring systems
 */
export interface MonitoringAuthentication {
  readonly type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2' | 'custom';
  readonly credentials?: Record<string, string>;
  readonly refreshInterval?: number;
  readonly timeout?: number;
}

/**
 * Performance configuration for monitoring systems
 */
export interface PerformanceConfiguration {
  readonly batchSize?: number;
  readonly maxConcurrency?: number;
  readonly bufferSize?: number;
  readonly flushInterval?: number;
  readonly connectionPoolSize?: number;
  readonly requestTimeout?: number;
  readonly retryDelay?: number;
  readonly maxRetries?: number;
}

/**
 * Global filter configuration
 */
export interface GlobalFilterConfiguration {
  readonly minAmount?: string;
  readonly maxAmount?: string;
  readonly minConfirmations?: number;
  readonly addresses?: string[];
  readonly excludeAddresses?: string[];
  readonly chains?: string[];
  readonly tokens?: string[];
  readonly timeWindow?: TimeWindowFilter;
}

/**
 * Time window filter configuration
 */
export interface TimeWindowFilter {
  readonly startTime?: Date;
  readonly endTime?: Date;
  readonly duration?: number; // milliseconds
  readonly sliding?: boolean;
}

/**
 * Notification configuration
 */
export interface NotificationConfiguration {
  readonly enabled: boolean;
  readonly channels?: NotificationChannel[];
  readonly templates?: Record<string, NotificationTemplate>;
  readonly rateLimit?: RateLimitConfiguration;
}

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  readonly type: 'webhook' | 'email' | 'slack' | 'telegram' | 'custom';
  readonly endpoint?: string;
  readonly authentication?: MonitoringAuthentication;
  readonly enabled: boolean;
  readonly eventTypes?: MonitoringEventType[];
  readonly filters?: GlobalFilterConfiguration;
}

/**
 * Notification template for formatting messages
 */
export interface NotificationTemplate {
  readonly format: 'json' | 'text' | 'html' | 'markdown';
  readonly subject?: string;
  readonly body: string;
  readonly variables?: string[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfiguration {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly skipSuccessful?: boolean;
  readonly skipFailedRequests?: boolean;
}

/**
 * Extension configuration for custom monitoring capabilities
 */
export interface ExtensionConfiguration {
  readonly enabled: boolean;
  readonly extensions?: MonitoringExtensionConfig[];
}

/**
 * Individual extension configuration
 */
export interface MonitoringExtensionConfig {
  readonly name: string;
  readonly type: string;
  readonly config?: Record<string, unknown>;
  readonly enabled: boolean;
  readonly priority?: number;
}

/**
 * Retry strategy interface for resilient monitoring operations
 */
export interface IRetryStrategy {
  readonly maxRetries: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
  readonly jitter?: boolean;
  shouldRetry(error: Error, attemptNumber: number): boolean;
  getDelay(attemptNumber: number): number;
}

/**
 * Monitoring target represents what should be monitored
 */
export interface MonitoringTarget {
  readonly id: string;
  readonly type: MonitoringTargetType;
  readonly identifier: string; // address, contract, etc.
  readonly chainName: string;
  readonly label?: string;
  readonly filters?: ITransactionFilter;
  readonly notifications?: NotificationConfiguration;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly isActive: boolean;
}

/**
 * Types of monitoring targets
 */
export enum MonitoringTargetType {
  ADDRESS = 'address',
  CONTRACT = 'contract', 
  TOKEN = 'token',
  BLOCK = 'block',
  CUSTOM = 'custom'
}

/**
 * Transaction filter interface for advanced filtering capabilities
 */
export interface ITransactionFilter {
  readonly addresses?: string[];
  readonly excludeAddresses?: string[];
  readonly fromAddresses?: string[];
  readonly toAddresses?: string[];
  readonly contractAddresses?: string[];
  readonly tokenAddresses?: string[];
  readonly minAmount?: string;
  readonly maxAmount?: string;
  readonly minConfirmations?: number;
  readonly maxConfirmations?: number;
  readonly transactionTypes?: TransactionType[];
  readonly statuses?: TransactionStatus[];
  readonly timeRange?: TimeRange;
  readonly blockRange?: BlockRange;
  readonly tags?: string[];
  readonly metadata?: FilterMetadata;
}

/**
 * Time range for filtering
 */
export interface TimeRange {
  readonly from?: Date;
  readonly to?: Date;
  readonly duration?: number; // milliseconds from now
}

/**
 * Block range for filtering
 */
export interface BlockRange {
  readonly fromBlock?: number;
  readonly toBlock?: number;
  readonly latest?: boolean;
}

/**
 * Filter metadata for custom filtering logic
 */
export interface FilterMetadata {
  readonly [key: string]: string | number | boolean | string[] | number[];
}

/**
 * Transaction types for filtering
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  CONTRACT_CALL = 'contract_call',
  CONTRACT_CREATION = 'contract_creation',
  TOKEN_TRANSFER = 'token_transfer',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  DELEGATE = 'delegate',
  UNDELEGATE = 'undelegate',
  SWAP = 'swap',
  BRIDGE = 'bridge',
  CUSTOM = 'custom'
}

/**
 * Transaction status types
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REPLACED = 'replaced'
}

/**
 * Monitoring event types
 */
export type MonitoringEventType = 
  | 'transaction'
  | 'balance_change'
  | 'block'
  | 'error'
  | 'system_state_change'
  | 'target_added'
  | 'target_removed'
  | 'target_updated'
  | 'health_change'
  | 'custom';

/**
 * Monitoring event listener function type
 */
export type MonitoringEventListener = (event: MonitoringEvent) => void | Promise<void>;

/**
 * Base monitoring event interface
 */
export interface MonitoringEvent {
  readonly id: string;
  readonly type: MonitoringEventType;
  readonly timestamp: Date;
  readonly source: string; // system ID that generated the event
  readonly targetId?: string;
  readonly data: unknown;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Specific event types
 */
export interface TransactionMonitoringEvent extends MonitoringEvent {
  readonly type: 'transaction';
  readonly data: TransactionEventData;
}

export interface BalanceChangeMonitoringEvent extends MonitoringEvent {
  readonly type: 'balance_change';
  readonly data: BalanceChangeEventData;
}

export interface BlockMonitoringEvent extends MonitoringEvent {
  readonly type: 'block';
  readonly data: BlockEventData;
}

export interface SystemStateChangeEvent extends MonitoringEvent {
  readonly type: 'system_state_change';
  readonly data: SystemStateChangeData;
}

/**
 * Event data interfaces
 */
export interface TransactionEventData {
  readonly hash: string;
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly tokenAddress?: string;
  readonly tokenSymbol?: string;
  readonly chainName: string;
  readonly blockNumber: number;
  readonly blockHash: string;
  readonly confirmations: number;
  readonly gasUsed?: string;
  readonly gasPrice?: string;
  readonly status: TransactionStatus;
  readonly type: TransactionType;
  readonly timestamp: Date;
}

export interface BalanceChangeEventData {
  readonly address: string;
  readonly chainName: string;
  readonly tokenAddress?: string;
  readonly tokenSymbol?: string;
  readonly previousBalance: string;
  readonly currentBalance: string;
  readonly difference: string;
  readonly blockNumber: number;
  readonly timestamp: Date;
}

export interface BlockEventData {
  readonly number: number;
  readonly hash: string;
  readonly chainName: string;
  readonly timestamp: Date;
  readonly transactionCount: number;
  readonly parentHash: string;
  readonly gasLimit?: string;
  readonly gasUsed?: string;
}

export interface SystemStateChangeData {
  readonly previousState: MonitoringState;
  readonly currentState: MonitoringState;
  readonly reason?: string;
  readonly error?: Error;
}

/**
 * Query result interface
 */
export interface MonitoringQueryResult {
  readonly events: MonitoringEvent[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
  readonly executionTime: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * History query options
 */
export interface HistoryQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly cursor?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly eventTypes?: MonitoringEventType[];
  readonly timeRange?: TimeRange;
}

/**
 * Monitoring health status
 */
export interface MonitoringHealthStatus {
  readonly healthy: boolean;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: Date;
  readonly checks: HealthCheck[];
  readonly overallScore: number; // 0-100
  readonly uptime: number; // milliseconds
}

/**
 * Individual health check
 */
export interface HealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly message?: string;
  readonly duration: number; // milliseconds
  readonly details?: Record<string, unknown>;
}

/**
 * Monitoring metrics
 */
export interface MonitoringMetrics {
  readonly systemId: string;
  readonly timestamp: Date;
  readonly uptime: number;
  readonly performance: PerformanceMetrics;
  readonly events: EventMetrics;
  readonly targets: TargetMetrics;
  readonly errors: ErrorMetrics;
  readonly resources: ResourceMetrics;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly avgResponseTime: number;
  readonly avgThroughput: number;
  readonly peakThroughput: number;
  readonly successRate: number;
  readonly requestsPerMinute: number;
  readonly avgLatency: number;
}

/**
 * Event metrics
 */
export interface EventMetrics {
  readonly totalEvents: number;
  readonly eventsPerMinute: number;
  readonly eventsByType: Record<MonitoringEventType, number>;
  readonly avgEventSize: number;
  readonly duplicateEvents: number;
}

/**
 * Target metrics
 */
export interface TargetMetrics {
  readonly totalTargets: number;
  readonly activeTargets: number;
  readonly targetsByType: Record<MonitoringTargetType, number>;
  readonly targetsByChain: Record<string, number>;
}

/**
 * Error metrics
 */
export interface ErrorMetrics {
  readonly totalErrors: number;
  readonly errorsPerMinute: number;
  readonly errorsByType: Record<string, number>;
  readonly criticalErrors: number;
  readonly recoveredErrors: number;
}

/**
 * Resource metrics
 */
export interface ResourceMetrics {
  readonly cpuUsage: number; // percentage
  readonly memoryUsage: number; // bytes
  readonly memoryPercentage: number;
  readonly connectionCount: number;
  readonly maxConnections: number;
  readonly diskUsage?: number; // bytes
}

/**
 * Monitoring diagnostics
 */
export interface MonitoringDiagnostics {
  readonly systemInfo: SystemInfo;
  readonly configuration: IMonitoringConfiguration;
  readonly state: DiagnosticState;
  readonly connections: ConnectionDiagnostics[];
  readonly recentErrors: ErrorDiagnostic[];
  readonly performance: PerformanceDiagnostics;
}

/**
 * System information for diagnostics
 */
export interface SystemInfo {
  readonly systemId: string;
  readonly version: string;
  readonly startTime: Date;
  readonly environment: string;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly architecture: string;
}

/**
 * Diagnostic state information
 */
export interface DiagnosticState {
  readonly current: MonitoringState;
  readonly transitions: StateTransition[];
  readonly stateHistory: StateHistoryEntry[];
}

/**
 * State transition information
 */
export interface StateTransition {
  readonly from: MonitoringState;
  readonly to: MonitoringState;
  readonly timestamp: Date;
  readonly duration: number;
  readonly reason?: string;
}

/**
 * State history entry
 */
export interface StateHistoryEntry {
  readonly state: MonitoringState;
  readonly timestamp: Date;
  readonly duration: number; // how long in this state
}

/**
 * Connection diagnostics
 */
export interface ConnectionDiagnostics {
  readonly endpoint: string;
  readonly status: 'connected' | 'disconnected' | 'error';
  readonly latency: number;
  readonly lastConnected?: Date;
  readonly connectionCount: number;
  readonly errors: string[];
}

/**
 * Error diagnostic information
 */
export interface ErrorDiagnostic {
  readonly timestamp: Date;
  readonly error: string;
  readonly stack?: string;
  readonly context?: Record<string, unknown>;
  readonly resolved: boolean;
  readonly count: number;
}

/**
 * Performance diagnostics
 */
export interface PerformanceDiagnostics {
  readonly avgOperationTime: Record<string, number>;
  readonly slowOperations: SlowOperation[];
  readonly bottlenecks: string[];
  readonly optimizations: string[];
}

/**
 * Slow operation information
 */
export interface SlowOperation {
  readonly operation: string;
  readonly duration: number;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  readonly successful: number;
  readonly failed: number;
  readonly errors: BatchOperationError[];
  readonly results: unknown[];
  readonly executionTime: number;
}

/**
 * Batch operation error
 */
export interface BatchOperationError {
  readonly index: number;
  readonly error: string;
  readonly item?: unknown;
}

/**
 * Monitoring validation result
 */
export interface MonitoringValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'critical';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly recommendation?: string;
}
