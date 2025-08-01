# 🚨 Guia de Solução: Connection Refused / Failed to Fetch

## 🔍 **Diagnóstico do Problema**

O erro "connection refused" ou "failed to fetch" indica que o servidor Flask não está conseguindo iniciar ou não está acessível na porta 5000.

---

## 🛠️ **Soluções Por Etapas**

### **ETAPA 1: Diagnóstico Automático**

1. **Execute o diagnóstico automático**:
   ```
   diagnosticar_sistema.bat
   ```

2. **Verifique os logs**:
   - `homemanager.log` - Logs do servidor Flask
   - `homemanager_launcher.log` - Logs do launcher VBS

### **ETAPA 2: Verificar Configurações Básicas**

#### **2.1 Ambiente Virtual**
```cmd
# Verificar se existe
dir .venv\Scripts\

# Se não existir, recriar
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

#### **2.2 Dependências**
```cmd
# Testar individualmente
.venv\Scripts\python -c "import flask; print('Flask OK')"
.venv\Scripts\python -c "import psycopg2; print('PostgreSQL OK')"
.venv\Scripts\python -c "import flask_cors; print('CORS OK')"
```

#### **2.3 Banco de Dados**
```cmd
# Testar conexão
.venv\Scripts\python -c "from postgre import create_pg_connection; print('DB OK' if create_pg_connection() else 'DB ERRO')"
```

### **ETAPA 3: Verificar Porta 5000**

#### **3.1 Verificar se a porta está em uso**
```cmd
netstat -ano | findstr :5000
```

#### **3.2 Se estiver em uso**
```cmd
# Ver qual processo está usando
netstat -ano | findstr :5000

# Parar processo (substitua PID pelo número mostrado)
taskkill /PID 1234 /F
```

### **ETAPA 4: Testar Execução Manual**

```cmd
# Executar servidor em modo debug
.venv\Scripts\python app.py
```

**Observe as mensagens**:
- ✅ `Running on http://127.0.0.1:5000` = OK
- ❌ Erros de import = problema nas dependências
- ❌ Erro de banco = problema na configuração PostgreSQL

### **ETAPA 5: Problemas de Firewall/Antivírus**

#### **5.1 Windows Defender**
1. Abrir "Segurança do Windows"
2. "Firewall e proteção de rede"
3. "Permitir um aplicativo pelo firewall"
4. Adicionar `python.exe` e `pythonw.exe`

#### **5.2 Antivírus de Terceiros**
- Adicionar pasta do projeto às exceções
- Permitir `python.exe` e `pythonw.exe`
- Desativar temporariamente para testar

### **ETAPA 6: Executar como Administrador**

1. **Clique com botão direito** no ícone HomeManager
2. **"Executar como administrador"**
3. **Ou execute**:
   ```cmd
   # Como administrador
   .venv\Scripts\python app.py
   ```

---

## 🔧 **Soluções Específicas por Erro**

### **Erro: "ModuleNotFoundError"**
```cmd
# Reinstalar dependências
.venv\Scripts\pip install --force-reinstall -r requirements.txt
```

### **Erro: "psycopg2 not found"**  
```cmd
# Instalar versão binária
.venv\Scripts\pip install psycopg2-binary
```

### **Erro: "Permission denied"**
```cmd
# Executar como administrador ou alterar permissões da pasta
icacls "." /grant %USERNAME%:F /T
```

### **Erro: "Address already in use"**
```cmd
# Parar todos os processos Python
taskkill /IM python.exe /F
taskkill /IM pythonw.exe /F
```

---

## ⚡ **Solução Rápida (Reset Completo)**

Se nada funcionar, execute esta sequência:

```cmd
# 1. Parar todos os processos
taskkill /IM python.exe /F
taskkill /IM pythonw.exe /F

# 2. Recriar ambiente
rmdir /s /q .venv
python -m venv .venv

# 3. Reinstalar dependências  
.venv\Scripts\pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt

# 4. Testar
.venv\Scripts\python app.py
```

---

## 📋 **Checklist de Verificação**

Antes de reportar problemas, verifique:

- [ ] Python 3.7+ instalado e no PATH
- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env` configurado corretamente
- [ ] Porta 5000 disponível
- [ ] Firewall/antivírus não bloqueando
- [ ] Ambiente virtual criado e ativo
- [ ] Todas as dependências instaladas
- [ ] Conexão com banco de dados funcionando

---

## 🆘 **Se Nada Funcionar**

### **Configuração Manual Completa**

1. **Execute**: `configurar_novo_computador.bat`
2. **Edite**: `.env` com suas configurações de banco  
3. **Teste**: `diagnosticar_sistema.bat`
4. **Verifique logs**: `homemanager.log` e `homemanager_launcher.log`

### **Logs Importantes**

```cmd
# Ver logs em tempo real
type homemanager.log
type homemanager_launcher.log

# Executar com logs detalhados
.venv\Scripts\python app.py > debug.log 2>&1
```

---

## 💡 **Dicas Preventivas**

1. **Sempre execute** `configurar_novo_computador.bat` em um novo PC
2. **Mantenha backups** do arquivo `.env` configurado
3. **Documente** as configurações específicas do seu banco
4. **Teste regularmente** após atualizações do sistema

---

**🎯 A maioria dos problemas é resolvida com estas etapas. Se persistir, verifique os logs para erros específicos!**
