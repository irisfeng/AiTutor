# 🔍 400 错误诊断指南

## 问题现象

```
StepFun WebSocket error: Unexpected server response: 400
```

## 可能原因和解决方案

### 1. API Key 无效或格式错误 ⭐ 最常见

**症状**: 立即收到 400 错误

**检查步骤**:
1. 访问 [StepFun 控制台](https://platform.stepfun.com)
2. 确认你的 API Key 是否正确
3. 重新复制 API Key（确保没有多余的空格）

**正确格式**:
```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. 账户余额不足

**症状**: 连接后立即断开，或收到特定错误码

**检查步骤**:
1. 登录 [StepFun 控制台](https://platform.stepfun.com)
2. 查看**账户余额**是否充足
3. 查看**用量统计**确认未超限

### 3. API Key 没有相应权限

**症状**: 400 错误 + "unauthorized" 或 "forbidden"

**检查步骤**:
1. 确认 API Key 类型是**实时语音 API**专用的
2. 某些 API Key 可能只支持文本对话，不支持语音功能
3. 联系 StepFun 客服确认权限

### 4. 模型名称不匹配

**当前配置**: `step-audio-2-mini`

**检查步骤**:
1. 登录 StepFun 控制台
2. 查看可用模型列表
3. 确认 `step-audio-2-mini` 是否已开通

### 5. 网络问题

**症状**: 连接超时或不稳定

**检查步骤**:
1. 尝试访问 `https://api.stepfun.com`
2. 检查是否在公司网络/防火墙后
3. 尝试使用 VPN 或切换网络

---

## 🛠️ 调试步骤

### 步骤 1: 查看服务端日志

重启应用后，查看终端输出：

```
✅ Client connected to proxy
📋 API Key (first 10 chars): sk-abc12345...
🔗 Connecting to StepFun Realtime API...
❌ StepFun WebSocket error: Unexpected server response: 400
```

### 步骤 2: 查看浏览器控制台

按 `F12` 打开浏览器控制台，查看：

```
Connecting to proxy: ws://localhost:3000/api/ws-proxy?apiKey=***
Using model: step-audio-2-mini
Using voice: qingchunshaonv
✅ WebSocket connected to proxy
📤 Sending session update with model: step-audio-2-mini
✅ Session update sent
```

### 步骤 3: 测试 API Key

使用 curl 测试 API Key 是否有效：

```bash
curl https://api.stepfun.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "step-audio-2-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**预期结果**:
- ✅ 返回 JSON 响应 = API Key 有效
- ❌ 返回 401/403 = API Key 无效或无权限

---

## ✅ 当前配置

### 模型
- **名称**: `step-audio-2-mini`
- **音色**: `qingchunshaonv` (青春少女)
- **指令**: "请使用默认女声与用户交流"

### WebSocket URL
```
wss://api.stepfun.com/v1/realtime
```

### 认证方式
```
Authorization: Bearer YOUR_API_KEY
```

---

## 📞 获取帮助

### 1. StepFun 官方支持
- **邮箱**: platform@stepfun.com
- **文档**: https://platform.stepfun.com/docs
- **控制台**: https://platform.stepfun.com

### 2. 常见问题

**Q: API Key 在哪里获取？**
A: 访问 https://platform.stepfun.com → 登录 → API Keys → 创建新密钥

**Q: step-audio-2-mini 和其他模型有什么区别？**
A: `step-audio-2-mini` 是轻量级音频模型，响应更快，适合实时对话

**Q: 为什么需要代理服务器？**
A: 浏览器 WebSocket API 不支持设置 headers，必须通过服务端中转

---

## 🔄 重新测试

### 1. 确认配置
当前使用：
- ✅ 模型: `step-audio-2-mini`
- ✅ 音色: `qingchunshaonv` (青春少女)
- ✅ 指令: "请使用默认女声与用户交流"

### 2. 重启应用
```bash
# 按 Ctrl+C 停止当前服务
npm run dev
```

### 3. 测试流程
1. 访问 http://localhost:3000
2. 点击 ⚙️ 设置图标
3. 输入正确的 API Key
4. 点击 🎤 麦克风按钮
5. 查看终端和浏览器控制台的日志

---

## 📊 日志示例

### ✅ 成功的日志
```
✅ Client connected to proxy
📋 API Key (first 10 chars): sk-abc12345...
🔗 Connecting to StepFun Realtime API...
✅ Connected to StepFun Realtime API
📡 Ready to relay messages
📤 Client → StepFun
   Message type: session.update
📥 StepFun → Client: session.updated
```

### ❌ 失败的日志
```
✅ Client connected to proxy
📋 API Key (first 10 chars): sk-abc12345...
🔗 Connecting to StepFun Realtime API...
❌ StepFun WebSocket error: Unexpected server response: 400
```

**400 错误通常表示**:
- API Key 无效
- 账户余额不足
- 模型未开通
- 权限不足

---

## 🎯 下一步行动

1. **检查 API Key**: 登录 StepFun 控制台确认
2. **检查余额**: 确保账户有足够余额
3. **查看权限**: 确认 API Key 支持语音功能
4. **重新测试**: 使用正确的 API Key 重新连接

---

**最后更新**: 2025-12-30
**配置状态**: 使用 step-audio-2-mini + qingchunshaonv (青春少女)
