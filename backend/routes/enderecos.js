const express = require('express');
const router = express.Router();
const { queryMany, queryOne, query } = require('../utils/database');

// GET /api/enderecos/:clienteId - Get addresses for a client
router.get('/cliente/:clienteId', async (req, res) => {
  const clienteId = parseInt(req.params.clienteId);
  
  try {
    const enderecos = await queryMany(
      `SELECT e.*, est.nome as estado_nome 
       FROM endereco e 
       LEFT JOIN estado est ON e.estado = est.sigla 
       WHERE e.id_cliente = $1 
       ORDER BY e.id`,
      [clienteId]
    );
    
    res.json(enderecos);
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/enderecos - Create new address
router.post('/', async (req, res) => {
  const { id_cliente, rua, numero, cidade, estado, complemento, cep } = req.body;
  
  try {
    // Validate required fields
    if (!id_cliente || !rua || !cidade || !estado) {
      return res.status(400).json({ 
        error: 'Cliente, rua, cidade e estado são obrigatórios' 
      });
    }
    
    // Validate estado exists (check by sigla, not id)
    const estadoExists = await queryOne(
      'SELECT sigla FROM estado WHERE sigla = $1',
      [estado]
    );
    
    if (!estadoExists) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    const result = await queryOne(
      `INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id_cliente, rua, numero || null, cidade, estado, complemento || null, cep || null]
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/enderecos/:id - Update address
router.put('/:id', async (req, res) => {
  const enderecoId = parseInt(req.params.id);
  const { rua, numero, cidade, estado, complemento, cep } = req.body;
  
  try {
    // Check if address exists
    const existingEndereco = await queryOne(
      'SELECT id FROM endereco WHERE id = $1',
      [enderecoId]
    );
    
    if (!existingEndereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    // Validate required fields
    if (!rua || !cidade || !estado) {
      return res.status(400).json({ 
        error: 'Rua, cidade e estado são obrigatórios' 
      });
    }
    
    await query(
      `UPDATE endereco SET rua = $1, numero = $2, cidade = $3, estado = $4, 
       complemento = $5, cep = $6 WHERE id = $7`,
      [rua, numero || null, cidade, estado, complemento || null, cep || null, enderecoId]
    );
    
    res.json({ message: 'Endereço atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/enderecos/:id - Delete address
router.delete('/:id', async (req, res) => {
  const enderecoId = parseInt(req.params.id);
  
  try {
    const existingEndereco = await queryOne(
      'SELECT id FROM endereco WHERE id = $1',
      [enderecoId]
    );
    
    if (!existingEndereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    await query('DELETE FROM endereco WHERE id = $1', [enderecoId]);
    
    res.json({ message: 'Endereço excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create multiple addresses for a client
const createAddressesForClient = async (clienteId, enderecos) => {
  const createdAddresses = [];
  
  if (enderecos && enderecos.length > 0) {
    for (const endereco of enderecos) {
      if (endereco.rua && endereco.cidade && endereco.estado) {
        try {
          const result = await queryOne(
            `INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
              clienteId,
              endereco.rua,
              endereco.numero || null,
              endereco.cidade,
              endereco.estado, // This should be the sigla (e.g., 'SP', 'RJ')
              endereco.complemento || null,
              endereco.cep || null
            ]
          );
          createdAddresses.push(result);
        } catch (error) {
          console.error('Error creating address for client:', error);
          throw error;
        }
      }
    }
  }
  
  return createdAddresses;
};

// Helper function to delete all addresses for a client
const deleteAddressesForClient = async (clienteId) => {
  try {
    await query('DELETE FROM endereco WHERE id_cliente = $1', [clienteId]);
  } catch (error) {
    console.error('Error deleting addresses for client:', error);
    throw error;
  }
};

module.exports = {
  router,
  createAddressesForClient,
  deleteAddressesForClient
};