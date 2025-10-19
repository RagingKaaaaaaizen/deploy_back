require('rootpath')();
const mysql = require('mysql2/promise');

async function addPreferredUsernameColumn() {
    let connection;
    
    try {
        console.log('🔧 Adding preferredUsername column to accounts table...');
        
        // Use local database configuration
        const config = {
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'amp'
        };
        
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');
        
        // Check if the column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'amp' 
            AND TABLE_NAME = 'accounts' 
            AND COLUMN_NAME = 'preferredUsername'
        `);
        
        if (columns.length > 0) {
            console.log('✅ preferredUsername column already exists');
            return;
        }
        
        // Add the preferredUsername column
        await connection.execute(`
            ALTER TABLE accounts 
            ADD COLUMN preferredUsername VARCHAR(100) NULL
        `);
        
        console.log('✅ Successfully added preferredUsername column to accounts table');
        
    } catch (error) {
        console.error('❌ Error adding preferredUsername column:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
addPreferredUsernameColumn()
    .then(() => {
        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
