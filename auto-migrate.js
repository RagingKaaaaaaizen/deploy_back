require('rootpath')();
const db = require('./_helpers/db');

async function autoMigrate() {
    try {
        console.log('🔄 Auto-migration: Checking receiptAttachment column...');
        
        // Wait for database initialization
        await new Promise(resolve => {
            const checkDb = () => {
                if (db.sequelize) {
                    resolve();
                } else {
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });
        
        // Check if the column already exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'stocks' 
            AND COLUMN_NAME = 'receiptAttachment'
        `);
        
        if (results.length > 0) {
            console.log('✅ receiptAttachment column already exists');
            return;
        }
        
        // Add the receiptAttachment column
        await db.sequelize.query(`
            ALTER TABLE stocks 
            ADD COLUMN receiptAttachment VARCHAR(255) NULL 
            AFTER remarks
        `);
        
        console.log('✅ Auto-migration: Added receiptAttachment column to stocks table');
        
    } catch (error) {
        console.error('❌ Auto-migration failed:', error.message);
        // Don't throw error to prevent server startup failure
    }
}

module.exports = autoMigrate;
