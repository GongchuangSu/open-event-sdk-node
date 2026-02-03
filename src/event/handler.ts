/**
 * 事件处理器接口定义
 */

import type { Event } from './event';

/**
 * 事件处理器接口
 */
export interface Handler {
  /**
   * 处理事件
   * @param event 事件实体
   */
  handle(event: Event): Promise<void> | void;
}

/**
 * 函数式处理器类型
 */
export type HandlerFunc = (event: Event) => Promise<void> | void;

/**
 * 创建 Handler 的工厂函数
 * @param fn 处理函数
 * @returns Handler 实例
 */
export function createHandler(fn: HandlerFunc): Handler {
  return {
    handle: fn,
  };
}

/**
 * 函数式 Handler 包装类
 */
export class FuncHandler implements Handler {
  private readonly fn: HandlerFunc;

  constructor(fn: HandlerFunc) {
    this.fn = fn;
  }

  handle(event: Event): Promise<void> | void {
    return this.fn(event);
  }
}
