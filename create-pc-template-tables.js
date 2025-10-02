require('rootpath')();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createPCTemplateTables() {
    let connection;
    
    try {
        console.log('🔌 Connecting to MySQL database...');
        
        // Database configuration (from your db.js)
        const dbConfig = {
            host: process.env.DB_HOST || '153.92.15.31',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'u875409848_vilar',
            password: process.env.DB_PASSWORD || '6xw;kmmXC$',
            database: process.env.DB_NAME || 'u875409848_vilar',
            multipleStatements: true // Allow multiple statements
        };
        
        console.log('Database configuration:', {
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            database: dbConfig.database
        });
        
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL successfully!');
        
        // Read the SQL script
        const sqlScriptPath = path.join(__dirname, 'create-pc-build-template-tables.sql');
        console.log('📖 Reading SQL script...');
        
        if (!fs.existsSync(sqlScriptPath)) {
            throw new Error(`SQL script not found at: ${sqlScriptPath}`);
        }
        
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
        console.log('📝 SQL script loaded successfully!');
        
        // Execute the script
        console.log('🚀 Executing SQL script to create PC Build Template tables...');
        console.log('⏳ This may take a few moments...');
        
        await connection.query(sqlScript);
        
        console.log('✅ PC Build Template tables created successfully!');
        console.log('🎉 Your PC Build Template feature is now ready!');
        
        // Verify the tables were created
        console.log('\n🔍 Verifying table creation...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('PCBuildTemplates', 'PCBuildTemplateComponents')
        `, [dbConfig.database]);
        
        console.log(`📊 Created ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        // Check table structures
        console.log('\n📋 Table structures:');
        
        const [templateStructure] = await connection.execute('DESCRIBE PCBuildTemplates');
        console.log('\nPCBuildTemplates structure:');
        templateStructure.forEach(column => {
            console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        const [componentStructure] = await connection.execute('DESCRIBE PCBuildTemplateComponents');
        console.log('\nPCBuildTemplateComponents structure:');
        componentStructure.forEach(column => {
            console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n🎯 Next steps:');
        console.log('   1. Restart your backend server');
        console.log('   2. Test creating a PC build template');
        console.log('   3. Check your frontend application');
        
    } catch (error) {
        console.error('❌ Error creating PC Build Template tables:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Troubleshooting:');
            console.log('   - Check your database credentials');
            console.log('   - Make sure your database user has CREATE TABLE permissions');
            console.log('   - Verify the credentials in your environment variables');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting:');
            console.log('   - Make sure your MySQL server is running');
            console.log('   - Check your database host and port settings');
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('\n✅ Tables already exist - this is normal if you run the script multiple times');
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
console.log('🏗️  PC Build Template Tables Creation Script');
console.log('=============================================');
createPCTemplateTables();
