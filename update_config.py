# Configuração do Sistema de Atualização
# Substitua pela URL real do seu sistema de distribuição

# URL base onde estão hospedados os arquivos de atualização
UPDATE_SERVER_URL = "https://github.com/Cl4nyz/ElevadoresWebApp/archive/refs/heads/main.zip"

# URL para verificar a versão mais recente (pode ser um arquivo JSON simples)
VERSION_CHECK_URL = "https://api.github.com/repos/Cl4nyz/ElevadoresWebApp/releases/latest"

# Versão atual do sistema (será lida do arquivo version.txt)
CURRENT_VERSION = "1.0.0"

# Arquivos que NÃO devem ser substituídos durante a atualização
PROTECTED_FILES = [
    "postgre.py",           # Configurações de banco
    ".venv/",              # Ambiente virtual
    "*.db",                # Bancos de dados
    "config.ini",          # Configurações locais
    "*.log",               # Logs
    ".git/",               # Git (se existir)
    "version.txt"          # Arquivo de versão (será atualizado separadamente)
]

# Arquivos críticos que devem existir
CRITICAL_FILES = [
    "app.py",
    "homemanager.py", 
    "requirements.txt",
    "templates/",
    "static/"
]
