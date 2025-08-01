#!/usr/bin/env python3
"""
Conversor de PNG para ICO para o HomeManager
Este script converte a imagem home.png para home.ico para usar como ícone do atalho
"""

import os
import sys
from pathlib import Path

def create_icon():
    """Converte home.png para home.ico"""
    try:
        from PIL import Image
    except ImportError:
        print("❌ Pillow não está instalado!")
        print("💡 Instalando Pillow...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        from PIL import Image
    
    # Caminhos dos arquivos
    script_dir = Path(__file__).parent
    png_path = script_dir / "static" / "images" / "home.png"
    ico_path = script_dir / "static" / "images" / "home.ico"
    
    # Verificar se PNG existe
    if not png_path.exists():
        print(f"❌ Arquivo não encontrado: {png_path}")
        return False
    
    try:
        # Abrir imagem PNG
        print(f"📖 Abrindo: {png_path}")
        img = Image.open(png_path)
        
        # Converter para RGBA se necessário
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Redimensionar para tamanhos padrão de ícone
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)]
        icons = []
        
        for size in sizes:
            icon_img = img.resize(size, Image.Resampling.LANCZOS)
            icons.append(icon_img)
        
        # Salvar como ICO
        print(f"💾 Salvando: {ico_path}")
        icons[0].save(ico_path, format='ICO', sizes=[(icon.width, icon.height) for icon in icons])
        
        print("✅ Ícone criado com sucesso!")
        print(f"📍 Local: {ico_path}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar ícone: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Conversor PNG para ICO - HomeManager")
    print("=" * 50)
    
    if create_icon():
        print("\n🎯 Agora você pode usar o arquivo home.ico como ícone do atalho!")
    else:
        print("\n❌ Falha ao criar o ícone.")
    
    input("\nPressione Enter para sair...")
