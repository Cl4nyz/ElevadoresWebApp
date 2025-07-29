// Gerenciamento do Calendário
let calendar;
let eventos = [];
let eventoAtual = null;

// Inicializar calendário ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - inicializando calendário'); // Debug
    
    inicializarCalendario();
    carregarEventos();
    
    // Adicionar event listener para o botão de tela cheia
    const btnTelaCheia = document.getElementById('btnTelaCheia');
    if (btnTelaCheia) {
        console.log('Botão de tela cheia encontrado'); // Debug
        btnTelaCheia.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clique no botão de tela cheia detectado'); // Debug
            toggleTelaCheia();
        });
    } else {
        console.error('Botão de tela cheia não encontrado!'); // Debug
    }
});

// Função para inicializar o calendário
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            list: 'Lista'
        },
        height: 'auto',
        events: [],
        eventClick: function(info) {
            mostrarDetalhesEvento(info.event);
        },
        eventMouseEnter: function(info) {
            // Adicionar tooltip ou highlight
            info.el.style.cursor = 'pointer';
        },
        dateClick: function(info) {
            // Opcional: criar novo evento ao clicar em uma data
            console.log('Data clicada:', info.dateStr);
        }
    });
    
    calendar.render();
}

// Função para carregar eventos
async function carregarEventos() {
    try {
        eventos = await apiRequest('/api/calendario');
        calendar.removeAllEvents();
        calendar.addEventSource(eventos);
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showToast('Erro ao carregar eventos do calendário: ' + error.message, 'error');
    }
}

// Função para atualizar estatísticas
function atualizarEstatisticas() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    let totalElevadores = eventos.length;
    let entregasMes = 0;
    let entregasPendentes = 0;
    
    eventos.forEach(evento => {
        const dataEntrega = criarDataSegura(evento.start);
        
        // Entregas deste mês
        if (dataEntrega >= inicioMes && dataEntrega <= fimMes) {
            entregasMes++;
        }
        
        // Entregas pendentes (futuras)
        if (dataEntrega > hoje) {
            entregasPendentes++;
        }
    });
    
    document.getElementById('totalElevadores').textContent = totalElevadores;
    document.getElementById('entregasMes').textContent = entregasMes;
    document.getElementById('entregasPendentes').textContent = entregasPendentes;
}

// Função para mostrar detalhes do evento
function mostrarDetalhesEvento(evento) {
    eventoAtual = evento;
    const props = evento.extendedProps;
    
    const detalhesHtml = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-elevator"></i> Informações do Elevador</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>ID:</strong></td>
                        <td>#${props.elevador_id}</td>
                    </tr>
                    <tr>
                        <td><strong>Elevação:</strong></td>
                        <td>${props.elevacao} mm</td>
                    </tr>
                    <tr>
                        <td><strong>Cor:</strong></td>
                        <td>
                            ${props.cor ? 
                                `<span class="badge" style="background-color: ${props.cor.toLowerCase()}; color: white;">${props.cor}</span>` :
                                '<span class="badge bg-secondary">Sem cor</span>'
                            }
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Altura da Cabine:</strong></td>
                        <td>${props.altura_cabine} cm</td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-user"></i> Informações do Cliente</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Cliente:</strong></td>
                        <td>${props.cliente_nome}</td>
                    </tr>
                    <tr>
                        <td><strong>Localização:</strong></td>
                        <td>${props.cidade && props.estado ? `${props.cidade}, ${props.estado}` : 'Não informado'}</td>
                    </tr>
                    <tr>
                        <td><strong>Data da Venda:</strong></td>
                        <td>${props.data_venda ? formatarData(props.data_venda) : 'Não definida'}</td>
                    </tr>
                    <tr>
                        <td><strong>Data de Entrega:</strong></td>
                        <td>${formatarData(evento.start)}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td>${obterStatusEntrega(criarDataSegura(evento.start))}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <strong>Título do Evento:</strong> ${evento.title}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('detalhesEvento').innerHTML = detalhesHtml;
    
    const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
    modal.show();
}

// Função para obter status da entrega
function obterStatusEntrega(dataEntrega) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataEntrega.setHours(0, 0, 0, 0);
    
    if (dataEntrega < hoje) {
        return '<span class="badge bg-danger">Atrasado</span>';
    } else if (dataEntrega.getTime() === hoje.getTime()) {
        return '<span class="badge bg-warning">Entrega hoje</span>';
    } else {
        return '<span class="badge bg-success">Programado</span>';
    }
}

// Função para editar elevador a partir do calendário
function editarElevadorCalendario() {
    if (eventoAtual) {
        const elevadorId = eventoAtual.extendedProps.elevador_id;
        // Redirecionar para a página de elevadores com o ID
        window.location.href = `/elevadores?edit=${elevadorId}`;
    }
}

// Funções para mudar visualização
function visualizarMes() {
    calendar.changeView('dayGridMonth');
}

function visualizarSemana() {
    calendar.changeView('timeGridWeek');
}

function visualizarLista() {
    calendar.changeView('listWeek');
}

// Função para alternar tela cheia
function toggleTelaCheia() {
    console.log('toggleTelaCheia chamado'); // Debug
    
    try {
        const body = document.body;
        const navbar = document.querySelector('.navbar');
        const mainContainer = document.querySelector('main.container');
        const btnTelaCheia = document.getElementById('btnTelaCheia');
        
        const isFullscreen = body.classList.contains('fullscreen-mode');
        
        if (isFullscreen) {
            // Sair da tela cheia
            console.log('Saindo da tela cheia'); // Debug
            
            // Remover classe fullscreen
            body.classList.remove('fullscreen-mode');
            
            // Restaurar elementos
            if (navbar) navbar.style.display = 'block';
            if (mainContainer) mainContainer.style.display = 'block';
            
            // Remover overlay
            const overlay = document.getElementById('fullscreen-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // Restaurar calendário original
            restoreOriginalCalendar();
            
            // Atualizar botão
            if (btnTelaCheia) {
                const icon = btnTelaCheia.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-expand';
                }
                btnTelaCheia.title = 'Tela Cheia';
            }
            
        } else {
            // Entrar na tela cheia
            console.log('Entrando na tela cheia'); // Debug
            
            // Adicionar classe fullscreen
            body.classList.add('fullscreen-mode');
            
            // Ocultar elementos
            if (navbar) navbar.style.display = 'none';
            if (mainContainer) mainContainer.style.display = 'none';
            
            // Criar overlay
            createFullscreenOverlay();
            
            // Atualizar botão
            if (btnTelaCheia) {
                const icon = btnTelaCheia.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-compress';
                }
                btnTelaCheia.title = 'Sair da Tela Cheia';
            }
        }
        
        // Redesenhar calendário após um delay
        setTimeout(() => {
            if (calendar) {
                calendar.updateSize();
                console.log('Calendário redimensionado'); // Debug
            }
        }, 300);
        
    } catch (error) {
        console.error('Erro ao alternar tela cheia:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao alternar tela cheia: ' + error.message, 'error');
        } else {
            alert('Erro ao alternar tela cheia: ' + error.message);
        }
    }
}

// Função para criar overlay de tela cheia
function createFullscreenOverlay() {
    // Remover overlay existente se houver
    const existingOverlay = document.getElementById('fullscreen-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Criar novo overlay
    const overlay = document.createElement('div');
    overlay.id = 'fullscreen-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        z-index: 9999;
        padding: 20px;
        box-sizing: border-box;
        overflow: auto;
    `;
    
    // Criar cabeçalho
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    const title = document.createElement('h2');
    title.innerHTML = '<i class="fas fa-calendar"></i> Calendário de Entregas - Tela Cheia';
    title.style.cssText = 'margin: 0; color: #495057;';
    
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; align-items: center;';
    controls.innerHTML = `
        <div class="btn-group">
            <button class="btn btn-outline-primary btn-sm" onclick="visualizarMes()">
                <i class="fas fa-calendar-day"></i> Mês
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="visualizarSemana()">
                <i class="fas fa-calendar-week"></i> Semana
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="visualizarLista()">
                <i class="fas fa-list"></i> Lista
            </button>
        </div>
        <button class="btn btn-outline-danger btn-sm" id="btnSairFullscreen" title="Sair da Tela Cheia">
            <i class="fas fa-times"></i> Sair
        </button>
    `;
    
    header.appendChild(title);
    header.appendChild(controls);
    
    // Adicionar event listener ao botão de sair
    const btnSair = controls.querySelector('#btnSairFullscreen');
    if (btnSair) {
        btnSair.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTelaCheia();
        });
    }
    
    // Criar container do calendário
    const calendarContainer = document.createElement('div');
    calendarContainer.style.cssText = `
        height: calc(100vh - 120px);
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    const calendarDiv = document.createElement('div');
    calendarDiv.id = 'calendar-fullscreen';
    calendarDiv.style.cssText = 'height: 100%;';
    
    calendarContainer.appendChild(calendarDiv);
    
    // Montar overlay
    overlay.appendChild(header);
    overlay.appendChild(calendarContainer);
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Recriar calendário no novo container
    setTimeout(() => {
        if (calendar) {
            const originalCalendar = document.getElementById('calendar');
            if (originalCalendar) {
                // Salvar o HTML do calendário original
                const calendarHTML = originalCalendar.innerHTML;
                
                // Destruir calendário atual
                calendar.destroy();
                
                // Recriar no novo container
                calendar = new FullCalendar.Calendar(calendarDiv, {
                    initialView: 'dayGridMonth',
                    locale: 'pt-br',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek'
                    },
                    buttonText: {
                        today: 'Hoje',
                        month: 'Mês',
                        week: 'Semana',
                        list: 'Lista'
                    },
                    height: '100%',
                    events: eventos || [],
                    eventClick: function(info) {
                        if (typeof mostrarDetalhesEvento === 'function') {
                            mostrarDetalhesEvento(info.event);
                        }
                    },
                    eventMouseEnter: function(info) {
                        info.el.style.cursor = 'pointer';
                    },
                    dateClick: function(info) {
                        console.log('Data clicada:', info.dateStr);
                    }
                });
                
                calendar.render();
                console.log('Calendário recriado em tela cheia');
            }
        }
    }, 100);
}

// Função para restaurar o calendário original
function restoreOriginalCalendar() {
    const originalCalendarEl = document.getElementById('calendar');
    if (originalCalendarEl && calendar) {
        // Destruir calendário atual se existir
        if (calendar) {
            calendar.destroy();
        }
        
        // Recriar calendário no elemento original
        calendar = new FullCalendar.Calendar(originalCalendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt-br',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                list: 'Lista'
            },
            height: 'auto',
            events: eventos || [],
            eventClick: function(info) {
                if (typeof mostrarDetalhesEvento === 'function') {
                    mostrarDetalhesEvento(info.event);
                }
            },
            eventMouseEnter: function(info) {
                info.el.style.cursor = 'pointer';
            },
            dateClick: function(info) {
                console.log('Data clicada:', info.dateStr);
            }
        });
        
        calendar.render();
        console.log('Calendário original restaurado');
    }
}

// Listener para ESC sair da tela cheia
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const body = document.body;
        if (body.classList.contains('fullscreen-mode')) {
            toggleTelaCheia();
        }
    }
});

// Função para filtrar eventos por status
function filtrarEventos(status) {
    const hoje = new Date();
    let eventosFiltrados = [];
    
    switch(status) {
        case 'atrasados':
            eventosFiltrados = eventos.filter(evento => criarDataSegura(evento.start) < hoje);
            break;
        case 'hoje':
            eventosFiltrados = eventos.filter(evento => {
                const dataEvento = criarDataSegura(evento.start);
                return dataEvento.toDateString() === hoje.toDateString();
            });
            break;
        case 'futuros':
            eventosFiltrados = eventos.filter(evento => criarDataSegura(evento.start) > hoje);
            break;
        default:
            eventosFiltrados = eventos;
    }
    
    calendar.removeAllEvents();
    calendar.addEventSource(eventosFiltrados);
}

// Event listeners para botões de filtro (se existirem)
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar botões de filtro se necessário
    const filtros = ['todos', 'atrasados', 'hoje', 'futuros'];
    
    filtros.forEach(filtro => {
        const btn = document.getElementById(`filtro-${filtro}`);
        if (btn) {
            btn.addEventListener('click', () => filtrarEventos(filtro));
        }
    });
    
    // Atualizar eventos a cada 5 minutos
    setInterval(carregarEventos, 5 * 60 * 1000);
});

// Função para exportar calendário
function exportarCalendario() {
    const dadosExportacao = eventos.map(evento => ({
        'ID Elevador': evento.extendedProps.elevador_id,
        'Cliente': evento.extendedProps.cliente_nome,
        'Cidade': evento.extendedProps.cidade || 'N/A',
        'Estado': evento.extendedProps.estado || 'N/A',
        'Data Entrega': formatarData(evento.start),
        'Data da Venda': evento.extendedProps.data_venda ? formatarData(evento.extendedProps.data_venda) : 'N/A',
        'Elevação': evento.extendedProps.elevacao + ' mm',
        'Cor': evento.extendedProps.cor || 'N/A',
        'Altura Cabine': evento.extendedProps.altura_cabine + ' cm'
    }));
    
    exportarCSV(dadosExportacao, 'calendario_entregas');
}
