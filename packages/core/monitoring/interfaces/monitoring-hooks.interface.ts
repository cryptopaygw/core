/**
 * Monitoring Hooks and Extension Interface
 * 
 * This interface defines extension points and hooks that allow external monitoring
 * systems to inject custom logic at various stages of the monitoring lifecycle.
 * It provides a middleware-like pattern for monitoring operations.
 * 
 * Design Principles:
 * - Extensible: Allows custom logic injection at key monitoring points
 * - Middleware pattern: Supports chaining of multiple hooks and extensions
 * - Performance-aware: Async hooks with proper error handling
 * - Event-driven: Hooks can modify, filter, or transform monitoring data
 * - Plugin architecture: Extensions can be dynamically loaded and configured
 * 
 * @example
 * ```typescript
 * const customHooks: IMonitoringHooks = {
 *   beforeEventStore: async (event) => {
 *     // Custom validation or enrichment
 *     event.metadata = { ...event.metadata, enriched: true };
 *     return event;
 *   },
 *   afterTargetAdd: async (target) => {
 *     console.log(`Target added: ${target.id}`);
 *   }
 * };
 * 
 * const monitoringSystem = new ExternalMonitoringSystem();
 * monitoringSystem.registerHooks(customHooks);
 * ```
 */

import { 
  MonitoringEvent, 
  MonitoringTarget,
  ITransactionFilter,
  MonitoringQueryResult,
  BatchOperationResult,
  MonitoringState
} from './monitoring-system.interface';

/**
 * Core monitoring hooks interface for lifecycle event interception
 */
export interface IMonitoringHooks {
  /**
   * Event lifecycle hooks
   */
  beforeEventStore?: BeforeEventStoreHook;
  afterEventStore?: AfterEventStoreHook;
  beforeEventQuery?: BeforeEventQueryHook;
  afterEventQuery?: AfterEventQueryHook;
  onEventStoreError?: OnEventStoreErrorHook;
  onEventQueryError?: OnEventQueryErrorHook;

  /**
   * Target lifecycle hooks
   */
  beforeTargetAdd?: BeforeTargetAddHook;
  afterTargetAdd?: AfterTargetAddHook;
  beforeTargetUpdate?: BeforeTargetUpdateHook;
  afterTargetUpdate?: AfterTargetUpdateHook;
  beforeTargetRemove?: BeforeTargetRemoveHook;
  afterTargetRemove?: AfterTargetRemoveHook;
  onTargetError?: OnTargetErrorHook;

  /**
   * System lifecycle hooks
   */
  beforeSystemStart?: BeforeSystemStartHook;
  afterSystemStart?: AfterSystemStartHook;
  beforeSystemStop?: BeforeSystemStopHook;
  afterSystemStop?: AfterSystemStopHook;
  onSystemStateChange?: OnSystemStateChangeHook;
  onSystemError?: OnSystemErrorHook;

  /**
   * Filter and transformation hooks
   */
  onFilterApply?: OnFilterApplyHook;
  onDataTransform?: OnDataTransformHook;
  onResultTransform?: OnResultTransformHook;

  /**
   * Performance and health hooks
   */
  onPerformanceMetrics?: OnPerformanceMetricsHook;
  onHealthCheck?: OnHealthCheckHook;
  onConnectionEvent?: OnConnectionEventHook;
}

/**
 * Event store hook types
 */
export type BeforeEventStoreHook = (event: MonitoringEvent, context: HookContext) => Promise<MonitoringEvent | null>;
export type AfterEventStoreHook = (event: MonitoringEvent, result: void, context: HookContext) => Promise<void>;
export type BeforeEventQueryHook = (filter: ITransactionFilter, context: HookContext) => Promise<ITransactionFilter>;
export type AfterEventQueryHook = (filter: ITransactionFilter, result: MonitoringQueryResult, context: HookContext) => Promise<MonitoringQueryResult>;
export type OnEventStoreErrorHook = (event: MonitoringEvent, error: Error, context: HookContext) => Promise<void>;
export type OnEventQueryErrorHook = (filter: ITransactionFilter, error: Error, context: HookContext) => Promise<void>;

/**
 * Target management hook types
 */
export type BeforeTargetAddHook = (target: MonitoringTarget, context: HookContext) => Promise<MonitoringTarget | null>;
export type AfterTargetAddHook = (target: MonitoringTarget, targetId: string, context: HookContext) => Promise<void>;
export type BeforeTargetUpdateHook = (targetId: string, updates: Partial<MonitoringTarget>, context: HookContext) => Promise<Partial<MonitoringTarget>>;
export type AfterTargetUpdateHook = (targetId: string, updates: Partial<MonitoringTarget>, context: HookContext) => Promise<void>;
export type BeforeTargetRemoveHook = (targetId: string, context: HookContext) => Promise<boolean>; // return false to cancel
export type AfterTargetRemoveHook = (targetId: string, context: HookContext) => Promise<void>;
export type OnTargetErrorHook = (targetId: string, error: Error, context: HookContext) => Promise<void>;

/**
 * System lifecycle hook types
 */
export type BeforeSystemStartHook = (context: HookContext) => Promise<void>;
export type AfterSystemStartHook = (context: HookContext) => Promise<void>;
export type BeforeSystemStopHook = (context: HookContext) => Promise<void>;
export type AfterSystemStopHook = (context: HookContext) => Promise<void>;
export type OnSystemStateChangeHook = (previousState: MonitoringState, newState: MonitoringState, context: HookContext) => Promise<void>;
export type OnSystemErrorHook = (error: Error, context: HookContext) => Promise<void>;

/**
 * Data processing hook types
 */
export type OnFilterApplyHook = (filter: ITransactionFilter, context: HookContext) => Promise<ITransactionFilter>;
export type OnDataTransformHook = (data: unknown, transformType: DataTransformType, context: HookContext) => Promise<unknown>;
export type OnResultTransformHook = (result: unknown, resultType: ResultTransformType, context: HookContext) => Promise<unknown>;

/**
 * Performance and health hook types
 */
export type OnPerformanceMetricsHook = (metrics: PerformanceSnapshot, context: HookContext) => Promise<void>;
export type OnHealthCheckHook = (healthStatus: HealthSnapshot, context: HookContext) => Promise<void>;
export type OnConnectionEventHook = (event: ConnectionEvent, context: HookContext) => Promise<void>;

/**
 * Hook execution context
 */
export interface HookContext {
  readonly systemId: string;
  readonly hookType: string;
  readonly timestamp: Date;
  readonly requestId?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly performance?: PerformanceContext;
}

/**
 * Performance context for hooks
 */
export interface PerformanceContext {
  readonly startTime: number;
  readonly operation: string;
  readonly stage: string;
  readonly metrics?: Record<string, number>;
}

/**
 * Data transformation types
 */
export enum DataTransformType {
  EVENT_TO_STORAGE = 'event_to_storage',
  EVENT_FROM_STORAGE = 'event_from_storage',
  TARGET_TO_STORAGE = 'target_to_storage',
  TARGET_FROM_STORAGE = 'target_from_storage',
  FILTER_NORMALIZE = 'filter_normalize',
  CUSTOM = 'custom'
}

/**
 * Result transformation types
 */
export enum ResultTransformType {
  QUERY_RESULT = 'query_result',
  BATCH_RESULT = 'batch_result',
  METRICS_RESULT = 'metrics_result',
  HEALTH_RESULT = 'health_result',
  CUSTOM = 'custom'
}

/**
 * Performance snapshot for hooks
 */
export interface PerformanceSnapshot {
  readonly operation: string;
  readonly duration: number;
  readonly throughput?: number;
  readonly errorRate?: number;
  readonly memoryUsage?: number;
  readonly cpuUsage?: number;
}

/**
 * Health snapshot for hooks
 */
export interface HealthSnapshot {
  readonly systemId: string;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly checks: HealthCheckResult[];
  readonly timestamp: Date;
  readonly uptime: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  readonly name: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly duration: number;
  readonly message?: string;
}

/**
 * Connection event for hooks
 */
export interface ConnectionEvent {
  readonly type: ConnectionEventType;
  readonly endpoint?: string;
  readonly timestamp: Date;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Connection event types
 */
export enum ConnectionEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

/**
 * Monitoring extension interface for custom functionality
 */
export interface IMonitoringExtension {
  /**
   * Extension identification
   */
  readonly extensionId: string;
  readonly extensionType: string;
  readonly version: string;
  readonly description?: string;

  /**
   * Extension lifecycle
   */
  initialize(config: ExtensionConfiguration): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;

  /**
   * Extension state
   */
  isInitialized(): boolean;
  isActive(): boolean;
  getConfiguration(): Readonly<ExtensionConfiguration>;

  /**
   * Extension capabilities
   */
  getCapabilities(): ExtensionCapabilities;
  
  /**
   * Hook registration
   */
  registerHooks(): IMonitoringHooks;

  /**
   * Custom operations (optional)
   */
  executeCustomOperation?(operation: string, params: Record<string, unknown>): Promise<unknown>;
  
  /**
   * Health check
   */
  healthCheck(): Promise<ExtensionHealthStatus>;
}

/**
 * Extension configuration
 */
export interface ExtensionConfiguration {
  readonly extensionId: string;
  readonly enabled: boolean;
  readonly priority?: number;
  readonly config?: Record<string, unknown>;
  readonly dependencies?: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Extension capabilities
 */
export interface ExtensionCapabilities {
  readonly supportsEventHooks: boolean;
  readonly supportsTargetHooks: boolean;
  readonly supportsSystemHooks: boolean;
  readonly supportsCustomOperations: boolean;
  readonly supportsAsyncHooks: boolean;
  readonly maxHookExecutionTime: number; // milliseconds
  readonly supportedEventTypes?: string[];
  readonly supportedTargetTypes?: string[];
}

/**
 * Extension health status
 */
export interface ExtensionHealthStatus {
  readonly extensionId: string;
  readonly healthy: boolean;
  readonly status: 'active' | 'inactive' | 'error';
  readonly lastExecution?: Date;
  readonly executionCount: number;
  readonly errorCount: number;
  readonly avgExecutionTime: number;
  readonly errors?: string[];
}

/**
 * Monitoring middleware interface for request/response processing
 */
export interface IMonitoringMiddleware {
  /**
   * Middleware identification
   */
  readonly middlewareId: string;
  readonly priority: number;

  /**
   * Request processing
   */
  processRequest?(request: MiddlewareRequest, context: MiddlewareContext): Promise<MiddlewareRequest>;
  
  /**
   * Response processing
   */
  processResponse?(response: MiddlewareResponse, context: MiddlewareContext): Promise<MiddlewareResponse>;
  
  /**
   * Error handling
   */
  handleError?(error: Error, context: MiddlewareContext): Promise<MiddlewareResponse | void>;
}

/**
 * Middleware request
 */
export interface MiddlewareRequest {
  readonly operation: string;
  readonly method: string;
  readonly data?: unknown;
  readonly params?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly timestamp: Date;
}

/**
 * Middleware response
 */
export interface MiddlewareResponse {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly executionTime: number;
}

/**
 * Middleware context
 */
export interface MiddlewareContext {
  readonly requestId: string;
  readonly systemId: string;
  readonly operation: string;
  readonly startTime: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Hook registry for managing and executing hooks
 */
export interface IHookRegistry {
  /**
   * Hook registration
   */
  registerHooks(hooks: IMonitoringHooks, priority?: number): string;
  unregisterHooks(hookId: string): void;
  getRegisteredHooks(): RegisteredHook[];

  /**
   * Hook execution
   */
  executeBeforeEventStore(event: MonitoringEvent, context: HookContext): Promise<MonitoringEvent | null>;
  executeAfterEventStore(event: MonitoringEvent, result: void, context: HookContext): Promise<void>;
  executeBeforeEventQuery(filter: ITransactionFilter, context: HookContext): Promise<ITransactionFilter>;
  executeAfterEventQuery(filter: ITransactionFilter, result: MonitoringQueryResult, context: HookContext): Promise<MonitoringQueryResult>;
  executeOnEventStoreError(event: MonitoringEvent, error: Error, context: HookContext): Promise<void>;
  executeOnEventQueryError(filter: ITransactionFilter, error: Error, context: HookContext): Promise<void>;

  executeBeforeTargetAdd(target: MonitoringTarget, context: HookContext): Promise<MonitoringTarget | null>;
  executeAfterTargetAdd(target: MonitoringTarget, targetId: string, context: HookContext): Promise<void>;
  executeBeforeTargetUpdate(targetId: string, updates: Partial<MonitoringTarget>, context: HookContext): Promise<Partial<MonitoringTarget>>;
  executeAfterTargetUpdate(targetId: string, updates: Partial<MonitoringTarget>, context: HookContext): Promise<void>;
  executeBeforeTargetRemove(targetId: string, context: HookContext): Promise<boolean>;
  executeAfterTargetRemove(targetId: string, context: HookContext): Promise<void>;
  executeOnTargetError(targetId: string, error: Error, context: HookContext): Promise<void>;

  executeBeforeSystemStart(context: HookContext): Promise<void>;
  executeAfterSystemStart(context: HookContext): Promise<void>;
  executeBeforeSystemStop(context: HookContext): Promise<void>;
  executeAfterSystemStop(context: HookContext): Promise<void>;
  executeOnSystemStateChange(previousState: MonitoringState, newState: MonitoringState, context: HookContext): Promise<void>;
  executeOnSystemError(error: Error, context: HookContext): Promise<void>;

  executeOnFilterApply(filter: ITransactionFilter, context: HookContext): Promise<ITransactionFilter>;
  executeOnDataTransform(data: unknown, transformType: DataTransformType, context: HookContext): Promise<unknown>;
  executeOnResultTransform(result: unknown, resultType: ResultTransformType, context: HookContext): Promise<unknown>;

  executeOnPerformanceMetrics(metrics: PerformanceSnapshot, context: HookContext): Promise<void>;
  executeOnHealthCheck(healthStatus: HealthSnapshot, context: HookContext): Promise<void>;
  executeOnConnectionEvent(event: ConnectionEvent, context: HookContext): Promise<void>;

  /**
   * Hook management
   */
  enableHooks(hookId: string): void;
  disableHooks(hookId: string): void;
  getHookStatistics(): HookStatistics[];
}

/**
 * Registered hook information
 */
export interface RegisteredHook {
  readonly hookId: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly registeredAt: Date;
  readonly executionCount: number;
  readonly errorCount: number;
  readonly avgExecutionTime: number;
  readonly hooks: string[]; // list of hook types registered
}

/**
 * Hook execution statistics
 */
export interface HookStatistics {
  readonly hookId: string;
  readonly hookType: string;
  readonly executionCount: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly avgExecutionTime: number;
  readonly maxExecutionTime: number;
  readonly minExecutionTime: number;
  readonly lastExecution?: Date;
  readonly recentErrors: HookError[];
}

/**
 * Hook execution error
 */
export interface HookError {
  readonly timestamp: Date;
  readonly error: string;
  readonly stack?: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Extension registry for managing monitoring extensions
 */
export interface IExtensionRegistry {
  /**
   * Extension management
   */
  registerExtension(extension: IMonitoringExtension): Promise<string>;
  unregisterExtension(extensionId: string): Promise<void>;
  getExtension(extensionId: string): IMonitoringExtension | null;
  getExtensions(): IMonitoringExtension[];
  getActiveExtensions(): IMonitoringExtension[];

  /**
   * Extension lifecycle
   */
  initializeExtension(extensionId: string): Promise<void>;
  activateExtension(extensionId: string): Promise<void>;
  deactivateExtension(extensionId: string): Promise<void>;
  disposeExtension(extensionId: string): Promise<void>;

  /**
   * Extension operations
   */
  executeCustomOperation(extensionId: string, operation: string, params: Record<string, unknown>): Promise<unknown>;
  
  /**
   * Extension health
   */
  checkExtensionHealth(extensionId: string): Promise<ExtensionHealthStatus>;
  checkAllExtensionsHealth(): Promise<ExtensionHealthStatus[]>;

  /**
   * Extension configuration
   */
  updateExtensionConfig(extensionId: string, config: Partial<ExtensionConfiguration>): Promise<void>;
  getExtensionConfig(extensionId: string): ExtensionConfiguration | null;
}

/**
 * Monitoring pipeline interface for chaining operations
 */
export interface IMonitoringPipeline {
  /**
   * Pipeline configuration
   */
  readonly pipelineId: string;
  readonly stages: PipelineStage[];

  /**
   * Pipeline execution
   */
  execute(input: PipelineInput): Promise<PipelineOutput>;
  executeStage(stageId: string, input: PipelineInput): Promise<PipelineOutput>;

  /**
   * Pipeline management
   */
  addStage(stage: PipelineStage): void;
  removeStage(stageId: string): void;
  getStage(stageId: string): PipelineStage | null;
  getStages(): PipelineStage[];

  /**
   * Pipeline state
   */
  isRunning(): boolean;
  getExecutionHistory(): PipelineExecution[];
  getPerformanceMetrics(): PipelineMetrics;
}

/**
 * Pipeline stage
 */
export interface PipelineStage {
  readonly stageId: string;
  readonly name: string;
  readonly type: PipelineStageType;
  readonly priority: number;
  readonly enabled: boolean;
  readonly config?: Record<string, unknown>;
  
  execute(input: PipelineInput, context: PipelineContext): Promise<PipelineOutput>;
  validate(input: PipelineInput): Promise<PipelineValidationResult>;
  healthCheck(): Promise<PipelineStageHealth>;
}

/**
 * Pipeline stage types
 */
export enum PipelineStageType {
  FILTER = 'filter',
  TRANSFORM = 'transform',
  VALIDATE = 'validate',
  ENRICH = 'enrich',
  ROUTE = 'route',
  STORE = 'store',
  NOTIFY = 'notify',
  CUSTOM = 'custom'
}

/**
 * Pipeline input
 */
export interface PipelineInput {
  readonly data: unknown;
  readonly metadata?: Record<string, unknown>;
  readonly context?: Record<string, unknown>;
}

/**
 * Pipeline output
 */
export interface PipelineOutput {
  readonly data: unknown;
  readonly success: boolean;
  readonly errors?: string[];
  readonly warnings?: string[];
  readonly metadata?: Record<string, unknown>;
  readonly stageResults?: Record<string, unknown>;
}

/**
 * Pipeline execution context
 */
export interface PipelineContext {
  readonly pipelineId: string;
  readonly executionId: string;
  readonly startTime: Date;
  readonly currentStage: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Pipeline execution record
 */
export interface PipelineExecution {
  readonly executionId: string;
  readonly pipelineId: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly success: boolean;
  readonly stages: PipelineStageExecution[];
  readonly errors?: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Pipeline stage execution record
 */
export interface PipelineStageExecution {
  readonly stageId: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly success: boolean;
  readonly duration: number;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Pipeline metrics
 */
export interface PipelineMetrics {
  readonly pipelineId: string;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly avgExecutionTime: number;
  readonly maxExecutionTime: number;
  readonly minExecutionTime: number;
  readonly throughput: number; // executions per second
  readonly stageMetrics: Record<string, PipelineStageMetrics>;
}

/**
 * Pipeline stage metrics
 */
export interface PipelineStageMetrics {
  readonly stageId: string;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly avgExecutionTime: number;
  readonly maxExecutionTime: number;
  readonly minExecutionTime: number;
  readonly successRate: number;
}

/**
 * Pipeline validation result
 */
export interface PipelineValidationResult {
  readonly valid: boolean;
  readonly errors?: string[];
  readonly warnings?: string[];
}

/**
 * Pipeline stage health
 */
export interface PipelineStageHealth {
  readonly stageId: string;
  readonly healthy: boolean;
  readonly status: 'active' | 'inactive' | 'error';
  readonly lastExecution?: Date;
  readonly executionCount: number;
  readonly errorCount: number;
  readonly avgExecutionTime: number;
}

/**
 * Abstract base class for monitoring extensions
 */
export abstract class BaseMonitoringExtension implements IMonitoringExtension {
  protected config: ExtensionConfiguration;
  protected initialized = false;
  protected active = false;

  constructor(config: ExtensionConfiguration) {
    this.config = config;
  }

  // Extension identification - must be implemented by concrete classes
  abstract readonly extensionId: string;
  abstract readonly extensionType: string;
  abstract readonly version: string;
  abstract readonly description?: string;

  // Extension lifecycle - must be implemented by concrete classes
  abstract initialize(config: ExtensionConfiguration): Promise<void>;
  abstract activate(): Promise<void>;
  abstract deactivate(): Promise<void>;
  abstract dispose(): Promise<void>;

  // Extension state
  isInitialized(): boolean {
    return this.initialized;
  }

  isActive(): boolean {
    return this.active;
  }

  getConfiguration(): Readonly<ExtensionConfiguration> {
    return Object.freeze({ ...this.config });
  }

  // Abstract methods that must be implemented by concrete extensions
  abstract getCapabilities(): ExtensionCapabilities;
  abstract registerHooks(): IMonitoringHooks;
  abstract healthCheck(): Promise<ExtensionHealthStatus>;

  /**
   * Optional custom operations
   */
  async executeCustomOperation?(operation: string, params: Record<string, unknown>): Promise<unknown> {
    throw new Error(`Custom operation '${operation}' not supported by this extension`);
  }

  /**
   * Common utility methods
   */
  protected createHookContext(operation: string, metadata?: Record<string, unknown>): HookContext {
    return {
      systemId: this.extensionId,
      hookType: operation,
      timestamp: new Date(),
      ...(metadata && { metadata })
    };
  }

  protected validateConfiguration(config: ExtensionConfiguration): boolean {
    return !!(config.extensionId && typeof config.enabled === 'boolean');
  }
}
