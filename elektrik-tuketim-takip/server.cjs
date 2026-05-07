const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const BASE_URL = 'https://mdmsaatlik.toroslaredas.com.tr/toroslar';

// 1. Token Alma
app.post('/api/token', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    const url = `${BASE_URL}/mdmapi/oauth/token?grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&consumerID=MDMAYPRD`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Tesisat Listesi
app.get('/api/installations', async (req, res) => {
  try {
    const { accessToken } = req.query;
    const url = `${BASE_URL}/mdmapi/customer/installationlist?access_token=${accessToken}&startDate=01/01/2024%2000:00:00&endDate=31/01/2025%2023:59:59`;
    const response = await fetch(url, { headers: { 'consumerID': 'MDM' } });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Enerji Verisi
app.get('/api/energy', async (req, res) => {
  try {
    const { accessToken, installationNumber, dataType } = req.query;
    const startDate = '01/01/2025 00:00:00';
    const endDate = '31/01/2025 23:59:59';
    const url = `${BASE_URL}/mdm-api/customer/energyvalue?access_token=${accessToken}&installationNumber=${installationNumber}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&dataType=${dataType}&consumerID=MDMAYPRD`;
    const response = await fetch(url, { headers: { 'consumerID': 'MDM' } });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});