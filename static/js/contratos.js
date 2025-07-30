// Gerenciamento de Contratos
let contratos = [];
let clientes = [];
let contratoAtual = null;
let dataCalculada = null;
let tabelaContratos = null;

// Carregar dados ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarContratos();
    carregarClientes();
    carregarEstados();
    configurarEventos();
});

// Configurar eventos de formatação
function configurarEventos() {
    // CPF formatting
    const cpfInput = document.getElementById('cpfCliente');
    if (cpfInput) {
        cpfInput.addEventListener('input', formatarCPF);
    }
    
    // CEP formatting
    const cepInput = document.getElementById('cepCliente');
    if (cepInput) {
        cepInput.addEventListener('input', formatarCEP);
    }
}

// Função para carregar contratos
async function carregarContratos() {
    try {
        contratos = await apiRequest('/api/contratos');
        
        // Inicializar tabela ordenável se ainda não foi inicializada
        if (!tabelaContratos) {
            tabelaContratos = new TabelaOrdenavel('contratosTable', contratos, renderizarTabelaContratos);
        } else {
            tabelaContratos.atualizarDados(contratos);
        }
        
        renderizarTabelaContratos(contratos);
    } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        showToast('Erro ao carregar contratos: ' + error.message, 'error');
    }
}

// Função para carregar clientes
async function carregarClientes() {
    try {
        clientes = await apiRequest('/api/clientes');
        popularSelectClientes();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar clientes: ' + error.message, 'error');
    }
}

// Função para carregar estados
async function carregarEstados() {
    try {
        const estados = await apiRequest('/api/relatorios/opcoes-filtros');
        const selectEstado = document.getElementById('estadoCliente');
        if (selectEstado && estados.estados) {
            selectEstado.innerHTML = '<option value="">Selecione...</option>';
            estados.estados.forEach(estado => {
                selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar estados:', error);
    }
}

// Função para popular select de clientes
function popularSelectClientes() {
    const select = document.getElementById('cliente');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
}

// Função para renderizar tabela de contratos
function renderizarTabelaContratos() {
    const tbody = document.querySelector('#contratosTable tbody');
    tbody.innerHTML = '';
    
    contratos.forEach(contrato => {
        const row = document.createElement('tr');
        
        // Determinar status do contrato
        let status = '';
        let statusClass = '';
        const hoje = new Date();
        // Usar a nova função para criar data segura
        const dataEntrega = contrato.data_entrega ? criarDataSegura(contrato.data_entrega) : null;
        
        if (!dataEntrega) {
            status = 'Sem data de entrega';
            statusClass = 'bg-secondary';
        } else if (dataEntrega < hoje) {
            status = 'Atrasado';
            statusClass = 'bg-danger';
        } else if (dataEntrega.toDateString() === hoje.toDateString()) {
            status = 'Entrega hoje';
            statusClass = 'bg-warning';
        } else {
            status = 'Em andamento';
            statusClass = 'bg-success';
        }
        
        row.innerHTML = `
            <td>${contrato.id}</td>
            <td>${contrato.cliente_nome || 'Cliente não encontrado'}</td>
            <td>${formatarData(contrato.data_venda)}</td>
            <td>${formatarData(contrato.data_entrega)}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="editarContrato(${contrato.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirContrato(${contrato.id}), 'Tem certeza que deseja excluir este contrato?')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para adicionar dias úteis a uma data
function adicionarDiasUteis(dataInicio, diasUteis) {
    let dataAtual = new Date(dataInicio);
    let diasAdicionados = 0;
    
    while (diasAdicionados < diasUteis) {
        dataAtual.setDate(dataAtual.getDate() + 1);
        
        // Verificar se é dia útil (segunda a sexta)
        const diaSemana = dataAtual.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasAdicionados++;
        }
    }
    
    return dataAtual;
}

// Função para calcular data de entrega
function calcularDataEntrega() {
    const dataVenda = document.getElementById('dataVenda').value;
    if (!dataVenda) {
        showToast('Informe primeiro a data da venda', 'warning');
        return;
    }
    
    // Calcular automaticamente 30 dias úteis usando a nova função segura
    const dataFinal = adicionarDiasUteis(criarDataSegura(dataVenda), 30);
    const dataFormatada = dataFinal.toISOString().split('T')[0];
    document.getElementById('dataEntrega').value = dataFormatada;
    
    showToast('Data de entrega calculada: ' + formatarData(dataFormatada), 'info');
}

// Função para salvar novo cliente
async function salvarNovoCliente() {
    const nome = document.getElementById('nomeCliente').value.trim();
    
    if (!nome) {
        showToast('Nome do cliente é obrigatório', 'error');
        return;
    }
    
    const clienteData = {
        nome: nome,
        cpf: document.getElementById('cpfCliente').value.trim(),
        endereco: {
            rua: document.getElementById('ruaCliente').value.trim(),
            numero: document.getElementById('numeroCliente').value.trim(),
            cidade: document.getElementById('cidadeCliente').value.trim(),
            estado: document.getElementById('estadoCliente').value,
            cep: document.getElementById('cepCliente').value.trim(),
            complemento: document.getElementById('complementoCliente').value.trim()
        }
    };
    
    try {
        const novoCliente = await apiRequest('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
        
        // Atualizar lista de clientes
        await carregarClientes();
        
        // Selecionar o novo cliente no select
        document.getElementById('cliente').value = novoCliente.id;
        
        // Limpar formulário
        document.getElementById('novoClienteForm').reset();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('novoClienteModal'));
        modal.hide();
        
        showToast('Cliente criado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        showToast('Erro ao criar cliente: ' + error.message, 'error');
    }
}

// Função para adicionar novo contrato
function adicionarContrato() {
    contratoAtual = null;
    document.getElementById('modalTitle').textContent = 'Novo Contrato';
    document.getElementById('contratoForm').reset();
    document.getElementById('contratoId').value = '';
    
    // Definir data de hoje como padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVenda').value = hoje;
    
    const modal = new bootstrap.Modal(document.getElementById('contratoModal'));
    modal.show();
}

// Função para editar contrato
function editarContrato(id) {
    contratoAtual = contratos.find(c => c.id === id);
    if (!contratoAtual) {
        showToast('Contrato não encontrado', 'error');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Editar Contrato';
    document.getElementById('contratoId').value = contratoAtual.id;
    document.getElementById('cliente').value = contratoAtual.id_cliente;
    document.getElementById('dataVenda').value = contratoAtual.data_venda || '';
    document.getElementById('dataEntrega').value = contratoAtual.data_entrega || '';
    
    const modal = new bootstrap.Modal(document.getElementById('contratoModal'));
    modal.show();
}

// Função para salvar contrato
async function salvarContrato() {
    if (!validarFormulario('contratoForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    const formData = {
        id_cliente: parseInt(document.getElementById('cliente').value),
        data_venda: document.getElementById('dataVenda').value || null,
        data_entrega: document.getElementById('dataEntrega').value || null
    };
    
    // Validar datas se ambas estiverem preenchidas
    if (formData.data_venda && formData.data_entrega) {
        const dataVenda = criarDataSegura(formData.data_venda);
        const dataEntrega = criarDataSegura(formData.data_entrega);
        
        if (dataEntrega < dataVenda) {
            showToast('A data de entrega não pode ser anterior à data da venda', 'error');
            return;
        }
    }
    
    try {
        if (contratoAtual) {
            // Atualizar contrato existente
            await apiRequest(`/api/contratos/${contratoAtual.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showToast('Contrato atualizado com sucesso', 'success');
        } else {
            // Criar novo contrato
            await apiRequest('/api/contratos', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showToast('Contrato criado com sucesso', 'success');
        }
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('contratoModal')).hide();
        carregarContratos();
        
    } catch (error) {
        console.error('Erro ao salvar contrato:', error);
        showToast('Erro ao salvar contrato: ' + error.message, 'error');
    }
}

// Função para excluir contrato
async function excluirContrato(id) {
    try {
        await apiRequest(`/api/contratos/${id}`, {
            method: 'DELETE'
        });
        showToast('Contrato excluído com sucesso', 'success');
        carregarContratos();
    } catch (error) {
        console.error('Erro ao excluir contrato:', error);
        showToast('Erro ao excluir contrato: ' + error.message, 'error');
    }
}

// Função para validar formulário
function validarFormulario(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    for (let input of inputs) {
        if (!input.value.trim()) {
            input.focus();
            return false;
        }
    }
    return true;
}

// Função para mostrar modal de dias úteis
function mostrarDialogoDiasUteis() {
    const modal = new bootstrap.Modal(document.getElementById('diasUteisModal'));
    
    // Event listener para quando o modal for mostrado
    document.getElementById('diasUteisModal').addEventListener('shown.bs.modal', function () {
        calcularPreviewDiasUteis(); // Calcular preview inicial
    }, { once: true });
    
    modal.show();
}

// Função para adicionar dias úteis
function adicionarDiasUteis() {
    const quantidadeDias = parseInt(document.getElementById('quantidadeDias').value);
    const dataBase = document.getElementById('dataBase').value;
    
    if (!quantidadeDias || quantidadeDias <= 0) {
        showToast('Por favor, informe uma quantidade válida de dias', 'error');
        return;
    }
    
    let dataInicial;
    
    if (dataBase === 'venda') {
        const dataVenda = document.getElementById('dataVenda').value;
        if (!dataVenda) {
            showToast('Por favor, defina primeiro a data da venda', 'error');
            return;
        }
        dataInicial = new Date(dataVenda + 'T00:00:00');
    } else {
        dataInicial = new Date();
    }
    
    // Calcular a data com dias úteis
    const dataFinal = calcularDataComDiasUteis(dataInicial, quantidadeDias);
    
    // Definir no campo de data de entrega
    document.getElementById('dataEntrega').value = formatarDataParaInput(dataFinal);
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('diasUteisModal'));
    modal.hide();
    
    showToast(`${quantidadeDias} dias úteis adicionados. Data de entrega: ${formatarDataBrasileira(dataFinal)}`, 'success');
}

// Função para calcular data adicionando apenas dias úteis (segunda a sexta)
function calcularDataComDiasUteis(dataInicial, diasUteis) {
    let data = new Date(dataInicial);
    let diasAdicionados = 0;
    
    while (diasAdicionados < diasUteis) {
        data.setDate(data.getDate() + 1);
        
        // Verificar se é dia útil (1=segunda, 2=terça, ..., 5=sexta)
        const diaSemana = data.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
            diasAdicionados++;
        }
    }
    
    return data;
}

// Função para formatar data para input type="date" (YYYY-MM-DD)
function formatarDataParaInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para formatar data no padrão brasileiro (DD/MM/YYYY)
function formatarDataBrasileira(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para calcular e mostrar preview de dias úteis
function calcularPreviewDiasUteis() {
    const quantidadeDias = parseInt(document.getElementById('quantidadeDias').value);
    const dataBase = document.getElementById('dataBase').value;
    const previewElement = document.getElementById('previewData');
    const dataPreviewElement = document.getElementById('dataPreview');
    
    if (!quantidadeDias || quantidadeDias <= 0) {
        previewElement.style.display = 'none';
        return;
    }
    
    let dataInicial;
    let dataBaseTexto;
    
    if (dataBase === 'venda') {
        const dataVenda = document.getElementById('dataVenda').value;
        if (!dataVenda) {
            previewElement.style.display = 'none';
            return;
        }
        dataInicial = new Date(dataVenda + 'T00:00:00');
        dataBaseTexto = 'data da venda';
    } else {
        dataInicial = new Date();
        dataBaseTexto = 'hoje';
    }
    
    const dataFinal = calcularDataComDiasUteis(dataInicial, quantidadeDias);
    
    // Mostrar preview
    previewElement.style.display = 'block';
    dataPreviewElement.textContent = `${formatarDataBrasileira(dataFinal)} (${quantidadeDias} dias úteis a partir de ${dataBaseTexto})`;
}

// Event listener para atualizar preview quando mudar os valores
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que o modal foi criado
    setTimeout(() => {
        const quantidadeInput = document.getElementById('quantidadeDias');
        const dataBaseSelect = document.getElementById('dataBase');
        
        if (quantidadeInput) {
            quantidadeInput.addEventListener('input', calcularPreviewDiasUteis);
        }
        
        if (dataBaseSelect) {
            dataBaseSelect.addEventListener('change', calcularPreviewDiasUteis);
        }
    }, 100);
});

// Função para abrir modal de novo cliente a partir de contratos
function abrirModalNovoClienteContrato() {
    // Limpar formulário
    document.getElementById('novoClienteContratoForm').reset();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('novoClienteContratoModal'));
    modal.show();
}

// Função para salvar novo cliente a partir de contratos
async function salvarNovoClienteContrato() {
    const nome = document.getElementById('nomeClienteContrato').value.trim();
    const cpf = document.getElementById('cpfClienteContrato').value.trim();
    
    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    
    // Validar CPF se preenchido
    if (cpf && !validarCPF(cpf)) {
        showToast('CPF inválido. Digite apenas números (11 dígitos)', 'error');
        return;
    }
    
    const formData = {
        nome: nome,
        cpf: cpf || null
    };
    
    // Adicionar endereço se preenchido
    const cidade = document.getElementById('cidadeClienteContrato').value.trim();
    const estado = document.getElementById('estadoClienteContrato').value;
    
    if (cidade && estado) {
        formData.endereco = {
            rua: document.getElementById('ruaClienteContrato').value.trim() || null,
            numero: document.getElementById('numeroClienteContrato').value.trim() || null,
            cidade: cidade,
            estado: estado,
            cep: document.getElementById('cepClienteContrato').value.trim() || null,
            complemento: document.getElementById('complementoClienteContrato').value.trim() || null
        };
    }
    
    // Desabilitar botão enquanto salva
    const saveButton = document.querySelector('#novoClienteContratoModal .btn-success');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Criando...';
    
    try {
        const result = await apiRequest('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showToast(`Cliente criado com sucesso (ID: ${result.id})`, 'success');
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('novoClienteContratoModal')).hide();
        
        // Recarregar clientes e selecionar o novo
        await carregarClientes();
        document.getElementById('cliente').value = result.id;
        
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        showToast('Erro ao criar cliente: ' + error.message, 'error');
    } finally {
        // Reabilitar botão
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}
