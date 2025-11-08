import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = () => api.get('/health');

// Clientes
export const clientesApi = {
  getAll: () => api.get('/clientes'),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`),
};

// Contratos
export const contratosApi = {
  getAll: () => api.get('/contratos'),
  getById: (id) => api.get(`/contratos/${id}`),
  create: (data) => api.post('/contratos', data),
  update: (id, data) => api.put(`/contratos/${id}`, data),
  delete: (id) => api.delete(`/contratos/${id}`),
};

// Elevadores
export const elevadoresApi = {
  getAll: (contratoId = null) => {
    const params = contratoId ? { contrato: contratoId } : {};
    return api.get('/elevadores', { params });
  },
  getById: (id) => api.get(`/elevadores/${id}`),
  create: (data) => api.post('/elevadores', data),
  update: (id, data) => api.put(`/elevadores/${id}`, data),
  delete: (id) => api.delete(`/elevadores/${id}`),
};

// Cabines
// Relatórios
export const relatoriosApi = {
  getContratosPorEstado: (estado) => api.get(`/relatorios/contratos-por-estado/${estado}`),
  getElevadoresPorStatus: () => api.get('/relatorios/elevadores-status'),
  getResumo: () => api.get('/relatorios/resumo'),
};

// Sistema
export const sistemaApi = {
  verificarAtualizacoes: () => api.get('/sistema/verificar-atualizacoes'),
  atualizar: () => api.post('/sistema/atualizar'),
  getInfo: () => api.get('/sistema/info'),
};

export default api;
