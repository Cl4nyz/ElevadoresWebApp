const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_NAME,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// Routes
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/elevadores', require('./routes/elevadores'));
app.use('/api/contratos', require('./routes/contratos'));
app.use('/api/relatorios', require('./routes/relatorios'));
app.use('/api/sistema', require('./routes/sistema'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`
🏢 HomeManager API Server
==================================================
🚀 Server running on port ${PORT}
🌐 API Base URL: http://localhost:${PORT}/api
🔍 Health Check: http://localhost:${PORT}/api/health
==================================================
  `);
});

module.exports = { app, pool };
