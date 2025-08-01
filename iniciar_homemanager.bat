@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

REM Cores para output
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "NC=[0m"

REM Obter diretório do script atual
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo %BLUE%🏢 HomeManager - Sistema de Elevadores%NC%
echo %CYAN%===============================================%NC%

REM Verificar se arquivo app.py existe
if not exist "app.py" (
    echo %RED%❌ Arquivo app.py não encontrado!%NC%
    echo %YELLOW%Certifique-se de que o script está na pasta correta do projeto.%NC%
    pause
    exit /b 1
)

REM Verificar se ambiente virtual existe
if not exist ".venv" (
    echo %YELLOW%⚠️  Ambiente virtual não encontrado. Tentando criar...%NC%
    python -m venv .venv
    if errorlevel 1 (
        echo %RED%❌ Erro ao criar ambiente virtual!%NC%
        pause
        exit /b 1
    )
    echo %GREEN%✅ Ambiente virtual criado%NC%
)

REM Ativar ambiente virtual
echo %BLUE%🔧 Ativando ambiente virtual...%NC%
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo %RED%❌ Erro ao ativar ambiente virtual!%NC%
    pause
    exit /b 1
)

REM Verificar se há servidor já rodando na porta 5000
echo %BLUE%Verificando se servidor ja esta rodando...%NC%
netstat -aon | findstr :5000 >nul 2>&1
if %errorlevel% == 0 (
    echo %GREEN%Servidor ja esta rodando!%NC%
    echo %CYAN%Abrindo navegador...%NC%
    start http://localhost:5000
    echo %GREEN%Navegador aberto para instancia existente%NC%
    timeout /t 2 /nobreak >nul
    exit /b 0
)

REM Instalar/atualizar dependências se necessário
if exist "requirements.txt" (
    echo %BLUE%📦 Verificando dependências...%NC%
    pip install -r requirements.txt >nul 2>&1
)

REM Verificar conexão PostgreSQL
echo %BLUE%Verificando conexao com PostgreSQL...%NC%
python -c "import psycopg2; from postgre import create_pg_connection; conn = create_pg_connection(); print('Conexao OK' if conn else 'Erro')" >nul 2>&1
if errorlevel 1 (
    echo %RED%Erro na conexao com PostgreSQL!%NC%
    echo %YELLOW%Verifique se:%NC%
    echo %YELLOW%  - PostgreSQL esta instalado e rodando%NC%
    echo %YELLOW%  - Credenciais no arquivo .env estao corretas%NC%
    echo %YELLOW%  - Banco de dados 'db_elevadores' existe%NC%
    echo.
    echo %CYAN%Pressione qualquer tecla para continuar mesmo assim...%NC%
    pause >nul
)

echo %GREEN%Iniciando HomeManager...%NC%
echo %CYAN%Servidor sera iniciado em http://localhost:5000%NC%
echo %YELLOW%O navegador sera aberto automaticamente%NC%
echo.

REM Iniciar servidor em background
echo %BLUE%Iniciando servidor Flask...%NC%
start /b pythonw app.py

REM Aguardar servidor inicializar
echo %BLUE%Aguardando servidor inicializar...%NC%
timeout /t 5 /nobreak >nul

REM Verificar se servidor está respondendo
echo %BLUE%Testando conexao com servidor...%NC%
python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000', timeout=5); print('OK')" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%Servidor pode estar iniciando ainda. Tentando abrir navegador...%NC%
) else (
    echo %GREEN%Servidor esta respondendo%NC%
)

REM Abrir navegador
echo %CYAN%Abrindo HomeManager no navegador...%NC%
start http://localhost:5000

echo.
echo %GREEN%HomeManager iniciado com sucesso!%NC%
echo %CYAN%Acesse: http://localhost:5000%NC%
echo %YELLOW%Para parar o servidor, execute: parar_homemanager.bat%NC%
echo.

REM Opção de manter janela aberta ou fechar
choice /c SN /m "Manter esta janela aberta para monitoramento? (S/N)"
if errorlevel 2 (
    echo %GREEN%✅ HomeManager rodando em segundo plano%NC%
    timeout /t 2 /nobreak >nul
    exit /b 0
)

echo.
echo %CYAN%=== MONITORAMENTO DO HOMEMANAGER ===%NC%
echo %YELLOW%O servidor está rodando em segundo plano%NC%
echo %YELLOW%Pressione qualquer tecla para encerrar o HomeManager...%NC%
pause >nul

REM Finalizar processos Python relacionados ao HomeManager
echo.
echo %BLUE%🛑 Encerrando HomeManager...%NC%
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq app.py*" >nul 2>&1

REM Verificar se processo foi encerrado
timeout /t 2 /nobreak >nul
netstat -aon | findstr :5000 >nul
if errorlevel 1 (
    echo %GREEN%✅ HomeManager encerrado com sucesso%NC%
) else (
    echo %YELLOW%⚠️  Alguns processos podem ainda estar rodando%NC%
)

echo %GREEN%✅ Processo finalizado%NC%
timeout /t 3 /nobreak >nul
