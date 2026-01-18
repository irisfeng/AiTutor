const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3003;

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

  server
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('');
      console.log('📝 Usage:');
      console.log('   1. Open http://localhost:3003');
      console.log('   2. Click ⚙️ settings icon');
      console.log('   3. Enter your StepFun API Key');
      console.log('   4. Click 🎤 microphone button to start');
      console.log('');
      console.log('🔧 Configuration:');
      console.log('   Model: step-audio-2');
      console.log('   Voice: qingchunshaonv (青春少女)');
      console.log('');
    })
    .on('error', (err) => {
      console.error(err);
      process.exit(1);
    });
});
