const express = require('express');
const router = express.Router();
const { queryMany, queryOne, query, validateDateRange, parseDateSafe } = require('../utils/database');

// GET /api/contratos - Get all contracts
router.get('/', async (req, res) => {
  try {
    const contratos = await queryMany(`
      SELECT c.id, c.data_venda, c.data_entrega, c.id_cliente, cl.nome, c.vendedor
      FROM contrato c
      LEFT JOIN cliente cl ON c.id_cliente = cl.id
      ORDER BY c.id
    `);

    res.json(contratos.map(row => ({
      id: row.id,
      data_venda: row.data_venda ? row.data_venda : null,
      data_entrega: row.data_entrega ? row.data_entrega : null,
      id_cliente: row.id_cliente,
      cliente_nome: row.nome,
      vendedor: row.vendedor
    })));
  } catch (error) {
    console.error('Error getting contracts:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contratos/:id - Get specific contract
router.get('/:id', async (req, res) => {
  const contratoId = parseInt(req.params.id);

  try {
    const contrato = await queryOne(`
      SELECT c.id, c.id_cliente, c.data_venda, c.data_entrega, c.valor,
             cl.nome as cliente_nome, cl.comercial as cliente_comercial
      FROM contrato c
      LEFT JOIN cliente cl ON c.id_cliente = cl.id
      WHERE c.id = $1
    `, [contratoId]);

    if (!contrato) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    // Get elevators for this contract
    const elevadores = await queryMany(`
      SELECT e.id, e.comando, e.observacao, e.porta_inferior, e.porta_superior, e.cor, e.status,
             cb.altura, cb.largura, cb.profundidade, cb.piso, cb.montada as cabine_montada,
             cb.lado_entrada, cb.lado_saida,
             co.elevacao, co.montada as coluna_montada
      FROM elevador e
      LEFT JOIN cabine cb ON e.id = cb.id_elevador
      LEFT JOIN coluna co ON e.id = co.id_elevador
      WHERE e.id_contrato = $1
      ORDER BY e.id
    `, [contratoId]);

    const result = {
      ...contrato,
      data_venda: contrato.data_venda,
      data_entrega: contrato.data_entrega,
      elevadores: elevadores.map(elev => ({
        id: elev.id,
        comando: elev.comando,
        observacao: elev.observacao,
        porta_inferior: elev.porta_inferior,
        porta_superior: elev.porta_superior,
        cor: elev.cor,
        status: elev.status,
        cabine: {
          altura: elev.altura,
          largura: elev.largura,
          profundidade: elev.profundidade,
          piso: elev.piso,
          montada: elev.cabine_montada || false,
          lado_entrada: elev.lado_entrada,
          lado_saida: elev.lado_saida,
          descricao: elev.altura && elev.largura && elev.profundidade 
            ? `${elev.altura}x${elev.largura}x${elev.profundidade}` 
            : 'N/A'
        },
        coluna: {
          elevacao: elev.elevacao,
          montada: elev.coluna_montada || false
        }
      }))
    };

    res.json(result);
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contratos - Create new contract
router.post('/', async (req, res) => {
  const { id_cliente, data_venda, data_entrega, vendedor } = req.body;

  try {
    // Validate required fields
    if (!id_cliente) {
      return res.status(400).json({ error: 'Cliente é obrigatório' });
    }
    if (!data_venda) {
      return res.status(400).json({ error: 'Data de venda é obrigatória' });
    }

    // Validate client exists
    const existingClient = await queryOne(
      'SELECT id FROM cliente WHERE id = $1',
      [id_cliente]
    );

    if (!existingClient) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    // Validate date range
    if (data_venda && data_entrega) {
      validateDateRange(data_venda, data_entrega);
    }

    // Parse dates
    const parsedDataVenda = parseDateSafe(data_venda);
    const parsedDataEntrega = data_entrega ? parseDateSafe(data_entrega) : null;

    // Insert contract
    const result = await queryOne(
      `INSERT INTO contrato (id_cliente, data_venda, data_entrega, vendedor) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        id_cliente,
        data_venda,
        data_entrega,
        vendedor || '-'
      ]
    );

    res.status(201).json({ id: result.id, message: 'Contrato criado com sucesso' });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/contratos/:id - Update contract
router.put('/:id', async (req, res) => {
  const contratoId = parseInt(req.params.id);
  const { id_cliente, data_venda, data_entrega, vendedor } = req.body;

  try {
    // Check if contract exists
    const existingContract = await queryOne(
      'SELECT id FROM contrato WHERE id = $1',
      [contratoId]
    );

    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    // Validate required fields
    if (!id_cliente) {
      return res.status(400).json({ error: 'Cliente é obrigatório' });
    }
    if (!data_venda) {
      return res.status(400).json({ error: 'Data de venda é obrigatória' });
    }

    // Validate client exists
    const existingClient = await queryOne(
      'SELECT id FROM cliente WHERE id = $1',
      [id_cliente]
    );

    if (!existingClient) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    // Validate date range
    if (data_venda && data_entrega) {
      validateDateRange(data_venda, data_entrega);
    }

    // Parse dates
    const parsedDataVenda = parseDateSafe(data_venda);
    const parsedDataEntrega = data_entrega ? parseDateSafe(data_entrega) : null;

    // Update contract
    await query(
      `UPDATE contrato SET id_cliente = $1, data_venda = $2, data_entrega = $3, vendedor = $4 
       WHERE id = $5`,
      [
        id_cliente,
        parsedDataVenda,
        parsedDataEntrega,
        vendedor || '-',
        contratoId
      ]
    );

    res.json({ message: 'Contrato atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/contratos/:id - Delete contract
router.delete('/:id', async (req, res) => {
  const contratoId = parseInt(req.params.id);

  try {
    // Check if contract exists
    const existingContract = await queryOne(
      'SELECT id FROM contrato WHERE id = $1',
      [contratoId]
    );

    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    // Check if contract has elevators
    const elevadores = await queryMany(
      'SELECT id FROM elevador WHERE id_contrato = $1',
      [contratoId]
    );

    if (elevadores.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir contrato que possui elevadores cadastrados' 
      });
    }

    // Delete contract
    await query('DELETE FROM contrato WHERE id = $1', [contratoId]);

    res.json({ message: 'Contrato excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
