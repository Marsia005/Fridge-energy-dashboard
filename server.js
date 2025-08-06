// Load environment variables
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const app = express();
app.use(express.json());

// Serve static files (frontend) from "nafisha" folder
app.use(express.static(path.join(__dirname, 'nafisha')));

// ======= TUYA CONFIGURATION =======
const context = new TuyaContext({
  baseUrl: 'https://openapi.tuyaeu.com',
  accessKey: process.env.TUYA_ACCESS_KEY,
  secretKey: process.env.TUYA_SECRET_KEY
});

const DEVICE_ID = process.env.DEVICE_ID;
const HISTORY_FILE = 'history.json';

// Add timeout for Tuya requests
context.request = ((originalRequest) => async (options) => {
  return Promise.race([
    originalRequest(options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 8000))
  ]);
})(context.request.bind(context));

// ======= Load History from File =======
let history = [];
if (fs.existsSync(HISTORY_FILE)) {
  history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

// ======= Function: Fetch Live Status =======
async function fetchStatus() {
  const res = await context.request({
    path: `/v1.0/devices/${DEVICE_ID}/status`,
    method: 'GET'
  });

  console.log('Live status response:', JSON.stringify(res, null, 2));
  return res;
}

// ======= API: Get Live Status =======
app.get('/api/status', async (req, res) => {
  try {
    const data = await fetchStatus();
    res.json(data);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// ======= API: Control Device ON =======
app.post('/api/control/on', async (req, res) => {
  try {
    await context.request({
      path: `/v1.0/devices/${DEVICE_ID}/commands`,
      method: 'POST',
      body: { commands: [{ code: 'switch_1', value: true }] }
    });
    res.send('Device turned ON');
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// ======= API: Control Device OFF =======
app.post('/api/control/off', async (req, res) => {
  try {
    await context.request({
      path: `/v1.0/devices/${DEVICE_ID}/commands`,
      method: 'POST',
      body: { commands: [{ code: 'switch_1', value: false }] }
    });
    res.send('Device turned OFF');
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// ======= API: Get History Data =======
app.get('/api/history', (req, res) => {
  res.json(history);
});

// ======= Background Job: Collect Data Every 60 Seconds =======
setInterval(async () => {
  try {
    const data = await fetchStatus();
    const now = new Date().toISOString();

    const resultArray = Array.isArray(data.result) ? data.result : [];

    const wattageObj = resultArray.find(x =>
      x.code.includes('power') || x.code.includes('active_power') || x.code.includes('cur_power')
    );
    const wattage = wattageObj ? wattageObj.value : null;

    const entry = { time: now, wattage };
    history.push(entry);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log('✅ Saved data:', entry);

    if (!wattageObj) {
      console.log("⚠️ No power code found. Check /api/status for available keys.");
    }

  } catch (err) {
    console.error('❌ Error fetching/saving data:', err.message);
  }
}, 60000);

// ======= Start Server =======
app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
