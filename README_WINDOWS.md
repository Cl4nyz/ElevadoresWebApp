# 🪟 HomeManager - Sistema para Windows

## 🚀 Instalação Rápida (3 Passos)

### 1️⃣ **Instale o Python**
- 📥 Baixe em: https://python.org/downloads/
- ⚠️ **CRUCIAL**: Marque "**Add Python to PATH**" durante a instalação
- ✅ Teste: Abra CMD e digite `python --version`

### 2️⃣ **Instale o PostgreSQL**  
- 📥 Baixe em: https://www.postgresql.org/download/windows/
- 📝 Anote a senha do usuário `postgres`
- 🔧 Configuração padrão (porta 5432) está ok

### 3️⃣ **Execute o Instalador**
```cmd
# Método 1: CMD (Recomendado)
install_windows.bat

# Método 2: PowerShell  
install_windows.ps1
```

## 🗃️ Configuração do Banco (5 minutos)

### Criar Banco de Dados
1. **Abra o pgAdmin** (vem com PostgreSQL)
2. **Conecte** com usuário `postgres` e sua senha
3. **Clique direito** em "Databases" → "Create" → "Database"
4. **Nome**: `elevadores`
5. **Salve**

### Importar Tabelas
1. **Clique direito** no banco "elevadores" → "Query Tool"
2. **Abra** o arquivo `create.txt` no Bloco de Notas
3. **Copie tudo** e cole na Query Tool
4. **Execute** (F5 ou botão ▶️)

## ▶️ Executar o Sistema

### Método Automático
```cmd
# Duplo clique em:
start_windows.bat
```

### Método Manual
```cmd
# Ative o ambiente virtual
venv\Scripts\activate

# Execute
python app.py
```

## 🌐 Acessar

Após iniciar, acesse: **http://localhost:5000**

## 🔧 Problemas Comuns

| Erro | Solução |
|------|---------|
| `'python' não é reconhecido` | Reinstale Python marcando "Add to PATH" |
| `psycopg2 não instala` | Execute: `pip install psycopg2-binary` |
| `Conexão com banco falha` | Verifique se PostgreSQL está rodando |
| `Porta 5000 em uso` | Edite `app.py` e mude a porta |

## 📁 Estrutura

```
ElevadoresWebApp/
├── install_windows.bat    # 🔧 Instalador CMD
├── install_windows.ps1    # 🔧 Instalador PowerShell  
├── start_windows.bat      # ▶️ Inicializador CMD
├── start_windows.ps1      # ▶️ Inicializador PowerShell
├── app.py                 # 🐍 Aplicação principal
├── requirements.txt       # 📦 Dependências
├── create.txt            # 🗃️ Script do banco
└── README_WINDOWS.md     # 📖 Este arquivo
```

## ✨ Funcionalidades

- 👥 **Gestão de Clientes** com endereços múltiplos
- 📄 **Controle de Contratos** com datas
- 🏢 **Configuração de Elevadores** completa
- 📅 **Calendário** de entregas visual
- 📊 **Relatórios PDF** profissionais
- 🌐 **Interface responsiva** moderna

## 📞 Suporte Rápido

### ❌ Python não encontrado
```cmd
# Teste alternativo:
py --version

# Se funcionar, use 'py':
py -m venv venv
py app.py
```

### ❌ Erro de dependências
```cmd
# Instalação alternativa:
pip install psycopg2-binary flask flask-cors python-dotenv requests reportlab
```

### ❌ PostgreSQL não conecta
1. Verifique se o serviço está rodando (Serviços do Windows)
2. Confirme credenciais no arquivo `postgre.py`
3. Teste conexão no pgAdmin

---

## 🎯 **Comandos de Emergência**

```cmd
# Reinstalar tudo
rmdir /s venv
install_windows.bat

# Verificar instalação
python --version
pip list
```

**🆘 Ajuda Extra**: Consulte `INSTALL_WINDOWS.md` para guia detalhado!

---

**Sistema HomeManager © 2025**  
*Gestão Profissional de Elevadores* 🏢✨
