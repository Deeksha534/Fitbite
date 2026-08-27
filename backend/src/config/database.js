const { Pool } = require('pg');

/**
 * PostgreSQL Connection Pool Configuration
 * Reads connection details from DATABASE_URL.
 * Supports connection pooling for high-throughput concurrent API requests.
 */
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 3000, // Return an error after 3 seconds if connection cannot be established
};

// If SSL is required in production (e.g., AWS RDS / Render / Railway)
if (process.env.DATABASE_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Handle unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Executes a parameterized SQL query using the connection pool
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, ...)
 * @param {Array} params - Array of parameters matching placeholders
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
