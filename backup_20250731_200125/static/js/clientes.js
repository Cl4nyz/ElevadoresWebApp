// Gerenciamento de Clientes
let clientes = [];
let clienteAtual = null;
let tabelaClientes = null;

// Carregar clientes ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarClientes();
});

// Função para carregar clientes
async function carregarClientes() {
    try {
        clientes = await apiRequest('/api/clientes');
        
        // Inicializar tabela ordenável se ainda não foi inicializada
        if (!tabelaClientes) {
            tabelaClientes = new TabelaOrdenavel('clientesTable', clientes, renderizarTabelaClientes);
        } else {
            tabelaClientes.atualizarDados(clientes);
        }
        
        renderizarTabelaClientes(clientes);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar clientes: ' + error.message, 'error');
    }
}

// Função para renderizar tabela de clientes
function renderizarTabelaClientes(dadosParaRenderizar = clientes) {
    const tbody = document.querySelector('#clientesTable tbody');
    tbody.innerHTML = '';
    
    dadosParaRenderizar.forEach(cliente => {
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
            <td>
                ${cliente.nome}
                ${cliente.comercial ? '<span class="badge bg-info ms-2">PJ</span>' : '<span class="badge bg-secondary ms-2">PF</span>'}
            </td>
            <td>${formatarDocumento(cliente.documento || cliente.cpf || '')}</td>
            <td>${cliente.email || '<span class="text-muted">Não informado</span>'}</td>
            <td>
                ${enderecosHtml}
                <button class="btn btn-sm btn-outline-secondary mt-1" onclick="gerenciarEnderecos(${cliente.id}, '${cliente.nome}')">
                    <i class="fas fa-map-marker-alt"></i> Gerenciar
                </button>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="visualizarCliente(${cliente.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
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
    
    // Resetar para pessoa física por padrão
    document.getElementById('comercial').value = 'false';
    
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    
    // Configurar o tipo de cliente quando o modal for totalmente mostrado
    const modalElement = document.getElementById('clienteModal');
    modalElement.addEventListener('shown.bs.modal', function handler() {
        alterarTipoCliente();
        // Remover o event listener após usar para evitar duplicatas
        modalElement.removeEventListener('shown.bs.modal', handler);
    });
    
    modal.show();
}

// Função para alterar tipo de cliente
function alterarTipoCliente() {
    const comercial = document.getElementById('comercial').value === 'true';
    const labelDocumento = document.getElementById('labelDocumento');
    const inputDocumento = document.getElementById('documento');
    
    // Verificar se os elementos existem
    if (!labelDocumento || !inputDocumento) {
        console.warn('Elementos do formulário não encontrados ainda');
        return;
    }
    
    if (comercial) {
        labelDocumento.textContent = 'CNPJ';
        inputDocumento.placeholder = '00.000.000/0000-00';
        inputDocumento.maxLength = '18'; // Formatado: 00.000.000/0000-00
    } else {
        labelDocumento.textContent = 'CPF';
        inputDocumento.placeholder = '000.000.000-00';
        inputDocumento.maxLength = '14'; // Formatado: 000.000.000-00
    }
    
    // Limpar campo atual
    inputDocumento.value = '';
    
    // Remover event listeners anteriores
    inputDocumento.removeEventListener('input', limitarDigitosCPF);
    inputDocumento.removeEventListener('input', limitarDigitosCNPJ);
    
    // Adicionar event listener apropriado
    if (comercial) {
        inputDocumento.addEventListener('input', limitarDigitosCNPJ);
        console.log('Event listener CNPJ configurado');
    } else {
        inputDocumento.addEventListener('input', limitarDigitosCPF);
        console.log('Event listener CPF configurado');
    }
}

// Função para limitar entrada de CPF (máximo 11 dígitos)
function limitarDigitosCPF(event) {
    const input = event.target;
    const valor = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    if (valor.length > 11) {
        // Limitar a 11 dígitos
        const valorLimitado = valor.substring(0, 11);
        input.value = formatarCPF(valorLimitado);
    } else {
        input.value = formatarCPF(valor);
    }
}

// Função para limitar entrada de CNPJ (máximo 14 dígitos)
function limitarDigitosCNPJ(event) {
    const input = event.target;
    const valor = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    if (valor.length > 14) {
        // Limitar a 14 dígitos
        const valorLimitado = valor.substring(0, 14);
        input.value = formatarCNPJ(valorLimitado);
    } else {
        input.value = formatarCNPJ(valor);
    }
}

// Função para visualizar cliente
function visualizarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    // Preencher dados básicos
    document.getElementById('viewClienteNome').textContent = cliente.nome || 'N/A';
    document.getElementById('viewClienteTipo').innerHTML = cliente.comercial ? 
        '<span class="badge bg-info">Pessoa Jurídica</span>' : 
        '<span class="badge bg-secondary">Pessoa Física</span>';
    document.getElementById('viewClienteEmail').textContent = cliente.email || 'Não informado';
    
    // Determinar o documento (novo campo ou campo legado)
    const documento = cliente.documento || cliente.cpf || '';
    const labelDocumento = document.getElementById('viewLabelDocumento');
    
    if (cliente.comercial) {
        labelDocumento.textContent = 'CNPJ:';
    } else {
        labelDocumento.textContent = 'CPF:';
    }
    
    document.getElementById('viewClienteDocumento').textContent = documento ? 
        formatarDocumento(documento) : 'N/A';
    
    // Preencher endereços
    const enderecosContainer = document.getElementById('viewEnderecos');
    if (cliente.enderecos && cliente.enderecos.length > 0) {
        enderecosContainer.innerHTML = cliente.enderecos.map(endereco => `
            <div class="border rounded p-2 mb-2">
                <strong>${endereco.rua}, ${endereco.numero || 'S/N'}</strong><br>
                <small class="text-muted">
                    ${endereco.complemento ? endereco.complemento + '<br>' : ''}
                    ${endereco.bairro ? endereco.bairro + ' - ' : ''}${endereco.cidade}/${endereco.estado}
                    ${endereco.cep ? ' - CEP: ' + endereco.cep : ''}
                </small>
            </div>
        `).join('');
    } else {
        enderecosContainer.innerHTML = '<p class="text-muted">Nenhum endereço cadastrado</p>';
    }
    
    // Armazenar ID do cliente atual para o botão de editar
    window.clienteVisualizacaoAtual = id;
    
    // Abrir modal
    new bootstrap.Modal(document.getElementById('visualizarClienteModal')).show();
}

// Função para editar cliente a partir da visualização
function editarClienteFromView() {
    if (window.clienteVisualizacaoAtual) {
        // Fechar modal de visualização
        const modalVisualizacao = bootstrap.Modal.getInstance(document.getElementById('visualizarClienteModal'));
        if (modalVisualizacao) {
            modalVisualizacao.hide();
        }
        
        // Abrir modal de edição
        setTimeout(() => {
            editarCliente(window.clienteVisualizacaoAtual);
        }, 300); // Pequeno delay para permitir que o modal de visualização feche primeiro
    }
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
    document.getElementById('email').value = cliente.email || '';
    
    // Determinar tipo de cliente e documento
    const comercial = cliente.comercial || false;
    document.getElementById('comercial').value = comercial.toString();
    
    // Preencher documento (novo campo ou campo legado)
    const documento = cliente.documento || cliente.cpf || '';
    document.getElementById('documento').value = documento ? formatarDocumento(documento) : '';
    
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
    
    // Configurar o tipo de cliente quando o modal for totalmente mostrado
    const modalElement = document.getElementById('clienteModal');
    modalElement.addEventListener('shown.bs.modal', function handler() {
        alterarTipoCliente(); // Atualizar labels, placeholders e event listeners
        // Remover o event listener após usar para evitar duplicatas
        modalElement.removeEventListener('shown.bs.modal', handler);
    });
    
    modal.show();
}

// Função para salvar cliente
async function salvarCliente() {
    // Usar a nova função de validação global
    if (!validarCamposObrigatorios('clienteForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    // Limpar erros se validação passou
    limparErrosCampos('clienteForm');
    
    const nome = document.getElementById('nome').value.trim();
    const comercial = document.getElementById('comercial').value === 'true';
    const documento = document.getElementById('documento').value.trim();
    const email = document.getElementById('email').value.trim();
    
    const formData = {
        nome: nome,
        comercial: comercial,
        documento: documento || null,
        email: email || null
    };
    
    // Validar documento se preenchido
    if (documento && !validarDocumento(documento)) {
        const tipoDoc = comercial ? 'CNPJ' : 'CPF';
        showToast(`${tipoDoc} inválido. Verifique se todos os dígitos estão corretos`, 'error');
        return;
    }
    
    // Remover caracteres não numéricos do documento para salvar no banco
    if (documento) {
        formData.documento = documento.replace(/\D/g, '');
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
    // Garantir que o clienteId seja copiado do modal principal
    const clienteId = document.getElementById('enderecoClienteId').value;
    console.log('Cliente ID para novo endereço:', clienteId); // Debug
    
    document.getElementById('enderecoId').value = '';
    limparFormulario('enderecoForm');
    
    // Restaurar o clienteId após limpar o formulário
    document.getElementById('enderecoClienteId').value = clienteId;
    
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
    console.log('Iniciando salvar endereço...'); // Debug
    
    // Verificar se os campos existem
    const ruaElement = document.getElementById('enderecoRua');
    const cidadeElement = document.getElementById('enderecoCidade');
    const estadoElement = document.getElementById('enderecoEstado');
    
    console.log('Elementos encontrados:', {
        rua: !!ruaElement,
        cidade: !!cidadeElement,
        estado: !!estadoElement
    }); // Debug
    
    if (!ruaElement || !cidadeElement || !estadoElement) {
        showToast('Erro: Campos do formulário não encontrados', 'error');
        return;
    }
    
    const rua = ruaElement.value.trim();
    const cidade = cidadeElement.value.trim();
    const estado = estadoElement.value;
    
    console.log('Valores dos campos:', { rua, cidade, estado }); // Debug
    
    if (!rua || !cidade || !estado) {
        showToast('Por favor, preencha todos os campos obrigatórios (Rua, Cidade e Estado)', 'warning');
        return;
    }
    
    const clienteId = parseInt(document.getElementById('enderecoClienteId').value);
    const enderecoId = document.getElementById('enderecoId').value;
    
    const formData = {
        id_cliente: clienteId,
        rua: rua,
        numero: document.getElementById('enderecoNumero').value || null,
        cidade: cidade,
        estado: estado,
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
