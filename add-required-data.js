// Use environment variables for production, fallback to config.json for development
const config = {
    database: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root",
        database: process.env.DB_NAME || "amp"
    }
};
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function addRequiredData() {
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password, database });
    

    
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