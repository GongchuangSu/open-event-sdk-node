/**
 * WebSocket 模块内部类型
 */

/**
 * 连接状态
 */
export enum ConnectionState {
  /** 未连接 */
  Disconnected = 'disconnected',
  /** 连接中 */
  Connecting = 'connecting',
  /** 已连接 */
  Connected = 'connected',
  /** 重连中 */
  Reconnecting = 'reconnecting',
  /** 已关闭 */
  Closed = 'closed',
}

/**
 * 客户端内部状态
 */
export interface ClientState {
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 是否已收到 GoAway 消息 */
  receivedGoAway: boolean;
  /** 当前重试次数 */
  retryCount: number;
}
