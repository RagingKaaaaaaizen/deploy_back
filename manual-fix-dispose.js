// Manual fix for dispose table schema
const mysql = require('mysql2/promise');

// Database configuration
const config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "amp"
};

async function manualFixDisposeSchema() {
    let connection;
    try {
        console.log('🔧 Starting manual dispose table schema fix...');
        console.log('Database config:', {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user
        });
        
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');
        
        // Check if disposalValue column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'disposes' AND COLUMN_NAME = 'disposalValue'
        `, [config.database]);
        
        if (columns.length === 0) {
            console.log('📋 Adding disposalValue column to disposes table...');
            
            // Add disposalValue column
            await connection.execute(`
                ALTER TABLE disposes 
                ADD COLUMN disposalValue DECIMAL(10,2) NOT NULL DEFAULT 0.00
            `);
            
            console.log('✅ disposalValue column added successfully');
            
            // Update existing records
            const [existingRecords] = await connection.execute('SELECT COUNT(*) as count FROM disposes');
            if (existingRecords[0].count > 0) {
                console.log(`🔄 Updating ${existingRecords[0].count} existing disposal records...`);
                
                await connection.execute(`
                    UPDATE disposes 
                    SET disposalValue = CASE 
                        WHEN quantity > 0 THEN totalValue / quantity 
                        ELSE 0 
                    END 
                    WHERE disposalValue = 0
                `);
                
                console.log('✅ Existing records updated');
            }
        } else {
            console.log('✅ disposalValue column already exists');
        }
        
        // Check if sourceStockId column exists
        const [sourceStockColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'disposes' AND COLUMN_NAME = 'sourceStockId'
        `, [config.database]);
        
        if (sourceStockColumns.length === 0) {
            console.log('📋 Adding sourceStockId column to disposes table...');
            
            await connection.execute(`
                ALTER TABLE disposes 
                ADD COLUMN sourceStockId INT NULL
            `);
            
            console.log('✅ sourceStockId column added successfully');
        } else {
            console.log('✅ sourceStockId column already exists');
        }
        
        // Check if returnStockId column exists
        const [returnStockColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'disposes' AND COLUMN_NAME = 'returnStockId'
        `, [config.database]);
        
        if (returnStockColumns.length === 0) {
            console.log('📋 Adding returnStockId column to disposes table...');
            
            await connection.execute(`
                ALTER TABLE disposes 
                ADD COLUMN returnStockId INT NULL
            `);
            
            console.log('✅ returnStockId column added successfully');
        } else {
            console.log('✅ returnStockId column already exists');
        }
        
        // Verify the fix
        const [allColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'disposes'
            ORDER BY ORDINAL_POSITION
        `, [config.database]);
        
        console.log('📋 Current disposes table columns:');
        allColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}`);
        });
        
        console.log('🎉 Manual dispose table schema fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error in manual schema fix:', error.message);
        console.error('Full error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the fix
manualFixDisposeSchema()
    .then(() => {
        console.log('✅ Manual schema fix completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Manual schema fix failed:', error);
        process.exit(1);
    });
