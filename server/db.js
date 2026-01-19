const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Handle empty password string - if DB_PASSWORD is empty string, use empty string (no password)
// If not set at all, use default 'password'
const dbPassword = process.env.DB_PASSWORD === '' 
  ? '' 
  : (process.env.DB_PASSWORD || 'password');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: dbPassword,
  database: process.env.DB_NAME || 'banking_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection (non-blocking)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('\nPlease check:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials in .env file are correct');
    console.error('3. Database "banking_system" exists (run: node setupDb.js)');
    // Don't exit - let the application start and handle errors at request time
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

module.exports = pool.promise();
