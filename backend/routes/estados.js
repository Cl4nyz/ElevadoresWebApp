const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get all estados
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, sigla, nome FROM estado ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching estados:', error);
    res.status(500).json({ error: 'Error fetching estados' });
  }
});

module.exports = router;