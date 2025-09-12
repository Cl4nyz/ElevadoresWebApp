import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { relatoriosApi, sistemaApi } from '../services/api';

const Home = () => {
  const [stats, setStats] = useState({
    clientes: 0,
    contratos: 0,
    elevadores: 0,
    cabines_montadas: 0,
    colunas_montadas: 0
  });
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load summary statistics
      const statsResponse = await relatoriosApi.getResumo();
      if (statsResponse.data.totals) {
        setStats(statsResponse.data.totals);
      }

      // Load system info
      const infoResponse = await sistemaApi.getInfo();
      setSystemInfo(infoResponse.data);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      const response = await sistemaApi.verificarAtualizacoes();
      setUpdateInfo(response.data);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleSystemInfoToggle = () => {
    setShowSystemInfo(!showSystemInfo);
    if (!showSystemInfo && !updateInfo) {
      checkForUpdates();
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="row">
        <div className="col-md-12">
          <div className="hero-section text-center mb-5">
            <h1 className="display-4 text-primary">
              <img 
                src="/images/home.png" 
                alt="HomeManager" 
                width="90" 
                height="48" 
                className="me-2" 
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              Bem-vindo ao HomeManager
            </h1>
            <p className="lead text-muted">
              Sistema completo para gerenciamento de elevadores, clientes e contratos
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-6 col-lg-2">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <i className="fas fa-users fa-2x mb-2"></i>
              <h4>{loading ? '...' : stats.clientes}</h4>
              <small>Clientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-2">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <i className="fas fa-file-contract fa-2x mb-2"></i>
              <h4>{loading ? '...' : stats.contratos}</h4>
              <small>Contratos</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-2">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <i className="fas fa-elevator fa-2x mb-2"></i>
              <h4>{loading ? '...' : stats.elevadores}</h4>
              <small>Elevadores</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <i className="fas fa-cube fa-2x mb-2"></i>
              <h4>{loading ? '...' : stats.cabines_montadas}</h4>
              <small>Cabines Montadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <i className="fas fa-columns fa-2x mb-2"></i>
              <h4>{loading ? '...' : stats.colunas_montadas}</h4>
              <small>Colunas Montadas</small>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-users fa-3x text-primary"></i>
              </div>
              <h5 className="card-title">Clientes</h5>
              <p className="card-text">Gerencie seus clientes e endereços</p>
              <Link to="/clientes" className="btn btn-primary">
                <i className="fas fa-arrow-right"></i> Acessar
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-file-contract fa-3x text-warning"></i>
              </div>
              <h5 className="card-title">Contratos</h5>
              <p className="card-text">Gerencie contratos e datas</p>
              <Link to="/contratos" className="btn btn-warning">
                <i className="fas fa-arrow-right"></i> Acessar
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-elevator fa-3x text-info"></i>
              </div>
              <h5 className="card-title">Elevadores</h5>
              <p className="card-text">Configure e gerencie elevadores</p>
              <Link to="/elevadores" className="btn btn-info">
                <i className="fas fa-arrow-right"></i> Acessar
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-calendar fa-3x text-purple"></i>
              </div>
              <h5 className="card-title">Calendário</h5>
              <p className="card-text">Visualize datas de entrega dos contratos</p>
              <Link to="/calendario" className="btn btn-primary">
                <i className="fas fa-arrow-right"></i> Acessar
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-chart-bar fa-3x text-success"></i>
              </div>
              <h5 className="card-title">Relatórios</h5>
              <p className="card-text">Mapa de vendas por estado e data</p>
              <Link to="/relatorios" className="btn btn-success">
                <i className="fas fa-arrow-right"></i> Acessar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Information Section */}
      <div className="row mt-5">
        <div className="col-md-12">
          <div className="card border-light">
            <div 
              className="card-header bg-light d-flex justify-content-between align-items-center cursor-pointer" 
              onClick={handleSystemInfoToggle}
              style={{ cursor: 'pointer' }}
            >
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Sobre o Sistema
              </h5>
              <i className={`fas fa-chevron-${showSystemInfo ? 'up' : 'down'}`}></i>
            </div>
            
            {showSystemInfo && (
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Informações do Sistema</h6>
                    {systemInfo && (
                      <ul className="list-unstyled">
                        <li><strong>Nome:</strong> {systemInfo.nome}</li>
                        <li><strong>Versão:</strong> {systemInfo.versao}</li>
                        <li><strong>Tecnologia:</strong> {systemInfo.tecnologia}</li>
                        <li><strong>Ambiente:</strong> {systemInfo.ambiente}</li>
                      </ul>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <h6>Status de Atualizações</h6>
                    {updateInfo ? (
                      <div>
                        <p><strong>Versão Atual:</strong> {updateInfo.versao_atual}</p>
                        <p><strong>Última Verificação:</strong> {new Date(updateInfo.data_verificacao).toLocaleString()}</p>
                        {updateInfo.atualizacao_disponivel ? (
                          <div className="alert alert-info">
                            <i className="fas fa-download me-2"></i>
                            Nova versão disponível: {updateInfo.versao_mais_recente}
                          </div>
                        ) : (
                          <div className="alert alert-success">
                            <i className="fas fa-check me-2"></i>
                            Sistema atualizado
                          </div>
                        )}
                      </div>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={checkForUpdates}
                      >
                        <i className="fas fa-sync me-2"></i>
                        Verificar Atualizações
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
