#!/bin/bash

# HomeManager - Script de Demonstração
# Este script demonstra como testar a instalação completa

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

print_header() {
    echo
    echo "===================================================="
    print_color $BLUE "    HomeManager - Demonstração de Instalação"
    echo "===================================================="
    echo
}

print_header

print_color $CYAN "🚀 Este script demonstra o novo sistema de instalação"
echo

# Mostrar estrutura
print_color $YELLOW "📁 Estrutura dos Instaladores:"
echo
tree installers/ 2>/dev/null || (
    print_color $YELLOW "installers/"
    print_color $YELLOW "├── linux/"
    print_color $YELLOW "│   ├── install_homemanager.sh"
    print_color $YELLOW "│   ├── homemanager"
    print_color $YELLOW "│   └── README.md"
    print_color $YELLOW "├── windows/"
    print_color $YELLOW "│   ├── install_homemanager.bat"
    print_color $YELLOW "│   ├── homemanager.bat"
    print_color $YELLOW "│   ├── homemanager.ps1"
    print_color $YELLOW "│   └── README.md"
    print_color $YELLOW "└── README.md"
)
echo

# Verificar sistema atual
print_color $BLUE "🔍 Sistema Atual:"
print_color $GREEN "  ✅ SO: $(uname -s)"
print_color $GREEN "  ✅ Arquitetura: $(uname -m)"
print_color $GREEN "  ✅ Versão HomeManager: $(cat version.txt)"
echo

# Verificar se já está instalado
if [ -f "$HOME/.local/share/applications/homemanager.desktop" ]; then
    print_color $GREEN "  ✅ HomeManager já instalado como aplicativo"
else
    print_color $YELLOW "  ⚠️  HomeManager não está instalado como aplicativo"
fi
echo

# Instruções por sistema
print_color $BLUE "📋 Como Instalar:"
echo

print_color $CYAN "🐧 Para Linux:"
print_color $WHITE "   cd installers/linux"
print_color $WHITE "   chmod +x install_homemanager.sh"
print_color $WHITE "   ./install_homemanager.sh"
echo

print_color $CYAN "🪟 Para Windows:"
print_color $WHITE "   cd installers\\windows"
print_color $WHITE "   install_homemanager.bat"
echo

# Verificar pré-requisitos
print_color $BLUE "🔧 Verificando Pré-requisitos:"
echo

# Python
if command -v python3 >/dev/null 2>&1; then
    print_color $GREEN "  ✅ Python3: $(python3 --version)"
else
    print_color $RED "  ❌ Python3 não encontrado"
fi

# pip
if command -v pip3 >/dev/null 2>&1 || python3 -m pip --version >/dev/null 2>&1; then
    print_color $GREEN "  ✅ pip disponível"
else
    print_color $RED "  ❌ pip não encontrado"
fi

# PostgreSQL
if command -v psql >/dev/null 2>&1; then
    print_color $GREEN "  ✅ PostgreSQL: $(psql --version | head -1)"
else
    print_color $YELLOW "  ⚠️  PostgreSQL não encontrado no PATH"
fi

# Arquivo .env
if [ -f ".env" ]; then
    print_color $GREEN "  ✅ Arquivo .env configurado"
else
    print_color $YELLOW "  ⚠️  Arquivo .env não encontrado (será criado)"
fi

# Ambiente virtual
if [ -d ".venv" ]; then
    print_color $GREEN "  ✅ Ambiente virtual existe"
else
    print_color $YELLOW "  ⚠️  Ambiente virtual não existe (será criado)"
fi

echo

# Funcionalidades
print_color $BLUE "✨ Funcionalidades dos Instaladores:"
echo
print_color $GREEN "  🔧 Instalação automática de dependências"
print_color $GREEN "  🐍 Download e instalação do Python (Windows)"
print_color $GREEN "  📦 Criação de ambiente virtual isolado"
print_color $GREEN "  🖥️  Integração com menu de aplicativos"
print_color $GREEN "  🎨 Ícone personalizado (home.png)"
print_color $GREEN "  🌐 Abertura automática no navegador"
print_color $GREEN "  🛡️  Cleanup automático de processos"
print_color $GREEN "  📋 Verificação de conectividade PostgreSQL"
echo

# Como usar após instalação
print_color $BLUE "🎯 Como Usar Após Instalação:"
echo
print_color $CYAN "🐧 Linux:"
print_color $WHITE "   - Procure 'HomeManager' no menu de aplicativos"
print_color $WHITE "   - Ou execute: ./installers/linux/homemanager"
echo

print_color $CYAN "🪟 Windows:"
print_color $WHITE "   - Clique no atalho da área de trabalho"
print_color $WHITE "   - Ou procure 'HomeManager' no menu iniciar"
print_color $WHITE "   - Ou execute: installers\\windows\\homemanager.bat"
echo

# Demonstração do instalador (se solicitado)
print_color $BLUE "🧪 Demonstração:"
echo
read -p "Deseja executar uma demonstração do instalador Linux? (s/N): " demo

if [[ $demo =~ ^[Ss]$ ]]; then
    echo
    print_color $YELLOW "🚀 Executando instalador Linux..."
    echo
    
    # Executar instalador
    if [ -x "installers/linux/install_homemanager.sh" ]; then
        ./installers/linux/install_homemanager.sh
    else
        print_color $RED "❌ Instalador Linux não encontrado ou não executável"
        print_color $YELLOW "Execute: chmod +x installers/linux/install_homemanager.sh"
    fi
else
    print_color $CYAN "💡 Para instalar manualmente:"
    print_color $WHITE "   ./installers/linux/install_homemanager.sh"
fi

echo
print_color $GREEN "🎉 Demonstração concluída!"
print_color $CYAN "📚 Consulte a documentação em installers/README.md"
echo
