// Gerenciamento de Elevadores - Nova Estrutura
let elevadores = [];
let contratos = [];
let clientes = [];
let elevadorAtual = null;
let tabelaElevadores = null;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - inicializando elevadores');
    
    // Inicializar tabela com ordenação - aguardar dados serem carregados
    // tabelaElevadores será inicializada após o carregamento dos dados
    
    // Carregar dados imediatamente
    carregarDados();
    
    // Event listeners
    document.getElementById('corSelect').addEventListener('change', alterarSelecaoCor);
    
    // Event listeners para atualizar visualização da cabine
    const ladoEntradaSelect = document.getElementById('lado_entrada');
    const ladoSaidaSelect = document.getElementById('lado_saida');
    
    if (ladoEntradaSelect) {
        ladoEntradaSelect.addEventListener('change', atualizarVisualizacaoCabine);
    }
    
    if (ladoSaidaSelect) {
        ladoSaidaSelect.addEventListener('change', atualizarVisualizacaoCabine);
    }
    
    // Modal events
    document.getElementById('elevadorModal').addEventListener('hidden.bs.modal', function () {
        limparFormulario('elevadorForm');
        elevadorAtual = null;
        document.getElementById('modalTitle').textContent = 'Novo Elevador';
        
        // Garantir que as setas sejam limpas quando o modal for fechado
        setTimeout(() => {
            atualizarVisualizacaoCabine();
        }, 50);
    });
    
    // Evento quando o modal é aberto para garantir que os selects estejam preenchidos
    document.getElementById('elevadorModal').addEventListener('shown.bs.modal', function () {
        console.log('Modal de elevador aberto, verificando dados...');
        
        // Verificar se já existe um valor selecionado no contrato
        const contratoSelect = document.getElementById('id_contrato');
        const contratoAtualValue = contratoSelect.value;
        
        // Se não temos contratos carregados, carregá-los agora
        if (contratos.length === 0) {
            console.log('Contratos não carregados, carregando agora...');
            carregarContratos().then(() => {
                preencherSelectContratos();
                // Restaurar valor se havia um selecionado
                if (contratoAtualValue) {
                    contratoSelect.value = contratoAtualValue;
                }
            });
        } else {
            // Só preencher se o select estiver vazio (novo elevador)
            if (contratoSelect.options.length <= 1) {
                console.log('Select vazio, preenchendo contratos...');
                preencherSelectContratos();
                // Restaurar valor se havia um selecionado
                if (contratoAtualValue) {
                    contratoSelect.value = contratoAtualValue;
                }
            } else {
                console.log('Select já preenchido, mantendo valores...');
            }
        }
    });
});

// Carregar todos os dados necessários
async function carregarDados() {
    try {
        console.log('=== INICIANDO CARREGAMENTO DE DADOS ===');
        
        // Carregar dados em sequência para garantir dependências
        console.log('1. Carregando clientes...');
        await carregarClientes();
        console.log('1. Clientes carregados:', clientes.length);
        
        console.log('2. Carregando contratos...');
        await carregarContratos();
        console.log('2. Contratos carregados:', contratos.length);
        
        console.log('3. Carregando elevadores...');
        await carregarElevadoresSemRender();
        console.log('3. Elevadores carregados:', elevadores.length);
        
        console.log('4. Carregando estados...');
        await carregarEstados();
        console.log('4. Estados carregados');
        
        console.log('5. Dados carregados:', {
            elevadores: elevadores.length,
            contratos: contratos.length,
            clientes: clientes.length
        });
        
        console.log('6. Preenchendo select de contratos...');
        preencherSelectContratos();
        
        console.log('7. Renderizando elevadores...');
        renderizarElevadores();
        
        console.log('8. Inicializando TabelaOrdenavel...');
        // Inicializar tabela com ordenação após dados carregados
        tabelaElevadores = new TabelaOrdenavel('elevadoresTable', elevadores, renderizarElevadores);
        
        console.log('=== CARREGAMENTO CONCLUÍDO ===');
        
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

// Carregar elevadores sem renderizar (para uso na inicialização)
async function carregarElevadoresSemRender() {
    try {
        elevadores = await apiRequest('/api/elevadores');
        console.log('Elevadores carregados (sem render):', elevadores);
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
    console.log('Abrindo modal novo contrato...');
    
    // Limpar formulário
    document.getElementById('novoContratoForm').reset();
    
    // Garantir que clientes estejam carregados e preencher select
    if (clientes.length === 0) {
        console.log('Clientes não carregados, carregando agora...');
        carregarClientes().then(() => {
            preencherSelectClientesContrato();
        });
    } else {
        preencherSelectClientesContrato();
    }
    
    // Definir data de hoje como padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVendaContrato').value = hoje;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('novoContratoModal'));
    modal.show();
}

// Preencher select de clientes no modal de contrato
function preencherSelectClientesContrato() {
    console.log('Preenchendo select de clientes para contrato...');
    const select = document.getElementById('clienteContrato');
    
    if (!select) {
        console.error('Elemento clienteContrato não encontrado!');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    if (!clientes || clientes.length === 0) {
        console.warn('Nenhum cliente disponível');
        select.innerHTML += '<option value="" disabled>Nenhum cliente encontrado</option>';
        return;
    }
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
    
    console.log(`Select de clientes preenchido com ${clientes.length} clientes`);
}

// Salvar novo contrato
async function salvarNovoContrato() {
    // Validar campos obrigatórios usando a nova função
    if (!validarCamposObrigatorios('novoContratoForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    // Limpar erros se validação passou
    limparErrosCampos('novoContratoForm');
    
    const clienteId = document.getElementById('clienteContrato').value;
    const dataVenda = document.getElementById('dataVendaContrato').value;
    const dataEntrega = document.getElementById('dataEntregaContrato').value;
    
    // Obter vendedor
    let vendedor = '';
    const vendedorSelect = document.getElementById('vendedorContrato');
    const vendedorCustom = document.getElementById('vendedorContratoCustom');
    
    if (vendedorCustom.style.display !== 'none' && vendedorCustom.value.trim()) {
        vendedor = vendedorCustom.value.trim();
    } else if (vendedorSelect.value) {
        vendedor = vendedorSelect.value;
    }
    
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
        data_entrega: dataEntrega || null,
        vendedor: vendedor || null
    };
    
    try {
        const novoContrato = await apiRequest('/api/contratos', {
            method: 'POST',
            body: JSON.stringify(contratoData)
        });
        
        showToast('Contrato criado com sucesso!', 'success');
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('novoContratoModal')).hide();
        
        // Recarregar contratos e clientes para atualizar todas as dependências
        await carregarContratos();
        await carregarClientes();
        
        // Atualizar selects e tabela
        preencherSelectContratos();
        renderizarElevadores();
        
        // Selecionar o novo contrato
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
    
    // Resetar para pessoa física por padrão
    document.getElementById('comercialClienteElevador').value = 'false';
    
    // Carregar estados
    carregarEstados();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('novoClienteElevadorModal'));
    
    // Configurar o tipo de cliente quando o modal for totalmente mostrado
    const modalElement = document.getElementById('novoClienteElevadorModal');
    modalElement.addEventListener('shown.bs.modal', function handler() {
        alterarTipoClienteElevador();
        // Remover o event listener após usar para evitar duplicatas
        modalElement.removeEventListener('shown.bs.modal', handler);
    });
    
    modal.show();
}

// Função para alterar tipo de cliente no contexto de elevador
function alterarTipoClienteElevador() {
    const comercial = document.getElementById('comercialClienteElevador').value === 'true';
    const labelDocumento = document.getElementById('labelDocumentoClienteElevador');
    const inputDocumento = document.getElementById('documentoClienteElevador');
    
    // Verificar se os elementos existem
    if (!labelDocumento || !inputDocumento) {
        console.warn('Elementos do formulário de elevador não encontrados ainda');
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
    inputDocumento.removeEventListener('input', limitarDigitosCPFElevador);
    inputDocumento.removeEventListener('input', limitarDigitosCNPJElevador);
    
    // Adicionar event listener apropriado
    if (comercial) {
        inputDocumento.addEventListener('input', limitarDigitosCNPJElevador);
        console.log('Event listener CNPJ elevador configurado');
    } else {
        inputDocumento.addEventListener('input', limitarDigitosCPFElevador);
        console.log('Event listener CPF elevador configurado');
    }
}

// Função para limitar entrada de CPF no contexto de elevador (máximo 11 dígitos)
function limitarDigitosCPFElevador(event) {
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

// Função para limitar entrada de CNPJ no contexto de elevador (máximo 14 dígitos)
function limitarDigitosCNPJElevador(event) {
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

// Salvar novo cliente
async function salvarNovoClienteElevador() {
    // Validar campos obrigatórios usando a nova função
    if (!validarCamposObrigatorios('novoClienteElevadorForm')) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    // Limpar erros se validação passou
    limparErrosCampos('novoClienteElevadorForm');
    
    const nome = document.getElementById('nomeClienteElevador').value.trim();
    const comercial = document.getElementById('comercialClienteElevador').value === 'true';
    const documento = document.getElementById('documentoClienteElevador').value.trim();
    
    // Validar documento se preenchido
    if (documento && !validarDocumento(documento)) {
        const tipoDoc = comercial ? 'CNPJ' : 'CPF';
        showToast(`${tipoDoc} inválido. Verifique se todos os dígitos estão corretos`, 'error');
        return;
    }
    
    const clienteData = {
        nome: nome,
        comercial: comercial,
        documento: documento ? documento.replace(/\D/g, '') : null
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

// ===== FUNÇÕES PARA SELEÇÃO DE CONTRATOS =====

// Abrir modal de seleção de contratos
function abrirModalSelecionarContrato() {
    console.log('Abrindo modal de seleção de contratos...');
    
    // Preencher lista de contratos
    preencherListaContratos();
    
    // Limpar busca
    document.getElementById('buscarContrato').value = '';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('selecionarContratoModal'));
    modal.show();
}

// Preencher lista de contratos no modal
function preencherListaContratos(filtro = '') {
    const tbody = document.getElementById('listaContratos');
    tbody.innerHTML = '';
    
    if (!contratos || contratos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum contrato encontrado</td></tr>';
        return;
    }
    
    const contratosFiltrados = contratos.filter(contrato => {
        if (!filtro) return true;
        
        const cliente = clientes.find(c => c.id === contrato.id_cliente);
        const clienteNome = cliente ? cliente.nome.toLowerCase() : (contrato.cliente_nome || '').toLowerCase();
        const dataVenda = contrato.data_venda ? new Date(contrato.data_venda).toLocaleDateString('pt-BR') : '';
        const dataEntrega = contrato.data_entrega ? new Date(contrato.data_entrega).toLocaleDateString('pt-BR') : '';
        
        return clienteNome.includes(filtro.toLowerCase()) ||
               contrato.id.toString().includes(filtro) ||
               dataVenda.includes(filtro) ||
               dataEntrega.includes(filtro);
    });
    
    if (contratosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum contrato encontrado com os termos de busca</td></tr>';
        return;
    }
    
    contratosFiltrados.forEach(contrato => {
        const cliente = clientes.find(c => c.id === contrato.id_cliente);
        const clienteNome = cliente ? cliente.nome : contrato.cliente_nome || 'Cliente não encontrado';
        const dataVenda = contrato.data_venda ? new Date(contrato.data_venda).toLocaleDateString('pt-BR') : 'N/A';
        const dataEntrega = contrato.data_entrega ? new Date(contrato.data_entrega).toLocaleDateString('pt-BR') : 'N/A';
        
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td><strong>#${contrato.id}</strong></td>
            <td>${clienteNome}</td>
            <td>${dataVenda}</td>
            <td>${dataEntrega}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="selecionarContrato(${contrato.id}, '${clienteNome}', '${dataVenda}', '${dataEntrega}')">
                    <i class="fas fa-check"></i> Selecionar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para filtrar contratos
function filtrarContratos() {
    const filtro = document.getElementById('buscarContrato').value;
    preencherListaContratos(filtro);
}

// Selecionar um contrato específico
function selecionarContrato(contratoId, clienteNome, dataVenda, dataEntrega) {
    console.log('Selecionando contrato:', contratoId);
    
    // Definir valor no select
    document.getElementById('id_contrato').value = contratoId;
    
    // Fechar modal
    bootstrap.Modal.getInstance(document.getElementById('selecionarContratoModal')).hide();
    
    // Mostrar confirmação
    showToast(`Contrato #${contratoId} - ${clienteNome} selecionado`, 'success');
}

// ===== FIM DAS FUNÇÕES PARA SELEÇÃO DE CONTRATOS =====

// Função para criar novo elevador
function novoElevador() {
    console.log('Abrindo modal para novo elevador...');
    
    elevadorAtual = null;
    document.getElementById('modalTitle').textContent = 'Novo Elevador';
    
    // Limpar formulário
    if (typeof limparFormulario === 'function') {
        limparFormulario('elevadorForm');
    } else {
        document.getElementById('elevadorForm').reset();
    }
    
    // Garantir que as setas estejam escondidas após limpar o formulário
    setTimeout(() => {
        atualizarVisualizacaoCabine();
    }, 50);
    
    // Garantir que os dados estejam carregados - mas não renderizar novamente!
    if (contratos.length === 0 || clientes.length === 0) {
        console.log('Dados não carregados, carregando apenas contratos e clientes...');
        Promise.all([carregarContratos(), carregarClientes()]).then(() => {
            preencherSelectContratos();
        });
    } else {
        preencherSelectContratos();
    }
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('elevadorModal'));
    modal.show();
}

// ===== FUNÇÕES PARA GERENCIAR ELEVADORES =====

// Renderizar elevadores na tabela
function renderizarElevadores(dadosParaRenderizar = elevadores) {
    console.log('Renderizando elevadores...');
    
    const tbody = document.querySelector('#elevadoresTable tbody');
    if (!tbody) {
        console.error('Tbody não encontrado!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (dadosParaRenderizar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Nenhum elevador encontrado</td></tr>';
        return;
    }
    
    dadosParaRenderizar.forEach(elevador => {
        const contrato = contratos.find(c => c.id === elevador.id_contrato);
        const cliente = contrato ? clientes.find(c => c.id === contrato.id_cliente) : null;
        
        const cabineDescricao = elevador.cabine ? 
            `${elevador.cabine.altura}×${elevador.cabine.largura}×${elevador.cabine.profundidade}` : 
            'N/A';
            
        const elevacao = elevador.coluna ? elevador.coluna.elevacao : 'N/A';
        
        let dataEntrega = 'N/A';
        try {
            dataEntrega = contrato && contrato.data_entrega ? 
                formatarData(contrato.data_entrega) : 'N/A';
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            dataEntrega = 'Erro na data';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${elevador.id}</td>
            <td>${cliente ? cliente.nome : 'N/A'}</td>
            <td>${contrato ? contrato.id : 'N/A'}</td>
            <td>${cabineDescricao}</td>
            <td>${elevacao}</td>
            <td>
                ${elevador.cor || 'N/A'}
            </td>
            <td>
                <span class="badge ${obterCorStatus(elevador.status)}">${elevador.status || 'Não iniciado'}</span>
            </td>
            <td>${dataEntrega}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-info" onclick="visualizarElevador(${elevador.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
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
    
    console.log(`${dadosParaRenderizar.length} elevadores renderizados com sucesso`);
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

// Visualizar elevador
function visualizarElevador(elevadorId) {
    const elevador = elevadores.find(e => e.id === elevadorId);
    if (!elevador) return;
    
    // Buscar dados relacionados
    const contrato = contratos.find(c => c.id === elevador.id_contrato);
    const cliente = contrato ? clientes.find(c => c.id === contrato.id_cliente) : null;
    
    // Preencher informações básicas
    document.getElementById('viewElevadorContrato').textContent = 
        contrato ? `#${contrato.id} - ${cliente ? cliente.nome : 'Cliente não encontrado'}` : 'N/A';
    document.getElementById('viewElevadorComando').textContent = elevador.comando || 'N/A';
    document.getElementById('viewElevadorStatus').innerHTML = 
        `<span class="badge ${obterCorStatus(elevador.status)}">${elevador.status || 'Não iniciado'}</span>`;
    document.getElementById('viewElevadorPortaInferior').textContent = elevador.porta_inferior || 'N/A';
    document.getElementById('viewElevadorPortaSuperior').textContent = elevador.porta_superior || 'N/A';
    document.getElementById('viewElevadorCor').textContent = elevador.cor || 'N/A';
    document.getElementById('viewElevadorObservacao').textContent = elevador.observacao || 'N/A';
    
    // Preencher dados da cabine
    if (elevador.cabine) {
        document.getElementById('viewElevadorAltura').textContent = elevador.cabine.altura || 'N/A';
        document.getElementById('viewElevadorLargura').textContent = elevador.cabine.largura || 'N/A';
        document.getElementById('viewElevadorProfundidade').textContent = elevador.cabine.profundidade || 'N/A';
        document.getElementById('viewElevadorPiso').textContent = elevador.cabine.piso || 'N/A';
        document.getElementById('viewElevadorLadoEntrada').textContent = elevador.cabine.lado_entrada || 'N/A';
        document.getElementById('viewElevadorLadoSaida').textContent = elevador.cabine.lado_saida || 'N/A';
        document.getElementById('viewElevadorCabineMontada').innerHTML = 
            elevador.cabine.cabine_montada ? '<span class="badge bg-success">Sim</span>' : '<span class="badge bg-secondary">Não</span>';
    } else {
        document.getElementById('viewElevadorAltura').textContent = 'N/A';
        document.getElementById('viewElevadorLargura').textContent = 'N/A';
        document.getElementById('viewElevadorProfundidade').textContent = 'N/A';
        document.getElementById('viewElevadorPiso').textContent = 'N/A';
        document.getElementById('viewElevadorLadoEntrada').textContent = 'N/A';
        document.getElementById('viewElevadorLadoSaida').textContent = 'N/A';
        document.getElementById('viewElevadorCabineMontada').innerHTML = '<span class="badge bg-secondary">N/A</span>';
    }
    
    // Preencher dados da coluna
    if (elevador.coluna) {
        document.getElementById('viewElevadorElevacao').textContent = elevador.coluna.elevacao || 'N/A';
        document.getElementById('viewElevadorColunaMontada').innerHTML = 
            elevador.coluna.coluna_montada ? '<span class="badge bg-success">Sim</span>' : '<span class="badge bg-secondary">Não</span>';
    } else {
        document.getElementById('viewElevadorElevacao').textContent = 'N/A';
        document.getElementById('viewElevadorColunaMontada').innerHTML = '<span class="badge bg-secondary">N/A</span>';
    }
    
    // Preencher adicionais
    if (elevador.adicionais) {
        // Campos numéricos - mostrar o valor
        document.getElementById('viewElevadorCancela').textContent = 
            elevador.adicionais.cancela || '0';
        document.getElementById('viewElevadorPorta').textContent = 
            elevador.adicionais.porta || '0';
        document.getElementById('viewElevadorPortao').textContent = 
            elevador.adicionais.portao || '0';
        document.getElementById('viewElevadorBarreiraEletronica').textContent = 
            elevador.adicionais.barreira_eletronica || '0';
        document.getElementById('viewElevadorLadosEnclausuramento').textContent = 
            elevador.adicionais.lados_enclausuramento || '0';
        document.getElementById('viewElevadorSensorEsmagamento').textContent = 
            elevador.adicionais.sensor_esmagamento || '0';
        document.getElementById('viewElevadorRampaAcesso').textContent = 
            elevador.adicionais.rampa_acesso || '0';
        document.getElementById('viewElevadorNobreak').textContent = 
            elevador.adicionais.nobreak || '0';
        
        // Campo booleano - mostrar Sim/Não
        document.getElementById('viewElevadorGalvanizada').innerHTML = 
            elevador.adicionais.galvanizada ? '<span class="badge bg-success">Sim</span>' : '<span class="badge bg-secondary">Não</span>';
    } else {
        document.getElementById('viewElevadorCancela').textContent = '0';
        document.getElementById('viewElevadorPorta').textContent = '0';
        document.getElementById('viewElevadorPortao').textContent = '0';
        document.getElementById('viewElevadorBarreiraEletronica').textContent = '0';
        document.getElementById('viewElevadorLadosEnclausuramento').textContent = '0';
        document.getElementById('viewElevadorSensorEsmagamento').textContent = '0';
        document.getElementById('viewElevadorRampaAcesso').textContent = '0';
        document.getElementById('viewElevadorNobreak').textContent = '0';
        document.getElementById('viewElevadorGalvanizada').innerHTML = '<span class="badge bg-secondary">N/A</span>';
    }
    
    // Atualizar desenho da cabine
    atualizarDesenhoCabineVisualizacao(elevador);
    
    // Armazenar ID do elevador atual para o botão de editar
    window.elevadorVisualizacaoAtual = elevadorId;
    
    // Abrir modal
    new bootstrap.Modal(document.getElementById('visualizarElevadorModal')).show();
}

// Editar elevador a partir da visualização
function editarElevadorFromView() {
    if (window.elevadorVisualizacaoAtual) {
        // Fechar modal de visualização
        const modalVisualizacao = bootstrap.Modal.getInstance(document.getElementById('visualizarElevadorModal'));
        if (modalVisualizacao) {
            modalVisualizacao.hide();
        }
        
        // Abrir modal de edição
        setTimeout(() => {
            editarElevador(window.elevadorVisualizacaoAtual);
        }, 300); // Pequeno delay para permitir que o modal de visualização feche primeiro
    }
}

// Editar elevador
async function editarElevador(elevadorId) {
    const elevador = elevadores.find(e => e.id === elevadorId);
    if (!elevador) return;
    
    elevadorAtual = elevador;
    document.getElementById('modalTitle').textContent = 'Editar Elevador';
    
    // Garantir que os selects estejam preenchidos antes de definir valores
    const contratoSelect = document.getElementById('id_contrato');
    
    // Se o select não está preenchido, preenchê-lo primeiro
    if (contratoSelect.options.length <= 1) {
        await preencherSelectContratos();
    }
    
    // Preencher dados básicos imediatamente
    document.getElementById('elevadorId').value = elevador.id;
    document.getElementById('id_contrato').value = elevador.id_contrato || '';
    document.getElementById('comando').value = elevador.comando || '';
    document.getElementById('porta_inferior').value = elevador.porta_inferior || '';
    document.getElementById('porta_superior').value = elevador.porta_superior || '';
    document.getElementById('observacao').value = elevador.observacao || '';
    
    // Aplicar coloração aos campos preenchidos
    alterarCorCampo(document.getElementById('id_contrato'));
    alterarCorCampo(document.getElementById('comando'));
    alterarCorCampo(document.getElementById('porta_inferior'));
    alterarCorCampo(document.getElementById('porta_superior'));
    alterarCorCampo(document.getElementById('observacao'));
    
    // Preencher cor
    if (elevador.cor) {
        const corSelect = document.getElementById('corSelect');
        const corCustom = document.getElementById('corCustom');
        const corOptions = Array.from(corSelect.options).map(opt => opt.value);
        
        if (corOptions.includes(elevador.cor)) {
            corSelect.value = elevador.cor;
            corCustom.style.display = 'none';
            corSelect.style.display = 'block';
        } else {
            // Cor customizada
            corSelect.style.display = 'none';
            corCustom.style.display = 'block';
            corCustom.value = elevador.cor;
        }
    }
    
    // Preencher status
    if (elevador.status) {
        const statusSelect = document.getElementById('statusSelect');
        const statusCustom = document.getElementById('statusCustom');
        const statusOptions = Array.from(statusSelect.options).map(opt => opt.value);
        
        if (statusOptions.includes(elevador.status)) {
            statusSelect.value = elevador.status;
            statusCustom.style.display = 'none';
            statusSelect.style.display = 'block';
        } else {
            // Status customizado
            statusSelect.style.display = 'none';
            statusCustom.style.display = 'block';
            statusCustom.value = elevador.status;
        }
    } else {
        document.getElementById('statusSelect').value = 'Não iniciado';
    }
    
    // Preencher dados da cabine
    if (elevador.cabine) {
        // Tratar altura especialmente
        const alturaSelect = document.getElementById('alturaSelect');
        const alturaInput = document.getElementById('altura');
        const alturaValue = elevador.cabine.altura;
        
        if (alturaValue) {
            // Verificar se é um dos valores predefinidos
            if (alturaValue === 1100 || alturaValue === 2100) {
                alturaSelect.value = alturaValue.toString();
                alturaInput.style.display = 'none';
                alturaSelect.style.display = 'block';
                alturaInput.required = false;
                alturaSelect.required = true;
            } else {
                // Altura customizada
                alturaSelect.style.display = 'none';
                alturaInput.style.display = 'block';
                alturaInput.value = alturaValue;
                alturaInput.required = true;
                alturaSelect.required = false;
            }
        }
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
    
    // Atualizar visualização da cabine após preencher os dados
    setTimeout(() => {
        if (typeof atualizarVisualizacaoCabine === 'function') {
            atualizarVisualizacaoCabine();
        }
    }, 100);
}

// Salvar elevador
async function salvarElevador() {
    try {
        // Validar campos obrigatórios usando a nova função
        if (!validarCamposObrigatorios('elevadorForm')) {
            showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
            return;
        }
        
        // Limpar erros se validação passou
        limparErrosCampos('elevadorForm');
        
        // Obter valores dos campos obrigatórios
        const contrato = document.getElementById('id_contrato').value;
        const comando = document.getElementById('comando').value;
        const largura = document.getElementById('largura').value;
        const profundidade = document.getElementById('profundidade').value;
        const elevacao = document.getElementById('elevacao').value;
        
        // Obter altura (pode vir do select ou do input customizado)
        let altura = '';
        const alturaSelect = document.getElementById('alturaSelect');
        const alturaInput = document.getElementById('altura');
        
        if (alturaInput.style.display !== 'none' && alturaInput.value) {
            altura = alturaInput.value;
        } else if (alturaSelect.value && alturaSelect.value !== 'custom') {
            altura = alturaSelect.value;
        }
        
        // Obter cor final
        let corFinal = '';
        const corSelect = document.getElementById('corSelect');
        const corCustom = document.getElementById('corCustom');
        
        if (corCustom.style.display !== 'none' && corCustom.value) {
            corFinal = corCustom.value.trim();
        } else if (corSelect.value) {
            corFinal = corSelect.value;
        }
        
        // Obter status final
        let statusFinal = '';
        const statusSelect = document.getElementById('statusSelect');
        const statusCustom = document.getElementById('statusCustom');
        
        if (statusCustom.style.display !== 'none' && statusCustom.value) {
            statusFinal = statusCustom.value.trim();
        } else if (statusSelect.value) {
            statusFinal = statusSelect.value;
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
        
        console.log('Dados do elevador a serem enviados:', elevadorData);
        
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
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const blob = await response.blob();
        
        // Verificar se o blob tem conteúdo
        if (blob.size === 0) {
            throw new Error('PDF vazio recebido do servidor');
        }
        
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
}

// Atualizar desenho da cabine na visualização
function atualizarDesenhoCabineVisualizacao(elevador) {    
    // Esconder todas as setas inicialmente e remover classes de sobreposição
    const setasEntrada = ['viewEntradaEsquerda', 'viewEntradaDireita', 'viewEntradaOposta'];
    const setasSaida = ['viewSaidaEsquerda', 'viewSaidaDireita', 'viewSaidaOposta'];
    
    // Sempre esconder todas as setas primeiro
    [...setasEntrada, ...setasSaida].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
            elemento.classList.remove('com-saida', 'com-entrada');
        }
    });
    
    let setaEntrada = null;
    let setaSaida = null;
    let ladoEntrada = null;
    let ladoSaida = null;
    
    // Determinar qual seta de entrada mostrar APENAS se há valor válido
    if (elevador.cabine && elevador.cabine.lado_entrada && elevador.cabine.lado_entrada.trim()) {
        ladoEntrada = elevador.cabine.lado_entrada.toLowerCase().trim();
        switch(ladoEntrada) {
            case 'esquerda':
            case 'esquerdo':
                setaEntrada = document.getElementById('viewEntradaEsquerda');
                break;
            case 'direita':
            case 'direito':
                setaEntrada = document.getElementById('viewEntradaDireita');
                break;
            case 'oposta':
            case 'oposto':
                setaEntrada = document.getElementById('viewEntradaOposta');
                break;
        }
    }
    
    // Determinar qual seta de saída mostrar APENAS se há valor válido
    if (elevador.cabine && elevador.cabine.lado_saida && elevador.cabine.lado_saida.trim()) {
        ladoSaida = elevador.cabine.lado_saida.toLowerCase().trim();
        switch(ladoSaida) {
            case 'esquerda':
            case 'esquerdo':
                setaSaida = document.getElementById('viewSaidaEsquerda');
                break;
            case 'direita':
            case 'direito':
                setaSaida = document.getElementById('viewSaidaDireita');
                break;
            case 'oposta':
            case 'oposto':
                setaSaida = document.getElementById('viewSaidaOposta');
                break;
        }
    }
    
    // Verificar se há sobreposição (mesmo lado)
    const mesmoLado = ladoEntrada && ladoSaida && 
        ((ladoEntrada === 'esquerda' || ladoEntrada === 'esquerdo') && (ladoSaida === 'esquerda' || ladoSaida === 'esquerdo')) ||
        ((ladoEntrada === 'direita' || ladoEntrada === 'direito') && (ladoSaida === 'direita' || ladoSaida === 'direito')) ||
        ((ladoEntrada === 'oposta' || ladoEntrada === 'oposto') && (ladoSaida === 'oposta' || ladoSaida === 'oposto'));
    
    // Mostrar e posicionar setas APENAS se encontradas
    if (setaEntrada) {
        setaEntrada.style.display = 'flex';
        
        // Se há sobreposição, aplicar classe para reposicionamento
        if (mesmoLado && setaSaida) {
            setaEntrada.classList.add('com-saida');
        }
    }
    
    if (setaSaida) {
        setaSaida.style.display = 'flex';
        
        // Se há sobreposição, aplicar classe para reposicionamento
        if (mesmoLado && setaEntrada) {
            setaSaida.classList.add('com-entrada');
        }
    }
}

// Atualizar desenho da cabine no modal de criação/edição
function atualizarVisualizacaoCabine() {
    // Esconder todas as setas inicialmente e remover classes de sobreposição
    const setasEntrada = ['entradaEsquerda', 'entradaDireita', 'entradaOposta'];
    const setasSaida = ['saidaEsquerda', 'saidaDireita', 'saidaOposta'];
    
    // Sempre esconder todas as setas primeiro
    [...setasEntrada, ...setasSaida].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
            elemento.classList.remove('com-saida', 'com-entrada');
        }
    });
    
    // Obter valores dos selects
    const ladoEntradaSelect = document.getElementById('lado_entrada');
    const ladoSaidaSelect = document.getElementById('lado_saida');
    
    if (!ladoEntradaSelect || !ladoSaidaSelect) {
        return;
    }
    
    const ladoEntrada = ladoEntradaSelect.value ? ladoEntradaSelect.value.toLowerCase().trim() : null;
    const ladoSaida = ladoSaidaSelect.value ? ladoSaidaSelect.value.toLowerCase().trim() : null;
    
    // Se não há valores selecionados, não mostrar nenhuma seta
    if (!ladoEntrada && !ladoSaida) {
        return;
    }
    
    let setaEntrada = null;
    let setaSaida = null;
    
    // Determinar qual seta de entrada mostrar APENAS se há valor selecionado
    if (ladoEntrada) {
        switch(ladoEntrada) {
            case 'esquerda':
            case 'esquerdo':
                setaEntrada = document.getElementById('entradaEsquerda');
                break;
            case 'direita':
            case 'direito':
                setaEntrada = document.getElementById('entradaDireita');
                break;
            case 'oposta':
            case 'oposto':
                setaEntrada = document.getElementById('entradaOposta');
                break;
        }
    }
    
    // Determinar qual seta de saída mostrar APENAS se há valor selecionado
    if (ladoSaida) {
        switch(ladoSaida) {
            case 'esquerda':
            case 'esquerdo':
                setaSaida = document.getElementById('saidaEsquerda');
                break;
            case 'direita':
            case 'direito':
                setaSaida = document.getElementById('saidaDireita');
                break;
            case 'oposta':
            case 'oposto':
                setaSaida = document.getElementById('saidaOposta');
                break;
        }
    }
    
    // Verificar se há sobreposição (mesmo lado)
    const mesmoLado = ladoEntrada && ladoSaida && 
        ((ladoEntrada === 'esquerda' || ladoEntrada === 'esquerdo') && (ladoSaida === 'esquerda' || ladoSaida === 'esquerdo')) ||
        ((ladoEntrada === 'direita' || ladoEntrada === 'direito') && (ladoSaida === 'direita' || ladoSaida === 'direito')) ||
        ((ladoEntrada === 'oposta' || ladoEntrada === 'oposto') && (ladoSaida === 'oposta' || ladoSaida === 'oposto'));
    
    // Mostrar e posicionar setas
    if (setaEntrada) {
        setaEntrada.style.display = 'flex';
        
        // Se há sobreposição, aplicar classe para reposicionamento
        if (mesmoLado && setaSaida) {
            setaEntrada.classList.add('com-saida');
        }
    }
    
    if (setaSaida) {
        setaSaida.style.display = 'flex';
        
        // Se há sobreposição, aplicar classe para reposicionamento
        if (mesmoLado && setaEntrada) {
            setaSaida.classList.add('com-entrada');
        }
    }
}
// Função para imprimir a visualização do elevador
function imprimirVisualizacaoElevador() {
    console.log('Imprimindo visualização do elevador...');
    
    // Salvar o título original da página
    const tituloOriginal = document.title;
    
    // Obter o ID do elevador atual
    const elevadorId = window.elevadorVisualizacaoAtual ? window.elevadorVisualizacaoAtual.id : 'N/A';
    
    // Alterar título para a impressão
    document.title = `Elevador ${elevadorId} - Visualização`;
    
    // Criar uma nova janela de impressão com apenas o conteúdo do modal
    const modalContent = document.querySelector('#visualizarElevadorModal .modal-body').cloneNode(true);
    
    // Criar documento para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Elevador ${elevadorId} - Visualização</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px;
                    background: white;
                }
                .card { 
                    border: 1px solid #ddd; 
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                .card-header { 
                    background-color: #f8f9fa; 
                    font-weight: bold;
                    padding: 10px 15px;
                }
                .card-body { 
                    padding: 15px; 
                }
                .form-label { 
                    font-weight: bold; 
                    color: #495057;
                }
                .form-control-plaintext { 
                    margin: 0; 
                    padding: 5px 0;
                    border-bottom: 1px solid #eee;
                }
                .row { 
                    margin-bottom: 10px; 
                }
                h1 {
                    text-align: center;
                    color: #0d6efd;
                    margin-bottom: 30px;
                    font-size: 24px;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #0d6efd;
                    padding-bottom: 15px;
                }
                .print-date {
                    text-align: right;
                    color: #6c757d;
                    font-size: 12px;
                    margin-bottom: 20px;
                }
                @media print {
                    body { 
                        margin: 0; 
                        padding: 15px;
                    }
                    .card {
                        box-shadow: none;
                        border: 1px solid #000;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1><i class="fas fa-elevator"></i> Visualização do Elevador ${elevadorId}</h1>
            </div>
            <div class="print-date">
                Impresso em: ${new Date().toLocaleString('pt-BR')}
            </div>
            <div class="container-fluid">
                ${modalContent.innerHTML}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };
    
    // Restaurar título original
    document.title = tituloOriginal;
}
