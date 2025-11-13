// routes/index.js

const express = require('express');
const router = express.Router();

// -----------------------------
// 1. 配置区：密钥 & 机器人列表
// -----------------------------

// TradingView / 其他地方发请求时用的密钥
// 记得在 DigitalOcean 的环境变量里设置同样的值：WEBHOOK_SECRET=改成你自己的
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'changeme';

// 这里先给你 2 个机器人示例，以后要加可以继续往下加 BOT_3、BOT_4...
const BOTS = {
  BOT_1: {
    name: '机器人 A：主币 BTC / 测试用',
    // 可以用环境变量覆盖，不改代码也能换币
    symbol: process.env.BOT_1_SYMBOL || 'BTCUSDT'
  },
  BOT_2: {
    name: '机器人 B：山寨 SOL / 测试用',
    symbol: process.env.BOT_2_SYMBOL || 'SOLUSDT'
  }
};

// -----------------------------
// 2. 首页：纯测试用
// -----------------------------
router.get('/', (req, res) => {
  res.send('✅ Apex-bot 多机器人 Webhook 服务器已运行中。');
});

// -----------------------------
// 3. Webhook 路由：接收 TradingView
// -----------------------------
router.post('/webhook', (req, res) => {
  // 3.1 校验密钥（从 header 或 ?secret= 中取）
  const incomingSecret =
    req.headers['x-webhook-secret'] ||
    req.query.secret ||
    req.body.secret;

  if (incomingSecret !== WEBHOOK_SECRET) {
    console.log('❌ 密钥错误，拒绝访问', { ip: req.ip });
    return res.status(401).send('Unauthorized');
  }

  // 3.2 解析 JSON
  const body = req.body || {};
  console.log('📩 收到 TradingView Webhook：', JSON.stringify(body));

  // 你可以在 TV 的 JSON 里自己填这些字段
  const botId = body.bot_id || body.botId || 'BOT_1';   // 默认用 BOT_1
  const side = (body.side || body.action || '').toUpperCase(); // BUY / SELL
  const qty = Number(body.qty || body.quantity || 0);
  const price = Number(body.price || 0);
  const tvTicker = body.ticker || body.symbol;

  // 3.3 找到对应机器人配置
  const botCfg = BOTS[botId];
  if (!botCfg) {
    console.log('⚠️ 未知的 botId：', botId);
    return res.status(400).json({ ok: false, error: 'UNKNOWN_BOT_ID' });
  }

  const symbol = botCfg.symbol || tvTicker;

  // 3.4 这里就是将来接 Apex 的地方（现在只是打印出来）
  console.log(
    `➡️ [${botId}] ${botCfg.name}：${side} ${qty} ${symbol} @ ${price}`
  );

  // TODO：在这里调用 Apex 的下单接口（我们之后再接）
  // await sendOrderToApex({ botId, symbol, side, qty, price });

  // 先给一个成功回应，告诉 TradingView 已经收到
  return res.json({
    ok: true,
    botId,
    botName: botCfg.name,
    symbol,
    side,
    qty,
    price
  });
});

module.exports = router;
