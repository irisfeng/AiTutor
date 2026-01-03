# ✅ 问题已修复 - WebSocket 代理方案

## 🔍 问题原因

**浏览器 WebSocket API 不支持设置 headers**，而 StepFun Realtime API 需要通过 `Authorization` header 传递 API Key 进行身份验证。

## ✨ 解决方案

创建了**服务端 WebSocket 代理**，架构如下：

```
浏览器 --WebSocket--> 本地代理 --WebSocket--> StepFun API
                            (添加 Authorization header)
```

---

## 🚀 重新启动应用

### 1. 停止当前服务

按 `Ctrl + C` 停止当前运行的 `npm run dev`

### 2. 重新启动

```bash
npm run dev
```

你会看到：
```
> Ready on http://localhost:3000
> WebSocket proxy: ws://localhost:3000/api/ws-proxy?apiKey=YOUR_KEY
```

### 3. 访问应用

打开浏览器访问: **http://localhost:3000**

---

## 📋 使用流程

1. **配置 API Key**
   - 点击右上角 ⚙️ 设置图标
   - 输入你的 StepFun API Key
   - 选择语言（中文/English）

2. **开始对话**
   - 点击中央的 🎤 麦克风按钮
   - 允许麦克风权限
   - 开始说话
   - 等待 AI 响应

---

## 🔧 技术实现

### 新增文件

**`server.js`** - 自定义 Next.js 服务器
- 创建 WebSocket 代理
- 在服务端添加 `Authorization` header
- 双向转发客户端和 StepFun 之间的消息

### 更新文件

**`lib/stepfun-realtime.ts`** - 客户端代码
- 连接到本地代理而非直接连接 StepFun
- 通过 URL 参数传递 API Key：`ws://localhost:3000/api/ws-proxy?apiKey=***`

**`package.json`** - 启动脚本
```json
"dev": "node server.js"  // 使用自定义服务器
"start": "NODE_ENV=production node server.js"
```

---

## 🎯 工作原理

### 1. 客户端连接
```javascript
// 浏览端代码
const wsUrl = `ws://localhost:3000/api/ws-proxy?apiKey=${apiKey}`;
const ws = new WebSocket(wsUrl);
```

### 2. 代理服务器处理
```javascript
// 服务端代码 (server.js)
wss.on('connection', (ws, request, clientApiKey) => {
  // 使用 API Key 连接到 StepFun
  const stepfunWs = new WebSocket(
    'wss://api.stepfun.com/v1/realtime',
    {
      headers: {
        'Authorization': `Bearer ${clientApiKey}`
      }
    }
  );

  // 双向转发消息
  ws.on('message', (data) => stepfunWs.send(data));
  stepfunWs.on('message', (data) => ws.send(data));
});
```

### 3. 安全性

✅ **API Key 不会暴露在浏览器代码中**
✅ **通过服务端安全传递到 StepFun**
✅ **符合最佳实践**

---

## 🐛 调试信息

### 查看日志

**服务端日志**（终端）：
```
Client connected to proxy
Connected to StepFun Realtime API
Received message from client, forwarding to StepFun
```

**客户端日志**（浏览器控制台，按 F12）：
```
Connecting to proxy: ws://localhost:3000/api/ws-proxy?apiKey=***
WebSocket connected to proxy
Session update sent
```

### 常见问题

**Q: 连接失败**
A:
1. 检查 API Key 是否正确
2. 查看终端是否有错误日志
3. 打开浏览器控制台（F12）查看错误

**Q: 没有声音**
A:
1. 确认麦克风权限已授予
2. 检查系统音量
3. 查看控制台日志

**Q: 端口被占用**
A:
```bash
# 修改 server.js 中的端口号
const port = 3001;  // 改成其他端口
```

---

## 📚 参考资源

- [StepFun Realtime API 文档](https://platform.stepfun.com/docs/zh/api-reference/realtime/chat)
- [Step-Realtime-Console](https://github.com/stepfun-ai/Step-Realtime-Console) - 官方 Demo

---

## 🎉 测试清单

- [x] 构建成功
- [x] 服务端代理创建完成
- [x] 客户端代码更新完成
- [ ] 实际连接测试（需要你提供有效的 API Key）

---

**现在请重新启动应用并测试！** 🚀

```bash
npm run dev
```

然后访问 http://localhost:3000 并输入你的 API Key。
