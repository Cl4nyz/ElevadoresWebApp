// Funções comuns para toda a aplicação

// Configuração global do fetch
const API_BASE = '';

// Função para mostrar toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastBody = toast.querySelector('.toast-body');
    const toastElement = new bootstrap.Toast(toast);
    
    // Remove classes de tipo anteriores
    toast.classList.remove('toast-success', 'toast-error', 'toast-warning');
    
    // Adiciona classe do tipo
    if (type === 'success') {
        toast.classList.add('toast-success');
    } else if (type === 'error') {
        toast.classList.add('toast-error');
    } else if (type === 'warning') {
        toast.classList.add('toast-warning');
    }
    
    toastBody.textContent = message;
    toastElement.show();
}

// Função para fazer requisições API
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// Função para confirmar exclusão
function confirmarExclusao(callback, mensagem = 'Tem certeza que deseja excluir este item?') {
    if (confirm(mensagem)) {
        callback();
    }
}

// Função para formatar data
function formatarData(data) {
    if (!data) return '-';
    
    let dataObj;
    
    // Se a data já é um objeto Date
    if (data instanceof Date) {
        dataObj = data;
    } else {
        // Se é uma string, garantir que seja interpretada corretamente
        // Adicionar 'T00:00:00' para evitar problemas de timezone
        if (typeof data === 'string' && !data.includes('T')) {
            dataObj = new Date(data + 'T00:00:00');
        } else {
            dataObj = new Date(data);
        }
    }
    
    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) {
        return '-';
    }
    
    // Forçar formato brasileiro usando toLocaleDateString com configurações específicas
    return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
    });
}

// Função para converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
function converterDataBrParaISO(dataBr) {
    if (!dataBr) return null;
    
    // Se já está no formato ISO (YYYY-MM-DD), retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataBr)) {
        return dataBr;
    }
    
    // Se está no formato brasileiro (DD/MM/YYYY)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataBr)) {
        const [dia, mes, ano] = dataBr.split('/');
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    return null;
}

// Função para converter data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
function converterDataISOParaBr(dataISO) {
    if (!dataISO) return '';
    
    // Se já está no formato brasileiro (DD/MM/YYYY), retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataISO)) {
        return dataISO;
    }
    
    // Se está no formato ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
        const [ano, mes, dia] = dataISO.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    
    return '';
}

// Função para garantir que a data seja interpretada corretamente
function criarDataSegura(dataString) {
    if (!dataString) return null;
    
    // Se é uma string no formato YYYY-MM-DD (formato padrão do input date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
        return new Date(dataString + 'T00:00:00');
    }
    
    // Se é uma string no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
        const [dia, mes, ano] = dataString.split('/');
        return new Date(ano, parseInt(mes) - 1, dia);
    }
    
    // Tentar criar a data normalmente
    return new Date(dataString + 'T00:00:00');
}

// Função para formatar CPF
function formatarCPF(cpf) {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar CEP
function formatarCEP(cep) {
    if (!cep) return '-';
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Função para limpar formulário
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Limpar campos hidden também
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => input.value = '');
    }
}

// Função para desabilitar/habilitar botão de submit
function toggleSubmitButton(buttonElement, loading = false) {
    if (loading) {
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    } else {
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }
}

// Função para validar formulário
function validarFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        const value = field.value.trim();
        if (!value) {
            field.classList.add('is-invalid');
            isValid = false;
            
            // Adicionar ou atualizar mensagem de erro
            let errorDiv = field.parentNode.querySelector('.invalid-feedback');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                field.parentNode.appendChild(errorDiv);
            }
            errorDiv.textContent = 'Este campo é obrigatório';
        } else {
            field.classList.remove('is-invalid');
            // Remover mensagem de erro se existir
            const errorDiv = field.parentNode.querySelector('.invalid-feedback');
            if (errorDiv) {
                errorDiv.remove();
            }
        }
    });
    
    return isValid;
}

// Função para validar CPF
function validarCPF(cpf) {
    if (!cpf) return true; // CPF é opcional
    
    cpf = cpf.replace(/[^\d]+/g, '');
    
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) {
        return false;
    }
    
    const calc = (x) => {
        const slice = cpf.slice(0, x);
        let factor = x + 1;
        const sum = slice.reduce((acc, d) => acc + d * factor--, 0);
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };
    
    return calc(9) === parseInt(cpf[9]) && calc(10) === parseInt(cpf[10]);
}

// Máscaras para inputs
document.addEventListener('DOMContentLoaded', function() {
    // Máscara para CPF
    const cpfInputs = document.querySelectorAll('input[id*="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                e.target.value = value;
            }
        });
    });
    
    // Máscara para CEP
    const cepInputs = document.querySelectorAll('input[id*="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                e.target.value = value;
            }
        });
    });
    
    // Máscara para Estado (apenas 2 letras)
    const estadoInputs = document.querySelectorAll('input[id*="estado"]');
    estadoInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        });
    });
});

// Função para exportar dados para CSV
function exportarCSV(dados, nomeArquivo) {
    if (!dados || dados.length === 0) {
        showToast('Não há dados para exportar', 'warning');
        return;
    }
    
    const headers = Object.keys(dados[0]);
    const csvContent = [
        headers.join(','),
        ...dados.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para debounce (útil para pesquisas)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event listeners globais
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar classe fade-in aos elementos carregados
    const elements = document.querySelectorAll('.card, .hero-section');
    elements.forEach(el => el.classList.add('fade-in'));
    
    // Adicionar confirmação para botões de exclusão
    const deleteButtons = document.querySelectorAll('.btn-danger[onclick*="delete"], .btn-outline-danger[onclick*="delete"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Tem certeza que deseja excluir este item?')) {
                eval(this.getAttribute('onclick'));
            }
        });
    });
});

// Configuração global para modais
document.addEventListener('DOMContentLoaded', function() {
    // Limpar formulários quando modais são fechados
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function() {
            const forms = this.querySelectorAll('form');
            forms.forEach(form => {
                form.reset();
                form.classList.remove('was-validated');
                const inputs = form.querySelectorAll('.is-invalid');
                inputs.forEach(input => input.classList.remove('is-invalid'));
            });
            
            // Remover backdrop residual para evitar tela cinza
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Garantir que o body não fique com scroll bloqueado
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    });
});

// Sistema de ordenação e pesquisa para tabelas
class TabelaOrdenavel {
    constructor(tabelaId, dados, renderCallback) {
        this.tabelaId = tabelaId;
        this.dados = dados;
        this.dadosOriginais = [...dados];
        this.renderCallback = renderCallback;
        this.ordemAtual = { coluna: null, crescente: true };
        this.termoPesquisa = '';
        
        this.inicializar();
    }
    
    inicializar() {
        this.adicionarEventosOrdenacao();
        this.adicionarCaixaPesquisa();
    }
    
    adicionarEventosOrdenacao() {
        const tabela = document.getElementById(this.tabelaId);
        if (!tabela) return;
        
        const headers = tabela.querySelectorAll('thead th[data-sort]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.style.userSelect = 'none';
            header.addEventListener('click', () => {
                const coluna = header.getAttribute('data-sort');
                this.ordenar(coluna);
            });
            
            // Adicionar ícone de ordenação
            if (!header.querySelector('.sort-icon')) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-sort ms-1 sort-icon';
                header.appendChild(icon);
            }
        });
    }
    
    adicionarCaixaPesquisa() {
        const tabela = document.getElementById(this.tabelaId);
        if (!tabela) return;
        
        const container = tabela.parentElement;
        const existePesquisa = container.querySelector('.search-container');
        
        if (!existePesquisa) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container mb-3';
            searchContainer.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" placeholder="Pesquisar..." id="search-${this.tabelaId}">
                        </div>
                    </div>
                </div>
            `;
            
            container.insertBefore(searchContainer, tabela);
            
            // Adicionar evento de pesquisa
            const searchInput = document.getElementById(`search-${this.tabelaId}`);
            searchInput.addEventListener('input', (e) => {
                this.termoPesquisa = e.target.value.toLowerCase();
                this.filtrarEAtualizar();
            });
        }
    }
    
    ordenar(coluna) {
        if (this.ordemAtual.coluna === coluna) {
            this.ordemAtual.crescente = !this.ordemAtual.crescente;
        } else {
            this.ordemAtual.coluna = coluna;
            this.ordemAtual.crescente = true;
        }
        
        this.dados.sort((a, b) => {
            let valorA = this.obterValorColuna(a, coluna);
            let valorB = this.obterValorColuna(b, coluna);
            
            // Converter para string para comparação se não for número
            if (typeof valorA !== 'number') valorA = String(valorA).toLowerCase();
            if (typeof valorB !== 'number') valorB = String(valorB).toLowerCase();
            
            if (valorA < valorB) return this.ordemAtual.crescente ? -1 : 1;
            if (valorA > valorB) return this.ordemAtual.crescente ? 1 : -1;
            return 0;
        });
        
        this.atualizarIconesOrdenacao();
        this.renderCallback(this.dados);
    }
    
    obterValorColuna(item, coluna) {
        // Suporte para propriedades aninhadas (ex: 'cliente.nome')
        return coluna.split('.').reduce((obj, prop) => obj && obj[prop], item) || '';
    }
    
    atualizarIconesOrdenacao() {
        const tabela = document.getElementById(this.tabelaId);
        if (!tabela) return;
        
        // Resetar todos os ícones
        const icons = tabela.querySelectorAll('.sort-icon');
        icons.forEach(icon => {
            icon.className = 'fas fa-sort ms-1 sort-icon';
        });
        
        // Atualizar ícone da coluna ativa
        const activeHeader = tabela.querySelector(`th[data-sort="${this.ordemAtual.coluna}"] .sort-icon`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${this.ordemAtual.crescente ? 'up' : 'down'} ms-1 sort-icon`;
        }
    }
    
    filtrarEAtualizar() {
        if (!this.termoPesquisa) {
            this.dados = [...this.dadosOriginais];
        } else {
            this.dados = this.dadosOriginais.filter(item => {
                return Object.values(item).some(valor => 
                    String(valor).toLowerCase().includes(this.termoPesquisa)
                );
            });
        }
        
        // Reaplicar ordenação se existir
        if (this.ordemAtual.coluna) {
            this.ordenar(this.ordemAtual.coluna);
        } else {
            this.renderCallback(this.dados);
        }
    }
    
    // Método público para filtrar (usado pelos event listeners)
    filtrar(termo) {
        this.termoPesquisa = termo.toLowerCase();
        this.filtrarEAtualizar();
    }
    
    atualizarDados(novosDados) {
        this.dados = [...novosDados];
        this.dadosOriginais = [...novosDados];
        this.filtrarEAtualizar();
    }
}
