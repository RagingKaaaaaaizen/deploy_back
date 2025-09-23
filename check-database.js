const mysql = require('mysql2/promise');

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

async function checkDatabase() {
    let connection;
    
    try {
        console.log('🔍 Connecting to database...');
        const { host, port, user, password, database } = config.database;
        connection = await mysql.createConnection({ host, port, user, password, database });
        
        console.log('✅ Connected to database:', database);
        
        // Check roomLocations
        console.log('\n🏠 ROOM LOCATIONS:');
        try {
            const [roomLocations] = await connection.execute('SELECT * FROM roomLocations ORDER BY id');
            if (roomLocations.length > 0) {
                console.log(`Found ${roomLocations.length} room locations:`);
                roomLocations.forEach(loc => {
                    console.log(`  ID: ${loc.id} | Name: "${loc.name}" | Description: "${loc.description || 'N/A'}"`);
                });
            } else {
                console.log('❌ No room locations found!');
            }
        } catch (error) {
            console.log('❌ roomLocations table does not exist or error:', error.message);
        }
        
        // Check PCs
        console.log('\n🖥️  PCs:');
        try {
            const [pcs] = await connection.execute('SELECT * FROM PCs ORDER BY id');
            if (pcs.length > 0) {
                console.log(`Found ${pcs.length} PCs:`);
                pcs.forEach(pc => {
                    console.log(`  ID: ${pc.id} | Name: "${pc.name}" | Room: ${pc.roomLocationId} | Status: ${pc.status}`);
                });
            } else {
                console.log('No PCs found');
            }
        } catch (error) {
            console.log('❌ PCs table does not exist or error:', error.message);
        }
        
        // Check foreign key constraints
        console.log('\n🔗 FOREIGN KEY CONSTRAINTS:');
        try {
            const [constraints] = await connection.execute(`
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE REFERENCED_TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'PCs'
                AND COLUMN_NAME = 'roomLocationId'
            `, [database]);
            
            if (constraints.length > 0) {
                constraints.forEach(constraint => {
                    console.log(`  ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
                });
            } else {
                console.log('No foreign key constraints found for PCs.roomLocationId');
            }
        } catch (error) {
            console.log('❌ Error checking constraints:', error.message);
        }
        
        console.log('\n✅ Database check completed!');
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script
if (require.main === module) {
    checkDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { checkDatabase };
