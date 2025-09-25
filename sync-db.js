require('rootpath')();
const db = require('./_helpers/db');

async function syncDatabase() {
    try {
        console.log('Syncing database with alter: true...');
        await db.sequelize.sync({ alter: true });
        console.log('Database synced successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
}

syncDatabase();