#!/bin/bash

# HomeManager - Sistema de Elevadores
# Script de inicialização para Linux

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_color() {
    printf "${1}${2}${NC}\n"
}

# Cabeçalho
echo "===================================================="
print_color $BLUE "     HomeManager - Sistema de Elevadores"
echo "===================================================="
echo

# Obter diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar se Python3 está instalado
if ! command -v python3 &> /dev/null; then
    print_color $RED "❌ Python3 não encontrado!"
    print_color $YELLOW "💡 Instale com: sudo apt-get install python3 python3-pip python3-venv"
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Verificar se python3-venv está disponível
python3 -m venv --help &> /dev/null
if [ $? -ne 0 ]; then
    print_color $RED "❌ python3-venv não encontrado!"
    print_color $YELLOW "💡 Instale com: sudo apt-get install python3-venv"
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Verificar se requirements.txt existe
if [ ! -f "requirements.txt" ]; then
    print_color $RED "❌ Arquivo requirements.txt não encontrado!"
    read -p "Pressione Enter para sair..."
    exit 1
fi

print_color $GREEN "✅ Pré-requisitos OK"
echo
print_color $BLUE "🚀 Iniciando HomeManager..."
print_color $YELLOW "💡 O aplicativo será fechado automaticamente ao fechar o navegador"
echo "===================================================="
echo

# Executar o aplicativo principal (que gerenciará o venv automaticamente)
python3 homemanager.py
