/**
 * 错误类型定义
 */

/**
 * 基础错误类
 */
export class OpenEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenEventError';
    // 确保原型链正确
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 客户端错误（不重试）
 * 例如：认证失败、权限不足
 */
export class ClientError extends OpenEventError {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ClientError';
    this.statusCode = statusCode;
  }
}

/**
 * 服务端错误（可重试）
 * 例如：服务器繁忙、限流
 */
export class ServerError extends OpenEventError {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
  }
}

/**
 * 签名验证错误
 */
export class SignatureError extends OpenEventError {
  constructor(message = 'Invalid signature') {
    super(message);
    this.name = 'SignatureError';
  }
}

/**
 * 解密错误
 */
export class DecryptError extends OpenEventError {
  constructor(message = 'Decrypt failed') {
    super(message);
    this.name = 'DecryptError';
  }
}

/**
 * 连接错误
 */
export class ConnectionError extends OpenEventError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

/**
 * 处理器未设置错误
 */
export class HandlerNotSetError extends OpenEventError {
  constructor() {
    super('Handler or Dispatcher not set');
    this.name = 'HandlerNotSetError';
  }
}

/**
 * 重连超过最大次数错误
 */
export class ReconnectExceededError extends OpenEventError {
  constructor() {
    super('Reconnect max retry exceeded');
    this.name = 'ReconnectExceededError';
  }
}

/**
 * 客户端已关闭错误
 */
export class ClientClosedError extends OpenEventError {
  constructor() {
    super('Client is closed');
    this.name = 'ClientClosedError';
  }
}

/**
 * 已连接错误
 */
export class AlreadyConnectedError extends OpenEventError {
  constructor() {
    super('Already connected');
    this.name = 'AlreadyConnectedError';
  }
}
