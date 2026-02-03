/**
 * IM 相关事件数据结构
 */

import type { V7Identity, V7MessageContent, V7ChatMessageMention } from './common';

// ================== 应用消息事件数据结构 ==================

/**
 * 会话信息
 */
export interface V7NotificationChatInfo {
  /** 会话 ID */
  id: string;
  /** 会话类型 */
  type: string;
}

/**
 * 消息信息
 */
export interface V7NotificationMessageInfo {
  /** 消息 ID */
  id: string;
  /** 消息类型 */
  type: string;
  /** 消息内容 */
  content: V7MessageContent;
  /** 消息被@人列表 */
  mentions?: V7ChatMessageMention[];
  /** 被引用的消息ID */
  quote_msg_id?: string;
}

/**
 * 用户在会话（单聊/群聊）中给应用发送消息
 * 事件编码: kso.app_chat.message.create
 */
export interface V7NotificationAppChatMessageCreateData {
  /** 企业 ID */
  company_id: string;
  /** 会话 */
  chat: V7NotificationChatInfo;
  /** 消息发送者 */
  sender: V7Identity;
  /** 消息发送时间戳（秒） */
  send_time: number;
  /** 消息 */
  message: V7NotificationMessageInfo;
}

/**
 * 首次创建用户和机器人的会话
 * 事件编码: kso.app_chat.create
 */
export interface V7NotificationAppChatCreateData {
  /** 会话 ID */
  chat_id: string;
  /** 会话创建者 */
  creator: V7Identity;
  /** 企业 ID */
  company_id: string;
}

// ================== 应用群聊事件数据结构 ==================

/**
 * 群状态变更-应用事件通知
 * 事件编码: kso.xz.app.group_chat.delete
 */
export interface V7NotificationAppGroupChatData {
  /** 会话 ID */
  chat_id: string;
  /** 企业 ID */
  company_id: string;
  /** 操作人 */
  operator: V7Identity;
}

/**
 * 用户进出群-应用事件通知
 * 事件编码: kso.xz.app.group_chat.member.user.create / kso.xz.app.group_chat.member.user.delete
 */
export interface V7NotificationAppGroupChatMemberUserData {
  /** 会话 ID */
  chat_id: string;
  /** 企业 ID */
  company_id: string;
  /** 操作人 */
  operator: V7Identity;
  /** 进出群用户列表 */
  users: V7Identity[];
}

/**
 * 机器人进出群-应用事件通知
 * 事件编码: kso.xz.app.group_chat.member.robot.create / kso.xz.app.group_chat.member.robot.delete
 */
export interface V7NotificationAppGroupChatMemberRobotData {
  /** 会话 ID */
  chat_id: string;
  /** 企业 ID */
  company_id: string;
  /** 操作人 */
  operator: V7Identity;
}
