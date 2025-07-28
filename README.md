# 🏢 Sistema de Gerenciamento de Elevadores

Um sistema completo para gerenciamento de elevadores, clientes, contratos e cronogramas de entrega.

## 📋 Funcionalidades

- ✅ **Gerenciamento de Clientes**: Cadastro completo com múltiplos endereços
- ✅ **Gestão de Cabines**: Controle das especificações das cabines
- ✅ **Contratos**: Gerenciamento de contratos com datas de início e entrega
- ✅ **Elevadores**: Cadastro completo com especificações técnicas
- ✅ **Calendário Interativo**: Visualização intuitiva das entregas programadas
- ✅ **Interface Responsiva**: Design moderno e adaptável

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.8+**
- **Flask** - Framework web
- **PostgreSQL** - Banco de dados
- **psycopg2** - Driver PostgreSQL

### Frontend
- **HTML5/CSS3**
- **Bootstrap 5** - Framework CSS
- **JavaScript (Vanilla)**
- **FullCalendar** - Biblioteca de calendário
- **Font Awesome** - Ícones

## 📦 Instalação

### Pré-requisitos

1. **Python 3.8 ou superior**
2. **PostgreSQL** instalado e rodando
3. **pip** (gerenciador de pacotes Python)

### Configuração Rápida

1. **Clone o projeto ou baixe os arquivos**

2. **Configure o banco de dados PostgreSQL**
   ```sql
   CREATE DATABASE elevadores_db;
   CREATE USER postgres WITH PASSWORD 'sua_senha';
   GRANT ALL PRIVILEGES ON DATABASE elevadores_db TO postgres;
   ```

3. **Configure o arquivo .env**
   ```env
   PG_NAME=elevadores_db
   PG_USER=postgres
   PG_PASSWORD=sua_senha
   PG_HOST=localhost
   PG_PORT=5432
   ```

4. **Execute o setup automático**
   ```bash
   python setup.py
   ```
   
   Ou manualmente:
   ```bash
   # Instalar dependências
   pip install -r requirements.txt
   
   # Configurar banco
   python postgre.py
   
   # Executar aplicação
   python app.py
   ```

5. **Acesse o sistema**
   - Abra seu navegador em: `http://localhost:5000`

## 🎯 Como Usar

### 1. Tela Inicial
- Dashboard com acesso rápido a todas as funcionalidades
- Visão geral do sistema

### 2. Gerenciamento de Clientes
- **Adicionar Cliente**: Nome, CPF e endereço principal
- **Editar Cliente**: Modificar informações básicas
- **Gerenciar Endereços**: Múltiplos endereços por cliente
- **Excluir Cliente**: Remove cliente e dados relacionados

### 3. Cabines
- **Cadastrar Cabine**: Especificar altura em centímetros
- **Editar Cabine**: Modificar especificações
- **Excluir Cabine**: Remove se não estiver em uso

### 4. Contratos
- **Novo Contrato**: Selecionar cliente e definir datas
- **Editar Contrato**: Modificar datas e cliente
- **Status Automático**: Visualização do status baseado nas datas

### 5. Elevadores
- **Cadastrar Elevador**: 
  - Selecionar contrato existente ou criar novo
  - Especificar cabine, elevação e cor
  - Criação automática de contrato se necessário
- **Editar Elevador**: Modificar especificações
- **Visualizar Detalhes**: Informações completas incluindo cliente

### 6. Calendário
- **Visualização Mensal/Semanal/Lista**
- **Clique nos Eventos**: Ver detalhes completos
- **Estatísticas**: Resumo de entregas e status
- **Cores Personalizadas**: Baseadas na cor do elevador

## 🗂️ Estrutura do Projeto

```
Sistema-Elevadores/
├── app.py                 # Aplicação Flask principal
├── postgre.py            # Conexão e operações do banco
├── setup.py              # Script de configuração
├── requirements.txt      # Dependências Python
├── create.txt           # Schema do banco de dados
├── .env                 # Configurações (não versionado)
├── static/
│   ├── css/
│   │   └── style.css    # Estilos personalizados
│   └── js/
│       ├── common.js    # Funções comuns
│       ├── clientes.js  # Lógica de clientes
│       ├── cabines.js   # Lógica de cabines
│       ├── contratos.js # Lógica de contratos
│       ├── elevadores.js# Lógica de elevadores
│       └── calendario.js# Lógica do calendário
└── templates/
    ├── base.html        # Template base
    ├── index.html       # Página inicial
    ├── clientes.html    # Gerenciamento de clientes
    ├── cabines.html     # Gerenciamento de cabines
    ├── contratos.html   # Gerenciamento de contratos
    ├── elevadores.html  # Gerenciamento de elevadores
    └── calendario.html  # Calendário de entregas
```

## 🔧 Personalização

### Modificando o Banco de Dados

1. **Edite o arquivo `create.txt`** para modificar a estrutura
2. **Execute `python postgre.py`** para aplicar mudanças
3. **Atualize as APIs em `app.py`** conforme necessário

### Adicionando Campos

1. **Modifique o schema SQL**
2. **Atualize os formulários HTML**
3. **Ajuste as funções JavaScript**
4. **Adapte as rotas da API**

### Customizando a Interface

- **CSS**: Edite `static/css/style.css`
- **JavaScript**: Modifique os arquivos em `static/js/`
- **Templates**: Ajuste os arquivos HTML em `templates/`

## 📊 API Endpoints

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `PUT /api/clientes/<id>` - Atualizar cliente
- `DELETE /api/clientes/<id>` - Excluir cliente

### Endereços
- `POST /api/enderecos` - Criar endereço
- `PUT /api/enderecos/<id>` - Atualizar endereço
- `DELETE /api/enderecos/<id>` - Excluir endereço

### Cabines
- `GET /api/cabines` - Listar cabines
- `POST /api/cabines` - Criar cabine
- `PUT /api/cabines/<id>` - Atualizar cabine
- `DELETE /api/cabines/<id>` - Excluir cabine

### Contratos
- `GET /api/contratos` - Listar contratos
- `POST /api/contratos` - Criar contrato
- `PUT /api/contratos/<id>` - Atualizar contrato
- `DELETE /api/contratos/<id>` - Excluir contrato

### Elevadores
- `GET /api/elevadores` - Listar elevadores
- `POST /api/elevadores` - Criar elevador
- `PUT /api/elevadores/<id>` - Atualizar elevador
- `DELETE /api/elevadores/<id>` - Excluir elevador

### Calendário
- `GET /api/calendario` - Dados para calendário

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
1. Verifique se PostgreSQL está rodando
2. Confirme credenciais no arquivo `.env`
3. Teste conexão manualmente

### Dependências não Instaladas
```bash
pip install -r requirements.txt
```

### Porta em Uso
- Mude a porta em `app.py`: `app.run(port=5001)`

### Problemas com JavaScript
- Abra F12 (Ferramentas do Desenvolvedor)
- Verifique Console para erros
- Confirme se APIs estão respondendo

## 📈 Futuras Melhorias

- [ ] Autenticação de usuários
- [ ] Relatórios em PDF
- [ ] Notificações por email
- [ ] Backup automático
- [ ] API REST completa
- [ ] Aplicativo mobile
- [ ] Dashboard com gráficos
- [ ] Histórico de alterações

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte a seção de troubleshooting
3. Abra uma issue no GitHub
4. Entre em contato com o desenvolvedor

---

🏢 **Sistema de Gerenciamento de Elevadores** - Desenvolvido com ❤️ em Python e Flask
