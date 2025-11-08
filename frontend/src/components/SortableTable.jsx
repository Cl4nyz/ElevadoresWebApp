import React, { useState, useMemo } from 'react';

/**
 * Reusable table component with sorting and search functionality
 */
// Helper function to get nested object values
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

const SortableTable = ({ 
  data, 
  columns, 
  searchableFields, 
  onRowAction,
  actions,
  emptyMessage = "Nenhum registro encontrado",
  className = "table table-hover"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return searchableFields.some(field => {
        const value = getNestedValue(item, field);
        return value && 
               value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchableFields]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Handle column header click for sorting
  const handleSort = (columnKey) => {
    if (!columnKey) return;
    
    setSortConfig(prevConfig => ({
      key: columnKey,
      direction: prevConfig.key === columnKey && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon for column header
  const getSortIcon = (columnKey) => {
    if (!columnKey || sortConfig.key !== columnKey) {
      return <i className="fas fa-sort text-muted ms-1"></i>;
    }
    
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up text-primary ms-1"></i>
      : <i className="fas fa-sort-down text-primary ms-1"></i>;
  };

  // Render cell content
  const renderCellContent = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = getNestedValue(item, column.key);
    
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString('pt-BR');
    }
    
    if (column.type === 'currency' && value) {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value);
    }
    
    return value || '-';
  };

  return (
    <div>
      {/* Search Input */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        {searchTerm && (
          <small className="text-muted">
            Mostrando {sortedData.length} de {data.length} registros
          </small>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className={className}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  style={{ 
                    cursor: column.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  title={column.sortable !== false ? 'Clique para ordenar' : ''}
                >
                  {column.label}
                  {column.sortable !== false && getSortIcon(column.key)}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th style={{ width: '120px' }}>Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="text-center py-4 text-muted"
                >
                  <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                  {searchTerm ? `Nenhum resultado encontrado para "${searchTerm}"` : emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr key={item.id || index}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td>
                      <div className="btn-group" role="group">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            className={action.className || 'btn btn-sm btn-outline-primary'}
                            onClick={() => action.onClick(item)}
                            title={action.title}
                            disabled={action.disabled && action.disabled(item)}
                          >
                            {action.icon && <i className={action.icon}></i>}
                            {action.label && <span className="ms-1">{action.label}</span>}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SortableTable;