/**
 * 事件实体定义
 */

/**
 * 事件实体（解密后的事件数据）
 */
export interface Event {
  /** 消息主题 */
  readonly topic: string;

  /** 消息变更动作 */
  readonly operation: string;

  /** 时间（秒为单位的时间戳） */
  readonly time: number;

  /** 解密后的事件数据（JSON 字符串） */
  readonly data: string;

  /** 事件编码（topic.operation） */
  readonly eventCode: string;
}

/**
 * 类型化事件
 */
export interface TypedEvent<T> extends Event {
  /** 解析后的事件数据 */
  readonly parsedData: T;
}

/**
 * 根据 topic 和 operation 生成事件编码
 * 事件编码格式: topic.operation，如 "kso.app_chat.message.create"
 */
export function buildEventCode(topic: string, operation: string): string {
  return `${topic}.${operation}`;
}

/**
 * 创建事件实体
 */
export function createEvent(topic: string, operation: string, time: number, data: string): Event {
  return {
    topic,
    operation,
    time,
    data,
    eventCode: buildEventCode(topic, operation),
  };
}

/**
 * 创建类型化事件
 */
export function createTypedEvent<T>(event: Event, parsedData: T): TypedEvent<T> {
  return {
    ...event,
    parsedData,
  };
}
