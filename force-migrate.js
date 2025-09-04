require('rootpath')();
const db = require('./_helpers/db');

async function forceMigrate() {
    try {
        console.log('🚀 FORCE MIGRATION: Starting receiptAttachment column migration...');
        
        // Wait for database initialization with timeout
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        await new Promise((resolve, reject) => {
            const checkDb = () => {
                attempts++;
                if (db.sequelize) {
                    console.log('✅ Database connection established');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Database connection timeout after 5 seconds'));
                } else {
                    console.log(`⏳ Waiting for database connection... (${attempts}/${maxAttempts})`);
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database authentication successful');
        
        // Get database name
        const [dbNameResult] = await db.sequelize.query('SELECT DATABASE() as dbName');
        const dbName = dbNameResult[0].dbName;
        console.log(`📊 Connected to database: ${dbName}`);
        
        // Check if stocks table exists
        const [tables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME LIKE '%stock%'
        `);
        
        console.log('📋 Found stock-related tables:', tables.map(t => t.TABLE_NAME));
        
        // Find the correct stocks table (handle case sensitivity)
        const stockTable = tables.find(t => 
            t.TABLE_NAME.toLowerCase() === 'stocks' || 
            t.TABLE_NAME.toLowerCase() === 'stock'
        );
        
        if (!stockTable) {
            throw new Error('No stocks table found in database');
        }
        
        const tableName = stockTable.TABLE_NAME;
        console.log(`🎯 Using table: ${tableName}`);
        
        // Check if the column already exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = '${tableName}' 
            AND COLUMN_NAME = 'receiptAttachment'
        `);
        
        if (results.length > 0) {
            console.log('✅ Column receiptAttachment already exists:');
            console.log('   Details:', results[0]);
            return;
        }
        
        // Check table structure first
        const [columns] = await db.sequelize.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = '${tableName}'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('📋 Current table structure:');
        columns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Add the receiptAttachment column
        console.log('🔧 Adding receiptAttachment column...');
        await db.sequelize.query(`
            ALTER TABLE \`${tableName}\` 
            ADD COLUMN receiptAttachment VARCHAR(255) NULL 
            AFTER remarks
        `);
        
        console.log('✅ Successfully added receiptAttachment column!');
        
        // Verify the column was added
        const [verifyResults] = await db.sequelize.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = '${tableName}' 
            AND COLUMN_NAME = 'receiptAttachment'
        `);
        
        if (verifyResults.length > 0) {
            console.log('✅ Verification successful:');
            console.log('   Column details:', verifyResults[0]);
        } else {
            console.log('❌ Verification failed: Column not found after creation');
        }
        
        // Test a simple query to make sure everything works
        console.log('🧪 Testing stock query...');
        const [testResults] = await db.sequelize.query(`
            SELECT id, itemId, quantity, price, remarks, receiptAttachment 
            FROM \`${tableName}\` 
            LIMIT 1
        `);
        
        console.log('✅ Test query successful!');
        console.log('   Sample result:', testResults[0] || 'No data found (table is empty)');
        
    } catch (error) {
        console.error('❌ FORCE MIGRATION FAILED:');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        throw error;
    }
}

// Run the migration
forceMigrate()
    .then(() => {
        console.log('🎉 FORCE MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('   The receiptAttachment column has been added to the stocks table.');
        console.log('   Your application should now work without the database error.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 FORCE MIGRATION FAILED:');
        console.error('   Please check the error messages above and try again.');
        process.exit(1);
    });
