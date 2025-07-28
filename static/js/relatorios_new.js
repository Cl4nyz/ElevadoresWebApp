// Variáveis globais
let dadosVendas = [];
let filtrosDisponiveis = {};

// Função principal para carregar relatórios
async function carregarRelatorios() {
    try {
        showLoading(true);
        
        // Carregar dados iniciais
        await Promise.all([
            carregarDadosVendas(),
            carregarFiltrosDisponiveis()
        ]);
        
        // Inicializar interface
        criarEstatisticasInterativas();
        criarTopEstados();
        criarResumoGeral();
        
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showToast('Erro ao carregar relatórios: ' + error.message, 'error');
        showLoading(false);
    }
}

// Função para carregar dados de vendas
async function carregarDadosVendas() {
    dadosVendas = await apiRequest('/api/relatorios/vendas-por-estado');
}

// Função para carregar opções de filtros
async function carregarFiltrosDisponiveis() {
    filtrosDisponiveis = await apiRequest('/api/relatorios/opcoes-filtros');
    
    // Preencher select de meses
    const selectMes = document.getElementById('filtroMes');
    selectMes.innerHTML = '<option value="">Todos os meses</option>';
    filtrosDisponiveis.meses.forEach(mes => {
        selectMes.innerHTML += `<option value="${mes}">${mes}</option>`;
    });
    
    // Preencher select de estados
    const selectEstado = document.getElementById('filtroEstado');
    selectEstado.innerHTML = '<option value="">Todos os estados</option>';
    filtrosDisponiveis.estados.forEach(estado => {
        selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome} (${estado.sigla})</option>`;
    });
}

// Função para filtrar dados
async function filtrarDados() {
    const mes = document.getElementById('filtroMes').value;
    const estado = document.getElementById('filtroEstado').value;
    
    try {
        let url = '/api/relatorios/vendas-por-estado';
        const params = new URLSearchParams();
        
        if (mes) params.append('mes', mes);
        if (estado) params.append('estado', estado);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        dadosVendas = await apiRequest(url);
        criarEstatisticasInterativas();
        criarTopEstados();
        criarResumoGeral();
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        showToast('Erro ao filtrar dados: ' + error.message, 'error');
    }
}

// Função para atualizar dados
async function atualizarDados() {
    await carregarRelatorios();
    showToast('Dados atualizados com sucesso!', 'success');
}

// Função para criar resumo geral
function criarResumoGeral() {
    const totalVendas = dadosVendas.reduce((sum, item) => sum + item.total_vendas, 0);
    const totalElevadores = dadosVendas.reduce((sum, item) => sum + item.total_elevadores, 0);
    const totalClientes = dadosVendas.reduce((sum, item) => sum + item.total_clientes, 0);
    const valorMedio = totalVendas / totalElevadores || 0;
    
    const resumoHtml = `
        <div class="row text-center">
            <div class="col-6 mb-3">
                <h4 class="text-primary">R$ ${totalVendas.toLocaleString('pt-BR')}</h4>
                <small class="text-muted">Total de Vendas</small>
            </div>
            <div class="col-6 mb-3">
                <h4 class="text-success">${totalElevadores}</h4>
                <small class="text-muted">Elevadores</small>
            </div>
            <div class="col-6">
                <h4 class="text-info">${totalClientes}</h4>
                <small class="text-muted">Clientes</small>
            </div>
            <div class="col-6">
                <h4 class="text-warning">R$ ${valorMedio.toLocaleString('pt-BR')}</h4>
                <small class="text-muted">Valor Médio</small>
            </div>
        </div>
    `;
    
    document.getElementById('resumoGeral').innerHTML = resumoHtml;
}

// Função para criar top 5 estados
function criarTopEstados() {
    const topEstados = dadosVendas
        .sort((a, b) => b.total_vendas - a.total_vendas)
        .slice(0, 5);
    
    let html = '';
    topEstados.forEach((estado, index) => {
        const posicao = index + 1;
        const cor = ['primary', 'success', 'info', 'warning', 'secondary'][index];
        
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div>
                    <span class="badge bg-${cor}">#${posicao}</span>
                    <strong class="ms-2">${estado.estado_nome || estado.estado}</strong>
                </div>
                <div class="text-end">
                    <div class="text-success"><strong>R$ ${estado.total_vendas.toLocaleString('pt-BR')}</strong></div>
                    <small class="text-muted">${estado.total_elevadores} elevadores</small>
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p class="text-muted text-center">Nenhum dado disponível</p>';
    }
    
    document.getElementById('topEstados').innerHTML = html;
}

// Função para criar gráfico de estatísticas interativas
function criarEstatisticasInterativas() {
    const ctx = document.getElementById('chartVendasPorEstado');
    if (!ctx || !dadosVendas) return;

    // Destruir gráfico anterior se existir
    if (window.chartVendasEstado) {
        window.chartVendasEstado.destroy();
    }

    const labels = dadosVendas.map(item => item.estado_nome || item.estado);
    const dados = dadosVendas.map(item => item.total_vendas || 0);
    const cores = dadosVendas.map(() => getRandomColor());

    window.chartVendasEstado = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas por Estado (R$)',
                data: dados,
                backgroundColor: cores,
                borderColor: cores.map(cor => cor.replace('0.6', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Vendas de Elevadores por Estado'
                },
                legend: {
                    display: false
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const estado = dadosVendas[index];
                    mostrarDetalhesEstado(estado.estado);
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor em R$'
                    }
                }
            }
        }
    });
}

// Função para obter uma cor aleatória
function getRandomColor() {
    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 205, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)',
        'rgba(83, 102, 255, 0.6)',
        'rgba(40, 159, 64, 0.6)',
        'rgba(210, 199, 199, 0.6)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Função para mostrar detalhes de um estado
function mostrarDetalhesEstado(siglaEstado) {
    const estado = dadosVendas.find(v => v.estado === siglaEstado);
    if (!estado) return;
    
    let html = `
        <div class="modal fade" id="modalDetalhesEstado" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-map-marker-alt"></i> Detalhes de ${estado.estado_nome || estado.estado}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <div class="card text-center border-primary">
                                    <div class="card-body">
                                        <h4 class="text-primary">${estado.total_contratos}</h4>
                                        <small>Contratos</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card text-center border-success">
                                    <div class="card-body">
                                        <h4 class="text-success">R$ ${estado.total_vendas.toLocaleString('pt-BR')}</h4>
                                        <small>Total Vendas</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card text-center border-info">
                                    <div class="card-body">
                                        <h4 class="text-info">${estado.total_elevadores}</h4>
                                        <small>Elevadores</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card text-center border-warning">
                                    <div class="card-body">
                                        <h4 class="text-warning">${estado.total_clientes}</h4>
                                        <small>Clientes</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="detalhesContratos">
                            <div class="text-center">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Carregando...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove modal anterior se existir
    const modalExistente = document.getElementById('modalDetalhesEstado');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Adiciona novo modal
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Mostra modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalhesEstado'));
    modal.show();
    
    // Carregar detalhes dos contratos
    carregarContratosEstado(estado.estado);
}

// Função para carregar contratos de um estado
async function carregarContratosEstado(estado) {
    try {
        const contratos = await apiRequest(`/api/relatorios/contratos-por-estado/${estado}`);
        
        let html = `
            <h6><i class="fas fa-file-contract"></i> Contratos em ${estado}</h6>
            <div class="table-responsive">
                <table class="table table-striped table-sm">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Data da Venda</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Elevadores</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        contratos.forEach(contrato => {
            html += `
                <tr>
                    <td><strong>${contrato.cliente_nome}</strong></td>
                    <td>${formatarData(contrato.data_venda)}</td>
                    <td>R$ ${contrato.valor.toLocaleString('pt-BR')}</td>
                    <td>
                        <span class="badge ${obterClasseStatusContrato(contrato.status)}">
                            ${contrato.status || 'Pendente'}
                        </span>
                    </td>
                    <td>${contrato.total_elevadores}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('detalhesContratos').innerHTML = html;
        
    } catch (error) {
        document.getElementById('detalhesContratos').innerHTML = 
            '<div class="alert alert-danger">Erro ao carregar contratos</div>';
    }
}

// Função para atualizar exibição baseada no filtro
function atualizarExibicao() {
    const tipoVisualizacao = document.getElementById('tipoVisualizacao').value;
    
    if (tipoVisualizacao === 'mes') {
        document.getElementById('estatisticas').style.display = 'block';
        document.getElementById('listagemElevadores').style.display = 'none';
        criarEstatisticasInterativas();
        criarTopEstados();
    } else if (tipoVisualizacao === 'elevadores-mes') {
        document.getElementById('estatisticas').style.display = 'none';
        document.getElementById('listagemElevadores').style.display = 'block';
        listarElevadoresPorMes();
    } else if (tipoVisualizacao === 'elevadores-estado') {
        document.getElementById('estatisticas').style.display = 'none';
        document.getElementById('listagemElevadores').style.display = 'block';
        listarElevadoresPorEstado();
    }
}

// Função para listar elevadores por mês
async function listarElevadoresPorMes() {
    try {
        const elevadores = await apiRequest('/api/elevadores');
        
        // Agrupar por mês
        const elevadoresPorMes = {};
        elevadores.forEach(elevador => {
            if (elevador.data_entrega) {
                const data = new Date(elevador.data_entrega + 'T00:00:00');
                const mesAno = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
                
                if (!elevadoresPorMes[mesAno]) {
                    elevadoresPorMes[mesAno] = [];
                }
                elevadoresPorMes[mesAno].push(elevador);
            }
        });
        
        let html = '<div class="card"><div class="card-header"><h5><i class="fas fa-calendar"></i> Elevadores por Mês</h5></div><div class="card-body">';
        
        const mesesOrdenados = Object.keys(elevadoresPorMes).sort((a, b) => {
            const [mesA, anoA] = a.split('/');
            const [mesB, anoB] = b.split('/');
            return new Date(anoB, mesB - 1) - new Date(anoA, mesA - 1);
        });
        
        mesesOrdenados.forEach(mesAno => {
            const elevadoresDoMes = elevadoresPorMes[mesAno];
            html += `
                <div class="mb-4">
                    <h6 class="text-primary border-bottom pb-2">
                        <i class="fas fa-calendar-alt"></i> ${mesAno} 
                        <span class="badge bg-primary">${elevadoresDoMes.length} elevadores</span>
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Data da Venda</th>
                                    <th>Data de Entrega</th>
                                    <th>Elevação</th>
                                    <th>Cor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${elevadoresDoMes.map(elev => `
                                    <tr>
                                        <td><strong>${elev.cliente_nome || 'N/A'}</strong></td>
                                        <td>${formatarData(elev.data_venda)}</td>
                                        <td>${formatarData(elev.data_entrega)}</td>
                                        <td>${elev.elevacao || 0}mm</td>
                                        <td>
                                            ${elev.cor ? `<span class="badge" style="background-color: ${elev.cor}; color: ${obterCorTexto(elev.cor)}">${elev.cor}</span>` : 'N/A'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        document.getElementById('listagemElevadores').innerHTML = html;
        
    } catch (error) {
        showToast('Erro ao carregar elevadores por mês: ' + error.message, 'error');
    }
}

// Função para listar elevadores por estado
async function listarElevadoresPorEstado() {
    try {
        const elevadores = await apiRequest('/api/elevadores');
        
        // Agrupar por estado (assumindo que temos essa informação)
        const elevadoresPorEstado = {};
        elevadores.forEach(elevador => {
            // Para este exemplo, vou usar uma lógica simples
            // Em produção, você precisaria ter o estado no registro do elevador
            const estado = elevador.estado || 'Não informado';
            
            if (!elevadoresPorEstado[estado]) {
                elevadoresPorEstado[estado] = [];
            }
            elevadoresPorEstado[estado].push(elevador);
        });
        
        let html = '<div class="card"><div class="card-header"><h5><i class="fas fa-map-marker-alt"></i> Elevadores por Estado</h5></div><div class="card-body">';
        
        Object.keys(elevadoresPorEstado).sort().forEach(estado => {
            const elevadoresDoEstado = elevadoresPorEstado[estado];
            html += `
                <div class="mb-4">
                    <h6 class="text-success border-bottom pb-2">
                        <i class="fas fa-map-marker-alt"></i> ${estado} 
                        <span class="badge bg-success">${elevadoresDoEstado.length} elevadores</span>
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Data da Venda</th>
                                    <th>Data de Entrega</th>
                                    <th>Elevação</th>
                                    <th>Cor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${elevadoresDoEstado.map(elev => `
                                    <tr>
                                        <td><strong>${elev.cliente_nome || 'N/A'}</strong></td>
                                        <td>${formatarData(elev.data_venda)}</td>
                                        <td>${formatarData(elev.data_entrega)}</td>
                                        <td>${elev.elevacao || 0}mm</td>
                                        <td>
                                            ${elev.cor ? `<span class="badge" style="background-color: ${elev.cor}; color: ${obterCorTexto(elev.cor)}">${elev.cor}</span>` : 'N/A'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        document.getElementById('listagemElevadores').innerHTML = html;
        
    } catch (error) {
        showToast('Erro ao carregar elevadores por estado: ' + error.message, 'error');
    }
}

// Função para obter cor de texto baseada na cor de fundo
function obterCorTexto(corFundo) {
    if (!corFundo) return '#000';
    
    // Remove # se presente
    corFundo = corFundo.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(corFundo.substr(0, 2), 16);
    const g = parseInt(corFundo.substr(2, 2), 16);
    const b = parseInt(corFundo.substr(4, 2), 16);
    
    // Calcula brilho
    const brilho = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brilho > 128 ? '#000' : '#fff';
}

// Função para obter classe do status do contrato
function obterClasseStatusContrato(status) {
    switch (status) {
        case 'ativo':
        case 'Ativo':
            return 'bg-success';
        case 'pendente':
        case 'Pendente':
            return 'bg-warning';
        case 'cancelado':
        case 'Cancelado':
            return 'bg-danger';
        case 'finalizado':
        case 'Finalizado':
            return 'bg-primary';
        default:
            return 'bg-secondary';
    }
}

// Função para exportar relatório
function exportarRelatorio() {
    // Implementação para exportar dados
    const dadosExport = {
        timestamp: new Date().toISOString(),
        resumo: {
            total_vendas: dadosVendas.reduce((sum, item) => sum + item.total_vendas, 0),
            total_elevadores: dadosVendas.reduce((sum, item) => sum + item.total_elevadores, 0),
            total_clientes: dadosVendas.reduce((sum, item) => sum + item.total_clientes, 0)
        },
        dados_por_estado: dadosVendas
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `relatorio_vendas_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast('Relatório exportado com sucesso!', 'success');
}
