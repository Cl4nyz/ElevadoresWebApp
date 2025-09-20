import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { elevadoresApi, contratosApi, clientesApi } from '../services/api';
import { handleFormDataChange as utilHandleFormDataChange } from '../utils/formUtils';
import '../styles/elevadores.css'

const Elevadores = () => {
  const [elevadores, setElevadores] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showSelecionarContratoModal, setShowSelecionarContratoModal] = useState(false);
  const [editingElevador, setEditingElevador] = useState(null);
  const [visualizandoElevador, setVisualizandoElevador] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredElevadores, setFilteredElevadores] = useState([]);
  const [corCustomMode, setCorCustomMode] = useState(false);
  const [pisoCustomMode, setPisoCustomMode] = useState(false);
  const navigate = useNavigate();

  // Estados para os formulários
  const [formData, setFormData] = useState({
    id_contrato: '',
    comando: '',
    porta_inferior: '',
    porta_superior: '',
    cor: '',
    status: 'Não iniciado',
    observacao: '',
    cabine: {
      altura: '',
      largura: '',
      profundidade: '',
      piso: '',
      montada: false,
      lado_entrada: '',
      lado_saida: ''
    },
    coluna: {
      elevacao: '',
      montada: false
    },
    adicionais: {
      cancela: 0,
      porta: 0,
      portao: 0,
      barreira_eletronica: 0,
      lados_enclausuramento: 0,
      sensor_esmagamento: 0,
      rampa_acesso: 0,
      nobreak: 0,
      galvanizada: false
    }
  });

  // Hook de inicialização
  useEffect(() => {
    carregarDados();
  }, []);

  // Hook para filtrar elevadores
  useEffect(() => {
    if (!searchTerm) {
      setFilteredElevadores(elevadores);
    } else {
      const filtered = elevadores.filter(elevador => {
        const contrato = contratos.find(c => c.id === elevador.id_contrato);
        const cliente = contrato ? clientes.find(c => c.id === contrato.id_cliente) : null;
        const clienteNome = cliente ? cliente.nome : elevador.cliente_nome || '';
        
        return (
          clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          elevador.id.toString().includes(searchTerm) ||
          elevador.id_contrato.toString().includes(searchTerm) ||
          (elevador.cor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (elevador.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (elevador.comando || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredElevadores(filtered);
    }
  }, [searchTerm, elevadores, contratos, clientes]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        // Check which modals are open and close them
        if (showModal) {
          setShowModal(false);
          setEditingElevador(null);
          // Reset form data when closing edit modal
          setFormData({
            id_contrato: '',
            comando: '',
            porta_inferior: '',
            porta_superior: '',
            cor: '',
            status: 'Não iniciado',
            observacao: '',
            cabine: {
              altura: '',
              largura: '',
              profundidade: '',
              piso: '',
              montada: false,
              lado_entrada: '',
              lado_saida: ''
            },
            coluna: {
              elevacao: '',
              montada: false
            },
            adicionais: {
              cancela: 0,
              porta: 0,
              portao: 0,
              barreira_eletronica: 0,
              lados_enclausuramento: 0,
              sensor_esmagamento: 0,
              rampa_acesso: 0,
              nobreak: 0,
              galvanizada: false
            }
          });
        }
        
        if (showVisualizarModal) {
          setShowVisualizarModal(false);
          setVisualizandoElevador(null);
        }
        
        if (showSelecionarContratoModal) {
          setShowSelecionarContratoModal(false);
        }
      }
    };

    // Add event listener when component mounts
    document.addEventListener('keydown', handleEscKey);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, showVisualizarModal, showSelecionarContratoModal]); // Dependencies include modal states

  // Funções de carregamento de dados
  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarElevadores(),
        carregarContratos(),
        carregarClientes()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarElevadores = async () => {
    try {
      const response = await elevadoresApi.getAll();
      setElevadores(response.data);
    } catch (error) {
      console.error('Erro ao carregar elevadores:', error);
      throw error;
    }
  };

  const carregarContratos = async () => {
    try {
      const response = await contratosApi.getAll();
      setContratos(response.data);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      throw error;
    }
  };

  const carregarClientes = async () => {
    try {
      const response = await clientesApi.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      throw error;
    }
  };

  // Funções de manipulação de modais
  const novoElevador = () => {
    setEditingElevador(null);
    setFormData({
      id_contrato: '',
      comando: '',
      porta_inferior: '',
      porta_superior: '',
      cor: '',
      status: 'Não iniciado',
      observacao: '',
      cabine: {
        altura: '',
        largura: '',
        profundidade: '',
        piso: '',
        montada: false,
        lado_entrada: '',
        lado_saida: ''
      },
      coluna: {
        elevacao: '',
        montada: false
      },
      adicionais: {
        cancela: 0,
        porta: 0,
        portao: 0,
        barreira_eletronica: 0,
        lados_enclausuramento: 0,
        sensor_esmagamento: 0,
        rampa_acesso: 0,
        nobreak: 0,
        galvanizada: false
      }
    });
    setShowModal(true);
  };

  const editarElevador = (elevador) => {
    setEditingElevador(elevador);
    setFormData({
      id_contrato: elevador.id_contrato || '',
      comando: elevador.comando || '',
      porta_inferior: elevador.porta_inferior || '',
      porta_superior: elevador.porta_superior || '',
      cor: elevador.cor || '',
      status: elevador.status || 'Não iniciado',
      observacao: elevador.observacao || '',
      cabine: {
        altura: elevador.cabine?.altura || '',
        largura: elevador.cabine?.largura || '',
        profundidade: elevador.cabine?.profundidade || '',
        piso: elevador.cabine?.piso || '',
        montada: elevador.cabine?.montada || false,
        lado_entrada: elevador.cabine?.lado_entrada || '',
        lado_saida: elevador.cabine?.lado_saida || ''
      },
      coluna: {
        elevacao: elevador.coluna?.elevacao || '',
        montada: elevador.coluna?.montada || false
      },
      adicionais: {
        cancela: elevador.adicionais?.cancela || 0,
        porta: elevador.adicionais?.porta || 0,
        portao: elevador.adicionais?.portao || 0,
        barreira_eletronica: elevador.adicionais?.barreira_eletronica || 0,
        lados_enclausuramento: elevador.adicionais?.lados_enclausuramento || 0,
        sensor_esmagamento: elevador.adicionais?.sensor_esmagamento || 0,
        rampa_acesso: elevador.adicionais?.rampa_acesso || 0,
        nobreak: elevador.adicionais?.nobreak || 0,
        galvanizada: elevador.adicionais?.galvanizada || false
      }
    });
    setShowModal(true);
    
    // Add this setTimeout to call the cabin drawing after modal is shown
    setTimeout(() => {
      atualizarDesenhoCabineEdicao(elevador);
    }, 300);
  };

  const visualizarElevador = (elevador) => {
    setVisualizandoElevador(elevador);
    setShowVisualizarModal(true);

    setTimeout(() => {
      atualizarDesenhoCabineVisualizacao(elevador);
    }, 300);
  };

  // Função de notificação
  const showToast = (message, type = 'info') => {
    // Implementação simples de toast - pode ser substituída por uma biblioteca
    const toastClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-danger' : 'alert-info';
    
    const toast = document.createElement('div');
    toast.className = `alert ${toastClass} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  };

  // Função de salvamento
  const salvarElevador = async () => {
    try {
      if (!formData.id_contrato) {
        showToast('Por favor, selecione um contrato', 'error');
        return;
      }

      if (!formData.comando) {
        showToast('Por favor, selecione um comando', 'error');
        return;
      }

      //const url = editingElevador 
      //  ? `/api/elevadores/${editingElevador.id}`
      //  : '/api/elevadores';

      
      

      if (editingElevador) {
        await elevadoresApi.update(editingElevador.id, formData);
      } else {
        await elevadoresApi.create(formData);
      }
      
      showToast(
        editingElevador ? 'Elevador atualizado com sucesso!' : 'Elevador criado com sucesso!',
        'success'
      );
      
      setShowModal(false);
      await carregarElevadores();
    } catch (error) {
      console.error('Erro ao salvar elevador:', error);
      showToast('Erro ao salvar elevador: ' + error.message, 'error');
    }
  };

  const excluirElevador = async (elevadorId) => {
    if (!window.confirm('Tem certeza que deseja excluir este elevador?')) {
      return;
    }
    
    try {
      await elevadoresApi.delete(elevadorId);      
      showToast('Elevador excluído com sucesso!', 'success');
      await carregarElevadores();
    } catch (error) {
      console.error('Erro ao excluir elevador:', error);
      showToast('Erro ao excluir elevador: ' + error.message, 'error');
    }
  };

  const handleFormDataChange = (section, field, value) => {
    utilHandleFormDataChange(formData, setFormData, section, field, value);
  };

  const toggleCorCustom = () => {
    setCorCustomMode(!corCustomMode);
    setFormData(prev => ({ ...prev, cor: '' }));
  };

  const togglePisoCustom = () => {
    setCorCustomMode(!pisoCustomMode);
    setFormData(prev => ({
      ...prev,
      cabine: {
        ...prev.cabine,
        piso: ''
      } }));
  };

  const obterCorStatus = (status) => {
    switch (status) {
      case 'Não iniciado': return 'bg-secondary';
      case 'Em produção': return 'bg-warning';
      case 'Concluído': return 'bg-success';
      case 'Entregue': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const date = new Date(dataString);
    return date.toLocaleDateString('pt-BR');
  };

  const atualizarDesenhoCabineVisualizacao = (elevador) => {    
    // Hide all arrows initially and remove overlap classes
    const setasEntrada = ['viewEntradaEsquerda', 'viewEntradaDireita', 'viewEntradaOposta'];
    const setasSaida = ['viewSaidaEsquerda', 'viewSaidaDireita', 'viewSaidaOposta'];
    
    // Always hide all arrows first
    [...setasEntrada, ...setasSaida].forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.style.display = 'none';
        elemento.classList.remove('com-saida', 'com-entrada');
      }
    });
    
    // Handle column display - ADD THIS MISSING LOGIC
    const colunaElement = document.getElementById('viewColuna');
    if (colunaElement) {
      if (elevador.coluna && elevador.coluna.elevacao) {
        colunaElement.classList.remove('hidden');
        colunaElement.style.display = 'flex';
      } else {
        colunaElement.classList.add('hidden');
        colunaElement.style.display = 'none';
      }
    }
    
    let setaEntrada = null;
    let setaSaida = null;
    let ladoEntrada = null;
    let ladoSaida = null;
    
    // Determine which entrance arrow to show ONLY if there's a valid value
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
    
    // Determine which exit arrow to show ONLY if there's a valid value
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
    
    // Check for overlap (same side)
    const mesmoLado = ladoEntrada && ladoSaida && 
      ((ladoEntrada === 'esquerda' || ladoEntrada === 'esquerdo') && (ladoSaida === 'esquerda' || ladoSaida === 'esquerdo')) ||
      ((ladoEntrada === 'direita' || ladoEntrada === 'direito') && (ladoSaida === 'direita' || ladoSaida === 'direito')) ||
      ((ladoEntrada === 'oposta' || ladoEntrada === 'oposto') && (ladoSaida === 'oposta' || ladoSaida === 'oposto'));
    
    // Show and position arrows ONLY if found
    if (setaEntrada) {
      setaEntrada.style.display = 'flex';
      
      // If there's overlap, apply class for repositioning
      if (mesmoLado && setaSaida) {
        setaEntrada.classList.add('com-saida');
      }
    }
    
    if (setaSaida) {
      setaSaida.style.display = 'flex';
      
      // If there's overlap, apply class for repositioning
      if (mesmoLado && setaEntrada) {
        setaSaida.classList.add('com-entrada');
      }
    }
  };

  const atualizarDesenhoCabineEdicao = (elevador) => {    
    // Hide all arrows initially and remove overlap classes
    const setasEntrada = ['editEntradaEsquerda', 'editEntradaDireita', 'editEntradaOposta'];
    const setasSaida = ['editSaidaEsquerda', 'editSaidaDireita', 'editSaidaOposta'];
    
    // Always hide all arrows first
    [...setasEntrada, ...setasSaida].forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.style.display = 'none';
        elemento.classList.remove('com-saida', 'com-entrada');
      }
    });

    // Handle column display
    const colunaElement = document.getElementById('editColuna');
    if (colunaElement) {
      if (elevador.coluna && elevador.coluna.elevacao) {
        colunaElement.classList.remove('hidden');
        colunaElement.style.display = 'flex';
      } else {
        colunaElement.classList.add('hidden');
        colunaElement.style.display = 'none';
      }
    }
    
    let setaEntrada = null;
    let setaSaida = null;
    let ladoEntrada = null;
    let ladoSaida = null;
    
    // Determine which entrance arrow to show ONLY if there's a valid value
    if (elevador.cabine && elevador.cabine.lado_entrada && elevador.cabine.lado_entrada.trim()) {
      ladoEntrada = elevador.cabine.lado_entrada.toLowerCase().trim();
      switch(ladoEntrada) {
        case 'esquerda':
        case 'esquerdo':
          setaEntrada = document.getElementById('editEntradaEsquerda');
          break;
        case 'direita':
        case 'direito':
          setaEntrada = document.getElementById('editEntradaDireita');
          break;
        case 'oposta':
        case 'oposto':
          setaEntrada = document.getElementById('editEntradaOposta');
          break;
      }
    }
    
    // Determine which exit arrow to show ONLY if there's a valid value
    if (elevador.cabine && elevador.cabine.lado_saida && elevador.cabine.lado_saida.trim()) {
      ladoSaida = elevador.cabine.lado_saida.toLowerCase().trim();
      switch(ladoSaida) {
        case 'esquerda':
        case 'esquerdo':
          setaSaida = document.getElementById('editSaidaEsquerda');
          break;
        case 'direita':
        case 'direito':
          setaSaida = document.getElementById('editSaidaDireita');
          break;
        case 'oposta':
        case 'oposto':
          setaSaida = document.getElementById('editSaidaOposta');
          break;
      }
    }
    
    // Check for overlap (same side)
    const mesmoLado = ladoEntrada && ladoSaida && 
      ((ladoEntrada === 'esquerda' || ladoEntrada === 'esquerdo') && (ladoSaida === 'esquerda' || ladoSaida === 'esquerdo')) ||
      ((ladoEntrada === 'direita' || ladoEntrada === 'direito') && (ladoSaida === 'direita' || ladoSaida === 'direito')) ||
      ((ladoEntrada === 'oposta' || ladoEntrada === 'oposto') && (ladoSaida === 'oposta' || ladoSaida === 'oposto'));
    
    // Show and position arrows ONLY if found
    if (setaEntrada) {
      setaEntrada.style.display = 'flex';
      
      // If there's overlap, apply class for repositioning
      if (mesmoLado && setaSaida) {
        setaEntrada.classList.add('com-saida');
      }
    }
    
    if (setaSaida) {
      setaSaida.style.display = 'flex';
      
      // If there's overlap, apply class for repositioning
      if (mesmoLado && setaEntrada) {
        setaSaida.classList.add('com-entrada');
      }
    }
  };

  const atualizarDesenhoCabineEdicaoLive = () => {
    setTimeout(() => {
      const tempElevador = {
        cabine: {
          lado_entrada: formData.cabine.lado_entrada,
          lado_saida: formData.cabine.lado_saida
        },
        coluna: {
          elevacao: formData.coluna.elevacao
        }
      };
      
      atualizarDesenhoCabineEdicao(tempElevador);
    }, 50)
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fas fa-elevator"></i> Gerenciamento de Elevadores</h2>
        <button className="btn btn-info" onClick={novoElevador}>
          <i className="fas fa-plus"></i> Novo Elevador
        </button>
      </div>

      {/* Card Principal */}
      <div className="card">
        <div className="card-body">
          {/* Busca */}
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Buscar por cliente, contrato, cabine, cor ou status..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Contrato</th>
                  <th>Comando</th>
                  <th>Cabine (A×L×P)</th>
                  <th>Elevação</th>
                  <th>Cor</th>
                  <th>Status</th>
                  <th>Data Entrega</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredElevadores.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">
                      {elevadores.length === 0 ? 'Nenhum elevador cadastrado' : 'Nenhum elevador encontrado'}
                    </td>
                  </tr>
                ) : (
                  filteredElevadores.map(elevador => {
                    const contrato = contratos.find(c => c.id === elevador.id_contrato);
                    const cliente = contrato ? clientes.find(c => c.id === contrato.id_cliente) : null;
                    const cabineDesc = elevador.cabine ? 
                      `${elevador.cabine.altura || '?'}×${elevador.cabine.largura || '?'}×${elevador.cabine.profundidade || '?'}mm` : 
                      'N/A';
                    
                    return (
                      <tr key={elevador.id}>
                      <td>{elevador.id}</td>
                      <td>
                        {cliente ? cliente.nome : elevador.cliente_nome || (
                        <span className="badge bg-secondary">N/A</span>
                        )}
                      </td>
                      <td>#{elevador.id_contrato}</td>
                      <td>{elevador.comando || <span className="badge bg-secondary">N/A</span>}</td>
                      <td>{cabineDesc === 'N/A' ? <span className="badge bg-secondary">N/A</span> : cabineDesc}</td>
                      <td>
                        {elevador.coluna?.elevacao
                        ? `${elevador.coluna.elevacao}mm`
                        : <span className="badge bg-secondary">N/A</span>
                        }
                      </td>
                      <td>
                        {elevador.cor ? (
                        <span 
                          style={{ 
                          backgroundColor: elevador.cor.toLowerCase(),
                          color: 'black'
                          }}
                        >
                          {elevador.cor}
                        </span>
                        ) : <span className="badge bg-secondary">N/A</span>}
                      </td>
                      <td>
                        <span className={`badge ${obterCorStatus(elevador.status)}`}>
                        {elevador.status || 'Não iniciado'}
                        </span>
                      </td>
                      <td>
                        {contrato && contrato.data_entrega
                        ? formatarData(contrato.data_entrega)
                        : <span className="badge bg-secondary">N/A</span>
                        }
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => visualizarElevador(elevador)}
                            title="Visualizar"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => editarElevador(elevador)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {/* ADD PDF BUTTON HERE */}
                          <button
                            className="btn btn-outline-info btn-sm"
                            title="Visualizar PDF"
                            onClick={() => navigate(`/elevadores/${elevador.id}/pdf`)}
                          >
                            <i className="fas fa-file-pdf"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => excluirElevador(elevador.id)}
                            title="Excluir"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Elevador */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-elevator"></i> {editingElevador ? 'Editar' : 'Novo'} Elevador
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  {/* Seção: Informações Básicas */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-info-circle"></i> Informações Básicas</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Contrato *</label>
                            <div className="input-group">
                              <select 
                                className="form-select" 
                                value={formData.id_contrato}
                                onChange={(e) => handleFormDataChange(null, 'id_contrato', e.target.value)}
                                required
                              >
                                <option value="">Selecione um contrato...</option>
                                {contratos.map(contrato => {
                                  const cliente = clientes.find(c => c.id === contrato.id_cliente);
                                  const clienteNome = cliente ? cliente.nome : contrato.cliente_nome || 'Cliente não encontrado';
                                  const dataVenda = contrato.data_venda ? new Date(contrato.data_venda).toLocaleDateString('pt-BR') : 'N/A';
                                  const dataEntrega = contrato.data_entrega ? new Date(contrato.data_entrega).toLocaleDateString('pt-BR') : 'N/A';
                                  
                                  return (
                                    <option key={contrato.id} value={contrato.id}>
                                      Contrato #{contrato.id} - {clienteNome} - Venda: {dataVenda} - Entrega: {dataEntrega}
                                    </option>
                                  );
                                })}
                              </select>
                              <button 
                                type="button" 
                                className="btn btn-outline-secondary"
                                onClick={() => setShowSelecionarContratoModal(true)}
                              >
                                <i className="fas fa-list"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Comando *</label>
                            <select 
                              className="form-select" 
                              value={formData.comando}
                              onChange={(e) => handleFormDataChange(null, 'comando', e.target.value)}
                              required
                            >
                              <option value="">Selecione...</option>
                              <option value="Automático">Automático</option>
                              <option value="Pressão constante">Pressão constante</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Status *</label>
                            <select 
                              className="form-select" 
                              value={formData.status}
                              onChange={(e) => handleFormDataChange(null, 'status', e.target.value)}
                              required
                            >
                              <option value="Não iniciado">Não iniciado</option>
                              <option value="Em produção">Em produção</option>
                              <option value="Concluído">Concluído</option>
                              <option value="Entregue">Entregue</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Porta Inferior</label>
                            <select 
                              className="form-select" 
                              value={formData.porta_inferior}
                              onChange={(e) => handleFormDataChange(null, 'porta_inferior', e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="Esquerda">Esquerda</option>
                              <option value="Direita">Direita</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Porta Superior</label>
                            <select 
                              className="form-select" 
                              value={formData.porta_superior}
                              onChange={(e) => handleFormDataChange(null, 'porta_superior', e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="Esquerda">Esquerda</option>
                              <option value="Direita">Direita</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Cor</label>
                            <div className="input-group">
                              {!corCustomMode ? (
                                <select 
                                  className="form-select" 
                                  value={formData.cor}
                                  onChange={(e) => handleFormDataChange(null, 'cor', e.target.value)}
                                >
                                  <option value="">Selecione...</option>
                                  <option value="Branco">Branco</option>
                                  <option value="Preto">Preto</option>
                                  <option value="Cinza">Cinza</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Outra cor"
                                  value={formData.cor}
                                  onChange={(e) => handleFormDataChange(null, 'cor', e.target.value)}
                                />
                              )}
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={toggleCorCustom}
                                title="Outra cor"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="form-text">Selecione uma cor predefinida ou digite uma nova cor</div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Observações</label>
                            <textarea 
                              className="form-control"
                              rows="3"
                              value={formData.observacao}
                              onChange={(e) => handleFormDataChange(null, 'observacao', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção: Cabine */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-cube"></i> Cabine</h6>
                    </div>
                    <div className="card-body">
                      {/* Cabin Drawing Section */}
                      <div className="row mb-4">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Desenho da Cabine:</label>
                          <div className="cabine-desenho">
                            {/* Entrance arrows */}
                            <div id="editEntradaEsquerda" className="seta-entrada esquerda">E</div>
                            <div id="editEntradaDireita" className="seta-entrada direita">E</div>
                            <div id="editEntradaOposta" className="seta-entrada oposta">E</div>
                            
                            {/* Exit arrows */}
                            <div id="editSaidaEsquerda" className="seta-saida esquerda">S</div>
                            <div id="editSaidaDireita" className="seta-saida direita">S</div>
                            <div id="editSaidaOposta" className="seta-saida oposta">S</div>
                            
                            {/* Column rectangle */}
                            <div id="editColuna" className="coluna-desenho">COL</div>
                          </div>
                          <div className="text-center">
                            <small className="text-muted">
                              <span className="badge bg-success me-2">E</span> Entrada
                              <span className="badge bg-danger me-2">S</span> Saída
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Altura (mm)</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.cabine.altura}
                              onChange={(e) => handleFormDataChange('cabine', 'altura', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Largura (mm)</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.cabine.largura}
                              onChange={(e) => handleFormDataChange('cabine', 'largura', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Profundidade (mm)</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.cabine.profundidade}
                              onChange={(e) => handleFormDataChange('cabine', 'profundidade', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Piso</label>
                            <div className="input-group">
                              {!pisoCustomMode ? (
                                <select 
                                  className="form-select" 
                                  value={formData.cabine.piso}
                                  onChange={(e) => handleFormDataChange('cabine', 'piso', e.target.value)}
                                >
                                  <option value="">Selecione...</option>
                                  <option value="Borracha">Borracha</option>
                                  <option value="Alumínio">Alumínio</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Outro piso"
                                  value={formData.cabine.piso}
                                  onChange={(e) => handleFormDataChange('cabine', 'piso', e.target.value)}
                                />
                              )}
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={togglePisoCustom}
                                title="Outro piso"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="form-text">Selecione um material predefinido ou digite um novo</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Lado Entrada</label>
                            <select 
                              className="form-select" 
                              value={formData.cabine.lado_entrada}
                              onChange={(e) => {
                                handleFormDataChange('cabine', 'lado_entrada', e.target.value);
                                // Trigger update immediately after state change
                                setTimeout(() => {
                                  const tempElevador = {
                                    cabine: {
                                      lado_entrada: e.target.value, // Use the new value directly
                                      lado_saida: formData.cabine.lado_saida
                                    },
                                    coluna: {
                                      elevacao: formData.coluna.elevacao
                                    }
                                  };
                                  atualizarDesenhoCabineEdicao(tempElevador);
                                }, 10);
                              }}
                            >
                              <option value="">Selecione...</option>
                              <option value="Esquerdo">Esquerdo</option>
                              <option value="Direito">Direito</option>
                              <option value="Oposto">Oposto</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Lado Saída</label>
                            <select 
                              className="form-select" 
                              value={formData.cabine.lado_saida}
                              onChange={(e) => {
                                handleFormDataChange('cabine', 'lado_saida', e.target.value);
                                // Trigger update immediately after state change
                                setTimeout(() => {
                                  const tempElevador = {
                                    cabine: {
                                      lado_entrada: formData.cabine.lado_entrada,
                                      lado_saida: e.target.value // Use the new value directly
                                    },
                                    coluna: {
                                      elevacao: formData.coluna.elevacao
                                    }
                                  };
                                  atualizarDesenhoCabineEdicao(tempElevador);
                                }, 10);
                              }}
                            >
                              <option value="">Selecione...</option>
                              <option value="Esquerdo">Esquerdo</option>
                              <option value="Direito">Direito</option>
                              <option value="Oposto">Oposto</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <div className="form-check">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={formData.cabine.montada}
                                onChange={(e) => handleFormDataChange('cabine', 'montada', e.target.checked)}
                              />
                              <label className="form-check-label">
                                Cabine Montada
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção: Coluna */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-arrows-alt-v"></i> Coluna</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Elevação (mm)</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.coluna.elevacao}
                              onChange={(e) => handleFormDataChange('coluna', 'elevacao', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <div className="form-check mt-4">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={formData.coluna.montada}
                                onChange={(e) => handleFormDataChange('coluna', 'montada', e.target.checked)}
                              />
                              <label className="form-check-label">
                                Coluna Montada
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção: Adicionais */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-plus-circle"></i> Adicionais</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Cancela</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.cancela}
                              onChange={(e) => handleFormDataChange('adicionais', 'cancela', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Porta</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.porta}
                              onChange={(e) => handleFormDataChange('adicionais', 'porta', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Portão</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.portao}
                              onChange={(e) => handleFormDataChange('adicionais', 'portao', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Barreira Eletrônica</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.barreira_eletronica}
                              onChange={(e) => handleFormDataChange('adicionais', 'barreira_eletronica', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Lados Enclausuramento</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.lados_enclausuramento}
                              onChange={(e) => handleFormDataChange('adicionais', 'lados_enclausuramento', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Sensor Esmagamento</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.sensor_esmagamento}
                              onChange={(e) => handleFormDataChange('adicionais', 'sensor_esmagamento', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Rampa Acesso</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.rampa_acesso}
                              onChange={(e) => handleFormDataChange('adicionais', 'rampa_acesso', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Nobreak</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.adicionais.nobreak}
                              onChange={(e) => handleFormDataChange('adicionais', 'nobreak', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-3">
                          <div className="mb-3">
                            <div className="form-check">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={formData.adicionais.galvanizada}
                                onChange={(e) => handleFormDataChange('adicionais', 'galvanizada', e.target.checked)}
                              />
                              <label className="form-check-label">
                                Galvanizada
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-info" 
                  onClick={salvarElevador}
                >
                  <i className="fas fa-save"></i> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Elevador */}
      {showVisualizarModal && visualizandoElevador && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye"></i> Visualizar Elevador
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowVisualizarModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card mb-4">
                  <div className="card-header">
                    <h6 className="mb-0"><i className="fas fa-info-circle"></i> Informações Básicas</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Contrato:</strong> #{visualizandoElevador.id_contrato}</p>
                        <p><strong>Comando:</strong> {visualizandoElevador.comando || 'N/A'}</p>
                        <p><strong>Status:</strong> 
                          <span className={`badge ${obterCorStatus(visualizandoElevador.status)} ms-2`}>
                            {visualizandoElevador.status || 'Não iniciado'}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Porta Inferior:</strong> {visualizandoElevador.porta_inferior || 'N/A'}</p>
                        <p><strong>Porta Superior:</strong> {visualizandoElevador.porta_superior || 'N/A'}</p>
                        <p><strong>Cor:</strong> {visualizandoElevador.cor || 'N/A'}</p>
                      </div>
                    </div>
                    {visualizandoElevador.observacao && (
                      <div className="row">
                        <div className="col-12">
                          <p><strong>Observações:</strong> {visualizandoElevador.observacao}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {visualizandoElevador.cabine && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-cube"></i> Cabine</h6>
                    </div>
                    <div className="card-body">
                      {/* Cabin Drawing Section */}
                      <div className="row mb-4">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Desenho da Cabine:</label>
                          <div className="cabine-desenho">
                            {/* Entrance arrows */}
                            <div id="viewEntradaEsquerda" className="seta-entrada esquerda">E</div>
                            <div id="viewEntradaDireita" className="seta-entrada direita">E</div>
                            <div id="viewEntradaOposta" className="seta-entrada oposta">E</div>
                            
                            {/* Exit arrows */}
                            <div id="viewSaidaEsquerda" className="seta-saida esquerda">S</div>
                            <div id="viewSaidaDireita" className="seta-saida direita">S</div>
                            <div id="viewSaidaOposta" className="seta-saida oposta">S</div>
                            
                            {/* Column rectangle */}
                            <div id="viewColuna" className="coluna-desenho">COL</div>
                          </div>
                          <div className="text-center">
                            <small className="text-muted">
                              <span className="badge bg-success me-2">E</span> Entrada
                              <span className="badge bg-danger me-2">S</span> Saída
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Existing cabin data */}
                      <div className="row">
                        <div className="col-md-3">
                          <p><strong>Altura:</strong> {visualizandoElevador.cabine.altura || 'N/A'} mm</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Largura:</strong> {visualizandoElevador.cabine.largura || 'N/A'} mm</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Profundidade:</strong> {visualizandoElevador.cabine.profundidade || 'N/A'} mm</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Piso:</strong> {visualizandoElevador.cabine.piso || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4">
                          <p><strong>Lado Entrada:</strong> {visualizandoElevador.cabine.lado_entrada || 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <p><strong>Lado Saída:</strong> {visualizandoElevador.cabine.lado_saida || 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <p><strong>Montada:</strong> {visualizandoElevador.cabine.montada ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {visualizandoElevador.coluna && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-arrows-alt-v"></i> Coluna</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Elevação:</strong> {visualizandoElevador.coluna.elevacao || 'N/A'} mm</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Montada:</strong> {visualizandoElevador.coluna.montada ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {visualizandoElevador.adicionais && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0"><i className="fas fa-plus-circle"></i> Adicionais</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3">
                          <p><strong>Cancela:</strong> {visualizandoElevador.adicionais.cancela || 0}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Porta:</strong> {visualizandoElevador.adicionais.porta || 0}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Portão:</strong> {visualizandoElevador.adicionais.portao || 0}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Barreira Eletrônica:</strong> {visualizandoElevador.adicionais.barreira_eletronica || 0}</p>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-3">
                          <p><strong>Lados Enclausuramento:</strong> {visualizandoElevador.adicionais.lados_enclausuramento || 0}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Sensor Esmagamento:</strong> {visualizandoElevador.adicionais.sensor_esmagamento || 0}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Rampa Acesso:</strong> {visualizandoElevador.adicionais.rampa_acesso || 0}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Nobreak:</strong> {visualizandoElevador.adicionais.nobreak || 0}</p>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-3">
                          <p><strong>Galvanizada:</strong> {visualizandoElevador.adicionais.galvanizada ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowVisualizarModal(false)}
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    setShowVisualizarModal(false);
                    editarElevador(visualizandoElevador);
                  }}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Elevadores;
