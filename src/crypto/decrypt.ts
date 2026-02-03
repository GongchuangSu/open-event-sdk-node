/**
 * AES-CBC 解密实现
 */

import crypto from 'node:crypto';
import { md5 } from './signature';
import { DecryptError } from '../errors';

/**
 * 解密参数
 */
export interface DecryptParams {
  /** 应用 SecretKey */
  secretKey: string;
  /** 加密数据（标准 base64 编码） */
  encryptedData: string;
  /** iv 向量 */
  nonce: string;
}

/**
 * 解密事件数据
 *
 * 解密算法：
 * 1. encrypted_data 使用标准的有填充 base64 编码，先进行 base64 解码
 * 2. cipher = md5(secretKey)
 * 3. 使用 AES-CBC 解密，iv 为 nonce 的前 16 字节
 * 4. 解密后的数据经过 PKCS7 填充，需要移除填充
 *
 * @param params 解密参数
 * @returns 解密后的数据
 * @throws {DecryptError} 解密失败
 */
export function decrypt(params: DecryptParams): string {
  const { secretKey, encryptedData, nonce } = params;

  try {
    // 计算密钥 cipher = md5(secretKey)
    const cipherKey = md5(secretKey);

    // base64 解码
    const data = Buffer.from(encryptedData, 'base64');

    // iv 为 nonce 的前 16 字节
    const iv = Buffer.from(nonce.slice(0, 16), 'utf-8');

    // AES-256-CBC 解密
    // MD5 输出 32 字符 hex 字符串，作为 UTF-8 字符串转 Buffer 后是 32 字节
    // Go 版本使用 []byte(hexString)，也是 32 字节，所以实际是 AES-256
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(cipherKey, 'utf-8'), iv);

    // 禁用自动 padding 移除，手动处理
    decipher.setAutoPadding(false);

    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // PKCS7 去填充
    const unpadded = pkcs7Unpad(decrypted);

    return unpadded.toString('utf-8');
  } catch (error) {
    if (error instanceof DecryptError) {
      throw error;
    }
    throw new DecryptError(
      `Decrypt failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * PKCS7 去填充
 */
function pkcs7Unpad(data: Buffer): Buffer {
  if (data.length === 0) {
    return data;
  }

  const padding = data[data.length - 1];
  if (padding === undefined || padding > data.length || padding === 0) {
    return data;
  }

  // 验证填充是否有效
  for (let i = data.length - padding; i < data.length; i++) {
    if (data[i] !== padding) {
      return data;
    }
  }

  return data.subarray(0, data.length - padding);
}

// ========== 以下函数仅用于测试 ==========

/**
 * AES-CBC 加密（仅用于测试）
 *
 * @param rawData 原始数据
 * @param secretKey 密钥
 * @param nonce iv 向量
 * @returns 加密后的数据（base64 编码）
 */
export function encryptForTest(rawData: string, secretKey: string, nonce: string): string {
  // 计算密钥
  const cipherKey = md5(secretKey);

  // iv 为 nonce 的前 16 字节
  const iv = Buffer.from(nonce.slice(0, 16), 'utf-8');

  // PKCS7 填充
  const data = pkcs7Pad(Buffer.from(rawData, 'utf-8'), 16);

  // AES-256-CBC 加密（与解密算法保持一致）
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(cipherKey, 'utf-8'), iv);
  cipher.setAutoPadding(false);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return encrypted.toString('base64');
}

/**
 * PKCS7 填充（仅用于测试）
 */
function pkcs7Pad(data: Buffer, blockSize: number): Buffer {
  const padding = blockSize - (data.length % blockSize);
  const padBuffer = Buffer.alloc(padding, padding);
  return Buffer.concat([data, padBuffer]);
}
