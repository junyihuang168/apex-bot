// index.js  —— 先跑一个稳定、安全的版本（目前还是“模拟下单”，只打印日志）

const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// 解析 TradingView 发来的 JSON / 表单
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主页检查用
app.get('/', (req, res) => {
  res.send('Apex-bot is running ✅');
});

// TradingView Webhook 入口
app.post('/tv-webhook', (req, res) => {
  console.log('🌐 Incoming request: POST /tv-webhook');

  // TradingView 发送过来的 body
  const alert = req.body || {};
  console.log('📦 Body from TradingView:', JSON.stringify(alert, null, 2));

  // 简单校验一下必填字段
  if (!alert.bot_id || !alert.symbol || !alert.side || !alert.signal_type) {
    console.log('⚠️ Invalid alert payload, ignoring');
    return res.status(400).send('Invalid alert');
  }

  const botId       = alert.bot_id;
  const symbol      = alert.symbol;
  const side        = alert.side;               // "buy" / "sell"
  const size        = Number(alert.position_size) || 0;
  const orderType   = alert.order_type || 'market';
  const leverage    = Number(alert.leverage) || 1;
  const signalType  = alert.signal_type;        // "entry" / "exit"

  console.log(`🧾 Parsed alert:
    bot_id     = ${botId}
    symbol     = ${symbol}
    side       = ${side}
    size       = ${size}
    orderType  = ${orderType}
    leverage   = ${leverage}
    signalType = ${signalType}
  `);

  // 目前先不真正发单，只在日志里做“模拟下单”
  if (signalType === 'entry') {
    console.log(`✅ [模拟] Entry order to Apex: ${symbol} ${side} size = ${size} leverage = ${leverage}`);
  } else if (signalType === 'exit') {
    console.log(`✅ [模拟] Exit order to Apex: ${symbol} side = ${side} size = ${size} leverage = ${leverage}`);
  } else {
    console.log('⚠️ Unknown signal_type, ignoring');
  }

  // 必须返回 200，TradingView 才会认为成功
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`🚀 Apex-bot listening on port ${PORT}`);
});
