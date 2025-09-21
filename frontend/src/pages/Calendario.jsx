import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { elevadoresApi } from '../services/api';

const Calendario = () => {
  const calendarRef = useRef(null);
  const [calendar, setCalendar] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [filtros, setFiltros] = useState({
    todos: true,
    'Não iniciado': true,
    'Em produção': true,
    'Concluído': true,
    'Entregue': true
  });
  const [stats, setStats] = useState({
    totalElevadores: 0,
    entregasMes: 0,
    entregasPendentes: 0
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    initializeCalendar();
    loadEvents();
  }, []);

  useEffect(() => {
    if (calendar) {
      const filteredEvents = eventos.filter(evento => {
        if (filtros.todos) return true;
        return filtros[evento.extendedProps.status] || false;
      });
      calendar.removeAllEvents();
      calendar.addEventSource(filteredEvents);
      calculateStats(filteredEvents);
    }
  }, [filtros, eventos, calendar]);

  const initializeCalendar = () => {
    if (calendarRef.current) {
      const cal = new Calendar(calendarRef.current, {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
        initialView: 'dayGridMonth',
        locale: ptBrLocale,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        height: 'auto',
        eventClick: function(info) {
          handleEventClick(info.event);
        },
        eventDidMount: function(info) {
          info.el.style.cursor = 'pointer';
        }
      });
      cal.render();
      setCalendar(cal);
    }
  };

  const loadEvents = async () => {
    try {
      const elevadoresResponse = await elevadoresApi.getAll();
      const elevadores = elevadoresResponse.data;

      const events = elevadores.map(elevador => {
      const cliente = elevador.cliente_nome || 'Cliente não encontrado';
      const status = getElevatorStatus(elevador);
      const color = getStatusColor(status);
      
      // Ensure the date is formatted as YYYY-MM-DD (all-day format)
      let eventDate = elevador.data_entrega || elevador.data_venda;
      if (eventDate) {
          // Convert to YYYY-MM-DD format to ensure it's treated as all-day
          eventDate = new Date(eventDate).toISOString().split('T')[0];
      }

      return {
          id: `elevador-${elevador.id}`,
          title: `${cliente}`,
          start: eventDate,
          allDay: true, // Explicitly mark as all-day event
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
              tipo: 'elevador',
              elevador: elevador,
              status: status,
              cliente: cliente
          }
      };
  });

      setEventos(events);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const getElevatorStatus = (elevador) => {
    return elevador.status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Não iniciado': '#6c757d',
      'Em produção': '#ffc107',
      'Concluído': '#28a745',
      'Entregue': '#17a2b8'
    };
    return colors[status] || '#6c757d';
  };

  const handleEventClick = (event) => {
    const props = event.extendedProps;
    if (props.tipo === 'elevador') {
      const elevador = props.elevador;
      alert(`Elevador #${elevador.id}\nCliente: ${props.cliente}\nData de Entrega: ${formatDate(elevador.data_entrega)}\nStatus: ${props.status}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateStats = (events) => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const entregasMes = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= inicioMes && eventDate <= fimMes;
    }).length;

    const entregasPendentes = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate > hoje;
    }).length;

    setStats({
      totalElevadores: events.length,
      entregasMes,
      entregasPendentes
    });
  };

  const handleFilterChange = (filterName) => {
    if (filterName === 'todos') {
      const newValue = !filtros.todos;
      setFiltros({
        todos: newValue,
        'Não iniciado': newValue,
        'Em produção': newValue,
        'Concluído': newValue,
        'Entregue': newValue
      });
    } else {
      const newFiltros = { ...filtros, [filterName]: !filtros[filterName] };
      const allSelected = Object.keys(newFiltros).filter(key => key !== 'todos').every(key => newFiltros[key]);
      newFiltros.todos = allSelected;
      setFiltros(newFiltros);
    }
  };

  const changeView = (viewName) => {
    if (calendar) {
      calendar.changeView(viewName);
    }
  };

  // ...existing code...
  // ...existing code...
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Destroy the current calendar instance
    if (calendar) {
      calendar.destroy();
    }
    
    // Reinitialize the calendar after the DOM update
    setTimeout(() => {
      initializeCalendar();
    }, 100);
  };

  // Add effect to reinitialize calendar when fullscreen changes
  useEffect(() => {
    if (calendar) {
      // Apply current events to the new calendar instance
      calendar.removeAllEvents();
      const filteredEvents = eventos.filter(evento => {
        if (filtros.todos) return true;
        return filtros[evento.extendedProps.status] || false;
      });
      calendar.addEventSource(filteredEvents);
    }
  }, [calendar]);

  return (
    <div className={isFullscreen ? 'position-fixed top-0 start-0 w-100 h-100 bg-white' : ''} 
         style={{ 
           zIndex: isFullscreen ? 9999 : 'auto',
           padding: isFullscreen ? '20px' : '0'
         }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fas fa-calendar me-2"></i>Calendário de Entregas - Elevadores</h2>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button className="btn btn-outline-primary" onClick={() => changeView('dayGridMonth')}>
              <i className="fas fa-calendar-day me-1"></i>Mês
            </button>
            <button className="btn btn-outline-primary" onClick={() => changeView('timeGridWeek')}>
              <i className="fas fa-calendar-week me-1"></i>Semana
            </button>
            <button className="btn btn-outline-primary" onClick={() => changeView('listWeek')}>
              <i className="fas fa-list me-1"></i>Lista
            </button>
          </div>
          <button className="btn btn-outline-success" onClick={toggleFullscreen}>
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} me-1`}></i>
            {isFullscreen ? 'Sair' : 'Tela Cheia'}
          </button>
        </div>
      </div>

      <div className="row">
        <div className={isFullscreen ? 'col-12' : 'col-md-9'}>
          <div className="card" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : 'auto' }}>
            <div className="card-body">
              <div ref={calendarRef} style={{ height: isFullscreen ? '100%' : 'auto' }}></div>
            </div>
          </div>
        </div>
        
        {!isFullscreen && (
          <div className="col-md-3">
            {/* Filtros */}
            <div className="card mb-3">
              <div className="card-header">
                <h6><i className="fas fa-filter me-1"></i>Filtros</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Status:</label>
                  
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="status-todos"
                      checked={filtros.todos}
                      onChange={() => handleFilterChange('todos')}
                    />
                    <label className="form-check-label" htmlFor="status-todos">
                      Todos
                    </label>
                  </div>
                  
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="status-nao-iniciado"
                      checked={filtros['Não iniciado']}
                      onChange={() => handleFilterChange('Não iniciado')}
                    />
                    <label className="form-check-label" htmlFor="status-nao-iniciado">
                      <span className="badge bg-secondary me-1">■</span>Não iniciado
                    </label>
                  </div>
                  
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="status-em-producao"
                      checked={filtros['Em produção']}
                      onChange={() => handleFilterChange('Em produção')}
                    />
                    <label className="form-check-label" htmlFor="status-em-producao">
                      <span className="badge bg-warning me-1">■</span>Em produção
                    </label>
                  </div>
                  
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="status-concluido"
                      checked={filtros['Concluído']}
                      onChange={() => handleFilterChange('Concluído')}
                    />
                    <label className="form-check-label" htmlFor="status-concluido">
                      <span className="badge bg-success me-1">■</span>Concluído
                    </label>
                  </div>
                  
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="status-entregue"
                      checked={filtros['Entregue']}
                      onChange={() => handleFilterChange('Entregue')}
                    />
                    <label className="form-check-label" htmlFor="status-entregue">
                      <span className="badge bg-info me-1">■</span>Entregue
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Estatísticas */}
            <div className="card">
              <div className="card-header">
                <h6><i className="fas fa-chart-bar me-1"></i>Estatísticas</h6>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Total de Elevadores:</span>
                  <strong>{stats.totalElevadores}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Entregas Este Mês:</span>
                  <strong>{stats.entregasMes}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Entregas Pendentes:</span>
                  <strong>{stats.entregasPendentes}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendario;
