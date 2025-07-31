@echo off
title Instalador HomeManager - Sistema de Elevadores
color 0B

echo ====================================================
echo   Instalador HomeManager - Sistema de Elevadores
echo ====================================================
echo.

REM Obter diretório atual
set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"

echo 🔧 Configurando HomeManager como aplicativo...
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python nao encontrado!
    echo 💡 Instale o Python em: https://python.org
    echo    Certifique-se de marcar "Add Python to PATH"
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Instalar dependências se necessário
echo 🔍 Verificando dependencias...
python -c "import flask, flask_cors, psycopg2, reportlab" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Instalando dependencias necessarias...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependencias!
        echo 💡 Execute manualmente: pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ✅ Dependencias ja instaladas
)

echo.
echo 📋 Opcoes de instalacao:
echo.
echo 1. Criar atalho na Area de Trabalho
echo 2. Adicionar ao Menu Iniciar
echo 3. Ambos
echo 4. Apenas testar (nao instalar)
echo.
set /p "opcao=Escolha uma opcao (1-4): "

if "%opcao%"=="1" goto desktop
if "%opcao%"=="2" goto startmenu  
if "%opcao%"=="3" goto both
if "%opcao%"=="4" goto test
goto invalid

:desktop
echo.
echo 🖥️  Criando atalho na Area de Trabalho...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\HomeManager.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%HomeManager.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%static\images\home.png'; $Shortcut.Description = 'Sistema de Gerenciamento de Elevadores'; $Shortcut.Save()"
echo ✅ Atalho criado na Area de Trabalho
goto success

:startmenu
echo.
echo 📱 Adicionando ao Menu Iniciar...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager\HomeManager.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%HomeManager.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%static\images\home.png'; $Shortcut.Description = 'Sistema de Gerenciamento de Elevadores'; $Shortcut.Save()"
echo ✅ Adicionado ao Menu Iniciar
goto success

:both
echo.
echo 🖥️  Criando atalho na Area de Trabalho...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\HomeManager.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%HomeManager.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%static\images\home.png'; $Shortcut.Description = 'Sistema de Gerenciamento de Elevadores'; $Shortcut.Save()"
echo ✅ Atalho criado na Area de Trabalho

echo 📱 Adicionando ao Menu Iniciar...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\HomeManager\HomeManager.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%HomeManager.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%static\images\home.png'; $Shortcut.Description = 'Sistema de Gerenciamento de Elevadores'; $Shortcut.Save()"
echo ✅ Adicionado ao Menu Iniciar
goto success

:test
echo.
echo 🧪 Testando HomeManager...
echo 💡 Pressione Ctrl+C para parar o teste
timeout /t 3
python homemanager.py
goto end

:invalid
echo.
echo ❌ Opcao invalida! Escolha entre 1-4.
pause
goto end

:success
echo.
echo 🎉 Instalacao concluida com sucesso!
echo.
echo 📱 Como usar:
echo    • Clique no atalho na Area de Trabalho (se criado)
echo    • Pesquise "HomeManager" no Menu Iniciar
echo    • Execute diretamente: %INSTALL_DIR%HomeManager.bat
echo.
echo 💡 Dicas:
echo    • O aplicativo sera aberto no navegador padrao
echo    • Para desinstalar, delete os atalhos criados
echo    • Para atualizar o sistema, use a opcao no menu 'Sobre o Sistema'
echo.
echo 🚀 HomeManager esta pronto para usar!
echo.

:end
pause
