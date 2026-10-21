const mysql = require('mysql2/promise');

async function testConnection() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: 'sheetforge'
    });

    const [rows] = await connection.query(
      'SELECT COUNT(*) AS supplierCount FROM SUPPLIER'
    );

    console.log('MySQL connection successful!');
    console.log('Database: sheetforge');
    console.log('Suppliers stored in MySQL:', rows[0].supplierCount);
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

testConnection();
