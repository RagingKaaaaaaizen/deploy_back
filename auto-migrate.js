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
        
        // Check and create PC Build Template tables if they don't exist
        await createPCTemplateTablesIfNeeded();
        
        // Run lastLogin column migration
        await addLastLoginColumnIfNeeded();
        
    } catch (error) {
        console.error('❌ Auto-migration failed:', error.message);
        console.error('   This will not prevent server startup, but the column may need to be added manually');
        // Don't throw error to prevent server startup failure
    }
}

// Function to create PC Build Template tables if they don't exist
async function createPCTemplateTablesIfNeeded() {
    try {
        console.log('🔧 Auto-migration: Checking PC Build Template tables...');
        
        // Check if PCBuildTemplates table exists
        const [templateTables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'PCBuildTemplates'
        `);
        
        if (templateTables.length === 0) {
            console.log('🔧 Creating PCBuildTemplates table...');
            await db.sequelize.query(`
                CREATE TABLE PCBuildTemplates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT NULL,
                    createdBy INT NULL,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    INDEX idx_name (name),
                    INDEX idx_createdBy (createdBy),
                    INDEX idx_createdAt (createdAt)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Auto-migration: Created PCBuildTemplates table');
        } else {
            console.log('✅ Auto-migration: PCBuildTemplates table already exists');
        }
        
        // Check if PCBuildTemplateComponents table exists
        const [componentTables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'PCBuildTemplateComponents'
        `);
        
        if (componentTables.length === 0) {
            console.log('🔧 Creating PCBuildTemplateComponents table...');
            await db.sequelize.query(`
                CREATE TABLE PCBuildTemplateComponents (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    templateId INT NOT NULL,
                    categoryId INT NOT NULL,
                    itemId INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    remarks TEXT NULL,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    INDEX idx_templateId (templateId),
                    INDEX idx_categoryId (categoryId),
                    INDEX idx_itemId (itemId),
                    UNIQUE KEY unique_template_category (templateId, categoryId)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Auto-migration: Created PCBuildTemplateComponents table');
        } else {
            console.log('✅ Auto-migration: PCBuildTemplateComponents table already exists');
        }
        
    } catch (error) {
        console.error('❌ Auto-migration: Failed to create PC Build Template tables:', error.message);
        // Don't throw error to prevent server startup failure
    }
}

// Function to add lastLogin column to accounts table if it doesn't exist
async function addLastLoginColumnIfNeeded() {
    try {
        console.log('🔧 Auto-migration: Checking lastLogin column in accounts table...');
        
        // Get database name
        const [dbNameResult] = await db.sequelize.query('SELECT DATABASE() as dbName');
        const dbName = dbNameResult[0].dbName;
        
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
            console.log('⚠️ Auto-migration: No accounts table found');
            return;
        }
        
        const tableName = accountTable.TABLE_NAME;
        
        // Check if the lastLogin column already exists
        const [results] = await db.sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = '${tableName}' 
            AND COLUMN_NAME = 'lastLogin'
        `);
        
        if (results.length > 0) {
            console.log('✅ Auto-migration: lastLogin column already exists');
            return;
        }
        
        // Add the lastLogin column
        await db.sequelize.query(`
            ALTER TABLE \`${tableName}\` 
            ADD COLUMN \`lastLogin\` DATETIME NULL
        `);
        
        console.log('✅ Auto-migration: Added lastLogin column to accounts table');
        
    } catch (error) {
        console.error('❌ Auto-migration: Failed to add lastLogin column:', error.message);
        console.error('   Full error:', error);
        // For lastLogin column, we'll allow server startup but log the error
        // The accounts service now handles missing column gracefully
        console.warn('⚠️ Server will start but lastLogin functionality will be limited until column is added manually');
    }
}

module.exports = autoMigrate;
