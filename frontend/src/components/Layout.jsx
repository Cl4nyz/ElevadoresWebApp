import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img 
              src="/images/home.png" 
              alt="HomeManager" 
              width="45" 
              height="24" 
              className="me-2" 
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            HomeManager
          </Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                  to="/"
                >
                  <i className="fas fa-home me-1"></i>Home
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/clientes' ? 'active' : ''}`} 
                  to="/clientes"
                >
                  <i className="fas fa-users me-1"></i>Clientes
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/contratos' ? 'active' : ''}`} 
                  to="/contratos"
                >
                  <i className="fas fa-file-contract me-1"></i>Contratos
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/elevadores' ? 'active' : ''}`} 
                  to="/elevadores"
                >
                  <i className="fas fa-elevator me-1"></i>Elevadores
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/calendario' ? 'active' : ''}`} 
                  to="/calendario"
                >
                  <i className="fas fa-calendar me-1"></i>Calendário
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/relatorios' ? 'active' : ''}`} 
                  to="/relatorios"
                >
                  <i className="fas fa-chart-bar me-1"></i>Relatórios
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 py-4">
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="bg-light py-3 mt-auto">
        <div className="container text-center">
          <small className="text-muted">
            © 2025 HomeManager - Sistema de Gerenciamento de Elevadores
          </small>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
