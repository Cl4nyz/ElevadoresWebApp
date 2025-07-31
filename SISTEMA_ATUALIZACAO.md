# Sistema de Atualização Automática

## 📋 Descrição

O HomeManager agora possui um sistema integrado de atualização automática que permite:

- ✅ Verificar atualizações disponíveis no repositório Git
- ✅ Visualizar novos commits antes de atualizar
- ✅ Atualizar o sistema automaticamente
- ✅ Reiniciar o servidor após a atualização

## 🚀 Como Usar

### 1. Acessar o Sistema de Atualização

1. Acesse a página inicial do HomeManager
2. Na seção **"Sobre o Sistema"**, clique para expandir
3. Encontre a seção **"Atualizações do Sistema"**

### 2. Verificar Atualizações

- Clique no botão **"Verificar"** para buscar atualizações
- O sistema irá:
  - Fazer `git fetch` para buscar mudanças remotas 
  - Comparar commits locais vs. remotos
  - Mostrar quantos commits estão disponíveis
  - Listar as mudanças que serão aplicadas

### 3. Atualizar o Sistema

- Se houver atualizações disponíveis, clique em **"Atualizar Sistema"**
- Confirme a ação no dialog
- O sistema irá:
  - Verificar se há mudanças locais não commitadas
  - Fazer backup do arquivo atual
  - Executar `git pull origin main`
  - Reiniciar o servidor automaticamente
  - Recarregar a página após alguns segundos

## 🛡️ Segurança e Validações

### Antes da Atualização

- ✅ Verifica se é um repositório Git válido
- ✅ Confirma que não há mudanças locais não commitadas
- ✅ Faz backup do arquivo principal (app.py.backup)
- ✅ Solicita confirmação do usuário

### Durante a Atualização

- ✅ Mostra progresso em tempo real
- ✅ Captura erros do Git e os exibe
- ✅ Reinicia o servidor de forma segura
- ✅ Tenta reconectar automaticamente

## 🔧 API Endpoints

### GET /api/sistema/verificar-atualizacoes

Verifica se há atualizações disponíveis.

**Resposta de sucesso:**
```json
{
  "atualizacoes_disponiveis": true,
  "total_commits": 3,
  "commit_local": "abc12345",
  "commit_remoto": "def67890",
  "novos_commits": [
    {
      "hash": "def67890",
      "message": "Implementar sistema de atualização"
    },
    {
      "hash": "xyz54321",
      "message": "Melhorar layout do PDF"
    }
  ]
}
```

### POST /api/sistema/atualizar

Executa a atualização do sistema.

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Sistema atualizado com sucesso! Reiniciando servidor...",
  "output": "From https://github.com/user/repo\n   abc1234..def5678  main -> origin/main\nUpdating abc1234..def5678..."
}
```

## ⚠️ Requisitos

- Sistema deve estar em um repositório Git
- Conexão com internet para acessar o repositório remoto
- Permissões para executar comandos Git
- Sem mudanças locais não commitadas

## 🔄 Fluxo de Atualização

```
1. Usuário clica "Verificar"
   ↓
2. Sistema executa git fetch
   ↓
3. Compara commits local vs remoto
   ↓
4. Mostra resultado ao usuário
   ↓
5. [Se houver atualizações] Usuário clica "Atualizar"
   ↓
6. Sistema executa git pull
   ↓
7. Reinicia servidor
   ↓
8. Página recarrega automaticamente
```

## 📝 Notas de Desenvolvimento

- O sistema é executado no processo principal do Flask
- A reinicialização é feita via `os.kill(os.getpid(), signal.SIGTERM)`
- Thread separada para aguardar antes de reiniciar
- Reconexão automática para detectar quando o servidor volta online
- Interface responsiva com feedback visual em tempo real

## 🚀 Benefícios

- ✅ **Facilidade**: Atualização com um clique
- ✅ **Segurança**: Validações antes de executar
- ✅ **Transparência**: Mostra exatamente o que será alterado
- ✅ **Automação**: Reinicialização e reconexão automáticas
- ✅ **Feedback**: Status em tempo real durante todo o processo
