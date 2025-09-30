#!/usr/bin/env node

/**
 * API Verification Script
 * Verifies that all API credentials are loaded correctly
 */

// Load environment configuration
require('./config-env');

const DigikeyAPIService = require('./comparison/api-integration/digikey-api.service');
const aiManager = require('./comparison/ai/ai-manager.service');

async function verifyAPIs() {
    console.log('🔍 Verifying API Configuration...\n');
    
    // Check environment variables
    console.log('1️⃣ Environment Variables:');
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   DIGIKEY_CLIENT_ID: ${process.env.DIGIKEY_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
    console.log(`   DIGIKEY_CLIENT_SECRET: ${process.env.DIGIKEY_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);
    console.log('');
    
    // Test DigiKey service
    console.log('2️⃣ DigiKey API Service:');
    try {
        const digikeyService = new DigikeyAPIService();
        console.log(`   Service initialized: ✅`);
        console.log(`   Client ID: ${digikeyService.clientId.substring(0, 8)}...`);
        console.log(`   Base URL: ${digikeyService.baseURL}`);
        
        // Test health check
        const health = await digikeyService.checkHealth();
        console.log(`   Health check: ${health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}`);
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
    
    // Test AI Manager
    console.log('3️⃣ AI Manager:');
    try {
        const status = aiManager.getStatus();
        console.log(`   Initialized: ${status.isInitialized ? '✅' : '❌'}`);
        console.log(`   Total providers: ${status.totalProviders}`);
        console.log(`   Available providers: ${status.availableProviders}`);
        console.log(`   Provider names: ${status.providerNames.join(', ')}`);
        console.log(`   Has any provider: ${status.hasAnyProvider ? '✅' : '❌'}`);
        
        // Check Gemini specifically
        const geminiStats = status.providerStats.gemini;
        if (geminiStats) {
            console.log(`   Gemini available: ${geminiStats.isAvailable ? '✅' : '❌'}`);
            console.log(`   Gemini healthy: ${geminiStats.isHealthy ? '✅' : '❌'}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
    
    console.log('🎯 Summary:');
    console.log(`   Environment variables: ${process.env.GEMINI_API_KEY && process.env.DIGIKEY_CLIENT_ID ? '✅ All set' : '❌ Missing'}`);
    console.log(`   DigiKey API: ${process.env.DIGIKEY_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    
    if (process.env.GEMINI_API_KEY && process.env.DIGIKEY_CLIENT_ID) {
        console.log('\n🎉 All APIs are properly configured and ready to use!');
    } else {
        console.log('\n⚠️ Some APIs are not properly configured. Check the errors above.');
    }
}

verifyAPIs();
