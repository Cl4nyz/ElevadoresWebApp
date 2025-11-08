import React, { useState, useEffect } from 'react';
import { relatoriosApi } from '../services/api';

const Relatorios = () => {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumo();
  }, []);

  const loadResumo = async () => {
    try {
      setLoading(true);
      const response = await relatoriosApi.getResumo();
      setResumo(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
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
        <h2><i className="fas fa-chart-bar me-2"></i>Relatórios</h2>
      </div>

      {resumo && (
        <div className="row g-4 justify-content-center">
          {/* Totals */}
          <div className="col-12 d-flex justify-content-center">
            <div className="card w-100" style={{ maxWidth: 900 }}>
              <div className="card-header">
                <h5 className="mb-0 text-center">Resumo Geral</h5>
              </div>
              <div className="card-body">
                <div className="row text-center justify-content-center">
                  <div className="col-md-2">
                    <div className="p-3">
                      <i className="fas fa-users fa-2x text-primary mb-2"></i>
                      <h4>{resumo.totals.clientes}</h4>
                      <small>Clientes</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3">
                      <i className="fas fa-file-contract fa-2x text-warning mb-2"></i>
                      <h4>{resumo.totals.contratos}</h4>
                      <small>Contratos</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3">
                      <i className="fas fa-elevator fa-2x text-info mb-2"></i>
                      <h4>{resumo.totals.elevadores}</h4>
                      <small>Elevadores</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Estados */}
          <div className="col-md-6 d-flex justify-content-center">
            <div className="card h-100 w-100" style={{ maxWidth: 900 }}>
              <div className="card-header text-center">
                <h6 className="mb-0">Top Estados por Contratos</h6>
              </div>
              <div className="card-body">
                {resumo.estados_top.length === 0 ? (
                  <p className="text-muted text-center">Nenhum dado disponível</p>
                ) : (
                  <div>
                    {resumo.estados_top.slice().map((item, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <span>{item.estado}</span>
                        <span className="badge bg-success">{item.contratos}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contratos por Mês */}
          <div className="col-12 d-flex justify-content-center">
            <div className="card w-100" style={{ maxWidth: 900 }}>
              <div className="card-header text-center">
                <h6 className="mb-0">Contratos por Mês (Últimos 12 meses)</h6>
              </div>
              <div className="card-body">
                {resumo.contratos_por_mes.length === 0 ? (
                  <p className="text-muted text-center">Nenhum dado disponível</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm text-center">
                      <thead>
                        <tr>
                          <th className="text-center">Mês</th>
                          <th className="text-center">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.contratos_por_mes.map((item, index) => (
                          <tr key={index}>
                            <td>{item.mes}</td>
                            <td>{item.quantidade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
