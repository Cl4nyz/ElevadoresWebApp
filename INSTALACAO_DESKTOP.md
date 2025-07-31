# HomeManager - Sistema de Gerenciamento de Elevadores

## 🚀 Executar como Aplicativo Desktop

O HomeManager pode ser executado como um aplicativo desktop tanto no Linux quanto no Windows.

### 📋 Pré-requisitos

- Python 3.7 ou superior
- pip (gerenciador de pacotes Python)
- Banco de dados PostgreSQL configurado

### 🐧 Linux

#### Opção 1: Executar Diretamente
```bash
# Navegar para o diretório do projeto
cd /home/yan/Coding/ElevadoresWebApp

# Executar o script de inicialização
./homemanager.sh
```

#### Opção 2: Instalar como Aplicativo Desktop

1. **Tornar o arquivo executável:**
```bash
chmod +x homemanager.py
chmod +x homemanager.sh
```

2. **Copiar arquivo desktop para aplicativos do usuário:**
```bash
cp HomeManager.desktop ~/.local/share/applications/
```

3. **Atualizar banco de dados de aplicativos:**
```bash
update-desktop-database ~/.local/share/applications/
```

4. **Agora você pode:**
   - Pesquisar "HomeManager" no menu de aplicativos
   - Clicar no ícone para executar
   - Fixar na barra de tarefas/dock

#### Opção 3: Instalação Global (Administrador)
```bash
# Copiar para aplicativos do sistema (requer sudo)
sudo cp HomeManager.desktop /usr/share/applications/

# Atualizar banco de dados global
sudo update-desktop-database /usr/share/applications/
```

### 🪟 Windows

#### Opção 1: Executar via Arquivo Batch
```cmd
# Navegar para o diretório do projeto
cd C:\caminho\para\ElevadoresWebApp

# Executar o arquivo batch
HomeManager.bat
```

#### Opção 2: Criar Atalho na Área de Trabalho

1. **Clique com botão direito na área de trabalho**
2. **Selecione "Novo" > "Atalho"**
3. **No campo localização, digite:**
   ```
   C:\caminho\para\ElevadoresWebApp\HomeManager.bat
   ```
4. **Nome do atalho:** `HomeManager`
5. **Clique em "Concluir"**

#### Opção 3: Adicionar ao Menu Iniciar

1. **Pressione Windows + R**
2. **Digite:** `shell:programs`
3. **Copie o arquivo `HomeManager.bat` para esta pasta**
4. **Crie um atalho com o nome "HomeManager"**
5. **Agora você pode pesquisar "HomeManager" no menu iniciar**

#### Opção 4: Fixar na Barra de Tarefas

1. **Clique com botão direito no arquivo `HomeManager.bat`**
2. **Selecione "Fixar na barra de tarefas"**

### 🔧 Configuração Avançada

#### Personalizar Ícone (Linux)
Edite o arquivo `HomeManager.desktop` e altere a linha:
```
Icon=/caminho/para/seu/icone.png
```

#### Personalizar Ícone (Windows)
1. **Clique com botão direito no atalho**
2. **Propriedades > Alterar Ícone**
3. **Selecione um arquivo .ico ou .png**

### 🛠️ Como Funciona

1. **homemanager.py**: Script principal que inicia o servidor Flask
2. **homemanager.sh**: Script bash para Linux com verificação de dependências
3. **HomeManager.bat**: Script batch para Windows com verificação de dependências
4. **HomeManager.desktop**: Arquivo de aplicativo desktop para Linux

### 📱 Funcionalidades do Executável

- ✅ **Auto-verificação de dependências**
- ✅ **Instalação automática de pacotes Python**
- ✅ **Abertura automática do navegador**
- ✅ **Interface colorida no terminal**
- ✅ **Tratamento de erros**
- ✅ **Instruções claras para o usuário**

### 🚨 Solução de Problemas

#### Linux
```bash
# Se tiver problemas de permissão
chmod +x homemanager.py homemanager.sh

# Se não conseguir instalar dependências
pip3 install --user -r requirements.txt

# Verificar se Python3 está instalado
python3 --version
```

#### Windows
```cmd
# Verificar se Python está no PATH
python --version

# Se não conseguir instalar dependências
pip install --user -r requirements.txt
```

### 🔄 Atualização Automática

O sistema inclui funcionalidade de atualização automática via Git:
1. Abra o HomeManager
2. Vá para "Sobre o Sistema"
3. Clique em "Verificar Atualizações"
4. Se houver atualizações, clique em "Atualizar Sistema"

### 📞 Suporte

Em caso de problemas:
1. Verifique se o PostgreSQL está rodando
2. Confirme se todas as dependências estão instaladas
3. Execute o script manualmente para ver mensagens de erro detalhadas
