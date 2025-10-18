const mysql = require('mysql2/promise');

async function addLastLoginColumn(configFile = './config.json') {
    console.log('🔧 Adding lastLogin column to accounts table...\n');
    
    let connection;
    
    try {
        // Load config file
        const config = require(configFile);
        console.log(`📁 Using config: ${configFile}\n`);
        
        // Create database connection
        const dbConfig = config.database || config;
        connection = await mysql.createConnection({
            host: dbConfig.host || 'localhost',
            port: dbConfig.port || 3306,
            user: dbConfig.user || 'root',
            password: dbConfig.password || 'root',
            database: dbConfig.database || 'amp'
        });
        
        console.log('✅ Database connection established');
        console.log(`📊 Database: ${dbConfig.database || 'amp'}\n`);
        
        // Check if lastLogin column already exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'accounts' 
            AND COLUMN_NAME = 'lastLogin'
        `);
        
        if (columns.length > 0) {
            console.log('✅ lastLogin column already exists!');
            console.log('   No changes needed.\n');
            return true;
        }
        
        console.log('📝 lastLogin column not found, adding it now...');
        
        // Add the lastLogin column
        await connection.query(`
            ALTER TABLE accounts 
            ADD COLUMN lastLogin DATETIME NULL
        `);
        
        console.log('✅ Successfully added lastLogin column!\n');
        
        // Verify the column was added
        const [verifyColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'accounts' 
            AND COLUMN_NAME = 'lastLogin'
        `);
        
        if (verifyColumns.length > 0) {
            console.log('✅ Verification successful!');
            console.log('   Column details:', verifyColumns[0]);
            console.log('\n🎉 You can now test login functionality!\n');
            return true;
        } else {
            console.log('❌ Verification failed - column not found after adding');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n🔒 Access denied. Check your database credentials in config.json');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n🌐 Connection refused. Make sure MySQL is running.');
        } else if (error.code === 'ER_DUP_FIELDNAME') {
            console.error('\n✅ Column already exists (this is fine!)');
            return true;
        }
        
        return false;
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
console.log('═══════════════════════════════════════════════════');
console.log('  Add lastLogin Column to Accounts Table');
console.log('═══════════════════════════════════════════════════\n');

// Check for command-line argument
const configFile = process.argv[2] || './config.json';

if (process.argv[2]) {
    console.log(`🎯 Production mode: Using ${configFile}\n`);
} else {
    console.log(`🏠 Local mode: Using ${configFile}\n`);
}

addLastLoginColumn(configFile)
    .then((success) => {
        if (success) {
            console.log('\n✅ Script completed successfully!');
            process.exit(0);
        } else {
            console.log('\n❌ Script failed!');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });

