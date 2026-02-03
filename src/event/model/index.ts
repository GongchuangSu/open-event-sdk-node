/**
 * 事件数据模型导出
 */

// 通用类型
export type { IdentityType, V7ExtendedAttribute, V7Identity } from './common';
export type {
  V7MessageContent,
  V7MessageContentText,
  V7MessageContentImage,
  V7MessageContentFile,
  V7ChatMessageMention,
} from './common';

// 事件编码
export { EventCodes } from './event-codes';
export type { EventCode } from './event-codes';

// IM 事件数据
export type {
  V7NotificationChatInfo,
  V7NotificationMessageInfo,
  V7NotificationAppChatMessageCreateData,
  V7NotificationAppChatCreateData,
  V7NotificationAppGroupChatData,
  V7NotificationAppGroupChatMemberUserData,
  V7NotificationAppGroupChatMemberRobotData,
} from './im';
