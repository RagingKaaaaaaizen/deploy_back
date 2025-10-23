const axios = require('axios');

const BASE_URL = 'https://computer-lab-inventory-backend.onrender.com';
// const BASE_URL = 'http://localhost:3000'; // For local testing

async function testStaffWorkflow() {
    console.log('🧪 Testing Staff Stock Creation Workflow');
    console.log('==========================================');
    
    try {
        // Step 1: Login as Staff user
        console.log('\n1️⃣ Logging in as Staff user...');
        const loginResponse = await axios.post(`${BASE_URL}/api/accounts/authenticate`, {
            email: 'staff@example.com', // Replace with actual staff email
            password: 'password123'     // Replace with actual staff password
        });
        
        const { token } = loginResponse.data;
        console.log('✅ Staff login successful');
        
        // Step 2: Create stock entry as Staff
        console.log('\n2️⃣ Creating stock entry as Staff...');
        const stockData = {
            itemId: 1,
            quantity: 5,
            price: 100.00,
            locationId: 1,
            remarks: 'Test stock entry from Staff user'
        };
        
        const stockResponse = await axios.post(`${BASE_URL}/api/stocks`, stockData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📋 Stock creation response:', stockResponse.data);
        
        // Check if approval request was created
        if (stockResponse.data.status === 'pending_approval') {
            console.log('✅ Staff stock entry correctly created approval request');
            console.log('📝 Approval Request ID:', stockResponse.data.approvalRequestId);
        } else {
            console.log('❌ Staff stock entry did not create approval request');
            console.log('Response:', stockResponse.data);
        }
        
        // Step 3: Login as Admin to check approval requests
        console.log('\n3️⃣ Logging in as Admin to check approval requests...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/api/accounts/authenticate`, {
            email: 'admin@example.com', // Replace with actual admin email
            password: 'password123'     // Replace with actual admin password
        });
        
        const { token: adminToken } = adminLoginResponse.data;
        console.log('✅ Admin login successful');
        
        // Step 4: Get all approval requests
        console.log('\n4️⃣ Fetching approval requests...');
        const approvalResponse = await axios.get(`${BASE_URL}/api/approval-requests`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📋 Approval requests found:', approvalResponse.data.length);
        if (approvalResponse.data.length > 0) {
            const latestRequest = approvalResponse.data[0];
            console.log('📝 Latest approval request:');
            console.log('   - ID:', latestRequest.id);
            console.log('   - Type:', latestRequest.type);
            console.log('   - Status:', latestRequest.status);
            console.log('   - Created by:', latestRequest.creator?.firstName, latestRequest.creator?.lastName);
            console.log('   - Request data:', JSON.stringify(latestRequest.requestData, null, 2));
        }
        
        console.log('\n✅ Staff workflow test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('💡 Make sure to update the email/password in the test script');
        }
    }
}

// Run the test
testStaffWorkflow();
