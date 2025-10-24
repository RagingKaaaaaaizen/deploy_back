/**
 * Fix PC Serial Numbers Script
 * 
 * This script updates all existing PCs that have empty string serial numbers
 * to NULL to prevent unique constraint violations.
 * 
 * Run this once to fix historical data.
 */

const db = require('./_helpers/db');

async function fixPCSerialNumbers() {
    try {
        console.log('🔧 Starting PC serial number fix...');
        
        // Wait for database to be ready
        await new Promise(resolve => {
            const checkDb = () => {
                if (db.PC && db.sequelize) {
                    console.log('✅ Database ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for database...');
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });

        // Find all PCs with empty string serial numbers
        const [pcsWithEmptySerial] = await db.sequelize.query(
            `SELECT id, name, serialNumber FROM PCs WHERE serialNumber = ''`
        );

        console.log(`📊 Found ${pcsWithEmptySerial.length} PCs with empty string serial numbers`);

        if (pcsWithEmptySerial.length > 0) {
            console.log('PCs to update:', pcsWithEmptySerial.map(pc => ({ id: pc.id, name: pc.name })));

            // Update all empty string serial numbers to NULL
            const [result] = await db.sequelize.query(
                `UPDATE PCs SET serialNumber = NULL WHERE serialNumber = ''`
            );

            console.log('✅ Updated PCs:', result);
            console.log(`✅ Successfully fixed ${pcsWithEmptySerial.length} PC serial numbers`);
        } else {
            console.log('✅ No PCs with empty string serial numbers found - all clean!');
        }

        // Verify the fix
        const [remainingEmpty] = await db.sequelize.query(
            `SELECT COUNT(*) as count FROM PCs WHERE serialNumber = ''`
        );

        const [nullCount] = await db.sequelize.query(
            `SELECT COUNT(*) as count FROM PCs WHERE serialNumber IS NULL`
        );

        console.log('📊 Verification:');
        console.log(`  - PCs with empty string serial numbers: ${remainingEmpty[0].count}`);
        console.log(`  - PCs with NULL serial numbers: ${nullCount[0].count}`);

        if (remainingEmpty[0].count === 0) {
            console.log('✅ All PC serial numbers are now properly set!');
        } else {
            console.log('⚠️  Warning: Some PCs still have empty string serial numbers');
        }

    } catch (error) {
        console.error('❌ Error fixing PC serial numbers:', error);
        console.error('Error details:', error.message);
        throw error;
    }
}

// Auto-run if executed directly
if (require.main === module) {
    fixPCSerialNumbers()
        .then(() => {
            console.log('✅ PC serial number fix completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ PC serial number fix failed:', error);
            process.exit(1);
        });
}

module.exports = fixPCSerialNumbers;

