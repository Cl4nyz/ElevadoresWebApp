import React, { useState, useEffect } from 'react';
import { cabinesApi } from '../services/api';

const Cabines = () => {
  const [cabines, setCabines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCabines();
  }, []);

  const loadCabines = async () => {
    try {
      setLoading(true);
      const response = await cabinesApi.getAll();
      setCabines(response.data);
    } catch (error) {
      console.error('Error loading cabins:', error);
    } finally {
      setLoading(false);
    }
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
        <h2><i className="fas fa-cube me-2"></i>Cabines</h2>
      </div>

      <div className="card">
        <div className="card-body">
          {cabines.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-cube fa-3x text-muted mb-3"></i>
              <p className="text-muted">Nenhuma cabine cadastrada</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Comando</th>
                    <th>Dimensões</th>
                    <th>Piso</th>
                    <th>Montada</th>
                    <th>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {cabines.map((cabine) => (
                    <tr key={cabine.id}>
                      <td>#{cabine.id}</td>
                      <td>{cabine.cliente_nome}</td>
                      <td>{cabine.comando}</td>
                      <td>{cabine.descricao}</td>
                      <td>{cabine.piso || '-'}</td>
                      <td>
                        <span className={`badge ${cabine.montada ? 'bg-success' : 'bg-secondary'}`}>
                          {cabine.montada ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td>{cabine.data_entrega || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cabines;
