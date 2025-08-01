@echo off
echo.
echo ================================================================
echo           HOMEMANAGER - CRIADOR DE ICONE DESKTOP
echo ================================================================
echo.
echo Este script ira criar um icone na sua area de trabalho para
echo executar o HomeManager de forma facil e rapida.
echo.
echo OPCOES DISPONIBILEIS:
echo 1. Criar icone apenas (se ja esta configurado)
echo 2. Configurar sistema completo + criar icone (novo computador)
echo 3. Diagnosticar problemas
echo 4. Testar sistema rapidamente
echo.
set /p escolha="Digite sua opcao (1-4): "

if "%escolha%"=="1" goto criar_icone
if "%escolha%"=="2" goto configurar_completo  
if "%escolha%"=="3" goto diagnosticar
if "%escolha%"=="4" goto testar
goto criar_icone

:configurar_completo
echo.
echo Executando configuracao completa para novo computador...
call configurar_novo_computador.bat
goto criar_icone

:diagnosticar
echo.
echo Executando diagnostico do sistema...
call diagnosticar_sistema.bat
goto fim

:testar
echo.
echo Executando teste rapido...
call testar_homemanager.bat
goto fim

:criar_icone
echo.
echo [1/3] Verificando arquivos necessarios...

REM Verificar se HomeManager.vbs existe
if not exist "HomeManager.vbs" (
    echo ERRO: Arquivo HomeManager.vbs nao encontrado!
    echo Certifique-se de estar na pasta correta do projeto.
    pause
    exit /b 1
)

REM Verificar se ambiente virtual existe
if not exist ".venv\Scripts\pythonw.exe" (
    echo ERRO: Ambiente virtual nao encontrado!
    echo.
    echo SOLUCOES:
    echo 1. Execute opcao 2 para configuracao completa
    echo 2. Ou execute: configurar_novo_computador.bat
    echo.
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

:fim
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
echo SOLUCAO DE PROBLEMAS:
echo - Se houver erro "connection refused": execute diagnosticar_sistema.bat
echo - Para configuracao completa: execute configurar_novo_computador.bat
echo - Para teste rapido: execute testar_homemanager.bat
echo - Guia detalhado: SOLUCAO_CONNECTION_REFUSED.md
echo.
echo O servidor para automaticamente quando nao esta sendo usado.
echo.
pause
