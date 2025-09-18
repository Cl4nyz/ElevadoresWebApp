import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import Contratos from '../Contratos.jsx';

// Mock data
const mockContratos = [
  {
    id: 1,
    id_cliente: 1,
    data_venda: '2024-01-15',
    data_entrega: '2024-02-20',
    vendedor: 'Deuclides',
    cliente_nome: 'João Silva Ltda'
  },
  {
    id: 2,
    id_cliente: 2,
    data_venda: '2024-01-10',
    data_entrega: null,
    vendedor: 'Leandro',
    cliente_nome: 'Maria Santos'
  },
  {
    id: 3,
    id_cliente: 3,
    data_venda: null,
    data_entrega: '2024-03-15',
    vendedor: null,
    cliente_nome: 'Pedro Costa'
  }
];

const mockClientes = [
  { id: 1, nome: 'João Silva Ltda' },
  { id: 2, nome: 'Maria Santos' },
  { id: 3, nome: 'Pedro Costa' }
];

// Helper function to setup fetch mocks
const setupFetchMocks = () => {
  global.fetch.mockImplementation((url) => {
    if (url === '/api/contratos') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockContratos),
      });
    }
    if (url === '/api/clientes') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClientes),
      });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
};

describe('Contratos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFetchMocks();
  });

  test('should load and display contratos and clientes', async () => {
    render(<Contratos />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Gerenciamento de Contratos')).toBeInTheDocument();
    });

    // Check if contratos are displayed
    expect(screen.getByText('João Silva Ltda')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Pedro Costa')).toBeInTheDocument();

    // Check if API calls were made
    expect(global.fetch).toHaveBeenCalledWith('/api/contratos');
    expect(global.fetch).toHaveBeenCalledWith('/api/clientes');
  });

  test('should format dates correctly', async () => {
    render(<Contratos />);

    await waitFor(() => {
      // Check Brazilian date format for data_venda
      expect(screen.getByText('15/01/2024')).toBeInTheDocument(); // 2024-01-15
      expect(screen.getByText('10/01/2024')).toBeInTheDocument(); // 2024-01-10
      
      // Check data_entrega
      expect(screen.getByText('20/02/2024')).toBeInTheDocument(); // 2024-02-20
      expect(screen.getByText('15/03/2024')).toBeInTheDocument(); // 2024-03-15
      
      // Check for dash when dates are null
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  test('should open novo contrato modal and display form fields', async () => {
    const user = userEvent.setup();
    render(<Contratos />);

    await waitFor(() => {
      expect(screen.getByText('Novo Contrato')).toBeInTheDocument();
    });

    // Click on Novo Contrato button
    const novoContratoBtn = screen.getByRole('button', { name: /novo contrato/i });
    await user.click(novoContratoBtn);

    // Check if modal opened
    expect(screen.getByText('Novo Contrato')).toBeInTheDocument();
    expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data da venda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de entrega/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vendedor/i)).toBeInTheDocument();
  });

  test('should handle contract deletion', async () => {
    window.confirm.mockReturnValue(true);
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const user = userEvent.setup();
    render(<Contratos />);

    await waitFor(() => {
      expect(screen.getByText('João Silva Ltda')).toBeInTheDocument();
    });

    // Find and click delete button for first contract
    const deleteButtons = screen.getAllByTitle('Excluir');
    await user.click(deleteButtons[0]);

    // Check if confirmation was called
    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este contrato?');

    // Check if DELETE API call was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/contratos/1', {
        method: 'DELETE'
      });
    });
  });
});

// Test date formatting utility functions
describe('Date Formatting Utilities', () => {
  test('should format date to Brazilian format', () => {
    const formatDateBrazilian = (dateInput) => {
      if (!dateInput) return '-';
      
      let date;
      if (typeof dateInput === 'string') {
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
      
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };

    expect(formatDateBrazilian('2024-01-15')).toBe('15/01/2024');
    expect(formatDateBrazilian('2024-12-25')).toBe('25/12/2024');
    expect(formatDateBrazilian(null)).toBe('-');
    expect(formatDateBrazilian('')).toBe('-');
  });
});