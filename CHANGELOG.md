# HomeManager - Changelog

## [2.0.0] - 2025-07-31

### 🚀 Nova Estrutura de Instalação

#### ✨ Adicionado
- **Sistema de Instalação Completo**: Criada estrutura organizada em `installers/`
- **Suporte Multi-plataforma**: Instaladores separados para Linux e Windows
- **Instalação como Aplicativo**: Integração nativa com menus do sistema operacional
- **Ícone Personalizado**: Uso da logo `static/images/home.png`
- **Ambiente Virtual Automático**: Criação e configuração automática do `.venv`

#### 🐧 Linux
- **`installers/linux/install_homemanager.sh`**: Instalador completo automático
- **`installers/linux/homemanager`**: Executável da aplicação
- **Suporte Universal**: Ubuntu, Debian, CentOS, Fedora, Arch, openSUSE
- **Integração Desktop**: Entrada automática no menu de aplicativos
- **Detecção Automática**: Instalação de Python3, pip, venv conforme necessário

#### 🪟 Windows  
- **`installers/windows/install_homemanager.bat`**: Instalador Batch completo
- **`installers/windows/homemanager.bat`**: Executável Batch clássico
- **`installers/windows/homemanager.ps1`**: Executável PowerShell moderno
- **Download Automático**: Baixa e instala Python automaticamente se necessário
- **Integração Sistema**: Atalhos na área de trabalho e menu iniciar

### 🔧 Funcionalidades dos Executáveis

#### 🌐 Gestão do Servidor
- **Inicialização Automática**: Inicia servidor Flask automaticamente
- **Abertura do Navegador**: Abre `http://localhost:5000` automaticamente
- **Verificação de Saúde**: Testa conexão PostgreSQL antes de iniciar
- **Cleanup Automático**: Encerra processos ao fechar aplicação

#### 🛡️ Tratamento de Erros
- **Mensagens Claras**: Feedback colorido e informativo
- **Verificações Pré-execução**: Testa ambiente virtual e dependências
- **Notificações GUI**: Caixas de diálogo no Windows (PowerShell)
- **Logs Detalhados**: Saída completa para diagnóstico

### 📁 Estrutura Reorganizada

#### ✅ Novo (2.0.0)
```
installers/
├── linux/
│   ├── install_homemanager.sh
│   ├── homemanager
│   └── README.md
├── windows/
│   ├── install_homemanager.bat
│   ├── homemanager.bat
│   ├── homemanager.ps1
│   └── README.md
└── README.md
```

#### ❌ Removido (obsoleto)
- `install_windows.bat` (raiz)
- `install_windows.ps1` (raiz)  
- `start_windows.bat` (raiz)
- `start_windows.ps1` (raiz)
- `homemanager.sh` (raiz)
- `HomeManager.bat` (raiz)
- `HomeManager.desktop` (raiz)
- `instalar_desktop.bat` (raiz)
- `instalar_desktop.sh` (raiz)
- `desinstalar_desktop.sh` (raiz)
- `INSTALACAO_DESKTOP.md`
- `README_DESKTOP.md`
- `INSTALL_WINDOWS.md`
- `README_WINDOWS.md`
- `QUICKSTART_WINDOWS.md`

### 📚 Documentação

#### 📖 Novos READMEs
- **`installers/README.md`**: Visão geral do sistema de instalação
- **`installers/linux/README.md`**: Guia completo para Linux
- **`installers/windows/README.md`**: Guia completo para Windows

#### 🎯 Conteúdo das Documentações
- **Instalação Passo-a-passo**: Guias detalhados
- **Resolução de Problemas**: Seção completa de troubleshooting
- **Configuração**: Instruções de setup PostgreSQL e .env
- **Uso**: Como iniciar e usar o aplicativo
- **Desinstalação**: Instruções de remoção

### ⚙️ Melhorias Técnicas

#### 🔗 Integração com .env
- **Variáveis Centralizadas**: Todas configurações no arquivo `.env`
- **Criação Automática**: Instaladores criam `.env` se não existir
- **Configuração Padrão**: Template pré-configurado incluído

#### 🖥️ Interface do Sistema
- **Categoria Office**: Organizado na categoria correta dos menus
- **Keywords**: Termos de busca otimizados (elevadores, gestão, contratos)
- **StartupWMClass**: Identificação correta da janela
- **Ícone Nativo**: Logo personalizada nos atalhos

#### 🚦 Controle de Processos
- **Background Processes**: Servidor roda em background
- **Signal Handling**: Captura Ctrl+C e sinais de término
- **Port Management**: Liberação automática da porta 5000
- **Process Cleanup**: Finalização limpa de todos os processos

### 🧪 Testes

#### ✅ Testado e Funcionando
- **Linux (Ubuntu 24.04)**: Instalação e execução completas
- **Detecção Python**: Funciona com Python já instalado
- **Ambiente Virtual**: Criação e ativação automáticas
- **Dependências**: Instalação via requirements.txt
- **Menu Desktop**: Aparece corretamente no menu de aplicativos
- **Executável**: Inicia servidor e abre navegador

#### 🔄 Processo de Instalação
1. **Verificação**: Python, pip, venv
2. **Instalação**: Dependências automáticas se necessário
3. **Ambiente**: Criação do `.venv` isolado
4. **Dependências**: pip install via requirements.txt
5. **Configuração**: Arquivo .env se não existir
6. **Integração**: Atalhos e menus do sistema
7. **Validação**: Teste final de funcionamento

### 🎉 Resultado Final

#### 📱 Como Aplicativo Nativo
- **Linux**: Disponível no menu de aplicativos
- **Windows**: Atalho na área de trabalho e menu iniciar
- **Ícone**: Logo personalizada do HomeManager
- **Integração**: Comporta-se como aplicativo nativo

#### 🚀 Experiência do Usuário
- **Um Clique**: Instalação automática completa
- **Abertura Simples**: Clique no ícone para usar
- **Sem Configuração**: Funciona imediatamente após instalação
- **Encerramento Limpo**: Fecha todos os processos ao sair

---

## [1.0.1] - 2025-07-31 (Anterior)

### 🔄 Sistema de Atualização
- Sistema de atualização via GitHub API
- Interface de atualização na seção "Sobre o Sistema"
- Backup automático antes de atualizações
- Verificação de versões automática

### 🏢 Sistema Base
- Sistema completo de gerenciamento de elevadores
- Módulos: Clientes, Elevadores, Contratos, Cabines, Relatórios
- Interface Bootstrap 5 responsiva
- Backend Flask com PostgreSQL

---

## 🔮 Próximas Versões

### [2.1.0] - Planejado
- **Instalador Portable**: Versão que não requer instalação
- **Auto-update**: Atualização automática dos instaladores
- **Docker Support**: Imagem Docker oficial
- **macOS Support**: Instalador para macOS

### [2.2.0] - Planejado  
- **GUI Installer**: Interface gráfica para instalação
- **Service Mode**: Execução como serviço do sistema
- **Multi-tenant**: Suporte a múltiplas empresas
- **Cloud Backup**: Backup automático na nuvem
