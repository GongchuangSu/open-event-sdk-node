/**
 * 通用类型定义
 */

/**
 * 身份标识类型
 */
export type IdentityType = 'user' | 'app' | 'service_principal';

/**
 * 扩展属性
 */
export interface V7ExtendedAttribute {
  /** 来源 */
  source?: string;
  /** 名称 */
  name?: string;
}

/**
 * 身份标识
 */
export interface V7Identity {
  /** 身份类型 */
  type: IdentityType;
  /** 身份 ID */
  id: string;
  /** 扩展属性 */
  extended_attribute?: V7ExtendedAttribute;
}

/**
 * 消息内容 - 文本
 */
export interface V7MessageContentText {
  text: string;
}

/**
 * 消息内容 - 图片
 */
export interface V7MessageContentImage {
  file_id: string;
}

/**
 * 消息内容 - 文件
 */
export interface V7MessageContentFile {
  file_id: string;
  name: string;
}

/**
 * 消息内容
 */
export interface V7MessageContent {
  /** 文本内容 */
  text?: string;
  /** 图片 */
  image?: V7MessageContentImage;
  /** 文件 */
  file?: V7MessageContentFile;
}

/**
 * @信息
 */
export interface V7ChatMessageMention {
  /** 类型：user-用户，all-所有人 */
  type: 'user' | 'all';
  /** 用户 ID（type=user 时有值） */
  id?: string;
  /** 在消息中的偏移位置 */
  offset: number;
  /** 长度 */
  length: number;
}
