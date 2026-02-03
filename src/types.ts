/**
 * 公共类型定义
 */

import type { Handler } from './event/handler';
import type { Dispatcher } from './event/dispatcher';
import type { Logger, LogLevel } from './logger/interface';

/**
 * Client 配置选项
 */
export interface ClientOptions {
  /**
   * 应用 ID
   */
  appId: string;

  /**
   * 应用密钥
   */
  appSecret: string;

  /**
   * WebSocket 端点
   * @default 'wss://openapi.wps.cn/v7/event/ws'
   */
  endpoint?: string;

  /**
   * 自定义日志实例
   */
  logger?: Logger;

  /**
   * 日志级别
   * @default LogLevel.Info
   */
  logLevel?: LogLevel;

  /**
   * 是否自动重连
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * 重连基础间隔（毫秒）
   * @default 1000
   */
  reconnectBaseInterval?: number;

  /**
   * 重连最大间隔（毫秒）
   * @default 60000
   */
  reconnectMaxInterval?: number;

  /**
   * 重连间隔倍数
   * @default 2.0
   */
  reconnectMultiplier?: number;

  /**
   * 最大重试次数，-1 表示无限重试
   * @default -1
   */
  reconnectMaxRetry?: number;

  /**
   * 重连抖动系数（0-1）
   * @default 0.2
   */
  reconnectJitter?: number;

  /**
   * 写超时（毫秒）
   * @default 10000
   */
  writeTimeout?: number;

  /**
   * Pong 等待超时（毫秒）
   * @default 90000
   */
  pongTimeout?: number;

  /**
   * 是否启用 ACK 模式
   * @default true
   */
  ackMode?: boolean;

  /**
   * 单一事件处理器
   * 与 dispatcher 二选一
   */
  handler?: Handler;

  /**
   * 事件分发器
   * 与 handler 二选一
   */
  dispatcher?: Dispatcher;
}

/**
 * 重连配置
 */
export interface ReconnectConfig {
  autoReconnect: boolean;
  baseInterval: number;
  maxInterval: number;
  multiplier: number;
  maxRetry: number;
  jitter: number;
}

/**
 * 超时配置
 */
export interface TimeoutConfig {
  writeTimeout: number;
  pongTimeout: number;
}
