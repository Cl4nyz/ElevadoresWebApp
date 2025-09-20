import React, { useState, useEffect } from 'react';
import { clientesApi } from '../services/api';
import { handleFormDataChange, handleArrayFieldChange, addArrayItem, removeArrayItem } from '../utils/formUtils';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [visualizandoCliente, setVisualizandoCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    comercial: false,
    documento: '',
    email: '',
    enderecos: [{ rua: '', numero: '', cidade: '', estado: '', complemento: '', cep: '' }]
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await clientesApi.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      comercial: cliente.comercial,
      documento: cliente.documento,
      email: cliente.email,
      enderecos: cliente.enderecos.length > 0 ? cliente.enderecos : [{ rua: '', numero: '', cidade: '', estado: '', complemento: '', cep: '' }]
    });
    setShowModal(true);
  };

  const handleVisualize = (cliente) => {
    setVisualizandoCliente(cliente);
    setShowVisualizarModal(true);
  };

  const editarClienteFromView = () => {
    setShowVisualizarModal(false);
    handleEdit(visualizandoCliente);
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setFormData({
      nome: '',
      comercial: false,
      documento: '',
      email: '',
      enderecos: [{ rua: '', numero: '', cidade: '', estado: '', complemento: '', cep: '' }]
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCliente) {
        await clientesApi.update(editingCliente.id, formData);
      } else {
        await clientesApi.create(formData);
      }
      
      setShowModal(false);
      loadClientes();
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error.response?.data?.error || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await clientesApi.delete(id);
        alert('Cliente excluído com sucesso!');
        loadClientes();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert(error.response?.data?.error || 'Erro ao excluir cliente');
      }
    }
  };

  const addEndereco = () => {
    addArrayItem(formData, setFormData, 'enderecos', { rua: '', numero: '', cidade: '', estado: '', complemento: '', cep: '' });
  };

  const removeEndereco = (index) => {
    removeArrayItem(formData, setFormData, 'enderecos', index);
  };

  const updateEndereco = (index, field, value) => {
    handleArrayFieldChange(formData, setFormData, 'enderecos', index, field, value);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fas fa-users me-2"></i>Clientes</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          <i className="fas fa-plus me-2"></i>Novo Cliente
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {clientes.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>CPF/CNPJ</th>
                    <th>Email</th>
                    <th>Endereços</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.nome}</td>
                      <td>
                        <span className={`badge ${cliente.comercial ? 'bg-info' : 'bg-secondary'}`}>
                          {cliente.comercial ? 'Comercial' : 'Pessoa Física'}
                        </span>
                      </td>
                      <td>{cliente.documento}</td>
                      <td>{cliente.email}</td>
                      <td>
                        {cliente.enderecos.map((endereco, index) => (
                          <div key={index} className="small">
                            {endereco.rua}, {endereco.numero} - {endereco.cidade}/{endereco.estado}
                          </div>
                        ))}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-outline-info"
                            onClick={() => handleVisualize(cliente)}
                            title="Visualizar"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleEdit(cliente)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDelete(cliente.id)}
                            title="Excluir"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nome *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nome}
                          onChange={(e) => handleFormDataChange(formData, setFormData, null, 'nome', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => handleFormDataChange(formData, setFormData, null, 'email', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.comercial}
                            onChange={(e) => handleFormDataChange(formData, setFormData, null, 'comercial', e.target.checked)}
                          />
                          <label className="form-check-label">
                            Comercial (CNPJ)
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          {formData.comercial ? 'CNPJ' : 'CPF'}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.documento}
                          onChange={(e) => handleFormDataChange(formData, setFormData, null, 'documento', e.target.value)}
                          maxLength={formData.comercial ? 14 : 11}
                        />
                      </div>
                    </div>
                  </div>

                  <hr />
                  <h6>Endereços</h6>
                  
                  {formData.enderecos.map((endereco, index) => (
                    <div key={index} className="border p-3 mb-3 rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="mb-0">Endereço {index + 1}</h6>
                        {formData.enderecos.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeEndereco(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                      
                      <div className="row">
                        <div className="col-md-8">
                          <div className="mb-3">
                            <label className="form-label">Rua</label>
                            <input
                              type="text"
                              className="form-control"
                              value={endereco.rua}
                              onChange={(e) => updateEndereco(index, 'rua', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Número</label>
                            <input
                              type="text"
                              className="form-control"
                              value={endereco.numero}
                              onChange={(e) => updateEndereco(index, 'numero', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Cidade</label>
                            <input
                              type="text"
                              className="form-control"
                              value={endereco.cidade}
                              onChange={(e) => updateEndereco(index, 'cidade', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">Estado</label>
                            <select
                              className="form-select"
                              value={endereco.estado}
                              onChange={(e) => updateEndereco(index, 'estado', e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="AC">AC - Acre</option>
                              <option value="AL">AL - Alagoas</option>
                              <option value="AP">AP - Amapá</option>
                              <option value="AM">AM - Amazonas</option>
                              <option value="BA">BA - Bahia</option>
                              <option value="CE">CE - Ceará</option>
                              <option value="DF">DF - Distrito Federal</option>
                              <option value="ES">ES - Espírito Santo</option>
                              <option value="GO">GO - Goiás</option>
                              <option value="MA">MA - Maranhão</option>
                              <option value="MT">MT - Mato Grosso</option>
                              <option value="MS">MS - Mato Grosso do Sul</option>
                              <option value="MG">MG - Minas Gerais</option>
                              <option value="PA">PA - Pará</option>
                              <option value="PB">PB - Paraíba</option>
                              <option value="PR">PR - Paraná</option>
                              <option value="PE">PE - Pernambuco</option>
                              <option value="PI">PI - Piauí</option>
                              <option value="RJ">RJ - Rio de Janeiro</option>
                              <option value="RN">RN - Rio Grande do Norte</option>
                              <option value="RS">RS - Rio Grande do Sul</option>
                              <option value="RO">RO - Rondônia</option>
                              <option value="RR">RR - Roraima</option>
                              <option value="SC">SC - Santa Catarina</option>
                              <option value="SP">SP - São Paulo</option>
                              <option value="SE">SE - Sergipe</option>
                              <option value="TO">TO - Tocantins</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="mb-3">
                            <label className="form-label">CEP</label>
                            <input
                              type="text"
                              className="form-control"
                              value={endereco.cep}
                              onChange={(e) => updateEndereco(index, 'cep', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Complemento</label>
                        <input
                          type="text"
                          className="form-control"
                          value={endereco.complemento}
                          onChange={(e) => updateEndereco(index, 'complemento', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={addEndereco}
                  >
                    <i className="fas fa-plus me-2"></i>Adicionar Endereço
                  </button>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCliente ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Visualize Modal */}
      {showVisualizarModal && visualizandoCliente && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye me-2"></i>Visualizar Cliente
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
                    <label className="form-label fw-bold">ID do Cliente:</label>
                    <p className="form-control-plaintext">{visualizandoCliente.id}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Tipo:</label>
                    <p className="form-control-plaintext">
                      <span className={`badge ${visualizandoCliente.comercial ? 'bg-info' : 'bg-secondary'}`}>
                        {visualizandoCliente.comercial ? 'Comercial' : 'Pessoa Física'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Nome:</label>
                    <p className="form-control-plaintext">{visualizandoCliente.nome}</p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      {visualizandoCliente.comercial ? 'CNPJ:' : 'CPF:'}
                    </label>
                    <p className="form-control-plaintext">{visualizandoCliente.documento || '-'}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Email:</label>
                    <p className="form-control-plaintext">{visualizandoCliente.email || '-'}</p>
                  </div>
                </div>

                <hr />
                <h6 className="fw-bold">
                  <i className="fas fa-map-marker-alt me-2"></i>Endereços
                </h6>
                
                {visualizandoCliente.enderecos && visualizandoCliente.enderecos.length > 0 ? (
                  visualizandoCliente.enderecos.map((endereco, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-body">
                        <h6 className="card-title">Endereço {index + 1}</h6>
                        <div className="row">
                          <div className="col-md-8">
                            <p className="mb-1">
                              <strong>Rua:</strong> {endereco.rua || '-'}
                            </p>
                          </div>
                          <div className="col-md-4">
                            <p className="mb-1">
                              <strong>Número:</strong> {endereco.numero || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <p className="mb-1">
                              <strong>Cidade:</strong> {endereco.cidade || '-'}
                            </p>
                          </div>
                          <div className="col-md-3">
                            <p className="mb-1">
                              <strong>Estado:</strong> {endereco.estado || '-'}
                            </p>
                          </div>
                          <div className="col-md-3">
                            <p className="mb-1">
                              <strong>CEP:</strong> {endereco.cep || '-'}
                            </p>
                          </div>
                        </div>
                        {endereco.complemento && (
                          <p className="mb-1">
                            <strong>Complemento:</strong> {endereco.complemento}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Nenhum endereço cadastrado para este cliente.
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
                  onClick={editarClienteFromView}
                >
                  <i className="fas fa-edit me-2"></i>Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
