const analyticsService = require('./analytics/analytics.service');

async function testGenerateReport() {
    try {
        console.log('Testing generateReport function...');
        
        const testRequest = {
            startDate: '2025-10-01',
            endDate: '2025-10-31',
            includeStocks: true,
            includeDisposals: true,
            includePCs: true
        };
        
        console.log('Request:', testRequest);
        
        const result = await analyticsService.generateReport(testRequest);
        console.log('Success! Report data:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Error testing generateReport:', error);
        console.error('Error stack:', error.stack);
    }
}

testGenerateReport();
