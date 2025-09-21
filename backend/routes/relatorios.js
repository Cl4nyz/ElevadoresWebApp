const express = require('express');
const router = express.Router();
const { queryMany, queryOne } = require('../utils/database');

// GET /api/relatorios/opcoes-filtros - Get filter options (states, etc.)
router.get('/opcoes-filtros', async (req, res) => {
  try {
    const estados = await queryMany(`
      SELECT DISTINCT estado as sigla, estado as nome 
      FROM endereco 
      WHERE estado IS NOT NULL AND estado != '' 
      ORDER BY estado
    `);

    res.json({
      estados: estados || []
    });
  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/relatorios/contratos-por-estado/:estado - Get contracts by state
router.get('/contratos-por-estado/:estado', async (req, res) => {
  const estado = req.params.estado;
  
  try {
    const contratos = await queryMany(`
      SELECT DISTINCT c.id, c.data_venda, c.data_entrega, c.valor,
             cl.nome as cliente_nome, cl.comercial as cliente_comercial,
             e.rua, e.cidade, e.estado
      FROM contrato c
      LEFT JOIN cliente cl ON c.id_cliente = cl.id
      LEFT JOIN endereco e ON cl.id = e.id_cliente
      WHERE UPPER(e.estado) = UPPER($1)
      ORDER BY c.data_venda DESC
    `, [estado]);

    const result = contratos.map(contrato => ({
      ...contrato,
      data_venda: contrato.data_venda?.toISOString?.()?.split('T')[0],
      data_entrega: contrato.data_entrega?.toISOString?.()?.split('T')[0]
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting contracts by state:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/relatorios/elevadores-status - Get elevators by status
router.get('/elevadores-status', async (req, res) => {
  try {
    const elevadores = await queryMany(`
      SELECT e.id, e.comando, e.status, e.cor,
             cb.altura, cb.largura, cb.profundidade, cb.montada as cabine_montada,
             co.elevacao, co.montada as coluna_montada,
             c.data_venda, c.data_entrega,
             cl.nome as cliente_nome
      FROM elevador e
      LEFT JOIN cabine cb ON e.id = cb.id_elevador
      LEFT JOIN coluna co ON e.id = co.id_elevador
      LEFT JOIN contrato c ON e.id_contrato = c.id
      LEFT JOIN cliente cl ON c.id_cliente = cl.id
      ORDER BY e.status, e.id
    `);

    const result = elevadores.map(elevador => ({
      id: elevador.id,
      comando: elevador.comando,
      status: elevador.status,
      cor: elevador.cor,
      cabine_descricao: elevador.altura && elevador.largura && elevador.profundidade 
        ? `${elevador.altura}x${elevador.largura}x${elevador.profundidade}` 
        : 'N/A',
      cabine_montada: elevador.cabine_montada || false,
      elevacao: elevador.elevacao,
      coluna_montada: elevador.coluna_montada || false,
      data_venda: elevador.data_venda?.toISOString?.()?.split('T')[0],
      data_entrega: elevador.data_entrega?.toISOString?.()?.split('T')[0],
      cliente_nome: elevador.cliente_nome
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting elevators by status:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/relatorios/resumo - Get summary statistics
router.get('/resumo', async (req, res) => {
  try {
    // Get total counts
    const totals = await queryOne(`
      SELECT 
        (SELECT COUNT(*) FROM cliente) as total_clientes,
        (SELECT COUNT(*) FROM contrato) as total_contratos,
        (SELECT COUNT(*) FROM elevador) as total_elevadores,
        (SELECT COUNT(*) FROM cabine WHERE montada = true) as cabines_montadas,
        (SELECT COUNT(*) FROM coluna WHERE montada = true) as colunas_montadas
    `);

    // Get contracts by month (last 12 months)
    const contratosPorMes = await queryMany(`
      SELECT 
        DATE_TRUNC('month', data_venda) as mes,
        COUNT(*) as quantidade
      FROM contrato 
      WHERE data_venda >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', data_venda)
      ORDER BY mes DESC
      LIMIT 12
    `);

    // Get elevators by status
    const elevadoresPorStatus = await queryMany(`
      SELECT status, COUNT(*) as quantidade
      FROM elevador
      GROUP BY status
      ORDER BY quantidade DESC
    `);

    // Get top states by contracts
    const estadosTop = await queryMany(`
      SELECT e.estado, COUNT(DISTINCT c.id) as contratos
      FROM contrato c
      LEFT JOIN endereco e ON e.id_cliente = c.id_cliente
      WHERE e.estado IS NOT NULL
      GROUP BY e.estado
      ORDER BY contratos DESC
    `);

    const result = {
      totals: {
        clientes: totals.total_clientes || 0,
        contratos: totals.total_contratos || 0,
        elevadores: totals.total_elevadores || 0,
        cabines_montadas: totals.cabines_montadas || 0,
        colunas_montadas: totals.colunas_montadas || 0
      },
      contratos_por_mes: contratosPorMes.map(item => ({
        mes: item.mes?.toISOString?.()?.substr(0, 7), // YYYY-MM format
        quantidade: parseInt(item.quantidade)
      })),
      elevadores_por_status: elevadoresPorStatus.map(item => ({
        status: item.status,
        quantidade: parseInt(item.quantidade)
      })),
      estados_top: estadosTop.map(item => ({
        estado: item.estado,
        contratos: parseInt(item.contratos)
      }))
    };

    res.json(result);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
