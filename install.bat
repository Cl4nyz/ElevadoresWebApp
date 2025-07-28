@echo off
echo ========================================
echo   SISTEMA DE GERENCIAMENTO DE ELEVADORES
echo ========================================
echo.
echo Iniciando setup automatico...
echo.

:: Verificar se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale Python 3.8 ou superior
    pause
    exit /b 1
)

:: Instalar dependencias
echo Instalando dependencias...
pip install -r requirements.txt

if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo Dependencias instaladas com sucesso!
echo.
echo IMPORTANTE: Configure o arquivo .env com suas credenciais do PostgreSQL
echo Exemplo:
echo   PG_NAME=elevadores_db
echo   PG_USER=postgres
echo   PG_PASSWORD=sua_senha
echo   PG_HOST=localhost
echo   PG_PORT=5432
echo.
echo Pressione qualquer tecla para continuar com o setup...
pause >nul

:: Executar setup do banco
echo Configurando banco de dados...
python setup.py

echo.
echo Setup concluido! Para executar o sistema:
echo   python app.py
echo.
echo Ou execute este arquivo novamente para usar o menu interativo.
echo.
pause
