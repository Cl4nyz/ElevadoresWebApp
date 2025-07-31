# Configurações Rápidas para Windows

## ⚡ Instalação Expressa (3 comandos)

### 1️⃣ Pré-requisito: Python
- Baixe: https://python.org/downloads/
- ⚠️ **IMPORTANTE**: Marque "Add Python to PATH" na instalação

### 2️⃣ Instalação Automática
```cmd
# 1. Baixe o projeto (ou extraia o ZIP)
git clone https://github.com/Cl4nyz/ElevadoresWebApp.git
cd ElevadoresWebApp

# 2. Execute o instalador
install_windows.bat

# 3. Inicie o sistema
start_windows.bat
```

## 🗃️ Configuração do PostgreSQL

### Download e Instalação
1. Baixe: https://www.postgresql.org/download/windows/
2. Instale com configurações padrão
3. Anote a senha do usuário `postgres`

### Criação do Banco
1. Abra o **pgAdmin** (vem com o PostgreSQL)
2. Conecte com usuário `postgres` e sua senha
3. **Clique direito em "Databases" → "Create" → "Database"**
4. Nome: `elevadores`
5. **Clique em "Save"**

### Importação das Tabelas
1. **Clique direito no banco "elevadores" → "Query Tool"**
2. **Abra o arquivo `create.txt` com o Bloco de Notas**
3. **Copie todo o conteúdo e cole na Query Tool**
4. **Pressione F5 ou clique em "Execute"**

## 🚀 Execução

### Método Simples
1. **Dê duplo clique em `start_windows.bat`**
2. **Aguarde aparecer "Running on http://127.0.0.1:5000"**
3. **Abra seu navegador em: http://localhost:5000**

### Método Manual
```cmd
# Ative o ambiente virtual
venv\Scripts\activate

# Execute o sistema
python app.py
```

## 🔧 Solução de Problemas

### ❌ Erro: 'python' não é reconhecido
```cmd
# Teste alternativo:
py --version

# Se funcionar, use 'py' ao invés de 'python':
py -m venv venv
py app.py
```

### ❌ Erro: psycopg2 não instala
```cmd
# Use a versão binary:
pip install psycopg2-binary
```

### ❌ Erro: Conexão com banco falha
1. **Verifique se o PostgreSQL está rodando**
   - Vá em "Serviços" do Windows
   - Procure por "postgresql" e inicie se necessário

2. **Verifique credenciais no arquivo `postgre.py`**
   ```python
   # Linha ~8, ajuste se necessário:
   user='postgres',        # Seu usuário
   password='postgres'     # Sua senha real
   ```

### ❌ Erro: Porta 5000 em uso
**Edite `app.py` na última linha:**
```python
if __name__ == '__main__':
    app.run(debug=True, port=8080)  # Mude para 8080
```

## 📱 Acesso ao Sistema

Após iniciar, acesse **http://localhost:5000** e você verá:

- 🏠 **Dashboard Principal**
- 👥 **Clientes**: Cadastro e endereços
- 📄 **Contratos**: Gestão de vendas
- 🏢 **Elevadores**: Configuração completa
- 📅 **Calendário**: Entregas por data
- 📊 **Relatórios**: PDFs detalhados

## 💡 Dicas Importantes

1. **Sempre use o `start_windows.bat`** para facilitar
2. **Mantenha o prompt aberto** enquanto usa o sistema
3. **Use Ctrl+C** para parar o servidor
4. **PostgreSQL deve estar sempre rodando**
5. **Acesse sempre via http://localhost:5000**

---

**🎯 Resumo dos Comandos:**
```cmd
install_windows.bat    # Instala tudo automaticamente
start_windows.bat      # Inicia o sistema
```

**🌐 URL de Acesso:** http://localhost:5000
