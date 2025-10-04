// Test script to verify backend deployment
const https = require('https');

console.log('🧪 Testing Production Backend...\n');

const backendUrl = 'https://computer-lab-inventory-backend-klzb.onrender.com';

// Test 1: Health Check
console.log('1. Testing Health Check...');
https.get(`${backendUrl}/health`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('✅ Health Check Response:', data);
        console.log('Status:', res.statusCode);
        
        // Test 2: Test Endpoint
        console.log('\n2. Testing API Test Endpoint...');
        https.get(`${backendUrl}/api/test`, (res2) => {
            let data2 = '';
            res2.on('data', (chunk) => data2 += chunk);
            res2.on('end', () => {
                console.log('✅ API Test Response:', data2);
                console.log('Status:', res2.statusCode);
                
                // Test 3: Accounts Test
                console.log('\n3. Testing Accounts Test Endpoint...');
                https.get(`${backendUrl}/api/accounts-test`, (res3) => {
                    let data3 = '';
                    res3.on('data', (chunk) => data3 += chunk);
                    res3.on('end', () => {
                        console.log('✅ Accounts Test Response:', data3);
                        console.log('Status:', res3.statusCode);
                        console.log('\n🎉 All tests completed!');
                    });
                }).on('error', (err) => {
                    console.log('❌ Accounts Test Error:', err.message);
                });
            });
        }).on('error', (err) => {
            console.log('❌ API Test Error:', err.message);
        });
    });
}).on('error', (err) => {
    console.log('❌ Health Check Error:', err.message);
});



