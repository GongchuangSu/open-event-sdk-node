# open-event-sdk-node

开放平台事件订阅 SDK（Node.js 版），支持通过 WebSocket 长连接接收和处理事件。

## 特性

- **WebSocket 长连接**：无需公网 IP，延迟更低、实时性更好
- **自动重连**：网络断开时自动重连，支持指数退避策略
- **KSO-1 签名认证**：安全的认证机制
- **灵活的事件处理**：支持单一 Handler 和 Dispatcher 分发两种模式
- **类型安全**：完整的 TypeScript 类型定义
- **开箱即用**：内置默认配置，无需额外设置即可使用

## 安装

```bash
# npm
npm install open-event-sdk

# pnpm
pnpm add open-event-sdk

# yarn
yarn add open-event-sdk
```

## 快速开始

```typescript
import { Client } from 'open-event-sdk';

const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  handler: {
    handle(event) {
      console.log(`收到事件: event_code=${event.eventCode}`);
      console.log(`事件数据: ${event.data}`);
    },
  },
});

await client.start();
```

### Dispatcher 分发模式

按事件编码（event_code）分别处理不同事件：

```typescript
import { Client, Dispatcher } from 'open-event-sdk';

// 创建分发器
const dispatcher = new Dispatcher();

// 注册不同事件编码的处理器
// 事件编码 = topic.operation，如 "kso.app_chat.message.create"
dispatcher.registerFunc('kso.app_chat.message.create', (event) => {
  console.log('处理聊天消息事件:', event.data);
});

dispatcher.registerFunc('kso.user.status.update', (event) => {
  console.log('处理用户状态变更事件:', event.data);
});

// 注册兜底处理器
dispatcher.registerFallbackFunc((event) => {
  console.log(`未知事件: event_code=${event.eventCode}`);
});

// 创建客户端
const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  dispatcher,
});

await client.start();
```

### 类型化事件处理

目前部分事件已支持 `onV7XXX` 方法，可使用链式调用注册类型化处理器，事件数据会自动解析为对应的类型。其他事件请使用 `registerFunc` 方法处理。

**已支持 onV7XXX 方法的事件：**

| 方法 | 事件编码 | 说明 |
|------|---------|------|
| `onV7AppChatMessageCreate` | `kso.app_chat.message.create` | 用户给应用发送消息 |
| `onV7AppChatCreate` | `kso.app_chat.create` | 首次创建用户和机器人的会话 |
| `onV7AppGroupChatDelete` | `kso.xz.app.group_chat.delete` | 群聊解散 |
| `onV7AppGroupChatMemberUserCreate` | `kso.xz.app.group_chat.member.user.create` | 用户进群 |
| `onV7AppGroupChatMemberUserDelete` | `kso.xz.app.group_chat.member.user.delete` | 用户退群 |
| `onV7AppGroupChatMemberRobotCreate` | `kso.xz.app.group_chat.member.robot.create` | 机器人进群 |
| `onV7AppGroupChatMemberRobotDelete` | `kso.xz.app.group_chat.member.robot.delete` | 机器人退群 |

**组合使用示例：**

```typescript
import { Client, Dispatcher } from 'open-event-sdk';

const dispatcher = new Dispatcher()
  // ========== 方式一: OnV7XXX 方法（类型安全，推荐） ==========
  .onV7AppChatMessageCreate((event) => {
    // event.parsedData 是 V7NotificationAppChatMessageCreateData 类型
    const { chat, sender, message } = event.parsedData;
    console.log(`收到消息: chat_id=${chat.id}, sender=${sender.id}`);
  })
  .onV7AppChatCreate((event) => {
    console.log(`会话创建: chat_id=${event.parsedData.chat_id}`);
  })
  .onV7AppGroupChatMemberUserCreate((event) => {
    console.log(`用户进群: chat_id=${event.parsedData.chat_id}`);
  })

  // ========== 方式二: RegisterFunc（处理其他事件，需自行解析 Data） ==========
  .registerFunc('kso.user.status.update', (event) => {
    console.log(`用户状态变更: ${event.eventCode}`);
    const data = JSON.parse(event.data);
    console.log('数据:', data);
  })

  // ========== 兜底处理器 ==========
  .registerFallbackFunc((event) => {
    console.log(`未处理的事件: ${event.eventCode}`);
  });

const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  dispatcher,
});

await client.start();
```

**使用事件数据模型：**

如需直接使用事件数据模型，可导入相关类型：

```typescript
import type {
  V7Identity,
  V7NotificationAppChatMessageCreateData,
} from 'open-event-sdk/event/model';
```

## 配置选项

### 基础配置

```typescript
import { Client, LogLevel, DefaultLogger } from 'open-event-sdk';

const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',

  // 自定义 WebSocket 端点（可选，默认 wss://openapi.wps.cn/v7/event/ws）
  endpoint: 'wss://custom-endpoint.com/event/ws',

  // 设置日志级别
  logLevel: LogLevel.Debug,

  // 使用自定义日志
  logger: new DefaultLogger(LogLevel.Debug),

  handler: { handle: (event) => console.log(event) },
});
```

### 重连配置（指数退避策略）

SDK 采用指数退避（Exponential Backoff）策略进行重连，避免在网络恢复时产生惊群效应。

**重连间隔计算公式**：`interval = min(baseInterval * multiplier^(retryCount-1), maxInterval) * (1 ± jitter)`

```typescript
const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',

  // 开启/关闭自动重连（默认开启）
  autoReconnect: true,

  // 重连基础间隔（默认 1000 毫秒）
  reconnectBaseInterval: 1000,

  // 重连最大间隔（默认 60000 毫秒）
  reconnectMaxInterval: 60000,

  // 重连间隔倍数（默认 2.0）
  reconnectMultiplier: 2.0,

  // 最大重试次数（-1 表示无限重试，默认 -1）
  reconnectMaxRetry: 10,

  // 重连抖动系数（默认 0.2，表示 ±20% 随机抖动）
  reconnectJitter: 0.2,

  handler: { handle: () => {} },
});
```

**默认重连时间序列示例**（baseInterval=1s, multiplier=2, maxInterval=60s, jitter=0.2）：

| 重试次数 | 基础间隔 | 实际间隔范围 |
|---------|---------|-------------|
| 1 | 1s | 0.8s ~ 1.2s |
| 2 | 2s | 1.6s ~ 2.4s |
| 3 | 4s | 3.2s ~ 4.8s |
| 4 | 8s | 6.4s ~ 9.6s |
| 5 | 16s | 12.8s ~ 19.2s |
| 6 | 32s | 25.6s ~ 38.4s |
| 7+ | 60s | 48s ~ 72s |

### 超时配置

```typescript
const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',

  // 写操作超时（默认 10000 毫秒）
  writeTimeout: 10000,

  // Pong 等待超时（默认 90000 毫秒）
  pongTimeout: 90000,

  handler: { handle: () => {} },
});
```

## 事件结构

### 解密后的事件结构

SDK 会自动验证签名并解密数据，处理器接收到的是解密后的事件：

```typescript
interface Event {
  topic: string;      // 消息主题
  operation: string;  // 变更动作
  time: number;       // 时间戳（秒）
  data: string;       // 解密后的事件数据（JSON 字符串）
  eventCode: string;  // 事件编码（topic.operation）
}
```

**事件编码（event_code）说明**：
- 事件编码 = `topic` + `.` + `operation`，全局唯一
- 例如：`topic="kso.app_chat.message"`, `operation="create"` → `event_code="kso.app_chat.message.create"`
- 通过 `event.eventCode` 属性获取事件编码
- Dispatcher 按事件编码进行事件分发

## 优雅关闭

```typescript
// 监听退出信号
process.on('SIGINT', async () => {
  await client.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await client.stop();
  process.exit(0);
});

await client.start();
```

## 自定义日志

实现 `Logger` 接口：

```typescript
import type { Logger } from 'open-event-sdk';

class MyLogger implements Logger {
  debug(...args: unknown[]): void {
    // 自定义实现
  }
  info(...args: unknown[]): void {
    // 自定义实现
  }
  warn(...args: unknown[]): void {
    // 自定义实现
  }
  error(...args: unknown[]): void {
    // 自定义实现
  }
}

const client = new Client({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  logger: new MyLogger(),
  handler: { handle: () => {} },
});
```

## 目录结构

```
open-event-sdk-node/
├── src/
│   ├── index.ts              # 统一入口导出
│   ├── client.ts             # WebSocket 客户端主类
│   ├── types.ts              # 公共类型定义
│   ├── event/                # 事件处理模块
│   │   ├── event.ts          # Event 实体
│   │   ├── handler.ts        # Handler 接口
│   │   ├── dispatcher.ts     # 事件分发器
│   │   └── model/            # 事件数据模型
│   ├── crypto/               # 加解密模块
│   │   ├── signature.ts      # KSO-1 签名
│   │   └── decrypt.ts        # AES-CBC 解密
│   ├── logger/               # 日志模块
│   ├── protocol/             # 协议定义
│   └── errors/               # 错误类型
├── examples/                 # 使用示例
│   ├── simple/               # 简单示例
│   └── dispatcher/           # Dispatcher 模式示例
└── tests/                    # 测试文件
```

## 协议说明

### 消息类型

服务端通过 WebSocket 向客户端推送两种类型的消息：

#### 1. 事件消息

携带加密的事件数据，SDK 会自动验签和解密。

#### 2. 关闭通知（goaway）

服务端主动关闭连接时发送：

**GoAway 原因类型**：

| 原因 | 说明 | 是否重连 |
|------|------|---------|
| `server_shutdown` | 服务器关闭（如维护升级） | 是，按建议时间延迟重连 |
| `connection_replaced` | 连接被新连接替换（同一应用重复连接） | 否 |
| `heartbeat_timeout` | 心跳超时 | 是 |

### 心跳机制

- 服务端每 30 秒发送 WebSocket Ping
- 客户端自动回复 Pong
- 90 秒内未收到 Pong 则断开连接

### 认证方式

使用 KSO-1 签名认证，需要在 WebSocket 握手时携带以下 HTTP 头：

- `X-Kso-Date`: 请求时间（RFC1123 格式）
- `X-Kso-Authorization`: 签名（格式：`KSO-1 {app_id}:{signature}`）

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 运行测试（带覆盖率）
pnpm test:coverage

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 许可证

MIT License
