# 🪟 Guia de Instalação - Windows

## Pré-requisitos

### 1. Python 3.8+
- Baixe e instale o Python do site oficial: https://python.org/downloads/
- **IMPORTANTE**: Durante a instalação, marque a opção "Add Python to PATH"
- Verifique a instalação abrindo o CMD e digitando: `python --version`

### 2. PostgreSQL
- Baixe e instale o PostgreSQL: https://www.postgresql.org/download/windows/
- Durante a instalação, anote a senha do usuário `postgres`
- O PostgreSQL geralmente instala na porta 5432

### 3. Git (opcional, mas recomendado)
- Baixe e instale: https://git-scm.com/download/win

## 📋 Instalação Passo a Passo

### Método 1: Instalação Automática (Recomendado)

1. **Baixe ou clone o projeto**
   ```cmd
   git clone https://github.com/Cl4nyz/ElevadoresWebApp.git
   cd ElevadoresWebApp
   ```
   
   Ou baixe o ZIP e extraia em uma pasta de sua escolha.

2. **Execute o instalador automático**
   ```cmd
   install_windows.bat
   ```
   
   Este script irá:
   - Criar um ambiente virtual Python
   - Instalar todas as dependências automaticamente
   - Configurar o banco de dados
   - Criar atalhos na área de trabalho

### Método 2: Instalação Manual

1. **Abra o Prompt de Comando como Administrador**
   - Pressione `Win + R`, digite `cmd`, pressione `Ctrl + Shift + Enter`

2. **Navegue até a pasta do projeto**
   ```cmd
   cd C:\caminho\para\ElevadoresWebApp
   ```

3. **Crie um ambiente virtual**
   ```cmd
   python -m venv venv
   ```

4. **Ative o ambiente virtual**
   ```cmd
   venv\Scripts\activate
   ```

5. **Instale as dependências**
   ```cmd
   pip install -r requirements.txt
   ```

6. **Configure o banco de dados**
   - Abra o pgAdmin ou conecte via psql
   - Execute os comandos SQL do arquivo `create.txt`

## 🚀 Executando o Sistema

### Opção 1: Usando o arquivo de inicialização
```cmd
start_windows.bat
```

### Opção 2: Manualmente
1. **Ative o ambiente virtual** (se não estiver ativo)
   ```cmd
   venv\Scripts\activate
   ```

2. **Execute o sistema**
   ```cmd
   python app.py
   ```

3. **Acesse no navegador**
   - Abra seu navegador e vá para: http://localhost:5000

## 🗃️ Configuração do Banco de Dados

### Configuração Automática
O arquivo `postgre.py` está configurado com as credenciais padrão:
- Host: localhost
- Porta: 5432
- Usuário: postgres
- Senha: postgres
- Database: elevadores

### Configuração Manual
Se suas credenciais forem diferentes, edite o arquivo `postgre.py`:

```python
def create_pg_connection():
    try:
        connection = psycopg2.connect(
            host='localhost',        # Seu host
            port='5432',            # Sua porta
            database='elevadores',   # Nome do banco
            user='postgres',        # Seu usuário
            password='SUA_SENHA'    # Sua senha
        )
        return connection
    except Exception as e:
        print(f"Erro ao conectar: {e}")
        return None
```

## 🎯 Criação do Banco de Dados

1. **Abra o pgAdmin ou conecte via psql**

2. **Crie o banco de dados**
   ```sql
   CREATE DATABASE elevadores;
   ```

3. **Execute o script de criação das tabelas**
   - Copie e execute todo o conteúdo do arquivo `create.txt`

## 🔧 Solução de Problemas Comuns

### Erro: 'python' não é reconhecido
- Reinstale o Python marcando "Add to PATH"
- Ou use `py` ao invés de `python`

### Erro: psycopg2 não instala
```cmd
pip install psycopg2-binary
```

### Erro de conexão com PostgreSQL
- Verifique se o PostgreSQL está rodando
- Confirme usuário, senha e porta
- Teste a conexão com pgAdmin

### Porta 5000 em uso
- Altere a porta no final do arquivo `app.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, port=8000)  # Use outra porta
```

## 📁 Estrutura de Arquivos
```
ElevadoresWebApp/
├── app.py                 # Aplicação principal
├── postgre.py            # Conexão com banco
├── requirements.txt      # Dependências Python
├── create.txt           # Script SQL do banco
├── install_windows.bat  # Instalador automático
├── start_windows.bat    # Inicializador
├── templates/           # Templates HTML
├── static/             # Arquivos CSS/JS/Imagens
└── venv/               # Ambiente virtual (criado após instalação)
```

## 🎮 Funcionalidades do Sistema

Após a instalação, você terá acesso a:

- ✅ **Gestão de Clientes**: Cadastro completo com endereços
- ✅ **Controle de Contratos**: Datas de venda e entrega
- ✅ **Configuração de Elevadores**: Cabines, colunas e adicionais
- ✅ **Calendário de Entregas**: Visualização temporal
- ✅ **Relatórios em PDF**: Documentação completa dos elevadores
- ✅ **Interface Responsiva**: Funciona em desktop e mobile

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos os pré-requisitos foram instalados
2. Confirme se o PostgreSQL está funcionando
3. Teste a conexão de rede (localhost:5000)
4. Consulte os logs no terminal para mensagens de erro

---

**Sistema HomeManager - Gestão Completa de Elevadores**
*Desenvolvido com Flask, PostgreSQL e Bootstrap 5*
