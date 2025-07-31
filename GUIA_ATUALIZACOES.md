# 🚀 GUIA COMPLETO PARA LIBERAÇÃO DE ATUALIZAÇÕES

## 📋 **PROCESSO ATUAL (GitHub)**

### **1. Para Desenvolvedores:**

#### **Método 1: Script Automático (Recomendado)**
```bash
# Liberar nova versão automaticamente
./create_release.sh 1.1.0 "Correções de bugs e melhorias de interface"
```

#### **Método 2: Manual**
```bash
# 1. Atualizar versão
echo "1.1.0" > version.txt

# 2. Commit e push
git add .
git commit -m "Release v1.1.0: Suas melhorias aqui"
git tag -a "v1.1.0" -m "Release v1.1.0"
git push origin main --tags
```

#### **Método 3: GitHub Web Interface**
1. Acesse: `https://github.com/Cl4nyz/ElevadoresWebApp/releases`
2. Clique em "Create a new release"
3. Tag: `v1.1.0`
4. Title: `Release v1.1.0`
5. Descrição das mudanças
6. Publish release

### **2. Para Usuários:**
- Sistema verifica atualizações automaticamente
- Botão "Verificar Atualizações" no sistema
- Aplicação automática com backup

---

## 🔧 **CONFIGURAÇÃO ALTERNATIVA (Servidor Próprio)**

Se quiser hospedar em servidor próprio ao invés do GitHub:

### **Estrutura do Servidor:**
```
/var/www/atualizacoes/
├── releases/
│   ├── v1.0.0.zip
│   ├── v1.1.0.zip
│   └── latest.zip -> v1.1.0.zip
├── version.json
└── index.html
```

### **Arquivo version.json:**
```json
{
  "version": "1.1.0",
  "download_url": "https://meuservidor.com/releases/v1.1.0.zip",
  "release_notes": "Correções de bugs e melhorias",
  "published_at": "2025-07-31T17:00:00Z"
}
```

### **Atualizar update_config.py:**
```python
# Servidor próprio
UPDATE_SERVER_URL = "https://meuservidor.com/releases/latest.zip"
VERSION_CHECK_URL = "https://meuservidor.com/version.json"
```

---

## 🛡️ **SEGURANÇA E BACKUP**

### **Arquivos Protegidos (Nunca Sobrescritos):**
- `postgre.py` - Configurações de banco
- `.venv/` - Ambiente virtual
- `*.db` - Bancos de dados
- `config.ini` - Configurações locais
- `*.log` - Arquivos de log

### **Backup Automático:**
- Criado antes de cada atualização
- Localização: `backup_YYYYMMDD_HHMMSS/`
- Rollback automático em caso de erro

---

## 📊 **MONITORAMENTO**

### **Logs de Atualização:**
- Processo completo logado no console
- Arquivos atualizados: contagem e lista
- Erros reportados automaticamente

### **Verificação de Integridade:**
- Arquivos críticos validados
- Backup verificado antes da aplicação
- Rollback automático se falhar

---

## 🎯 **FLUXO COMPLETO**

1. **Desenvolvedor**: Faz mudanças no código
2. **Desenvolvedor**: Executa `./create_release.sh 1.1.0 "Descrição"`
3. **Sistema**: Cria release no GitHub automaticamente
4. **Usuário**: Clica "Verificar Atualizações" 
5. **Sistema**: Detecta nova versão disponível
6. **Usuário**: Clica "Atualizar"
7. **Sistema**: Download → Backup → Aplicação → Reinicialização

---

## ⚡ **TESTE RÁPIDO**

Para testar o sistema:
```bash
python3 test_update.py
```

Este script testa:
- ✅ Verificação de versão
- ✅ Detecção de atualizações
- ✅ Proteção de arquivos
- ✅ Processo de backup
- ❓ Opção de atualização real
