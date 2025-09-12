const express = require('express');
const router = express.Router();
const { queryMany, queryOne, query } = require('../utils/database');

// GET /api/elevadores - Get all elevators
router.get('/', async (req, res) => {
  try {
    const contratoId = req.query.contrato;
    
    let elevatorQuery = `
      SELECT e.id, e.id_contrato, e.comando, e.observacao, 
             e.porta_inferior, e.porta_superior, e.cor, e.status
      FROM elevador e
    `;
    
    let queryParams = [];
    
    if (contratoId) {
      elevatorQuery += ' WHERE e.id_contrato = $1';
      queryParams.push(contratoId);
    }
    
    elevatorQuery += ' ORDER BY e.id';
    
    const elevadores = await queryMany(elevatorQuery, queryParams);
    
    // For each elevator, get related data (cabine, coluna, adicionais, contrato)
    const elevadoresCompletos = await Promise.all(elevadores.map(async (elevador) => {
      const elevador_id = elevador.id;
      
      // Get cabine data
      const cabineData = await queryOne(`
        SELECT altura, largura, profundidade, piso, montada, 
               lado_entrada, lado_saida
        FROM cabine WHERE id_elevador = $1
      `, [elevador_id]);
      
      // Get coluna data
      const colunaData = await queryOne(`
        SELECT elevacao, montada
        FROM coluna WHERE id_elevador = $1
      `, [elevador_id]);
      
      // Get adicionais data
      const adicionaisData = await queryOne(`
        SELECT cancela, porta, portao, barreira_eletronica,
               lados_enclausuramento, sensor_esmagamento,
               rampa_acesso, nobreak, galvanizada
        FROM adicionais WHERE id_elevador = $1
      `, [elevador_id]);
      
      // Get contrato data
      const contratoData = await queryOne(`
        SELECT c.data_venda, c.data_entrega, cl.nome
        FROM contrato c
        LEFT JOIN cliente cl ON c.id_cliente = cl.id
        WHERE c.id = $1
      `, [elevador.id_contrato]);
      
      return {
        id: elevador.id,
        id_contrato: elevador.id_contrato,
        comando: elevador.comando,
        observacao: elevador.observacao,
        porta_inferior: elevador.porta_inferior,
        porta_superior: elevador.porta_superior,
        cor: elevador.cor,
        status: elevador.status,
        cabine: cabineData ? {
          altura: cabineData.altura,
          largura: cabineData.largura,
          profundidade: cabineData.profundidade,
          piso: cabineData.piso,
          montada: cabineData.montada || false,
          lado_entrada: cabineData.lado_entrada,
          lado_saida: cabineData.lado_saida,
          descricao: (cabineData.altura && cabineData.largura && cabineData.profundidade) 
            ? `${cabineData.altura}x${cabineData.largura}x${cabineData.profundidade}` 
            : "N/A"
        } : null,
        coluna: colunaData ? {
          elevacao: colunaData.elevacao,
          montada: colunaData.montada || false
        } : null,
        adicionais: adicionaisData ? {
          cancela: adicionaisData.cancela || 0,
          porta: adicionaisData.porta || 0,
          portao: adicionaisData.portao || 0,
          barreira_eletronica: adicionaisData.barreira_eletronica || 0,
          lados_enclausuramento: adicionaisData.lados_enclausuramento || 0,
          sensor_esmagamento: adicionaisData.sensor_esmagamento || 0,
          rampa_acesso: adicionaisData.rampa_acesso || 0,
          nobreak: adicionaisData.nobreak || 0,
          galvanizada: adicionaisData.galvanizada || false
        } : null,
        // Additional fields for frontend compatibility
        cliente_nome: contratoData?.nome || null,
        data_entrega: contratoData?.data_entrega ? contratoData.data_entrega.toISOString().split('T')[0] + 'T00:00:00.000Z' : null,
        cabine_descricao: cabineData ? 
          (cabineData.altura && cabineData.largura && cabineData.profundidade 
            ? `${cabineData.altura}x${cabineData.largura}x${cabineData.profundidade}` 
            : "N/A") : "N/A",
        elevacao: colunaData?.elevacao || null
      };
    }));
    
    res.json(elevadoresCompletos);
  } catch (error) {
    console.error('Error getting elevators:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/elevadores - Create new elevator
router.post('/', async (req, res) => {
  try {
    const { 
      id_contrato, comando, porta_inferior, porta_superior, cor, status, observacao,
      cabine, coluna, adicionais 
    } = req.body;
    
    // Validate required fields
    if (!id_contrato || id_contrato === '') {
      return res.status(400).json({ error: 'Contrato é obrigatório' });
    }
    
    if (!comando || comando === '') {
      return res.status(400).json({ error: 'Comando é obrigatório' });
    }
    
    // Convert id_contrato to integer
    const contratoId = parseInt(id_contrato);
    if (isNaN(contratoId)) {
      return res.status(400).json({ error: 'ID do contrato deve ser um número válido' });
    }
    
    // Insert elevator basic data
    const result = await query(
      `INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        contratoId, 
        comando, 
        observacao || null, 
        porta_inferior || null, 
        porta_superior || null, 
        cor || null, 
        status || 'Não iniciado'
      ]
    );
    
    const elevadorId = result.rows[0].id;
    
    // Insert cabin data if provided
    if (cabine && (cabine.altura || cabine.largura || cabine.profundidade)) {
      await query(
        `INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          elevadorId, 
          cabine.altura ? parseInt(cabine.altura) : null, 
          cabine.largura ? parseInt(cabine.largura) : null, 
          cabine.profundidade ? parseInt(cabine.profundidade) : null, 
          cabine.piso || null, 
          cabine.montada || false, 
          cabine.lado_entrada || null, 
          cabine.lado_saida || null
        ]
      );
    }
    
    // Insert column data if provided
    if (coluna && coluna.elevacao) {
      await query(
        `INSERT INTO coluna (id_elevador, elevacao, montada) VALUES ($1, $2, $3)`,
        [
          elevadorId, 
          coluna.elevacao ? parseInt(coluna.elevacao) : null, 
          coluna.montada || false
        ]
      );
    }
    
    // Insert adicionais data if provided
    if (adicionais) {
      await query(
        `INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica, 
         lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          elevadorId, 
          adicionais.cancela ? parseInt(adicionais.cancela) : 0, 
          adicionais.porta ? parseInt(adicionais.porta) : 0, 
          adicionais.portao ? parseInt(adicionais.portao) : 0,
          adicionais.barreira_eletronica ? parseInt(adicionais.barreira_eletronica) : 0, 
          adicionais.lados_enclausuramento ? parseInt(adicionais.lados_enclausuramento) : 0, 
          adicionais.sensor_esmagamento ? parseInt(adicionais.sensor_esmagamento) : 0, 
          adicionais.rampa_acesso ? parseInt(adicionais.rampa_acesso) : 0, 
          adicionais.nobreak ? parseInt(adicionais.nobreak) : 0, 
          adicionais.galvanizada || false
        ]
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
    const { 
      id_contrato, comando, porta_inferior, porta_superior, cor, status, observacao,
      cabine, coluna, adicionais 
    } = req.body;
    
    // Validate required fields
    if (!id_contrato || id_contrato === '') {
      return res.status(400).json({ error: 'Contrato é obrigatório' });
    }
    
    if (!comando || comando === '') {
      return res.status(400).json({ error: 'Comando é obrigatório' });
    }
    
    // Convert id_contrato to integer
    const contratoId = parseInt(id_contrato);
    if (isNaN(contratoId)) {
      return res.status(400).json({ error: 'ID do contrato deve ser um número válido' });
    }
    
    // Update elevator basic data
    await query(
      `UPDATE elevador 
       SET id_contrato = $1, comando = $2, observacao = $3, porta_inferior = $4, 
           porta_superior = $5, cor = $6, status = $7
       WHERE id = $8`,
      [
        contratoId, 
        comando, 
        observacao || null, 
        porta_inferior || null, 
        porta_superior || null, 
        cor || null, 
        status || 'Não iniciado', 
        elevadorId
      ]
    );
    
    // Update or insert cabin data
    if (cabine) {
      // Check if cabine exists (using id_elevador since it's the primary key)
      const existingCabine = await queryOne('SELECT id_elevador FROM cabine WHERE id_elevador = $1', [elevadorId]);
      if (existingCabine) {
        await query(
          `UPDATE cabine SET altura = $1, largura = $2, profundidade = $3, piso = $4, 
           montada = $5, lado_entrada = $6, lado_saida = $7 WHERE id_elevador = $8`,
          [
            cabine.altura ? parseInt(cabine.altura) : null, 
            cabine.largura ? parseInt(cabine.largura) : null, 
            cabine.profundidade ? parseInt(cabine.profundidade) : null, 
            cabine.piso || null, 
            cabine.montada || false, 
            cabine.lado_entrada || null, 
            cabine.lado_saida || null, 
            elevadorId
          ]
        );
      } else if (cabine.altura || cabine.largura || cabine.profundidade) {
        await query(
          `INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            elevadorId, 
            cabine.altura ? parseInt(cabine.altura) : null, 
            cabine.largura ? parseInt(cabine.largura) : null, 
            cabine.profundidade ? parseInt(cabine.profundidade) : null, 
            cabine.piso || null, 
            cabine.montada || false, 
            cabine.lado_entrada || null, 
            cabine.lado_saida || null
          ]
        );
      }
    }
    
    // Update or insert column data
    if (coluna) {
      // Check if coluna exists (using id_elevador since it's the primary key)
      const existingColuna = await queryOne('SELECT id_elevador FROM coluna WHERE id_elevador = $1', [elevadorId]);
      if (existingColuna) {
        await query(
          `UPDATE coluna SET elevacao = $1, montada = $2 WHERE id_elevador = $3`,
          [
            coluna.elevacao ? parseInt(coluna.elevacao) : null, 
            coluna.montada || false, 
            elevadorId
          ]
        );
      } else if (coluna.elevacao) {
        await query(
          `INSERT INTO coluna (id_elevador, elevacao, montada) VALUES ($1, $2, $3)`,
          [
            elevadorId, 
            coluna.elevacao ? parseInt(coluna.elevacao) : null, 
            coluna.montada || false
          ]
        );
      }
    }
    
    // Update or insert adicionais data
    if (adicionais) {
      // Check if adicionais exists (using id_elevador since it's the primary key)
      const existingAdicionais = await queryOne('SELECT id_elevador FROM adicionais WHERE id_elevador = $1', [elevadorId]);
      if (existingAdicionais) {
        await query(
          `UPDATE adicionais SET cancela = $1, porta = $2, portao = $3, barreira_eletronica = $4, 
           lados_enclausuramento = $5, sensor_esmagamento = $6, rampa_acesso = $7, nobreak = $8, galvanizada = $9 
           WHERE id_elevador = $10`,
          [
            adicionais.cancela ? parseInt(adicionais.cancela) : 0, 
            adicionais.porta ? parseInt(adicionais.porta) : 0, 
            adicionais.portao ? parseInt(adicionais.portao) : 0, 
            adicionais.barreira_eletronica ? parseInt(adicionais.barreira_eletronica) : 0,
            adicionais.lados_enclausuramento ? parseInt(adicionais.lados_enclausuramento) : 0, 
            adicionais.sensor_esmagamento ? parseInt(adicionais.sensor_esmagamento) : 0, 
            adicionais.rampa_acesso ? parseInt(adicionais.rampa_acesso) : 0,
            adicionais.nobreak ? parseInt(adicionais.nobreak) : 0, 
            adicionais.galvanizada || false, 
            elevadorId
          ]
        );
      } else {
        await query(
          `INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica, 
           lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            elevadorId, 
            adicionais.cancela ? parseInt(adicionais.cancela) : 0, 
            adicionais.porta ? parseInt(adicionais.porta) : 0, 
            adicionais.portao ? parseInt(adicionais.portao) : 0,
            adicionais.barreira_eletronica ? parseInt(adicionais.barreira_eletronica) : 0, 
            adicionais.lados_enclausuramento ? parseInt(adicionais.lados_enclausuramento) : 0, 
            adicionais.sensor_esmagamento ? parseInt(adicionais.sensor_esmagamento) : 0, 
            adicionais.rampa_acesso ? parseInt(adicionais.rampa_acesso) : 0, 
            adicionais.nobreak ? parseInt(adicionais.nobreak) : 0, 
            adicionais.galvanizada || false
          ]
        );
      }
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
    await query('DELETE FROM adicionais WHERE id_elevador = $1', [elevadorId]);
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
