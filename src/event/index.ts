/**
 * 事件模块导出
 */

// 事件实体
export type { Event, TypedEvent } from './event';
export { buildEventCode, createEvent, createTypedEvent } from './event';

// 处理器
export type { Handler, HandlerFunc } from './handler';
export { createHandler, FuncHandler } from './handler';

// 分发器
export { Dispatcher } from './dispatcher';
export type { TypedHandlerFunc } from './dispatcher';

// 事件数据模型
export * from './model';
