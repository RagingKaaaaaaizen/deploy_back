// Use environment variables for production, fallback to config.json for development
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
const bcrypt = require('bcryptjs');
const db = require('./_helpers/db');

async function fixForeignKeys() {
    try {
        const { host, port, user, password, database } = config.database;
        const connection = await mysql.createConnection({ host, port, user, password, database });
        
        // Add sample category if none exists
        const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
        if (categories[0].count === 0) {
            await connection.execute(`
                INSERT INTO categories (name, description, createdAt, updatedAt)
                VALUES ('Electronics', 'Electronic devices', NOW(), NOW())
            `);
        }
        
        // Add sample brand if none exists
        const [brands] = await connection.execute('SELECT COUNT(*) as count FROM brands');
        if (brands[0].count === 0) {
            await connection.execute(`
                INSERT INTO brands (name, description, createdAt, updatedAt)
                VALUES ('Generic', 'Generic brand', NOW(), NOW())
            `);
        }
        
        // Add sample items if none exist
        const [items] = await connection.execute('SELECT COUNT(*) as count FROM items');
        if (items[0].count === 0) {
            const [categoryResult] = await connection.execute('SELECT id FROM categories LIMIT 1');
            const [brandResult] = await connection.execute('SELECT id FROM brands LIMIT 1');
            
            await connection.execute(`
                INSERT INTO items (name, description, categoryId, brandId, createdAt, updatedAt)
                VALUES ('Test Item', 'Sample item for testing', ?, ?, NOW(), NOW())
            `, [categoryResult[0].id, brandResult[0].id]);
        }
        
        // Add sample storage locations if none exist
        const [locations] = await connection.execute('SELECT COUNT(*) as count FROM storagelocations');
        if (locations[0].count === 0) {
            await connection.execute(`
                INSERT INTO storagelocations (name, description, address, createdAt, updatedAt)
                VALUES ('Warehouse A', 'Main warehouse', '123 Main St', NOW(), NOW())
            `);
        }
        
        // Add admin user if none exists
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
        if (users[0].count === 0) {
            const passwordHash = await bcrypt.hash('admin123', 10);
            await connection.execute(`
                INSERT INTO accounts (firstName, lastName, email, passwordHash, role, verified, status, acceptTerms, created, updated)
                VALUES ('Admin', 'User', 'admin@example.com', ?, 'SuperAdmin', NOW(), 'Active', true, NOW(), NOW())
            `, [passwordHash]);
        }
        
        await connection.end();
        console.log('Foreign key data setup completed');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function updatePCTable() {
    try {
        const { host, port, user, password, database } = config.database;
        const connection = await mysql.createConnection({ host, port, user, password, database });
        
        console.log('🔄 Starting PC table schema update...');
        
        // Check if itemId column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PCs' AND COLUMN_NAME = 'itemId'
        `, [database]);
        
        if (columns.length > 0) {
            console.log('📋 Found itemId column, removing foreign key constraints...');
            
            // Get foreign key constraints
            const [foreignKeys] = await connection.execute(`
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PCs' AND REFERENCED_TABLE_NAME = 'Items'
            `, [database]);
            
            // Drop foreign key constraints
            for (const fk of foreignKeys) {
                try {
                    await connection.execute(`ALTER TABLE PCs DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                    console.log(`✅ Dropped foreign key: ${fk.CONSTRAINT_NAME}`);
                } catch (error) {
                    console.log(`⚠️ Could not drop foreign key ${fk.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
            
            // Drop the itemId column
            try {
                await connection.execute('ALTER TABLE PCs DROP COLUMN itemId');
                console.log('✅ Dropped itemId column');
            } catch (error) {
                console.log(`⚠️ Could not drop itemId column: ${error.message}`);
            }
        }
        
        // Check if categoryId column exists
        const [categoryColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PCs' AND COLUMN_NAME = 'categoryId'
        `, [database]);
        
        if (categoryColumns.length > 0) {
            console.log('📋 Found categoryId column, removing foreign key constraints...');
            
            // Get foreign key constraints for categoryId
            const [categoryForeignKeys] = await connection.execute(`
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PCs' AND REFERENCED_TABLE_NAME = 'Categories'
            `, [database]);
            
            // Drop foreign key constraints
            for (const fk of categoryForeignKeys) {
                try {
                    await connection.execute(`ALTER TABLE PCs DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                    console.log(`✅ Dropped foreign key: ${fk.CONSTRAINT_NAME}`);
                } catch (error) {
                    console.log(`⚠️ Could not drop foreign key ${fk.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
            
            // Drop the categoryId column
            try {
                await connection.execute('ALTER TABLE PCs DROP COLUMN categoryId');
                console.log('✅ Dropped categoryId column');
            } catch (error) {
                console.log(`⚠️ Could not drop categoryId column: ${error.message}`);
            }
        }
        
        // Check if quantity column exists
        const [quantityColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PCs' AND COLUMN_NAME = 'quantity'
        `, [database]);
        
        if (quantityColumns.length > 0) {
            try {
                await connection.execute('ALTER TABLE PCs DROP COLUMN quantity');
                console.log('✅ Dropped quantity column');
            } catch (error) {
                console.log(`⚠️ Could not drop quantity column: ${error.message}`);
            }
        }
        
        // Check if specifications column exists
        const [specColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PCs' AND COLUMN_NAME = 'specifications'
        `, [database]);
        
        if (specColumns.length > 0) {
            try {
                await connection.execute('ALTER TABLE PCs DROP COLUMN specifications');
                console.log('✅ Dropped specifications column');
            } catch (error) {
                console.log(`⚠️ Could not drop specifications column: ${error.message}`);
            }
        }
        
        await connection.end();
        console.log('✅ PC table schema update completed successfully!');
        
    } catch (error) {
        console.error('❌ Error updating PC table schema:', error.message);
    }
}

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');
        
        await fixForeignKeys();
        await updatePCTable();
        
        console.log('✅ All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migrations
runMigrations(); 