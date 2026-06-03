const https = require('https');
require('dotenv').config();
const fs = require('fs');
const os = require('os');

// Read Firebase token
const configPath = os.homedir() + '/.config/configstore/firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const refreshToken = config.tokens.refresh_token;

// First, get a fresh access token using the refresh token
// Cuidado de dejar credenciales
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const tokenData = process.env.TOKEN_DATA;

const tokenReq = https.request({
  hostname: 'oauth2.googleapis.com',
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(tokenData),
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('❌ Error getting token:', body);
      return;
    }
    const accessToken = JSON.parse(body).access_token;
    setCors(accessToken);
  });
});
tokenReq.write(tokenData);
tokenReq.end();

function setCors(accessToken) {
  const bucket = 'byte-and-bite-a668c.firebasestorage.app';
  const corsConfig = [
    {
      origin: ["http://localhost:8100", "http://localhost"],
      method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
      maxAgeSeconds: 3600,
      responseHeader: ["Content-Type", "Authorization", "Content-Length", "X-Requested-With"]
    }
  ];

  const data = JSON.stringify({ cors: corsConfig });

  const req = https.request({
    hostname: 'storage.googleapis.com',
    path: `/storage/v1/b/${bucket}?fields=cors`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ CORS configurado exitosamente en el bucket!');
        console.log(JSON.stringify(JSON.parse(body), null, 2));
      } else {
        console.error(`❌ Error (${res.statusCode}):`, body);
      }
    });
  });

  req.on('error', (e) => console.error('Error:', e.message));
  req.write(data);
  req.end();
}
