/**
 * 加解密模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  md5,
  hmacSha256,
  hmacSha256Hex,
  signForWebSocket,
  verifySignature,
  decrypt,
  encryptForTest,
} from '../../src/crypto';

describe('crypto', () => {
  describe('md5', () => {
    it('should compute correct MD5 hash', () => {
      // 已知的 MD5 测试向量
      expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
      expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
      expect(md5('hello world')).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
    });
  });

  describe('hmacSha256', () => {
    it('should compute correct HMAC-SHA256 signature (base64url)', () => {
      const message = 'test message';
      const secret = 'secret key';
      const signature = hmacSha256(message, secret);

      // 签名应该是 URL 安全的 base64 编码
      expect(signature).not.toContain('+');
      expect(signature).not.toContain('/');
      expect(signature).not.toContain('=');
    });

    it('should produce different signatures for different messages', () => {
      const secret = 'secret';
      const sig1 = hmacSha256('message1', secret);
      const sig2 = hmacSha256('message2', secret);
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const message = 'message';
      const sig1 = hmacSha256(message, 'secret1');
      const sig2 = hmacSha256(message, 'secret2');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('hmacSha256Hex', () => {
    it('should compute correct HMAC-SHA256 signature (hex)', () => {
      const message = 'test message';
      const secret = 'secret key';
      const signature = hmacSha256Hex(message, secret);

      // 签名应该是 64 字符的 hex 字符串
      expect(signature).toHaveLength(64);
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('signForWebSocket', () => {
    it('should generate valid headers', () => {
      const headers = signForWebSocket({
        appId: 'test_app_id',
        appSecret: 'test_app_secret',
        uri: '/v7/event/ws',
      });

      expect(headers['X-Kso-Date']).toBeDefined();
      expect(headers['X-Kso-Authorization']).toBeDefined();
      expect(headers['X-Kso-Authorization']).toMatch(/^KSO-1 test_app_id:/);

      // 签名应该是 64 字符的 hex 格式
      const signature = headers['X-Kso-Authorization'].split(':')[1];
      expect(signature).toHaveLength(64);
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different signatures for different URIs', () => {
      const params = {
        appId: 'test_app_id',
        appSecret: 'test_app_secret',
      };

      const headers1 = signForWebSocket({ ...params, uri: '/v7/event/ws' });
      const headers2 = signForWebSocket({ ...params, uri: '/v7/event/ws?token=abc' });

      // 签名部分应该不同
      const sig1 = headers1['X-Kso-Authorization'].split(':')[1];
      const sig2 = headers2['X-Kso-Authorization'].split(':')[1];
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const params = {
        accessKey: 'test_app_id',
        secretKey: 'test_app_secret',
        topic: 'kso.app_chat.message',
        nonce: 'test_nonce_12345',
        time: 1704067200,
        encryptedData: 'encrypted_data_base64',
        signature: '', // 将在下面计算
      };

      // 构建签名原文
      const content = `${params.accessKey}:${params.topic}:${params.nonce}:${params.time}:${params.encryptedData}`;
      params.signature = hmacSha256(content, params.secretKey);

      expect(verifySignature(params)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const params = {
        accessKey: 'test_app_id',
        secretKey: 'test_app_secret',
        topic: 'kso.app_chat.message',
        nonce: 'test_nonce_12345',
        time: 1704067200,
        encryptedData: 'encrypted_data_base64',
        signature: 'invalid_signature',
      };

      expect(verifySignature(params)).toBe(false);
    });

    it('should reject tampered data', () => {
      const params = {
        accessKey: 'test_app_id',
        secretKey: 'test_app_secret',
        topic: 'kso.app_chat.message',
        nonce: 'test_nonce_12345',
        time: 1704067200,
        encryptedData: 'encrypted_data_base64',
        signature: '',
      };

      // 计算正确签名
      const content = `${params.accessKey}:${params.topic}:${params.nonce}:${params.time}:${params.encryptedData}`;
      params.signature = hmacSha256(content, params.secretKey);

      // 篡改数据
      params.encryptedData = 'tampered_data';

      expect(verifySignature(params)).toBe(false);
    });
  });

  describe('decrypt / encryptForTest', () => {
    it('should encrypt and decrypt correctly', () => {
      const secretKey = 'my_secret_key_12';
      const nonce = 'nonce_12345678901234567890'; // 至少 16 字节
      const plainText = '{"message": "hello world"}';

      // 加密
      const encrypted = encryptForTest(plainText, secretKey, nonce);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);

      // 解密
      const decrypted = decrypt({
        secretKey,
        encryptedData: encrypted,
        nonce,
      });

      expect(decrypted).toBe(plainText);
    });

    it('should handle Chinese characters', () => {
      const secretKey = 'my_secret_key_12';
      const nonce = 'nonce_12345678901234567890';
      const plainText = '{"message": "你好，世界！"}';

      const encrypted = encryptForTest(plainText, secretKey, nonce);
      const decrypted = decrypt({
        secretKey,
        encryptedData: encrypted,
        nonce,
      });

      expect(decrypted).toBe(plainText);
    });

    it('should handle empty string', () => {
      const secretKey = 'my_secret_key_12';
      const nonce = 'nonce_12345678901234567890';
      const plainText = '';

      const encrypted = encryptForTest(plainText, secretKey, nonce);
      const decrypted = decrypt({
        secretKey,
        encryptedData: encrypted,
        nonce,
      });

      expect(decrypted).toBe(plainText);
    });

    it('should handle long text', () => {
      const secretKey = 'my_secret_key_12';
      const nonce = 'nonce_12345678901234567890';
      const plainText = JSON.stringify({
        message: 'a'.repeat(10000),
        nested: {
          array: [1, 2, 3, 4, 5],
          object: { key: 'value' },
        },
      });

      const encrypted = encryptForTest(plainText, secretKey, nonce);
      const decrypted = decrypt({
        secretKey,
        encryptedData: encrypted,
        nonce,
      });

      expect(decrypted).toBe(plainText);
    });
  });
});
