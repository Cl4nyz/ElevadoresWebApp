const express = require('express');
const router = express.Router();
const { queryMany } = require('../utils/database');

// GET /api/cabines - Get all cabin data
router.get('/', async (req, res) => {
  try {
    const cabines = await queryMany(`
      SELECT cb.id, cb.id_elevador, cb.altura, cb.largura, cb.profundidade, cb.piso, 
             cb.montada, cb.lado_entrada, cb.lado_saida,
             e.comando, e.id_contrato,
             c.data_venda, c.data_entrega,
             cl.nome as cliente_nome
      FROM cabine cb
      LEFT JOIN elevador e ON cb.id_elevador = e.id
      LEFT JOIN contrato c ON e.id_contrato = c.id
      LEFT JOIN cliente cl ON c.id_cliente = cl.id
      ORDER BY cb.id
    `);

    const result = cabines.map(cabine => ({
      id: cabine.id,
      id_elevador: cabine.id_elevador,
      altura: cabine.altura,
      largura: cabine.largura,
      profundidade: cabine.profundidade,
      piso: cabine.piso,
      montada: cabine.montada || false,
      lado_entrada: cabine.lado_entrada,
      lado_saida: cabine.lado_saida,
      descricao: cabine.altura && cabine.largura && cabine.profundidade 
        ? `${cabine.altura}x${cabine.largura}x${cabine.profundidade}` 
        : 'N/A',
      // Additional info from joins
      comando: cabine.comando,
      id_contrato: cabine.id_contrato,
      data_venda: cabine.data_venda?.toISOString?.()?.split('T')[0],
      data_entrega: cabine.data_entrega?.toISOString?.()?.split('T')[0],
      cliente_nome: cabine.cliente_nome
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting cabins:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
