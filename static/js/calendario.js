// Gerenciamento do Calendário
let calendar;
let eventos = [];
let eventoAtual = null;

// Inicializar calendário ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    inicializarCalendario();
    carregarEventos();
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
        const dataEntrega = new Date(evento.start + 'T00:00:00');
        
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
                        <td><strong>Data da Venda:</strong></td>
                        <td>${props.data_venda ? formatarData(props.data_venda) : 'Não definida'}</td>
                    </tr>
                    <tr>
                        <td><strong>Data de Entrega:</strong></td>
                        <td>${formatarData(evento.start)}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td>${obterStatusEntrega(new Date(evento.start + 'T00:00:00'))}</td>
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

// Função para filtrar eventos por status
function filtrarEventos(status) {
    const hoje = new Date();
    let eventosFiltrados = [];
    
    switch(status) {
        case 'atrasados':
            eventosFiltrados = eventos.filter(evento => new Date(evento.start + 'T00:00:00') < hoje);
            break;
        case 'hoje':
            eventosFiltrados = eventos.filter(evento => {
                const dataEvento = new Date(evento.start + 'T00:00:00');
                return dataEvento.toDateString() === hoje.toDateString();
            });
            break;
        case 'futuros':
            eventosFiltrados = eventos.filter(evento => new Date(evento.start + 'T00:00:00') > hoje);
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
        'Data Entrega': formatarData(evento.start),
        'Data da Venda': evento.extendedProps.data_venda ? formatarData(evento.extendedProps.data_venda) : 'N/A',
        'Elevação': evento.extendedProps.elevacao + ' mm',
        'Cor': evento.extendedProps.cor || 'N/A',
        'Altura Cabine': evento.extendedProps.altura_cabine + ' cm'
    }));
    
    exportarCSV(dadosExportacao, 'calendario_entregas');
}
