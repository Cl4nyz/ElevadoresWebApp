# HomeManager - Instaladores

Este diretório contém os instaladores completos do HomeManager para diferentes sistemas operacionais.

## 📁 Estrutura

```
installers/
├── linux/                     # Instaladores para Linux
│   ├── install_homemanager.sh # Script de instalação
│   ├── homemanager            # Executável da aplicação
│   └── README.md              # Documentação Linux
├── windows/                   # Instaladores para Windows
│   ├── install_homemanager.bat # Script de instalação (Batch)
│   ├── homemanager.bat        # Executável (Batch)
│   ├── homemanager.ps1        # Executável (PowerShell)
│   └── README.md              # Documentação Windows
└── README.md                  # Este arquivo
```

## 🚀 Instalação Rápida

### 🐧 Linux
```bash
cd installers/linux
chmod +x install_homemanager.sh
./install_homemanager.sh
```

### 🪟 Windows
```cmd
cd installers\windows
install_homemanager.bat
```

## ✨ Funcionalidades

### 🔧 Instalação Automática
- **Detecção de Sistema**: Identifica SO e arquitetura
- **Dependências**: Instala Python, pip, venv automaticamente
- **Ambiente Virtual**: Cria e configura ambiente isolado
- **Configuração**: Gera arquivos .env e configurações

### 📱 Integração com SO
- **Linux**: Entrada no menu de aplicativos com ícone
- **Windows**: Atalho na área de trabalho e menu iniciar
- **Ícone Personalizado**: Usa `static/images/home.png`
- **Categoria**: Organizado como aplicativo de escritório

### 🌐 Funcionalidade de Aplicativo
- **Abertura Automática**: Inicia servidor e abre navegador
- **Gerenciamento de Processos**: Controla ciclo de vida do servidor
- **Cleanup Automático**: Encerra processos ao fechar aplicativo
- **Verificações de Saúde**: Testa conexões antes de iniciar

## 🔧 Tecnologias

### Backend
- **Flask**: Servidor web Python
- **PostgreSQL**: Banco de dados
- **psycopg2**: Driver PostgreSQL
- **Ambiente Virtual**: Isolamento de dependências

### Frontend
- **Bootstrap 5**: Interface responsiva
- **JavaScript**: Interatividade
- **HTML5/CSS3**: Estrutura e estilo

### Instalação
- **Bash**: Scripts Linux
- **Batch/PowerShell**: Scripts Windows
- **Desktop Files**: Integração Linux
- **Shortcuts**: Integração Windows

## 📋 Pré-requisitos

### Sistema Operacional
- **Linux**: Qualquer distribuição moderna (Ubuntu, Debian, CentOS, Fedora, Arch, openSUSE)
- **Windows**: Windows 10/11, Windows Server 2016+

### Banco de Dados
- **PostgreSQL 10+**: Instalado e configurado
- **Banco**: `db_elevadores` criado
- **Usuário**: Com permissões adequadas

### Rede
- **Porta 5000**: Disponível para o servidor Flask
- **Internet**: Para download de dependências durante instalação

## ⚙️ Configuração

### Arquivo .env (Criado automaticamente)
```bash
PG_NAME=db_elevadores
PG_USER=postgres
PG_PASSWORD=sua_senha_aqui
PG_HOST=localhost
PG_PORT=5432
```

### Estrutura do Banco
```sql
-- Tabelas principais
- clientes          # Dados dos clientes
- elevadores        # Cadastro de elevadores
- contratos         # Contratos de manutenção
- cabines           # Detalhes das cabines
- manutencoes       # Histórico de manutenções
```

## 🎯 Como Usar

### Após a Instalação

#### Linux:
1. **Menu de Aplicativos**: Procure por "HomeManager"
2. **Terminal**: Execute `./installers/linux/homemanager`
3. **Atalho**: Use o ícone criado na área de trabalho

#### Windows:
1. **Área de Trabalho**: Clique duplo no atalho "HomeManager"
2. **Menu Iniciar**: Procure por "HomeManager"
3. **Terminal**: Execute `installers\windows\homemanager.bat`

### Interface Web
- **URL**: http://localhost:5000
- **Dashboard**: Visão geral do sistema
- **Módulos**: Clientes, Elevadores, Contratos, Cabines, Relatórios
- **Sistema de Atualização**: Atualizações automáticas via GitHub

## 🛡️ Segurança

### Ambiente Isolado
- **Virtual Environment**: Dependências isoladas
- **Usuário Local**: Não requer privilégios administrativos (após instalação)
- **Porto Local**: Servidor acessível apenas localmente

### Dados
- **PostgreSQL**: Autenticação por usuário/senha
- **Backup Automático**: Sistema de backup integrado
- **Logs**: Registro de atividades

## 🔍 Resolução de Problemas

### Problemas Comuns

#### "Python não encontrado"
- **Linux**: O instalador instala automaticamente
- **Windows**: Downloads automático do python.org

#### "PostgreSQL não conecta"
- Verificar se está rodando: `systemctl status postgresql` (Linux) ou `services.msc` (Windows)
- Conferir credenciais no arquivo `.env`
- Testar conexão: `psql -U postgres -d db_elevadores`

#### "Porta 5000 ocupada"
- **Linux**: `sudo lsof -i :5000` e `kill -9 <PID>`
- **Windows**: `netstat -an | findstr :5000` e `taskkill /f /im python.exe`

### Logs e Diagnóstico
```bash
# Verificar logs do Flask
tail -f app.log

# Testar ambiente virtual
source .venv/bin/activate  # Linux
.venv\Scripts\activate.bat # Windows

# Testar dependências
pip list
```

## 🗑️ Desinstalação

### Remover Aplicativo
```bash
# Linux
rm ~/.local/share/applications/homemanager.desktop
rm -rf .venv

# Windows
del "%USERPROFILE%\Desktop\HomeManager.lnk"
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager.lnk"
rmdir /s /q .venv
```

### Manter Dados
- Banco PostgreSQL permanece intacto
- Configurações em `.env` preservadas
- Arquivos do projeto mantidos

## 🤝 Contribuição

Para contribuir com melhorias nos instaladores:

1. **Fork** o repositório
2. **Crie** branch para sua feature
3. **Teste** em diferentes sistemas
4. **Documente** mudanças no README
5. **Envie** pull request

## 📞 Suporte

Em caso de problemas:

1. **Documentação**: Consulte README específico do SO
2. **Logs**: Verifique saídas do terminal durante instalação
3. **GitHub Issues**: Reporte bugs com detalhes do sistema
4. **Reinstalação**: Execute o instalador novamente

---

## 🎉 Sucesso!

Após a instalação bem-sucedida, você terá:

- ✅ **HomeManager** instalado como aplicativo nativo
- ✅ **Ícone** personalizado nos menus do sistema
- ✅ **Servidor Flask** configurado e funcional
- ✅ **Ambiente isolado** com todas as dependências
- ✅ **Integração completa** com o sistema operacional

**🚀 Pronto para gerenciar elevadores com eficiência!**
