/**
 * Open Event SDK for Node.js
 *
 * @example
 * ```typescript
 * import { Client, Dispatcher } from 'open-event-sdk';
 *
 * const dispatcher = new Dispatcher()
 *   .onV7AppChatMessageCreate((event) => {
 *     console.log('收到消息:', event.parsedData.message.content);
 *   });
 *
 * const client = new Client({
 *   appId: 'your_app_id',
 *   appSecret: 'your_app_secret',
 *   dispatcher,
 * });
 *
 * await client.start();
 * ```
 */

// 主客户端
export { Client } from './client';

// 类型
export type { ClientOptions, ReconnectConfig, TimeoutConfig } from './types';

// 事件模块
export {
  // 事件实体
  buildEventCode,
  createEvent,
  createTypedEvent,
  // 处理器
  createHandler,
  FuncHandler,
  // 分发器
  Dispatcher,
  // 事件数据模型
  EventCodes,
} from './event';
export type {
  Event,
  TypedEvent,
  Handler,
  HandlerFunc,
  TypedHandlerFunc,
  // 事件数据模型类型
  EventCode,
  IdentityType,
  V7ExtendedAttribute,
  V7Identity,
  V7MessageContent,
  V7MessageContentText,
  V7MessageContentImage,
  V7MessageContentFile,
  V7ChatMessageMention,
  V7NotificationChatInfo,
  V7NotificationMessageInfo,
  V7NotificationAppChatMessageCreateData,
  V7NotificationAppChatCreateData,
  V7NotificationAppGroupChatData,
  V7NotificationAppGroupChatMemberUserData,
  V7NotificationAppGroupChatMemberRobotData,
} from './event';

// 日志模块
export { LogLevel, DefaultLogger, NopLogger } from './logger';
export type { Logger } from './logger';

// 错误类型
export {
  OpenEventError,
  ClientError,
  ServerError,
  SignatureError,
  DecryptError,
  ConnectionError,
  HandlerNotSetError,
  ReconnectExceededError,
  ClientClosedError,
  AlreadyConnectedError,
} from './errors';

// 协议常量
export { DEFAULT_ENDPOINT, DefaultConfig, GoAwayReason } from './protocol';
export type { GoAwayReasonType } from './protocol';

// 加解密（用于高级用例和测试）
export { signForWebSocket, verifySignature, decrypt, hmacSha256, md5 } from './crypto';
export type { SignForWebSocketParams, VerifySignatureParams, DecryptParams } from './crypto';
