// Gerenciamento de Relatórios
let dadosVendas = [];
let filtrosDisponiveis = {};

// Carregar dados ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarRelatorios();
});

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
        criarEstatisticas();
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
    try {
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
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
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
        
        // Atualizar visualização baseada no tipo selecionado
        const tipoVisualizacao = document.getElementById('tipoVisualizacao').value;
        if (tipoVisualizacao === 'estatisticas') {
            criarEstatisticas();
            criarTopEstados();
            criarResumoGeral();
        } else {
            atualizarExibicao();
        }
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        showToast('Erro ao filtrar dados: ' + error.message, 'error');
    }
}

// Função para atualizar exibição baseada no tipo
function atualizarExibicao() {
    const tipoVisualizacao = document.getElementById('tipoVisualizacao').value;
    
    if (tipoVisualizacao === 'estatisticas') {
        document.getElementById('secaoEstatisticas').style.display = 'block';
        document.getElementById('secaoListagem').style.display = 'none';
        criarEstatisticas();
        criarTopEstados();
        criarResumoGeral();
    } else if (tipoVisualizacao === 'elevadores-mes') {
        document.getElementById('secaoEstatisticas').style.display = 'none';
        document.getElementById('secaoListagem').style.display = 'block';
        listarElevadoresPorMes();
    } else if (tipoVisualizacao === 'elevadores-estado') {
        document.getElementById('secaoEstatisticas').style.display = 'none';
        document.getElementById('secaoListagem').style.display = 'block';
        listarElevadoresPorEstado();
    }
}

// Função para criar estatísticas com gráfico
function criarEstatisticas() {
    const ctx = document.getElementById('chartVendasPorEstado');
    if (!ctx || !dadosVendas) return;

    // Destruir gráfico anterior se existir
    if (window.chartVendasEstado) {
        window.chartVendasEstado.destroy();
    }

    const labels = dadosVendas.map(item => item.estado_nome || item.estado);
    const dados = dadosVendas.map(item => item.total_elevadores || 0);
    const cores = dadosVendas.map(() => getRandomColor());

    window.chartVendasEstado = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Elevadores por Estado',
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
                    text: 'Elevadores Vendidos por Estado'
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
                        text: 'Quantidade de Elevadores'
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

// Criar mapa do Brasil usando SVG (mantido para funcionalidade de clique em estados)
function criarMapaBrasil() {
    const container = document.getElementById('mapaBrasil');
    
    // Criar SVG baseado nas coordenadas dos polígonos
    const svgHTML = `
        <svg width="100%" height="600" viewBox="0 0 945 949" style="border: 1px solid #ddd; background: #f8f9fa;">
            ${criarEstadosSVG()}
        </svg>
    `;
    
    container.innerHTML = svgHTML;
    
    // Adicionar eventos aos estados SVG
    adicionarEventosEstadosSVG();
}

// Criar seção de estatísticas SEM mapa - apenas filtros e listas
function criarEstatisticasInterativas() {
    const container = document.getElementById('estatisticasContainer');
    
    if (!dadosVendas || dadosVendas.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Nenhum dado encontrado</div>';
        return;
    }

    // Calcular estatísticas
    const totalElevadores = dadosVendas.reduce((sum, estado) => sum + estado.total_elevadores, 0);
    const totalClientes = dadosVendas.reduce((sum, estado) => sum + estado.total_clientes, 0);
    const estadosComVendas = dadosVendas.filter(estado => estado.total_elevadores > 0).length;

    container.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center border-primary">
                    <div class="card-body">
                        <h3 class="text-primary">${totalElevadores}</h3>
                        <p class="text-muted mb-0">Total de Elevadores</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-success">
                    <div class="card-body">
                        <h3 class="text-success">${totalClientes}</h3>
                        <p class="text-muted mb-0">Total de Clientes</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-info">
                    <div class="card-body">
                        <h3 class="text-info">${estadosComVendas}</h3>
                        <p class="text-muted mb-0">Estados com Vendas</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-warning">
                    <div class="card-body">
                        <h3 class="text-warning">${new Date().getFullYear()}</h3>
                        <p class="text-muted mb-0">Ano Atual</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros e opções -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-filter"></i> Filtros</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <label for="filtroMes" class="form-label">Filtrar por Mês</label>
                                <select id="filtroMes" class="form-select" onchange="filtrarDados()">
                                    <option value="">Todos os meses</option>
                                    <option value="01">Janeiro</option>
                                    <option value="02">Fevereiro</option>
                                    <option value="03">Março</option>
                                    <option value="04">Abril</option>
                                    <option value="05">Maio</option>
                                    <option value="06">Junho</option>
                                    <option value="07">Julho</option>
                                    <option value="08">Agosto</option>
                                    <option value="09">Setembro</option>
                                    <option value="10">Outubro</option>
                                    <option value="11">Novembro</option>
                                    <option value="12">Dezembro</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="filtroEstado" class="form-label">Filtrar por Estado</label>
                                <select id="filtroEstado" class="form-select" onchange="filtrarDados()">
                                    <option value="">Todos os estados</option>
                                    ${dadosVendas.map(estado => 
                                        `<option value="${estado.estado}">${estado.estado}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-list"></i> Listar Elevadores</h5>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-primary me-2" onclick="listarElevadoresPorMes()">
                            <i class="fas fa-calendar"></i> Por Mês
                        </button>
                        <button class="btn btn-success" onclick="listarElevadoresPorEstado()">
                            <i class="fas fa-map-marker-alt"></i> Por Estado
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="listagemElevadores" class="mt-4"></div>
    `;
}

// Criar estados em SVG baseados nas coordenadas dos polígonos
function criarEstadosSVG() {
    // Usar as mesmas coordenadas dos polígonos para criar formas SVG
    const areas = [
        // Região Norte
        { sigla: 'AC', coords: '40,450,80,445,95,465,85,485,60,480,35,465', nome: 'Acre' },
        { sigla: 'AM', coords: '80,320,200,305,240,330,270,370,250,410,220,425,190,430,160,425,130,415,105,400,85,385,80,360,75,340,80,320', nome: 'Amazonas' },
        { sigla: 'RR', coords: '200,180,250,175,275,195,295,225,285,255,260,275,240,275,220,265,205,245,195,220,200,195', nome: 'Roraima' },
        { sigla: 'PA', coords: '240,275,360,265,395,285,425,315,415,355,400,395,380,425,360,445,340,460,315,465,290,460,270,445,250,425,235,395,230,365,235,335,240,305', nome: 'Pará' },
        { sigla: 'AP', coords: '395,240,435,235,455,255,470,285,465,315,450,345,430,355,410,350,395,330,385,305,390,275,395,250', nome: 'Amapá' },
        { sigla: 'TO', coords: '340,460,400,455,425,475,440,505,435,540,420,570,405,590,390,605,375,610,360,605,345,590,335,570,330,540,335,505,340,480', nome: 'Tocantins' },
        { sigla: 'RO', coords: '130,415,175,410,195,430,210,450,200,470,185,485,170,490,155,485,140,470,125,450,120,430,125,415', nome: 'Rondônia' },
        
        // Região Nordeste
        { sigla: 'MA', coords: '400,395,465,390,485,410,500,435,495,460,480,485,465,500,450,505,435,500,420,485,405,465,395,440,390,415', nome: 'Maranhão' },
        { sigla: 'PI', coords: '425,500,465,495,485,515,500,540,495,565,480,590,465,605,450,610,435,605,420,590,410,565,405,540,410,515', nome: 'Piauí' },
        { sigla: 'CE', coords: '500,410,570,405,595,425,610,450,605,475,585,500,570,510,555,505,540,490,525,470,515,445,505,420', nome: 'Ceará' },
        { sigla: 'RN', coords: '570,395,615,390,635,405,650,420,645,435,630,450,615,455,600,450,585,435,575,420,570,405', nome: 'Rio Grande do Norte' },
        { sigla: 'PB', coords: '615,450,650,445,670,460,685,475,680,490,665,505,650,510,635,505,620,490,610,475,615,460', nome: 'Paraíba' },
        { sigla: 'PE', coords: '555,505,635,500,670,520,705,545,700,575,685,605,665,620,645,625,625,620,605,605,585,585,565,560,550,530,555,505', nome: 'Pernambuco' },
        { sigla: 'AL', coords: '645,625,685,620,705,635,720,650,715,665,700,680,685,685,670,680,655,665,645,650,645,635', nome: 'Alagoas' },
        { sigla: 'SE', coords: '625,680,665,675,685,690,700,705,695,720,680,735,665,740,650,735,635,720,625,705,625,690', nome: 'Sergipe' },
        { sigla: 'BA', coords: '420,605,555,600,585,620,615,650,645,685,670,720,665,755,650,790,630,820,605,845,580,860,555,865,530,860,505,845,480,820,455,790,435,755,420,720,410,685,405,650,410,615', nome: 'Bahia' },
        
        // Região Centro-Oeste
        { sigla: 'MT', coords: '200,470,340,465,390,485,425,520,460,560,445,600,430,640,415,675,400,705,385,730,370,750,355,765,340,770,325,765,310,750,295,730,280,705,265,675,250,640,235,600,220,560,205,520,200,485', nome: 'Mato Grosso' },
        { sigla: 'MS', coords: '280,705,400,700,435,720,470,750,490,785,495,820,490,855,475,885,455,910,435,925,415,930,395,925,375,910,355,885,340,855,330,820,325,785,330,750,340,720,355,705', nome: 'Mato Grosso do Sul' },
        { sigla: 'GO', coords: '390,605,460,600,490,620,515,645,510,675,500,705,485,735,465,760,445,780,425,795,405,800,385,795,365,780,350,760,340,735,335,705,340,675,350,645,365,620,380,605', nome: 'Goiás' },
        { sigla: 'DF', coords: '440,685,455,680,460,695,455,710,440,715,425,710,420,695,425,680', nome: 'Distrito Federal' },
        
        // Região Sudeste
        { sigla: 'MG', coords: '425,795,555,790,590,810,625,840,655,875,650,910,635,940,615,965,590,985,565,1000,540,1005,515,1000,490,985,465,965,445,940,430,910,425,875,420,840,425,805', nome: 'Minas Gerais' },
        { sigla: 'ES', coords: '615,940,655,935,675,950,690,965,685,980,670,995,655,1000,640,995,625,980,620,965,625,950', nome: 'Espírito Santo' },
        { sigla: 'RJ', coords: '540,1000,615,995,645,1010,675,1030,670,1055,655,1080,635,1095,615,1100,595,1095,575,1080,555,1055,545,1030,540,1010', nome: 'Rio de Janeiro' },
        { sigla: 'SP', coords: '425,910,540,905,575,925,605,955,635,990,630,1025,615,1055,595,1080,570,1100,545,1115,520,1120,495,1115,470,1100,445,1080,425,1055,410,1025,405,990,410,955,420,925', nome: 'São Paulo' },
        
        // Região Sul
        { sigla: 'PR', coords: '400,1025,490,1020,520,1035,545,1055,540,1080,525,1100,505,1115,485,1120,465,1115,445,1100,425,1080,410,1055,405,1035,410,1025', nome: 'Paraná' },
        { sigla: 'SC', coords: '445,1115,505,1110,535,1125,565,1145,560,1165,545,1185,525,1200,505,1205,485,1200,465,1185,445,1165,440,1145,445,1125', nome: 'Santa Catarina' },
        { sigla: 'RS', coords: '410,1165,485,1160,520,1175,550,1195,545,1225,530,1255,510,1280,485,1300,460,1315,435,1320,410,1315,385,1300,360,1280,340,1255,325,1225,320,1195,325,1170,340,1150,365,1135,390,1145', nome: 'Rio Grande do Sul' }
    ];
    
    return areas.map(area => {
        const dadosEstado = dadosVendas.find(v => v.estado === area.sigla);
        const cor = dadosEstado ? obterCorPorQuantidade(dadosEstado.total_elevadores) : '#e3f2fd';
        const opacity = dadosEstado ? Math.min(0.8, dadosEstado.total_elevadores * 0.1 + 0.3) : 0.3;
        
        return `
            <polygon 
                points="${area.coords}" 
                fill="${cor}" 
                stroke="#333" 
                stroke-width="1" 
                opacity="${opacity}"
                data-estado="${area.sigla}"
                data-nome="${area.nome}"
                style="cursor: pointer; transition: all 0.3s ease;"
                class="estado-polygon">
                <title>${area.nome} (${area.sigla})</title>
            </polygon>
        `;
    }).join('');
}

// Adicionar eventos aos estados para mostrar detalhes
function adicionarEventosEstados() {
    // Eventos para botões de estado se existirem na interface
    const botoesEstado = document.querySelectorAll('.btn-estado');
    
    botoesEstado.forEach(botao => {
        botao.addEventListener('click', function() {
            const estado = this.getAttribute('data-estado');
            mostrarDetalhesEstado(estado);
        });
    });
}


        const nome = estado.getAttribute('data-nome');
        const dadosEstado = dadosVendas.find(v => v.estado === sigla);
        
        estado.addEventListener('mouseenter', function() {
            // Destacar estado
            this.style.strokeWidth = '3';
            this.style.stroke = '#000';
            this.style.opacity = '0.9';
            
            mostrarInfoEstado(sigla, dadosEstado);
        });
        
        estado.addEventListener('mouseleave', function() {
            // Remover destaque
            this.style.strokeWidth = '1';
            this.style.stroke = '#333';
            const opacity = dadosEstado ? Math.min(0.8, dadosEstado.total_elevadores * 0.1 + 0.3) : 0.3;
            this.style.opacity = opacity;
        });
        
// Adicionar eventos aos estados SVG
function adicionarEventosEstadosSVG() {
    const poligonosEstados = document.querySelectorAll('.estado-polygon');
    
    poligonosEstados.forEach(estado => {
        const sigla = estado.getAttribute('data-estado');
        const nome = estado.getAttribute('data-nome');
        const dadosEstado = dadosVendas.find(v => v.estado === sigla);
        
        estado.addEventListener('mouseenter', function() {
            // Destacar estado
            this.style.strokeWidth = '3';
            this.style.stroke = '#000';
            this.style.opacity = '0.9';
            
            mostrarInfoEstado(sigla, dadosEstado);
        });
        
        estado.addEventListener('mouseleave', function() {
            // Remover destaque
            this.style.strokeWidth = '1';
            this.style.stroke = '#333';
            const opacity = dadosEstado ? Math.min(0.8, dadosEstado.total_elevadores * 0.1 + 0.3) : 0.3;
            this.style.opacity = opacity;
        });
        
        estado.addEventListener('click', function() {
            mostrarDetalhesEstado(sigla);
        });
    });
}

// Função para mostrar informações do estado no hover
function mostrarInfoEstado(sigla, dadosEstado) {
    let infoContainer = document.getElementById('infoEstado');
    if (!infoContainer) {
        infoContainer = document.createElement('div');
        infoContainer.id = 'infoEstado';
        infoContainer.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
            max-width: 200px;
        `;
        document.body.appendChild(infoContainer);
    }
    
    if (dadosEstado) {
        infoContainer.innerHTML = `
            <strong>${dadosEstado.estado_nome || sigla}</strong><br>
            Elevadores: ${dadosEstado.total_elevadores}<br>
            Clientes: ${dadosEstado.total_clientes}
        `;
    } else {
        infoContainer.innerHTML = `
            <strong>${sigla}</strong><br>
            Nenhuma venda registrada
        `;
    }
    
    infoContainer.style.display = 'block';
    
    // Posicionar próximo ao mouse
    document.addEventListener('mousemove', function posicionarInfo(e) {
        infoContainer.style.left = (e.pageX + 10) + 'px';
        infoContainer.style.top = (e.pageY + 10) + 'px';
    });
}

// Função para obter cor baseada na quantidade
function obterCorPorQuantidade(quantidade) {
    if (quantidade === 0) return '#e3f2fd';
    if (quantidade <= 5) return '#bbdefb';
    if (quantidade <= 10) return '#90caf9';
    if (quantidade <= 20) return '#64b5f6';
    if (quantidade <= 50) return '#42a5f5';
    return '#2196f3';
}

// Função para criar top 5 estados
function criarTopEstados() {
    const topEstados = dadosVendas
        .sort((a, b) => b.total_elevadores - a.total_elevadores)
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
                    <div class="text-primary"><strong>${estado.total_elevadores}</strong> elevadores</div>
                    <small class="text-muted">${estado.total_clientes} clientes</small>
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p class="text-muted text-center">Nenhum dado disponível</p>';
    }
    
    document.getElementById('topEstados').innerHTML = html;
}

// Função para criar resumo geral
function criarResumoGeral() {
    const totalElevadores = dadosVendas.reduce((sum, item) => sum + item.total_elevadores, 0);
    const totalClientes = dadosVendas.reduce((sum, item) => sum + item.total_clientes, 0);
    const totalEstados = dadosVendas.length;
    const mediaElevadores = totalElevadores / totalEstados || 0;
    
    const resumoHtml = `
        <div class="row text-center">
            <div class="col-6 mb-3">
                <h4 class="text-primary">${totalElevadores}</h4>
                <small class="text-muted">Total de Elevadores</small>
            </div>
            <div class="col-6 mb-3">
                <h4 class="text-success">${totalClientes}</h4>
                <small class="text-muted">Total de Clientes</small>
            </div>
            <div class="col-6">
                <h4 class="text-info">${totalEstados}</h4>
                <small class="text-muted">Estados Ativos</small>
            </div>
            <div class="col-6">
                <h4 class="text-warning">${mediaElevadores.toFixed(1)}</h4>
                <small class="text-muted">Média por Estado</small>
            </div>
        </div>
    `;
    
    document.getElementById('resumoGeral').innerHTML = resumoHtml;
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
                            <i class="fas fa-map-marker-alt"></i> Contratos em ${estado.estado_nome || estado.estado}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <div class="card text-center border-primary">
                                    <div class="card-body">
                                        <h4 class="text-primary">${estado.total_elevadores}</h4>
                                        <small>Elevadores</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card text-center border-success">
                                    <div class="card-body">
                                        <h4 class="text-success">${estado.total_clientes}</h4>
                                        <small>Clientes</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card text-center border-info">
                                    <div class="card-body">
                                        <h4 class="text-info">${estado.elevacao_media || 0}mm</h4>
                                        <small>Elevação Média</small>
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
                            <th>Data de Entrega</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        contratos.forEach(contrato => {
            html += `
                <tr>
                    <td><strong>${contrato.cliente_nome}</strong></td>
                    <td>${formatarData(contrato.data_venda)}</td>
                    <td>${formatarData(contrato.data_entrega)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.open('/contratos', '_blank')">
                            <i class="fas fa-external-link-alt"></i> Ver
                        </button>
                    </td>
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
        document.getElementById('conteudoListagem').innerHTML = html;
        
    } catch (error) {
        showToast('Erro ao carregar elevadores por mês: ' + error.message, 'error');
    }
}

// Função para listar elevadores por estado
async function listarElevadoresPorEstado() {
    try {
        const elevadores = await apiRequest('/api/elevadores');
        
        // Agrupar por estado
        const elevadoresPorEstado = {};
        elevadores.forEach(elevador => {
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
        document.getElementById('conteudoListagem').innerHTML = html;
        
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

// Função para atualizar dados
async function atualizarDados() {
    await carregarRelatorios();
    showToast('Dados atualizados com sucesso!', 'success');
}

// Função para exportar relatório
function exportarRelatorio() {
    const dadosExport = {
        timestamp: new Date().toISOString(),
        resumo: {
            total_elevadores: dadosVendas.reduce((sum, item) => sum + item.total_elevadores, 0),
            total_clientes: dadosVendas.reduce((sum, item) => sum + item.total_clientes, 0),
            total_estados: dadosVendas.length
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

// Função para mostrar informações de um estado (usado quando hover sobre gráfico)
function mostrarInfoEstado(sigla, dados) {
    // Esta função pode ser expandida para mostrar tooltip ou info rápida
    console.log(`Estado: ${sigla}`, dados);
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
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        showToast('Erro ao filtrar dados: ' + error.message, 'error');
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

// Mostrar informações do estado
function mostrarInfoEstado(sigla, dados) {
    const container = document.getElementById('infoEstado');
    
    if (!dados) {
        container.innerHTML = `
            <div class="text-center">
                <h6 class="text-primary">${sigla}</h6>
                <p class="text-muted">Sem dados disponíveis</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="text-center">
            <h5 class="text-primary">${dados.estado_nome}</h5>
            <p class="text-muted mb-2">${sigla}</p>
        </div>
        <hr>
        <div class="row text-center">
            <div class="col-6">
                <div class="stat-card">
                    <h4 class="text-success">${dados.total_elevadores}</h4>
                    <small class="text-muted">Elevadores</small>
                </div>
            </div>
            <div class="col-6">
                <div class="stat-card">
                    <h4 class="text-info">${dados.total_clientes}</h4>
                    <small class="text-muted">Clientes</small>
                </div>
            </div>
        </div>
        <hr>
        <div class="text-center">
            <p class="mb-1"><strong>Elevação Média:</strong></p>
            <span class="badge bg-warning">${dados.elevacao_media}mm</span>
        </div>
        <div class="text-center mt-3">
            <button class="btn btn-sm btn-outline-primary" onclick="mostrarDetalhesEstado('${sigla}', dadosVendas.find(v => v.estado === '${sigla}'))">
                <i class="fas fa-eye"></i> Ver Detalhes
            </button>
        </div>
    `;
}

// Criar top 5 estados
function criarTopEstados() {
    const container = document.getElementById('topEstados');
    const topEstados = dadosVendas
        .filter(v => v.total_elevadores > 0)
        .sort((a, b) => b.total_elevadores - a.total_elevadores)
        .slice(0, 5);
    
    if (topEstados.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhum dado disponível</p>';
        return;
    }
    
    container.innerHTML = topEstados.map((estado, index) => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded ${index === 0 ? 'bg-warning bg-opacity-25' : 'bg-light'}">
            <div>
                <span class="badge ${index === 0 ? 'bg-warning' : 'bg-secondary'}">${index + 1}º</span>
                <strong class="ms-2">${estado.estado_nome}</strong>
                <small class="text-muted">(${estado.estado})</small>
            </div>
            <span class="badge bg-success">${estado.total_elevadores}</span>
        </div>
    `).join('');
}

// Criar cards de estatísticas
function criarCardsEstatisticas() {
    const container = document.getElementById('cardsEstatisticas');
    
    const totalElevadores = dadosVendas.reduce((sum, v) => sum + v.total_elevadores, 0);
    const totalClientes = dadosVendas.reduce((sum, v) => sum + v.total_clientes, 0);
    const estadosComVendas = dadosVendas.filter(v => v.total_elevadores > 0).length;
    const elevacaoMedia = dadosVendas.reduce((sum, v) => sum + (v.elevacao_media * v.total_elevadores), 0) / totalElevadores || 0;
    
    const cards = [
        { titulo: 'Total de Elevadores', valor: totalElevadores, icone: 'fas fa-elevator', cor: 'primary' },
        { titulo: 'Total de Clientes', valor: totalClientes, icone: 'fas fa-users', cor: 'success' },
        { titulo: 'Estados com Vendas', valor: `${estadosComVendas}/27`, icone: 'fas fa-map', cor: 'info' },
        { titulo: 'Elevação Média', valor: `${elevacaoMedia.toFixed(0)}mm`, icone: 'fas fa-arrows-alt-v', cor: 'warning' }
    ];
    
    container.innerHTML = cards.map(card => `
        <div class="col-md-3 mb-3">
            <div class="card border-${card.cor}">
                <div class="card-body text-center">
                    <i class="${card.icone} fa-2x text-${card.cor} mb-2"></i>
                    <h4 class="text-${card.cor}">${card.valor}</h4>
                    <p class="card-text text-muted">${card.titulo}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Criar gráfico de vendas
function criarGraficoVendas() {
    const canvas = document.getElementById('graficoVendas');
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico existente se houver
    if (window.graficoVendasChart) {
        window.graficoVendasChart.destroy();
    }
    
    const estadosComVendas = dadosVendas
        .filter(v => v.total_elevadores > 0)
        .sort((a, b) => b.total_elevadores - a.total_elevadores);
    
    window.graficoVendasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: estadosComVendas.map(v => v.estado),
            datasets: [{
                label: 'Elevadores Vendidos',
                data: estadosComVendas.map(v => v.total_elevadores),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Vendas de Elevadores por Estado'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Mostrar detalhes do estado em modal
function mostrarDetalhesEstado(sigla, dados) {
    const modal = new bootstrap.Modal(document.getElementById('modalDetalhesEstado'));
    const nomeModal = document.getElementById('nomeEstadoModal');
    const conteudoModal = document.getElementById('conteudoDetalhesEstado');
    
    if (!dados) {
        nomeModal.textContent = sigla;
        conteudoModal.innerHTML = '<p class="text-muted text-center">Sem dados disponíveis para este estado.</p>';
        modal.show();
        return;
    }
    
    nomeModal.textContent = `${dados.estado_nome} (${dados.estado})`;
    
    conteudoModal.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white text-center">
                        <h5 class="mb-0">Vendas</h5>
                    </div>
                    <div class="card-body text-center">
                        <h2 class="text-primary">${dados.total_elevadores}</h2>
                        <p class="text-muted">Elevadores vendidos</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-success">
                    <div class="card-header bg-success text-white text-center">
                        <h5 class="mb-0">Clientes</h5>
                    </div>
                    <div class="card-body text-center">
                        <h2 class="text-success">${dados.total_clientes}</h2>
                        <p class="text-muted">Clientes ativos</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="card border-warning">
                    <div class="card-header bg-warning text-dark text-center">
                        <h5 class="mb-0">Especificações Técnicas</h5>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-12">
                                <h4 class="text-warning">${dados.elevacao_media}mm</h4>
                                <p class="text-muted">Elevação média dos elevadores</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}
