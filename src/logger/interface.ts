/**
 * 日志接口定义
 */

/**
 * 日志级别
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Silent = 4,
}

/**
 * 日志接口
 */
export interface Logger {
  /**
   * 调试日志
   */
  debug(...args: unknown[]): void;

  /**
   * 信息日志
   */
  info(...args: unknown[]): void;

  /**
   * 警告日志
   */
  warn(...args: unknown[]): void;

  /**
   * 错误日志
   */
  error(...args: unknown[]): void;
}
