#!/bin/bash
# Script para criar uma nova release no GitHub

VERSION="$1"
DESCRIPTION="$2"

if [ -z "$VERSION" ] || [ -z "$DESCRIPTION" ]; then
    echo "❌ Uso: ./create_release.sh <versão> <descrição>"
    echo "📋 Exemplo: ./create_release.sh 1.1.0 'Correções de bugs e melhorias'"
    exit 1
fi

echo "🏷️  Criando release versão $VERSION..."

# 1. Atualizar arquivo de versão
echo "$VERSION" > version.txt

# 2. Commit das mudanças
git add .
git commit -m "Release v$VERSION: $DESCRIPTION"

# 3. Criar tag
git tag -a "v$VERSION" -m "Release v$VERSION"

# 4. Push com tags
git push origin main --tags

echo "✅ Release v$VERSION criada com sucesso!"
echo "📦 Os usuários receberão a atualização automaticamente"
echo "🌐 Acesse: https://github.com/Cl4nyz/ElevadoresWebApp/releases"
