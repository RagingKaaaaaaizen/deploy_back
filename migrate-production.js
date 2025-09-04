require('rootpath')();
const db = require('./_helpers/db');

async function migrateProduction() {
    try {
        console.log('🔄 Starting production migration: Adding receiptAttachment column to stocks table...');
        
        // Wait for database initialization
        await new Promise(resolve => {
            const checkDb = () => {
                if (db.sequelize) {
                    console.log('✅ Database connection ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for database connection...');
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
            console.log('✅ Column receiptAttachment already exists in stocks table');
            return;
        }
        
        // Add the receiptAttachment column
        await db.sequelize.query(`
            ALTER TABLE stocks 
            ADD COLUMN receiptAttachment VARCHAR(255) NULL 
            AFTER remarks
        `);
        
        console.log('✅ Successfully added receiptAttachment column to stocks table');
        
        // Verify the column was added
        const [verifyResults] = await db.sequelize.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'stocks' 
            AND COLUMN_NAME = 'receiptAttachment'
        `);
        
        if (verifyResults.length > 0) {
            console.log('✅ Verification successful: receiptAttachment column exists');
            console.log('   Column details:', verifyResults[0]);
        } else {
            console.log('❌ Verification failed: receiptAttachment column not found');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

// Run the migration
migrateProduction()
    .then(() => {
        console.log('🎉 Production migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Production migration failed:', error);
        process.exit(1);
    });
