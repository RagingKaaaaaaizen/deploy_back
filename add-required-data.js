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

async function addRequiredData() {
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password, database });
    
    // Add category
    await connection.execute(`
        INSERT INTO categories (name, description, createdAt, updatedAt)
        VALUES ('Electronics', 'Electronic devices', NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = name
    `);
    
    // Add brand
    await connection.execute(`
        INSERT INTO brands (name, description, createdAt, updatedAt)
        VALUES ('Generic', 'Generic brand', NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = name
    `);
    
    // Get category and brand IDs
    const [categoryResult] = await connection.execute('SELECT id FROM categories LIMIT 1');
    const [brandResult] = await connection.execute('SELECT id FROM brands LIMIT 1');
    
    // Add item
    await connection.execute(`
        INSERT INTO items (name, description, categoryId, brandId, createdAt, updatedAt)
        VALUES ('Test Item', 'Sample item for testing', ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = name
    `, [categoryResult[0].id, brandResult[0].id]);
    
    // Add storage location
    await connection.execute(`
        INSERT INTO storagelocations (name, description, address, createdAt, updatedAt)
        VALUES ('Warehouse A', 'Main warehouse', '123 Main St', NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = name
    `);
    
    // Add admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await connection.execute(`
        INSERT INTO accounts (firstName, lastName, email, passwordHash, role, verified, status, acceptTerms, created, updated)
        VALUES ('Admin', 'User', 'admin@example.com', ?, 'SuperAdmin', NOW(), 'Active', true, NOW(), NOW())
        ON DUPLICATE KEY UPDATE firstName = firstName
    `, [passwordHash]);
    
    await connection.end();
    console.log('Required data added successfully');
}

addRequiredData(); 