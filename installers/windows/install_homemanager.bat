@echo off
REM ============================================================================
REM HomeManager - Sistema de Gerenciamento de Elevadores
REM Instalador Completo para Windows
REM ============================================================================

setlocal enabledelayedexpansion
chcp 65001 >nul

REM Cores (usando códigos ANSI)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "NC=[0m"

echo.
echo ====================================================
echo      HomeManager - Sistema de Elevadores
echo          Instalador para Windows
echo ====================================================
echo.

REM Obter diretório do projeto (2 níveis acima do script)
set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%..") do set "PARENT_DIR=%%~fi"
for %%i in ("%PARENT_DIR%..") do set "PROJECT_DIR=%%~fi"

echo %CYAN%📁 Diretório do projeto: %PROJECT_DIR%%NC%
cd /d "%PROJECT_DIR%"

REM Verificar se Python está instalado
echo %YELLOW%🔍 Verificando Python...%NC%
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Python não encontrado!%NC%
    echo %YELLOW%📥 Baixando e instalando Python...%NC%
    
    REM Criar diretório temporário
    mkdir temp_installer 2>nul
    cd temp_installer
    
    REM Baixar Python (versão estável mais recente)
    echo %YELLOW%⬇️  Baixando Python 3.11...%NC%
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe' -OutFile 'python-installer.exe'}"
    
    if not exist python-installer.exe (
        echo %RED%❌ Falha ao baixar Python!%NC%
        echo %YELLOW%Por favor, baixe e instale Python manualmente de python.org%NC%
        pause
        exit /b 1
    )
    
    REM Instalar Python silenciosamente
    echo %YELLOW%📦 Instalando Python...%NC%
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    
    REM Aguardar instalação
    timeout /t 30 /nobreak >nul
    
    REM Limpar arquivos temporários
    cd ..
    rmdir /s /q temp_installer
    
    REM Reiniciar variáveis de ambiente
    call refreshenv.cmd 2>nul || echo %YELLOW%⚠️  Reinicie o terminal após a instalação%NC%
    
    REM Verificar novamente
    python --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo %RED%❌ Python ainda não foi encontrado!%NC%
        echo %YELLOW%Reinicie o terminal e execute o instalador novamente%NC%
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✅ Python encontrado%NC%
    python --version
)

REM Verificar pip
echo %YELLOW%🔍 Verificando pip...%NC%
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ pip não encontrado!%NC%
    echo %YELLOW%📦 Instalando pip...%NC%
    python -m ensurepip --upgrade
) else (
    echo %GREEN%✅ pip encontrado%NC%
)

REM Criar ambiente virtual
echo %YELLOW%🔧 Criando ambiente virtual...%NC%
if exist ".venv" (
    echo %YELLOW%⚠️  Ambiente virtual já existe. Removendo...%NC%
    rmdir /s /q .venv
)

python -m venv .venv
if %errorlevel% neq 0 (
    echo %RED%❌ Falha ao criar ambiente virtual!%NC%
    pause
    exit /b 1
)
echo %GREEN%✅ Ambiente virtual criado%NC%

REM Ativar ambiente virtual e instalar dependências
echo %YELLOW%📦 Instalando dependências...%NC%
call .venv\Scripts\activate.bat

REM Atualizar pip
python -m pip install --upgrade pip

REM Instalar dependências
if exist "requirements.txt" (
    pip install -r requirements.txt
    if !errorlevel! neq 0 (
        echo %RED%❌ Falha ao instalar dependências!%NC%
        pause
        exit /b 1
    )
    echo %GREEN%✅ Dependências instaladas%NC%
) else (
    echo %RED%❌ Arquivo requirements.txt não encontrado!%NC%
    pause
    exit /b 1
)

REM Verificar arquivo .env
if not exist ".env" (
    echo %YELLOW%⚠️  Arquivo .env não encontrado. Criando...%NC%
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo %YELLOW%📝 Configure o arquivo .env com suas credenciais do PostgreSQL%NC%
    ) else (
        (
            echo PG_NAME=db_elevadores
            echo PG_USER=postgres
            echo PG_PASSWORD=sua_senha_aqui
            echo PG_HOST=localhost
            echo PG_PORT=5432
        ) > .env
        echo %YELLOW%📝 Arquivo .env criado. Configure suas credenciais do PostgreSQL%NC%
    )
)

REM Criar atalho na área de trabalho
echo %YELLOW%🖥️  Criando atalho na área de trabalho...%NC%
set "DESKTOP_PATH=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP_PATH%\HomeManager.lnk"
set "TARGET_PATH=%PROJECT_DIR%\installers\windows\homemanager.bat"
set "ICON_PATH=%PROJECT_DIR%\static\images\home.png"

REM Usar PowerShell para criar atalho
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%TARGET_PATH%'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.IconLocation = '%ICON_PATH%'; $Shortcut.Description = 'HomeManager - Sistema de Elevadores'; $Shortcut.Save()}"

if exist "%SHORTCUT_PATH%" (
    echo %GREEN%✅ Atalho criado na área de trabalho%NC%
) else (
    echo %YELLOW%⚠️  Não foi possível criar atalho na área de trabalho%NC%
)

REM Criar executável
echo %YELLOW%⚙️  Criando executável...%NC%
(
echo @echo off
echo REM HomeManager - Executável Windows
echo REM Este script inicia o servidor e abre o navegador
echo.
echo setlocal enabledelayedexpansion
echo chcp 65001 ^>nul
echo.
echo REM Cores
echo set "RED=[31m"
echo set "GREEN=[32m"
echo set "YELLOW=[33m"
echo set "BLUE=[34m"
echo set "CYAN=[36m"
echo set "NC=[0m"
echo.
echo REM Obter diretório do projeto
echo set "SCRIPT_DIR=%%~dp0"
echo for %%%%i in ^("%%SCRIPT_DIR%%.."\) do set "PARENT_DIR=%%%%~fi"
echo for %%%%i in ^("%%PARENT_DIR%%.."\) do set "PROJECT_DIR=%%%%~fi"
echo.
echo cd /d "%%PROJECT_DIR%%"
echo.
echo REM Verificar se ambiente virtual existe
echo if not exist ".venv" ^(
echo     echo %%RED%%❌ Ambiente virtual não encontrado!%%NC%%
echo     echo %%YELLOW%%Execute o instalador primeiro: installers\windows\install_homemanager.bat%%NC%%
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM Ativar ambiente virtual
echo call .venv\Scripts\activate.bat
echo.
echo REM Verificar conexão PostgreSQL
echo echo %%BLUE%%🔍 Verificando conexão com PostgreSQL...%%NC%%
echo python -c "import psycopg2; from postgre import create_pg_connection; create_pg_connection(^)" ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo %%RED%%❌ Erro na conexão com PostgreSQL!%%NC%%
echo     echo %%YELLOW%%Verifique se:%%NC%%
echo     echo %%YELLOW%%  - PostgreSQL está instalado e rodando%%NC%%
echo     echo %%YELLOW%%  - Credenciais no arquivo .env estão corretas%%NC%%
echo     echo %%YELLOW%%  - Banco de dados 'db_elevadores' existe%%NC%%
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo %%GREEN%%✅ Conexão com PostgreSQL estabelecida%%NC%%
echo.
echo REM Cabeçalho
echo echo.
echo echo ====================================================
echo echo %%BLUE%%🏢 HomeManager - Sistema de Elevadores%%NC%%
echo echo %%CYAN%%🚀 Iniciando aplicação...%%NC%%
echo echo ====================================================
echo.
echo REM Iniciar servidor
echo echo %%GREEN%%🌐 Iniciando servidor...%%NC%%
echo start /b python app.py
echo.
echo REM Aguardar servidor inicializar
echo timeout /t 3 /nobreak ^>nul
echo.
echo REM Abrir navegador
echo echo %%GREEN%%🌐 Abrindo HomeManager no navegador...%%NC%%
echo start http://localhost:5000
echo.
echo echo %%GREEN%%✅ HomeManager iniciado com sucesso!%%NC%%
echo echo %%CYAN%%💡 Para encerrar, feche esta janela%%NC%%
echo echo %%YELLOW%%🌐 URL: http://localhost:5000%%NC%%
echo.
echo REM Manter janela aberta
echo echo Pressione qualquer tecla para encerrar o HomeManager...
echo pause ^>nul
echo.
echo REM Finalizar processos Python
echo taskkill /f /im python.exe ^>nul 2^>^&1
echo taskkill /f /im pythonw.exe ^>nul 2^>^&1
echo echo %%GREEN%%✅ HomeManager encerrado%%NC%%
) > "%PROJECT_DIR%\installers\windows\homemanager.bat"

echo %GREEN%✅ Executável criado%NC%

REM Adicionar ao menu iniciar (opcional)
echo %YELLOW%📱 Criando entrada no menu iniciar...%NC%
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
if not exist "%START_MENU%" mkdir "%START_MENU%" 2>nul

powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU%\HomeManager.lnk'); $Shortcut.TargetPath = '%TARGET_PATH%'; $Shortcut.WorkingDirectory = '%PROJECT_DIR%'; $Shortcut.IconLocation = '%ICON_PATH%'; $Shortcut.Description = 'HomeManager - Sistema de Elevadores'; $Shortcut.Save()}" >nul 2>&1

REM Sucesso
echo.
echo ====================================================
echo %GREEN%🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!%NC%
echo ====================================================
echo %CYAN%📱 O HomeManager foi instalado como aplicativo%NC%
echo %CYAN%🖥️  Atalho criado na área de trabalho%NC%
echo %CYAN%📱 Disponível no menu iniciar%NC%
echo %CYAN%🖱️  Ou execute: %TARGET_PATH%%NC%
echo.
echo %YELLOW%⚠️  IMPORTANTE:%NC%
echo %YELLOW%  - Configure o arquivo .env com suas credenciais do PostgreSQL%NC%
echo %YELLOW%  - Certifique-se de que o PostgreSQL está instalado e rodando%NC%
echo %YELLOW%  - Crie o banco de dados 'db_elevadores' se necessário%NC%
echo.
echo %GREEN%✅ Tudo pronto! Bom uso do HomeManager!%NC%
echo.

pause
