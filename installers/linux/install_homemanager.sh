#!/bin/bash

# ============================================================================
# HomeManager - Sistema de Gerenciamento de Elevadores
# Instalador Completo para Linux
# ============================================================================

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para imprimir cabeçalho
print_header() {
    echo
    echo "===================================================="
    print_color $BLUE "     HomeManager - Sistema de Elevadores"
    print_color $CYAN "         Instalador para Linux"
    echo "===================================================="
    echo
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para instalar Python3 e pip
install_python() {
    print_color $YELLOW "📦 Instalando Python3 e pip..."
    
    if command_exists apt-get; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv python3-dev
    elif command_exists yum; then
        # CentOS/RHEL/Fedora (older)
        sudo yum install -y python3 python3-pip python3-venv python3-devel
    elif command_exists dnf; then
        # Fedora (newer)
        sudo dnf install -y python3 python3-pip python3-venv python3-devel
    elif command_exists pacman; then
        # Arch Linux
        sudo pacman -S --noconfirm python python-pip python-virtualenv
    elif command_exists zypper; then
        # openSUSE
        sudo zypper install -y python3 python3-pip python3-venv python3-devel
    else
        print_color $RED "❌ Gerenciador de pacotes não suportado!"
        print_color $YELLOW "Por favor, instale Python3, pip e venv manualmente."
        exit 1
    fi
}

# Função principal de instalação
main() {
    print_header
    
    # Obter diretório do projeto (2 níveis acima do script)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
    
    print_color $CYAN "📁 Diretório do projeto: $PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Verificar se Python3 está instalado
    if ! command_exists python3; then
        print_color $YELLOW "⚠️  Python3 não encontrado. Instalando..."
        install_python
    else
        print_color $GREEN "✅ Python3 encontrado: $(python3 --version)"
    fi
    
    # Verificar se pip está instalado
    if ! command_exists pip3 && ! python3 -m pip --version >/dev/null 2>&1; then
        print_color $RED "❌ pip não encontrado!"
        install_python
    else
        print_color $GREEN "✅ pip encontrado"
    fi
    
    # Criar ambiente virtual
    print_color $YELLOW "🔧 Criando ambiente virtual..."
    if [ -d ".venv" ]; then
        print_color $YELLOW "⚠️  Ambiente virtual já existe. Removendo..."
        rm -rf .venv
    fi
    
    python3 -m venv .venv
    print_color $GREEN "✅ Ambiente virtual criado"
    
    # Ativar ambiente virtual e instalar dependências
    print_color $YELLOW "📦 Instalando dependências..."
    source .venv/bin/activate
    
    # Atualizar pip
    python -m pip install --upgrade pip
    
    # Instalar dependências
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        print_color $GREEN "✅ Dependências instaladas"
    else
        print_color $RED "❌ Arquivo requirements.txt não encontrado!"
        exit 1
    fi
    
    # Verificar arquivo .env
    if [ ! -f ".env" ]; then
        print_color $YELLOW "⚠️  Arquivo .env não encontrado. Criando..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_color $YELLOW "📝 Configure o arquivo .env com suas credenciais do PostgreSQL"
        else
            cat > .env << EOF
PG_NAME=db_elevadores
PG_USER=postgres
PG_PASSWORD=sua_senha_aqui
PG_HOST=localhost
PG_PORT=5432
EOF
            print_color $YELLOW "📝 Arquivo .env criado. Configure suas credenciais do PostgreSQL"
        fi
    fi
    
    # Criar arquivo .desktop
    print_color $YELLOW "🖥️  Criando entrada na área de trabalho..."
    
    DESKTOP_FILE="$HOME/.local/share/applications/homemanager.desktop"
    ICON_PATH="$PROJECT_DIR/static/images/home.png"
    EXEC_PATH="$PROJECT_DIR/installers/linux/homemanager"
    
    # Criar diretório se não existir
    mkdir -p "$HOME/.local/share/applications"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=HomeManager
Comment=Sistema de Gerenciamento de Elevadores
Exec=$EXEC_PATH
Icon=$ICON_PATH
Terminal=false
StartupNotify=true
Categories=Office;Database;
Keywords=elevadores;gestão;contratos;clientes;
StartupWMClass=HomeManager
EOF
    
    chmod +x "$DESKTOP_FILE"
    print_color $GREEN "✅ Entrada na área de trabalho criada"
    
    # Criar script executável
    print_color $YELLOW "⚙️  Criando executável..."
    cat > "$EXEC_PATH" << 'EOF'
#!/bin/bash

# HomeManager - Executável
# Este script inicia o servidor e abre o navegador

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_color() {
    printf "${1}${2}${NC}\n"
}

# Obter diretório do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_DIR"

# Verificar se ambiente virtual existe
if [ ! -d ".venv" ]; then
    print_color $RED "❌ Ambiente virtual não encontrado!"
    print_color $YELLOW "Execute o instalador primeiro: ./installers/linux/install_homemanager.sh"
    exit 1
fi

# Função para cleanup
cleanup() {
    print_color $YELLOW "\n🛑 Encerrando HomeManager..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
    fi
    print_color $GREEN "✅ HomeManager encerrado com sucesso"
    exit 0
}

# Capturar sinais de interrupção
trap cleanup SIGINT SIGTERM

# Ativar ambiente virtual
source .venv/bin/activate

# Verificar se PostgreSQL está acessível
print_color $BLUE "🔍 Verificando conexão com PostgreSQL..."
if ! python3 -c "import psycopg2; from postgre import create_pg_connection; create_pg_connection()" 2>/dev/null; then
    print_color $RED "❌ Erro na conexão com PostgreSQL!"
    print_color $YELLOW "Verifique se:"
    print_color $YELLOW "  - PostgreSQL está instalado e rodando"
    print_color $YELLOW "  - Credenciais no arquivo .env estão corretas"
    print_color $YELLOW "  - Banco de dados 'db_elevadores' existe"
    exit 1
fi

print_color $GREEN "✅ Conexão com PostgreSQL estabelecida"

# Cabeçalho
echo
echo "===================================================="
print_color $BLUE "🏢 HomeManager - Sistema de Elevadores"
print_color $CYAN "🚀 Iniciando aplicação..."
echo "===================================================="

# Iniciar servidor em background
python3 app.py &
SERVER_PID=$!

# Aguardar servidor inicializar
sleep 3

# Verificar se servidor está rodando
if ! kill -0 $SERVER_PID 2>/dev/null; then
    print_color $RED "❌ Falha ao iniciar o servidor!"
    exit 1
fi

# Abrir navegador
print_color $GREEN "🌐 Abrindo HomeManager no navegador..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5000" >/dev/null 2>&1
elif command -v gnome-open >/dev/null 2>&1; then
    gnome-open "http://localhost:5000" >/dev/null 2>&1
elif command -v firefox >/dev/null 2>&1; then
    firefox "http://localhost:5000" >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome "http://localhost:5000" >/dev/null 2>&1 &
else
    print_color $YELLOW "⚠️  Não foi possível abrir o navegador automaticamente"
    print_color $CYAN "Abra manualmente: http://localhost:5000"
fi

print_color $GREEN "✅ HomeManager iniciado com sucesso!"
print_color $CYAN "💡 Feche esta janela ou pressione Ctrl+C para encerrar"

# Aguardar sinal de encerramento
wait $SERVER_PID
EOF
    
    chmod +x "$EXEC_PATH"
    print_color $GREEN "✅ Executável criado"
    
    # Atualizar cache do desktop
    if command_exists update-desktop-database; then
        update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    fi
    
    # Sucesso
    echo
    echo "===================================================="
    print_color $GREEN "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "===================================================="
    print_color $CYAN "📱 O HomeManager foi instalado como aplicativo"
    print_color $CYAN "🔍 Procure por 'HomeManager' na sua lista de aplicativos"
    print_color $CYAN "🖱️  Ou execute: $EXEC_PATH"
    echo
    print_color $YELLOW "⚠️  IMPORTANTE:"
    print_color $YELLOW "  - Configure o arquivo .env com suas credenciais do PostgreSQL"
    print_color $YELLOW "  - Certifique-se de que o PostgreSQL está instalado e rodando"
    print_color $YELLOW "  - Crie o banco de dados 'db_elevadores' se necessário"
    echo
    print_color $GREEN "✅ Tudo pronto! Bom uso do HomeManager!"
    echo
}

# Executar instalação
main "$@"
