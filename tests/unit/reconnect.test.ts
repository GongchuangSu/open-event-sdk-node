/**
 * 重连策略单元测试
 */

import { describe, it, expect } from 'vitest';
import { calculateBackoff, shouldReconnect } from '../../src/ws/reconnect';
import type { ReconnectConfig } from '../../src/types';

describe('reconnect', () => {
  const defaultConfig: ReconnectConfig = {
    autoReconnect: true,
    baseInterval: 1000,
    maxInterval: 60000,
    multiplier: 2.0,
    maxRetry: -1,
    jitter: 0.2,
  };

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      const config: ReconnectConfig = { ...defaultConfig, jitter: 0 };

      // 第 1 次重试：1000ms
      expect(calculateBackoff(config, 1)).toBe(1000);

      // 第 2 次重试：2000ms
      expect(calculateBackoff(config, 2)).toBe(2000);

      // 第 3 次重试：4000ms
      expect(calculateBackoff(config, 3)).toBe(4000);

      // 第 4 次重试：8000ms
      expect(calculateBackoff(config, 4)).toBe(8000);

      // 第 5 次重试：16000ms
      expect(calculateBackoff(config, 5)).toBe(16000);

      // 第 6 次重试：32000ms
      expect(calculateBackoff(config, 6)).toBe(32000);

      // 第 7 次重试：60000ms（达到上限）
      expect(calculateBackoff(config, 7)).toBe(60000);

      // 第 8 次重试：60000ms（保持上限）
      expect(calculateBackoff(config, 8)).toBe(60000);
    });

    it('should respect maxInterval', () => {
      const config: ReconnectConfig = {
        ...defaultConfig,
        baseInterval: 10000,
        maxInterval: 30000,
        jitter: 0,
      };

      // 第 1 次重试：10000ms
      expect(calculateBackoff(config, 1)).toBe(10000);

      // 第 2 次重试：20000ms
      expect(calculateBackoff(config, 2)).toBe(20000);

      // 第 3 次重试：30000ms（达到上限）
      expect(calculateBackoff(config, 3)).toBe(30000);

      // 第 4 次重试：30000ms（保持上限）
      expect(calculateBackoff(config, 4)).toBe(30000);
    });

    it('should add jitter within expected range', () => {
      const config: ReconnectConfig = { ...defaultConfig, jitter: 0.2 };

      // 运行多次，检查结果是否在预期范围内
      for (let i = 0; i < 100; i++) {
        const interval = calculateBackoff(config, 1);
        // 基础间隔 1000ms，抖动 ±20%，范围 800-1200ms
        expect(interval).toBeGreaterThanOrEqual(800);
        expect(interval).toBeLessThanOrEqual(1200);
      }
    });

    it('should not add jitter when jitter is 0', () => {
      const config: ReconnectConfig = { ...defaultConfig, jitter: 0 };

      // 运行多次，结果应该相同
      const results = new Set<number>();
      for (let i = 0; i < 10; i++) {
        results.add(calculateBackoff(config, 1));
      }

      expect(results.size).toBe(1);
      expect(results.has(1000)).toBe(true);
    });

    it('should handle custom multiplier', () => {
      const config: ReconnectConfig = {
        ...defaultConfig,
        multiplier: 3.0,
        jitter: 0,
      };

      expect(calculateBackoff(config, 1)).toBe(1000);
      expect(calculateBackoff(config, 2)).toBe(3000);
      expect(calculateBackoff(config, 3)).toBe(9000);
      expect(calculateBackoff(config, 4)).toBe(27000);
    });
  });

  describe('shouldReconnect', () => {
    it('should return false when autoReconnect is disabled', () => {
      const config: ReconnectConfig = { ...defaultConfig, autoReconnect: false };

      expect(shouldReconnect(config, 0)).toBe(false);
      expect(shouldReconnect(config, 1)).toBe(false);
      expect(shouldReconnect(config, 100)).toBe(false);
    });

    it('should return true for unlimited retries', () => {
      const config: ReconnectConfig = { ...defaultConfig, maxRetry: -1 };

      expect(shouldReconnect(config, 0)).toBe(true);
      expect(shouldReconnect(config, 1)).toBe(true);
      expect(shouldReconnect(config, 100)).toBe(true);
      expect(shouldReconnect(config, 10000)).toBe(true);
    });

    it('should respect maxRetry limit', () => {
      const config: ReconnectConfig = { ...defaultConfig, maxRetry: 3 };

      expect(shouldReconnect(config, 0)).toBe(true);
      expect(shouldReconnect(config, 1)).toBe(true);
      expect(shouldReconnect(config, 2)).toBe(true);
      expect(shouldReconnect(config, 3)).toBe(false);
      expect(shouldReconnect(config, 4)).toBe(false);
    });

    it('should handle edge case of maxRetry = 0', () => {
      const config: ReconnectConfig = { ...defaultConfig, maxRetry: 0 };

      expect(shouldReconnect(config, 0)).toBe(false);
      expect(shouldReconnect(config, 1)).toBe(false);
    });
  });
});
