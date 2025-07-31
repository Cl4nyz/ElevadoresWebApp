# HomeManager - Executável PowerShell
# Este script inicia o servidor e abre o navegador com interface moderna

param(
    [switch]$Silent = $false
)

# Configuração de cores
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "White"
Clear-Host

# Função para escrever com cores
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    if (-not $Silent) {
        Write-Host $Text -ForegroundColor $Color
    }
}

# Função para mostrar cabeçalho
function Show-Header {
    Write-ColorText ""
    Write-ColorText "====================================================" "Cyan"
    Write-ColorText "🏢 HomeManager - Sistema de Elevadores" "Blue"
    Write-ColorText "🚀 Iniciando aplicação..." "Green"
    Write-ColorText "====================================================" "Cyan"
    Write-ColorText ""
}

# Obter diretório do projeto
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

Set-Location $ProjectDir

# Verificar se ambiente virtual existe
if (-not (Test-Path ".venv")) {
    Write-ColorText "❌ Ambiente virtual não encontrado!" "Red"
    Write-ColorText "Execute o instalador primeiro: installers\windows\install_homemanager.bat" "Yellow"
    if (-not $Silent) {
        Read-Host "Pressione Enter para sair"
    }
    exit 1
}

# Função para cleanup
function Stop-HomeManager {
    Write-ColorText "`n🛑 Encerrando HomeManager..." "Yellow"
    
    # Finalizar processos Python
    Get-Process python, pythonw -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-ColorText "✅ HomeManager encerrado com sucesso" "Green"
    exit 0
}

# Capturar Ctrl+C
[Console]::TreatControlCAsInput = $false
[Console]::CancelKeyPress += {
    Stop-HomeManager
}

try {
    # Ativar ambiente virtual
    & ".venv\Scripts\Activate.ps1"
    
    # Verificar conexão PostgreSQL
    Write-ColorText "🔍 Verificando conexão com PostgreSQL..." "Blue"
    $result = & python -c "import psycopg2; from postgre import create_pg_connection; create_pg_connection()" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorText "❌ Erro na conexão com PostgreSQL!" "Red"
        Write-ColorText "Verifique se:" "Yellow"
        Write-ColorText "  - PostgreSQL está instalado e rodando" "Yellow"
        Write-ColorText "  - Credenciais no arquivo .env estão corretas" "Yellow"
        Write-ColorText "  - Banco de dados 'db_elevadores' existe" "Yellow"
        
        # Mostrar dialog box se possível
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show(
            "Erro na conexão com PostgreSQL!`n`nVerifique se:`n- PostgreSQL está instalado e rodando`n- Credenciais no arquivo .env estão corretas`n- Banco de dados 'db_elevadores' existe",
            "HomeManager - Erro",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        
        if (-not $Silent) {
            Read-Host "Pressione Enter para sair"
        }
        exit 1
    }
    
    Write-ColorText "✅ Conexão com PostgreSQL estabelecida" "Green"
    
    # Mostrar cabeçalho
    Show-Header
    
    # Iniciar servidor em background
    Write-ColorText "🌐 Iniciando servidor..." "Green"
    $serverProcess = Start-Process python -ArgumentList "app.py" -PassThru -WindowStyle Hidden
    
    # Aguardar servidor inicializar
    Start-Sleep -Seconds 3
    
    # Verificar se servidor está rodando
    if ($serverProcess.HasExited) {
        Write-ColorText "❌ Falha ao iniciar o servidor!" "Red"
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show(
            "Falha ao iniciar o servidor HomeManager!",
            "HomeManager - Erro",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        exit 1
    }
    
    # Abrir navegador
    Write-ColorText "🌐 Abrindo HomeManager no navegador..." "Green"
    Start-Process "http://localhost:5000"
    
    Write-ColorText "✅ HomeManager iniciado com sucesso!" "Green"
    Write-ColorText "💡 Para encerrar, feche esta janela ou pressione Ctrl+C" "Cyan"
    Write-ColorText "🌐 URL: http://localhost:5000" "Yellow"
    Write-ColorText ""
    
    # Aguardar até que o processo seja encerrado
    if (-not $Silent) {
        Write-ColorText "Pressione qualquer tecla para encerrar o HomeManager..." "White"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        # Em modo silencioso, aguardar o processo do servidor
        $serverProcess.WaitForExit()
    }
    
} catch {
    Write-ColorText "❌ Erro inesperado: $($_.Exception.Message)" "Red"
    if (-not $Silent) {
        Read-Host "Pressione Enter para sair"
    }
    exit 1
} finally {
    Stop-HomeManager
}
