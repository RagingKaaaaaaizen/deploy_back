const db = require('./_helpers/db');

async function testQuantity() {
    try {
        console.log('=== Testing Quantity Functionality ===');
        
        // Check if we have stock data
        const stocks = await db.Stock.findAll({
            include: [
                { model: db.Item, as: 'item' },
                { model: db.StorageLocation, as: 'location' }
            ]
        });
        
        console.log('Stock entries found:', stocks.length);
        
        if (stocks.length > 0) {
            console.log('Sample stock entries:');
            stocks.slice(0, 3).forEach(stock => {
                console.log(`- Item: ${stock.item?.name}, Location: ${stock.location?.name}, Quantity: ${stock.quantity}, Price: ${stock.price}`);
            });
            
            // Test quantity calculation for a specific item
            const testItem = stocks[0];
            if (testItem) {
                const itemStocks = stocks.filter(s => 
                    s.itemId === testItem.itemId && 
                    s.locationId === testItem.locationId &&
                    !s.remarks?.includes('PC:')
                );
                
                const totalQuantity = itemStocks.reduce((total, stock) => {
                    return total + (stock.quantity > 0 ? stock.quantity : 0);
                }, 0);
                
                console.log(`\nTest calculation for item ${testItem.item?.name}:`);
                console.log(`- Available quantity: ${totalQuantity}`);
                console.log(`- Stock entries: ${itemStocks.length}`);
            }
        } else {
            console.log('No stock data found. Please add some test data first.');
        }
        
    } catch (error) {
        console.error('Error testing quantity:', error);
    } finally {
        process.exit(0);
    }
}

testQuantity(); 