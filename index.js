// index.js — LOG ONLY 版本：只收 TradingView 警报，不下单

const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// 可选：webhook 密钥（你在 DO 的环境变量 WEBHOOK_SECRET）
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.send('Apex-bot is running (LOG ONLY mode)');
});

// TradingView Webhook 接口
app.post('/tv-webhook', (req, res) => {
  console.log('🌐 Incoming request: POST /tv-webhook');

  const payload = req.body || {};

  // 如果你在 TV 的 JSON 里有写 { "secret": "xxx" } 就验证一下
  if (WEBHOOK_SECRET) {
    if (!payload.secret || payload.secret !== WEBHOOK_SECRET) {
      console.log('❌ Invalid webhook secret, ignoring alert');
      return res.status(401).send('Invalid secret');
    }
  }

  // 打印 TradingView 发来的全部内容
  console.log('📦 Body from TradingView:', JSON.stringify(payload, null, 2));

  // 这里暂时不下单，只是记录
  res.status(200).send('OK');
});

// 启动服务
app.listen(port, () => {
  console.log(`🚀 Apex-bot listening on port ${port}`);
});
