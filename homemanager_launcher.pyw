#!/usr/bin/env python3
"""
HomeManager Launcher - Executa o servidor sem console visível
Este script inicia o HomeManager de forma silenciosa
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def main():
    # Obter diretório do script
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Verificar se ambiente virtual existe
    venv_python = script_dir / ".venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        print("❌ Ambiente virtual não encontrado!")
        print("Execute setup.py primeiro para configurar o ambiente.")
        input("Pressione Enter para sair...")
        sys.exit(1)
    
    # Verificar se app.py existe
    app_file = script_dir / "app.py"
    if not app_file.exists():
        print("❌ Arquivo app.py não encontrado!")
        input("Pressione Enter para sair...")
        sys.exit(1)
    
    try:
        # Executar o aplicativo sem janela de console
        # No Windows, usar CREATE_NO_WINDOW para ocultar console
        if os.name == 'nt':  # Windows
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE
            
            subprocess.Popen(
                [str(venv_python), "app.py"],
                cwd=str(script_dir),
                startupinfo=startupinfo,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        else:  # Linux/Mac
            subprocess.Popen(
                [str(venv_python), "app.py"],
                cwd=str(script_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        
        print("🚀 HomeManager iniciado com sucesso!")
        print("🌐 O navegador será aberto automaticamente...")
        
        # Aguardar um pouco e sair
        time.sleep(2)
        
    except Exception as e:
        print(f"❌ Erro ao iniciar HomeManager: {e}")
        input("Pressione Enter para sair...")
        sys.exit(1)

if __name__ == "__main__":
    main()
