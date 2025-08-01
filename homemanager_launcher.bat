@echo off
REM Script para iniciar o HomeManager sem terminal visível
REM Criado automaticamente

cd /d "%~dp0"

REM Verificar se o ambiente virtual existe
if not exist ".venv\Scripts\python.exe" (
    echo Ambiente virtual não encontrado. Execute setup.py primeiro.
    pause
    exit /b 1
)

REM Executar o aplicativo sem mostrar janela de console
start /min "" ".venv\Scripts\pythonw.exe" app.py

REM Fechar esta janela imediatamente
exit
