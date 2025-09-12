import React, { useState, useEffect } from 'react';
import { clientesApi } from '../services/api';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
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
    setFormData({
      ...formData,
      enderecos: [...formData.enderecos, { rua: '', numero: '', cidade: '', estado: '', complemento: '', cep: '' }]
    });
  };

  const removeEndereco = (index) => {
    const newEnderecos = formData.enderecos.filter((_, i) => i !== index);
    setFormData({ ...formData, enderecos: newEnderecos });
  };

  const updateEndereco = (index, field, value) => {
    const newEnderecos = [...formData.enderecos];
    newEnderecos[index] = { ...newEnderecos[index], [field]: value };
    setFormData({ ...formData, enderecos: newEnderecos });
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
                    <th>Documento</th>
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
                        <button 
                          className="btn btn-sm btn-outline-primary me-2" 
                          onClick={() => handleEdit(cliente)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(cliente.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, comercial: e.target.checked })}
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
                          onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
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
                            <input
                              type="text"
                              className="form-control"
                              value={endereco.estado}
                              onChange={(e) => updateEndereco(index, 'estado', e.target.value)}
                              maxLength={2}
                            />
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
    </div>
  );
};

export default Clientes;
