/**
 * 简单示例 - 使用单一 Handler 处理所有事件
 */

import { Client, LogLevel } from 'open-event-sdk';

// 从环境变量获取配置
const appId = process.env.APP_ID ?? '';
const appSecret = process.env.APP_SECRET ?? '';

if (!appId || !appSecret) {
  console.error('请设置环境变量 APP_ID 和 APP_SECRET');
  process.exit(1);
}

// 创建客户端
const client = new Client({
  appId,
  appSecret,
  logLevel: LogLevel.Debug,
  handler: {
    handle(event) {
      console.log('='.repeat(50));
      console.log(`收到事件: ${event.eventCode}`);
      console.log(`Topic: ${event.topic}`);
      console.log(`Operation: ${event.operation}`);
      console.log(`Time: ${new Date(event.time * 1000).toISOString()}`);
      console.log(`Data: ${event.data}`);
      console.log('='.repeat(50));
    },
  },
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭...');
  client.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭...');
  client.stop();
  process.exit(0);
});

// 启动客户端
console.log('启动客户端...');
client.start().catch((error) => {
  console.error('客户端错误:', error);
  process.exit(1);
});
