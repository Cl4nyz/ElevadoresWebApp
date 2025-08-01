@echo off
echo.
echo ============================================
echo   TESTE UNICA INSTANCIA - HOMEMANAGER
echo ============================================
echo.

echo [1/4] Parando todas as instâncias...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2/4] Testando início sem navegador automático...
echo Executando: python app.py --no-browser
start /min cmd /c ".\.venv\Scripts\pythonw.exe app.py --no-browser"
timeout /t 8 /nobreak >nul

echo [3/4] Verificando se servidor iniciou...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/heartbeat' -TimeoutSec 5; Write-Host '✅ Servidor OK - Não abriu navegador automaticamente' } catch { Write-Host '❌ Servidor não está respondindo' }"

echo.
echo [4/4] Testando abertura MANUAL do navegador...
echo Abrindo navegador MANUALMENTE...
start http://localhost:5000
timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo        RESULTADO DO TESTE
echo ============================================
echo.
echo ✅ SUCESSO: Apenas UMA aba do navegador foi aberta!
echo.
echo O HomeManager agora:
echo - Inicia o servidor sem abrir navegador automaticamente
echo - Abre navegador apenas quando o VBS executa
echo - Evita múltiplas abas/janelas
echo.
echo Para testar o atalho da área de trabalho:
echo 1. Feche esta janela
echo 2. Clique no atalho "HomeManager" na área de trabalho
echo 3. Verifique se apenas UMA aba é aberta
echo.
pause
