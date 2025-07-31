#!/bin/bash

# Script de Instalação do HomeManager
# Instala o HomeManager como aplicativo desktop

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
print_color $BLUE "  Instalador do HomeManager - Sistema de Elevadores"
echo "===================================================="
echo

# Obter diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_color $YELLOW "🔧 Configurando HomeManager como aplicativo desktop..."

# 1. Tornar arquivos executáveis
print_color $YELLOW "📝 Configurando permissões..."
chmod +x homemanager.py homemanager.sh

# 2. Criar diretório de aplicativos se não existir
print_color $YELLOW "📁 Criando diretório de aplicativos..."
mkdir -p ~/.local/share/applications

# 3. Atualizar caminho no arquivo desktop
print_color $YELLOW "🔧 Configurando arquivo desktop..."
sed -i "s|Exec=.*|Exec=$SCRIPT_DIR/homemanager.sh|g" HomeManager.desktop
sed -i "s|Icon=.*|Icon=$SCRIPT_DIR/static/images/home.png|g" HomeManager.desktop

# 4. Copiar arquivo desktop
print_color $YELLOW "📋 Instalando aplicativo..."
cp HomeManager.desktop ~/.local/share/applications/

# 5. Atualizar banco de dados de aplicativos
print_color $YELLOW "🔄 Atualizando banco de dados de aplicativos..."
update-desktop-database ~/.local/share/applications/ 2>/dev/null

# 6. Verificar se pode criar atalho na área de trabalho
if [ -d "$HOME/Desktop" ] || [ -d "$HOME/Área de Trabalho" ]; then
    read -p "❓ Deseja criar atalho na área de trabalho? (s/N): " criar_atalho
    if [[ $criar_atalho =~ ^[Ss]$ ]]; then
        if [ -d "$HOME/Desktop" ]; then
            cp HomeManager.desktop "$HOME/Desktop/"
            chmod +x "$HOME/Desktop/HomeManager.desktop"
            print_color $GREEN "✅ Atalho criado na área de trabalho"
        elif [ -d "$HOME/Área de Trabalho" ]; then
            cp HomeManager.desktop "$HOME/Área de Trabalho/"
            chmod +x "$HOME/Área de Trabalho/HomeManager.desktop"
            print_color $GREEN "✅ Atalho criado na área de trabalho"
        fi
    fi
fi

echo
print_color $GREEN "🎉 Instalação concluída com sucesso!"
echo
print_color $BLUE "📱 Como usar:"
print_color $NC "   • Pesquise 'HomeManager' no menu de aplicativos"
print_color $NC "   • Ou execute: $SCRIPT_DIR/homemanager.sh"
print_color $NC "   • Ou clique no ícone na área de trabalho (se criado)"
echo
print_color $YELLOW "💡 Dicas:"
print_color $NC "   • O aplicativo será aberto no navegador padrão"
print_color $NC "   • Para desinstalar, remova: ~/.local/share/applications/HomeManager.desktop"
print_color $NC "   • Para atualizar o sistema, use a opção no menu 'Sobre o Sistema'"
echo
print_color $GREEN "🚀 HomeManager está pronto para usar!"
