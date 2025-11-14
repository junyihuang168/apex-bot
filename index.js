// index.js
// 你的 ApeX 机器人主程序（部署在 DigitalOcean App Platform）

const express = require('express');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;

// 尝试加载 ApeX 官方 Node SDK（apexomni-connector-node）
// 如果你的 package.json 还没装这个包，程序会退回到“只打印日志模式”，不会崩。
let ApexClient, OMNI, OrderSide;
try {
  // 注意：这行依赖你在 package.json 里装了 apexomni-connector-node
  ({ ApexClient, OMNI, OrderSide } = require('apexomni-connector-node'));
  console.log('[ApeX] SDK loaded: apexomni-connector-node');
} catch (err) {
  console.log(
    '[ApeX] apexomni-connector-node not installed, running in LOG-ONLY mode'
  );
  console.log('[ApeX] Error loading SDK:', err.message);
}

const app = express();
app.use(bodyParser.json());

// ---------- 工具函数 ----------

// 把 TradingView 的 BTCUSDT / ZECUSDT 转成 ApeX 用的 BTC-USDT / ZEC-USDT
function tvToApexSymbol(tvSymbol) {
  if (!tvSymbol) return tvSymbol;
  if (tvSymbol.includes('-')) return tvSymbol;
  return tvSymbol.replace(/USDT$/i, '-USDT');
}

// 单例初始化 ApeX 客户端（只初始化一次）
async function getApexClient() {
  if (!ApexClient) {
    // 没装 SDK，直接走模拟模式
    return null;
  }

  if (!global._apexClientPromise) {
    const key = process.env.APEX_API_KEY;
    const secret = process.env.APEX_API_SECRET;
    const passphrase = process.env.APEX_API_PASSPHRASE;
    const seed = process.env.APEX_OMNI_PRIVATE_KEY;

    if (!key || !secret || !passphrase || !seed) {
      console.error(
        '[ApeX] Missing env vars (APEX_API_KEY / SECRET / PASSPHRASE / OMNI_PRIVATE_KEY).'
      );
      console.error('[ApeX] Will NOT send real orders, log-only.');
      return null;
    }

    console.log('[ApeX] Initializing client...');

    const client = new ApexClient.omni(OMNI);
    const apiKeyCredentials = { key, secret, passphrase };

    global._apexClientPromise = client
      .init(apiKeyCredentials, seed)
      .then(() => {
        console.log('[ApeX] Client initialized successfully');
        return client;
      })
      .catch((err) => {
        console.error('[ApeX] Failed to init client:', err);
        global._apexClientPromise = null;
        return null;
      });
  }

  return global._apexClientPromise;
}

// 处理一条 TradingView 信号（目前默认“只打印 or 模拟下单”）
async function handleSignal(alert) {
  const client = await getApexClient();

  const symbol = tvToApexSymbol(alert.symbol);
  const sideStr = (alert.side || '').toLowerCase();
  const side =
    sideStr === 'buy'
      ? OrderSide && OrderSide.BUY
      : OrderSide && OrderSide.SELL;

  // position_size 是你在 TV 填的 USDT 数量，这里先原样当作 size 字符串
  const size = String(alert.position_size || '0.01');
  const signalType = alert.signal_type || 'entry';
  const orderType =
    (alert.order_type || 'market').toUpperCase() === 'LIMIT'
      ? 'LIMIT'
      : 'MARKET';

  if (!client) {
    // 还没真连上 ApeX —— 先当“干跑”
    console.log('🧪 [SIM ONLY] Would send order to ApeX:', {
      symbol,
      side: sideStr,
      size,
      orderType,
      signalType,
      bot_id: alert.bot_id,
    });
    return;
  }

  console.log('⚙️ [ApeX] handleSignal() with real client:', {
    symbol,
    side: sideStr,
    size,
    orderType,
    signalType,
    bot_id: alert.bot_id,
  });

  // -----------------------------
  // ⚠️⚠️ 下面是真正下单的模板（先注释住）⚠️⚠️
  // 等你准备好以后，再一步一步把注释去掉，并用很小的 size 测试
  // -----------------------------

  /*
  const BigNumber = require('bignumber.js');

  // 如果是 LIMIT，你需要一个价格；如果是 MARKET，可以直接用市价，
  // 这里先用 alert.price，如果没有就随便给个占位价（一定记得自己改！）
  const price = alert.price ? String(alert.price) : '100000';

  const baseCoinRealPrecision = client.symbols[symbol]?.baseCoinRealPrecision;
  const takerFeeRate = client.account.contractAccount.takerFeeRate;
  const makerFeeRate = client.account.contractAccount.makerFeeRate;

  const limitFee = new BigNumber(price)
    .multipliedBy(takerFeeRate || '0')
    .multipliedBy(size)
    .toFixed(6, BigNumber.ROUND_UP);

  const apiOrder = {
    pairId: client.symbols[symbol]?.l2PairId,
    makerFeeRate,
    takerFeeRate,
    symbol,
    side,             // OrderSide.BUY or OrderSide.SELL
    type: orderType,  // 'MARKET' or 'LIMIT'
    size,
    price,
    limitFee,
    timeInForce: 'GOOD_TIL_CANCEL',
  };

  const result = await client.privateApi.createOrder(apiOrder);
  console.log('[ApeX] Order result:', result);
  */

  // 现在先只确认函数走到了这里
  console.log(
    '✅ handleSignal() finished (current mode: NO REAL ORDER, log only)'
  );
}

// ---------- HTTP 路由 ----------

app.get('/', (_req, res) => {
  res.send('ApeX bot is running ✅');
});

// TradingView Webhook 入口
app.post('/tv-webhook', async (req, res) => {
  console.log('🚨 Webhook hit on /tv-webhook');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body from TradingView:', JSON.stringify(req.body, null, 2));

  const alert = req.body || {};

  // 简单检查一下字段，避免乱请求
  if (!alert.bot_id || !alert.symbol || !alert.side || !alert.signal_type) {
    console.log('⚠️  Invalid alert payload, ignoring.');
    return res.status(200).json({ ok: true, ignored: true });
  }

  try {
    await handleSignal(alert);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ Error in handleSignal:', err);
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 ApeX-bot listening on port ${PORT}`);
});
