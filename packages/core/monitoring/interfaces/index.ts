/**
 * External Monitoring System Interfaces
 * 
 * This module exports all interfaces and types required for implementing
 * external monitoring systems for the crypto payment gateway library.
 * 
 * These interfaces provide a comprehensive foundation for:
 * - External monitoring system integration
 * - Pluggable monitoring providers (Elasticsearch, InfluxDB, etc.)
 * - Event-driven architectures with hooks and extensions
 * - Advanced event publishing and notifications
 * - Performance monitoring and scalability
 * - Error handling and resilience patterns
 * 
 * Usage:
 * ```typescript
 * import { 
 *   IMonitoringSystem, 
 *   IMonitoringProvider, 
 *   IEventPublisher 
 * } from '@cryptopaygw/core/monitoring/interfaces';
 * ```
 */

// Core monitoring system interfaces
export * from './monitoring-system.interface';

// Provider interfaces (with explicit re-exports to avoid conflicts)
export type {
  IMonitoringProvider,
  ProviderConfiguration,
  ProviderCapabilities,
  CompressionType,
  AuthenticationType,
  ProviderQuery,
  ProviderQueryResult,
  IndexSchema,
  FieldType,
  BaseMonitoringProvider
} from './monitoring-provider.interface';

// Hook and extension interfaces
export type {
  IMonitoringHooks,
  IMonitoringExtension,
  IHookRegistry,
  IExtensionRegistry,
  IMonitoringMiddleware,
  IMonitoringPipeline,
  HookContext,
  ExtensionConfiguration,
  ExtensionCapabilities,
  PipelineStage,
  PipelineStageType,
  BaseMonitoringExtension
} from './monitoring-hooks.interface';

// Event and notification interfaces  
export type {
  IEventPublisher,
  INotificationProvider,
  IEventAggregator,
  PublishableEvent,
  EventRoute,
  Notification,
  EventPublisherConfiguration,
  EventDestinationType,
  FilterCondition,
  FilterConditionType,
  EventPriority,
  NotificationPriority,
  NotificationFormat
} from './monitoring-events.interface';

// Re-export core system types for convenience
export type {
  IMonitoringSystem,
  IMonitoringConfiguration,
  MonitoringTarget,
  MonitoringEvent,
  MonitoringState,
  ITransactionFilter,
  MonitoringEventType,
  MonitoringTargetType,
  TransactionType,
  TransactionStatus
} from './monitoring-system.interface';
