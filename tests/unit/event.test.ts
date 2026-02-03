/**
 * 事件模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  buildEventCode,
  createEvent,
  createTypedEvent,
  EventCodes,
} from '../../src/event';

describe('event', () => {
  describe('buildEventCode', () => {
    it('should build correct event code', () => {
      expect(buildEventCode('kso.app_chat.message', 'create')).toBe(
        'kso.app_chat.message.create'
      );
      expect(buildEventCode('kso.app_chat', 'create')).toBe('kso.app_chat.create');
      expect(buildEventCode('kso.xz.app.group_chat', 'delete')).toBe(
        'kso.xz.app.group_chat.delete'
      );
    });
  });

  describe('createEvent', () => {
    it('should create event with correct properties', () => {
      const event = createEvent(
        'kso.app_chat.message',
        'create',
        1704067200,
        '{"message": "hello"}'
      );

      expect(event.topic).toBe('kso.app_chat.message');
      expect(event.operation).toBe('create');
      expect(event.time).toBe(1704067200);
      expect(event.data).toBe('{"message": "hello"}');
      expect(event.eventCode).toBe('kso.app_chat.message.create');
    });
  });

  describe('createTypedEvent', () => {
    it('should create typed event with parsed data', () => {
      const event = createEvent(
        'kso.app_chat.message',
        'create',
        1704067200,
        '{"message": "hello"}'
      );

      interface TestData {
        message: string;
      }

      const parsedData: TestData = { message: 'hello' };
      const typedEvent = createTypedEvent(event, parsedData);

      expect(typedEvent.topic).toBe('kso.app_chat.message');
      expect(typedEvent.operation).toBe('create');
      expect(typedEvent.eventCode).toBe('kso.app_chat.message.create');
      expect(typedEvent.parsedData).toEqual(parsedData);
      expect(typedEvent.parsedData.message).toBe('hello');
    });
  });

  describe('EventCodes', () => {
    it('should have correct event code values', () => {
      expect(EventCodes.V7_APP_CHAT_MESSAGE_CREATE).toBe('kso.app_chat.message.create');
      expect(EventCodes.V7_APP_CHAT_CREATE).toBe('kso.app_chat.create');
      expect(EventCodes.V7_APP_GROUP_CHAT_DELETE).toBe('kso.xz.app.group_chat.delete');
      expect(EventCodes.V7_APP_GROUP_CHAT_MEMBER_USER_CREATE).toBe(
        'kso.xz.app.group_chat.member.user.create'
      );
      expect(EventCodes.V7_APP_GROUP_CHAT_MEMBER_USER_DELETE).toBe(
        'kso.xz.app.group_chat.member.user.delete'
      );
      expect(EventCodes.V7_APP_GROUP_CHAT_MEMBER_ROBOT_CREATE).toBe(
        'kso.xz.app.group_chat.member.robot.create'
      );
      expect(EventCodes.V7_APP_GROUP_CHAT_MEMBER_ROBOT_DELETE).toBe(
        'kso.xz.app.group_chat.member.robot.delete'
      );
    });
  });
});
