@echo off
title HomeManager - Sistema de Elevadores
color 0A

echo ====================================================
echo      HomeManager - Sistema de Elevadores
echo ====================================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python nao encontrado!
    echo 💡 Instale o Python em: https://python.org
    echo    Certifique-se de marcar "Add Python to PATH"
    pause
    exit /b 1
)

REM Navegar para o diretório do aplicativo
cd /d "%~dp0"

REM Verificar se requirements.txt existe
if not exist "requirements.txt" (
    echo ❌ Arquivo requirements.txt nao encontrado!
    pause
    exit /b 1
)

echo ✅ Pre-requisitos OK
echo.
echo 🚀 Iniciando HomeManager...
echo 💡 O aplicativo sera fechado automaticamente ao fechar o navegador
echo ====================================================
echo.

REM Executar o aplicativo principal (que gerenciará o venv automaticamente)
python homemanager.py

pause
