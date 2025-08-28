// Fix dispose table schema - add missing disposalValue column
const config = {
    database: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "1234",
        database: process.env.DB_NAME || "amp"
    }
};
const mysql = require('mysql2/promise');

async function fixDisposeSchema() {
    try {
        console.log('🔧 Starting dispose table schema fix...');
        
        const { host, port, user, password, database } = config.database;
        const connection = await mysql.createConnection({ host, port, user, password, database });
        
        // Check if disposalValue column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'disposes' AND COLUMN_NAME = 'disposalValue'
        `, [database]);
        
        if (columns.length === 0) {
            console.log('📋 Adding disposalValue column to disposes table...');
            
            // Add disposalValue column
            await connection.execute(`
                ALTER TABLE disposes 
                ADD COLUMN disposalValue DECIMAL(10,2) NOT NULL DEFAULT 0.00
            `);
            
            console.log('✅ disposalValue column added successfully');
            
            // Update existing records to have a default disposalValue
            const [existingRecords] = await connection.execute('SELECT COUNT(*) as count FROM disposes');
            if (existingRecords[0].count > 0) {
                console.log(`🔄 Updating ${existingRecords[0].count} existing disposal records...`);
                
                // Update disposalValue based on totalValue and quantity
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
        `, [database]);
        
        if (sourceStockColumns.length === 0) {
            console.log('📋 Adding sourceStockId column to disposes table...');
            
            // Add sourceStockId column
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
        `, [database]);
        
        if (returnStockColumns.length === 0) {
            console.log('📋 Adding returnStockId column to disposes table...');
            
            // Add returnStockId column
            await connection.execute(`
                ALTER TABLE disposes 
                ADD COLUMN returnStockId INT NULL
            `);
            
            console.log('✅ returnStockId column added successfully');
        } else {
            console.log('✅ returnStockId column already exists');
        }
        
        await connection.end();
        console.log('🎉 Dispose table schema fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing dispose schema:', error.message);
        throw error;
    }
}

// Run the fix if this script is executed directly
if (require.main === module) {
    fixDisposeSchema()
        .then(() => {
            console.log('✅ Schema fix completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Schema fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixDisposeSchema };
