const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    System Health Check (Express application & PostgreSQL database connectivity)
 * @access  Public
 */
router.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();

  // If no DATABASE_URL has been configured in environment variables
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      success: false,
      message: 'FitBite API is running (DATABASE_URL environment variable is not configured)',
      database: 'unconfigured',
      timestamp,
    });
  }

  try {
    // Perform a lightweight query to test PostgreSQL connectivity
    const dbResult = await pool.query('SELECT 1 AS health_check');

    if (dbResult && dbResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'FitBite API is healthy',
        database: 'connected',
        timestamp,
      });
    }

    throw new Error('Database returned empty response');
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'FitBite API is running but database is unavailable',
      database: 'disconnected',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      timestamp,
    });
  }
});

module.exports = router;
