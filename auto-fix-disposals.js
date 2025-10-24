/**
 * AUTO-FIX DISPOSAL VALUES
 * This script automatically fixes old disposal records with 0 values
 * Run this ONCE to fix all historical data
 */

const db = require('./_helpers/db');

async function autoFixDisposals() {
    console.log('\n🔧 AUTO-FIX: Checking disposal records...\n');
    
    // Wait for database to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
        // Check if there are any disposals with 0 values
        const disposalsWithZero = await db.Dispose.count({
            where: {
                disposalValue: 0
            }
        });
        
        if (disposalsWithZero === 0) {
            console.log('✅ All disposal records have valid values. No fix needed.\n');
            return;
        }
        
        console.log(`⚠️  Found ${disposalsWithZero} disposal records with 0 value`);
        console.log('🔄 Starting automatic fix...\n');
        
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
        
        let fixedCount = 0;
        let failedCount = 0;
        
        for (const disposal of disposals) {
            let unitPrice = 0;
            
            // Strategy 1: Try to get price from source stock
            if (disposal.sourceStockId) {
                const sourceStock = await db.Stock.findByPk(disposal.sourceStockId);
                if (sourceStock && sourceStock.price > 0) {
                    unitPrice = parseFloat(sourceStock.price);
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
                }
            }
            
            // Update disposal record
            if (unitPrice > 0) {
                const newTotalValue = unitPrice * disposal.quantity;
                
                await disposal.update({
                    disposalValue: unitPrice,
                    totalValue: newTotalValue
                });
                
                fixedCount++;
                console.log(`✅ Fixed Disposal #${disposal.id}: ${disposal.item?.name || 'Unknown'} - PHP ${unitPrice.toFixed(2)} × ${disposal.quantity} = PHP ${newTotalValue.toFixed(2)}`);
            } else {
                failedCount++;
                console.log(`❌ Could not fix Disposal #${disposal.id}: ${disposal.item?.name || 'Unknown'} - No price found`);
            }
        }
        
        console.log('\n📊 AUTO-FIX SUMMARY:');
        console.log(`   Total checked: ${disposals.length}`);
        console.log(`   ✅ Fixed: ${fixedCount}`);
        console.log(`   ❌ Failed: ${failedCount}`);
        console.log('\n✅ Auto-fix complete!\n');
        
    } catch (error) {
        console.error('❌ Error in auto-fix:', error);
    }
}

module.exports = autoFixDisposals;

