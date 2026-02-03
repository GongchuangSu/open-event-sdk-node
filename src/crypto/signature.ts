/**
 * KSO-1 签名实现
 */

import crypto from 'node:crypto';

/**
 * 计算 HMAC-SHA256 签名
 * 返回 hex 编码（用于 KSO-1 HTTP 签名）
 */
export function hmacSha256Hex(message: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('hex');
}

/**
 * 计算 HMAC-SHA256 签名
 * 返回 URL 安全的无填充 base64 编码（用于事件消息签名验证）
 */
export function hmacSha256(message: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('base64url');
}

/**
 * 计算 SHA256 哈希
 * 返回 hex 编码
 */
export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 计算 MD5 哈希
 * 返回 32 字符的 hex 字符串
 */
export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * WebSocket 握手签名参数
 */
export interface SignForWebSocketParams {
  appId: string;
  appSecret: string;
  uri: string;
}

/**
 * WebSocket 握手签名结果
 */
export interface SignForWebSocketResult {
  'X-Kso-Date': string;
  'X-Kso-Authorization': string;
}

/**
 * KSO-1 签名类型标识
 */
const KSO1_TYPE = 'KSO-1';

/**
 * 为 WebSocket 握手生成 KSO-1 签名
 *
 * 签名算法（与 Go 版本一致）：
 * 1. 计算 body 的 SHA256（WebSocket 握手无 body，为空字符串）
 * 2. 构建待签名字符串：KSO-1 + method + uri + contentType + date + sha256(body)
 * 3. 使用 HMAC-SHA256(appSecret, stringToSign) 计算签名
 * 4. 签名使用 hex 编码
 * 5. 返回 Authorization 格式：KSO-1 {app_id}:{hex_signature}
 *
 * @param params 签名参数
 * @returns 签名 Headers
 */
export function signForWebSocket(params: SignForWebSocketParams): SignForWebSocketResult {
  const { appId, appSecret, uri } = params;

  // HTTP TimeFormat: Mon, 02 Jan 2006 15:04:05 GMT
  const now = new Date();
  const dateStr = now.toUTCString();

  // WebSocket 握手无 body 和 contentType
  const method = 'GET';
  const contentType = '';
  const sha256Body = ''; // body 为空时，sha256 为空字符串

  // 构建待签名字符串：KSO-1 + method + uri + contentType + date + sha256(body)
  const stringToSign = KSO1_TYPE + method + uri + contentType + dateStr + sha256Body;

  // 使用 HMAC-SHA256 计算签名，返回 hex 编码
  const signature = hmacSha256Hex(stringToSign, appSecret);

  return {
    'X-Kso-Date': dateStr,
    'X-Kso-Authorization': `${KSO1_TYPE} ${appId}:${signature}`,
  };
}

/**
 * 签名验证参数
 */
export interface VerifySignatureParams {
  /** 应用 AccessKey (AppId) */
  accessKey: string;
  /** 应用 SecretKey (AppSecret) */
  secretKey: string;
  /** 消息主题 */
  topic: string;
  /** 随机数/iv向量 */
  nonce: string;
  /** 时间戳（秒） */
  time: number;
  /** 加密数据 */
  encryptedData: string;
  /** 待验证的签名 */
  signature: string;
}

/**
 * 验证消息签名
 *
 * 签名算法：
 * 1. 计算签名原文 content = access_key:topic:nonce:time:encrypted_data
 * 2. 使用 HMAC-SHA256(content, secret_key) 计算签名
 * 3. 签名使用 URL 安全的无填充 base64 编码
 *
 * @param params 验证参数
 * @returns 签名是否有效
 */
export function verifySignature(params: VerifySignatureParams): boolean {
  const { accessKey, secretKey, topic, nonce, time, encryptedData, signature } = params;

  // 构建签名原文
  const content = `${accessKey}:${topic}:${nonce}:${time}:${encryptedData}`;

  // 计算期望签名
  const expectedSignature = hmacSha256(content, secretKey);

  // 时间安全比较
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    // 长度不同时 timingSafeEqual 会抛出错误
    return false;
  }
}
