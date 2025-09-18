import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import ElevatorPDF from '../components/ElevatorPDF';

const ElevatorPDFPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [elevador, setElevador] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

	useEffect(() => {
	const carregarDadosElevador = async () => {
		try {
		setLoading(true);
		
		// Load elevator data with all related info
		const elevadorResponse = await fetch(`/api/elevadores/${id}`);
		if (!elevadorResponse.ok) {
			throw new Error('Elevador não encontrado');
		}
		const elevadorData = await elevadorResponse.json();
		
		setElevador(elevadorData);
		setCliente(elevadorData.cliente);
		setContrato(elevadorData.contrato);
		
		} catch (err) {
		setError(err.message);
		} finally {
		setLoading(false);
		}
	};

	if (id) {
		carregarDadosElevador();
	}
	}, [id]);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        navigate(-1); // Goes back to previous page instead of forcing /elevadores
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="text-muted">Carregando dados do elevador...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">
                <i className="fas fa-exclamation-triangle"></i> Erro!
              </h4>
              <p>{error}</p>
              <hr />
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)} // Goes back to previous page
                title="Voltar (ESC)"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!elevador) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning" role="alert">
              <h4 className="alert-heading">
                <i className="fas fa-search"></i> Não encontrado
              </h4>
              <p>Elevador não encontrado.</p>
              <hr />
              <button 
                className="btn btn-outline-warning" 
                onClick={() => navigate('/elevadores')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Voltar para Elevadores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with actions */}
      <div className="row bg-light py-3 mb-0 flex-shrink-0">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h4 mb-1">
                <i className="fas fa-file-pdf text-danger me-2"></i>
                Preview PDF - Elevador #{elevador.id}
              </h1>
              <small className="text-muted">
                <i className="fas fa-user me-1"></i>
                Cliente: {cliente?.nome || 'N/A'} | 
                <i className="fas fa-file-contract ms-2 me-1"></i>
                Contrato: #{contrato?.id || 'N/A'}
              </small>
            </div>
            <div className="btn-group">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/elevadores')}
                title="Voltar (ESC)"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Voltar
              </button>
              <PDFDownloadLink
                document={<ElevatorPDF elevador={elevador} cliente={cliente} contrato={contrato} />}
                fileName={`OS#${elevador.id}_${cliente?.nome ? cliente.nome.replace(/\s+/g, '_') : 'Cliente_Desconhecido'}.pdf`}
                className="btn btn-success"
              >
                {({ blob, url, loading, error }) => (
                  <>
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Preparando...
                      </>
                    ) : error ? (
                      <>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Erro
                      </>
                    ) : (
                      <>
                        <i className="fas fa-download me-2"></i>
                        Baixar PDF
                      </>
                    )}
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="row flex-grow-1">
        <div className="col-12 h-100">
          <div className="card h-100">
            <div className="card-body p-0 h-100">
              <PDFViewer 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  border: 'none'
                }}
              >
                <ElevatorPDF 
                  elevador={elevador} 
                  cliente={cliente} 
                  contrato={contrato} 
                />
              </PDFViewer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElevatorPDFPreview;