// index.js – 从 TradingView 接收警报，并准备转成 ApeX 下单请求
// 目前已经完整解析 TV 的 JSON，并预留 sendOrderToApex()
// 真正的 ApeX 下单逻辑你只需要根据官方示例填进 sendOrderToApex() 就可以。

const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

// 环境变量
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';     // 可选：TradingView 里写在 JSON 里的 secret
const ENABLE_LIVE_TRADING = process.env.ENABLE_LIVE_TRADING === 'true'; // 控制是否真的下单

// ApeX API 相关密钥（你已经在 DO 里配置了）
const APEX_API_KEY = process.env.APEX_API_KEY || '';
const APEX_API_SECRET = process.env.APEX_API_SECRET || '';
const APEX_API_PASSPHRASE = process.env.APEX_API_PASSPHRASE || '';
const APEX_OMNI_PRIVATE_KEY = process.env.APEX_OMNI_PRIVATE_KEY || '';

// 解析 JSON body
app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.send('Apex-bot is running (LOG + ORDER PREPARE mode)');
});

// TradingView Webhook 入口
app.post('/tv-webhook', async (req, res) => {
  console.log('🌐 Incoming request: POST /tv-webhook');

  const payload = req.body || {};
  console.log('📦 Body from TradingView:', JSON.stringify(payload, null, 2));

  // 1) 校验 webhook secret（如果你有在 TV 的 JSON 里带 "secret" 字段）
  if (WEBHOOK_SECRET) {
    if (!payload.secret || payload.secret !== WEBHOOK_SECRET) {
      console.warn('❌ Invalid webhook secret, ignoring alert');
      return res.status(401).send('Invalid secret');
    }
  }

  // 2) 把 TradingView 传来的字段解构出来
  const {
    bot_id,
    symbol,
    side,
    position_size,
    order_type,
    leverage,
    signal_type
  } = payload;

  // 3) 做一些基础校验，避免乱来的数据
  if (!bot_id || !symbol || !side || !position_size || !order_type || !signal_type) {
    console.warn('⚠️ Missing required fields from TradingView alert');
    return res.status(400).send('Missing required fields');
  }

  // 统一成一个内部 order 对象，方便后面送给 ApeX
  const order = {
    botId: String(bot_id),
    symbol: String(symbol),
    side: String(side).toLowerCase(),           // "buy" / "sell"
    size: Number(position_size),                // 你自己决定是币的数量还是USDT数量
    type: String(order_type).toLowerCase(),     // "market" / "limit"
    leverage: Number(leverage) || 1,
    signalType: String(signal_type).toLowerCase() // "entry" / "exit"
  };

  console.log('🧾 Parsed order object:', order);

  // 4) 如果你暂时不开真实交易，就只打印
  if (!ENABLE_LIVE_TRADING) {
    console.log('🚫 ENABLE_LIVE_TRADING = false, DRY RUN ONLY (不会真的下单)');
    return res.status(200).send('OK (dry run, no live order sent)');
  }

  // 5) 简单检查一下 API 配置
  if (!APEX_API_KEY || !APEX_API_SECRET) {
    console.error('❌ ApeX API env vars are missing, cannot place live order');
    return res.status(500).send('ApeX API not configured');
  }

  try {
    // 6) 这里真正调用 ApeX 下单
    await sendOrderToApex(order);
    console.log('✅ Order processing finished');

    return res.status(200).send('OK');
  } catch (err) {
    console.error('🔥 Error while sending order to ApeX:', err);
    return res.status(500).send('Failed to place order');
  }
});


// =========================
//  真正的 ApeX 下单逻辑（你需要根据官方示例来填）
// =========================

async function sendOrderToApex(order) {
  const {
    botId,
    symbol,
    side,
    size,
    type,
    leverage,
    signalType
  } = order;

  console.log('📤 [LIVE] Ready to send order to ApeX:', {
    botId,
    symbol,
    side,
    size,
    type,
    leverage,
    signalType
  });

  // 这里开始写 ApeX 的 HTTP / SDK 调用：
  // ------------------------------------------------
  // 你有两种方式可以选（任选一种）：
  //
  // 方式 1：使用 ApeX 官方 NodeJS SDK
  //   - 去你刚才打开的 OpenApi-NodeJS-SDK 仓库
  //   - 根据 README 里的例子，初始化 client：
  //       const client = new XXX({
  //         apiKey: APEX_API_KEY,
  //         apiSecret: APEX_API_SECRET,
  //         passphrase: APEX_API_PASSPHRASE,
  //         privateKey: APEX_OMNI_PRIVATE_KEY,
  //       });
  //   - 然后调用 client.placeOrder(...) 或类似的方法
  //
  // 方式 2：直接用 fetch 调用 HTTP REST 接口
  //   - 去 ApeX OpenAPI 文档里找「Create Order」接口
  //   - 按官方要求拼好签名（timestamp + body + HMAC 等）
  //   - 用 fetch('https://omni.apex.exchange/XXX', { method: 'POST', headers, body })
  //
  // 由于我现在暂时查不到 ApeX 最新签名规则，
  // 在这里不能随便帮你写一个“看起来像”的签名逻辑，
  // 否则很可能直接报错或者下错单。
  //
  // 建议你做法：
  //   1. 按官方示例，在本地随便写一个 test.js，能成功在 ApeX 下一个最小的 test 单。
  //   2. 把那段“已经能成功下单的代码”剪切/粘贴进这里（sendOrderToApex）。
  //   3. 需要的话，我可以帮你一起改成用 order 里的字段（symbol / side / size 等）。
  //
  // 测试时可以先只在日志里打印 ApeX 返回的 response：
  //   console.log('ApeX response:', result);

  // 这里先放一个占位，避免你忘记实现：
  throw new Error('sendOrderToApex() 尚未实现，请根据 ApeX 官方示例填入真实下单代码');
}

// 启动服务
app.listen(port, () => {
  console.log(`🚀 Apex-bot listening on port ${port}`);
});
