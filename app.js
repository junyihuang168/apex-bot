// app.js — Apex Webhook 服务器 (入口文件)

const express = require('express');
const logger = require('morgan');

const app = express();

// ===== 中间件 =====
app.use(logger('dev'));
app.use(express.json());

// ===== 配置密钥 =====
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'changeme';

// ===== 多机器人配置 =====
const BOTS = {
  BOT_1: {
    name: '机器人 A：BTC',
    symbol: process.env.BOT_1_SYMBOL || 'BTCUSDT',
  },
  BOT_2: {
    name: '机器人 B：SOL',
    symbol: process.env.BOT_2_SYMBOL || 'SOLUSDT',
  },
};

// ===== 主页 =====
app.get('/', (req, res) => {
  res.send('✅ Apex Webhook 多机器人服务运行中');
});

// ===== Webhook 地址 =====
app.post('/webhook', (req, res) => {
  // 校验密钥
  const incomingSecret =
    req.headers['x-webhook-secret'] ||
    req.query.secret ||
    req.body.secret;

  if (incomingSecret !== WEBHOOK_SECRET) {
    console.log('❌ 密钥错误：', req.ip);
    return res.status(401).send('Unauthorized');
  }

  // TradingView JSON
  const body = req.body || {};
  console.log('📩 收到 Webhook: ', body);

  const botId = body.bot_id || 'BOT_1';
  const side = (body.side || '').toUpperCase();
  const qty = Number(body.qty || 0);
  const price = Number(body.price || 0);

  const cfg = BOTS[botId];
  if (!cfg) return res.status(400).send('Unknown botId');

  console.log(`➡️ ${cfg.name} 执行: ${side} ${qty} ${cfg.symbol} @ ${price}`);

  return res.json({
    ok: true,
    botId,
    botName: cfg.name,
    symbol: cfg.symbol,
    side,
    qty,
    price,
  });
});

// DO 自带 bin/www 会负责监听端口
module.exports = app;
