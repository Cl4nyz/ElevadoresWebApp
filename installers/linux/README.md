# HomeManager - Instalação Linux

Este diretório contém os arquivos de instalação do HomeManager para sistemas Linux.

## 📋 Arquivos

- **`install_homemanager.sh`** - Script de instalação completo
- **`homemanager`** - Executável da aplicação

## 🚀 Instalação Rápida

```bash
# Tornar executável e instalar
chmod +x install_homemanager.sh
./install_homemanager.sh
```

## 📱 Como Usar

Após a instalação, o HomeManager estará disponível:

1. **Menu de Aplicativos**: Procure por "HomeManager"
2. **Atalho**: Execute `./installers/linux/homemanager`
3. **Terminal**: Execute o executável diretamente

## ⚙️ O que a Instalação Faz

### Verificações e Instalações Automáticas:
- ✅ Verifica/instala Python3 e pip
- ✅ Cria ambiente virtual (.venv)
- ✅ Instala todas as dependências
- ✅ Configura arquivo .env (se não existir)
- ✅ Cria entrada no menu de aplicativos
- ✅ Configura executável com ícone

### Distribuições Suportadas:
- **Ubuntu/Debian** (apt-get)
- **CentOS/RHEL** (yum)
- **Fedora** (dnf)
- **Arch Linux** (pacman)
- **openSUSE** (zypper)

## 🔧 Funcionalidades do Executável

- **🌐 Abertura Automática**: Abre o navegador automaticamente
- **🔍 Verificação de Conexão**: Testa PostgreSQL antes de iniciar
- **🛡️ Cleanup Automático**: Encerra processos ao fechar
- **💡 Interface Amigável**: Mensagens coloridas e informativas
- **⚠️ Tratamento de Erros**: Mensagens claras sobre problemas

## 📋 Pré-requisitos

### Obrigatórios:
- **PostgreSQL** instalado e rodando
- **Banco de dados** `db_elevadores` criado
- **Arquivo .env** configurado com credenciais corretas

### Automáticos (instalados pelo script):
- Python3
- pip
- venv
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
```sql
-- Criar banco de dados
CREATE DATABASE db_elevadores;

-- Verificar se está rodando
sudo systemctl status postgresql
```

## 🎯 Uso

### Iniciar HomeManager:
```bash
# Via menu de aplicativos
# Procure por "HomeManager"

# Via terminal
./installers/linux/homemanager

# Direto pelo executável
/caminho/para/projeto/installers/linux/homemanager
```

### Parar HomeManager:
- Feche a janela do terminal
- Pressione `Ctrl+C` no terminal
- O navegador pode continuar aberto

## 🔍 Resolução de Problemas

### Erro: "Python3 não encontrado"
```bash
# Execute a instalação novamente
./install_homemanager.sh
```

### Erro: "Conexão PostgreSQL"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL se necessário
sudo systemctl start postgresql

# Verificar configurações no .env
nano .env
```

### Erro: "Ambiente virtual não encontrado"
```bash
# Reinstalar
./install_homemanager.sh
```

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs no terminal
2. Confirme que PostgreSQL está rodando
3. Verifique as credenciais no arquivo .env
4. Execute o instalador novamente

## 🗑️ Desinstalação

Para remover o HomeManager:
```bash
# Remover entrada do menu
rm ~/.local/share/applications/homemanager.desktop

# Remover ambiente virtual
rm -rf .venv

# Atualizar cache do desktop
update-desktop-database ~/.local/share/applications
```
