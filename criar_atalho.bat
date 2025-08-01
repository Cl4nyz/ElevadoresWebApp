@echo off
REM Script para criar atalho do HomeManager na área de trabalho
REM Execute este arquivo como administrador se necessário

echo Criando atalho do HomeManager na área de trabalho...
echo.

REM Obter diretório do script
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"

REM Criar atalho usando PowerShell (método mais compatível)
powershell -ExecutionPolicy Bypass -Command ^
"$WshShell = New-Object -comObject WScript.Shell; ^
$Shortcut = $WshShell.CreateShortcut('%DESKTOP%\HomeManager.lnk'); ^
$Shortcut.TargetPath = '%SCRIPT_DIR%HomeManager.vbs'; ^
$Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; ^
$Shortcut.Description = 'Sistema de Gerenciamento de Elevadores HomeManager'; ^
$Shortcut.IconLocation = '%SCRIPT_DIR%static\images\home.ico'; ^
$Shortcut.WindowStyle = 7; ^
$Shortcut.Save()"

echo.
if exist "%DESKTOP%\HomeManager.lnk" (
    echo Atalho criado com sucesso na área de trabalho!
    echo Arquivo: %DESKTOP%\HomeManager.lnk
) else (
    echo Erro ao criar atalho. Tente executar como administrador.
)
echo.
pause
