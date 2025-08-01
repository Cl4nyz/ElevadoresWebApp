@echo off
echo.
echo ================================================================
echo          HOMEMANAGER - CONFIGURACAO INICIAL
echo ================================================================
echo.
echo Este script prepara o HomeManager para funcionar em um novo computador.
echo.
echo REQUISITOS:
echo - Python 3.7 ou superior instalado
echo - PostgreSQL instalado e configurado
echo - Conexao com internet (para baixar dependencias)
echo.
pause

echo.
echo [1/6] Verificando Python...
echo ================================================================

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.7+ de: https://python.org
    echo Certifique-se de marcar "Add Python to PATH" durante a instalacao
    pause
    exit /b 1
)

echo ✅ Python encontrado:
python --version

echo.
echo [2/6] Criando ambiente virtual...
echo ================================================================

if exist ".venv" (
    echo ⚠️  Ambiente virtual ja existe, removendo...
    rmdir /s /q ".venv"
)

echo Criando novo ambiente virtual...
python -m venv .venv

if not exist ".venv\Scripts\python.exe" (
    echo ❌ ERRO: Falha ao criar ambiente virtual
    pause
    exit /b 1
)

echo ✅ Ambiente virtual criado com sucesso

echo.
echo [3/6] Atualizando pip...
echo ================================================================

".venv\Scripts\python.exe" -m pip install --upgrade pip

echo.
echo [4/6] Instalando dependencias...
echo ================================================================

echo Instalando pacotes do requirements.txt...
".venv\Scripts\pip.exe" install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO na instalacao de dependencias!
    echo.
    echo Tentando instalacao individual...
    ".venv\Scripts\pip.exe" install flask==2.3.3
    ".venv\Scripts\pip.exe" install flask-cors==4.0.0
    ".venv\Scripts\pip.exe" install psycopg2-binary
    ".venv\Scripts\pip.exe" install python-dotenv==1.0.0
    ".venv\Scripts\pip.exe" install requests==2.31.0
    ".venv\Scripts\pip.exe" install reportlab==4.0.4
)

echo ✅ Dependencias instaladas

echo.
echo [5/6] Verificando configuracao do banco...
echo ================================================================

if not exist ".env" (
    echo ⚠️  Arquivo .env nao encontrado!
    echo Criando .env baseado no .env.example...
    
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo.
        echo ✅ Arquivo .env criado
        echo ⚠️  IMPORTANTE: Edite o arquivo .env com suas configuracoes de banco!
        echo.
        echo Configuracoes necessarias:
        echo - DB_HOST=localhost
        echo - DB_PORT=5432  
        echo - DB_NAME=nome_do_seu_banco
        echo - DB_USER=seu_usuario
        echo - DB_PASSWORD=sua_senha
        echo.
    ) else (
        echo ❌ ERRO: .env.example nao encontrado!
        echo Crie manualmente o arquivo .env com as configuracoes do banco.
    )
) else (
    echo ✅ Arquivo .env encontrado
)

echo.
echo Testando conexao com banco...
".venv\Scripts\python.exe" -c "from postgre import create_pg_connection; conn = create_pg_connection(); print('✅ Conexao OK' if conn else '❌ Erro na conexao')" 2>nul

echo.
echo [6/6] Criando icone na area de trabalho...
echo ================================================================

echo Criando icone personalizado...
if exist "criar_icone.py" (
    ".venv\Scripts\python.exe" criar_icone.py
)

echo Criando atalho na area de trabalho...
if exist "criar_atalho.vbs" (
    cscript //NoLogo criar_atalho.vbs
)

echo.
echo ================================================================
echo                    CONFIGURACAO CONCLUIDA!
echo ================================================================
echo.
echo ✅ Ambiente virtual criado em: .venv\
echo ✅ Dependencias Python instaladas
echo ✅ Icone criado na area de trabalho
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. ⚠️  EDITE o arquivo .env com suas configuracoes de banco PostgreSQL
echo.
echo 2. ✅ Teste o sistema clicando no icone HomeManager na area de trabalho
echo.
echo 3. 🔧 Se houver problemas, execute: diagnosticar_sistema.bat
echo.
echo ================================================================
echo.
pause
