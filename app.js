// app.js  — Apex-bot 多机器人 Webhook 服务器（入口）

const express = require('express');
const logger = require('morgan');

const app = express();

// ===== 中间件 =====
app.use(logger('dev'));     // 访问日志
app.use(express.json());    // 解析 JSON body

// ===== 配置：密钥 & 机器人列表 =====

// TradingView / 其他地方发请求时用的密钥
// 记得在 DigitalOcean 环境变量里也设置同样的值：WEBHOOK_SECRET=你的密码
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'changeme';

// 多个机器人配置（玩法 A）
const BOTS = {
  BOT_1: {
    name: '机器人 A：主做 BTC / 测试用',
    symbol: process.env.BOT_1_SYMBOL || 'BTCUSDT',
  },
  BOT_2: {
    name: '机器人 B：主做 SOL / 测试用',
    symbol: process.env.BOT_2_SYMBOL || 'SOLUSDT',
  },
  // 以后想加 BOT_3、BOT_4 就继续在这里往下加
};

// ===== 路由 =====

// 首页：检查服务是否在线
app.get('/', (req, res) => {
  res.send('✅ Apex-bot 多机器人 Webhook 服务器已运行中。');
});

// Webhook：TradingView / 其他系统来打这个地址
app.post('/webhook', (req, res) => {
  // 1. 校验密钥（从 header 或 URL ?secret= 中取）
  const incomingSecret =
    req.headers['x-webhook-secret'] ||
    req.query.secret ||
    req.body.secret;

  if (incomingSecret !== WEBHOOK_SECRET) {
    console.log('❌ 密钥错误，拒绝访问', { ip: req.ip });
    return res.status(401).send('Unauthorized');
  }

  // 2. 解析请求体
  const body = req.body || {};
  console.log('📩 收到 Webhook：', JSON.stringify(body));

  // TV 里的自定义字段
  const botId = body.bot_id || body.botId || 'BOT_1';   // 默认 BOT_1
  const side = (body.side || body.action || '').toUpperCase(); // BUY / SELL
  const qty  = Number(body.qty || body.quantity || 0);
  const price = Number(body.price || 0);
  const tvTicker = body.ticker || body.symbol;

  // 3. 找对应机器人配置
  const botCfg = BOTS[botId];
  if (!botCfg) {
    console.log('⚠️ 未知的 botId：', botId);
    return res.status(400).json({ ok: false, error: 'UNKNOWN_BOT_ID' });
  }

  const symbol = botCfg.symbol || tvTicker;

  // 4. 这里先只打印（之后我们再接 Apex 下单）
  console.log(`➡️ [${botId}] ${botCfg.name}：${side} ${qty} ${symbol} @ ${price}`);

  // TODO：这里以后接 ApeX 下单逻辑
  // await sendOrderToApex({ botId, symbol, side, qty, price });

  return res.json({
    ok: true,
    botId,
    botName: botCfg.name,
    symbol,
    side,
    qty,
    price,
  });
});

// 注意：这里 **不要** app.listen()
// DO 自带的 bin/www 会 require 这个 app 并负责监听端口
module.exports = app;
