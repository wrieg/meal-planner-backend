const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Connection event handlers
pool.on('connect', () => {
  console.log('✅ Connected to ForDinner database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Test query function
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🔍 Database connection test successful:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
};

module.exports = { pool, testConnection };