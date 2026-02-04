# Open Event SDK 使用示例

本目录包含 Open Event SDK 的使用示例。

## 准备工作

1. 进入 examples 目录：

```bash
cd examples
```

2. 安装依赖：

```bash
pnpm install
```

3. 设置环境变量：

```bash
export APP_ID="your_app_id"
export APP_SECRET="your_app_secret"
```

## 运行示例

### 简单示例（单一 Handler）

```bash
pnpm run simple
```

### Dispatcher 示例（按事件分发）

```bash
pnpm run dispatcher
```

## 示例说明

| 示例 | 文件 | 说明 |
|------|------|------|
| simple | `simple/index.ts` | 使用单一 Handler 处理所有事件 |
| dispatcher | `dispatcher/index.ts` | 使用 Dispatcher 按事件编码分发处理 |
