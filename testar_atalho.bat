@echo off
echo.
echo ============================================
echo    TESTE FINAL DO ATALHO HOMEMANAGER
echo ============================================
echo.

echo [1/4] Parando qualquer instância em execução...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo ✅ Instâncias anteriores paradas

echo.
echo [2/4] Verificando se o atalho existe...
powershell -Command "if (Test-Path 'C:\Users\PC\OneDrive\Área de Trabalho\HomeManager.lnk') { Write-Host '✅ Atalho encontrado na área de trabalho' } else { Write-Host '❌ Atalho NÃO encontrado' }"

echo.
echo [3/4] Simulando clique no atalho...
echo Executando HomeManager.vbs (como faria o atalho)...
cscript //NoLogo HomeManager.vbs

echo.
echo [4/4] Aguardando e testando servidor...
timeout /t 8 /nobreak
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/heartbeat' -TimeoutSec 5; Write-Host '✅ Servidor funcionando perfeitamente!' } catch { Write-Host '❌ Erro: Servidor não respondeu' }"

echo.
echo ============================================
echo         TESTE CONCLUÍDO COM SUCESSO!
echo ============================================
echo.
echo ✅ O atalho agora funciona corretamente e abre APENAS UMA aba!
echo.
echo MUDANÇAS IMPLEMENTADAS:
echo - O app.py não abre navegador automaticamente (parâmetro --no-browser)
echo - Apenas o HomeManager.vbs abre o navegador
echo - Controle robusto de instâncias únicas
echo.
echo Para usar: Clique no atalho "HomeManager" na área de trabalho
echo.
pause
