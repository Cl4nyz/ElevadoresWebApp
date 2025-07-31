# HomeManager - Instalação Windows

Este diretório contém os arquivos de instalação do HomeManager para sistemas Windows.

## 📋 Arquivos

- **`install_homemanager.bat`** - Script de instalação completo
- **`homemanager.bat`** - Executável da aplicação (Batch)
- **`homemanager.ps1`** - Executável da aplicação (PowerShell)

## 🚀 Instalação Rápida

### Método 1: Batch (Recomendado)
```cmd
# Clique duplo ou execute no cmd
install_homemanager.bat
```

### Método 2: PowerShell
```powershell
# Execute no PowerShell como Administrador
Set-ExecutionPolicy Bypass -Scope Process
.\install_homemanager.bat
```

## 📱 Como Usar

Após a instalação, o HomeManager estará disponível:

1. **Atalho na Área de Trabalho**: `HomeManager.lnk`
2. **Menu Iniciar**: Procure por "HomeManager"
3. **Executável Direto**: `homemanager.bat` ou `homemanager.ps1`

## ⚙️ O que a Instalação Faz

### Verificações e Instalações Automáticas:
- ✅ Verifica/baixa/instala Python automaticamente
- ✅ Configura pip e ferramentas necessárias
- ✅ Cria ambiente virtual (.venv)
- ✅ Instala todas as dependências
- ✅ Configura arquivo .env (se não existir)
- ✅ Cria atalho na área de trabalho
- ✅ Adiciona ao menu iniciar
- ✅ Configura ícone personalizado

### Versões do Windows Suportadas:
- **Windows 10** (todas as versões)
- **Windows 11** (todas as versões)
- **Windows Server 2016+**

## 🔧 Funcionalidades dos Executáveis

### homemanager.bat (Clássico):
- **🌐 Abertura Automática**: Abre navegador automaticamente
- **🔍 Verificação de Conexão**: Testa PostgreSQL antes de iniciar
- **🛡️ Cleanup Automático**: Finaliza processos ao fechar
- **💡 Interface Colorida**: Mensagens com cores ANSI
- **⏹️ Controle Manual**: Pressione qualquer tecla para encerrar

### homemanager.ps1 (Moderno):
- **🎨 Interface Moderna**: PowerShell com cores e formatação
- **🔔 Notificações**: Caixas de diálogo para erros
- **⚡ Performance**: Melhor gerenciamento de processos
- **🛡️ Tratamento Avançado**: Melhor handling de erros
- **🔄 Modo Silencioso**: Suporte a execução sem interação

## 📋 Pré-requisitos

### Obrigatórios:
- **PostgreSQL** instalado e rodando
- **Banco de dados** `db_elevadores` criado
- **Arquivo .env** configurado com credenciais corretas

### Automáticos (instalados pelo script):
- Python 3.11+ (baixado automaticamente se necessário)
- pip e ferramentas Python
- Ambiente virtual
- Dependências Python (via requirements.txt)

## 🔧 Configuração

### Arquivo .env
```bash
PG_NAME=db_elevadores
PG_USER=postgres
PG_PASSWORD=sua_senha_aqui
PG_HOST=localhost
PG_PORT=5432
```

### PostgreSQL
1. Baixe do site oficial: https://www.postgresql.org/download/windows/
2. Instale com as configurações padrão
3. Crie o banco:
```sql
CREATE DATABASE db_elevadores;
```

## 🎯 Uso

### Iniciar HomeManager:

#### Método 1: Atalhos
- **Área de Trabalho**: Clique duplo no atalho "HomeManager"
- **Menu Iniciar**: Procure por "HomeManager"

#### Método 2: Executáveis Diretos
```cmd
# Batch (clássico)
installers\windows\homemanager.bat

# PowerShell (moderno)
powershell -ExecutionPolicy Bypass -File installers\windows\homemanager.ps1
```

### Parar HomeManager:
- **Batch**: Pressione qualquer tecla na janela
- **PowerShell**: Pressione qualquer tecla ou Ctrl+C
- **Forçado**: Feche a janela do terminal

## 🔍 Resolução de Problemas

### Erro: "Python não encontrado"
```cmd
# O instalador baixa automaticamente, mas se falhar:
# 1. Execute o instalador novamente
# 2. Ou baixe manualmente de python.org
install_homemanager.bat
```

### Erro: "Conexão PostgreSQL"
```cmd
# Verificar se PostgreSQL está rodando
services.msc
# Procure por "postgresql" e inicie se necessário

# Verificar configurações
notepad .env
```

### Erro: "Ambiente virtual não encontrado"
```cmd
# Reinstalar completamente
install_homemanager.bat
```

### Erro: "Scripts PowerShell bloqueados"
```powershell
# Execute como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎨 Personalização

### Alterar Ícone:
1. Substitua `static/images/home.png`
2. Execute o instalador novamente

### Alterar Nome:
1. Edite os scripts na pasta `installers/windows/`
2. Procure por "HomeManager" e substitua

## 🆘 Suporte

### Problemas Comuns:

1. **Antivírus Bloqueando**:
   - Adicione exceção para a pasta do projeto
   - Marque scripts como confiáveis

2. **Porta 5000 Ocupada**:
   - Verifique outros processos: `netstat -an | findstr :5000`
   - Encerre processos Python: `taskkill /f /im python.exe`

3. **Dependências Faltando**:
   - Execute o instalador novamente
   - Verifique conexão com internet

### Logs e Diagnóstico:
```cmd
# Verificar processos Python
tasklist | findstr python

# Verificar porta 5000
netstat -an | findstr :5000

# Testar conexão PostgreSQL
psql -U postgres -d db_elevadores -c "SELECT 1;"
```

## 🗑️ Desinstalação

### Automática:
```cmd
# Remover atalhos e entradas
del "%USERPROFILE%\Desktop\HomeManager.lnk"
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager.lnk"

# Remover ambiente virtual
rmdir /s /q .venv
```

### Manual:
1. Delete os atalhos da área de trabalho e menu iniciar
2. Delete a pasta `.venv` do projeto
3. Remova a pasta `installers` se desejar

## 🏆 Dicas de Performance

1. **Firewall**: Adicione exceção para Python
2. **Antivírus**: Exclua pasta do projeto da verificação em tempo real  
3. **SSD**: Instale em SSD para melhor performance
4. **RAM**: Mínimo 4GB recomendado
