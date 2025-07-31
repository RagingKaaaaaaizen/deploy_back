const config = require('./config.json');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

fixForeignKeys(); 