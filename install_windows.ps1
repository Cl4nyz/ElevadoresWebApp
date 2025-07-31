# HomeManager - Instalador PowerShell para Windows
Write-Host "=================================================" -ForegroundColor Green
Write-Host "   HomeManager - Instalador Automatico Windows" -ForegroundColor Green  
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Verificar Python
Write-Host "[1/6] Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python nao encontrado"
    }
} catch {
    Write-Host "ERRO: Python nao encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Python em https://python.org/downloads/" -ForegroundColor Red
    Write-Host "Lembre-se de marcar 'Add Python to PATH' durante a instalacao" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "[2/6] Criando ambiente virtual..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Ambiente virtual ja existe, pulando..." -ForegroundColor Green
} else {
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha na criacao do ambiente virtual" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Write-Host "Ambiente virtual criado com sucesso!" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/6] Ativando ambiente virtual..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha na ativacao do ambiente virtual" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "[4/6] Atualizando pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

Write-Host ""
Write-Host "[5/6] Instalando dependencias..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tentando instalacao alternativa..." -ForegroundColor Yellow
    pip install python-dotenv flask flask-cors requests reportlab psycopg2-binary
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha na instalacao das dependencias" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

Write-Host ""
Write-Host "[6/6] Criando arquivos de inicializacao..." -ForegroundColor Yellow

# Criar start_windows.ps1
@"
# HomeManager - Inicializador PowerShell
Write-Host "=================================================" -ForegroundColor Green
Write-Host "   HomeManager - Sistema de Gestao de Elevadores" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Iniciando servidor..." -ForegroundColor Yellow
Write-Host "Acesse: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
& "venv\Scripts\Activate.ps1"
python app.py
Read-Host "Pressione Enter para sair"
"@ | Out-File -FilePath "start_windows.ps1" -Encoding UTF8

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "          INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o PostgreSQL (veja arquivo config_db.txt)" -ForegroundColor White
Write-Host "2. Execute: start_windows.bat ou start_windows.ps1" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Arquivos criados:" -ForegroundColor Cyan
Write-Host "- start_windows.bat (para iniciar via CMD)" -ForegroundColor White
Write-Host "- start_windows.ps1 (para iniciar via PowerShell)" -ForegroundColor White  
Write-Host "- config_db.txt (configuracao do banco)" -ForegroundColor White
Write-Host ""
Read-Host "Pressione Enter para continuar"
