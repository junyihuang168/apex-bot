// =========================================================
//  APEX REAL ORDER BOT  (Live Trading Version)
//  TradingView → DigitalOcean → Apex Pro (Omni)
// =========================================================

import express from 'express'
import crypto from 'crypto'
import axios from 'axios'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json())

// ======================
// Load Env Variables
// ======================
const APEX_KEY        = process.env.APEX_API_KEY
const APEX_SECRET     = process.env.APEX_API_SECRET
const APEX_PASSPHRASE = process.env.APEX_API_PASSPHRASE
const OMNI_KEY        = process.env.APEX_OMNI_PRIVATE_KEY
const WEBHOOK_SECRET  = process.env.WEBHOOK_SECRET

// ======================
// APEX API Base URL
// ======================
const BASE = "https://api.apex.exchange"   // LIVE endpoint


// ========================================================
// Helper: Sign Apex Request
// ========================================================
function signRequest(method, path, body = "") {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const prehash = timestamp + method + path + body

    const signature = crypto
        .createHmac("sha256", APEX_SECRET)
        .update(prehash)
        .digest("hex")

    return { timestamp, signature }
}


// ========================================================
// Create Order (LIVE)
// ========================================================
async function sendOrder(symbol, side, size, leverage, type = "market") {

    const path = "/v1/orders"
    const bodyObj = {
        symbol: symbol,
        side: side,              // "buy" / "sell"
        orderType: type,         // "market"
        size: size.toString(),   // in USDT
        leverage: leverage,      // number
        signature: OMNI_KEY      // wallet signature
    }

    const bodyStr = JSON.stringify(bodyObj)
    const { timestamp, signature } = signRequest("POST", path, bodyStr)

    try {
        const res = await axios.post(
            BASE + path,
            bodyObj,
            {
                headers: {
                    "APEX-KEY": APEX_KEY,
                    "APEX-TIMESTAMP": timestamp,
                    "APEX-SIGN": signature,
                    "APEX-PASSPHRASE": APEX_PASSPHRASE,
                    "Content-Type": "application/json"
                }
            }
        )

        console.log("✅ LIVE Order Sent:", res.data)
        return res.data

    } catch (err) {
        console.log("❌ LIVE Order Error:", err?.response?.data || err)
        return null
    }
}


// ========================================================
// TradingView Webhook
// ========================================================
app.post('/tv-webhook', async (req, res) => {

    console.log("🔥 Webhook Received:", req.body)

    if (!req.body || !req.body.bot_id || !req.body.signal_type) {
        return res.status(400).send("Bad payload")
    }

    const alert = req.body
    const symbol      = alert.symbol
    const side        = alert.side
    const size        = alert.position_size
    const leverage    = alert.leverage || 1
    const signal_type = alert.signal_type

    try {
        if (signal_type === "entry") {

            console.log(`🚀 LIVE ENTRY → ${symbol} ${side} size=${size}`)
            await sendOrder(symbol, side, size, leverage, "market")
        }

        if (signal_type === "exit") {

            console.log(`📤 LIVE EXIT → ${symbol}`)
            await sendOrder(symbol, side, size, leverage, "market")
        }

        res.status(200).send("OK")

    } catch (err) {
        console.log("❌ Error handling webhook:", err)
        res.status(500).send("Error")
    }
})


// ========================================================
// Start Server
// ========================================================
app.listen(8080, () => {
    console.log("🚀 Apex LIVE Bot Running on port 8080")
})
