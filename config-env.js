/**
 * Environment Configuration
 * Loads API keys and credentials for the PC Parts Comparison System
 */

// Set environment variables for DigiKey and Gemini APIs
process.env.GEMINI_API_KEY = 'AIzaSyB54vqGM8AdBLR5r7P9lDc_84abr072HpU';
process.env.DIGIKEY_CLIENT_ID = 'QccsmyqM1PXUmNZDHiGdAfaUVGr0Piu7faXfUCQkpX0YM6KC';
process.env.DIGIKEY_CLIENT_SECRET = 'zRj3udVf5jisLp2J8o5MsU29rNduhOVvT1PrMtxjQNdeKODG1KbOGjGyQS3EfMCg';

console.log('🔧 Environment variables loaded:');
console.log(`   ✅ GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not set'}`);
console.log(`   ✅ DIGIKEY_CLIENT_ID: ${process.env.DIGIKEY_CLIENT_ID ? 'Set' : 'Not set'}`);
console.log(`   ✅ DIGIKEY_CLIENT_SECRET: ${process.env.DIGIKEY_CLIENT_SECRET ? 'Set' : 'Not set'}`);
console.log('');

module.exports = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    DIGIKEY_CLIENT_ID: process.env.DIGIKEY_CLIENT_ID,
    DIGIKEY_CLIENT_SECRET: process.env.DIGIKEY_CLIENT_SECRET
};
