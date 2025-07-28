// Gerenciamento de Contratos
let contratos = [];
let clientes = [];
let contratoAtual = null;
let dataCalculada = null;

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
        renderizarTabelaContratos();
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
        // Corrigir timezone para evitar subtração de 1 dia
        const dataEntrega = contrato.data_entrega ? new Date(contrato.data_entrega + 'T00:00:00') : null;
        
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
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarContrato(${contrato.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirContrato(${contrato.id}))" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para calcular dias úteis
function calcularDiasUteis() {
    const dataInicio = document.getElementById('dataInicio').value;
    const diasUteis = parseInt(document.getElementById('diasUteis').value);
    
    if (!dataInicio || !diasUteis) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    try {
        const dataFinal = adicionarDiasUteis(new Date(dataInicio + 'T00:00:00'), diasUteis);
        dataCalculada = dataFinal;
        
        const resultado = document.getElementById('resultadoCalculo');
        const dataResultado = document.getElementById('dataResultado');
        
        dataResultado.innerHTML = `
            <strong>Data final:</strong> ${dataFinal.toLocaleDateString('pt-BR')}<br>
            <small class="text-muted">Considerando ${diasUteis} dias úteis a partir de ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}</small>
        `;
        
        resultado.classList.remove('d-none');
        document.getElementById('btnUsarData').disabled = false;
        
    } catch (error) {
        showToast('Erro ao calcular data: ' + error.message, 'error');
    }
}

// Função para adicionar dias úteis a uma data
function adicionarDiasUteis(dataInicio, diasUteis) {
    let dataAtual = new Date(dataInicio);
    let diasAdicionados = 0;
    
    while (diasAdicionados < diasUteis) {
        dataAtual.setDate(dataAtual.getDate() + 1);
        
        // Verifica se é dia útil (segunda a sexta)
        const diaSemana = dataAtual.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
            diasAdicionados++;
        }
    }
    
    return dataAtual;
}

// Função para usar data calculada
function usarDataCalculada() {
    if (dataCalculada) {
        // Formatamos a data para o formato YYYY-MM-DD para o input date
        const dataFormatada = dataCalculada.toISOString().split('T')[0];
        document.getElementById('dataEntrega').value = dataFormatada;
        
        // Fechar modais
        const modalCalculadora = bootstrap.Modal.getInstance(document.getElementById('calculadoraDiasModal'));
        modalCalculadora.hide();
        
        showToast('Data de entrega atualizada com sucesso!', 'success');
    }
}

// Função para calcular data de entrega automaticamente
function calcularDataEntrega() {
    const dataVenda = document.getElementById('dataVenda').value;
    if (!dataVenda) {
        showToast('Informe primeiro a data da venda', 'warning');
        return;
    }
    
    // Calcular automaticamente 30 dias úteis
    const dataFinal = adicionarDiasUteis(new Date(dataVenda + 'T00:00:00'), 30);
    const dataFormatada = dataFinal.toISOString().split('T')[0];
    document.getElementById('dataEntrega').value = dataFormatada;
    
    showToast('Data de entrega calculada: ' + dataFinal.toLocaleDateString('pt-BR'), 'info');
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
        const novoCliente = await apiRequest('/api/clientes', 'POST', clienteData);
        
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
        showToast('Erro ao criar cliente: ' + error.message, 'error');
    }
}

// Função para formatar CPF
function formatarCPF(event) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    event.target.value = value;
}

// Função para formatar CEP
function formatarCEP(event) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    event.target.value = value;
}

// Função para abrir modal de contrato
function novoContrato() {
    contratoAtual = null;
    document.getElementById('modalTitle').textContent = 'Novo Contrato';
    limparFormulario('contratoForm');
    
    // Definir data da venda como hoje
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVenda').value = hoje;
    
    const modal = new bootstrap.Modal(document.getElementById('contratoModal'));
    modal.show();
}

// Função para editar contrato
function editarContrato(id) {
    const contrato = contratos.find(c => c.id === id);
    if (!contrato) return;
    
    contratoAtual = contrato;
    document.getElementById('modalTitle').textContent = 'Editar Contrato';
    
    // Preencher formulário
    document.getElementById('contratoId').value = contrato.id;
    document.getElementById('cliente').value = contrato.id_cliente || '';
    document.getElementById('dataVenda').value = contrato.data_venda || '';
    document.getElementById('dataEntrega').value = contrato.data_entrega || '';
    
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
    
    // Validar datas
    if (formData.data_venda && formData.data_entrega) {
        const dataVenda = new Date(formData.data_venda + 'T00:00:00');
        const dataEntrega = new Date(formData.data_entrega + 'T00:00:00');
        
        if (dataEntrega < dataVenda) {
            showToast('A data de entrega não pode ser anterior à data da venda', 'error');
            return;
        }
    }
    
    try {
        if (contratoAtual) {
            // Atualizar contrato existente
            await apiRequest(`/api/contratos/${contratoAtual.id}`, 'PUT', formData);
            showToast('Contrato atualizado com sucesso', 'success');
        } else {
            // Criar novo contrato
            await apiRequest('/api/contratos', 'POST', formData);
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
        await apiRequest(`/api/contratos/${id}`, 'DELETE');
        showToast('Contrato excluído com sucesso', 'success');
        carregarContratos();
    } catch (error) {
        console.error('Erro ao excluir contrato:', error);
        showToast('Erro ao excluir contrato: ' + error.message, 'error');
    }
}

// Adicionar event listener para abrir modal com botão "Novo Contrato"
document.addEventListener('DOMContentLoaded', function() {
    const novoContratoBtn = document.querySelector('[data-bs-target="#contratoModal"]');
    if (novoContratoBtn) {
        novoContratoBtn.addEventListener('click', novoContrato);
    }
});
