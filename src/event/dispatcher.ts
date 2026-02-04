/**
 * 事件分发器
 */

import type { Event, TypedEvent } from './event';
import { createTypedEvent } from './event';
import type { Handler, HandlerFunc } from './handler';
import { FuncHandler } from './handler';
import { EventCodes } from './model/event-codes';
import type {
  V7NotificationAppChatMessageCreateData,
  V7NotificationAppChatCreateData,
  V7NotificationAppGroupChatData,
  V7NotificationAppGroupChatMemberUserData,
  V7NotificationAppGroupChatMemberRobotData,
} from './model/im';

/**
 * 类型化处理函数
 */
export type TypedHandlerFunc<T> = (event: TypedEvent<T>) => Promise<void> | void;

/**
 * 事件分发器
 * 支持按事件编码（event_code）注册不同的处理器
 */
export class Dispatcher implements Handler {
  private readonly handlers: Map<string, Handler> = new Map();
  private fallback?: Handler;

  /**
   * 注册特定事件编码的处理器
   * @param eventCode 事件编码，由 topic.operation 组成，如 "kso.app_chat.message.create"
   * @param handler 事件处理器
   */
  register(eventCode: string, handler: Handler): this {
    this.handlers.set(eventCode, handler);
    return this;
  }

  /**
   * 注册函数类型的处理器（便捷方法）
   * @param eventCode 事件编码
   * @param fn 处理函数
   */
  registerFunc(eventCode: string, fn: HandlerFunc): this {
    return this.register(eventCode, new FuncHandler(fn));
  }

  /**
   * 注册兜底处理器
   * 当事件没有匹配的处理器时，会调用兜底处理器
   * @param handler 兜底处理器
   */
  registerFallback(handler: Handler): this {
    this.fallback = handler;
    return this;
  }

  /**
   * 注册函数类型的兜底处理器（便捷方法）
   * @param fn 处理函数
   */
  registerFallbackFunc(fn: HandlerFunc): this {
    return this.registerFallback(new FuncHandler(fn));
  }

  /**
   * 分发事件到对应的处理器
   * @param event 事件
   */
  async dispatch(event: Event): Promise<void> {
    const handler = this.handlers.get(event.eventCode);

    if (handler) {
      await handler.handle(event);
      return;
    }

    if (this.fallback) {
      await this.fallback.handle(event);
      return;
    }

    // 没有匹配的处理器，静默忽略
  }

  /**
   * 实现 Handler 接口，使 Dispatcher 可以作为 Handler 使用
   */
  async handle(event: Event): Promise<void> {
    return this.dispatch(event);
  }

  /**
   * 检查是否有处理器注册了指定的事件编码
   * @param eventCode 事件编码
   */
  hasHandler(eventCode: string): boolean {
    return this.handlers.has(eventCode);
  }

  /**
   * 返回所有已注册的事件编码
   */
  getEventCodes(): string[] {
    return Array.from(this.handlers.keys());
  }

  // ================== 类型化事件注册方法 ==================

  /**
   * 注册用户给应用发送消息事件处理器
   * 事件编码: kso.app_chat.message.create
   */
  onV7AppChatMessageCreate(fn: TypedHandlerFunc<V7NotificationAppChatMessageCreateData>): this {
    return this.registerFunc(EventCodes.V7_APP_CHAT_MESSAGE_CREATE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppChatMessageCreateData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }

  /**
   * 注册首次创建会话事件处理器
   * 事件编码: kso.app_chat.create
   */
  onV7AppChatCreate(fn: TypedHandlerFunc<V7NotificationAppChatCreateData>): this {
    return this.registerFunc(EventCodes.V7_APP_CHAT_CREATE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppChatCreateData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }

  /**
   * 注册群聊解散事件处理器
   * 事件编码: kso.xz.app.group_chat.delete
   */
  onV7AppGroupChatDelete(fn: TypedHandlerFunc<V7NotificationAppGroupChatData>): this {
    return this.registerFunc(EventCodes.V7_APP_GROUP_CHAT_DELETE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppGroupChatData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }

  /**
   * 注册用户进群事件处理器
   * 事件编码: kso.xz.app.group_chat.member.user.create
   */
  onV7AppGroupChatMemberUserCreate(
    fn: TypedHandlerFunc<V7NotificationAppGroupChatMemberUserData>
  ): this {
    return this.registerFunc(EventCodes.V7_APP_GROUP_CHAT_MEMBER_USER_CREATE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppGroupChatMemberUserData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }

  /**
   * 注册用户退群事件处理器
   * 事件编码: kso.xz.app.group_chat.member.user.delete
   */
  onV7AppGroupChatMemberUserDelete(
    fn: TypedHandlerFunc<V7NotificationAppGroupChatMemberUserData>
  ): this {
    return this.registerFunc(EventCodes.V7_APP_GROUP_CHAT_MEMBER_USER_DELETE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppGroupChatMemberUserData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }

  /**
   * 注册机器人进群事件处理器
   * 事件编码: kso.xz.app.group_chat.member.robot.create
   */
  onV7AppGroupChatMemberRobotCreate(
    fn: TypedHandlerFunc<V7NotificationAppGroupChatMemberRobotData>
  ): this {
    return this.registerFunc(EventCodes.V7_APP_GROUP_CHAT_MEMBER_ROBOT_CREATE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppGroupChatMemberRobotData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }

  /**
   * 注册机器人退群事件处理器
   * 事件编码: kso.xz.app.group_chat.member.robot.delete
   */
  onV7AppGroupChatMemberRobotDelete(
    fn: TypedHandlerFunc<V7NotificationAppGroupChatMemberRobotData>
  ): this {
    return this.registerFunc(EventCodes.V7_APP_GROUP_CHAT_MEMBER_ROBOT_DELETE, (event) => {
      const parsedData = JSON.parse(event.data) as V7NotificationAppGroupChatMemberRobotData;
      const typedEvent = createTypedEvent(event, parsedData);
      return fn(typedEvent);
    });
  }
}
