/**
 * 事件编码常量
 */

/**
 * 事件编码
 */
export const EventCodes = {
  // ========== 应用消息事件 ==========
  /** 用户在会话（单聊/群聊）中给应用发送消息 */
  V7_APP_CHAT_MESSAGE_CREATE: 'kso.app_chat.message.create',

  /** 首次创建用户和机器人的会话 */
  V7_APP_CHAT_CREATE: 'kso.app_chat.create',

  // ========== 应用群聊事件 ==========
  /** 群聊解散 */
  V7_APP_GROUP_CHAT_DELETE: 'kso.xz.app.group_chat.delete',

  /** 用户进群 */
  V7_APP_GROUP_CHAT_MEMBER_USER_CREATE: 'kso.xz.app.group_chat.member.user.create',

  /** 用户退群 */
  V7_APP_GROUP_CHAT_MEMBER_USER_DELETE: 'kso.xz.app.group_chat.member.user.delete',

  /** 机器人进群 */
  V7_APP_GROUP_CHAT_MEMBER_ROBOT_CREATE: 'kso.xz.app.group_chat.member.robot.create',

  /** 机器人退群 */
  V7_APP_GROUP_CHAT_MEMBER_ROBOT_DELETE: 'kso.xz.app.group_chat.member.robot.delete',
} as const;

/**
 * 事件编码类型
 */
export type EventCode = (typeof EventCodes)[keyof typeof EventCodes];
