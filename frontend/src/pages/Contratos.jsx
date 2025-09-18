import React, { useState, useEffect } from 'react';

const Contratos = () => {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showDiasUteisModal, setShowDiasUteisModal] = useState(false);
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [visualizandoContrato, setVisualizandoContrato] = useState(null);
  const [vendedorCustomMode, setVendedorCustomMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    id_cliente: '',
    data_venda: getTodayForInput(),
    data_entrega: '',
    vendedor: ''
  });

  const [diasUteisForm, setDiasUteisForm] = useState({
    quantidadeDias: 20,
    dataBase: 'hoje'
  });

  const [novoClienteForm, setNovoClienteForm] = useState({
    nome: '',
    cpf: '',
    endereco: {
      rua: '',
      numero: '',
      cidade: '',
      estado: '',
      cep: '',
      complemento: ''
    }
  });

  const [previewData, setPreviewData] = useState('');

  // Helper functions - COPIED FROM ORIGINAL contratos.js
  function formatarDataParaInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataBrasileira(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  function getTodayForInput() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDateForInput(date) {
    if (!date) return '';
    if (typeof date === 'string') return date; // Already in YYYY-MM-DD format
    return formatarDataParaInput(new Date(date));
  }

  function formatDateBrazilian(dateInput) {
    if (!dateInput) return '-';
    
    let date;
    if (typeof dateInput === 'string') {
      // Handle YYYY-MM-DD format
      if (dateInput.includes('-')) {
        const [year, month, day] = dateInput.split('T')[0].split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) return '-';
    return formatarDataBrasileira(date);
  }

  // Business days calculation - COPIED FROM ORIGINAL
  function calcularDataComDiasUteis(dataInicial, diasUteis) {
    let data = new Date(dataInicial);
    let diasAdicionados = 0;
    
    while (diasAdicionados < diasUteis) {
      data.setDate(data.getDate() + 1);
      
      // Verificar se é dia útil (1=segunda, 2=terça, ..., 5=sexta)
      const diaSemana = data.getDay();
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasAdicionados++;
      }
    }
    
    return data;
  }

  // function calcularStatusContrato(contrato) {
  //   const hoje = new Date();
  //   const dataEntrega = contrato.data_entrega ? new Date(contrato.data_entrega + 'T00:00:00') : null;
    
  //   if (!dataEntrega) {
  //     return 'Sem data de entrega';
  //   } else if (dataEntrega < hoje) {
  //     return 'Atrasado';
  //   } else if (dataEntrega.toDateString() === hoje.toDateString()) {
  //     return 'Entrega hoje';
  //   } else {
  //     return 'Em andamento';
  //   }
  // }

  function adicionarDiasUteis(dataInicial, diasUteis) {
    // Use the exact same function as original
    return calcularDataComDiasUteis(dataInicial, diasUteis);
  }

  function showToast(message, type = 'info') {
    // Simple toast implementation
    const toastClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-danger' : 
                     type === 'warning' ? 'alert-warning' : 'alert-info';
    
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
  }

  // Data loading functions
  const carregarContratos = async () => {
    try {
      const response = await fetch('/api/contratos');
      if (!response.ok) throw new Error('Erro ao carregar contratos');
      const data = await response.json();
      
      // Adicionar status calculado
      const contratos = data.map(contrato => ({
        ...contrato
      }));
      
      setContratos(contratos);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      showToast('Erro ao carregar contratos: ' + error.message, 'error');
    }
  };

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (!response.ok) throw new Error('Erro ao carregar clientes');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      showToast('Erro ao carregar clientes: ' + error.message, 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([carregarContratos(), carregarClientes()]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Vendedor functions
  const toggleVendedorCustom = () => {
    setVendedorCustomMode(!vendedorCustomMode);
    setFormData(prev => ({ ...prev, vendedor: '' }));
  };

  const handleVendedorChange = (value) => {
    setFormData(prev => ({ ...prev, vendedor: value }));
  };

  // Modal functions
  const adicionarContrato = () => {
    setEditingContrato(null);
    setFormData({
      id_cliente: '',
      data_venda: getTodayForInput(),
      data_entrega: '',
      vendedor: ''
    });
    setVendedorCustomMode(false);
    setShowModal(true);
  };

  const editarContrato = (contrato) => {
    setEditingContrato(contrato);
    setFormData({
      id_cliente: contrato.id_cliente || '',
      data_venda: contrato.data_venda ? formatDateForInput(contrato.data_venda) : '',
      data_entrega: contrato.data_entrega ? formatDateForInput(contrato.data_entrega) : '',
      vendedor: contrato.vendedor || ''
    });
    
    // Check if vendedor is custom (not in predefined list)
    const predefinedVendedores = ['Deuclides', 'Leandro', 'Jean'];
    setVendedorCustomMode(contrato.vendedor && !predefinedVendedores.includes(contrato.vendedor));
    
    setShowModal(true);
  };

  const visualizarContrato = (contrato) => {
    setVisualizandoContrato(contrato);
    setShowVisualizarModal(true);
  };

  const editarContratoFromView = () => {
    setShowVisualizarModal(false);
    setTimeout(() => {
      editarContrato(visualizandoContrato);
    }, 300);
  };

  // Business days functions
  const mostrarDialogoDiasUteis = () => {
    setDiasUteisForm({ quantidadeDias: 20, dataBase: 'hoje' });
    setShowDiasUteisModal(true);
    calcularPreviewDiasUteis(20, 'hoje');
  };

  const calcularPreviewDiasUteis = (quantidadeDias = diasUteisForm.quantidadeDias, dataBase = diasUteisForm.dataBase) => {
    if (!quantidadeDias || quantidadeDias <= 0) {
      setPreviewData('');
      return;
    }

    let dataInicial;
    let dataBaseTexto;

    if (dataBase === 'venda') {
      const dataVenda = formData.data_venda;
      if (!dataVenda) {
        setPreviewData('');
        return;
      }
      dataInicial = new Date(dataVenda + 'T00:00:00');
      dataBaseTexto = 'data da venda';
    } else {
      dataInicial = new Date();
      dataBaseTexto = 'hoje';
    }

    const dataFinal = calcularDataComDiasUteis(dataInicial, quantidadeDias);
    setPreviewData(`${dataFinal.toLocaleDateString('pt-BR')} (${quantidadeDias} dias úteis a partir de ${dataBaseTexto})`);
  };

  const adicionarDiasUteisToForm = () => {
    const { quantidadeDias, dataBase } = diasUteisForm;

    if (!quantidadeDias || quantidadeDias <= 0) {
      showToast('Por favor, informe uma quantidade válida de dias', 'error');
      return;
    }

    let dataInicial;

    if (dataBase === 'venda') {
      const dataVenda = formData.data_venda;
      if (!dataVenda) {
        showToast('Por favor, defina primeiro a data da venda', 'error');
        return;
      }
      dataInicial = new Date(dataVenda + 'T00:00:00');
    } else {
      dataInicial = new Date();
    }

    // Calcular a data com dias úteis
    const dataFinal = calcularDataComDiasUteis(dataInicial, quantidadeDias);
    
    // Definir no campo de data de entrega
    setFormData(prev => ({
      ...prev,
      data_entrega: formatarDataParaInput(dataFinal)
    }));

    setShowDiasUteisModal(false);
    showToast(`${quantidadeDias} dias úteis adicionados. Data de entrega: ${dataFinal.toLocaleDateString('pt-BR')}`, 'success');
  };

  // Client functions
  const abrirModalNovoCliente = () => {
    setNovoClienteForm({
      nome: '',
      cpf: '',
      endereco: {
        rua: '',
        numero: '',
        cidade: '',
        estado: '',
        cep: '',
        complemento: ''
      }
    });
    setShowNovoClienteModal(true);
  };

  const salvarNovoCliente = async () => {
    if (!novoClienteForm.nome.trim()) {
      showToast('Por favor, preencha o nome do cliente', 'warning');
      return;
    }

    const clienteData = {
      nome: novoClienteForm.nome.trim(),
      cpf: novoClienteForm.cpf.trim() || null
    };

    // Add address if city and state are provided
    if (novoClienteForm.endereco.cidade.trim() && novoClienteForm.endereco.estado) {
      clienteData.endereco = {
        rua: novoClienteForm.endereco.rua.trim() || null,
        numero: novoClienteForm.endereco.numero.trim() || null,
        cidade: novoClienteForm.endereco.cidade.trim(),
        estado: novoClienteForm.endereco.estado,
        cep: novoClienteForm.endereco.cep.trim() || null,
        complemento: novoClienteForm.endereco.complemento.trim() || null
      };
    }

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar cliente');
      }

      const novoCliente = await response.json();
      
      // Reload clients and select the new one
      await carregarClientes();
      setFormData(prev => ({ ...prev, id_cliente: novoCliente.id }));
      
      setShowNovoClienteModal(false);
      showToast(`Cliente criado com sucesso (ID: ${novoCliente.id})`, 'success');
      
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      showToast('Erro ao criar cliente: ' + error.message, 'error');
    }
  };

  // Save contract
  const salvarContrato = async () => {
    if (!formData.id_cliente) {
      showToast('Por favor, selecione um cliente', 'warning');
      return;
    }

    // Validate dates if both are provided - COPIED FROM ORIGINAL
    if (formData.data_venda && formData.data_entrega) {
      const dataVenda = new Date(formData.data_venda + 'T00:00:00');
      const dataEntrega = new Date(formData.data_entrega + 'T00:00:00');
      
      if (dataEntrega < dataVenda) {
        showToast('A data de entrega não pode ser anterior à data da venda', 'error');
        return;
      }
    }

    const contratoData = {
      id_cliente: parseInt(formData.id_cliente),
      data_venda: formData.data_venda || null,
      data_entrega: formData.data_entrega || null,
      vendedor: formData.vendedor.trim() || null
    };

    try {
      const url = editingContrato ? `/api/contratos/${editingContrato.id}` : '/api/contratos';
      const method = editingContrato ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contratoData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar contrato');
      }

      showToast(
        editingContrato ? 'Contrato atualizado com sucesso' : 'Contrato criado com sucesso',
        'success'
      );
      
      setShowModal(false);
      await carregarContratos();
      
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      showToast('Erro ao salvar contrato: ' + error.message, 'error');
    }
  };

  // Delete contract
  const excluirContrato = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contratos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir contrato');
      }

      showToast('Contrato excluído com sucesso', 'success');
      await carregarContratos();
      
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      showToast('Erro ao excluir contrato: ' + error.message, 'error');
    }
  };

  // Get status badge class
  // const getStatusBadgeClass = (status) => {
  //   switch (status) {
  //     case 'Sem data de entrega': return 'bg-secondary';
  //     case 'Atrasado': return 'bg-danger';
  //     case 'Entrega hoje': return 'bg-warning';
  //     case 'Em andamento': return 'bg-success';
  //     default: return 'bg-info';
  //   }
  // };

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
        <h2><i className="fas fa-file-contract"></i> Gerenciamento de Contratos</h2>
        <button className="btn btn-warning" onClick={adicionarContrato}>
          <i className="fas fa-plus"></i> Novo Contrato
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Data da Venda</th>
                  <th>Data Entrega</th>
                  <th>Vendedor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">Nenhum contrato encontrado</td>
                  </tr>
                ) : (
                  contratos.map(contrato => (
                    <tr key={contrato.id}>
                      <td>{contrato.id}</td>
                      <td>{contrato.cliente_nome || 'Cliente não encontrado'}</td>
                      <td>{contrato.data_venda ? new Date(contrato.data_venda).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>{contrato.data_entrega ? new Date(contrato.data_entrega).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>{contrato.vendedor || '-'}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-outline-info"
                            onClick={() => visualizarContrato(contrato)}
                            title="Visualizar"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => editarContrato(contrato)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => excluirContrato(contrato.id)}
                            title="Excluir"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Contrato */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-contract"></i> {editingContrato ? 'Editar Contrato' : 'Novo Contrato'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Cliente *</label>
                    <div className="input-group">
                      <select 
                        className="form-select" 
                        value={formData.id_cliente}
                        onChange={(e) => setFormData(prev => ({ ...prev, id_cliente: e.target.value }))}
                        required
                      >
                        <option value="">Selecione um cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-outline-success"
                        onClick={abrirModalNovoCliente}
                        title="Criar novo cliente"
                      >
                        <i className="fas fa-user-plus"></i>
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Data da Venda</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.data_venda}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                    />
                    {formData.data_venda && (
                      <div className="form-text">
                        <i className="fas fa-calendar"></i> {new Date(formData.data_venda).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Data de Entrega</label>
                    <div className="input-group">
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.data_entrega}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_entrega: e.target.value }))}
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-primary"
                        onClick={mostrarDialogoDiasUteis}
                        title="Adicionar dias úteis"
                      >
                        <i className="fas fa-calendar-plus"></i> + Dias Úteis
                      </button>
                    </div>
                    {formData.data_entrega && (
                      <div className="form-text">
                        <i className="fas fa-calendar"></i> {new Date(formData.data_entrega).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Vendedor</label>
                    <div className="input-group">
                      {!vendedorCustomMode ? (
                        <select 
                          className="form-select"
                          value={formData.vendedor}
                          onChange={(e) => handleVendedorChange(e.target.value)}
                        >
                          <option value="">Selecione um vendedor</option>
                          <option value="Deuclides">Deuclides</option>
                          <option value="Leandro">Leandro</option>
                          <option value="Jean">Jean</option>
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Outro vendedor"
                          value={formData.vendedor}
                          onChange={(e) => handleVendedorChange(e.target.value)}
                        />
                      )}
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={toggleVendedorCustom}
                        title="Outro vendedor"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                    <div className="form-text">Selecione um vendedor predefinido ou digite um novo nome</div>
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
                  className="btn btn-warning" 
                  onClick={salvarContrato}
                >
                  <i className="fas fa-save"></i> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dias Úteis */}
      {showDiasUteisModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-plus"></i> Adicionar Dias Úteis
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDiasUteisModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Quantidade de dias úteis:</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={diasUteisForm.quantidadeDias}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setDiasUteisForm(prev => ({ ...prev, quantidadeDias: value }));
                      calcularPreviewDiasUteis(value, diasUteisForm.dataBase);
                    }}
                    min="1" 
                    max="365"
                  />
                  <div className="form-text">Serão adicionados apenas dias úteis (segunda a sexta-feira)</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Data base:</label>
                  <select 
                    className="form-select"
                    value={diasUteisForm.dataBase}
                    onChange={(e) => {
                      setDiasUteisForm(prev => ({ ...prev, dataBase: e.target.value }));
                      calcularPreviewDiasUteis(diasUteisForm.quantidadeDias, e.target.value);
                    }}
                  >
                    <option value="hoje">Hoje</option>
                    <option value="venda">Data da Venda</option>
                  </select>
                </div>
                {previewData && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle"></i> <strong>Data prevista:</strong> {previewData}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDiasUteisModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={adicionarDiasUteisToForm}
                >
                  <i className="fas fa-plus"></i> Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showNovoClienteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-plus"></i> Novo Cliente
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNovoClienteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Nome *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={novoClienteForm.nome}
                      onChange={(e) => setNovoClienteForm(prev => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">CPF</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={novoClienteForm.cpf}
                      onChange={(e) => setNovoClienteForm(prev => ({ ...prev, cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <hr />
                  <h6><i className="fas fa-map-marker-alt"></i> Endereço (Opcional)</h6>

                  <div className="row">
                    <div className="col-8">
                      <div className="mb-3">
                        <label className="form-label">Rua</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={novoClienteForm.endereco.rua}
                          onChange={(e) => setNovoClienteForm(prev => ({
                            ...prev,
                            endereco: { ...prev.endereco, rua: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="mb-3">
                        <label className="form-label">Número</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={novoClienteForm.endereco.numero}
                          onChange={(e) => setNovoClienteForm(prev => ({
                            ...prev,
                            endereco: { ...prev.endereco, numero: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Cidade</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={novoClienteForm.endereco.cidade}
                          onChange={(e) => setNovoClienteForm(prev => ({
                            ...prev,
                            endereco: { ...prev.endereco, cidade: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Estado</label>
                        <select 
                          className="form-select"
                          value={novoClienteForm.endereco.estado}
                          onChange={(e) => setNovoClienteForm(prev => ({
                            ...prev,
                            endereco: { ...prev.endereco, estado: e.target.value }
                          }))}
                        >
                          <option value="">Selecionar</option>
                          <option value="AC">Acre</option>
                          <option value="AL">Alagoas</option>
                          <option value="AP">Amapá</option>
                          <option value="AM">Amazonas</option>
                          <option value="BA">Bahia</option>
                          <option value="CE">Ceará</option>
                          <option value="DF">Distrito Federal</option>
                          <option value="ES">Espírito Santo</option>
                          <option value="GO">Goiás</option>
                          <option value="MA">Maranhão</option>
                          <option value="MT">Mato Grosso</option>
                          <option value="MS">Mato Grosso do Sul</option>
                          <option value="MG">Minas Gerais</option>
                          <option value="PA">Pará</option>
                          <option value="PB">Paraíba</option>
                          <option value="PR">Paraná</option>
                          <option value="PE">Pernambuco</option>
                          <option value="PI">Piauí</option>
                          <option value="RJ">Rio de Janeiro</option>
                          <option value="RN">Rio Grande do Norte</option>
                          <option value="RS">Rio Grande do Sul</option>
                          <option value="RO">Rondônia</option>
                          <option value="RR">Roraima</option>
                          <option value="SC">Santa Catarina</option>
                          <option value="SP">São Paulo</option>
                          <option value="SE">Sergipe</option>
                          <option value="TO">Tocantins</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">CEP</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={novoClienteForm.endereco.cep}
                          onChange={(e) => setNovoClienteForm(prev => ({
                            ...prev,
                            endereco: { ...prev.endereco, cep: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Complemento</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={novoClienteForm.endereco.complemento}
                          onChange={(e) => setNovoClienteForm(prev => ({
                            ...prev,
                            endereco: { ...prev.endereco, complemento: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowNovoClienteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={salvarNovoCliente}
                >
                  <i className="fas fa-save"></i> Criar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualização Contrato */}
      {showVisualizarModal && visualizandoContrato && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye"></i> Visualizar Contrato
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowVisualizarModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">ID do Contrato:</label>
                    <p className="form-control-plaintext">{visualizandoContrato.id}</p>
                  </div>
                  {/* <div className="col-md-6">
                    <label className="form-label fw-bold">Status:</label>
                    <p className="form-control-plaintext">
                      <span className={`badge ${getStatusBadgeClass(visualizandoContrato.status)}`}>
                        {visualizandoContrato.status}
                      </span>
                    </p>
                  </div> */}
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Cliente:</label>
                    <p className="form-control-plaintext">
                      {visualizandoContrato.cliente_nome || 'Cliente não encontrado'}
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Data da Venda:</label>
                    <p className="form-control-plaintext">
                      {visualizandoContrato.data_venda ? new Date(visualizandoContrato.data_venda).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Data de Entrega:</label>
                    <p className="form-control-plaintext">
                      {visualizandoContrato.data_entrega ? new Date(visualizandoContrato.data_entrega).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Vendedor:</label>
                    <p className="form-control-plaintext">{visualizandoContrato.vendedor || '-'}</p>
                  </div>
                </div>
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
                  onClick={editarContratoFromView}
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

export default Contratos;
