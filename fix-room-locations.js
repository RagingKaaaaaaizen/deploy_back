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

async function fixRoomLocations() {
    let connection;
    
    try {
        console.log('🔧 Connecting to database...');
        const { host, port, user, password, database } = config.database;
        connection = await mysql.createConnection({ host, port, user, password, database });
        
        console.log('✅ Connected to database successfully!');
        console.log('🔍 Database:', database);
        
        // First, check what tables exist
        console.log('🔍 Checking existing tables...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME
        `, [database]);
        
        console.log('📋 Available tables:');
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        // Check if roomLocations table exists
        const roomLocationsTableExists = tables.some(table => 
            table.TABLE_NAME.toLowerCase() === 'roomlocations'
        );
        
        if (!roomLocationsTableExists) {
            console.log('🔧 Creating roomLocations table...');
            await connection.execute(`
                CREATE TABLE roomLocations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    createdBy INT,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ roomLocations table created successfully!');
        } else {
            console.log('✅ roomLocations table already exists');
        }
        
        // Check existing room locations
        console.log('🔍 Checking existing room locations...');
        try {
            const [existingLocations] = await connection.execute('SELECT * FROM roomLocations ORDER BY id');
            console.log(`📍 Found ${existingLocations.length} existing room locations:`);
            
            if (existingLocations.length > 0) {
                existingLocations.forEach(location => {
                    console.log(`   ID: ${location.id}, Name: "${location.name}", Description: "${location.description || 'N/A'}"`);
                });
            } else {
                console.log('   (No room locations found)');
            }
            
            // Add default room locations if none exist
            if (existingLocations.length === 0) {
                console.log('🔧 Adding default room locations...');
                
                const defaultLocations = [
                    { name: 'Computer Lab Front', description: 'Front area of the computer lab' },
                    { name: 'Computer Lab Back', description: 'Back area of the computer lab' },
                    { name: 'Server Room', description: 'Server and networking equipment room' },
                    { name: 'Training Room', description: 'Training and presentation room' },
                    { name: 'Storage Area', description: 'Equipment storage area' }
                ];
                
                for (const location of defaultLocations) {
                    const [result] = await connection.execute(`
                        INSERT INTO roomLocations (name, description, createdBy, createdAt, updatedAt)
                        VALUES (?, ?, 1, NOW(), NOW())
                    `, [location.name, location.description]);
                    console.log(`✅ Added room location: "${location.name}" with ID: ${result.insertId}`);
                }
                
                console.log('🎉 All default room locations added successfully!');
            } else {
                console.log('ℹ️  Room locations already exist, no need to add defaults');
            }
        } catch (error) {
            console.error('❌ Error checking room locations:', error.message);
            throw error;
        }
        
        // Check if PCs table exists and its structure
        console.log('🔍 Checking PCs table...');
        const pcsTableExists = tables.some(table => 
            table.TABLE_NAME.toLowerCase() === 'pcs'
        );
        
        if (pcsTableExists) {
            console.log('✅ PCs table exists');
            
            // Check PCs table structure
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM information_schema.COLUMNS c
                LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON c.TABLE_NAME = k.TABLE_NAME AND c.COLUMN_NAME = k.COLUMN_NAME AND k.TABLE_SCHEMA = ?
                WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = 'PCs'
                ORDER BY c.ORDINAL_POSITION
            `, [database, database]);
            
            console.log('📋 PCs table structure:');
            columns.forEach(col => {
                const fkInfo = col.REFERENCED_TABLE_NAME ? ` -> ${col.REFERENCED_TABLE_NAME}.${col.REFERENCED_COLUMN_NAME}` : '';
                console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY}${fkInfo}`);
            });
            
            // Check existing PCs
            const [existingPCs] = await connection.execute('SELECT id, name, roomLocationId FROM PCs ORDER BY id');
            console.log(`🖥️  Found ${existingPCs.length} existing PCs:`);
            if (existingPCs.length > 0) {
                existingPCs.forEach(pc => {
                    console.log(`   ID: ${pc.id}, Name: "${pc.name}", Room Location ID: ${pc.roomLocationId}`);
                });
            }
        } else {
            console.log('⚠️  PCs table does not exist yet');
        }
        
        // Final verification - show all room locations again
        console.log('🔍 Final verification - all room locations:');
        const [finalLocations] = await connection.execute('SELECT * FROM roomLocations ORDER BY id');
        console.log(`📍 Total room locations: ${finalLocations.length}`);
        finalLocations.forEach(location => {
            console.log(`   ID: ${location.id}, Name: "${location.name}", Description: "${location.description || 'N/A'}"`);
        });
        
        console.log('✅ Room locations setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing room locations:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
if (require.main === module) {
    fixRoomLocations()
        .then(() => {
            console.log('🎉 Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixRoomLocations };
