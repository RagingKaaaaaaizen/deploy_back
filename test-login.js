const axios = require('axios');

async function testLogin() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Testing Login Functionality');
    console.log('═══════════════════════════════════════════════════\n');
    
    try {
        const credentials = {
            email: 'admin@example.com',
            password: 'Admin123!'
        };
        
        console.log('📝 Testing login with:', credentials.email);
        console.log('🌐 Backend URL: http://localhost:4000/api/accounts/authenticate\n');
        
        const response = await axios.post(
            'http://localhost:4000/api/accounts/authenticate',
            credentials,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.status === 200 && response.data.jwtToken) {
            console.log('✅ LOGIN SUCCESSFUL!\n');
            console.log('User Details:');
            console.log('  Name:', response.data.firstName, response.data.lastName);
            console.log('  Email:', response.data.email);
            console.log('  Role:', response.data.role);
            console.log('  Last Login:', response.data.lastLogin || 'Not set yet');
            console.log('  JWT Token:', response.data.jwtToken.substring(0, 50) + '...\n');
            console.log('🎉 TEST PASSED: Login works with lastLogin column!\n');
            return true;
        }
        
    } catch (error) {
        console.error('❌ LOGIN FAILED!\n');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data.message || error.response.data);
        } else if (error.request) {
            console.error('No response from server.');
            console.error('Make sure the backend is running: npm run start:dev');
        } else {
            console.error('Error:', error.message);
        }
        
        console.log();
        return false;
    }
}

// Wait a bit for server, then test
setTimeout(() => {
    testLogin()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch(() => process.exit(1));
}, 2000);
