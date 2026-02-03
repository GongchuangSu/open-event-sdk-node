/**
 * Dispatcher 示例 - 按事件编码分发处理
 */

import { Client, Dispatcher, LogLevel } from '../../src';

// 从环境变量获取配置
const appId = process.env.APP_ID ?? '';
const appSecret = process.env.APP_SECRET ?? '';

if (!appId || !appSecret) {
  console.error('请设置环境变量 APP_ID 和 APP_SECRET');
  process.exit(1);
}

// 创建分发器
const dispatcher = new Dispatcher()
  // ========== 方式一: OnV7XXX 方法（类型安全，推荐） ==========
  .onV7AppChatMessageCreate((event) => {
    const { chat, sender, message } = event.parsedData;
    console.log('='.repeat(50));
    console.log('[消息事件]');
    console.log(`  会话ID: ${chat.id}`);
    console.log(`  发送者: ${sender.id} (${sender.type})`);
    console.log(`  消息ID: ${message.id}`);
    console.log(`  消息类型: ${message.type}`);
    console.log(`  消息内容: ${JSON.stringify(message.content)}`);
    console.log('='.repeat(50));
  })
  .onV7AppChatCreate((event) => {
    const { chat_id, creator, company_id } = event.parsedData;
    console.log('='.repeat(50));
    console.log('[会话创建事件]');
    console.log(`  会话ID: ${chat_id}`);
    console.log(`  创建者: ${creator.id} (${creator.type})`);
    console.log(`  企业ID: ${company_id}`);
    console.log('='.repeat(50));
  })
  .onV7AppGroupChatMemberUserCreate((event) => {
    const { chat_id, operator, users } = event.parsedData;
    console.log('='.repeat(50));
    console.log('[用户进群事件]');
    console.log(`  会话ID: ${chat_id}`);
    console.log(`  操作者: ${operator.id}`);
    console.log(`  进群用户: ${users.map((u) => u.id).join(', ')}`);
    console.log('='.repeat(50));
  })
  .onV7AppGroupChatMemberUserDelete((event) => {
    const { chat_id, operator, users } = event.parsedData;
    console.log('='.repeat(50));
    console.log('[用户退群事件]');
    console.log(`  会话ID: ${chat_id}`);
    console.log(`  操作者: ${operator.id}`);
    console.log(`  退群用户: ${users.map((u) => u.id).join(', ')}`);
    console.log('='.repeat(50));
  })
  .onV7AppGroupChatDelete((event) => {
    const { chat_id, operator } = event.parsedData;
    console.log('='.repeat(50));
    console.log('[群聊解散事件]');
    console.log(`  会话ID: ${chat_id}`);
    console.log(`  操作者: ${operator.id}`);
    console.log('='.repeat(50));
  })

  // ========== 方式二: RegisterFunc（处理其他事件，需自行解析 Data） ==========
  .registerFunc('kso.user.status.update', (event) => {
    console.log('='.repeat(50));
    console.log('[用户状态变更事件]');
    console.log(`  事件编码: ${event.eventCode}`);
    console.log(`  数据: ${event.data}`);
    console.log('='.repeat(50));
  })

  // ========== 兜底处理器 ==========
  .registerFallbackFunc((event) => {
    console.log('='.repeat(50));
    console.log('[未处理的事件]');
    console.log(`  事件编码: ${event.eventCode}`);
    console.log(`  Topic: ${event.topic}`);
    console.log(`  Operation: ${event.operation}`);
    console.log(`  数据: ${event.data}`);
    console.log('='.repeat(50));
  });

// 创建客户端
const client = new Client({
  appId,
  appSecret,
  logLevel: LogLevel.Info,
  dispatcher,
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭...');
  await client.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在关闭...');
  await client.stop();
  process.exit(0);
});

// 启动客户端
console.log('启动客户端...');
console.log(`已注册的事件: ${dispatcher.getEventCodes().join(', ')}`);
client.start().catch((error) => {
  console.error('客户端错误:', error);
  process.exit(1);
});
