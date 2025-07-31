// Gerenciamento do Calendário
let calendar;
let eventos = [];
let eventoAtual = null;

// Inicializar calendário ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    inicializarCalendario();
    carregarEventosComFiltro(); // Usar a nova função
    
    // Aguardar um pouco mais para garantir que todos os elementos estejam renderizados
    setTimeout(() => {
        configurarFiltros();
    }, 100);
    
    // Adicionar event listener para o botão de tela cheia
    const btnTelaCheia = document.getElementById('btnTelaCheia');
    if (btnTelaCheia) {
        btnTelaCheia.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleTelaCheia();
        });
    }
});

// Função separada para configurar os filtros
function configurarFiltros() {
    const statusTodos = document.getElementById('status-todos');
    const statusNaoIniciado = document.getElementById('status-nao-iniciado');
    const statusEmProducao = document.getElementById('status-em-producao');
    const statusPronto = document.getElementById('status-pronto');
    const statusEntregue = document.getElementById('status-entregue');
    
    // Remover event listeners existentes (se houver)
    document.querySelectorAll('input[id^="status-"]').forEach(checkbox => {
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    });
    
    // Configurar novos event listeners
    const elementos = {
        'status-nao-iniciado': 'Não iniciado', 
        'status-em-producao': 'Em produção',
        'status-pronto': 'Pronto',
        'status-entregue': 'Entregue'
    };
    
    // Event listener especial para "Todos"
    const elementoTodos = document.getElementById('status-todos');
    if (elementoTodos) {
        elementoTodos.addEventListener('change', function() {
            // Se "Todos" foi marcado, marcar todos os outros
            if (this.checked) {
                document.querySelectorAll('input[id^="status-"]:not(#status-todos)').forEach(checkbox => {
                    checkbox.checked = true;
                });
            } else {
                // Se "Todos" foi desmarcado, desmarcar todos os outros
                document.querySelectorAll('input[id^="status-"]:not(#status-todos)').forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            
            aplicarFiltroStatus();
        });
    }
    
    // Event listeners para os status específicos
    Object.entries(elementos).forEach(([id, nome]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('change', function() {
                aplicarFiltroStatus();
            });
        }
    });
}

// Função para inicializar o calendário
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: '' // Remove os botões de visualização do FullCalendar
        },
        buttonText: {
            today: 'Hoje'
        },
        // Configurações para eventos de dia inteiro
        allDaySlot: true,
        slotLabelFormat: {
            hour: 'numeric',
            minute: '2-digit',
            meridiem: false
        },
        // Configuração para visualização de lista sem horários
        listDayFormat: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },
        listDaySideFormat: false,
        // Remover exibição de horários em todas as visualizações
        displayEventTime: false,
        // Configurações específicas para visualização por semana
        views: {
            timeGridWeek: {
                allDaySlot: false, // Remove a linha "todo o dia"
                slotMinTime: '00:00:00',
                slotMaxTime: '24:00:00',
                displayEventTime: false
            },
            dayGridWeek: {
                displayEventTime: false // Remove horários na visualização de semana em grade
            },
            dayGridMonth: {
                displayEventTime: false // Remove horários na visualização mensal
            },
            listWeek: {
                displayEventTime: false // Remove horários na visualização de lista
            }
        },
        // Configuração global para eventos
        eventDisplay: 'block',
        eventTimeFormat: {
            hour: 'numeric',
            minute: '2-digit',
            meridiem: false
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
    
    // Forçar remoção de horários após renderização
    setTimeout(() => {
        document.querySelectorAll('.fc-event-time').forEach(el => el.remove());
        document.querySelectorAll('.fc-daygrid-event-time').forEach(el => el.remove());
        document.querySelectorAll('.fc-list-event-time').forEach(el => el.remove());
    }, 100);
    
    // Inicializar destaque do botão ativo
    atualizarBotaoAtivo('dayGridMonth');
}

// Função para carregar eventos
async function carregarEventos() {
    try {
        eventos = await apiRequest('/api/calendario');
        calendar.removeAllEvents();
        calendar.addEventSource(eventos);
        atualizarEstatisticas();
        
        // Forçar remoção de horários após adicionar eventos
        setTimeout(() => {
            document.querySelectorAll('.fc-event-time').forEach(el => el.remove());
            document.querySelectorAll('.fc-daygrid-event-time').forEach(el => el.remove());
            document.querySelectorAll('.fc-list-event-time').forEach(el => el.remove());
        }, 200);
        
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
    
    // Replicar exatamente a estrutura do modal de visualização de elevadores
    const detalhesHtml = `
        <!-- Informações Básicas -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-info-circle"></i> Informações Básicas</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Contrato:</label>
                        <p class="form-control-plaintext">#${props.contrato_id} - ${props.cliente_nome}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Comando:</label>
                        <p class="form-control-plaintext">${props.comando || 'N/A'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Status:</label>
                        <p class="form-control-plaintext">
                            <span class="badge ${props.status === 'Entregue' ? 'bg-info' : 
                                                  props.status === 'Pronto' ? 'bg-success' :
                                                  props.status === 'Em produção' ? 'bg-warning' : 'bg-secondary'}">
                                ${props.status || 'Não iniciado'}
                            </span>
                        </p>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Porta Inferior:</label>
                        <p class="form-control-plaintext">${props.porta_inferior || 'N/A'}</p>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Porta Superior:</label>
                        <p class="form-control-plaintext">${props.porta_superior || 'N/A'}</p>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Cor:</label>
                        <p class="form-control-plaintext">${props.cor || 'N/A'}</p>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-12">
                        <label class="form-label fw-bold">Observações:</label>
                        <p class="form-control-plaintext">${props.observacao || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dados da Cabine -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-cube"></i> Dados da Cabine</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Altura:</label>
                        <p class="form-control-plaintext">${props.altura_cabine || 'N/A'} mm</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Largura:</label>
                        <p class="form-control-plaintext">${props.largura_cabine || 'N/A'} mm</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Profundidade:</label>
                        <p class="form-control-plaintext">${props.profundidade_cabine || 'N/A'} mm</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Piso:</label>
                        <p class="form-control-plaintext">N/A</p>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Lado de Entrada:</label>
                        <p class="form-control-plaintext">${props.lado_entrada || 'N/A'}</p>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Lado de Saída:</label>
                        <p class="form-control-plaintext">${props.lado_saida || 'N/A'}</p>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Cabine Montada:</label>
                        <p class="form-control-plaintext"><span class="badge bg-secondary">N/A</span></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dados da Coluna -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-arrows-alt-v"></i> Dados da Coluna</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Elevação:</label>
                        <p class="form-control-plaintext">${props.elevacao || 'N/A'} mm</p>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Coluna Montada:</label>
                        <p class="form-control-plaintext"><span class="badge bg-secondary">N/A</span></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Adicionais -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-plus-circle"></i> Adicionais</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Cancela:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.cancela || '0'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Porta:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.porta || '0'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Portão:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.portao || '0'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Barreira Eletrônica:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.barreira_eletronica || '0'}</p>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Lados Enclausuramento:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.lados_enclausuramento || '0'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Sensor Esmagamento:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.sensor_esmagamento || '0'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Rampa de Acesso:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.rampa_acesso || '0'}</p>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Nobreak:</label>
                        <p class="form-control-plaintext">${props.itens_adicionais?.nobreak || '0'}</p>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-12">
                        <label class="form-label fw-bold">Galvanizada:</label>
                        <p class="form-control-plaintext">
                            <span class="badge ${props.itens_adicionais?.galvanizada ? 'bg-success' : 'bg-secondary'}">
                                ${props.itens_adicionais?.galvanizada ? 'Sim' : 'Não'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('detalhesEvento').innerHTML = detalhesHtml;
    
    // Armazenar elevador atual para compatibilidade
    window.elevadorVisualizacaoAtual = { id: props.elevador_id };
    
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

// Função para atualizar o destaque dos botões de visualização
function atualizarBotaoAtivo(viewType) {
    // Remover classe ativa de todos os botões
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('btn-outline-primary');
        btn.classList.remove('btn-primary');
    });
    
    // Adicionar classe ativa ao botão correspondente
    let btnAtivo = null;
    switch(viewType) {
        case 'dayGridMonth':
            btnAtivo = document.querySelector('button[onclick="visualizarMes()"]');
            break;
        case 'dayGridWeek':
            btnAtivo = document.querySelector('button[onclick="visualizarSemana()"]');
            break;
        case 'listWeek':
            btnAtivo = document.querySelector('button[onclick="visualizarLista()"]');
            break;
    }
    
    if (btnAtivo) {
        btnAtivo.classList.add('active');
        btnAtivo.classList.remove('btn-outline-primary');
        btnAtivo.classList.add('btn-primary');
    }
}

// Funções para mudar visualização
function visualizarMes() {
    calendar.changeView('dayGridMonth');
    atualizarBotaoAtivo('dayGridMonth');
}

function visualizarSemana() {
    calendar.changeView('dayGridWeek');
    atualizarBotaoAtivo('dayGridWeek');
}

function visualizarLista() {
    calendar.changeView('listWeek');
    atualizarBotaoAtivo('listWeek');
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
    setInterval(carregarEventosComFiltro, 5 * 60 * 1000);
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

// Variável para armazenar eventos originais
let eventosOriginais = [];

// Função para aplicar filtro por status
function aplicarFiltroStatus() {
    // Primeiro, obter todos os status selecionados (exceto "Todos")
    const statusSelecionados = [];
    const checkboxesStatus = document.querySelectorAll('input[id^="status-"]:not(#status-todos)');
    
    checkboxesStatus.forEach(checkbox => {
        if (checkbox.checked) {
            statusSelecionados.push(checkbox.value);
        }
    });
    
    // Atualizar o estado do checkbox "Todos" baseado nos outros
    const todosMarcado = statusSelecionados.length === checkboxesStatus.length;
    const checkboxTodos = document.getElementById('status-todos');
    
    if (checkboxTodos.checked !== todosMarcado) {
        checkboxTodos.checked = todosMarcado;
    }
    
    // Se nenhum status específico está marcado, não mostrar eventos
    if (statusSelecionados.length === 0) {
        calendar.removeAllEvents();
        return;
    }
    
    // Se todos os status estão selecionados, mostrar todos os eventos
    if (statusSelecionados.length === checkboxesStatus.length) {
        calendar.removeAllEvents();
        calendar.addEventSource(eventosOriginais);
        return;
    }
    
    // Filtrar eventos baseado no status selecionado
    const eventosFiltrados = eventosOriginais.filter(evento => {
        const statusEvento = evento.extendedProps?.status || 'Não iniciado';
        return statusSelecionados.includes(statusEvento);
    });
    
    // Atualizar calendário
    calendar.removeAllEvents();
    calendar.addEventSource(eventosFiltrados);
}

// Modificar a função carregarEventos para armazenar eventos originais
async function carregarEventosComFiltro() {
    try {
        const eventosCarregados = await apiRequest('/api/calendario');
        eventosOriginais = eventosCarregados;
        eventos = eventosCarregados;
        
        calendar.removeAllEvents();
        calendar.addEventSource(eventos);
        atualizarEstatisticas();
        
        // Forçar remoção de horários após adicionar eventos
        setTimeout(() => {
            document.querySelectorAll('.fc-event-time').forEach(el => el.remove());
            document.querySelectorAll('.fc-daygrid-event-time').forEach(el => el.remove());
            document.querySelectorAll('.fc-list-event-time').forEach(el => el.remove());
        }, 200);
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showToast('Erro ao carregar eventos do calendário: ' + error.message, 'error');
    }
}
