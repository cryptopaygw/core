/**
 * Monitoring Provider Interface
 * 
 * This interface defines the contract for pluggable monitoring providers
 * that can be used with different external monitoring systems like
 * Elasticsearch, InfluxDB, Prometheus, custom databases, etc.
 * 
 * Design Principles:
 * - Provider-agnostic: Works with any external data store or monitoring system
 * - Plugin architecture: Supports hot-swapping of monitoring providers
 * - Data transformation: Handles conversion between internal and external formats
 * - Connection management: Manages connections to external systems
 * - Performance-optimized: Supports batching, caching, and async operations
 * 
 * @example
 * ```typescript
 * const elasticsearchProvider: IMonitoringProvider = new ElasticsearchMonitoringProvider({
 *   hosts: ['http://localhost:9200'],
 *   index: 'crypto-monitoring',
 *   authentication: { type: 'basic', credentials: { user: 'admin', password: 'secret' } }
 * });
 * 
 * const monitoringSystem = new ExternalMonitoringSystem();
 * await monitoringSystem.setProvider(elasticsearchProvider);
 * ```
 */

import { 
  MonitoringEvent, 
  MonitoringTarget,
  ITransactionFilter,
  MonitoringQueryResult,
  MonitoringHealthStatus,
  MonitoringMetrics,
  BatchOperationResult,
  HistoryQueryOptions,
  IMonitoringConfiguration
} from './monitoring-system.interface';

/**
 * Core interface for monitoring providers
 */
export interface IMonitoringProvider {
  /**
   * Provider identification
   */
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Lifecycle management
   */
  initialize(config: ProviderConfiguration): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  dispose(): Promise<void>;

  /**
   * Connection state
   */
  isConnected(): boolean;
  getConnectionStatus(): Promise<ProviderConnectionStatus>;

  /**
   * Configuration management
   */
  updateConfiguration(config: Partial<ProviderConfiguration>): Promise<void>;
  getConfiguration(): Readonly<ProviderConfiguration>;
  validateConfiguration(config: ProviderConfiguration): Promise<ProviderValidationResult>;

  /**
   * Event storage and retrieval
   */
  storeEvent(event: MonitoringEvent): Promise<void>;
  storeEvents(events: MonitoringEvent[]): Promise<BatchOperationResult>;
  retrieveEvents(filter: ITransactionFilter): Promise<MonitoringQueryResult>;
  deleteEvents(filter: ITransactionFilter): Promise<BatchOperationResult>;

  /**
   * Target management
   */
  storeTarget(target: MonitoringTarget): Promise<void>;
  updateTarget(targetId: string, updates: Partial<MonitoringTarget>): Promise<void>;
  deleteTarget(targetId: string): Promise<void>;
  retrieveTarget(targetId: string): Promise<MonitoringTarget | null>;
  retrieveTargets(filter?: TargetFilter): Promise<MonitoringTarget[]>;

  /**
   * Query operations
   */
  query(query: ProviderQuery): Promise<ProviderQueryResult>;
  aggregateQuery(query: AggregateQuery): Promise<AggregateResult>;
  streamQuery(query: StreamingQuery): AsyncIterableIterator<MonitoringEvent>;

  /**
   * Index and schema management
   */
  createIndex(indexName: string, schema?: IndexSchema): Promise<void>;
  deleteIndex(indexName: string): Promise<void>;
  getIndices(): Promise<IndexInfo[]>;
  optimizeIndices(): Promise<OptimizationResult>;

  /**
   * Health and diagnostics
   */
  healthCheck(): Promise<ProviderHealthStatus>;
  getMetrics(): Promise<ProviderMetrics>;
  getStorageInfo(): Promise<StorageInfo>;

  /**
   * Data transformation
   */
  transformEventToProvider(event: MonitoringEvent): unknown;
  transformEventFromProvider(data: unknown): MonitoringEvent;
  transformTargetToProvider(target: MonitoringTarget): unknown;
  transformTargetFromProvider(data: unknown): MonitoringTarget;
}

/**
 * Provider capabilities enumeration
 */
export interface ProviderCapabilities {
  readonly supportsRealTimeStreaming: boolean;
  readonly supportsAggregations: boolean;
  readonly supportsFullTextSearch: boolean;
  readonly supportsTransactions: boolean;
  readonly supportsIndexing: boolean;
  readonly supportsSchemaEvolution: boolean;
  readonly supportsBulkOperations: boolean;
  readonly supportsBackup: boolean;
  readonly maxBatchSize: number;
  readonly maxQueryResults: number;
  readonly supportedCompressionTypes: CompressionType[];
  readonly supportedAuthTypes: AuthenticationType[];
}

/**
 * Compression types supported by providers
 */
export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  LZ4 = 'lz4',
  ZSTD = 'zstd',
  SNAPPY = 'snappy'
}

/**
 * Authentication types supported by providers
 */
export enum AuthenticationType {
  NONE = 'none',
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  CERTIFICATE = 'certificate',
  CUSTOM = 'custom'
}

/**
 * Provider configuration interface
 */
export interface ProviderConfiguration {
  readonly providerId: string;
  readonly providerType: string;
  readonly endpoints: string[];
  readonly authentication?: ProviderAuthentication;
  readonly connection?: ConnectionConfiguration;
  readonly storage?: StorageConfiguration;
  readonly performance?: ProviderPerformanceConfiguration;
  readonly security?: SecurityConfiguration;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Provider authentication configuration
 */
export interface ProviderAuthentication {
  readonly type: AuthenticationType;
  readonly credentials?: Record<string, string>;
  readonly certificatePath?: string;
  readonly refreshToken?: string;
  readonly refreshInterval?: number;
  readonly timeout?: number;
}

/**
 * Connection configuration for providers
 */
export interface ConnectionConfiguration {
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly retryDelay?: number;
  readonly maxConnections?: number;
  readonly keepAlive?: boolean;
  readonly compression?: CompressionType;
  readonly tlsConfig?: TlsConfiguration;
}

/**
 * TLS configuration
 */
export interface TlsConfiguration {
  readonly enabled: boolean;
  readonly certificatePath?: string;
  readonly keyPath?: string;
  readonly caPath?: string;
  readonly rejectUnauthorized?: boolean;
  readonly serverName?: string;
}

/**
 * Storage configuration for providers
 */
export interface StorageConfiguration {
  readonly defaultIndex?: string;
  readonly indexPrefix?: string;
  readonly retention?: RetentionPolicy;
  readonly sharding?: ShardingConfiguration;
  readonly replication?: ReplicationConfiguration;
  readonly compression?: CompressionType;
}

/**
 * Data retention policy
 */
export interface RetentionPolicy {
  readonly enabled: boolean;
  readonly maxAge?: number; // milliseconds
  readonly maxSize?: number; // bytes
  readonly maxEvents?: number;
  readonly archiveOldData?: boolean;
  readonly archiveLocation?: string;
}

/**
 * Sharding configuration
 */
export interface ShardingConfiguration {
  readonly enabled: boolean;
  readonly shardCount?: number;
  readonly shardKey?: string;
  readonly autoShard?: boolean;
  readonly maxShardSize?: number; // bytes
}

/**
 * Replication configuration
 */
export interface ReplicationConfiguration {
  readonly enabled: boolean;
  readonly replicas?: number;
  readonly syncMode?: 'sync' | 'async';
  readonly consistency?: 'eventual' | 'strong';
}

/**
 * Provider performance configuration
 */
export interface ProviderPerformanceConfiguration {
  readonly batchSize?: number;
  readonly flushInterval?: number;
  readonly bufferSize?: number;
  readonly maxConcurrency?: number;
  readonly prefetchCount?: number;
  readonly caching?: CachingConfiguration;
  readonly optimization?: OptimizationConfiguration;
}

/**
 * Caching configuration
 */
export interface CachingConfiguration {
  readonly enabled: boolean;
  readonly maxSize?: number; // bytes
  readonly ttl?: number; // milliseconds
  readonly strategy?: 'lru' | 'lfu' | 'fifo';
}

/**
 * Optimization configuration
 */
export interface OptimizationConfiguration {
  readonly autoOptimize?: boolean;
  readonly optimizationInterval?: number; // milliseconds
  readonly compressionLevel?: number;
  readonly indexOptimization?: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfiguration {
  readonly encryption?: EncryptionConfiguration;
  readonly accessControl?: AccessControlConfiguration;
  readonly audit?: AuditConfiguration;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfiguration {
  readonly enabled: boolean;
  readonly algorithm?: string;
  readonly keyPath?: string;
  readonly rotationInterval?: number; // milliseconds
}

/**
 * Access control configuration
 */
export interface AccessControlConfiguration {
  readonly enabled: boolean;
  readonly roles?: string[];
  readonly permissions?: Record<string, string[]>;
}

/**
 * Audit configuration
 */
export interface AuditConfiguration {
  readonly enabled: boolean;
  readonly logLevel?: 'info' | 'warn' | 'error';
  readonly logPath?: string;
  readonly includeData?: boolean;
}

/**
 * Provider connection status
 */
export interface ProviderConnectionStatus {
  readonly connected: boolean;
  readonly lastConnected?: Date;
  readonly connectionCount: number;
  readonly latency: number; // milliseconds
  readonly errors: ConnectionError[];
  readonly endpoints: EndpointStatus[];
}

/**
 * Connection error information
 */
export interface ConnectionError {
  readonly timestamp: Date;
  readonly error: string;
  readonly endpoint?: string;
  readonly retryCount: number;
  readonly resolved: boolean;
}

/**
 * Endpoint status information
 */
export interface EndpointStatus {
  readonly endpoint: string;
  readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'unreachable';
  readonly latency: number;
  readonly lastChecked: Date;
  readonly errors: string[];
}

/**
 * Target filter for retrieving monitoring targets
 */
export interface TargetFilter {
  readonly targetIds?: string[];
  readonly types?: string[];
  readonly chains?: string[];
  readonly labels?: string[];
  readonly isActive?: boolean;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Provider query interface
 */
export interface ProviderQuery {
  readonly queryId?: string;
  readonly filters: ITransactionFilter;
  readonly projection?: string[]; // fields to return
  readonly sort?: SortConfiguration[];
  readonly limit?: number;
  readonly offset?: number;
  readonly cursor?: string;
  readonly timeout?: number;
}

/**
 * Sort configuration
 */
export interface SortConfiguration {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
  readonly priority?: number;
}

/**
 * Provider query result
 */
export interface ProviderQueryResult {
  readonly queryId?: string;
  readonly events: MonitoringEvent[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
  readonly executionTime: number;
  readonly metadata?: Record<string, unknown>;
  readonly cached?: boolean;
}

/**
 * Aggregate query interface
 */
export interface AggregateQuery {
  readonly queryId?: string;
  readonly filters: ITransactionFilter;
  readonly aggregations: AggregationConfiguration[];
  readonly groupBy?: string[];
  readonly having?: HavingClause[];
  readonly limit?: number;
}

/**
 * Aggregation configuration
 */
export interface AggregationConfiguration {
  readonly name: string;
  readonly type: AggregationType;
  readonly field: string;
  readonly options?: Record<string, unknown>;
}

/**
 * Aggregation types
 */
export enum AggregationType {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  DISTINCT = 'distinct',
  PERCENTILE = 'percentile',
  HISTOGRAM = 'histogram',
  DATE_HISTOGRAM = 'date_histogram',
  TERMS = 'terms'
}

/**
 * Having clause for aggregate queries
 */
export interface HavingClause {
  readonly aggregation: string;
  readonly operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  readonly value: string | number;
}

/**
 * Aggregate result
 */
export interface AggregateResult {
  readonly queryId?: string;
  readonly buckets: AggregateBucket[];
  readonly executionTime: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Aggregate bucket
 */
export interface AggregateBucket {
  readonly key: string | number;
  readonly count: number;
  readonly aggregations: Record<string, number | string>;
  readonly subBuckets?: AggregateBucket[];
}

/**
 * Streaming query interface
 */
export interface StreamingQuery {
  readonly queryId?: string;
  readonly filters: ITransactionFilter;
  readonly batchSize?: number;
  readonly timeout?: number;
  readonly resumeToken?: string;
}

/**
 * Index schema definition
 */
export interface IndexSchema {
  readonly fields: SchemaField[];
  readonly settings?: IndexSettings;
  readonly mappings?: Record<string, unknown>;
}

/**
 * Schema field definition
 */
export interface SchemaField {
  readonly name: string;
  readonly type: FieldType;
  readonly indexed?: boolean;
  readonly stored?: boolean;
  readonly required?: boolean;
  readonly multiValue?: boolean;
  readonly defaultValue?: unknown;
}

/**
 * Field types for schema
 */
export enum FieldType {
  STRING = 'string',
  TEXT = 'text',
  INTEGER = 'integer',
  LONG = 'long',
  FLOAT = 'float',
  DOUBLE = 'double',
  BOOLEAN = 'boolean',
  DATE = 'date',
  OBJECT = 'object',
  ARRAY = 'array',
  BINARY = 'binary'
}

/**
 * Index settings
 */
export interface IndexSettings {
  readonly shards?: number;
  readonly replicas?: number;
  readonly refreshInterval?: string;
  readonly compression?: CompressionType;
  readonly analyzer?: string;
}

/**
 * Index information
 */
export interface IndexInfo {
  readonly name: string;
  readonly status: 'active' | 'inactive' | 'error';
  readonly documentCount: number;
  readonly size: number; // bytes
  readonly createdAt: Date;
  readonly lastModified: Date;
  readonly settings: IndexSettings;
  readonly health: 'green' | 'yellow' | 'red';
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  readonly optimizedIndices: string[];
  readonly timeTaken: number; // milliseconds
  readonly spaceSaved: number; // bytes
  readonly errors: string[];
}

/**
 * Provider health status
 */
export interface ProviderHealthStatus {
  readonly healthy: boolean;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: Date;
  readonly checks: ProviderHealthCheck[];
  readonly uptime: number; // milliseconds
  readonly version: string;
}

/**
 * Provider health check
 */
export interface ProviderHealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly message?: string;
  readonly duration: number; // milliseconds
  readonly details?: Record<string, unknown>;
}

/**
 * Provider metrics
 */
export interface ProviderMetrics {
  readonly providerId: string;
  readonly timestamp: Date;
  readonly operations: OperationMetrics;
  readonly storage: StorageMetrics;
  readonly performance: ProviderPerformanceMetrics;
  readonly errors: ProviderErrorMetrics;
}

/**
 * Operation metrics
 */
export interface OperationMetrics {
  readonly totalOperations: number;
  readonly operationsPerSecond: number;
  readonly operationsByType: Record<string, number>;
  readonly avgOperationTime: number;
  readonly slowOperations: number;
}

/**
 * Storage metrics
 */
export interface StorageMetrics {
  readonly totalDocuments: number;
  readonly totalSize: number; // bytes
  readonly indexCount: number;
  readonly avgDocumentSize: number; // bytes
  readonly compressionRatio: number;
}

/**
 * Provider performance metrics
 */
export interface ProviderPerformanceMetrics {
  readonly throughput: number; // operations per second
  readonly latency: LatencyMetrics;
  readonly resourceUsage: ProviderResourceUsage;
  readonly cacheMetrics?: CacheMetrics;
}

/**
 * Latency metrics
 */
export interface LatencyMetrics {
  readonly p50: number; // milliseconds
  readonly p95: number;
  readonly p99: number;
  readonly max: number;
  readonly avg: number;
}

/**
 * Provider resource usage
 */
export interface ProviderResourceUsage {
  readonly cpuUsage: number; // percentage
  readonly memoryUsage: number; // bytes
  readonly diskUsage: number; // bytes
  readonly networkIO: NetworkIOMetrics;
  readonly connectionCount: number;
}

/**
 * Network I/O metrics
 */
export interface NetworkIOMetrics {
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly requestsPerSecond: number;
  readonly errors: number;
}

/**
 * Cache metrics
 */
export interface CacheMetrics {
  readonly hitRate: number; // percentage
  readonly missRate: number; // percentage
  readonly evictions: number;
  readonly size: number; // bytes
  readonly maxSize: number; // bytes
}

/**
 * Provider error metrics
 */
export interface ProviderErrorMetrics {
  readonly totalErrors: number;
  readonly errorsPerMinute: number;
  readonly errorsByType: Record<string, number>;
  readonly criticalErrors: number;
  readonly recentErrors: RecentError[];
}

/**
 * Recent error information
 */
export interface RecentError {
  readonly timestamp: Date;
  readonly type: string;
  readonly message: string;
  readonly count: number;
  readonly resolved: boolean;
}

/**
 * Storage information
 */
export interface StorageInfo {
  readonly totalSpace: number; // bytes
  readonly usedSpace: number; // bytes
  readonly freeSpace: number; // bytes
  readonly usagePercentage: number;
  readonly indices: IndexStorageInfo[];
}

/**
 * Index storage information
 */
export interface IndexStorageInfo {
  readonly name: string;
  readonly size: number; // bytes
  readonly documentCount: number;
  readonly avgDocumentSize: number; // bytes
  readonly compressionRatio: number;
}

/**
 * Provider validation result
 */
export interface ProviderValidationResult {
  readonly valid: boolean;
  readonly errors: ProviderValidationError[];
  readonly warnings: ProviderValidationWarning[];
  readonly recommendations: string[];
}

/**
 * Provider validation error
 */
export interface ProviderValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'critical';
}

/**
 * Provider validation warning
 */
export interface ProviderValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly recommendation?: string;
}

/**
 * Abstract base class for monitoring providers
 */
export abstract class BaseMonitoringProvider implements IMonitoringProvider {
  protected config: ProviderConfiguration;
  protected connected = false;
  
  constructor(config: ProviderConfiguration) {
    this.config = config;
  }

  // Provider identification - must be implemented by concrete classes
  abstract readonly providerId: string;
  abstract readonly providerType: string;
  abstract readonly version: string;
  abstract readonly capabilities: ProviderCapabilities;

  // Lifecycle management - must be implemented by concrete classes
  abstract initialize(config: ProviderConfiguration): Promise<void>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract dispose(): Promise<void>;

  // Connection state
  isConnected(): boolean {
    return this.connected;
  }

  abstract getConnectionStatus(): Promise<ProviderConnectionStatus>;

  // Configuration management
  async updateConfiguration(config: Partial<ProviderConfiguration>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  getConfiguration(): Readonly<ProviderConfiguration> {
    return Object.freeze({ ...this.config });
  }

  abstract validateConfiguration(config: ProviderConfiguration): Promise<ProviderValidationResult>;

  // Abstract methods that must be implemented by concrete providers
  abstract storeEvent(event: MonitoringEvent): Promise<void>;
  abstract storeEvents(events: MonitoringEvent[]): Promise<BatchOperationResult>;
  abstract retrieveEvents(filter: ITransactionFilter): Promise<MonitoringQueryResult>;
  abstract deleteEvents(filter: ITransactionFilter): Promise<BatchOperationResult>;

  abstract storeTarget(target: MonitoringTarget): Promise<void>;
  abstract updateTarget(targetId: string, updates: Partial<MonitoringTarget>): Promise<void>;
  abstract deleteTarget(targetId: string): Promise<void>;
  abstract retrieveTarget(targetId: string): Promise<MonitoringTarget | null>;
  abstract retrieveTargets(filter?: TargetFilter): Promise<MonitoringTarget[]>;

  abstract query(query: ProviderQuery): Promise<ProviderQueryResult>;
  abstract aggregateQuery(query: AggregateQuery): Promise<AggregateResult>;
  abstract streamQuery(query: StreamingQuery): AsyncIterableIterator<MonitoringEvent>;

  abstract createIndex(indexName: string, schema?: IndexSchema): Promise<void>;
  abstract deleteIndex(indexName: string): Promise<void>;
  abstract getIndices(): Promise<IndexInfo[]>;
  abstract optimizeIndices(): Promise<OptimizationResult>;

  abstract healthCheck(): Promise<ProviderHealthStatus>;
  abstract getMetrics(): Promise<ProviderMetrics>;
  abstract getStorageInfo(): Promise<StorageInfo>;

  abstract transformEventToProvider(event: MonitoringEvent): unknown;
  abstract transformEventFromProvider(data: unknown): MonitoringEvent;
  abstract transformTargetToProvider(target: MonitoringTarget): unknown;
  abstract transformTargetFromProvider(data: unknown): MonitoringTarget;

  /**
   * Common utility methods
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  protected validateEventData(event: MonitoringEvent): boolean {
    return !!(event.id && event.type && event.timestamp && event.source);
  }

  protected validateTargetData(target: MonitoringTarget): boolean {
    return !!(target.id && target.type && target.identifier && target.chainName);
  }
}
