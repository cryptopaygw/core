/**
 * Monitoring Events and Notification Interface
 * 
 * This interface defines standardized event publishing and notification mechanisms
 * for external monitoring systems. It provides a comprehensive event-driven
 * architecture with pluggable notification providers and advanced routing capabilities.
 * 
 * Design Principles:
 * - Event-driven: Built on publish-subscribe patterns for loose coupling
 * - Pluggable notifications: Supports multiple notification channels
 * - Advanced routing: Event routing based on filters, priorities, and conditions
 * - Resilient delivery: Retry mechanisms, circuit breakers, and dead letter queues
 * - Performance-optimized: Batch processing, compression, and async patterns
 * 
 * @example
 * ```typescript
 * const eventPublisher: IEventPublisher = new ExternalEventPublisher({
 *   publishers: [
 *     new WebhookPublisher({ url: 'https://api.external.com/webhooks' }),
 *     new SlackPublisher({ webhook: 'https://hooks.slack.com/...' })
 *   ]
 * });
 * 
 * await eventPublisher.publish({
 *   type: 'transaction',
 *   data: { hash: '0x123...', amount: '1.5' },
 *   metadata: { chain: 'ethereum', severity: 'high' }
 * });
 * ```
 */

import { 
  MonitoringEvent, 
  MonitoringTarget,
  ITransactionFilter,
  MonitoringEventType
} from './monitoring-system.interface';

/**
 * Core event publisher interface for external monitoring systems
 */
export interface IEventPublisher {
  /**
   * Publisher identification
   */
  readonly publisherId: string;
  readonly publisherType: string;
  readonly version: string;

  /**
   * Lifecycle management
   */
  initialize(config: EventPublisherConfiguration): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;

  /**
   * Publisher state
   */
  isInitialized(): boolean;
  isRunning(): boolean;
  getConfiguration(): Readonly<EventPublisherConfiguration>;

  /**
   * Event publishing
   */
  publish(event: PublishableEvent): Promise<PublishResult>;
  publishBatch(events: PublishableEvent[]): Promise<BatchPublishResult>;
  schedulePublish(event: PublishableEvent, scheduledTime: Date): Promise<ScheduledPublishResult>;

  /**
   * Event routing and filtering
   */
  addRoute(route: EventRoute): Promise<string>;
  removeRoute(routeId: string): Promise<void>;
  updateRoute(routeId: string, updates: Partial<EventRoute>): Promise<void>;
  getRoutes(): Promise<EventRoute[]>;

  /**
   * Subscription management
   */
  subscribe(filter: EventSubscriptionFilter, handler: EventHandler): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  getSubscriptions(): Promise<EventSubscription[]>;

  /**
   * Health and metrics
   */
  healthCheck(): Promise<PublisherHealthStatus>;
  getMetrics(): Promise<PublisherMetrics>;
  getFailedEvents(): Promise<FailedEvent[]>;
  retryFailedEvents(eventIds?: string[]): Promise<BatchPublishResult>;
}

/**
 * Event publisher configuration
 */
export interface EventPublisherConfiguration {
  readonly publisherId: string;
  readonly publisherType: string;
  readonly routes: EventRoute[];
  readonly defaultRoute?: string;
  readonly performance?: EventPerformanceConfiguration;
  readonly retry?: EventRetryConfiguration;
  readonly deadLetter?: DeadLetterConfiguration;
  readonly filters?: GlobalEventFilter[];
  readonly transforms?: EventTransformConfiguration[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event performance configuration
 */
export interface EventPerformanceConfiguration {
  readonly batchSize?: number;
  readonly batchTimeout?: number; // milliseconds
  readonly maxConcurrency?: number;
  readonly bufferSize?: number;
  readonly compression?: EventCompressionType;
  readonly serialization?: EventSerializationType;
}

/**
 * Event compression types
 */
export enum EventCompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  DEFLATE = 'deflate',
  BROTLI = 'brotli'
}

/**
 * Event serialization types
 */
export enum EventSerializationType {
  JSON = 'json',
  MSGPACK = 'msgpack',
  PROTOBUF = 'protobuf',
  AVRO = 'avro'
}

/**
 * Event retry configuration
 */
export interface EventRetryConfiguration {
  readonly enabled: boolean;
  readonly maxRetries: number;
  readonly initialDelay: number; // milliseconds
  readonly maxDelay: number; // milliseconds
  readonly backoffMultiplier: number;
  readonly jitter?: boolean;
  readonly retryableErrors?: string[]; // error types that should be retried
  readonly nonRetryableErrors?: string[]; // error types that should not be retried
}

/**
 * Dead letter configuration
 */
export interface DeadLetterConfiguration {
  readonly enabled: boolean;
  readonly maxRetries: number;
  readonly ttl?: number; // milliseconds
  readonly storage?: DeadLetterStorage;
  readonly notification?: DeadLetterNotification;
}

/**
 * Dead letter storage configuration
 */
export interface DeadLetterStorage {
  readonly type: 'memory' | 'file' | 'database' | 'external';
  readonly config?: Record<string, unknown>;
  readonly maxSize?: number; // maximum number of events
  readonly maxAge?: number; // milliseconds
}

/**
 * Dead letter notification
 */
export interface DeadLetterNotification {
  readonly enabled: boolean;
  readonly threshold: number; // notify after N failed events
  readonly channels: string[]; // notification channel IDs
  readonly template?: string;
}

/**
 * Global event filter
 */
export interface GlobalEventFilter {
  readonly filterId: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly condition: FilterCondition;
  readonly action: FilterAction;
}

/**
 * Filter condition
 */
export interface FilterCondition {
  readonly type: FilterConditionType;
  readonly field?: string;
  readonly operator?: FilterOperator;
  readonly value?: unknown;
  readonly values?: unknown[];
  readonly pattern?: string; // regex pattern
  readonly script?: string; // JavaScript expression
  readonly conditions?: FilterCondition[]; // for compound conditions
}

/**
 * Filter condition types
 */
export enum FilterConditionType {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  MATCHES = 'matches',
  NOT_MATCHES = 'not_matches',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  SCRIPT = 'script'
}

/**
 * Filter operators
 */
export enum FilterOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

/**
 * Filter actions
 */
export enum FilterAction {
  ALLOW = 'allow',
  DENY = 'deny',
  TRANSFORM = 'transform',
  ROUTE = 'route',
  DELAY = 'delay',
  PRIORITIZE = 'prioritize'
}

/**
 * Event transformation configuration
 */
export interface EventTransformConfiguration {
  readonly transformId: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly condition?: FilterCondition;
  readonly transforms: EventTransform[];
}

/**
 * Event transform
 */
export interface EventTransform {
  readonly type: EventTransformType;
  readonly field?: string;
  readonly targetField?: string;
  readonly value?: unknown;
  readonly script?: string; // JavaScript expression
  readonly template?: string; // template string
  readonly format?: string;
}

/**
 * Event transform types
 */
export enum EventTransformType {
  SET = 'set',
  UNSET = 'unset',
  RENAME = 'rename',
  MAP = 'map',
  CONCAT = 'concat',
  SPLIT = 'split',
  FORMAT = 'format',
  CONVERT = 'convert',
  SCRIPT = 'script',
  TEMPLATE = 'template',
  HASH = 'hash',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt'
}

/**
 * Event route configuration
 */
export interface EventRoute {
  readonly routeId: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly condition?: FilterCondition;
  readonly destinations: EventDestination[];
  readonly failover?: FailoverConfiguration;
  readonly rateLimit?: RateLimitConfiguration;
}

/**
 * Event destination
 */
export interface EventDestination {
  readonly destinationId: string;
  readonly type: EventDestinationType;
  readonly config: EventDestinationConfig;
  readonly enabled: boolean;
  readonly priority: number;
  readonly filters?: FilterCondition[];
  readonly transforms?: EventTransform[];
}

/**
 * Event destination types
 */
export enum EventDestinationType {
  WEBHOOK = 'webhook',
  HTTP = 'http',
  KAFKA = 'kafka',
  RABBITMQ = 'rabbitmq',
  REDIS = 'redis',
  ELASTICSEARCH = 'elasticsearch',
  DATABASE = 'database',
  FILE = 'file',
  SLACK = 'slack',
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  SMS = 'sms',
  CUSTOM = 'custom'
}

/**
 * Event destination configuration
 */
export interface EventDestinationConfig {
  readonly endpoint?: string;
  readonly authentication?: DestinationAuthentication;
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly retries?: number;
  readonly format?: EventFormat;
  readonly template?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Destination authentication
 */
export interface DestinationAuthentication {
  readonly type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2' | 'custom';
  readonly credentials?: Record<string, string>;
  readonly headers?: Record<string, string>;
}

/**
 * Event format configuration
 */
export interface EventFormat {
  readonly type: EventFormatType;
  readonly template?: string;
  readonly fields?: string[];
  readonly options?: Record<string, unknown>;
}

/**
 * Event format types
 */
export enum EventFormatType {
  JSON = 'json',
  XML = 'xml',
  YAML = 'yaml',
  TEXT = 'text',
  CSV = 'csv',
  CUSTOM = 'custom'
}

/**
 * Failover configuration
 */
export interface FailoverConfiguration {
  readonly enabled: boolean;
  readonly strategy: FailoverStrategy;
  readonly healthCheckInterval: number; // milliseconds
  readonly fallbackDestinations: string[]; // destination IDs
  readonly circuitBreaker?: CircuitBreakerConfiguration;
}

/**
 * Failover strategies
 */
export enum FailoverStrategy {
  ROUND_ROBIN = 'round_robin',
  PRIORITY = 'priority',
  RANDOM = 'random',
  LEAST_CONNECTIONS = 'least_connections',
  LEAST_RESPONSE_TIME = 'least_response_time'
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfiguration {
  readonly enabled: boolean;
  readonly failureThreshold: number; // number of failures
  readonly recoveryTimeout: number; // milliseconds
  readonly halfOpenMaxCalls: number;
  readonly resetTimeout: number; // milliseconds
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfiguration {
  readonly enabled: boolean;
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly strategy: RateLimitStrategy;
  readonly skipSuccessful?: boolean;
}

/**
 * Rate limit strategies
 */
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket'
}

/**
 * Publishable event
 */
export interface PublishableEvent extends MonitoringEvent {
  readonly priority?: EventPriority;
  readonly tags?: string[];
  readonly routing?: EventRoutingHint;
  readonly ttl?: number; // time to live in milliseconds
  readonly delay?: number; // delay before publishing in milliseconds
}

/**
 * Event priorities
 */
export enum EventPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

/**
 * Event routing hint
 */
export interface EventRoutingHint {
  readonly preferredRoutes?: string[];
  readonly excludeRoutes?: string[];
  readonly forceRoute?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Publish result
 */
export interface PublishResult {
  readonly eventId: string;
  readonly success: boolean;
  readonly timestamp: Date;
  readonly destinations: DestinationResult[];
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Destination result
 */
export interface DestinationResult {
  readonly destinationId: string;
  readonly success: boolean;
  readonly timestamp: Date;
  readonly responseTime: number; // milliseconds
  readonly statusCode?: number;
  readonly error?: string;
  readonly retries: number;
}

/**
 * Batch publish result
 */
export interface BatchPublishResult {
  readonly batchId: string;
  readonly totalEvents: number;
  readonly successfulEvents: number;
  readonly failedEvents: number;
  readonly results: PublishResult[];
  readonly executionTime: number; // milliseconds
  readonly errors: BatchPublishError[];
}

/**
 * Batch publish error
 */
export interface BatchPublishError {
  readonly eventId: string;
  readonly error: string;
  readonly timestamp: Date;
}

/**
 * Scheduled publish result
 */
export interface ScheduledPublishResult {
  readonly scheduleId: string;
  readonly eventId: string;
  readonly scheduledTime: Date;
  readonly status: 'scheduled' | 'cancelled' | 'completed' | 'failed';
  readonly createdAt: Date;
}

/**
 * Event subscription filter
 */
export interface EventSubscriptionFilter {
  readonly eventTypes?: MonitoringEventType[];
  readonly sources?: string[];
  readonly tags?: string[];
  readonly priorities?: EventPriority[];
  readonly condition?: FilterCondition;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: PublishableEvent) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  readonly subscriptionId: string;
  readonly filter: EventSubscriptionFilter;
  readonly createdAt: Date;
  readonly isActive: boolean;
  readonly eventCount: number;
  readonly lastEvent?: Date;
}

/**
 * Failed event
 */
export interface FailedEvent {
  readonly eventId: string;
  readonly event: PublishableEvent;
  readonly error: string;
  readonly retries: number;
  readonly maxRetries: number;
  readonly nextRetry?: Date;
  readonly failedAt: Date;
  readonly destinations: FailedDestination[];
}

/**
 * Failed destination
 */
export interface FailedDestination {
  readonly destinationId: string;
  readonly error: string;
  readonly retries: number;
  readonly lastAttempt: Date;
  readonly nextRetry?: Date;
}

/**
 * Publisher health status
 */
export interface PublisherHealthStatus {
  readonly publisherId: string;
  readonly healthy: boolean;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: Date;
  readonly uptime: number; // milliseconds
  readonly checks: PublisherHealthCheck[];
}

/**
 * Publisher health check
 */
export interface PublisherHealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly message?: string;
  readonly duration: number; // milliseconds
  readonly details?: Record<string, unknown>;
}

/**
 * Publisher metrics
 */
export interface PublisherMetrics {
  readonly publisherId: string;
  readonly timestamp: Date;
  readonly events: EventPublishMetrics;
  readonly destinations: DestinationMetrics[];
  readonly performance: PublisherPerformanceMetrics;
  readonly errors: PublisherErrorMetrics;
}

/**
 * Event publish metrics
 */
export interface EventPublishMetrics {
  readonly totalEvents: number;
  readonly eventsPerSecond: number;
  readonly eventsByType: Record<MonitoringEventType, number>;
  readonly eventsByPriority: Record<EventPriority, number>;
  readonly successfulEvents: number;
  readonly failedEvents: number;
  readonly retryEvents: number;
  readonly deadLetterEvents: number;
}

/**
 * Destination metrics
 */
export interface DestinationMetrics {
  readonly destinationId: string;
  readonly type: EventDestinationType;
  readonly totalEvents: number;
  readonly successfulEvents: number;
  readonly failedEvents: number;
  readonly avgResponseTime: number;
  readonly maxResponseTime: number;
  readonly minResponseTime: number;
  readonly uptime: number; // percentage
  readonly errorRate: number; // percentage
}

/**
 * Publisher performance metrics
 */
export interface PublisherPerformanceMetrics {
  readonly throughput: number; // events per second
  readonly avgLatency: number; // milliseconds
  readonly p95Latency: number; // milliseconds
  readonly p99Latency: number; // milliseconds
  readonly maxLatency: number; // milliseconds
  readonly queueSize: number;
  readonly processingTime: number; // average milliseconds
}

/**
 * Publisher error metrics
 */
export interface PublisherErrorMetrics {
  readonly totalErrors: number;
  readonly errorsPerMinute: number;
  readonly errorsByType: Record<string, number>;
  readonly errorsByDestination: Record<string, number>;
  readonly recentErrors: RecentPublishError[];
}

/**
 * Recent publish error
 */
export interface RecentPublishError {
  readonly timestamp: Date;
  readonly eventId: string;
  readonly destinationId?: string;
  readonly error: string;
  readonly retries: number;
}

/**
 * Notification provider interface
 */
export interface INotificationProvider {
  /**
   * Provider identification
   */
  readonly providerId: string;
  readonly providerType: string;
  readonly version: string;

  /**
   * Lifecycle management
   */
  initialize(config: NotificationProviderConfiguration): Promise<void>;
  dispose(): Promise<void>;

  /**
   * Provider state
   */
  isInitialized(): boolean;
  getConfiguration(): Readonly<NotificationProviderConfiguration>;

  /**
   * Notification delivery
   */
  send(notification: Notification): Promise<NotificationResult>;
  sendBatch(notifications: Notification[]): Promise<BatchNotificationResult>;

  /**
   * Template management
   */
  createTemplate(template: NotificationTemplate): Promise<string>;
  updateTemplate(templateId: string, template: Partial<NotificationTemplate>): Promise<void>;
  deleteTemplate(templateId: string): Promise<void>;
  getTemplate(templateId: string): Promise<NotificationTemplate | null>;

  /**
   * Health and capabilities
   */
  healthCheck(): Promise<NotificationProviderHealth>;
  getCapabilities(): NotificationCapabilities;
  testConnection(): Promise<boolean>;
}

/**
 * Notification provider configuration
 */
export interface NotificationProviderConfiguration {
  readonly providerId: string;
  readonly providerType: string;
  readonly authentication?: DestinationAuthentication;
  readonly defaults?: NotificationDefaults;
  readonly rateLimit?: RateLimitConfiguration;
  readonly retry?: EventRetryConfiguration;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Notification defaults
 */
export interface NotificationDefaults {
  readonly from?: string;
  readonly subject?: string;
  readonly priority?: NotificationPriority;
  readonly format?: NotificationFormat;
  readonly template?: string;
}

/**
 * Notification priorities
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification formats
 */
export enum NotificationFormat {
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
  JSON = 'json'
}

/**
 * Notification interface
 */
export interface Notification {
  readonly id?: string;
  readonly to: string | string[];
  readonly from?: string;
  readonly subject?: string;
  readonly content: string;
  readonly format: NotificationFormat;
  readonly priority: NotificationPriority;
  readonly templateId?: string;
  readonly templateData?: Record<string, unknown>;
  readonly attachments?: NotificationAttachment[];
  readonly metadata?: Record<string, unknown>;
  readonly scheduledTime?: Date;
  readonly ttl?: number; // milliseconds
}

/**
 * Notification attachment
 */
export interface NotificationAttachment {
  readonly name: string;
  readonly contentType: string;
  readonly data: string | Buffer;
  readonly size?: number;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  readonly templateId?: string;
  readonly name: string;
  readonly description?: string;
  readonly format: NotificationFormat;
  readonly subject?: string;
  readonly content: string;
  readonly variables: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Notification result
 */
export interface NotificationResult {
  readonly notificationId: string;
  readonly success: boolean;
  readonly timestamp: Date;
  readonly deliveryTime: number; // milliseconds
  readonly messageId?: string;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Batch notification result
 */
export interface BatchNotificationResult {
  readonly batchId: string;
  readonly totalNotifications: number;
  readonly successfulNotifications: number;
  readonly failedNotifications: number;
  readonly results: NotificationResult[];
  readonly executionTime: number; // milliseconds
}

/**
 * Notification provider health
 */
export interface NotificationProviderHealth {
  readonly providerId: string;
  readonly healthy: boolean;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: Date;
  readonly responseTime: number; // milliseconds
  readonly error?: string;
}

/**
 * Notification capabilities
 */
export interface NotificationCapabilities {
  readonly supportsHtml: boolean;
  readonly supportsMarkdown: boolean;
  readonly supportsAttachments: boolean;
  readonly supportsScheduling: boolean;
  readonly supportsBatch: boolean;
  readonly supportsTemplates: boolean;
  readonly maxRecipients: number;
  readonly maxContentSize: number; // bytes
  readonly maxAttachmentSize: number; // bytes
  readonly supportedFormats: NotificationFormat[];
}

/**
 * Event aggregator interface for event correlation and analysis
 */
export interface IEventAggregator {
  /**
   * Aggregator identification
   */
  readonly aggregatorId: string;
  readonly version: string;

  /**
   * Event aggregation
   */
  aggregate(events: MonitoringEvent[], rules: AggregationRule[]): Promise<AggregatedEvent[]>;
  correlate(events: MonitoringEvent[], correlationRules: CorrelationRule[]): Promise<CorrelatedEvent[]>;
  
  /**
   * Rule management
   */
  addAggregationRule(rule: AggregationRule): Promise<string>;
  removeAggregationRule(ruleId: string): Promise<void>;
  addCorrelationRule(rule: CorrelationRule): Promise<string>;
  removeCorrelationRule(ruleId: string): Promise<void>;
}

/**
 * Aggregation rule
 */
export interface AggregationRule {
  readonly ruleId?: string;
  readonly name: string;
  readonly condition: FilterCondition;
  readonly window: TimeWindow;
  readonly aggregationType: AggregationType;
  readonly groupBy: string[];
  readonly threshold?: number;
  readonly outputEvent?: AggregatedEventTemplate;
}

/**
 * Time window configuration
 */
export interface TimeWindow {
  readonly type: 'tumbling' | 'sliding' | 'session';
  readonly duration: number; // milliseconds
  readonly slide?: number; // milliseconds (for sliding windows)
  readonly sessionTimeout?: number; // milliseconds (for session windows)
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
  DISTINCT_COUNT = 'distinct_count',
  PERCENTILE = 'percentile',
  FIRST = 'first',
  LAST = 'last'
}

/**
 * Aggregated event template
 */
export interface AggregatedEventTemplate {
  readonly type: MonitoringEventType;
  readonly data: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Correlation rule
 */
export interface CorrelationRule {
  readonly ruleId?: string;
  readonly name: string;
  readonly patterns: EventPattern[];
  readonly timeWindow: TimeWindow;
  readonly outputEvent?: CorrelatedEventTemplate;
}

/**
 * Event pattern
 */
export interface EventPattern {
  readonly patternId: string;
  readonly condition: FilterCondition;
  readonly optional?: boolean;
  readonly sequence?: number;
}

/**
 * Correlated event template
 */
export interface CorrelatedEventTemplate {
  readonly type: MonitoringEventType;
  readonly data: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Aggregated event
 */
export interface AggregatedEvent extends MonitoringEvent {
  readonly aggregationRule: string;
  readonly sourceEvents: string[]; // event IDs
  readonly aggregationData: AggregationData;
}

/**
 * Aggregation data
 */
export interface AggregationData {
  readonly count: number;
  readonly timeWindow: TimeWindow;
  readonly groupBy: Record<string, unknown>;
  readonly aggregatedValues: Record<string, number>;
  readonly startTime: Date;
  readonly endTime: Date;
}

/**
 * Correlated event
 */
export interface CorrelatedEvent extends MonitoringEvent {
  readonly correlationRule: string;
  readonly sourceEvents: string[]; // event IDs
  readonly correlationData: CorrelationData;
}

/**
 * Correlation data
 */
export interface CorrelationData {
  readonly matchedPatterns: string[];
  readonly confidence: number; // 0-1
  readonly timeWindow: TimeWindow;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly relationships: EventRelationship[];
}

/**
 * Event relationship
 */
export interface EventRelationship {
  readonly fromEventId: string;
  readonly toEventId: string;
  readonly relationshipType: string;
  readonly confidence: number; // 0-1
  readonly metadata?: Record<string, unknown>;
}
