const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 创建 WebSocket 服务器
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, request, clientApiKey) => {
    console.log('✅ Client connected to proxy');
    console.log('📋 API Key (first 10 chars):', clientApiKey ? clientApiKey.substring(0, 10) + '...' : 'MISSING');

    // 从请求中获取 API Key
    const apiKey = clientApiKey;

    if (!apiKey) {
      console.error('❌ No API Key provided');
      ws.close(1008, 'API Key required');
      return;
    }

    // 连接到 StepFun Realtime API
    let stepfunWs = null;
    let connectionFailed = false;
    const messageQueue = [];

    try {
      // 🔑 关键修复：在 URL 中添加 model 参数
      const stepfunWsUrl = `wss://api.stepfun.com/v1/realtime?model=step-audio-2-mini`;
      console.log('🔗 Connecting to StepFun Realtime API...');
      console.log('📡 URL:', stepfunWsUrl);

      stepfunWs = new WebSocket(stepfunWsUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      stepfunWs.on('open', () => {
        console.log('✅ Connected to StepFun Realtime API');
        console.log('📡 Ready to relay messages');

        // 发送队列中的消息
        if (messageQueue.length > 0 && !connectionFailed) {
          console.log(`📤 Sending ${messageQueue.length} queued messages`);
          messageQueue.forEach((msg) => {
            stepfunWs.send(msg);
          });
          messageQueue.length = 0;
        }
      });

      stepfunWs.on('message', (data) => {
        // 转发 StepFun 的消息到客户端
        if (ws.readyState === WebSocket.OPEN) {
          try {
            const message = JSON.parse(data.toString());
            console.log('📥 StepFun → Client:', message.type);
            ws.send(data.toString());
          } catch (e) {
            console.log('📥 StepFun → Client (raw)');
            ws.send(data.toString());
          }
        }
      });

      stepfunWs.on('error', (error) => {
        console.error('❌ StepFun WebSocket error:', error.message);
        connectionFailed = true;

        // 清空消息队列
        if (messageQueue.length > 0) {
          console.log(`🗑️ Clearing ${messageQueue.length} queued messages`);
          messageQueue.length = 0;
        }

        // 发送错误信息给客户端
        if (ws.readyState === WebSocket.OPEN) {
          const errorMsg = error.message || 'Connection failed';
          const errorMessage = {
            type: 'error',
            error: {
              type: 'connection_error',
              message: errorMsg,
            },
          };

          try {
            ws.send(JSON.stringify(errorMessage));
          } catch (e) {
            console.error('Failed to send error to client:', e);
          }
        }
      });

      stepfunWs.on('close', (code, reason) => {
        const reasonStr = reason?.toString() || 'No reason';
        console.log('🔌 StepFun WebSocket closed');
        console.log('   Code:', code);
        console.log('   Reason:', reasonStr);

        // 如果连接异常关闭（非正常关闭），发送错误消息
        if (code !== 1000 && ws.readyState === WebSocket.OPEN) {
          try {
            console.log('⚠️ Connection closed abnormally');
            const errorMessage = {
              type: 'error',
              error: {
                type: 'connection_closed',
                code: code,
                message: `Connection closed: ${reasonStr}`,
              },
            };
            ws.send(JSON.stringify(errorMessage));
          } catch (e) {
            console.error('Failed to send close error:', e);
          }
        }

        // 关闭客户端连接
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Server connection closed');
        }
      });
    } catch (error) {
      console.error('❌ Failed to connect to StepFun:', error.message);
      connectionFailed = true;
      ws.close(1011, 'Failed to connect to StepFun API');
      return;
    }

    // 接收客户端消息并转发到 StepFun
    ws.on('message', (data) => {
      console.log('📤 Client → StepFun');

      if (connectionFailed) {
        console.log('❌ Connection failed, message discarded');
        return;
      }

      if (stepfunWs && stepfunWs.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString());
          console.log('   Message type:', message.type);
          stepfunWs.send(data.toString());
        } catch (e) {
          stepfunWs.send(data.toString());
        }
      } else {
        console.log('⏳ StepFun WebSocket not ready, queuing message');
        // 将消息添加到队列
        if (typeof data === 'string') {
          messageQueue.push(data);
        } else {
          messageQueue.push(data.toString());
        }
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Client WebSocket error:', error);
    });

    ws.on('close', (code, reason) => {
      console.log('🔌 Client disconnected');

      // 清空消息队列
      if (messageQueue.length > 0) {
        console.log(`🗑️ Clearing ${messageQueue.length} queued messages`);
        messageQueue.length = 0;
      }

      // 关闭 StepFun 连接
      if (stepfunWs) {
        stepfunWs.close(1000, 'Client disconnected');
      }
    });
  });

  // 处理 WebSocket 升级请求
  server.on('upgrade', (request, socket, head) => {
    const { pathname, query } = parse(request.url, true);

    if (pathname === '/api/ws-proxy') {
      // 从查询参数中获取 API Key
      const apiKey = query.apiKey;

      if (!apiKey) {
        console.error('❌ No API Key in request');
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\nMissing API Key');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, apiKey);
      });
    } else {
      socket.destroy();
    }
  });

  server
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket proxy: ws://${hostname}:${port}/api/ws-proxy?apiKey=YOUR_KEY`);
      console.log('');
      console.log('📝 Usage:');
      console.log('   1. Open http://localhost:3000');
      console.log('   2. Click ⚙️ settings icon');
      console.log('   3. Enter your StepFun API Key');
      console.log('   4. Click 🎤 microphone button to start');
      console.log('');
      console.log('🔧 Configuration:');
      console.log('   Model: step-audio-2-mini');
      console.log('   Voice: qingchunshaonv (青春少女)');
      console.log('');
    })
    .on('error', (err) => {
      console.error(err);
      process.exit(1);
    });
});
