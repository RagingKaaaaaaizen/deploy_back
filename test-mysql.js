const mysql = require('mysql2/promise');
async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'amp'
    });
    console.log('Connection successful!');
    await conn.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}
test();