@echo off
echo =================================================
echo    HomeManager - Instalador Automatico Windows
echo =================================================
echo.

echo [1/6] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale o Python em https://python.org/downloads/
    echo Lembre-se de marcar "Add Python to PATH" durante a instalacao
    pause
    exit /b 1
)
echo Python encontrado: 
python --version

echo.
echo [2/6] Criando ambiente virtual...
if exist venv (
    echo Ambiente virtual ja existe, pulando...
) else (
    python -m venv venv
    if errorlevel 1 (
        echo ERRO: Falha na criacao do ambiente virtual
        pause
        exit /b 1
    )
    echo Ambiente virtual criado com sucesso!
)

echo.
echo [3/6] Ativando ambiente virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERRO: Falha na ativacao do ambiente virtual
    pause
    exit /b 1
)

echo.
echo [4/6] Atualizando pip...
python -m pip install --upgrade pip

echo.
echo [5/6] Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERRO: Falha na instalacao das dependencias
    echo Tentando instalacao alternativa...
    pip install python-dotenv flask flask-cors requests reportlab psycopg2-binary
    if errorlevel 1 (
        echo ERRO: Falha na instalacao das dependencias
        pause
        exit /b 1
    )
)

echo.
echo [6/6] Criando arquivos de inicializacao...

:: Criar arquivo start_windows.bat
echo @echo off > start_windows.bat
echo echo ================================================= >> start_windows.bat
echo echo    HomeManager - Sistema de Gestao de Elevadores >> start_windows.bat
echo echo ================================================= >> start_windows.bat
echo echo. >> start_windows.bat
echo echo Iniciando servidor... >> start_windows.bat
echo echo Acesse: http://localhost:5000 >> start_windows.bat
echo echo. >> start_windows.bat
echo echo Pressione Ctrl+C para parar o servidor >> start_windows.bat
echo echo. >> start_windows.bat
echo cd /d "%~dp0" >> start_windows.bat
echo call venv\Scripts\activate.bat >> start_windows.bat
echo python app.py >> start_windows.bat
echo pause >> start_windows.bat

:: Criar arquivo de configuracao do banco
echo # Configuracao do PostgreSQL > config_db.txt
echo Host: localhost >> config_db.txt
echo Porta: 5432 >> config_db.txt
echo Usuario: postgres >> config_db.txt
echo Senha: postgres >> config_db.txt
echo Database: elevadores >> config_db.txt
echo. >> config_db.txt
echo IMPORTANTE: >> config_db.txt
echo 1. Certifique-se de que o PostgreSQL esta instalado e rodando >> config_db.txt
echo 2. Crie o banco 'elevadores' no pgAdmin >> config_db.txt
echo 3. Execute o conteudo do arquivo 'create.txt' no banco >> config_db.txt
echo 4. Se necessario, edite as credenciais no arquivo 'postgre.py' >> config_db.txt

echo.
echo =================================================
echo           INSTALACAO CONCLUIDA COM SUCESSO!
echo =================================================
echo.
echo Proximos passos:
echo 1. Configure o PostgreSQL (veja arquivo config_db.txt)
echo 2. Execute: start_windows.bat
echo 3. Acesse: http://localhost:5000
echo.
echo Arquivos criados:
echo - start_windows.bat (para iniciar o sistema)
echo - config_db.txt (configuracao do banco)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul
