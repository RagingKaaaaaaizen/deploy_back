require('rootpath')();
const db = require('./_helpers/db');

async function autoMigrate() {
    try {
        console.log('🔄 Auto-migration: Checking receiptAttachment column...');
        
        // Wait for database initialization with timeout
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        await new Promise((resolve, reject) => {
            const checkDb = () => {
                attempts++;
                if (db.sequelize) {
                    console.log('✅ Database connection ready for auto-migration');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.log('⚠️ Auto-migration timeout: Database not ready after 5 seconds');
                    resolve(); // Don't fail server startup
                } else {
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });
        
        if (!db.sequelize) {
            console.log('⚠️ Auto-migration skipped: Database not available');
            return;
        }
        
        // Test database connection
        try {
            await db.sequelize.authenticate();
        } catch (authError) {
            console.log('⚠️ Auto-migration skipped: Database authentication failed');
            return;
        }
        
        // Get database name
        const [dbNameResult] = await db.sequelize.query('SELECT DATABASE() as dbName');
        const dbName = dbNameResult[0].dbName;
        
        // Find the correct stocks table (handle case sensitivity)
        const [tables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME LIKE '%stock%'
        `);
        
        const stockTable = tables.find(t => 
            t.TABLE_NAME.toLowerCase() === 'stocks' || 
            t.TABLE_NAME.toLowerCase() === 'stock'
        );
        
        if (!stockTable) {
            console.log('⚠️ Auto-migration skipped: No stocks table found');
            return;
        }
        
        const tableName = stockTable.TABLE_NAME;
        
        // Check if the column already exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = '${tableName}' 
            AND COLUMN_NAME = 'receiptAttachment'
        `);
        
        if (results.length > 0) {
            console.log('✅ Auto-migration: receiptAttachment column already exists');
            return;
        }
        
        // Add the receiptAttachment column
        await db.sequelize.query(`
            ALTER TABLE \`${tableName}\` 
            ADD COLUMN receiptAttachment VARCHAR(255) NULL 
            AFTER remarks
        `);
        
        console.log('✅ Auto-migration: Added receiptAttachment column to stocks table');
        
    } catch (error) {
        console.error('❌ Auto-migration failed:', error.message);
        console.error('   This will not prevent server startup, but the column may need to be added manually');
        // Don't throw error to prevent server startup failure
    }
}

module.exports = autoMigrate;
