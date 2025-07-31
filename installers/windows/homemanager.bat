@echo off
REM HomeManager - Executável Windows
REM Este script inicia o servidor e abre o navegador

setlocal enabledelayedexpansion
chcp 65001 >nul

REM Cores
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "NC=[0m"

REM Obter diretório do projeto
set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%..") do set "PARENT_DIR=%%~fi"
for %%i in ("%PARENT_DIR%..") do set "PROJECT_DIR=%%~fi"

cd /d "%PROJECT_DIR%"

REM Verificar se ambiente virtual existe
if not exist ".venv" (
    echo %RED%❌ Ambiente virtual não encontrado!%NC%
    echo %YELLOW%Execute o instalador primeiro: installers\windows\install_homemanager.bat%NC%
    pause
    exit /b 1
)

REM Ativar ambiente virtual
call .venv\Scripts\activate.bat

REM Verificar conexão PostgreSQL
echo %BLUE%🔍 Verificando conexão com PostgreSQL...%NC%
python -c "import psycopg2; from postgre import create_pg_connection; create_pg_connection()" >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Erro na conexão com PostgreSQL!%NC%
    echo %YELLOW%Verifique se:%NC%
    echo %YELLOW%  - PostgreSQL está instalado e rodando%NC%
    echo %YELLOW%  - Credenciais no arquivo .env estão corretas%NC%
    echo %YELLOW%  - Banco de dados 'db_elevadores' existe%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ Conexão com PostgreSQL estabelecida%NC%

REM Cabeçalho
echo.
echo ====================================================
echo %BLUE%🏢 HomeManager - Sistema de Elevadores%NC%
echo %CYAN%🚀 Iniciando aplicação...%NC%
echo ====================================================

REM Iniciar servidor
echo %GREEN%🌐 Iniciando servidor...%NC%
start /b python app.py

REM Aguardar servidor inicializar
timeout /t 3 /nobreak >nul

REM Abrir navegador
echo %GREEN%🌐 Abrindo HomeManager no navegador...%NC%
start http://localhost:5000

echo %GREEN%✅ HomeManager iniciado com sucesso!%NC%
echo %CYAN%💡 Para encerrar, feche esta janela%NC%
echo %YELLOW%🌐 URL: http://localhost:5000%NC%

REM Manter janela aberta
echo.
echo Pressione qualquer tecla para encerrar o HomeManager...
pause >nul

REM Finalizar processos Python
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1
echo %GREEN%✅ HomeManager encerrado%NC%
