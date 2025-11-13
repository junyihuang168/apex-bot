// index.js  — 多机器人 Webhook 中枢 v1（仅打印，不下单）

const express = require('express');
const app = express();

// DO 会传 PORT 环境变量进来，没传就用 3000（本地测试）
const port = process.env.PORT || 3000;

// 全局 Webhook 密码（防止别人乱打你的接口）
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'changeme';

// 多机器人配置表（玩法 A 的核心）
// 以后你要加新机器人，就在这里加 BOT_3、BOT_4……
const bots = {
  BOT_1: {
    name: '机器人1：主做 BTC / 测试用',
    defaultSymbol: 'BTCUSDT',
  },
  BOT_2: {
    name: '机器人2：主做 SOL / 测试用',
    defaultSymbol: 'SOLUSDT',
  },
};

// 解析 JSON body
app.use(express.json());

// 用浏览器打开根路径，看服务活没活
app.get('/', (req, res) => {
  res.send('Apex-bot multi-bot webhook server is running.');
});

// TradingView / 其他地方发信号的入口
app.post('/webhook', async (req, res) => {
  // 1. 校验 Webhook 密码（从 header 或 query ?secret= 里拿）
  const incomingSecret =
    req.headers['x-webhook-secret'] || req.query.secret;

  if (incomingSecret !== WEBHOOK_SECRET) {
    console.log('❌ [Webhook] Invalid secret from', req.ip);
    return res.status(401).send('Unauthorized');
  }

  // 2. 从 TV 的 JSON 里取出字段
  const { botId, symbol, side, size, extra } = req.body || {};
  const bot = bots[botId];

  if (!bot) {
    console.log('❌ [Webhook] Unknown botId:', botId, 'payload:', req.body);
    return res.status(400).send('Unknown botId');
  }

  // 如果 TV 有传 symbol 就用 TV 的，否则就用机器人的默认币种
  const finalSymbol = symbol || bot.defaultSymbol;

  // 3. 这里只是打印日志（v1 不下单）
  console.log('✅ 收到信号:');
  console.log('   🤖 Bot:', botId, '-', bot.name);
  console.log('   🪙 Symbol:', finalSymbol);
  console.log('   📈 Side:', side);
  console.log('   📦 Size:', size);
  if (extra) {
    console.log('   📝 Extra:', JSON.stringify(extra));
  }

  // TODO: 这里以后我们会接 ApeX 下单逻辑
  // await placeOrderOnApex({ bot, symbol: finalSymbol, side, size, extra });

  res.send('ok');
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Apex-bot listening on port ${port}`);
});
