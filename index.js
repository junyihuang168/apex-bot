// index.js
// TradingView → DigitalOcean → （将来接 ApeX）
// 目前：
//   1. 接收 TV Webhook
//   2. 读取 ApeX API 环境变量（不打印具体值）
//   3. 按 entry / exit 打日志（模拟下单）
//   4. 整个文件可以直接部署使用

const express = require('express');
const app = express();

// ==========================
// 读取环境变量（只读名字，不泄露值）
// ==========================
const APEX_API_KEY = process.env.APEX_API_KEY;
const APEX_API_SECRET = process.env.APEX_API_SECRET;
const APEX_API_PASSPHRASE = process.env.APEX_API_PASSPHRASE;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// 启动时检查一下必要环境变量是否存在
function checkEnv() {
  const missing = [];
  if (!APEX_API_KEY) missing.push('APEX_API_KEY');
  if (!APEX_API_SECRET) missing.push('APEX_API_SECRET');
  if (!APEX_API_PASSPHRASE) missing.push('APEX_API_PASSPHRASE');
  if (!WEBHOOK_SECRET) missing.push('WEBHOOK_SECRET');

  if (missing.length > 0) {
    console.warn('⚠️ Missing env vars:', missing.join(', '));
    console.warn('⚠️ 请到 DigitalOcean → App → Settings → Environment Variables 补齐这些变量。');
  } else {
    console.log('✅ ApeX & Webhook 环境变量已加载（不会在日志中显示具体值）');
  }
}
checkEnv();

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

// ==========================
// TradingView Webhook 主入口
// ==========================
app.post('/tv-webhook', async (req, res) => {
  console.log('🔥 Webhook hit on /tv-webhook');

  // 打印 header（可选，方便调试）
  console.log('🧾 Headers:', JSON.stringify(req.headers, null, 2));

  // 打印 body（TradingView 发送的内容）
  console.log('📩 Body from TradingView:', JSON.stringify(req.body, null, 2));

  const alert = req.body; // TradingView 发来的 JSON

  // ======（可选）校验 Webhook Secret，防止别人乱打=====
  // 你可以在 TV 的消息里加一个字段，比如：
  // { "secret": "xxxx", "bot_id": "...", ... }
  // 然后在这里比对：
  //
  // if (WEBHOOK_SECRET && alert.secret !== WEBHOOK_SECRET) {
  //   console.log('⛔ Webhook secret 不匹配，拒绝处理');
  //   return res.status(403).send('Forbidden');
  // }

  // 简单检查一下 payload 是否正常
  if (!alert || !alert.bot_id || !alert.symbol || !alert.signal_type) {
    console.log('⚠️ Invalid alert payload, ignoring');
    return res.status(400).send('Invalid alert');
  }

  try {
    // ======================
    // Entry 信号（开仓逻辑）
    // ======================
    if (alert.signal_type === 'entry') {
      // TODO: 将来在这里接 ApeX 真实下单逻辑
      // 例如调用 placeApexOrder({ ...alert, ... })
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

    // ======================
    // Exit 信号（平仓逻辑）
    // ======================
    if (alert.signal_type === 'exit') {
      // TODO: 将来在这里接 ApeX 平仓逻辑
      // 例如调用 closeApexPosition({ symbol: alert.symbol, botId: alert.bot_id })
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
