@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

REM Cores
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "NC=[0m"

echo %BLUE%🏢 HomeManager - Parando Servidor%NC%
echo %CYAN%====================================%NC%

REM Verificar se há processo rodando na porta 5000
echo %BLUE%🔍 Verificando processos na porta 5000...%NC%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    set "PID=%%a"
    if defined PID (
        echo %YELLOW%🛑 Encontrado processo PID: !PID!%NC%
        taskkill /f /pid !PID! >nul 2>&1
        if errorlevel 0 (
            echo %GREEN%✅ Processo !PID! encerrado%NC%
        ) else (
            echo %RED%❌ Erro ao encerrar processo !PID!%NC%
        )
    )
)

REM Parar todos os processos Python/pythonw relacionados
echo %BLUE%🔍 Parando processos Python...%NC%
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq app.py*" >nul 2>&1

REM Verificar se a porta está livre
timeout /t 2 /nobreak >nul
netstat -aon | findstr :5000 >nul
if errorlevel 1 (
    echo %GREEN%✅ Porta 5000 está livre%NC%
    echo %GREEN%✅ HomeManager parado com sucesso%NC%
) else (
    echo %YELLOW%⚠️  Ainda há processos na porta 5000%NC%
    echo %YELLOW%Pode ser necessário reiniciar o computador%NC%
)

echo.
echo %CYAN%Pressione qualquer tecla para fechar...%NC%
pause >nul
