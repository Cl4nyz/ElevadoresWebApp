@echo off
echo.
echo ================================================================
echo               HOMEMANAGER - TESTE RAPIDO
echo ================================================================
echo.
echo Este script faz um teste rapido para verificar se o HomeManager
echo esta funcionando corretamente.
echo.

echo [1/4] Testando ambiente Python...
if exist ".venv\Scripts\python.exe" (
    echo ✅ Ambiente virtual OK
    ".venv\Scripts\python.exe" --version
) else (
    echo ❌ Ambiente virtual nao encontrado
    echo Execute: configurar_novo_computador.bat
    pause
    exit /b 1
)

echo.
echo [2/4] Testando dependencias...
".venv\Scripts\python.exe" -c "import flask, psycopg2, flask_cors, requests; print('✅ Todas as dependencias OK')" 2>nul || (
    echo ❌ Problemas com dependencias
    echo Execute: .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo [3/4] Testando banco de dados...
".venv\Scripts\python.exe" -c "from postgre import create_pg_connection; conn = create_pg_connection(); print('✅ Banco OK' if conn else '❌ Erro no banco')" 2>nul || (
    echo ❌ Erro na conexao com banco
    echo Verifique arquivo .env e configuracoes PostgreSQL
)

echo.
echo [4/4] Iniciando teste do servidor...
echo ================================================================
echo.
echo O servidor sera iniciado por 15 segundos para teste.
echo Uma janela do navegador devera abrir automaticamente.
echo.
echo Pressione Ctrl+C se houver algum erro.
echo.
pause

echo Iniciando servidor...
start /min "HomeManager Test" cmd /c "cd /d "%CD%" && .venv\Scripts\python.exe app.py"

echo Aguardando 5 segundos para o servidor inicializar...
timeout /t 5 /nobreak >nul

echo Testando conexao HTTP...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000' -TimeoutSec 10; Write-Host '✅ Servidor OK - Status:' $response.StatusCode; start 'http://localhost:5000' } catch { Write-Host '❌ Erro:' $_.Exception.Message }"

echo.
echo Mantenha o servidor rodando por mais 10 segundos para testar...
echo Feche a aba do navegador quando terminar de testar.
echo.
timeout /t 10 /nobreak >nul

echo Parando servidor de teste...
taskkill /F /IM python.exe 2>nul >nul

echo.
echo ================================================================
echo                        TESTE CONCLUIDO
echo ================================================================
echo.
echo Se o navegador abriu e o sistema carregou:
echo ✅ SISTEMA FUNCIONANDO CORRETAMENTE!
echo.
echo Se houve erro:
echo ❌ Execute: diagnosticar_sistema.bat
echo ❌ Ou veja: SOLUCAO_CONNECTION_REFUSED.md
echo.
pause
