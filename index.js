app.post('/tv-webhook', async (req, res) => {
  console.log('🔥 Webhook hit on /tv-webhook');

  console.log('🧾 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📩 Body from TradingView:', JSON.stringify(req.body, null, 2));

  const alert = req.body;  // TradingView 发来的 JSON

  // 简单检查一下 payload 是否正常
  if (!alert || !alert.bot_id || !alert.symbol || !alert.signal_type) {
    console.log('⚠️ Invalid alert payload, ignoring');
    return res.status(400).send('Invalid alert');
  }

  try {
    if (alert.signal_type === 'entry') {
      // TODO：这里放“开仓”代码
      console.log('✅ [模拟] Entry order to Apex:', alert.symbol, alert.side, alert.position_size);
    }

    if (alert.signal_type === 'exit') {
      // TODO：这里放“平仓”代码
      console.log('✅ [模拟] Exit order to Apex:', alert.symbol);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error handling alert:', err);
    res.status(500).send('Error');
  }
});
