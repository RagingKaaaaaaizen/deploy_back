const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executeSchema() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        
        // Database configuration (from your config.json)
        const dbConfig = {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root',
            multipleStatements: true // Allow multiple statements
        };
        
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL successfully!');
        
        // Read the setup script (single user version)
        const setupScriptPath = path.join(__dirname, 'setup_database.sql');
        console.log('📖 Reading setup script...');
        
        if (!fs.existsSync(setupScriptPath)) {
            throw new Error(`Setup script not found at: ${setupScriptPath}`);
        }
        
        let setupScript = fs.readFileSync(setupScriptPath, 'utf8');
        console.log('📝 Setup script loaded successfully!');
        
        // Remove USE statement and handle database creation separately
        const useMatch = setupScript.match(/USE\s+(\w+);/);
        const databaseName = useMatch ? useMatch[1] : 'amp';
        
        // Remove USE statement from script
        setupScript = setupScript.replace(/USE\s+\w+;\s*/g, '');
        
        // Create database first (use query instead of execute for DDL statements)
        console.log(`🏗️  Creating database '${databaseName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        
        // Switch to the database
        await connection.query(`USE \`${databaseName}\``);
        console.log(`✅ Switched to database '${databaseName}'`);
        
        // Execute the rest of the script
        console.log('🚀 Executing database setup...');
        console.log('⏳ This may take a few moments...');
        
        await connection.query(setupScript);
        
        console.log('✅ Database setup completed successfully!');
        console.log('🎉 Your Computer Lab Inventory Management System database is ready!');
        
        // Verify the setup
        console.log('\n🔍 Verifying setup...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Created ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });
        
        // Check sample data
        const [accounts] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
        const [items] = await connection.execute('SELECT COUNT(*) as count FROM items');
        const [stocks] = await connection.execute('SELECT COUNT(*) as count FROM stocks');
        
        console.log('\n📈 Sample data inserted:');
        console.log(`   - ${accounts[0].count} user accounts`);
        console.log(`   - ${items[0].count} items`);
        console.log(`   - ${stocks[0].count} stock entries`);
        
        console.log('\n🎯 Next steps:');
        console.log('   1. Start your Node.js application: npm run start:dev');
        console.log('   2. Access the API at: http://localhost:4000');
        console.log('   3. Check API docs at: http://localhost:4000/api-docs');
        
    } catch (error) {
        console.error('❌ Error executing schema:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Troubleshooting:');
            console.log('   - Check your MySQL username and password');
            console.log('   - Make sure MySQL server is running');
            console.log('   - Verify the credentials in config.json');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting:');
            console.log('   - Make sure MySQL server is running');
            console.log('   - Check if MySQL is installed and started');
            console.log('   - Try: net start mysql (Windows) or brew services start mysql (Mac)');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed.');
        }
    }
}

// Run the script
executeSchema();
