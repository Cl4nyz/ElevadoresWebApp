@echo off
echo =================================================
echo    HomeManager - Sistema de Gestao de Elevadores
echo =================================================
echo.
echo Iniciando servidor...
echo Acesse: http://localhost:5000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat
python app.py
pause
