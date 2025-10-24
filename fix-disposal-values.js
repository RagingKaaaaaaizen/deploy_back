const db = require('./_helpers/db');

async function fixDisposalValues() {
    console.log('=== FIXING DISPOSAL VALUES ===\n');
    
    // Wait for database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        console.log('✅ Database connection ready\n');
        
        // Get all disposals with 0 values
        const disposals = await db.Dispose.findAll({
            where: {
                disposalValue: 0
            },
            include: [
                {
                    model: db.Item,
                    as: 'item',
                    attributes: ['id', 'name']
                }
            ]
        });
        
        console.log(`Found ${disposals.length} disposal records with 0 value\n`);
        
        if (disposals.length === 0) {
            console.log('No disposal records need fixing!');
            return;
        }
        
        let fixedCount = 0;
        let failedCount = 0;
        
        for (const disposal of disposals) {
            console.log(`\n--- Disposal ID: ${disposal.id} ---`);
            console.log(`Item: ${disposal.item ? disposal.item.name : 'Unknown'} (ID: ${disposal.itemId})`);
            console.log(`Quantity: ${disposal.quantity}`);
            console.log(`Current disposalValue: ${disposal.disposalValue}`);
            console.log(`Current totalValue: ${disposal.totalValue}`);
            console.log(`Source Stock ID: ${disposal.sourceStockId}`);
            
            let unitPrice = 0;
            
            // Strategy 1: Try to get price from source stock
            if (disposal.sourceStockId) {
                const sourceStock = await db.Stock.findByPk(disposal.sourceStockId);
                if (sourceStock && sourceStock.price > 0) {
                    unitPrice = parseFloat(sourceStock.price);
                    console.log(`✅ Found price from source stock: ${unitPrice}`);
                }
            }
            
            // Strategy 2: If no source stock price, get latest stock price for this item
            if (unitPrice === 0 && disposal.itemId) {
                const latestStock = await db.Stock.findOne({
                    where: { 
                        itemId: disposal.itemId,
                        price: { [db.Sequelize.Op.gt]: 0 }
                    },
                    order: [['createdAt', 'DESC']],
                    limit: 1
                });
                
                if (latestStock && latestStock.price > 0) {
                    unitPrice = parseFloat(latestStock.price);
                    console.log(`✅ Found price from latest stock: ${unitPrice}`);
                }
            }
            
            // Update disposal record
            if (unitPrice > 0) {
                const newTotalValue = unitPrice * disposal.quantity;
                
                await disposal.update({
                    disposalValue: unitPrice,
                    totalValue: newTotalValue
                });
                
                console.log(`✅ FIXED: disposalValue=${unitPrice}, totalValue=${newTotalValue}`);
                fixedCount++;
            } else {
                console.log(`❌ FAILED: No price found for this disposal`);
                failedCount++;
            }
        }
        
        console.log('\n\n=== SUMMARY ===');
        console.log(`Total disposal records checked: ${disposals.length}`);
        console.log(`✅ Successfully fixed: ${fixedCount}`);
        console.log(`❌ Failed (no price found): ${failedCount}`);
        console.log('\n✅ Migration complete!');
        
    } catch (error) {
        console.error('❌ Error fixing disposal values:', error);
        throw error;
    }
}

// Run the fix
fixDisposalValues()
    .then(() => {
        console.log('\nScript finished successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nScript failed:', error);
        process.exit(1);
    });

