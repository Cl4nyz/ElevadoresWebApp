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
