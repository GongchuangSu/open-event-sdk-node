/**
 * WebSocket 长连接客户端
 */

import WebSocket from 'ws';
import type { ClientOptions, ReconnectConfig, TimeoutConfig } from './types';
import type { Handler } from './event/handler';
import type { Dispatcher } from './event/dispatcher';
import { createEvent } from './event/event';
import type { Logger } from './logger/interface';
import { LogLevel } from './logger/interface';
import { DefaultLogger } from './logger/default';
import { signForWebSocket, verifySignature, decrypt } from './crypto';
import { DEFAULT_ENDPOINT, DefaultConfig, MESSAGE_TYPE_GOAWAY, GoAwayReason } from './protocol';
import type { EventMessage, GoAwayMessage, BaseMessage, AckMessage } from './protocol';
import { ConnectionState } from './ws/types';
import type { ClientState } from './ws/types';
import { calculateBackoff, shouldReconnect, delay } from './ws/reconnect';
import {
  ClientError,
  ServerError,
  HandlerNotSetError,
  ClientClosedError,
  ReconnectExceededError,
} from './errors';

/**
 * WebSocket 长连接客户端
 *
 * @example
 * ```typescript
 * const client = new Client({
 *   appId: 'your_app_id',
 *   appSecret: 'your_app_secret',
 *   handler: {
 *     handle(event) {
 *       console.log('收到事件:', event.eventCode);
 *     },
 *   },
 * });
 *
 * await client.start();
 * ```
 */
export class Client {
  // 认证信息
  private readonly appId: string;
  private readonly appSecret: string;

  // 连接配置
  private readonly endpoint: string;
  private ws: WebSocket | null = null;

  // 事件处理
  private readonly handler?: Handler;
  private readonly dispatcher?: Dispatcher;

  // 日志
  private readonly logger: Logger;

  // 重连配置
  private reconnectConfig: ReconnectConfig;

  // 超时配置
  private readonly timeoutConfig: TimeoutConfig;

  // ACK 模式
  private readonly ackMode: boolean;

  // 状态管理
  private state: ClientState = {
    connectionState: ConnectionState.Disconnected,
    receivedGoAway: false,
    retryCount: 0,
  };

  // 停止信号
  private abortController: AbortController | null = null;

  // Pong 超时定时器
  private pongTimeoutTimer: NodeJS.Timeout | null = null;

  constructor(options: ClientOptions) {
    // 必填参数
    this.appId = options.appId;
    this.appSecret = options.appSecret;

    // 可选参数
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.handler = options.handler;
    this.dispatcher = options.dispatcher;

    // 日志
    const logLevel = options.logLevel ?? LogLevel.Info;
    this.logger = options.logger ?? new DefaultLogger(logLevel);

    // 重连配置
    this.reconnectConfig = {
      autoReconnect: options.autoReconnect ?? DefaultConfig.AUTO_RECONNECT,
      baseInterval: options.reconnectBaseInterval ?? DefaultConfig.RECONNECT_BASE_INTERVAL,
      maxInterval: options.reconnectMaxInterval ?? DefaultConfig.RECONNECT_MAX_INTERVAL,
      multiplier: options.reconnectMultiplier ?? DefaultConfig.RECONNECT_MULTIPLIER,
      maxRetry: options.reconnectMaxRetry ?? DefaultConfig.RECONNECT_MAX_RETRY,
      jitter: options.reconnectJitter ?? DefaultConfig.RECONNECT_JITTER,
    };

    // 超时配置
    this.timeoutConfig = {
      writeTimeout: options.writeTimeout ?? DefaultConfig.WRITE_TIMEOUT,
      pongTimeout: options.pongTimeout ?? DefaultConfig.PONG_TIMEOUT,
    };

    // ACK 模式
    this.ackMode = options.ackMode ?? DefaultConfig.ACK_MODE;
  }

  /**
   * 启动 WebSocket 长连接
   * 该方法会阻塞直到连接关闭或发生不可恢复的错误
   */
  async start(): Promise<void> {
    // 检查是否已关闭
    if (this.state.connectionState === ConnectionState.Closed) {
      throw new ClientClosedError();
    }

    // 检查是否设置了事件处理器
    if (!this.handler && !this.dispatcher) {
      throw new HandlerNotSetError();
    }

    // 创建停止信号
    this.abortController = new AbortController();

    try {
      // 建立连接
      await this.connect();

      // 等待连接关闭或停止信号
      await this.waitForClose();
    } catch (error) {
      // 如果是客户端错误，不重试
      if (error instanceof ClientError) {
        throw error;
      }

      // 断开连接
      this.disconnect();

      // 如果开启自动重连，尝试重连
      if (this.reconnectConfig.autoReconnect) {
        await this.reconnect();
      } else {
        throw error;
      }
    }
  }

  /**
   * 停止 WebSocket 连接
   */
  async stop(): Promise<void> {
    this.state.connectionState = ConnectionState.Closed;
    this.abortController?.abort();
    this.disconnect();
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.state.connectionState === ConnectionState.Connected && this.ws !== null;
  }

  /**
   * 建立 WebSocket 连接
   */
  private async connect(): Promise<void> {
    this.state.connectionState = ConnectionState.Connecting;

    // 解析端点 URL
    const url = new URL(this.endpoint);
    const uri = url.pathname + url.search;

    // 生成 KSO-1 签名
    const headers = signForWebSocket({
      appId: this.appId,
      appSecret: this.appSecret,
      uri,
    });

    // 如果启用 ACK 模式，添加协商 Header
    const wsHeaders: Record<string, string> = {
      ...headers,
    };
    if (this.ackMode) {
      wsHeaders['X-Ack-Mode'] = 'required';
    }

    this.logger.debug(`Connecting to ${this.endpoint}, ack_mode: ${this.ackMode}`);

    return new Promise<void>((resolve, reject) => {
      // 创建 WebSocket 连接
      const ws = new WebSocket(this.endpoint, {
        headers: wsHeaders,
      });

      // 连接超时
      const connectTimeout = setTimeout(() => {
        ws.terminate();
        reject(new ServerError(0, 'Connection timeout'));
      }, this.timeoutConfig.writeTimeout);

      ws.on('open', () => {
        clearTimeout(connectTimeout);
        this.ws = ws;
        this.state.connectionState = ConnectionState.Connected;
        this.state.receivedGoAway = false;
        this.state.retryCount = 0;
        this.setupPongTimeout();
        this.logger.info(`Connected to ${this.endpoint}`);
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(connectTimeout);
        this.logger.error('WebSocket error:', error.message);
        reject(new ServerError(0, error.message));
      });

      ws.on('unexpected-response', (_req, res) => {
        clearTimeout(connectTimeout);
        const error = this.parseConnectError(res.statusCode ?? 0);
        reject(error);
      });

      // 设置消息处理
      ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      // 设置 Ping 处理（服务端发送 Ping，客户端回复 Pong）
      ws.on('ping', (data) => {
        this.logger.debug('Received ping from server');
        this.resetPongTimeout();
        ws.pong(data);
      });

      // 设置关闭处理
      ws.on('close', (code, reason) => {
        this.clearPongTimeout();
        if (this.state.receivedGoAway) {
          this.logger.debug(`Connection closed after goaway: code=${code}`);
        } else {
          this.logger.info(`Connection closed: code=${code}, reason=${reason.toString()}`);
        }
      });
    });
  }

  /**
   * 断开连接
   */
  private disconnect(): void {
    this.clearPongTimeout();
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    if (this.state.connectionState !== ConnectionState.Closed) {
      this.state.connectionState = ConnectionState.Disconnected;
    }
    this.logger.info('Disconnected');
  }

  /**
   * 重连（使用指数退避策略）
   */
  private async reconnect(): Promise<void> {
    this.state.connectionState = ConnectionState.Reconnecting;
    this.state.retryCount = 0;

    while (true) {
      // 检查是否应该继续重连
      this.state.retryCount++;
      if (!shouldReconnect(this.reconnectConfig, this.state.retryCount)) {
        throw new ReconnectExceededError();
      }

      // 计算等待时间
      const waitTime = calculateBackoff(this.reconnectConfig, this.state.retryCount);
      this.logger.info(`Reconnecting in ${waitTime}ms, attempt ${this.state.retryCount}`);

      // 等待
      try {
        await delay(waitTime, this.abortController?.signal);
      } catch {
        // 被取消
        throw new ClientClosedError();
      }

      // 尝试连接
      try {
        await this.connect();
        this.logger.info(`Reconnected successfully after ${this.state.retryCount} attempts`);

        // 重新进入等待关闭循环
        await this.waitForClose();
        return;
      } catch (error) {
        // 如果是客户端错误，不继续重试
        if (error instanceof ClientError) {
          throw error;
        }

        this.logger.error('Reconnect failed:', error instanceof Error ? error.message : error);
        this.disconnect();
      }
    }
  }

  /**
   * 等待连接关闭
   */
  private async waitForClose(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.ws) {
        resolve();
        return;
      }

      const ws = this.ws;

      const onClose = () => {
        cleanup();
        // 如果开启自动重连且未关闭，尝试重连
        if (
          this.reconnectConfig.autoReconnect &&
          this.state.connectionState !== ConnectionState.Closed
        ) {
          this.reconnect().then(resolve).catch(reject);
        } else {
          resolve();
        }
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const onAbort = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        ws.off('close', onClose);
        ws.off('error', onError);
        this.abortController?.signal.removeEventListener('abort', onAbort);
      };

      ws.on('close', onClose);
      ws.on('error', onError);
      this.abortController?.signal.addEventListener('abort', onAbort);
    });
  }

  /**
   * 处理消息
   */
  private handleMessage(message: string): void {
    try {
      // 解析基础消息
      const base = JSON.parse(message) as BaseMessage;

      // GoAway 消息
      if (base.type === MESSAGE_TYPE_GOAWAY) {
        this.handleGoAwayMessage(message);
        return;
      }

      // 事件消息需要验证 topic 和 operation 不能为空
      if (!base.topic || !base.operation) {
        this.logger.error(
          `Invalid event message: topic or operation is empty, message=${message}`
        );
        return;
      }

      // 处理事件消息
      this.handleEventMessage(message);
    } catch (error) {
      this.logger.error(
        'Handle message failed:',
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * 处理事件消息
   */
  private async handleEventMessage(message: string): Promise<void> {
    const msg = JSON.parse(message) as EventMessage;

    // 生成事件编码
    const eventCode = `${msg.topic}.${msg.operation}`;
    this.logger.debug(`Received event: event_code=${eventCode}`);

    // 验证签名
    const signatureValid = verifySignature({
      accessKey: this.appId,
      secretKey: this.appSecret,
      topic: msg.topic,
      nonce: msg.nonce,
      time: msg.time,
      encryptedData: msg.encrypted_data,
      signature: msg.signature,
    });

    if (!signatureValid) {
      this.logger.error('Verify signature failed');
      return;
    }

    // 解密数据
    let decryptedData: string;
    try {
      decryptedData = decrypt({
        secretKey: this.appSecret,
        encryptedData: msg.encrypted_data,
        nonce: msg.nonce,
      });
    } catch (error) {
      this.logger.error(
        'Decrypt event data failed:',
        error instanceof Error ? error.message : error
      );
      return;
    }

    // 创建事件
    const event = createEvent(msg.topic, msg.operation, msg.time, decryptedData);

    // 调用处理器
    let handleError: Error | null = null;
    try {
      if (this.dispatcher) {
        await this.dispatcher.handle(event);
      } else if (this.handler) {
        await this.handler.handle(event);
      }
    } catch (error) {
      handleError = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Handle event failed:', handleError.message);
    }

    // 如果启用 ACK 模式，发送 ACK
    if (this.ackMode) {
      this.sendAck(msg.nonce, handleError);
    }

    if (!handleError) {
      this.logger.debug(`Event handled: event_code=${eventCode}`);
    }
  }

  /**
   * 发送 ACK 消息
   */
  private sendAck(nonce: string, error: Error | null): void {
    if (!nonce) {
      this.logger.warn('ACK mode enabled but event nonce is empty, skip sending ack');
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Connection is not open, skip sending ack');
      return;
    }

    const ack: AckMessage = {
      type: 'ack',
      nonce,
      code: error ? 500 : 200,
    };

    if (error) {
      let errMsg = error.message;
      if (errMsg.length > 256) {
        errMsg = errMsg.slice(0, 256) + '...';
      }
      ack.msg = errMsg;
    }

    try {
      this.ws.send(JSON.stringify(ack));
      this.logger.debug(`ACK sent, nonce: ${nonce}, code: ${ack.code}`);
    } catch (sendError) {
      this.logger.error(
        'Send ACK failed:',
        sendError instanceof Error ? sendError.message : sendError
      );
    }
  }

  /**
   * 处理 GoAway 消息
   */
  private handleGoAwayMessage(message: string): void {
    const msg = JSON.parse(message) as GoAwayMessage;

    this.logger.info(
      `Received goaway: reason=${msg.reason}, message=${msg.message}, reconnect_ms=${msg.reconnect_ms}`
    );

    // 标记已收到 GoAway
    this.state.receivedGoAway = true;

    // 如果是连接被替换，不重连
    if (msg.reason === GoAwayReason.CONNECTION_REPLACED) {
      this.reconnectConfig.autoReconnect = false;
      this.logger.warn('Connection replaced by another client, will not reconnect');
      return;
    }

    // 如果服务端建议了重连时间，使用该时间作为基础间隔
    if (msg.reconnect_ms && msg.reconnect_ms > 0) {
      this.reconnectConfig.baseInterval = msg.reconnect_ms;
    }
  }

  /**
   * 解析连接错误
   */
  private parseConnectError(statusCode: number): ClientError | ServerError {
    switch (statusCode) {
      case 401:
        return new ClientError(statusCode, 'Authentication failed');
      case 403:
        return new ClientError(statusCode, 'Forbidden');
      case 429:
        return new ServerError(statusCode, 'Too many connections');
      default:
        return new ServerError(statusCode, `Unexpected status code: ${statusCode}`);
    }
  }

  /**
   * 设置 Pong 超时
   */
  private setupPongTimeout(): void {
    this.clearPongTimeout();
    this.pongTimeoutTimer = setTimeout(() => {
      this.logger.warn('Pong timeout, closing connection');
      this.disconnect();
    }, this.timeoutConfig.pongTimeout);
  }

  /**
   * 重置 Pong 超时
   */
  private resetPongTimeout(): void {
    this.setupPongTimeout();
  }

  /**
   * 清除 Pong 超时
   */
  private clearPongTimeout(): void {
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }
}
