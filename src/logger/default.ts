/**
 * 默认日志实现
 */

import { Logger, LogLevel } from './interface';

/**
 * 格式化日志时间
 */
function formatTime(): string {
  return new Date().toISOString();
}

/**
 * 格式化日志消息
 */
function formatMessage(level: string, args: unknown[]): string {
  const time = formatTime();
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  return `[${time}] [${level}] [open-event-sdk] ${message}`;
}

/**
 * 默认日志实现
 */
export class DefaultLogger implements Logger {
  private readonly level: LogLevel;

  constructor(level: LogLevel = LogLevel.Info) {
    this.level = level;
  }

  debug(...args: unknown[]): void {
    if (this.level <= LogLevel.Debug) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('DEBUG', args));
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LogLevel.Info) {
      // eslint-disable-next-line no-console
      console.info(formatMessage('INFO', args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LogLevel.Warn) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage('WARN', args));
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LogLevel.Error) {
      // eslint-disable-next-line no-console
      console.error(formatMessage('ERROR', args));
    }
  }
}

/**
 * 空日志实现（不输出任何日志）
 */
export class NopLogger implements Logger {
  debug(): void {
    // nop
  }

  info(): void {
    // nop
  }

  warn(): void {
    // nop
  }

  error(): void {
    // nop
  }
}
