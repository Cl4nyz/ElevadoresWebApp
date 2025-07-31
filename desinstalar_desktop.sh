#!/bin/bash

# Script de Desinstalação do HomeManager

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

echo "===================================================="
print_color $RED "  Desinstalador do HomeManager"
echo "===================================================="
echo

print_color $YELLOW "⚠️  Este script removerá o HomeManager do menu de aplicativos"
echo
read -p "❓ Deseja continuar com a desinstalação? (s/N): " confirmar

if [[ ! $confirmar =~ ^[Ss]$ ]]; then
    print_color $BLUE "✋ Desinstalação cancelada pelo usuário"
    exit 0
fi

echo
print_color $YELLOW "🗑️  Removendo HomeManager..."

# Remover do menu de aplicativos
if [ -f ~/.local/share/applications/HomeManager.desktop ]; then
    rm ~/.local/share/applications/HomeManager.desktop
    print_color $GREEN "✅ Removido do menu de aplicativos"
else
    print_color $YELLOW "⚠️  Arquivo do menu de aplicativos não encontrado"
fi

# Remover da área de trabalho se existir
if [ -f "$HOME/Desktop/HomeManager.desktop" ]; then
    rm "$HOME/Desktop/HomeManager.desktop"
    print_color $GREEN "✅ Atalho removido da área de trabalho"
elif [ -f "$HOME/Área de Trabalho/HomeManager.desktop" ]; then
    rm "$HOME/Área de Trabalho/HomeManager.desktop"
    print_color $GREEN "✅ Atalho removido da área de trabalho"
fi

# Atualizar banco de dados de aplicativos
update-desktop-database ~/.local/share/applications/ 2>/dev/null
print_color $GREEN "✅ Banco de dados de aplicativos atualizado"

echo
print_color $GREEN "🎉 HomeManager removido com sucesso!"
echo
print_color $BLUE "📝 Nota:"
print_color $NC "   • Os arquivos do projeto não foram removidos"
print_color $NC "   • Para usar novamente, execute: ./instalar_desktop.sh"
print_color $NC "   • Para remover completamente, delete a pasta do projeto"
echo
