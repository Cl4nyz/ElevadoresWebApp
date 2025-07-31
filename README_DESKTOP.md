# 🏠 HomeManager - Aplicativo Desktop

Sistema de Gerenciamento de Elevadores executável como aplicativo desktop.

## 🚀 Instalação Rápida

### Linux
```bash
# Clone ou baixe o projeto
git clone <repositorio>
cd ElevadoresWebApp

# Execute o instalador
./instalar_desktop.sh
```

### Windows
```cmd
# Baixe ou clone o projeto
# Navegue para a pasta do projeto
cd ElevadoresWebApp

# Execute o instalador
instalar_desktop.bat
```

## 📱 Como Usar

### Linux
- **Menu de Aplicativos**: Pesquise "HomeManager" e clique
- **Linha de Comando**: `./homemanager.sh`
- **Área de Trabalho**: Clique no ícone (se criado)

### Windows  
- **Menu Iniciar**: Pesquise "HomeManager" e clique
- **Área de Trabalho**: Clique no atalho (se criado)
- **Executar Diretamente**: Clique em `HomeManager.bat`

## 🔧 Arquivos do Sistema

- `homemanager.py` - Script principal Python
- `homemanager.sh` - Launcher para Linux
- `HomeManager.bat` - Launcher para Windows
- `HomeManager.desktop` - Arquivo de aplicativo Linux
- `instalar_desktop.sh` - Instalador Linux
- `instalar_desktop.bat` - Instalador Windows
- `desinstalar_desktop.sh` - Desinstalador Linux

## ✨ Funcionalidades do Executável

- ✅ Verificação automática de dependências
- ✅ Instalação automática de pacotes Python
- ✅ Abertura automática do navegador
- ✅ Interface colorida e intuitiva
- ✅ Detecção de erros com mensagens claras
- ✅ Integração completa com sistema operacional

## 🛠️ Requisitos

- Python 3.7+
- pip
- PostgreSQL
- Navegador web

## 🚨 Solução de Problemas

### "Python não encontrado"
**Linux:**
```bash
sudo apt-get install python3 python3-pip
```

**Windows:**
- Baixe Python em https://python.org
- Marque "Add Python to PATH" durante instalação

### "Erro ao instalar dependências"
```bash
# Linux
pip3 install --user -r requirements.txt

# Windows  
pip install --user -r requirements.txt
```

### "Erro de conexão com banco"
- Verifique se PostgreSQL está rodando
- Configure credenciais em `postgre.py`

## 🔄 Atualização

1. Abra o HomeManager
2. Vá em "Sobre o Sistema"
3. Clique "Verificar Atualizações"
4. Clique "Atualizar Sistema" se disponível

## 🗑️ Desinstalação

### Linux
```bash
./desinstalar_desktop.sh
```

### Windows
- Delete os atalhos criados
- Opcional: delete a pasta do projeto

## 📞 Suporte

Em caso de problemas:
1. Execute o launcher manualmente para ver erros
2. Verifique se todas as dependências estão instaladas
3. Confirme se o PostgreSQL está configurado
4. Consulte os logs no terminal
