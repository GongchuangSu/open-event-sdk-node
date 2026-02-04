/**
 * Dispatcher 示例 - 按事件编码分发处理
 * 
 * 运行方式：
 * cd examples
 * pnpm install
 * APP_ID=your_app_id APP_SECRET=your_app_secret pnpm run dispatcher
 */

import { Client, Dispatcher, LogLevel } from 'open-event-sdk';

const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;

if (!appId || !appSecret) {
  console.error('请设置 APP_ID 和 APP_SECRET 环境变量');
  process.exit(1);
}

const dispatcher = new Dispatcher()
  // 注册消息处理
  .onV7AppChatMessageCreate((event) => {
    const { chat, sender, message } = event.parsedData;
    console.log(`[消息] 会话=${chat.id}, 发送者=${sender.id}, 内容=${JSON.stringify(message.content)}`);
    // TODO: 实现业务逻辑
  })
  // 注册机器人进群处理
  .onV7AppGroupChatMemberRobotCreate((event) => {
    console.log(`[进群] 群聊=${event.parsedData.chat_id}`);
    // TODO: 发送欢迎消息
  })
  // 兜底处理
  .registerFallbackFunc((event) => {
    console.log(`[其他] 事件=${event.eventCode}`);
  });

const client = new Client({
  appId,
  appSecret,
  dispatcher,
  logLevel: LogLevel.Info,
  reconnectMaxRetry: -1, // 无限重试
});

// 优雅关闭
const shutdown = async () => {
  console.log('正在关闭...');
  await client.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('启动事件订阅服务...');
await client.start();
