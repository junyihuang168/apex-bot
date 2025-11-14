// index.js  — 方案 A：只收 TradingView 警报 + 打日志

const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// 可选：和之前一样的 Webhook 密钥（你在 DO 的 WEBHOOK_SECRET）
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.send('Apex-bot is running (LOG ONLY mode)');
});

// TradingView webhook
app.post('/tv-webhook', (req, res) => {
  console.log('🌐 Incoming request: POST /tv-webhook');

  // 1. 校验密钥（如果你在 TradingView 的 JSON 里有带 secret，就验证一下）
  const payload = req.body || {};
  if (WEBHOOK_SECRET) {
    if (!payload.secret || payload.secret !== WEBHOOK_SECRET) {
      console.log('❌ Invalid webhook secret, ignoring alert');
      return res.status(401).send('Invalid secret');
    }
  }

  // 2. 打印 TradingView 传来的内容
  console.log('📦 Body from TradingView:', JSON.stringify(payload, null, 2));

  // 3. 在方案 A 里，我们 **只打印日志，不下单**
  //    真正的下单之后用 Python SDK 来做

  res.status(200).send('OK');
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Apex-bot listening on port ${port}`);
});
