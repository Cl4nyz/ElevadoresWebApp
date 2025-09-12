const express = require('express');
const router = express.Router();
const { queryMany, queryOne, query } = require('../utils/database');

// GET /api/clientes - Get all clients
router.get('/', async (req, res) => {
  try {
    const clienteRows = await queryMany(`
      SELECT c.id, c.nome, c.comercial, c.documento, c.email,
             e.rua, e.numero, e.cidade, e.estado, e.complemento, e.cep, e.id as endereco_id
      FROM cliente c
      LEFT JOIN endereco e ON c.id = e.id_cliente
      ORDER BY c.id
    `);

    const clientes = [];
    
    for (const row of clienteRows) {
      const clienteId = row.id;
      let clienteExistente = clientes.find(c => c.id === clienteId);
      
      if (clienteExistente) {
        // Add address to existing client
        if (row.rua) {
          clienteExistente.enderecos.push({
            id: row.endereco_id,
            rua: row.rua,
            numero: row.numero,
            cidade: row.cidade,
            estado: row.estado,
            complemento: row.complemento,
            cep: row.cep
          });
        }
      } else {
        // Create new client
        const cliente = {
          id: row.id,
          nome: row.nome,
          comercial: row.comercial || false,
          documento: row.documento || '',
          email: row.email || '',
          cpf: !row.comercial ? row.documento || '' : '',
          cnpj: row.comercial ? row.documento || '' : '',
          enderecos: []
        };
        
        if (row.rua) {
          cliente.enderecos.push({
            id: row.endereco_id,
            rua: row.rua,
            numero: row.numero,
            cidade: row.cidade,
            estado: row.estado,
            complemento: row.complemento,
            cep: row.cep
          });
        }
        
        clientes.push(cliente);
      }
    }

    res.json(clientes);
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clientes - Create new client
router.post('/', async (req, res) => {
  const { nome, comercial, documento, email, enderecos } = req.body;

  try {
    // Validate required fields
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Validate document based on type
    if (comercial && documento && documento.length !== 14) {
      return res.status(400).json({ error: 'CNPJ deve ter 14 dígitos' });
    }
    if (!comercial && documento && documento.length !== 11) {
      return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    }

    // Check if client already exists
    const existingClient = await queryOne(
      'SELECT id FROM cliente WHERE documento = $1',
      [documento]
    );

    if (existingClient) {
      return res.status(400).json({ error: 'Cliente com este documento já existe' });
    }

    // Insert client
    const result = await queryOne(
      `INSERT INTO cliente (nome, comercial, documento, email) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nome.trim(), comercial || false, documento || null, email || null]
    );

    const clienteId = result.id;

    // Insert addresses if provided
    if (enderecos && enderecos.length > 0) {
      for (const endereco of enderecos) {
        if (endereco.rua && endereco.cidade && endereco.estado) {
          await query(
            `INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              clienteId,
              endereco.rua,
              endereco.numero || null,
              endereco.cidade,
              endereco.estado,
              endereco.complemento || null,
              endereco.cep || null
            ]
          );
        }
      }
    }

    res.status(201).json({ id: clienteId, message: 'Cliente criado com sucesso' });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clientes/:id - Update client
router.put('/:id', async (req, res) => {
  const clienteId = parseInt(req.params.id);
  const { nome, comercial, documento, email, enderecos } = req.body;

  try {
    // Validate required fields
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Check if client exists
    const existingClient = await queryOne(
      'SELECT id FROM cliente WHERE id = $1',
      [clienteId]
    );

    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Update client
    await query(
      `UPDATE cliente SET nome = $1, comercial = $2, documento = $3, email = $4 
       WHERE id = $5`,
      [nome.trim(), comercial || false, documento || null, email || null, clienteId]
    );

    // Delete existing addresses
    await query('DELETE FROM endereco WHERE id_cliente = $1', [clienteId]);

    // Insert new addresses
    if (enderecos && enderecos.length > 0) {
      for (const endereco of enderecos) {
        if (endereco.rua && endereco.cidade && endereco.estado) {
          await query(
            `INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              clienteId,
              endereco.rua,
              endereco.numero || null,
              endereco.cidade,
              endereco.estado,
              endereco.complemento || null,
              endereco.cep || null
            ]
          );
        }
      }
    }

    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clientes/:id - Delete client
router.delete('/:id', async (req, res) => {
  const clienteId = parseInt(req.params.id);

  try {
    // Check if client exists
    const existingClient = await queryOne(
      'SELECT id FROM cliente WHERE id = $1',
      [clienteId]
    );

    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Check if client has elevators
    const elevadores = await queryMany(
      'SELECT id FROM elevador WHERE id_cliente = $1',
      [clienteId]
    );

    if (elevadores.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir cliente que possui elevadores cadastrados' 
      });
    }

    // Delete addresses first (foreign key constraint)
    await query('DELETE FROM endereco WHERE id_cliente = $1', [clienteId]);
    
    // Delete client
    await query('DELETE FROM cliente WHERE id = $1', [clienteId]);

    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
