// index.js - Webhook 测试版（先确认 TV → DO 是否打通）

const express = require('express');
const app = express();

// 让 Express 能读 JSON
app.use(express.json());

// 全局中间件：任何请求都会打印一行
app.use((req, res, next) => {
  console.log('🌐 Incoming request:', req.method, req.url);
  next();
});

// 根路径：方便你在浏览器里打开看看服务活着没
app.get('/', (req, res) => {
  res.send('Apex-bot is running ✅');
});

// TradingView Webhook 路由
app.post('/tv-webhook', (req, res) => {
  console.log('🔥 Webhook hit on /tv-webhook');

  // 打印 header（可选）
  console.log('🧾 Headers:', JSON.stringify(req.headers, null, 2));

  // 打印 body（TradingView 发送的内容）
  console.log('📩 Body from TradingView:', JSON.stringify(req.body, null, 2));

  // 回应 TradingView
  res.status(200).send('OK');
});

// 兜底 404（也打印）
app.use((req, res) => {
  console.log('❓ No route matched for:', req.method, req.url);
  res.status(404).send('Not found');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Apex-bot listening on port ${PORT}`);
});
