// Keep-alive service to prevent Render free tier from sleeping
// This script can be run locally or on a free service like UptimeRobot

const https = require('https');

const BACKEND_URL = 'https://computer-lab-inventory-backend.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (free tier sleeps after 15 minutes)

console.log('🔄 Starting Keep-Alive Service for Render Backend');
console.log(`📍 Backend URL: ${BACKEND_URL}`);
console.log(`⏰ Ping Interval: ${PING_INTERVAL / 1000 / 60} minutes`);

function pingServer() {
    const startTime = Date.now();
    
    https.get(`${BACKEND_URL}/health`, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`✅ ${new Date().toISOString()} - Server responded in ${responseTime}ms`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
        });
    }).on('error', (err) => {
        console.log(`❌ ${new Date().toISOString()} - Ping failed: ${err.message}`);
    });
}

// Ping immediately
pingServer();

// Then ping every 14 minutes
setInterval(pingServer, PING_INTERVAL);

console.log('🚀 Keep-alive service started. Press Ctrl+C to stop.');





