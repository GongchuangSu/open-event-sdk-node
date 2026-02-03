/**
 * 协议常量定义
 */

/**
 * 默认 WebSocket 端点
 */
export const DEFAULT_ENDPOINT = 'wss://openapi.wps.cn/v7/event/ws';

/**
 * 消息类型
 */
export const MESSAGE_TYPE_GOAWAY = 'goaway';

/**
 * GoAway 原因
 */
export const GoAwayReason = {
  /** 服务器关闭 */
  SERVER_SHUTDOWN: 'server_shutdown',
  /** 连接被替换 */
  CONNECTION_REPLACED: 'connection_replaced',
  /** 心跳超时 */
  HEARTBEAT_TIMEOUT: 'heartbeat_timeout',
} as const;

export type GoAwayReasonType = (typeof GoAwayReason)[keyof typeof GoAwayReason];

/**
 * 默认配置
 */
export const DefaultConfig = {
  /** 默认启用 ACK 模式 */
  ACK_MODE: true,

  /** 默认启用自动重连 */
  AUTO_RECONNECT: true,

  /** 默认重连基础间隔（毫秒） */
  RECONNECT_BASE_INTERVAL: 1000,

  /** 默认重连最大间隔（毫秒） */
  RECONNECT_MAX_INTERVAL: 60000,

  /** 默认重连间隔倍数 */
  RECONNECT_MULTIPLIER: 2.0,

  /** 默认最大重试次数，-1 表示无限重试 */
  RECONNECT_MAX_RETRY: -1,

  /** 默认重连抖动系数 */
  RECONNECT_JITTER: 0.2,

  /** 默认写超时（毫秒） */
  WRITE_TIMEOUT: 10000,

  /** 默认 Pong 等待超时（毫秒） */
  PONG_TIMEOUT: 90000,
} as const;
