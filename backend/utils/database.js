const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_NAME,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Helper function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Helper function to get a single row
const queryOne = async (text, params) => {
  const result = await query(text, params);
  return result.rows[0];
};

// Helper function to get multiple rows
const queryMany = async (text, params) => {
  const result = await query(text, params);
  return result.rows;
};

// Date parsing utility (from Python version)
const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  
  try {
    // If already in ISO format (YYYY-MM-DD)
    if (dateString.length === 10 && dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts[0].length === 4) {
        return new Date(dateString);
      }
    }
    
    // If Brazilian format (DD/MM/YYYY)
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }
    }
    
    // Try as ISO format
    return new Date(dateString);
  } catch (error) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
};

// Date range validation
const validateDateRange = (dataInicio, dataFim) => {
  if (dataInicio && dataFim) {
    if (new Date(dataFim) < new Date(dataInicio)) {
      throw new Error('Data de fim deve ser posterior à data de início');
    }
  }
};

module.exports = {
  pool,
  query,
  queryOne,
  queryMany,
  parseDateSafe,
  validateDateRange
};
