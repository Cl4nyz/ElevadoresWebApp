@echo off
echo.
echo ================================================================
echo               HOMEMANAGER - DIAGNOSTICO DO SISTEMA
echo ================================================================
echo.
echo Este script vai verificar se tudo esta configurado corretamente
echo para executar o HomeManager em outro computador.
echo.
pause

echo.
echo [ETAPA 1] Verificando estrutura de arquivos...
echo ================================================================

REM Verificar arquivos essenciais
set "ERRO=0"

if not exist "HomeManager.vbs" (
    echo ❌ ERRO: HomeManager.vbs nao encontrado
    set "ERRO=1"
) else (
    echo ✅ HomeManager.vbs encontrado
)

if not exist "app.py" (
    echo ❌ ERRO: app.py nao encontrado
    set "ERRO=1"
) else (
    echo ✅ app.py encontrado
)

if not exist "requirements.txt" (
    echo ❌ ERRO: requirements.txt nao encontrado
    set "ERRO=1"
) else (
    echo ✅ requirements.txt encontrado
)

if not exist ".venv" (
    echo ❌ ERRO: Ambiente virtual .venv nao encontrado
    echo    Execute: python -m venv .venv
    set "ERRO=1"
) else (
    echo ✅ Ambiente virtual .venv encontrado
)

if not exist ".venv\Scripts\pythonw.exe" (
    echo ❌ ERRO: pythonw.exe nao encontrado no ambiente virtual
    set "ERRO=1"
) else (
    echo ✅ pythonw.exe encontrado
)

echo.
echo [ETAPA 2] Verificando dependencias Python...
echo ================================================================

if exist ".venv\Scripts\python.exe" (
    echo Verificando pacotes instalados...
    ".venv\Scripts\python.exe" -c "import flask; print('✅ Flask instalado -', flask.__version__)" 2>nul || echo ❌ Flask NAO instalado
    ".venv\Scripts\python.exe" -c "import psycopg2; print('✅ psycopg2 instalado')" 2>nul || echo ❌ psycopg2 NAO instalado  
    ".venv\Scripts\python.exe" -c "import flask_cors; print('✅ flask-cors instalado')" 2>nul || echo ❌ flask-cors NAO instalado
    ".venv\Scripts\python.exe" -c "import requests; print('✅ requests instalado')" 2>nul || echo ❌ requests NAO instalado
) else (
    echo ❌ Python nao encontrado no ambiente virtual
    set "ERRO=1"
)

echo.
echo [ETAPA 3] Testando conexao com banco de dados...
echo ================================================================

if exist ".venv\Scripts\python.exe" (
    echo Testando conexao PostgreSQL...
    ".venv\Scripts\python.exe" -c "from postgre import create_pg_connection; conn = create_pg_connection(); print('✅ Conexao com banco OK' if conn else '❌ Erro na conexao com banco')" 2>nul || echo ❌ Erro ao testar conexao com banco
) else (
    echo ❌ Nao foi possivel testar conexao com banco
    set "ERRO=1"
)

echo.
echo [ETAPA 4] Verificando porta 5000...
echo ================================================================

netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Porta 5000 esta sendo usada por outro processo
    echo    Processos usando porta 5000:
    netstat -ano | findstr ":5000"
) else (
    echo ✅ Porta 5000 disponivel
)

echo.
echo [ETAPA 5] Testando execucao manual...
echo ================================================================

if exist ".venv\Scripts\python.exe" (
    echo Tentando iniciar servidor manualmente por 10 segundos...
    echo Pressione Ctrl+C se aparecer erro ou trave...
    
    timeout /t 3 /nobreak >nul
    
    start /min "HomeManager Test" cmd /c "cd /d "%CD%" && .venv\Scripts\python.exe app.py"
    
    echo Aguardando servidor iniciar...
    timeout /t 5 /nobreak >nul
    
    echo Testando conexao HTTP...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000' -TimeoutSec 5; Write-Host '✅ Servidor respondeu com status:' $response.StatusCode } catch { Write-Host '❌ Erro ao conectar:' $_.Exception.Message }"
    
    echo.
    echo Parando servidor de teste...
    taskkill /F /IM python.exe 2>nul
) else (
    echo ❌ Nao foi possivel testar execucao
    set "ERRO=1"
)

echo.
echo [ETAPA 6] Verificando logs...
echo ================================================================

if exist "homemanager.log" (
    echo ✅ Arquivo de log encontrado
    echo Ultimas 5 linhas do log:
    powershell -Command "Get-Content 'homemanager.log' -Tail 5"
) else (
    echo ⚠️  Arquivo de log nao encontrado (normal na primeira execucao)
)

echo.
echo ================================================================
echo                          RESULTADO
echo ================================================================

if "%ERRO%"=="1" (
    echo.
    echo ❌ PROBLEMAS ENCONTRADOS!
    echo.
    echo SOLUCOES SUGERIDAS:
    echo 1. Execute: setup.py para recriar ambiente virtual
    echo 2. Instale dependencias: .venv\Scripts\pip install -r requirements.txt
    echo 3. Configure banco PostgreSQL
    echo 4. Verifique firewall/antivirus bloqueando porta 5000
    echo.
) else (
    echo.
    echo ✅ SISTEMA PARECE ESTAR CONFIGURADO CORRETAMENTE!
    echo.
    echo Se ainda houver erro "connection refused":
    echo 1. Verifique se antivirus esta bloqueando
    echo 2. Execute como administrador
    echo 3. Verifique configuracoes de firewall
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
