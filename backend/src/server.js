const dotenv = require('dotenv');

// Load environment variables from .env file if present
dotenv.config();

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
