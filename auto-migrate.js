const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * Auto-migration function for PC Parts Comparison feature
 * This function ensures all required tables and columns exist
 */
async function autoMigrate() {
    let connection;
    
    try {
        console.log('🔄 Starting auto-migration for PC Parts Comparison feature...');
        
        // Database configuration
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'amp',
            multipleStatements: true
        };
        
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database for migration');
        
        // Check if comparison tables exist
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('part_specifications', 'api_cache', 'comparison_history')
        `, [dbConfig.database]);
        
        const existingTables = tables.map(row => row.TABLE_NAME);
        console.log('📊 Existing comparison tables:', existingTables);
        
        // If comparison tables don't exist, run the migration
        if (existingTables.length < 3) {
            console.log('🚀 Running comparison feature migration...');
            
            // Read and execute the comparison migration script
            const migrationScriptPath = path.join(__dirname, 'comparison-migration.sql');
            
            if (fs.existsSync(migrationScriptPath)) {
                const migrationScript = fs.readFileSync(migrationScriptPath, 'utf8');
                
                // Split the script into individual statements
                const statements = migrationScript
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                
                // Execute each statement
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await connection.execute(statement);
                            console.log('✅ Executed migration statement');
                        } catch (error) {
                            // Ignore "table already exists" errors
                            if (!error.message.includes('already exists')) {
                                console.warn('⚠️  Migration warning:', error.message);
                            }
                        }
                    }
                }
                
                console.log('✅ Comparison feature migration completed');
            } else {
                console.log('⚠️  Migration script not found, skipping comparison tables setup');
            }
        } else {
            console.log('✅ All comparison tables already exist, skipping migration');
        }
        
        // Check for receiptAttachment column in approval_requests table
        try {
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'approval_requests' 
                AND COLUMN_NAME = 'receiptAttachment'
            `, [dbConfig.database]);
            
            if (columns.length === 0) {
                console.log('🔧 Adding receiptAttachment column to approval_requests table...');
                await connection.execute(`
                    ALTER TABLE approval_requests 
                    ADD COLUMN receiptAttachment VARCHAR(500) NULL 
                    COMMENT 'Path to uploaded receipt file'
                `);
                console.log('✅ receiptAttachment column added successfully');
            } else {
                console.log('✅ receiptAttachment column already exists');
            }
        } catch (error) {
            console.warn('⚠️  Could not check/add receiptAttachment column:', error.message);
        }
        
        console.log('🎉 Auto-migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Auto-migration failed:', error.message);
        
        // Don't throw error to prevent server startup failure
        // Just log the issue and continue
        console.log('⚠️  Continuing server startup despite migration issues...');
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Migration connection closed');
        }
    }
}

module.exports = autoMigrate;
