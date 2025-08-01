# HomeManager Launcher - PowerShell Script
# Este script inicia o HomeManager de forma silenciosa

param(
    [switch]$Visible = $false
)

# Definir política de execução para este script
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Obter diretório do script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

# Verificar se ambiente virtual existe
$VenvPython = Join-Path $ScriptDir ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    if ($Visible) {
        Write-Host "❌ Ambiente virtual não encontrado!" -ForegroundColor Red
        Write-Host "Execute setup.py primeiro para configurar o ambiente." -ForegroundColor Yellow
        Read-Host "Pressione Enter para sair"
    } else {
        [System.Windows.Forms.MessageBox]::Show("Ambiente virtual não encontrado!`nExecute setup.py primeiro para configurar o ambiente.", "HomeManager", "OK", "Error")
    }
    exit 1
}

# Verificar se app.py existe
$AppFile = Join-Path $ScriptDir "app.py"
if (-not (Test-Path $AppFile)) {
    if ($Visible) {
        Write-Host "❌ Arquivo app.py não encontrado!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
    } else {
        [System.Windows.Forms.MessageBox]::Show("Arquivo app.py não encontrado!", "HomeManager", "OK", "Error")
    }
    exit 1
}

try {
    # Configurar processo para executar sem janela visível
    $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
    $ProcessInfo.FileName = $VenvPython
    $ProcessInfo.Arguments = "app.py"
    $ProcessInfo.WorkingDirectory = $ScriptDir
    $ProcessInfo.UseShellExecute = $false
    $ProcessInfo.CreateNoWindow = $true
    $ProcessInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    
    # Iniciar processo
    $Process = [System.Diagnostics.Process]::Start($ProcessInfo)
    
    if ($Visible) {
        Write-Host "🚀 HomeManager iniciado com sucesso!" -ForegroundColor Green
        Write-Host "🌐 O navegador será aberto automaticamente..." -ForegroundColor Cyan
        Write-Host "Process ID: $($Process.Id)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
} catch {
    $ErrorMsg = "Erro ao iniciar HomeManager: $($_.Exception.Message)"
    if ($Visible) {
        Write-Host "❌ $ErrorMsg" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
    } else {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($ErrorMsg, "HomeManager", "OK", "Error")
    }
    exit 1
}
