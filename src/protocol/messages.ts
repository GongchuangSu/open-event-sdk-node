/**
 * 协议消息类型定义
 */

import type { GoAwayReasonType } from './constants';

/**
 * 事件消息（加密）
 */
export interface EventMessage {
  /** 消息主题 */
  topic: string;

  /** 变更动作 */
  operation: string;

  /** 时间戳（秒） */
  time: number;

  /** iv 向量 */
  nonce: string;

  /** 消息签名 */
  signature: string;

  /** 加密数据 */
  encrypted_data: string;
}

/**
 * GoAway 消息
 */
export interface GoAwayMessage {
  /** 消息类型 */
  type: 'goaway';

  /** 关闭原因 */
  reason: GoAwayReasonType;

  /** 关闭消息 */
  message: string;

  /** 建议重连时间（毫秒） */
  reconnect_ms?: number;
}

/**
 * ACK 消息
 */
export interface AckMessage {
  /** 消息类型 */
  type: 'ack';

  /** 事件 nonce */
  nonce: string;

  /** 状态码（200=成功，500=失败） */
  code: number;

  /** 错误信息 */
  msg?: string;
}

/**
 * 基础消息结构（用于类型判断）
 */
export interface BaseMessage {
  type?: string;
  topic?: string;
  operation?: string;
}
