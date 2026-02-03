/**
 * 重连策略
 */

import type { ReconnectConfig } from '../types';

/**
 * 计算带抖动的退避时间
 *
 * 重连间隔公式:
 * interval = min(baseInterval * multiplier^(retryCount-1), maxInterval) * (1 ± jitter)
 *
 * @param config 重连配置
 * @param retryCount 当前重试次数（从 1 开始）
 * @returns 等待时间（毫秒）
 */
export function calculateBackoff(config: ReconnectConfig, retryCount: number): number {
  const { baseInterval, maxInterval, multiplier, jitter } = config;

  // 计算基础间隔（指数增长）
  let interval = baseInterval * Math.pow(multiplier, retryCount - 1);

  // 限制最大间隔
  interval = Math.min(interval, maxInterval);

  // 如果没有抖动，直接返回
  if (jitter <= 0) {
    return interval;
  }

  // 计算抖动范围：interval * (1 - jitter) 到 interval * (1 + jitter)
  const minInterval = interval * (1 - jitter);
  const maxJitteredInterval = interval * (1 + jitter);

  // 在范围内随机
  const jitteredInterval = minInterval + Math.random() * (maxJitteredInterval - minInterval);

  return Math.round(jitteredInterval);
}

/**
 * 检查是否应该继续重连
 *
 * @param config 重连配置
 * @param retryCount 当前重试次数
 * @returns 是否应该继续重连
 */
export function shouldReconnect(config: ReconnectConfig, retryCount: number): boolean {
  if (!config.autoReconnect) {
    return false;
  }

  // -1 表示无限重试
  if (config.maxRetry < 0) {
    return true;
  }

  return retryCount < config.maxRetry;
}

/**
 * 创建延迟 Promise
 *
 * @param ms 延迟毫秒数
 * @param signal AbortSignal（可选）
 * @returns Promise
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      },
      { once: true }
    );
  });
}
