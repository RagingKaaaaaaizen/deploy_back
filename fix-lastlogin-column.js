const db = require('./_helpers/db');

async function addLastLoginColumn() {
    try {
        console.log('🔧 Manually adding lastLogin column to accounts table...');
        
        // Get database name
        const [dbNameResult] = await db.sequelize.query('SELECT DATABASE() as dbName');
        const dbName = dbNameResult[0].dbName;
        console.log('Database:', dbName);
        
        // Find the correct accounts table (handle case sensitivity)
        const [tables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME LIKE '%account%'
        `);
        
        const accountTable = tables.find(t => 
            t.TABLE_NAME.toLowerCase() === 'accounts' || 
            t.TABLE_NAME.toLowerCase() === 'account'
        );
        
        if (!accountTable) {
            console.log('❌ No accounts table found');
            return;
        }
        
        const tableName = accountTable.TABLE_NAME;
        console.log('Found accounts table:', tableName);
        
        // Check if the lastLogin column already exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = '${tableName}' 
            AND COLUMN_NAME = 'lastLogin'
        `);
        
        if (results.length > 0) {
            console.log('✅ lastLogin column already exists');
            return;
        }
        
        // Add the lastLogin column
        console.log('Adding lastLogin column...');
        await db.sequelize.query(`
            ALTER TABLE \`${tableName}\` 
            ADD COLUMN \`lastLogin\` DATETIME NULL
        `);
        
        console.log('✅ Successfully added lastLogin column to accounts table');
        
    } catch (error) {
        console.error('❌ Failed to add lastLogin column:', error.message);
        console.error('Full error:', error);
    } finally {
        // Close database connection
        await db.sequelize.close();
    }
}

// Run the script
addLastLoginColumn();
