const db = require('./_helpers/db');
const disposeService = require('./dispose/dispose.service');

async function testDisposeFunctionality() {
    try {
        console.log('=== DEEP REVIEW OF DISPOSE FUNCTIONALITY ===');
        
        // Test 1: Check database connections
        console.log('\n1. Testing database connections...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test 2: Check if tables exist
        console.log('\n2. Checking table structures...');
        const tables = await db.sequelize.showAllSchemas();
        console.log('Available tables:', tables.map(t => t.name));
        
        // Test 3: Check dispose table structure
        console.log('\n3. Checking dispose table structure...');
        const disposeTable = await db.sequelize.getQueryInterface().describeTable('disposes');
        console.log('Dispose table columns:', Object.keys(disposeTable));
        
        // Test 4: Check stock table structure
        console.log('\n4. Checking stock table structure...');
        const stockTable = await db.sequelize.getQueryInterface().describeTable('stocks');
        console.log('Stock table columns:', Object.keys(stockTable));
        
        // Test 5: Get sample data
        console.log('\n5. Getting sample data...');
        const disposals = await disposeService.getAll();
        console.log(`Found ${disposals.length} disposal records`);
        
        if (disposals.length > 0) {
            const sampleDisposal = disposals[0];
            console.log('Sample disposal:', {
                id: sampleDisposal.id,
                itemId: sampleDisposal.itemId,
                quantity: sampleDisposal.quantity,
                returnedToStock: sampleDisposal.returnedToStock,
                returnStockId: sampleDisposal.returnStockId
            });
        }
        
        // Test 6: Check stock entries
        console.log('\n6. Checking stock entries...');
        const stockEntries = await db.Stock.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });
        console.log(`Found ${stockEntries.length} stock entries`);
        
        if (stockEntries.length > 0) {
            const sampleStock = stockEntries[0];
            console.log('Sample stock entry:', {
                id: sampleStock.id,
                itemId: sampleStock.itemId,
                quantity: sampleStock.quantity,
                disposeId: sampleStock.disposeId
            });
        }
        
        // Test 7: Test return to stock functionality
        console.log('\n7. Testing return to stock functionality...');
        const nonReturnedDisposals = disposals.filter(d => !d.returnedToStock);
        
        if (nonReturnedDisposals.length > 0) {
            const testDisposal = nonReturnedDisposals[0];
            console.log('Testing with disposal ID:', testDisposal.id);
            
            try {
                const result = await disposeService.returnToStock(testDisposal.id, 1);
                console.log('✅ Return to stock successful:', result);
                
                // Verify the stock was created
                const newStock = await db.Stock.findOne({
                    where: { disposeId: testDisposal.id }
                });
                
                if (newStock) {
                    console.log('✅ Stock entry created:', {
                        id: newStock.id,
                        itemId: newStock.itemId,
                        quantity: newStock.quantity,
                        disposeId: newStock.disposeId
                    });
                } else {
                    console.log('❌ Stock entry not found');
                }
                
                // Verify disposal was marked as returned
                const updatedDisposal = await disposeService.getById(testDisposal.id);
                console.log('Updated disposal:', {
                    returnedToStock: updatedDisposal.returnedToStock,
                    returnStockId: updatedDisposal.returnStockId
                });
                
            } catch (error) {
                console.log('❌ Return to stock failed:', error.message);
            }
        } else {
            console.log('No non-returned disposals found for testing');
        }
        
        console.log('\n=== DEEP REVIEW COMPLETED ===');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await db.sequelize.close();
    }
}

// Run the test
testDisposeFunctionality();



