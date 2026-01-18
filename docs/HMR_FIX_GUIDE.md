# 🔧 页面自动刷新问题修复说明

## 问题原因

之前的 `server.js` 中集成了 WebSocket 代理服务器，这会拦截所有 WebSocket 连接，包括 Next.js 的 HMR (Hot Module Replacement) WebSocket 连接，导致 HMR 失败并引起页面自动刷新。

## 解决方案

将 WebSocket 代理服务器分离到独立端口（3004），避免与 Next.js 的 HMR WebSocket 冲突。

## 🚀 启动方式

### 方式1：同时启动两个服务器（推荐）

使用 `npm run dev:all` 同时启动 Next.js 服务器和 WebSocket 代理服务器：

```bash
npm run dev:all
```

这将：
- 启动 Next.js 开发服务器在 `http://localhost:3003`
- 启动 WebSocket 代理服务器在 `ws://localhost:3004`

### 方式2：分别启动

如果需要在不同的终端窗口中分别启动：

**终端 1 - 启动 Next.js 服务器：**
```bash
npm run dev
```

**终端 2 - 启动 WebSocket 代理服务器：**
```bash
npm run dev:ws
```

## 📂 文件结构

```
web/
├── server.js              # Next.js 服务器（端口 3003）
├── ws-proxy-server.js     # WebSocket 代理服务器（端口 3004）
├── package.json           # 包含新的启动脚本
└── lib/
    └── stepfun-realtime.ts # 客户端 WebSocket 连接代码
```

## 🔌 连接流程

1. **浏览器** → 连接到 `http://localhost:3003`（Next.js 应用）
2. **客户端代码** → 连接到 `ws://localhost:3004/ws-proxy`（WebSocket 代理）
3. **WebSocket 代理** → 转发到 `wss://api.stepfun.com/v1/realtime`（StepFun API）

## ✅ 修复验证

修复后，你应该看到：
- ✅ HMR WebSocket 连接成功（无错误日志）
- ✅ 代码修改后页面自动刷新（不会整页重载）
- ✅ WebSocket 代理正常工作（语音功能正常）

## 📊 日志对比

### 修复前（HMR 失败）
```
WebSocket connection to 'ws://localhost:3003/_next/webpack-hmr?id=...' failed:
[重复多次]
GET / 200 in 39ms (页面整页刷新)
```

### 修复后（HMR 正常）
```
✅ Compiled successfully in XXXms
[HMR] Connected
[HMR] Bundle updated
（无页面整页刷新）
```

## 🎯 后续建议

1. **生产环境**：生产环境可以使用 Next.js 的 API Routes 或独立的 WebSocket 服务
2. **Docker 部署**：可以将两个服务器打包到同一个 Docker 容器中
3. **监控**：添加两个服务器的健康检查和自动重启机制

---

*创建时间：2026-01-18*
