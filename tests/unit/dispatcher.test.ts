/**
 * 分发器单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { Dispatcher, createEvent, EventCodes } from '../../src/event';
import type { V7NotificationAppChatMessageCreateData } from '../../src/event';

describe('Dispatcher', () => {
  describe('register', () => {
    it('should register handler for event code', () => {
      const dispatcher = new Dispatcher();
      const handler = { handle: vi.fn() };

      dispatcher.register('test.event', handler);

      expect(dispatcher.hasHandler('test.event')).toBe(true);
      expect(dispatcher.hasHandler('other.event')).toBe(false);
    });

    it('should support chained registration', () => {
      const dispatcher = new Dispatcher();
      const handler1 = { handle: vi.fn() };
      const handler2 = { handle: vi.fn() };

      const result = dispatcher.register('event1', handler1).register('event2', handler2);

      expect(result).toBe(dispatcher);
      expect(dispatcher.hasHandler('event1')).toBe(true);
      expect(dispatcher.hasHandler('event2')).toBe(true);
    });
  });

  describe('registerFunc', () => {
    it('should register function handler', async () => {
      const dispatcher = new Dispatcher();
      const fn = vi.fn();

      dispatcher.registerFunc('test.event', fn);

      const event = createEvent('test', 'event', 1704067200, '{}');
      await dispatcher.handle(event);

      expect(fn).toHaveBeenCalledWith(event);
    });
  });

  describe('registerFallback', () => {
    it('should call fallback handler for unregistered events', async () => {
      const dispatcher = new Dispatcher();
      const fallbackFn = vi.fn();

      dispatcher.registerFallbackFunc(fallbackFn);

      const event = createEvent('unknown', 'event', 1704067200, '{}');
      await dispatcher.handle(event);

      expect(fallbackFn).toHaveBeenCalledWith(event);
    });

    it('should not call fallback handler for registered events', async () => {
      const dispatcher = new Dispatcher();
      const eventFn = vi.fn();
      const fallbackFn = vi.fn();

      dispatcher.registerFunc('test.event', eventFn).registerFallbackFunc(fallbackFn);

      const event = createEvent('test', 'event', 1704067200, '{}');
      await dispatcher.handle(event);

      expect(eventFn).toHaveBeenCalled();
      expect(fallbackFn).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('should dispatch event to correct handler', async () => {
      const dispatcher = new Dispatcher();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      dispatcher.registerFunc('event1.create', handler1).registerFunc('event2.create', handler2);

      const event1 = createEvent('event1', 'create', 1704067200, '{}');
      const event2 = createEvent('event2', 'create', 1704067200, '{}');

      await dispatcher.handle(event1);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();

      handler1.mockClear();
      handler2.mockClear();

      await dispatcher.handle(event2);
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle async handlers', async () => {
      const dispatcher = new Dispatcher();
      const results: number[] = [];

      dispatcher.registerFunc('test.event', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(1);
      });

      const event = createEvent('test', 'event', 1704067200, '{}');
      await dispatcher.handle(event);

      expect(results).toEqual([1]);
    });

    it('should propagate handler errors', async () => {
      const dispatcher = new Dispatcher();
      const error = new Error('Handler error');

      dispatcher.registerFunc('test.event', () => {
        throw error;
      });

      const event = createEvent('test', 'event', 1704067200, '{}');

      await expect(dispatcher.handle(event)).rejects.toThrow(error);
    });
  });

  describe('getEventCodes', () => {
    it('should return all registered event codes', () => {
      const dispatcher = new Dispatcher();

      dispatcher
        .registerFunc('event1.create', () => {})
        .registerFunc('event2.update', () => {})
        .registerFunc('event3.delete', () => {});

      const codes = dispatcher.getEventCodes();

      expect(codes).toHaveLength(3);
      expect(codes).toContain('event1.create');
      expect(codes).toContain('event2.update');
      expect(codes).toContain('event3.delete');
    });
  });

  describe('typed event handlers', () => {
    it('should parse event data for onV7AppChatMessageCreate', async () => {
      const dispatcher = new Dispatcher();
      let receivedData: V7NotificationAppChatMessageCreateData | null = null;

      dispatcher.onV7AppChatMessageCreate((event) => {
        receivedData = event.parsedData;
      });

      const eventData: V7NotificationAppChatMessageCreateData = {
        company_id: 'company_123',
        chat: { id: 'chat_456', type: 'single' },
        sender: { type: 'user', id: 'user_789' },
        send_time: 1704067200,
        message: {
          id: 'msg_001',
          type: 'text',
          content: { text: 'Hello!' },
        },
      };

      const event = createEvent(
        'kso.app_chat.message',
        'create',
        1704067200,
        JSON.stringify(eventData)
      );

      await dispatcher.handle(event);

      expect(receivedData).not.toBeNull();
      expect(receivedData?.company_id).toBe('company_123');
      expect(receivedData?.chat.id).toBe('chat_456');
      expect(receivedData?.sender.id).toBe('user_789');
      expect(receivedData?.message.content.text).toBe('Hello!');
    });

    it('should register correct event codes', () => {
      const dispatcher = new Dispatcher();

      dispatcher
        .onV7AppChatMessageCreate(() => {})
        .onV7AppChatCreate(() => {})
        .onV7AppGroupChatDelete(() => {})
        .onV7AppGroupChatMemberUserCreate(() => {})
        .onV7AppGroupChatMemberUserDelete(() => {})
        .onV7AppGroupChatMemberRobotCreate(() => {})
        .onV7AppGroupChatMemberRobotDelete(() => {});

      expect(dispatcher.hasHandler(EventCodes.V7_APP_CHAT_MESSAGE_CREATE)).toBe(true);
      expect(dispatcher.hasHandler(EventCodes.V7_APP_CHAT_CREATE)).toBe(true);
      expect(dispatcher.hasHandler(EventCodes.V7_APP_GROUP_CHAT_DELETE)).toBe(true);
      expect(dispatcher.hasHandler(EventCodes.V7_APP_GROUP_CHAT_MEMBER_USER_CREATE)).toBe(true);
      expect(dispatcher.hasHandler(EventCodes.V7_APP_GROUP_CHAT_MEMBER_USER_DELETE)).toBe(true);
      expect(dispatcher.hasHandler(EventCodes.V7_APP_GROUP_CHAT_MEMBER_ROBOT_CREATE)).toBe(true);
      expect(dispatcher.hasHandler(EventCodes.V7_APP_GROUP_CHAT_MEMBER_ROBOT_DELETE)).toBe(true);
    });
  });
});
