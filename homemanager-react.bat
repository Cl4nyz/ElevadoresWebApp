@echo off
title HomeManager - Sistema de Elevadores
cd /d "C:\Users\supre\OneDrive\Documentos\Coding\ElevadoresWebApp"
echo.
echo ========================================
echo   HomeManager - Sistema de Elevadores
echo ========================================
echo.
echo Iniciando servidor...
echo.

REM Start the development server in background
start /b npm run dev

REM Wait a few seconds for the server to start
echo Aguardando servidor inicializar...
timeout /t 8 /nobreak >nul

REM Open browser automatically
echo Abrindo navegador...
start http://localhost:5173

echo.
echo ========================================
echo   Servidor rodando!
echo   Navegador aberto automaticamente
echo   Feche esta janela para parar o servidor
echo ========================================