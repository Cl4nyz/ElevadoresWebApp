// Gerenciamento de Elevadores - Nova Estrutura
let elevadores = [];
let contratos = [];
let clientes = [];
let elevadorAtual = null;
let tabelaElevadores = null;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - inicializando elevadores');
    
    // Inicializar tabela com ordenação
    tabelaElevadores = new TabelaOrdenavel('elevadoresTable');
    
    carregarDados();
    
    // Event listeners
    document.getElementById('corSelect').addEventListener('change', alterarSelecaoCor);
    
    // Modal events
    document.getElementById('elevadorModal').addEventListener('hidden.bs.modal', function () {
        limparFormulario('elevadorForm');
        elevadorAtual = null;
        document.getElementById('modalTitle').textContent = 'Novo Elevador';
    });
});

// Carregar todos os dados necessários
async function carregarDados() {
    try {
        console.log('Iniciando carregamento de dados...');
        
        await Promise.all([
            carregarElevadores(),
            carregarContratos(),
            carregarClientes(),
            carregarEstados()
        ]);
        
        console.log('Dados carregados:', {
            elevadores: elevadores.length,
            contratos: contratos.length,
            clientes: clientes.length
        });
        
        preencherSelectContratos();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados: ' + error.message, 'error');
    }
}

// Carregar elevadores
async function carregarElevadores() {
    try {
        elevadores = await apiRequest('/api/elevadores');
        console.log('Elevadores carregados:', elevadores);
        renderizarElevadores();
    } catch (error) {
        console.error('Erro ao carregar elevadores:', error);
        showToast('Erro ao carregar elevadores: ' + error.message, 'error');
    }
}

// Carregar contratos
async function carregarContratos() {
    try {
        contratos = await apiRequest('/api/contratos');
        console.log('Contratos carregados:', contratos);
    } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        showToast('Erro ao carregar contratos: ' + error.message, 'error');
    }
}

// Carregar clientes
async function carregarClientes() {
    try {
        clientes = await apiRequest('/api/clientes');
        console.log('Clientes carregados:', clientes);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar clientes: ' + error.message, 'error');
    }
}

// Preencher select de contratos
function preencherSelectContratos() {
    console.log('Preenchendo select de contratos...');
    const select = document.getElementById('id_contrato');
    
    if (!select) {
        console.error('Elemento id_contrato não encontrado!');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione um contrato...</option>';
    
    if (!contratos || contratos.length === 0) {
        console.warn('Nenhum contrato disponível');
        return;
    }
    
    contratos.forEach(contrato => {
        const cliente = clientes.find(c => c.id === contrato.id_cliente);
        const clienteNome = cliente ? cliente.nome : contrato.cliente_nome || 'Cliente não encontrado';
        
        // Formatar datas
        const dataVenda = contrato.data_venda ? new Date(contrato.data_venda).toLocaleDateString('pt-BR') : 'N/A';
        const dataEntrega = contrato.data_entrega ? new Date(contrato.data_entrega).toLocaleDateString('pt-BR') : 'N/A';
        
        const option = document.createElement('option');
        option.value = contrato.id;
        
        // Texto detalhado: Contrato #ID - Cliente - Venda: DD/MM/AAAA - Entrega: DD/MM/AAAA
        option.textContent = `Contrato #${contrato.id} - ${clienteNome} - Venda: ${dataVenda} - Entrega: ${dataEntrega}`;
        
        select.appendChild(option);
    });
    
    console.log(`Select preenchido com ${contratos.length} contratos`);
}

// ===== FUNÇÕES PARA CRIAR NOVO CONTRATO =====

// Carregar estados para o modal de cliente
async function carregarEstados() {
    try {
        const response = await apiRequest('/api/relatorios/opcoes-filtros');
        const selectEstado = document.getElementById('estadoClienteElevador');
        if (selectEstado && response.estados) {
            selectEstado.innerHTML = '<option value="">Selecione...</option>';
            response.estados.forEach(estado => {
                selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar estados:', error);
    }
}

// Abrir modal para criar novo contrato
function abrirModalNovoContrato() {
    // Limpar formulário
    document.getElementById('novoContratoForm').reset();
    
    // Carregar clientes no select
    preencherSelectClientesContrato();
    
    // Definir data de hoje como padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVendaContrato').value = hoje;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('novoContratoModal'));
    modal.show();
}

// Preencher select de clientes no modal de contrato
function preencherSelectClientesContrato() {
    const select = document.getElementById('clienteContrato');
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    if (clientes && clientes.length > 0) {
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            select.appendChild(option);
        });
    }
}

// Calcular data de entrega (30 dias úteis)
function calcularDataEntregaContrato() {
    const dataVenda = document.getElementById('dataVendaContrato').value;
    if (!dataVenda) {
        showToast('Informe primeiro a data da venda', 'warning');
        return;
    }
    
    // Calcular 30 dias úteis
    let dataAtual = new Date(dataVenda + 'T00:00:00');
    let diasAdicionados = 0;
    
    while (diasAdicionados < 30) {
        dataAtual.setDate(dataAtual.getDate() + 1);
        
        // Verificar se é dia útil (segunda a sexta)
        const diaSemana = dataAtual.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasAdicionados++;
        }
    }
    
    const dataFormatada = dataAtual.toISOString().split('T')[0];
    document.getElementById('dataEntregaContrato').value = dataFormatada;
    
    showToast('Data de entrega calculada: ' + dataAtual.toLocaleDateString('pt-BR'), 'info');
}

// Salvar novo contrato
async function salvarNovoContrato() {
    const clienteId = document.getElementById('clienteContrato').value;
    const dataVenda = document.getElementById('dataVendaContrato').value;
    const dataEntrega = document.getElementById('dataEntregaContrato').value;
    
    if (!clienteId) {
        showToast('Selecione um cliente', 'error');
        return;
    }
    
    // Validar datas se ambas estiverem preenchidas
    if (dataVenda && dataEntrega) {
        const dVenda = new Date(dataVenda + 'T00:00:00');
        const dEntrega = new Date(dataEntrega + 'T00:00:00');
        
        if (dEntrega < dVenda) {
            showToast('A data de entrega não pode ser anterior à data da venda', 'error');
            return;
        }
    }
    
    const contratoData = {
        id_cliente: parseInt(clienteId),
        data_venda: dataVenda || null,
        data_entrega: dataEntrega || null
    };
    
    try {
        const novoContrato = await apiRequest('/api/contratos', {
            method: 'POST',
            body: JSON.stringify(contratoData)
        });
        
        showToast('Contrato criado com sucesso!', 'success');
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('novoContratoModal')).hide();
        
        // Recarregar contratos e selecionar o novo
        await carregarContratos();
        preencherSelectContratos();
        document.getElementById('id_contrato').value = novoContrato.id;
        
    } catch (error) {
        console.error('Erro ao criar contrato:', error);
        showToast('Erro ao criar contrato: ' + error.message, 'error');
    }
}

// Abrir modal para criar novo cliente
function abrirModalNovoClienteElevador() {
    // Limpar formulário
    document.getElementById('novoClienteElevadorForm').reset();
    
    // Carregar estados
    carregarEstados();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('novoClienteElevadorModal'));
    modal.show();
}

// Salvar novo cliente
async function salvarNovoClienteElevador() {
    const nome = document.getElementById('nomeClienteElevador').value.trim();
    const cpf = document.getElementById('cpfClienteElevador').value.trim();
    
    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    
    const clienteData = {
        nome: nome,
        cpf: cpf || null
    };
    
    // Adicionar endereço se preenchido
    const cidade = document.getElementById('cidadeClienteElevador').value.trim();
    const estado = document.getElementById('estadoClienteElevador').value;
    
    if (cidade && estado) {
        clienteData.endereco = {
            rua: document.getElementById('ruaClienteElevador').value.trim() || null,
            numero: document.getElementById('numeroClienteElevador').value.trim() || null,
            cidade: cidade,
            estado: estado,
            cep: document.getElementById('cepClienteElevador').value.trim() || null,
            complemento: document.getElementById('complementoClienteElevador').value.trim() || null
        };
    }
    
    try {
        const novoCliente = await apiRequest('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
        
        showToast('Cliente criado com sucesso!', 'success');
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('novoClienteElevadorModal')).hide();
        
        // Recarregar clientes e selecionar o novo no modal de contrato
        await carregarClientes();
        preencherSelectClientesContrato();
        document.getElementById('clienteContrato').value = novoCliente.id;
        
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        showToast('Erro ao criar cliente: ' + error.message, 'error');
    }
}

// ===== FIM DAS FUNÇÕES PARA CRIAR NOVO CONTRATO =====

// Renderizar elevadores na tabela
function renderizarElevadores() {
    const tbody = document.querySelector('#elevadoresTable tbody');
    tbody.innerHTML = '';
    
    if (elevadores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Nenhum elevador encontrado</td></tr>';
        return;
    }
    
    elevadores.forEach(elevador => {
        const contrato = contratos.find(c => c.id === elevador.id_contrato);
        const cliente = contrato ? clientes.find(c => c.id === contrato.id_cliente) : null;
        
        const cabineDescricao = elevador.cabine ? 
            `${elevador.cabine.altura}×${elevador.cabine.largura}×${elevador.cabine.profundidade}` : 
            'N/A';
            
        const elevacao = elevador.coluna ? elevador.coluna.elevacao : 'N/A';
        
        const dataEntrega = contrato && contrato.data_entrega ? 
            formatarData(contrato.data_entrega) : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${elevador.id}</td>
            <td>${cliente ? cliente.nome : 'N/A'}</td>
            <td>${contrato ? contrato.id : 'N/A'}</td>
            <td>${cabineDescricao}</td>
            <td>${elevacao}</td>
            <td>
                ${elevador.cor ? 
                    `<span class="badge" style="background-color: ${elevador.cor.toLowerCase()}; color: ${obterCorTexto(elevador.cor.toLowerCase())};">${elevador.cor}</span>` :
                   '<span class="badge bg-secondary">Sem cor</span>'
                }
            </td>
            <td>
                <span class="badge ${obterCorStatus(elevador.status)}">${elevador.status || 'Não iniciado'}</span>
            </td>
            <td>${dataEntrega}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarElevador(${elevador.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="gerarPDF(${elevador.id})" title="Gerar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirElevador(${elevador.id}))" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Atualizar busca da tabela
    if (tabelaElevadores) {
        tabelaElevadores.atualizarBusca();
    }
}

// Função para determinar cor do texto baseada na cor de fundo
function obterCorTexto(corFundo) {
    // Cores claras que precisam de texto escuro
    const coresClaras = ['white', 'yellow', 'lime', 'cyan', 'silver', 'lightgray', 'lightblue', 'lightgreen'];
    
    if (coresClaras.some(cor => corFundo.includes(cor))) {
        return 'black';
    }
    return 'white';
}

// Função para obter cor do badge baseada no status
function obterCorStatus(status) {
    switch (status) {
        case 'Não iniciado':
            return 'bg-secondary';
        case 'Em produção':
            return 'bg-warning';
        case 'Pronto':
            return 'bg-success';
        case 'Entregue':
            return 'bg-primary';
        default:
            return 'bg-info';
    }
}

// Função para alterar seleção de cor (chamada do HTML)
function alterarSelecaoCor() {
    const select = document.getElementById('corSelect');
    const input = document.getElementById('corCustom');
    
    if (select.value === 'custom') {
        input.style.display = 'block';
        input.focus();
        input.required = true;
    } else {
        input.style.display = 'none';
        input.required = false;
        input.value = '';
    }
}

// Editar elevador
function editarElevador(elevadorId) {
    const elevador = elevadores.find(e => e.id === elevadorId);
    if (!elevador) return;
    
    elevadorAtual = elevador;
    document.getElementById('modalTitle').textContent = 'Editar Elevador';
    
    // Preencher dados básicos
    document.getElementById('elevadorId').value = elevador.id;
    document.getElementById('id_contrato').value = elevador.id_contrato || '';
    document.getElementById('comando').value = elevador.comando || '';
    document.getElementById('porta_inferior').value = elevador.porta_inferior || '';
    document.getElementById('porta_superior').value = elevador.porta_superior || '';
    document.getElementById('observacao').value = elevador.observacao || '';
    
    // Preencher cor
    if (elevador.cor) {
        const corSelect = document.getElementById('corSelect');
        const corOptions = Array.from(corSelect.options).map(opt => opt.value);
        if (corOptions.includes(elevador.cor)) {
            corSelect.value = elevador.cor;
        } else {
            corSelect.value = 'custom';
            document.getElementById('corCustom').value = elevador.cor;
            document.getElementById('corCustom').style.display = 'block';
        }
    }
    
    // Preencher status
    if (elevador.status) {
        const statusSelect = document.getElementById('statusSelect');
        const statusOptions = Array.from(statusSelect.options).map(opt => opt.value);
        if (statusOptions.includes(elevador.status)) {
            statusSelect.value = elevador.status;
        } else {
            statusSelect.value = 'custom';
            document.getElementById('statusCustom').value = elevador.status;
            document.getElementById('statusCustom').style.display = 'block';
        }
    } else {
        document.getElementById('statusSelect').value = 'Não iniciado';
    }
    
    // Preencher dados da cabine
    if (elevador.cabine) {
        document.getElementById('altura').value = elevador.cabine.altura || '';
        document.getElementById('largura').value = elevador.cabine.largura || '';
        document.getElementById('profundidade').value = elevador.cabine.profundidade || '';
        document.getElementById('piso').value = elevador.cabine.piso || '';
        document.getElementById('lado_entrada').value = elevador.cabine.lado_entrada || '';
        document.getElementById('lado_saida').value = elevador.cabine.lado_saida || '';
        document.getElementById('montada_cabine').checked = elevador.cabine.montada || false;
    }
    
    // Preencher dados da coluna
    if (elevador.coluna) {
        document.getElementById('elevacao').value = elevador.coluna.elevacao || '';
        document.getElementById('montada_coluna').checked = elevador.coluna.montada || false;
    }
    
    // Preencher adicionais
    if (elevador.adicionais) {
        document.getElementById('cancela').value = elevador.adicionais.cancela || 0;
        document.getElementById('porta').value = elevador.adicionais.porta || 0;
        document.getElementById('portao').value = elevador.adicionais.portao || 0;
        document.getElementById('barreira_eletronica').value = elevador.adicionais.barreira_eletronica || 0;
        document.getElementById('lados_enclausuramento').value = elevador.adicionais.lados_enclausuramento || 0;
        document.getElementById('sensor_esmagamento').value = elevador.adicionais.sensor_esmagamento || 0;
        document.getElementById('rampa_acesso').value = elevador.adicionais.rampa_acesso || 0;
        document.getElementById('nobreak').value = elevador.adicionais.nobreak || 0;
        document.getElementById('galvanizada').checked = elevador.adicionais.galvanizada || false;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('elevadorModal'));
    modal.show();
}

// Salvar elevador
async function salvarElevador() {
    try {
        // Validar campos obrigatórios
        const contrato = document.getElementById('id_contrato').value;
        const comando = document.getElementById('comando').value;
        const altura = document.getElementById('altura').value;
        const largura = document.getElementById('largura').value;
        const profundidade = document.getElementById('profundidade').value;
        const elevacao = document.getElementById('elevacao').value;
        
        if (!contrato || !comando || !altura || !largura || !profundidade || !elevacao) {
            showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
            return;
        }
        
        // Obter cor final
        let corFinal = '';
        const corSelect = document.getElementById('corSelect').value;
        if (corSelect === 'custom') {
            corFinal = document.getElementById('corCustom').value.trim();
        } else if (corSelect) {
            corFinal = corSelect;
        }
        
        // Obter status final
        let statusFinal = '';
        const statusSelect = document.getElementById('statusSelect').value;
        if (statusSelect === 'custom') {
            statusFinal = document.getElementById('statusCustom').value.trim();
        } else if (statusSelect) {
            statusFinal = statusSelect;
        }
        
        // Preparar dados do elevador
        const elevadorData = {
            id_contrato: parseInt(contrato),
            comando: comando,
            porta_inferior: document.getElementById('porta_inferior').value || null,
            porta_superior: document.getElementById('porta_superior').value || null,
            cor: corFinal || null,
            status: statusFinal || 'Não iniciado',
            observacao: document.getElementById('observacao').value || null,
            
            // Dados da cabine
            cabine: {
                altura: parseInt(altura),
                largura: parseInt(largura),
                profundidade: parseInt(profundidade),
                piso: document.getElementById('piso').value || null,
                lado_entrada: document.getElementById('lado_entrada').value || null,
                lado_saida: document.getElementById('lado_saida').value || null,
                montada: document.getElementById('montada_cabine').checked
            },
            
            // Dados da coluna
            coluna: {
                elevacao: parseInt(elevacao),
                montada: document.getElementById('montada_coluna').checked
            },
            
            // Adicionais
            adicionais: {
                cancela: parseInt(document.getElementById('cancela').value) || 0,
                porta: parseInt(document.getElementById('porta').value) || 0,
                portao: parseInt(document.getElementById('portao').value) || 0,
                barreira_eletronica: parseInt(document.getElementById('barreira_eletronica').value) || 0,
                lados_enclausuramento: parseInt(document.getElementById('lados_enclausuramento').value) || 0,
                sensor_esmagamento: parseInt(document.getElementById('sensor_esmagamento').value) || 0,
                rampa_acesso: parseInt(document.getElementById('rampa_acesso').value) || 0,
                nobreak: parseInt(document.getElementById('nobreak').value) || 0,
                galvanizada: document.getElementById('galvanizada').checked
            }
        };
        
        let response;
        if (elevadorAtual) {
            // Atualizar elevador existente
            response = await apiRequest(`/api/elevadores/${elevadorAtual.id}`, {
                method: 'PUT',
                body: JSON.stringify(elevadorData)
            });
            showToast('Elevador atualizado com sucesso', 'success');
        } else {
            // Criar novo elevador
            response = await apiRequest('/api/elevadores', {
                method: 'POST',
                body: JSON.stringify(elevadorData)
            });
            showToast('Elevador criado com sucesso', 'success');
        }
        
        // Fechar modal e recarregar dados
        bootstrap.Modal.getInstance(document.getElementById('elevadorModal')).hide();
        carregarElevadores();
        
    } catch (error) {
        console.error('Erro ao salvar elevador:', error);
        showToast('Erro ao salvar elevador: ' + error.message, 'error');
    }
}

// Excluir elevador
async function excluirElevador(elevadorId) {
    try {
        await apiRequest(`/api/elevadores/${elevadorId}`, {
            method: 'DELETE'
        });
        showToast('Elevador excluído com sucesso', 'success');
        carregarElevadores();
    } catch (error) {
        console.error('Erro ao excluir elevador:', error);
        showToast('Erro ao excluir elevador: ' + error.message, 'error');
    }
}

// Gerar PDF
async function gerarPDF(elevadorId) {
    try {
        showToast('Gerando PDF...', 'info');
        
        const response = await fetch(`/api/elevadores/${elevadorId}/pdf`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao gerar PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elevador_${elevadorId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('PDF gerado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
    }
}// Renderizar elevadores na tabelafunction renderizarElevadores() {    const tbody = document.querySelector('#elevadoresTable tbody');    tbody.innerHTML = '';        if (elevadores.length === 0) {        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum elevador encontrado</td></tr>';        return;    }        elevadores.forEach(elevador => {        const contrato = contratos.find(c => c.id === elevador.id_contrato);        const cliente = contrato ? clientes.find(c => c.id === contrato.id_cliente) : null;                const cabineDescricao = elevador.cabine ?             `${elevador.cabine.altura}×${elevador.cabine.largura}×${elevador.cabine.profundidade}` :             'N/A';                    const elevacao = elevador.coluna ? elevador.coluna.elevacao : 'N/A';                const dataEntrega = contrato && contrato.data_entrega ?             formatarData(contrato.data_entrega) : 'N/A';                const row = document.createElement('tr');        row.innerHTML = `            <td>${elevador.id}</td>            <td>${cliente ? cliente.nome : 'N/A'}</td>            <td>${contrato ? contrato.id : 'N/A'}</td>            <td>${cabineDescricao}</td>            <td>${elevacao}</td>            <td>                ${elevador.cor ?                     `<span class="badge" style="background-color: ${elevador.cor.toLowerCase()}; color: ${obterCorTexto(elevador.cor.toLowerCase())};">${elevador.cor}</span>` :                    '<span class="badge bg-secondary">Sem cor</span>'                }            </td>            <td>${dataEntrega}</td>            <td>                <div class="btn-group">                    <button class="btn btn-sm btn-outline-primary" onclick="editarElevador(${elevador.id})" title="Editar">                        <i class="fas fa-edit"></i>                    </button>                    <button class="btn btn-sm btn-outline-success" onclick="gerarPDF(${elevador.id})" title="Gerar PDF">                        <i class="fas fa-file-pdf"></i>                    </button>                    <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(() => excluirElevador(${elevador.id}))" title="Excluir">                        <i class="fas fa-trash"></i>                    </button>                </div>            </td>        `;        tbody.appendChild(row);    });        // Atualizar busca da tabela    if (tabelaElevadores) {        tabelaElevadores.atualizarBusca();    }}// Função para determinar cor do texto baseada na cor de fundofunction obterCorTexto(corFundo) {    // Cores claras que precisam de texto escuro    const coresClaras = ['white', 'yellow', 'lime', 'cyan', 'silver', 'lightgray', 'lightblue', 'lightgreen'];        if (coresClaras.some(cor => corFundo.includes(cor))) {        return 'black';    }    return 'white';}// Editar elevadorfunction editarElevador(elevadorId) {    const elevador = elevadores.find(e => e.id === elevadorId);    if (!elevador) return;        elevadorAtual = elevador;    document.getElementById('modalTitle').textContent = 'Editar Elevador';        // Preencher dados básicos    document.getElementById('elevadorId').value = elevador.id;    document.getElementById('id_contrato').value = elevador.id_contrato || '';    document.getElementById('comando').value = elevador.comando || '';    document.getElementById('porta_inferior').value = elevador.porta_inferior || '';    document.getElementById('porta_superior').value = elevador.porta_superior || '';    document.getElementById('observacao').value = elevador.observacao || '';        // Preencher cor    if (elevador.cor) {        const corSelect = document.getElementById('corSelect');        const corOptions = Array.from(corSelect.options).map(opt => opt.value);        if (corOptions.includes(elevador.cor)) {            corSelect.value = elevador.cor;        } else {            corSelect.value = 'custom';            document.getElementById('corCustom').value = elevador.cor;            document.getElementById('corCustom').style.display = 'block';        }    }        // Preencher dados da cabine    if (elevador.cabine) {        document.getElementById('altura').value = elevador.cabine.altura || '';        document.getElementById('largura').value = elevador.cabine.largura || '';        document.getElementById('profundidade').value = elevador.cabine.profundidade || '';        document.getElementById('piso').value = elevador.cabine.piso || '';        document.getElementById('lado_entrada').value = elevador.cabine.lado_entrada || '';        document.getElementById('lado_saida').value = elevador.cabine.lado_saida || '';        document.getElementById('montada_cabine').checked = elevador.cabine.montada || false;    }        // Preencher dados da coluna    if (elevador.coluna) {        document.getElementById('elevacao').value = elevador.coluna.elevacao || '';        document.getElementById('montada_coluna').checked = elevador.coluna.montada || false;    }        // Preencher adicionais    if (elevador.adicionais) {        document.getElementById('cancela').value = elevador.adicionais.cancela || 0;        document.getElementById('porta').value = elevador.adicionais.porta || 0;        document.getElementById('portao').value = elevador.adicionais.portao || 0;        document.getElementById('barreira_eletronica').value = elevador.adicionais.barreira_eletronica || 0;        document.getElementById('lados_enclausuramento').value = elevador.adicionais.lados_enclausuramento || 0;        document.getElementById('sensor_esmagamento').value = elevador.adicionais.sensor_esmagamento || 0;        document.getElementById('rampa_acesso').value = elevador.adicionais.rampa_acesso || 0;        document.getElementById('nobreak').value = elevador.adicionais.nobreak || 0;        document.getElementById('galvanizada').checked = elevador.adicionais.galvanizada || false;    }        const modal = new bootstrap.Modal(document.getElementById('elevadorModal'));    modal.show();}// Salvar elevadorasync function salvarElevador() {    try {        // Validar campos obrigatórios        const contrato = document.getElementById('id_contrato').value;        const comando = document.getElementById('comando').value;        const altura = document.getElementById('altura').value;        const largura = document.getElementById('largura').value;        const profundidade = document.getElementById('profundidade').value;        const elevacao = document.getElementById('elevacao').value;                if (!contrato || !comando || !altura || !largura || !profundidade || !elevacao) {            showToast('Por favor, preencha todos os campos obrigatórios', 'warning');            return;        }                // Obter cor final        let corFinal = '';        const corSelect = document.getElementById('corSelect').value;        if (corSelect === 'custom') {            corFinal = document.getElementById('corCustom').value.trim();        } else if (corSelect) {            corFinal = corSelect;        }                // Preparar dados do elevador        const elevadorData = {            id_contrato: parseInt(contrato),            comando: comando,            porta_inferior: document.getElementById('porta_inferior').value || null,            porta_superior: document.getElementById('porta_superior').value || null,            cor: corFinal || null,            observacao: document.getElementById('observacao').value || null,                        // Dados da cabine            cabine: {                altura: parseInt(altura),                largura: parseInt(largura),                profundidade: parseInt(profundidade),                piso: document.getElementById('piso').value || null,                lado_entrada: document.getElementById('lado_entrada').value || null,                lado_saida: document.getElementById('lado_saida').value || null,                montada: document.getElementById('montada_cabine').checked            },                        // Dados da coluna            coluna: {                elevacao: parseInt(elevacao),                montada: document.getElementById('montada_coluna').checked            },                        // Adicionais            adicionais: {                cancela: parseInt(document.getElementById('cancela').value) || 0,                porta: parseInt(document.getElementById('porta').value) || 0,                portao: parseInt(document.getElementById('portao').value) || 0,                barreira_eletronica: parseInt(document.getElementById('barreira_eletronica').value) || 0,                lados_enclausuramento: parseInt(document.getElementById('lados_enclausuramento').value) || 0,                sensor_esmagamento: parseInt(document.getElementById('sensor_esmagamento').value) || 0,                rampa_acesso: parseInt(document.getElementById('rampa_acesso').value) || 0,                nobreak: parseInt(document.getElementById('nobreak').value) || 0,                galvanizada: document.getElementById('galvanizada').checked            }        };                let response;        if (elevadorAtual) {            // Atualizar elevador existente            response = await apiRequest(`/api/elevadores/${elevadorAtual.id}`, {                method: 'PUT',                body: JSON.stringify(elevadorData)            });            showToast('Elevador atualizado com sucesso', 'success');        } else {            // Criar novo elevador            response = await apiRequest('/api/elevadores', {                method: 'POST',                body: JSON.stringify(elevadorData)            });            showToast('Elevador criado com sucesso', 'success');        }                // Fechar modal e recarregar dados        bootstrap.Modal.getInstance(document.getElementById('elevadorModal')).hide();        carregarElevadores();            } catch (error) {        console.error('Erro ao salvar elevador:', error);        showToast('Erro ao salvar elevador: ' + error.message, 'error');    }}// Excluir elevadorasync function excluirElevador(elevadorId) {    try {        await apiRequest(`/api/elevadores/${elevadorId}`, {            method: 'DELETE'        });        showToast('Elevador excluído com sucesso', 'success');        carregarElevadores();    } catch (error) {        console.error('Erro ao excluir elevador:', error);        showToast('Erro ao excluir elevador: ' + error.message, 'error');    }}// Gerar PDFasync function gerarPDF(elevadorId) {    try {        showToast('Gerando PDF...', 'info');                const response = await fetch(`/api/elevadores/${elevadorId}/pdf`, {            method: 'GET'        });                if (!response.ok) {            throw new Error('Erro ao gerar PDF');        }                const blob = await response.blob();        const url = window.URL.createObjectURL(blob);        const a = document.createElement('a');        a.href = url;        a.download = `elevador_${elevadorId}.pdf`;        document.body.appendChild(a);        a.click();        document.body.removeChild(a);        window.URL.revokeObjectURL(url);                showToast('PDF gerado com sucesso', 'success');    } catch (error) {        console.error('Erro ao gerar PDF:', error);        showToast('Erro ao gerar PDF: ' + error.message, 'error');    }}// Função para alterar seleção de cor (chamada do HTML)function alterarSelecaoCor() {    const select = document.getElementById('corSelect');    const input = document.getElementById('corCustom');        if (select.value === 'custom') {        input.style.display = 'block';        input.focus();        input.required = true;    } else {        input.style.display = 'none';        input.required = false;        input.value = '';    }}