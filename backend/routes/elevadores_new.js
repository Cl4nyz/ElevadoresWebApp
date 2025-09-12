const express = require('express');
const router = express.Router();
const { queryMany, queryOne, query } = require('../utils/database');

// GET /api/elevadores - Get all elevators
router.get('/', async (req, res) => {
  try {
    const contratoId = req.query.contrato;
    
    let elevatorQuery = `
      SELECT e.id, e.id_contrato, e.comando, e.observacao, 
             e.porta_inferior, e.porta_superior, e.cor, e.status,
             cl.nome as cliente_nome, c.valor as contrato_valor,
             cab.altura, cab.largura, cab.profundidade, cab.piso as cabine_descricao,
             col.elevacao
      FROM elevador e
      LEFT JOIN contrato c ON e.id_contrato = c.id
      LEFT JOIN cliente cl ON c.id_cliente = cl.id
      LEFT JOIN cabine cab ON e.id = cab.id_elevador
      LEFT JOIN coluna col ON e.id = col.id_elevador
    `;
    
    let queryParams = [];
    
    if (contratoId) {
      elevatorQuery += ' WHERE e.id_contrato = $1';
      queryParams.push(contratoId);
    }
    
    elevatorQuery += ' ORDER BY e.id';
    
    const elevadores = await queryMany(elevatorQuery, queryParams);
    
    res.json(elevadores);
  } catch (error) {
    console.error('Error getting elevators:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/elevadores - Create new elevator
router.post('/', async (req, res) => {
  try {
    const { cliente_id, contrato_id, pavimentos, elevacao, poco, descricao_cabine, status } = req.body;
    
    const result = await query(
      `INSERT INTO elevador (id_contrato, comando, observacao, status) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [contrato_id, `${pavimentos} pavimentos`, descricao_cabine, status || 'Em análise']
    );
    
    const elevadorId = result.rows[0].id;
    
    // Insert cabin data if provided
    if (descricao_cabine) {
      await query(
        `INSERT INTO cabine (id_elevador, piso) VALUES ($1, $2)`,
        [elevadorId, descricao_cabine]
      );
    }
    
    // Insert column data if provided
    if (elevacao) {
      await query(
        `INSERT INTO coluna (id_elevador, elevacao) VALUES ($1, $2)`,
        [elevadorId, parseFloat(elevacao)]
      );
    }
    
    res.status(201).json({ id: elevadorId, message: 'Elevator created successfully' });
  } catch (error) {
    console.error('Error creating elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/elevadores/:id - Update elevator
router.put('/:id', async (req, res) => {
  try {
    const elevadorId = parseInt(req.params.id);
    const { cliente_id, contrato_id, pavimentos, elevacao, poco, descricao_cabine, status } = req.body;
    
    await query(
      `UPDATE elevador 
       SET id_contrato = $1, comando = $2, observacao = $3, status = $4
       WHERE id = $5`,
      [contrato_id, `${pavimentos} pavimentos`, descricao_cabine, status, elevadorId]
    );
    
    // Update cabin data
    if (descricao_cabine) {
      await query(
        `UPDATE cabine SET piso = $1 WHERE id_elevador = $2`,
        [descricao_cabine, elevadorId]
      );
    }
    
    // Update column data
    if (elevacao) {
      await query(
        `UPDATE coluna SET elevacao = $1 WHERE id_elevador = $2`,
        [parseFloat(elevacao), elevadorId]
      );
    }
    
    res.json({ message: 'Elevator updated successfully' });
  } catch (error) {
    console.error('Error updating elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/elevadores/:id - Delete elevator
router.delete('/:id', async (req, res) => {
  try {
    const elevadorId = parseInt(req.params.id);
    
    // Delete related records first
    await query('DELETE FROM cabine WHERE id_elevador = $1', [elevadorId]);
    await query('DELETE FROM coluna WHERE id_elevador = $1', [elevadorId]);
    await query('DELETE FROM elevador WHERE id = $1', [elevadorId]);
    
    res.json({ message: 'Elevator deleted successfully' });
  } catch (error) {
    console.error('Error deleting elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
