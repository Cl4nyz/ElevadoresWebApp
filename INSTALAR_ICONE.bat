@echo off
echo.
echo ================================================================
echo           HOMEMANAGER - CRIADOR DE ICONE DESKTOP
echo ================================================================
echo.
echo Este script ira criar um icone na sua area de trabalho para
echo executar o HomeManager de forma facil e rapida.
echo.
echo Pressione qualquer tecla para continuar ou Ctrl+C para cancelar
pause >nul

echo.
echo [1/3] Verificando arquivos necessarios...

REM Verificar se HomeManager.vbs existe
if not exist "HomeManager.vbs" (
    echo ERRO: Arquivo HomeManager.vbs nao encontrado!
    echo Certifique-se de estar na pasta correta do projeto.
    pause
    exit /b 1
)

REM Verificar se icone existe, criar se necessario
if not exist "static\images\home.ico" (
    echo [2/3] Criando icone personalizado...
    if exist ".venv\Scripts\python.exe" (
        ".venv\Scripts\python.exe" criar_icone.py
    ) else (
        echo Aviso: Icone personalizado nao foi criado
        echo O atalho usara o icone padrao
    )
) else (
    echo [2/3] Icone personalizado ja existe - OK
)

echo [3/3] Criando atalho na area de trabalho...

REM Executar script VBS para criar atalho
cscript //NoLogo criar_atalho.vbs

echo.
echo ================================================================
echo                         CONCLUIDO!
echo ================================================================
echo.
echo Verifique sua area de trabalho - deve aparecer o icone do
echo HomeManager com uma casinha.
echo.
echo Para testar:
echo 1. Clique duplo no icone
echo 2. O navegador deve abrir automaticamente
echo 3. Feche o navegador quando terminar de usar
echo.
echo O servidor para automaticamente quando nao esta sendo usado.
echo.
pause
