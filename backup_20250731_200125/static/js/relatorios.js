// Gerenciamento de Relatórios - Versão Temporal
let dadosVendas = [];
let dadosTemporais = [];
let filtrosDisponiveis = {};

// Carregar dados ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarRelatorios();
});

// Função para mostrar/ocultar loading
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    } else if (show) {
        // Criar elemento de loading se não existir
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.className = 'text-center my-4';
        loading.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div>';
        const container = document.querySelector('.container') || document.body;
        container.prepend(loading);
    }
}

// Função principal para carregar relatórios
async function carregarRelatorios() {
    try {
        showLoading(true);
        
        // Carregar dados iniciais
        await Promise.all([
            carregarDadosVendas(),
            carregarDadosTemporais(),
            carregarFiltrosDisponiveis()
        ]);
        
        // Inicializar interface
        criarEstatisticas();
        criarTopEstados();
        criarResumoGeral();
        criarGraficoVendas();
        
        // Verificar tipo de visualização atual
        const tipoVisualizacao = document.getElementById('tipoVisualizacao')?.value;
        if (tipoVisualizacao === 'tabela') {
            criarTabelaEstados();
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao carregar relatórios: ' + error.message, 'error');
        } else {
            alert('Erro ao carregar relatórios: ' + error.message);
        }
        showLoading(false);
    }
}

// Função para carregar dados de vendas
async function carregarDadosVendas() {
    try {
        const dados = await apiRequest('/api/relatorios/vendas-por-estado');
        dadosVendas = dados;
        dadosOriginais = [...dados]; // Salvar cópia dos dados originais
        dadosFiltrados = [...dados]; // Inicializar dados filtrados
    } catch (error) {
        console.error('Erro ao carregar dados de vendas:', error);
        dadosVendas = [];
        dadosOriginais = [];
        dadosFiltrados = [];
    }
}

// Função para carregar dados temporais
async function carregarDadosTemporais() {
    try {
        const periodo = document.getElementById('periodoVisualizacao')?.value || 'ultimo-ano';
        const intervalo = document.getElementById('intervaloAmostras')?.value || 'mes';
        const estado = document.getElementById('filtroEstado')?.value || '';
        
        let url = `/api/relatorios/vendas-temporais?periodo=${periodo}&intervalo=${intervalo}`;
        if (estado) {
            url += `&estado=${estado}`;
        }
        
        // Se período personalizado, adicionar datas
        if (periodo === 'personalizado') {
            const dataInicio = document.getElementById('dataInicio')?.value;
            const dataFim = document.getElementById('dataFim')?.value;
            if (dataInicio && dataFim) {
                url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
            }
        }
        
        dadosTemporais = await apiRequest(url);
    } catch (error) {
        console.error('Erro ao carregar dados temporais:', error);
        dadosTemporais = [];
    }
}

// Função para carregar opções de filtros
async function carregarFiltrosDisponiveis() {
    try {
        filtrosDisponiveis = await apiRequest('/api/relatorios/opcoes-filtros');
        
        // Preencher select de estados
        const selectEstado = document.getElementById('filtroEstado');
        if (selectEstado) {
            selectEstado.innerHTML = '<option value="">Todos os estados</option>';
            if (filtrosDisponiveis.estados) {
                filtrosDisponiveis.estados.forEach(estado => {
                    selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        filtrosDisponiveis = { meses: [], estados: [] };
    }
}

// Função para criar estatísticas
function criarEstatisticas() {
    if (!dadosVendas || dadosVendas.length === 0) {
        console.log('Nenhum dado disponível para estatísticas');
        return;
    }
    
    // Calcular totais
    const totalElevadores = dadosVendas.reduce((sum, item) => sum + (item.total_elevadores || 0), 0);
    const totalClientes = dadosVendas.reduce((sum, item) => sum + (item.total_clientes || 0), 0);
    const totalEstados = dadosVendas.length;
    
    // Elevar elevação média
    const elevacaoTotal = dadosVendas.reduce((sum, item) => sum + (item.elevacao_media || 0), 0);
    const elevacaoMedia = totalElevadores > 0 ? (elevacaoTotal / dadosVendas.length) : 0;
    
    // Atualizar elementos na página
    updateElement('totalElevadores', totalElevadores);
    updateElement('totalClientes', totalClientes);
    updateElement('totalEstados', totalEstados);
    updateElement('elevacaoMedia', elevacaoMedia.toFixed(2) + 'm');
}

// Função para criar gráfico de vendas
function criarGraficoVendas() {
    if (!dadosTemporais || dadosTemporais.length === 0) {
        console.log('Nenhum dado temporal disponível para gráfico');
        return;
    }
    
    const ctx = document.getElementById('chartVendasPorEstado');
    if (!ctx) {
        console.log('Canvas do gráfico não encontrado');
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (chartVendas) {
        chartVendas.destroy();
    }
    
    // Preparar dados para o gráfico temporal
    const labels = dadosTemporais.map(item => item.periodo_label);
    const dataElevadores = dadosTemporais.map(item => item.total_elevadores || 0);
    
    // Cores para a linha
    const coresElevadores = '#007bff';
    
    chartVendas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Elevadores',
                    data: dataElevadores,
                    backgroundColor: coresElevadores + '20',
                    borderColor: coresElevadores,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução das Vendas de Elevadores ao Longo do Tempo'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Quantidade de Elevadores'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Período'
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const periodo = dadosTemporais[index];
                    if (periodo) {
                        console.log('Período selecionado:', periodo);
                        // Aqui podemos adicionar uma funcionalidade para mostrar detalhes do período
                    }
                }
            }
        }
    });
}

// Função para criar top estados
function criarTopEstados() {
    if (!dadosVendas || dadosVendas.length === 0) {
        console.log('Nenhum dado disponível para top estados');
        return;
    }
    
    // Ordenar por total de elevadores
    const topEstados = [...dadosVendas]
        .sort((a, b) => (b.total_elevadores || 0) - (a.total_elevadores || 0))
        .slice(0, 5);
    
    const container = document.getElementById('topEstados');
    if (container) {
        container.innerHTML = '';
        topEstados.forEach((estado, index) => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center cursor-pointer';
            item.style.cursor = 'pointer';
            item.setAttribute('title', 'Clique para ver contratos deste estado');
            item.innerHTML = `
                <div>
                    <strong>${estado.estado_nome || estado.estado}</strong>
                    <small class="text-muted d-block">${estado.total_clientes || 0} clientes</small>
                </div>
                <span class="badge bg-primary rounded-pill">${estado.total_elevadores || 0}</span>
            `;
            
            // Adicionar evento de clique
            item.addEventListener('click', () => {
                mostrarContratosDoEstado(estado.estado, estado.estado_nome || estado.estado);
            });
            
            // Adicionar efeito hover
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
            
            container.appendChild(item);
        });
    }
}

// Função para mostrar contratos de um estado específico
async function mostrarContratosDoEstado(siglaEstado, nomeEstado) {
    try {
        showLoading(true);
        
        // Buscar contratos do estado
        const contratos = await apiRequest(`/api/relatorios/contratos-por-estado/${siglaEstado}`);
        
        // Atualizar título do modal
        const modalTitle = document.getElementById('nomeEstadoModal');
        if (modalTitle) {
            modalTitle.textContent = nomeEstado;
        }
        
        // Criar conteúdo do modal
        const modalContent = document.getElementById('conteudoDetalhesEstado');
        if (modalContent) {
            if (contratos.length === 0) {
                modalContent.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <h5>Nenhum contrato encontrado</h5>
                        <p>Não há contratos registrados para o estado ${nomeEstado}.</p>
                    </div>
                `;
            } else {
                modalContent.innerHTML = `
                    <div class="mb-3">
                        <h6><i class="fas fa-chart-bar"></i> Resumo do Estado</h6>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="card border-primary">
                                    <div class="card-body text-center">
                                        <h5 class="text-primary">${contratos.length}</h5>
                                        <small>Contratos</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card border-success">
                                    <div class="card-body text-center">
                                        <h5 class="text-success">${contratos.reduce((sum, c) => sum + c.total_elevadores, 0)}</h5>
                                        <small>Elevadores</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card border-warning">
                                    <div class="card-body text-center">
                                        <h5 class="text-warning">${new Set(contratos.map(c => c.cliente_nome)).size}</h5>
                                        <small>Clientes</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card border-info">
                                    <div class="card-body text-center">
                                        <h5 class="text-info">${new Set(contratos.map(c => c.endereco.cidade)).size}</h5>
                                        <small>Cidades</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h6><i class="fas fa-list"></i> Lista de Contratos</h6>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Cidade</th>
                                    <th>Data Venda</th>
                                    <th>Data Entrega</th>
                                    <th>Elevadores</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaContratosEstado">
                                <!-- Contratos serão inseridos aqui -->
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
        
        // Popular tabela de contratos se houver contratos
        if (contratos.length > 0) {
            const tbody = document.getElementById('tabelaContratosEstado');
            if (tbody) {
                tbody.innerHTML = '';
                
                // Agrupar contratos por cliente
                const contratosPorCliente = {};
                contratos.forEach(contrato => {
                    const clienteId = contrato.cliente_id || 'sem_cliente';
                    if (!contratosPorCliente[clienteId]) {
                        contratosPorCliente[clienteId] = {
                            cliente: contrato.cliente_nome,
                            cpf: contrato.cliente_cpf,
                            contratos: []
                        };
                    }
                    contratosPorCliente[clienteId].contratos.push(contrato);
                });
                
                // Renderizar contratos agrupados
                Object.keys(contratosPorCliente).forEach(clienteId => {
                    const grupo = contratosPorCliente[clienteId];
                    const temMultiplosContratos = grupo.contratos.length > 1;
                    
                    if (temMultiplosContratos) {
                        // Criar linha do cliente com toggle
                        const clienteRow = document.createElement('tr');
                        clienteRow.className = 'table-secondary';
                        clienteRow.innerHTML = `
                            <td colspan="7">
                                <div class="d-flex align-items-center">
                                    <button class="btn btn-sm btn-link p-0 me-2" onclick="toggleContratosCliente('${clienteId}')" title="Expandir/Recolher">
                                        <i class="fas fa-chevron-right" id="toggle-${clienteId}"></i>
                                    </button>
                                    <strong><i class="fas fa-user"></i> ${grupo.cliente}</strong>
                                    <span class="badge bg-info ms-2">${grupo.contratos.length} contratos</span>
                                    ${grupo.cpf ? '<small class="text-muted ms-2">CPF: ' + grupo.cpf + '</small>' : ''}
                                </div>
                            </td>
                        `;
                        tbody.appendChild(clienteRow);
                        
                        // Adicionar contratos do cliente (inicialmente ocultos)
                        grupo.contratos.forEach(contrato => {
                            const row = document.createElement('tr');
                            row.className = `contrato-cliente-${clienteId} d-none`;
                            row.innerHTML = `
                                <td class="ps-4"><strong>#${contrato.id}</strong></td>
                                <td class="ps-4">
                                    <small class="text-muted">Contrato individual</small>
                                </td>
                                <td>
                                    ${contrato.endereco.cidade}
                                    <br><small class="text-muted">${contrato.endereco.rua}, ${contrato.endereco.numero}</small>
                                </td>
                                <td>${contrato.data_venda || '<span class="text-muted">-</span>'}</td>
                                <td>${contrato.data_entrega || '<span class="text-muted">-</span>'}</td>
                                <td>
                                    <span class="badge bg-primary">${contrato.total_elevadores}</span>
                                    ${contrato.elevacoes.length > 0 ? '<br><small class="text-muted">' + contrato.elevacoes.join(', ') + 'm</small>' : ''}
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalhesContrato(${contrato.id})" title="Ver detalhes">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            `;
                            tbody.appendChild(row);
                        });
                        
                    } else {
                        // Cliente com apenas um contrato - mostrar diretamente
                        const contrato = grupo.contratos[0];
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><strong>#${contrato.id}</strong></td>
                            <td>
                                <div>
                                    <strong>${contrato.cliente_nome}</strong>
                                    ${contrato.cliente_cpf ? '<br><small class="text-muted">CPF: ' + contrato.cliente_cpf + '</small>' : ''}
                                </div>
                            </td>
                            <td>
                                ${contrato.endereco.cidade}
                                <br><small class="text-muted">${contrato.endereco.rua}, ${contrato.endereco.numero}</small>
                            </td>
                            <td>${contrato.data_venda || '<span class="text-muted">-</span>'}</td>
                            <td>${contrato.data_entrega || '<span class="text-muted">-</span>'}</td>
                            <td>
                                <span class="badge bg-primary">${contrato.total_elevadores}</span>
                                ${contrato.elevacoes.length > 0 ? '<br><small class="text-muted">' + contrato.elevacoes.join(', ') + 'm</small>' : ''}
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="verDetalhesContrato(${contrato.id})" title="Ver detalhes">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    }
                });
            }
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalhesEstado'));
        modal.show();
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar contratos do estado:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao carregar contratos: ' + error.message, 'error');
        } else {
            alert('Erro ao carregar contratos: ' + error.message);
        }
        showLoading(false);
    }
}

// Função para fazer toggle dos contratos de um cliente
function toggleContratosCliente(clienteId) {
    const contratos = document.querySelectorAll(`.contrato-cliente-${clienteId}`);
    const toggleIcon = document.getElementById(`toggle-${clienteId}`);
    
    if (!contratos.length || !toggleIcon) return;
    
    const isVisible = !contratos[0].classList.contains('d-none');
    
    contratos.forEach(contrato => {
        if (isVisible) {
            contrato.classList.add('d-none');
        } else {
            contrato.classList.remove('d-none');
        }
    });
    
    // Atualizar ícone
    if (isVisible) {
        toggleIcon.className = 'fas fa-chevron-right';
    } else {
        toggleIcon.className = 'fas fa-chevron-down';
    }
}

// Função para ver detalhes de um contrato específico
async function verDetalhesContrato(contratoId) {
    try {
        showLoading(true);
        
        // Buscar detalhes do contrato
        const contrato = await apiRequest(`/api/contratos/${contratoId}`);
        
        const modal = document.getElementById('modalDetalhesContrato');
        const modalBody = document.getElementById('conteudoDetalhesContrato');
        
        if (!modal || !modalBody) {
            console.error('Modal de detalhes do contrato não encontrado');
            return;
        }
        
        // Montar conteúdo do modal
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-file-contract"></i> Informações do Contrato</h6>
                    <table class="table table-sm">
                        <tr>
                            <td><strong>ID:</strong></td>
                            <td>#${contrato.id}</td>
                        </tr>
                        <tr>
                            <td><strong>Cliente:</strong></td>
                            <td>${contrato.cliente_nome || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>Data da Venda:</strong></td>
                            <td>${contrato.data_venda ? formatarData(contrato.data_venda) : 'Não definida'}</td>
                        </tr>
                        <tr>
                            <td><strong>Data de Entrega:</strong></td>
                            <td>${contrato.data_entrega ? formatarData(contrato.data_entrega) : 'Não definida'}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-map-marker-alt"></i> Informações de Localização</h6>
                    <table class="table table-sm">
                        <tr>
                            <td><strong>Endereço:</strong></td>
                            <td>${contrato.endereco ? `${contrato.endereco.rua}, ${contrato.endereco.numero}` : 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>Cidade:</strong></td>
                            <td>${contrato.endereco?.cidade || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>Estado:</strong></td>
                            <td>${contrato.endereco?.estado || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>CEP:</strong></td>
                            <td>${contrato.endereco?.cep || 'N/A'}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <h6><i class="fas fa-elevator"></i> Elevadores do Contrato</h6>
                    <div id="elevaodresContrato">
                        <div class="text-center">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Carregando elevadores...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Carregar elevadores do contrato
        carregarElevadoresDoContrato(contratoId);
        
        // Mostrar modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes do contrato:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao carregar detalhes do contrato: ' + error.message, 'error');
        } else {
            alert('Erro ao carregar detalhes do contrato: ' + error.message);
        }
        showLoading(false);
    }
}

// Função para carregar elevadores de um contrato específico
async function carregarElevadoresDoContrato(contratoId) {
    try {
        const elevadores = await apiRequest(`/api/elevadores?contrato=${contratoId}`);
        const container = document.getElementById('elevaodresContrato');
        
        if (!container) return;
        
        if (!elevadores || elevadores.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhum elevador encontrado para este contrato.</div>';
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-sm table-striped">';
        html += '<thead><tr><th>ID</th><th>Cabine</th><th>Elevação</th><th>Cor</th><th>Data Entrega</th></tr></thead><tbody>';
        
        elevadores.forEach(elevador => {
            html += `
                <tr>
                    <td>#${elevador.id}</td>
                    <td>${elevador.cabine_descricao || elevador.altura_cabine || 'N/A'}</td>
                    <td>${elevador.elevacao} mm</td>
                    <td>
                        ${elevador.cor ? 
                            `<span class="badge" style="background-color: ${elevador.cor.toLowerCase()}; color: white;">${elevador.cor}</span>` :
                            '<span class="badge bg-secondary">Sem cor</span>'
                        }
                    </td>
                    <td>${elevador.data_entrega ? formatarData(elevador.data_entrega) : 'N/A'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar elevadores do contrato:', error);
        const container = document.getElementById('elevaodresContrato');
        if (container) {
            container.innerHTML = '<div class="alert alert-danger">Erro ao carregar elevadores.</div>';
        }
    }
}

// Função para criar resumo geral
function criarResumoGeral() {
    if (!dadosVendas || dadosVendas.length === 0) {
        console.log('Nenhum dado disponível para resumo');
        return;
    }
    
    const container = document.getElementById('resumoGeral');
    if (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Distribuição por Estados:</h6>
                    <div class="small" id="distribuicaoEstados">
                        <!-- Estados serão inseridos aqui -->
                    </div>
                </div>
                <div class="col-md-6">
                    <h6>Métricas Gerais:</h6>
                    <div class="small">
                        <div class="d-flex justify-content-between">
                            <span>Estados ativos:</span>
                            <span>${dadosVendas.length}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Elevação média:</span>
                            <span>${(dadosVendas.reduce((sum, item) => sum + (item.elevacao_media || 0), 0) / dadosVendas.length).toFixed(2)}m</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar estados com clique
        const distribuicaoContainer = document.getElementById('distribuicaoEstados');
        if (distribuicaoContainer) {
            dadosVendas.forEach(item => {
                const estadoDiv = document.createElement('div');
                estadoDiv.className = 'd-flex justify-content-between py-1 px-2 rounded cursor-pointer';
                estadoDiv.style.cursor = 'pointer';
                estadoDiv.setAttribute('title', 'Clique para ver contratos deste estado');
                estadoDiv.innerHTML = `
                    <span>${item.estado_nome || item.estado}:</span>
                    <span><strong>${item.total_elevadores || 0}</strong> elevadores</span>
                `;
                
                // Adicionar evento de clique
                estadoDiv.addEventListener('click', () => {
                    mostrarContratosDoEstado(item.estado, item.estado_nome || item.estado);
                });
                
                // Adicionar efeito hover
                estadoDiv.addEventListener('mouseenter', () => {
                    estadoDiv.style.backgroundColor = '#e9ecef';
                });
                estadoDiv.addEventListener('mouseleave', () => {
                    estadoDiv.style.backgroundColor = '';
                });
                
                distribuicaoContainer.appendChild(estadoDiv);
            });
        }
    }
}

// Função auxiliar para atualizar elementos
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Variáveis para dados originais e filtrados
let dadosOriginais = [];
let dadosFiltrados = [];
let chartVendas = null; // Variável para o gráfico

// Função para filtrar dados
async function filtrarDados() {
    try {
        showLoading(true);
        
        // Primeiro, recarregar dados temporais com os novos filtros
        await carregarDadosTemporais();
        
        // Obter filtros atuais
        const filtroEstado = document.getElementById('filtroEstado').value;
        const periodo = document.getElementById('periodoVisualizacao').value;
        const intervalo = document.getElementById('intervaloAmostras').value;
        
        console.log('Aplicando filtros:', { 
            estado: filtroEstado, 
            periodo: periodo, 
            intervalo: intervalo 
        });
        
        // Recarregar dados de vendas por estado com filtro de estado se necessário
        if (filtroEstado) {
            const url = `/api/relatorios/vendas-por-estado?estado=${filtroEstado}`;
            dadosVendas = await apiRequest(url);
        } else {
            // Recarregar dados originais
            await carregarDadosVendas();
        }
        
        // Recriar visualizações com dados filtrados
        criarEstatisticas();
        criarTopEstados();
        criarResumoGeral();
        criarGraficoVendas();
        
        showLoading(false);
        
        if (typeof showToast === 'function') {
            showToast('Filtros aplicados com sucesso', 'success');
        }
        
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao aplicar filtros: ' + error.message, 'error');
        }
        showLoading(false);
    }
}

// Função para limpar filtros
function limparFiltros() {
    // Limpar selects
    document.getElementById('filtroEstado').value = '';
    document.getElementById('periodoVisualizacao').value = 'ultimo-ano';
    document.getElementById('intervaloAmostras').value = 'mes';
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';
    
    // Ocultar campos de período personalizado
    document.getElementById('periodoPersonalizado').style.display = 'none';
    document.getElementById('periodoPersonalizadoFim').style.display = 'none';
    
    // Recarregar dados originais
    carregarRelatorios();
    
    if (typeof showToast === 'function') {
        showToast('Filtros removidos', 'info');
    }
}

// Função para exportar relatório
function exportarRelatorio() {
    if (typeof showToast === 'function') {
        showToast('Funcionalidade de exportação em desenvolvimento', 'info');
    } else {
        alert('Funcionalidade de exportação em desenvolvimento');
    }
}

// Função para atualizar dados
function atualizarDados() {
    carregarRelatorios();
}

// Função para recarregar dados quando filtros mudam
function recarregarDadosComFiltros() {
    filtrarDados();
}

// Função para alterar visualização
function alterarVisualizacao() {
    const tipo = document.getElementById('tipoVisualizacao').value;
    console.log('Alterando visualização para:', tipo);
    
    // Ocultar todas as seções
    const secaoEstatisticas = document.getElementById('secaoEstatisticas');
    const secaoListagem = document.getElementById('secaoListagem');
    const secaoTabela = document.getElementById('secaoTabela');
    
    if (secaoEstatisticas) secaoEstatisticas.style.display = 'none';
    if (secaoListagem) secaoListagem.style.display = 'none';
    if (secaoTabela) secaoTabela.style.display = 'none';
    
    // Mostrar seção selecionada
    switch(tipo) {
        case 'grafico':
            if (secaoEstatisticas) {
                secaoEstatisticas.style.display = 'block';
                // Redesenhar gráfico após mostrar seção
                setTimeout(() => {
                    criarGraficoVendas();
                }, 100);
            }
            break;
        case 'tabela':
            if (secaoTabela) {
                secaoTabela.style.display = 'block';
                criarTabelaEstados();
            }
            break;
        case 'elevadores-mes':
            if (secaoListagem) {
                secaoListagem.style.display = 'block';
                listarElevadoresPorMes();
            }
            break;
        case 'elevadores-estado':
            if (secaoListagem) {
                secaoListagem.style.display = 'block';
                listarElevadoresPorEstado();
            }
            break;
        case 'mapa':
            if (typeof showToast === 'function') {
                showToast('Visualização em mapa em desenvolvimento', 'info');
            }
            if (secaoEstatisticas) {
                secaoEstatisticas.style.display = 'block';
                setTimeout(() => {
                    criarGraficoVendas();
                }, 100);
            }
            break;
    }
}

// Variáveis para controle de ordenação da tabela
let ordemAtual = {
    coluna: null,
    crescente: true
};

// Função para criar tabela de estados
function criarTabelaEstados() {
    const tbody = document.getElementById('tabelaEstados');
    const semDados = document.getElementById('semDadosTabela');
    
    if (!tbody || !dadosVendas || dadosVendas.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (semDados) semDados.style.display = 'block';
        return;
    }
    
    // Ocultar mensagem de "sem dados"
    if (semDados) semDados.style.display = 'none';
    
    // Gerar linhas da tabela
    let html = '';
    dadosVendas.forEach(estado => {
        const elevacaoMedia = estado.elevacao_media ? `${estado.elevacao_media}mm` : 'N/A';
        
        html += `
            <tr>
                <td>
                    <strong>${estado.estado_nome || estado.estado}</strong>
                    <small class="text-muted d-block">${estado.estado}</small>
                </td>
                <td>
                    <span class="badge bg-success fs-6">${estado.total_clientes}</span>
                </td>
                <td>
                    <span class="badge bg-primary fs-6">${estado.total_elevadores}</span>
                </td>
                <td>
                    <span class="text-muted">${elevacaoMedia}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="mostrarDetalhesEstado('${estado.estado}')">
                        <i class="fas fa-eye"></i> Ver Detalhes
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Resetar ícones de ordenação
    resetarIconesOrdenacao();
}

// Função para ordenar tabela
function ordenarTabela(coluna) {
    if (!dadosVendas || dadosVendas.length === 0) return;
    
    // Se for a mesma coluna, inverte a ordem
    if (ordemAtual.coluna === coluna) {
        ordemAtual.crescente = !ordemAtual.crescente;
    } else {
        ordemAtual.coluna = coluna;
        ordemAtual.crescente = true;
    }
    
    // Ordenar dados
    dadosVendas.sort((a, b) => {
        let valorA, valorB;
        
        switch(coluna) {
            case 'estado':
                valorA = (a.estado_nome || a.estado).toLowerCase();
                valorB = (b.estado_nome || b.estado).toLowerCase();
                break;
            case 'clientes':
                valorA = a.total_clientes;
                valorB = b.total_clientes;
                break;
            case 'elevadores':
                valorA = a.total_elevadores;
                valorB = b.total_elevadores;
                break;
            default:
                return 0;
        }
        
        if (valorA < valorB) return ordemAtual.crescente ? -1 : 1;
        if (valorA > valorB) return ordemAtual.crescente ? 1 : -1;
        return 0;
    });
    
    // Atualizar tabela
    criarTabelaEstados();
    
    // Atualizar ícones de ordenação
    atualizarIconesOrdenacao(coluna);
}

// Função para resetar ícones de ordenação
function resetarIconesOrdenacao() {
    ['estado', 'clientes', 'elevadores'].forEach(coluna => {
        const icone = document.getElementById(`sort-${coluna}`);
        if (icone) {
            icone.className = 'fas fa-sort ms-1';
        }
    });
}

// Função para atualizar ícones de ordenação
function atualizarIconesOrdenacao(colunaAtiva) {
    resetarIconesOrdenacao();
    
    const icone = document.getElementById(`sort-${colunaAtiva}`);
    if (icone) {
        if (ordemAtual.crescente) {
            icone.className = 'fas fa-sort-up ms-1';
        } else {
            icone.className = 'fas fa-sort-down ms-1';
        }
    }
}

// Função para atualizar tipo de visualização
function atualizarTipoVisualizacao() {
    alterarVisualizacao();
}

// Função para criar tabela de elevadores
function criarTabelaElevadores() {
    const container = document.getElementById('conteudoListagem');
    if (container && dadosVendas) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-table"></i> Tabela de Elevadores por Estado</h5>
                    <small class="text-muted">Clique em uma linha para ver os contratos do estado</small>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="tabelaEstados">
                            <thead class="table-dark">
                                <tr>
                                    <th>Estado</th>
                                    <th>Total Elevadores</th>
                                    <th>Total Clientes</th>
                                    <th>Elevação Média</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Linhas serão inseridas aqui -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar linhas da tabela com eventos de clique
        const tbody = container.querySelector('#tabelaEstados tbody');
        if (tbody) {
            dadosVendas.forEach(item => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.setAttribute('title', 'Clique para ver contratos deste estado');
                row.innerHTML = `
                    <td><strong>${item.estado_nome || item.estado}</strong></td>
                    <td><span class="badge bg-primary">${item.total_elevadores || 0}</span></td>
                    <td><span class="badge bg-success">${item.total_clientes || 0}</span></td>
                    <td>${(item.elevacao_media || 0).toFixed(2)}m</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" title="Ver contratos">
                            <i class="fas fa-eye"></i> Ver Contratos
                        </button>
                    </td>
                `;
                
                // Adicionar evento de clique na linha inteira
                row.addEventListener('click', () => {
                    mostrarContratosDoEstado(item.estado, item.estado_nome || item.estado);
                });
                
                // Adicionar efeito hover
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = '#f8f9fa';
                });
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = '';
                });
                
                tbody.appendChild(row);
            });
        }
    }
}

// Funções para visualização (se necessário)
function visualizarGrafico() {
    console.log('Visualizar gráfico');
}

function visualizarTabela() {
    console.log('Visualizar tabela');
}

function visualizarMapa() {
    console.log('Visualizar mapa');
}
