const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// GET /api/sistema/verificar-atualizacoes - Check for updates
router.get('/verificar-atualizacoes', async (req, res) => {
  try {
    // Read current version
    const versionPath = path.join(__dirname, '../../version.txt');
    const currentVersion = await fs.readFile(versionPath, 'utf8').then(v => v.trim()).catch(() => '1.0.0');
    
    // For now, return current version (in real implementation, check GitHub API)
    const result = {
      versao_atual: currentVersion,
      versao_mais_recente: currentVersion,
      atualizacao_disponivel: false,
      data_verificacao: new Date().toISOString()
    };

    res.json(result);
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sistema/atualizar - Update system
router.post('/atualizar', async (req, res) => {
  try {
    // In a real implementation, this would download and apply updates
    res.json({ 
      message: 'Sistema atualizado com sucesso',
      reiniciar_necessario: false
    });
  } catch (error) {
    console.error('Error updating system:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sistema/info - Get system information
router.get('/info', async (req, res) => {
  try {
    // Read current version
    const versionPath = path.join(__dirname, '../../version.txt');
    const version = await fs.readFile(versionPath, 'utf8').then(v => v.trim()).catch(() => '1.0.0');
    
    const info = {
      nome: 'HomeManager',
      versao: version,
      descricao: 'Sistema de Gerenciamento de Elevadores',
      tecnologia: 'React + Node.js + PostgreSQL',
      ambiente: process.env.NODE_ENV || 'development',
      tempo_ativo: process.uptime(),
      memoria_usada: process.memoryUsage(),
      data_inicializacao: new Date().toISOString()
    };

    res.json(info);
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
