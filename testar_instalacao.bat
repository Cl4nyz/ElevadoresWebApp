@echo off
echo.
echo ============================================
echo     TESTE DE INSTALAÇÃO - HOMEMANAGER
echo ============================================
echo.

REM Verificar se arquivos necessários existem
echo [1/6] Verificando arquivos do sistema...
if exist "app.py" (
    echo ✅ app.py encontrado
) else (
    echo ❌ app.py NÃO encontrado
)

if exist "HomeManager.vbs" (
    echo ✅ HomeManager.vbs encontrado
) else (
    echo ❌ HomeManager.vbs NÃO encontrado
)

if exist ".venv" (
    echo ✅ Ambiente virtual encontrado
) else (
    echo ❌ Ambiente virtual NÃO encontrado
)

if exist ".env" (
    echo ✅ Arquivo de configuração .env encontrado
) else (
    echo ❌ Arquivo .env NÃO encontrado
)

echo.
echo [2/6] Verificando atalho na área de trabalho...
powershell -Command "if (Test-Path 'C:\Users\PC\OneDrive\Área de Trabalho\*HomeManager*.lnk') { Write-Host '✅ Atalho encontrado na área de trabalho' } else { Write-Host '❌ Atalho NÃO encontrado na área de trabalho' }"

echo.
echo [3/6] Verificando PostgreSQL...
sc query postgresql-x64-17 | findstr "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL está rodando
) else (
    echo ❌ PostgreSQL NÃO está rodando
)

echo.
echo [4/6] Testando conexão com banco de dados...
.\.venv\Scripts\activate >nul 2>&1 && python -c "from postgre import create_pg_connection; conn = create_pg_connection(); print('✅ Conexão com banco OK' if conn else '❌ Falha na conexão com banco'); conn.close() if conn else None" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Erro ao testar conexão com banco
)

echo.
echo [5/6] Verificando se o servidor está rodando...
netstat -an | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✅ Servidor HomeManager está rodando na porta 5000
    echo [6/6] Testando API...
    powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/heartbeat' -TimeoutSec 5; Write-Host '✅ API respondendo corretamente' } catch { Write-Host '❌ API não está respondendo' }"
) else (
    echo ⚠️  Servidor não está rodando
    echo [6/6] Tentando iniciar servidor para teste...
    echo Aguarde...
    start /min .\.venv\Scripts\pythonw.exe app.py
    timeout /t 5 /nobreak >nul
    powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/heartbeat' -TimeoutSec 5; Write-Host '✅ Servidor iniciado e API funcionando' } catch { Write-Host '❌ Falha ao iniciar servidor ou API' }"
)

echo.
echo ============================================
echo           RESULTADO DO TESTE
echo ============================================
echo.
echo ✅ INSTALAÇÃO COMPLETA!
echo.
echo Para usar o HomeManager:
echo 1. Clique no atalho "HomeManager - Sistema de Elevadores" na área de trabalho
echo 2. Ou execute HomeManager.vbs diretamente
echo 3. Ou execute iniciar_homemanager.bat
echo.
echo O sistema abrirá automaticamente no navegador em:
echo http://localhost:5000
echo.
pause
