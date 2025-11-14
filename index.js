// index.js
const express = require('express');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

const APEX_API_KEY = process.env.APEX_API_KEY || '';
const APEX_API_SECRET = process.env.APEX_API_SECRET || '';
const APEX_API_PASSPHRASE = process.env.APEX_API_PASSPHRASE || '';
const APEX_OMNI_PRIVATE_KEY = process.env.APEX_OMNI_PRIVATE_KEY || '';

const app = express();

// TradingView 会发 JSON
app.use(bodyParser.json());

let apexClient = null;
let apexReady = false;

// -------------------------------------------------------
// 1) 尝试加载 ApeX 官方 Node SDK
// -------------------------------------------------------
try {
  console.log('[Apex] Trying to load apexomni-connector-node...');
  const { ApexClient, OMNI_HTTP_MAIN } = require('apexomni-connector-node');

  // 这里用主网，如果你想先用 testnet，可以换成 OMNI_HTTP_TEST
  apexClient = new ApexClient({
    baseUrl: OMNI_HTTP_MAIN,
    apiKey: {
      key: APEX_API_KEY,
      secret: APEX_API_SECRET,
      passphrase: APEX_API_PASSPHRASE
    },
    omniPrivateKey: APEX_OMNI_PRIVATE_KEY
  });

  // 异步初始化
  (async () => {
    try {
      console.log('[Apex] Initializing Apex Omni client...');
      await apexClient.init(); // 具体是否需要参数，要以官方示例为准
      apexReady = true;
      console.log('[Apex] Apex Omni client READY (live mode).');
    } catch (err) {
      console.error('[Apex] Failed to init Apex client, fallback to LOG_ONLY:', err);
      apexClient = null;
      apexReady = false;
    }
  })();
} catch (err) {
  console.log('[Apex] apexomni-connector-node not installed, running in LOG_ONLY mode');
  apexClient = null;
  apexReady = false;
}

// -------------------------------------------------------
// 2) TradingView Webhook 接口
// -------------------------------------------------------
app.post('/tv-webhook', async (req, res) => {
  console.log('🚀 Webhook hit on /tv-webhook');

  // 取 header 里的 secret（你在 TradingView 里 Message 顶部可以自定义一个字段）
  const incomingSecret = req.headers['x-webhook-secret'] || req.query.secret || '';

  if (WEBHOOK_SECRET && incomingSecret !== WEBHOOK_SECRET) {
    console.warn('❌ Invalid WEBHOOK_SECRET, ignoring request');
    return res.status(401).send('Unauthorized');
  }

  const alert = req.body || {};
  console.log('📦 Body from TradingView:', JSON.stringify(alert, null, 2));

  // 简单校验
  if (!alert.bot_id || !alert.symbol || !alert.signal_type) {
    console.warn('⚠️ Invalid alert payload, missing fields');
    return res.status(400).send('Invalid alert payload');
  }

  const botId = alert.bot_id;
  const symbol = alert.symbol;         // 例如 "ZECUSDT"
  const side = (alert.side || '').toUpperCase();     // "BUY" / "SELL"
  const orderType = (alert.order_type || 'market').toUpperCase(); // "MARKET" / ...
  const sizeStr = String(alert.position_size || '0');
  const signalType = alert.signal_type;  // "entry" / "exit"
  const leverage = alert.leverage || 1;

  try {
    if (!apexClient || !apexReady) {
      console.log('🧪 [LOG_ONLY]', signalType, 'order for', symbol, {
        botId,
        side,
        orderType,
        sizeStr,
        leverage
      });
    } else {
      // ---------------------------------------------------
      // ⚠️ 下面这段是“真实下单”的示意代码，基于 Python 的 create_order_v3。
      // 你后面可以根据官方 Node 示例调整字段名字。
      // ---------------------------------------------------
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (signalType === 'entry') {
        console.log('🟢 [LIVE] Sending ENTRY order to ApeX...');

        const resOrder = await apexClient.privateApi.create_order_v3({
          symbol: symbol.replace('USDT', '-USDT'),  // TV: ZECUSDT  -> API: ZEC-USDT（如果 API 要这种格式）
          side: side,          // "BUY" / "SELL"
          type: orderType,     // "MARKET"
          size: sizeStr,       // 必须是字符串
          timestampSeconds: nowSeconds.toString(),
          // 市价单可以随便给一个 price，真正成交价以市场为准
          price: '0'
        });

        console.log('✅ [LIVE] Entry order result:', resOrder);
      } else if (signalType === 'exit') {
        console.log('🔴 [LIVE] Sending EXIT order to ApeX...');

        // 这里 exit 我同样用 create_order_v3 + 反方向下单
        // 真实情况你可以根据仓位方向决定 size / side
        const resOrder = await apexClient.privateApi.create_order_v3({
          symbol: symbol.replace('USDT', '-USDT'),
          side: side,
          type: orderType,
          size: sizeStr,
          timestampSeconds: nowSeconds.toString(),
          price: '0',
          reduceOnly: true // 如果 SDK 支持这个字段，可以避免开反向新仓
        });

        console.log('✅ [LIVE] Exit order result:', resOrder);
      } else {
        console.log('ℹ️ Unknown signal_type:', signalType, '— only logging');
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error handling alert:', err);
    res.status(500).send('Error');
  }
});

// -------------------------------------------------------
// 3) 启动服务器
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Apex-bot listening on port ${PORT}`);
});
