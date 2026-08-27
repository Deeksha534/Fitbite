const dotenv = require('dotenv');

// Load environment variables from .env file if present
dotenv.config();

// Startup validation for required environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length === 0) {
  console.error('❌ FATAL STARTUP ERROR: JWT_SECRET environment variable is missing.');
  console.error('Please define a secure JWT_SECRET in your backend/.env configuration before starting the server.');
  process.exit(1);
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim().length === 0) {
  console.error('❌ FATAL STARTUP ERROR: DATABASE_URL environment variable is missing.');
  console.error('Please define DATABASE_URL in your backend/.env configuration before starting the server.');
  process.exit(1);
}

const app = require('./app');
const { pool } = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 5000;


// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 FitBite REST API Server is running!`);
  console.log(`📡 Port:        ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health:     http://localhost:${PORT}/api/v1/health`);
  console.log('====================================================');
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing HTTP server and database connections...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('PostgreSQL connection pool closed successfully.');
    } catch (err) {
      console.error('Error closing PostgreSQL pool:', err.message);
    }
    console.log('FitBite server shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
