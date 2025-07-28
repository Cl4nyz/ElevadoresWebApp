// Gerenciamento de Clientes
let clientes = [];
let clienteAtual = null;

// Carregar clientes ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarClientes();
});

// Função para carregar clientes
async function carregarClientes() {
    try {
        clientes = await apiRequest('/api/clientes');
        renderizarTabelaClientes();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar clientes: ' + error.message, 'error');
    }
}

// Função para renderizar tabela de clientes
function renderizarTabelaClientes() {
    const tbody = document.querySelector('#clientesTable tbody');
    tbody.innerHTML = '';
    
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        
        // Formatar endereços para exibição
        let enderecosHtml = '';
        if (cliente.enderecos && cliente.enderecos.length > 0) {
            enderecosHtml = cliente.enderecos.map(endereco => 
                `<small class="d-block">${endereco.rua}, ${endereco.numero || 'S/N'} - ${endereco.cidade}/${endereco.estado}</small>`
            ).join('');
        } else {
            enderecosHtml = '<small class="text-muted">Nenhum endereço</small>';
        }
        
        row.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.nome}</td>
            <td>${formatarCPF(cliente.cpf)}</td>
            <td>
                ${enderecosHtml}
                <button class="btn btn-sm btn-outline-secondary mt-1" onclick="gerenciarEnderecos(${cliente.id}, '${cliente.nome}')">
                    <i class="fas fa-map-marker-alt"></i> Gerenciar
                </button>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarCliente(${cliente.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirCliente(${cliente.id}))" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Função para abrir modal de cliente
function novoCliente() {
    clienteAtual = null;
    document.getElementById('modalTitle').textContent = 'Novo Cliente';
    limparFormulario('clienteForm');
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
}

// Função para editar cliente
function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    clienteAtual = cliente;
    document.getElementById('modalTitle').textContent = 'Editar Cliente';
    
    // Preencher formulário
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('nome').value = cliente.nome;
    document.getElementById('cpf').value = cliente.cpf || '';
    
    // Preencher primeiro endereço se existir
    if (cliente.enderecos && cliente.enderecos.length > 0) {
        const endereco = cliente.enderecos[0];
        document.getElementById('rua').value = endereco.rua || '';
        document.getElementById('numero').value = endereco.numero || '';
        document.getElementById('cidade').value = endereco.cidade || '';
        document.getElementById('estado').value = endereco.estado || '';
        document.getElementById('cep').value = endereco.cep || '';
        document.getElementById('complemento').value = endereco.complemento || '';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
}

// Função para salvar cliente
async function salvarCliente() {
    if (!validarFormulario('clienteForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    
    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    
    const formData = {
        nome: nome,
        cpf: cpf || null
    };
    
    // Validar CPF se preenchido
    if (cpf && !validarCPF(cpf)) {
        showToast('CPF inválido', 'error');
        return;
    }
    
    // Adicionar endereço se preenchido
    const rua = document.getElementById('rua').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const estado = document.getElementById('estado').value; // Não usar trim() em select
    
    if (cidade && estado) {
        formData.endereco = {
            rua: rua || null,
            numero: document.getElementById('numero').value || null,
            cidade: cidade,
            estado: estado,
            cep: document.getElementById('cep').value.trim() || null,
            complemento: document.getElementById('complemento').value.trim() || null
        };
    }
    
    // Desabilitar botão enquanto salva
    const saveButton = document.querySelector('#clienteModal .btn-primary');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    
    try {
        if (clienteAtual) {
            // Atualizar cliente existente
            await apiRequest(`/api/clientes/${clienteAtual.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showToast('Cliente atualizado com sucesso', 'success');
        } else {
            // Criar novo cliente
            const result = await apiRequest('/api/clientes', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showToast(`Cliente criado com sucesso (ID: ${result.id})`, 'success');
        }
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
        carregarClientes();
        
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showToast('Erro ao salvar cliente: ' + error.message, 'error');
    } finally {
        // Reabilitar botão
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}

// Função para excluir cliente
async function excluirCliente(id) {
    try {
        await apiRequest(`/api/clientes/${id}`, {
            method: 'DELETE'
        });
        showToast('Cliente excluído com sucesso', 'success');
        carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showToast('Erro ao excluir cliente: ' + error.message, 'error');
    }
}

// Função para gerenciar endereços
function gerenciarEnderecos(clienteId, clienteNome) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    document.getElementById('clienteNomeEnderecos').textContent = clienteNome;
    document.getElementById('enderecoClienteId').value = clienteId;
    
    renderizarEnderecos(cliente.enderecos || []);
    
    const modal = new bootstrap.Modal(document.getElementById('enderecosModal'));
    modal.show();
}

// Função para renderizar endereços
function renderizarEnderecos(enderecos) {
    const container = document.getElementById('enderecosContainer');
    container.innerHTML = '';
    
    if (enderecos.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum endereço cadastrado</p>';
        return;
    }
    
    enderecos.forEach(endereco => {
        const div = document.createElement('div');
        div.className = 'endereco-item';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${endereco.rua}, ${endereco.numero || 'S/N'}</strong>
                    ${endereco.complemento ? `<br><small>${endereco.complemento}</small>` : ''}
                    <br><small class="text-muted">${endereco.cidade}/${endereco.estado} - ${formatarCEP(endereco.cep)}</small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarEndereco(${endereco.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirEndereco(${endereco.id}))" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Função para novo endereço
function novoEndereco() {
    document.getElementById('enderecoId').value = '';
    limparFormulario('enderecoForm');
    const modal = new bootstrap.Modal(document.getElementById('novoEnderecoModal'));
    modal.show();
}

// Função para editar endereço
function editarEndereco(enderecoId) {
    const clienteId = parseInt(document.getElementById('enderecoClienteId').value);
    const cliente = clientes.find(c => c.id === clienteId);
    const endereco = cliente.enderecos.find(e => e.id === enderecoId);
    
    if (!endereco) return;
    
    document.getElementById('enderecoId').value = endereco.id;
    document.getElementById('enderecoRua').value = endereco.rua || '';
    document.getElementById('enderecoNumero').value = endereco.numero || '';
    document.getElementById('enderecoCidade').value = endereco.cidade || '';
    document.getElementById('enderecoEstado').value = endereco.estado || '';
    document.getElementById('enderecoCep').value = endereco.cep || '';
    document.getElementById('enderecoComplemento').value = endereco.complemento || '';
    
    const modal = new bootstrap.Modal(document.getElementById('novoEnderecoModal'));
    modal.show();
}

// Função para salvar endereço
async function salvarEndereco() {
    if (!validarFormulario('enderecoForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    const clienteId = parseInt(document.getElementById('enderecoClienteId').value);
    const enderecoId = document.getElementById('enderecoId').value;
    
    const formData = {
        id_cliente: clienteId,
        rua: document.getElementById('enderecoRua').value,
        numero: document.getElementById('enderecoNumero').value || null,
        cidade: document.getElementById('enderecoCidade').value,
        estado: document.getElementById('enderecoEstado').value,
        cep: document.getElementById('enderecoCep').value,
        complemento: document.getElementById('enderecoComplemento').value
    };
    
    try {
        if (enderecoId) {
            // Atualizar endereço existente
            await apiRequest(`/api/enderecos/${enderecoId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showToast('Endereço atualizado com sucesso', 'success');
        } else {
            // Criar novo endereço
            await apiRequest('/api/enderecos', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showToast('Endereço criado com sucesso', 'success');
        }
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('novoEnderecoModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('enderecosModal')).hide();
        carregarClientes();
        
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        showToast('Erro ao salvar endereço: ' + error.message, 'error');
    }
}

// Função para excluir endereço
async function excluirEndereco(enderecoId) {
    try {
        await apiRequest(`/api/enderecos/${enderecoId}`, {
            method: 'DELETE'
        });
        showToast('Endereço excluído com sucesso', 'success');
        carregarClientes();
        
        // Atualizar lista de endereços no modal
        const clienteId = parseInt(document.getElementById('enderecoClienteId').value);
        const cliente = clientes.find(c => c.id === clienteId);
        if (cliente) {
            renderizarEnderecos(cliente.enderecos || []);
        }
        
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        showToast('Erro ao excluir endereço: ' + error.message, 'error');
    }
}
