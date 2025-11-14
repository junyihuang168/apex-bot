// index.js
// 简单版 Apex Webhook 服务器：TradingView → 这里 → （以后再接 Apex）
// 目前：会打印所有请求 + 模拟 Entry / Exit，下单逻辑留 TODO

const express = require('express');
const app = express();

// 让 Express 能解析 JSON body
app.use(express.json());

// 全局日志：任何请求都会先打印一行
app.use((req, res, next) => {
  console.log('🌐 Incoming request:', req.method, req.url);
  next();
});

// 根路径：方便你在浏览器里测试服务是不是活着
app.get('/', (req, res) => {
  res.send('Apex-bot is running ✅');
});

// TradingView Webhook 路由
app.post('/tv-webhook', async (req, res) => {
  console.log('🔥 Webhook hit on /tv-webhook');

  // 打印 header（可选）
  console.log('🧾 Headers:', JSON.stringify(req.headers, null, 2));

  // 打印 body（TradingView 发送的内容）
  console.log('📩 Body from TradingView:', JSON.stringify(req.body, null, 2));

  const alert = req.body; // TradingView 发来的 JSON

  // 简单检查一下 payload 是否正常
  if (!alert || !alert.bot_id || !alert.symbol || !alert.signal_type) {
    console.log('⚠️ Invalid alert payload, ignoring');
    return res.status(400).send('Invalid alert');
  }

  try {
    // ================
    // Entry 信号（开仓）
    // ================
    if (alert.signal_type === 'entry') {
      // TODO：这里以后接真实的 Apex 开仓代码
      // 例如：await placeApexOrder({...})
      console.log(
        '✅ [模拟] Entry order to Apex:',
        alert.symbol,
        alert.side,
        'size =',
        alert.position_size,
        'leverage =',
        alert.leverage
      );
    }

    // ================
    // Exit 信号（平仓）
    // ================
    if (alert.signal_type === 'exit') {
      // TODO：这里以后接真实的 Apex 平仓代码
      // 例如：await closeApexPosition({...})
      console.log('✅ [模拟] Exit order to Apex:', alert.symbol);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error handling alert:', err);
    res.status(500).send('Error');
  }
});

// 兜底 404（也打印出来，方便排查）
app.use((req, res) => {
  console.log('❓ No route matched for:', req.method, req.url);
  res.status(404).send('Not found');
});

// 启动服务器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Apex-bot listening on port ${PORT}`);
});
