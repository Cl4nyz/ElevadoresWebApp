// Gerenciamento de Elevadores
let elevadores = [];
let contratos = [];
let cabines = [];
let clientes = [];
let elevadorAtual = null;

// Função para determinar cor do texto baseada na cor de fundo
function obterCorTexto(corFundo) {
    // Converter cor para RGB se necessário
    let r, g, b;
    
    if (corFundo.startsWith('#')) {
        // Cor hexadecimal
        const hex = corFundo.substring(1);
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
    } else if (corFundo.startsWith('rgb')) {
        // Cor RGB
        const matches = corFundo.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (matches) {
            r = parseInt(matches[1]);
            g = parseInt(matches[2]);
            b = parseInt(matches[3]);
        }
    } else {
        // Cores nomeadas comuns
        const cores = {
            'white': [255, 255, 255], 'black': [0, 0, 0], 'red': [255, 0, 0],
            'green': [0, 128, 0], 'blue': [0, 0, 255], 'yellow': [255, 255, 0],
            'cyan': [0, 255, 255], 'magenta': [255, 0, 255], 'gray': [128, 128, 128],
            'grey': [128, 128, 128], 'orange': [255, 165, 0], 'purple': [128, 0, 128],
            'brown': [165, 42, 42], 'pink': [255, 192, 203], 'lime': [0, 255, 0],
            'navy': [0, 0, 128], 'silver': [192, 192, 192], 'gold': [255, 215, 0]
        };
        
        const cor = cores[corFundo.toLowerCase()];
        if (cor) {
            [r, g, b] = cor;
        } else {
            // Se não reconhecer a cor, usar preto por padrão
            return 'black';
        }
    }
    
    // Calcular luminância usando fórmula padrão
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Se a cor for clara (luminância > 0.5), usar texto escuro, senão usar texto claro
    return luminancia > 0.5 ? 'black' : 'white';
}

// Carregar dados ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarElevadores();
    carregarContratos();
    carregarCabines();
    carregarClientes();
    
    // Event listener para checkbox de criar novo contrato
    document.getElementById('criarNovoContrato').addEventListener('change', function() {
        const section = document.getElementById('novoContratoSection');
        if (this.checked) {
            section.style.display = 'block';
            document.getElementById('contrato').disabled = true;
        } else {
            section.style.display = 'none';
            document.getElementById('contrato').disabled = false;
        }
    });
});

// Função para carregar elevadores
async function carregarElevadores() {
    try {
        elevadores = await apiRequest('/api/elevadores');
        renderizarTabelaElevadores();
    } catch (error) {
        console.error('Erro ao carregar elevadores:', error);
        showToast('Erro ao carregar elevadores: ' + error.message, 'error');
    }
}

// Função para carregar contratos
async function carregarContratos() {
    try {
        contratos = await apiRequest('/api/contratos');
        popularSelectContratos();
    } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        showToast('Erro ao carregar contratos: ' + error.message, 'error');
    }
}

// Função para carregar cabines (opções fixas)
async function carregarCabines() {
    try {
        cabines = await apiRequest('/api/cabines');
        popularSelectCabines();
    } catch (error) {
        console.error('Erro ao carregar cabines:', error);
        showToast('Erro ao carregar cabines: ' + error.message, 'error');
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

// Função para popular select de contratos
function popularSelectContratos() {
    const select = document.getElementById('contrato');
    select.innerHTML = '<option value="">Selecione um contrato</option>';
    
    contratos.forEach(contrato => {
        const option = document.createElement('option');
        option.value = contrato.id;
        option.textContent = `Contrato #${contrato.id} - ${contrato.cliente_nome || 'Cliente não encontrado'}`;
        select.appendChild(option);
    });
}

// Função para popular select de cabines (opções fixas)
function popularSelectCabines() {
    const select = document.getElementById('cabine');
    select.innerHTML = '<option value="">Selecione uma cabine</option>';
    
    cabines.forEach(cabine => {
        const option = document.createElement('option');
        option.value = cabine.id;
        option.textContent = cabine.descricao;
        select.appendChild(option);
    });
}

// Função para popular select de clientes
function popularSelectClientes() {
    const select = document.getElementById('clienteNovoContrato');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
}

// Função para renderizar tabela de elevadores
function renderizarTabelaElevadores() {
    const tbody = document.querySelector('#elevadoresTable tbody');
    tbody.innerHTML = '';
    
    elevadores.forEach(elevador => {
        const row = document.createElement('tr');
        
        // Cor do elevador como badge
        const corBadge = elevador.cor ? 
            `<span class="badge" style="background-color: ${elevador.cor.toLowerCase()}; color: ${obterCorTexto(elevador.cor)};">${elevador.cor}</span>` :
            '<span class="badge bg-secondary">Sem cor</span>';
        
        row.innerHTML = `
            <td>${elevador.id}</td>
            <td>${elevador.cliente_nome || 'N/A'}</td>
            <td>${elevador.id_contrato ? `#${elevador.id_contrato}` : 'N/A'}</td>
            <td>${elevador.cabine_descricao || 'N/A'}</td>
            <td>${elevador.elevacao} mm</td>
            <td>${corBadge}</td>
            <td>${formatarData(elevador.data_entrega)}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarElevador(${elevador.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirElevador(${elevador.id}))" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para abrir modal de elevador
function novoElevador() {
    elevadorAtual = null;
    document.getElementById('modalTitle').textContent = 'Novo Elevador';
    limparFormulario('elevadorForm');
    
    // Resetar seção de novo contrato
    document.getElementById('criarNovoContrato').checked = false;
    document.getElementById('novoContratoSection').style.display = 'none';
    document.getElementById('contrato').disabled = false;
    
    // Definir data da venda como hoje
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVendaNovo').value = hoje;
    
    const modal = new bootstrap.Modal(document.getElementById('elevadorModal'));
    modal.show();
}

// Função para editar elevador
function editarElevador(id) {
    const elevador = elevadores.find(e => e.id === id);
    if (!elevador) return;
    
    elevadorAtual = elevador;
    document.getElementById('modalTitle').textContent = 'Editar Elevador';
    
    // Preencher formulário
    document.getElementById('elevadorId').value = elevador.id;
    document.getElementById('contrato').value = elevador.id_contrato || '';
    document.getElementById('cabine').value = elevador.id_cabine;
    document.getElementById('elevacao').value = elevador.elevacao;
    document.getElementById('cor').value = elevador.cor || '';
    
    // Não mostrar seção de novo contrato no modo edição
    document.getElementById('criarNovoContrato').checked = false;
    document.getElementById('novoContratoSection').style.display = 'none';
    document.getElementById('contrato').disabled = false;
    
    const modal = new bootstrap.Modal(document.getElementById('elevadorModal'));
    modal.show();
}

// Função para salvar elevador
async function salvarElevador() {
    if (!validarFormulario('elevadorForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    let contratoId = document.getElementById('contrato').value || null;
    
    // Se criar novo contrato está marcado
    if (document.getElementById('criarNovoContrato').checked && !elevadorAtual) {
        const clienteId = document.getElementById('clienteNovoContrato').value;
        if (!clienteId) {
            showToast('Selecione um cliente para o novo contrato', 'warning');
            return;
        }
        
        try {
            // Criar novo contrato primeiro
            const novoContrato = await apiRequest('/api/contratos', {
                method: 'POST',
                body: JSON.stringify({
                    id_cliente: parseInt(clienteId),
                    data_venda: document.getElementById('dataVendaNovo').value || null,
                    data_entrega: document.getElementById('dataEntregaNovo').value || null
                })
            });
            
            contratoId = novoContrato.id;
            showToast('Novo contrato criado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao criar contrato:', error);
            showToast('Erro ao criar contrato: ' + error.message, 'error');
            return;
        }
    }
    
    const formData = {
        id_contrato: contratoId ? parseInt(contratoId) : null,
        id_cabine: parseInt(document.getElementById('cabine').value),
        elevacao: parseInt(document.getElementById('elevacao').value),
        cor: document.getElementById('cor').value || null
    };
    
    // Validar elevação
    if (formData.elevacao <= 0) {
        showToast('A elevação deve ser maior que zero', 'error');
        return;
    }
    
    try {
        if (elevadorAtual) {
            // Atualizar elevador existente
            await apiRequest(`/api/elevadores/${elevadorAtual.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            showToast('Elevador atualizado com sucesso', 'success');
        } else {
            // Criar novo elevador
            await apiRequest('/api/elevadores', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            showToast('Elevador criado com sucesso', 'success');
        }
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('elevadorModal')).hide();
        carregarElevadores();
        carregarContratos(); // Recarregar contratos se novo foi criado
        
    } catch (error) {
        console.error('Erro ao salvar elevador:', error);
        showToast('Erro ao salvar elevador: ' + error.message, 'error');
    }
}

// Função para excluir elevador
async function excluirElevador(id) {
    try {
        await apiRequest(`/api/elevadores/${id}`, {
            method: 'DELETE'
        });
        showToast('Elevador excluído com sucesso', 'success');
        carregarElevadores();
    } catch (error) {
        console.error('Erro ao excluir elevador:', error);
        showToast('Erro ao excluir elevador: ' + error.message, 'error');
    }
}

// Adicionar event listener para abrir modal com botão "Novo Elevador"
document.addEventListener('DOMContentLoaded', function() {
    const novoElevadorBtn = document.querySelector('[data-bs-target="#elevadorModal"]');
    if (novoElevadorBtn) {
        novoElevadorBtn.addEventListener('click', novoElevador);
    }
});
