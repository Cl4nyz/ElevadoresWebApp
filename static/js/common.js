// Funções comuns para toda a aplicação

// Configuração global do fetch
const API_BASE = '';

// Função para validar campos obrigatórios e destacar os não preenchidos
function validarCamposObrigatorios(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    const camposObrigatorios = form.querySelectorAll('[required]');
    let todosValidos = true;
    let primeiroErro = null;
    
    camposObrigatorios.forEach(campo => {
        let valido = false;
        
        // Verificar se o campo está visível
        if (campo.style.display === 'none' || campo.offsetParent === null) {
            return; // Pular campos ocultos
        }
        
        if (campo.type === 'checkbox' || campo.type === 'radio') {
            valido = campo.checked;
        } else if (campo.tagName === 'SELECT') {
            valido = campo.value && campo.value.trim() !== '';
        } else {
            valido = campo.value && campo.value.trim() !== '';
        }
        
        if (!valido) {
            campo.classList.add('campo-obrigatorio-erro', 'campo-shake');
            todosValidos = false;
            
            if (!primeiroErro) {
                primeiroErro = campo;
            }
        } else {
            campo.classList.remove('campo-obrigatorio-erro', 'campo-shake');
        }
    });
    
    // Focar no primeiro campo com erro
    if (primeiroErro) {
        setTimeout(() => {
            primeiroErro.focus();
            primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
    
    return todosValidos;
}

// Função para remover destacamento de erro de todos os campos
function limparErrosCampos(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const campos = form.querySelectorAll('.campo-obrigatorio-erro');
    campos.forEach(campo => {
        campo.classList.remove('campo-obrigatorio-erro', 'campo-shake');
    });
}

// Função para configurar listeners que removem erro ao interagir com campos
function configurarRemocaoErros() {
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('campo-obrigatorio-erro')) {
            e.target.classList.remove('campo-obrigatorio-erro', 'campo-shake');
        }
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('campo-obrigatorio-erro')) {
            e.target.classList.remove('campo-obrigatorio-erro', 'campo-shake');
        }
    });
    
    document.addEventListener('focus', function(e) {
        if (e.target.classList.contains('campo-obrigatorio-erro')) {
            e.target.classList.remove('campo-shake');
        }
    });
}

// Inicializar configuração global
document.addEventListener('DOMContentLoaded', function() {
    configurarRemocaoErros();
});

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
    
    // Se é uma string no formato YYYY-MM-DD (formato padrão do input date e ISO)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
        const [ano, mes, dia] = dataString.split('-');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    
    // Se é uma string no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
        const [dia, mes, ano] = dataString.split('/');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    
    // Tentar criar a data normalmente como último recurso
    try {
        return new Date(dataString);
    } catch (e) {
        console.error('Erro ao criar data:', dataString, e);
        return null;
    }
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

// Função para formatar CPF
function formatarCPF(cpf) {
    // Remove tudo que não é dígito
    cpf = cpf.replace(/\D/g, '');
    
    // Aplica a máscara conforme o usuário digita
    if (cpf.length <= 3) {
        return cpf;
    } else if (cpf.length <= 6) {
        return cpf.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    } else if (cpf.length <= 9) {
        return cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }
}

// Função para validar CPF
function validarCPF(cpf) {
    if (!cpf) return true; // CPF é opcional
    
    // Garantir que cpf é uma string e remover formatação
    cpf = String(cpf).replace(/[^\d]+/g, '');
    
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) {
        return false;
    }
    
    // Verificar se não é uma sequência de números iguais (como 11111111111)
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    // Para desenvolvimento, aceitar qualquer CPF que não seja sequência repetida
    return true;
}

// Função para aplicar máscara de CPF em tempo real
function aplicarMascaraCPF(input) {
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const newValue = formatarCPF(input.value);
    
    input.value = newValue;
    
    // Ajustar posição do cursor para manter experiência fluida
    let newCursorPosition = cursorPosition;
    
    // Se adicionou caracteres de formatação, ajustar cursor
    if (newValue.length > oldValue.length && cursorPosition <= newValue.length) {
        // Contar quantos caracteres de formatação foram adicionados até a posição do cursor
        const beforeCursor = newValue.slice(0, cursorPosition);
        const formatChars = (beforeCursor.match(/[.\-]/g) || []).length;
        const oldFormatChars = (oldValue.slice(0, cursorPosition).match(/[.\-]/g) || []).length;
        
        if (formatChars > oldFormatChars) {
            newCursorPosition = cursorPosition + (formatChars - oldFormatChars);
        }
    }
    
    // Definir nova posição do cursor
    input.setSelectionRange(newCursorPosition, newCursorPosition);
}

// Função para formatar CNPJ
function formatarCNPJ(cnpj) {
    // Remove tudo que não é dígito
    cnpj = cnpj.replace(/\D/g, '');
    
    // Aplica a máscara conforme o usuário digita
    if (cnpj.length <= 2) {
        return cnpj;
    } else if (cnpj.length <= 5) {
        return cnpj.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    } else if (cnpj.length <= 8) {
        return cnpj.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (cnpj.length <= 12) {
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else {
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    }
}

// Função para validar CNPJ
function validarCNPJ(cnpj) {
    if (!cnpj) return true; // CNPJ é opcional
    
    // Garantir que cnpj é uma string e remover formatação
    cnpj = String(cnpj).replace(/[^\d]+/g, '');
    
    // Verificar se tem 14 dígitos
    if (cnpj.length !== 14) {
        return false;
    }
    
    // Verificar se não é uma sequência de números iguais (como 11111111111111)
    if (/^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }
    
    // Para desenvolvimento, aceitar qualquer CNPJ que não seja sequência repetida
    return true;
}

// Função para aplicar máscara de CNPJ em tempo real
function aplicarMascaraCNPJ(input) {
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const newValue = formatarCNPJ(input.value);
    
    input.value = newValue;
    
    // Ajustar posição do cursor para manter experiência fluida
    let newCursorPosition = cursorPosition;
    
    // Se adicionou caracteres de formatação, ajustar cursor
    if (newValue.length > oldValue.length && cursorPosition <= newValue.length) {
        // Contar quantos caracteres de formatação foram adicionados até a posição do cursor
        const beforeCursor = newValue.slice(0, cursorPosition);
        const formatChars = (beforeCursor.match(/[.\-\/]/g) || []).length;
        const oldFormatChars = (oldValue.slice(0, cursorPosition).match(/[.\-\/]/g) || []).length;
        
        if (formatChars > oldFormatChars) {
            newCursorPosition = cursorPosition + (formatChars - oldFormatChars);
        }
    }
    
    // Definir nova posição do cursor
    input.setSelectionRange(newCursorPosition, newCursorPosition);
}

// Função para formatar documento (CPF ou CNPJ)
function formatarDocumento(documento) {
    if (!documento) return '';
    
    // Remove formatação
    const numeros = documento.replace(/\D/g, '');
    
    if (numeros.length <= 11) {
        return formatarCPF(numeros);
    } else {
        return formatarCNPJ(numeros);
    }
}

// Função para validar documento (CPF ou CNPJ)
function validarDocumento(documento) {
    if (!documento) return true; // Documento é opcional
    
    // Remove formatação
    const numeros = documento.replace(/\D/g, '');
    
    if (numeros.length === 11) {
        return validarCPF(numeros);
    } else if (numeros.length === 14) {
        return validarCNPJ(numeros);
    } else {
        return false;
    }
}

// Função para aplicar máscara de documento (CPF ou CNPJ)
function aplicarMascaraDocumento(input) {
    const numeros = input.value.replace(/\D/g, '');
    
    if (numeros.length <= 11) {
        aplicarMascaraCPF(input);
    } else {
        aplicarMascaraCNPJ(input);
    }
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
        
        // Encontrar o container apropriado (subir até encontrar .card-body ou .container)
        let container = tabela.parentElement;
        while (container && !container.classList.contains('card-body') && !container.classList.contains('container')) {
            container = container.parentElement;
        }
        
        if (!container) {
            container = tabela.parentElement;
        }
        
        const existePesquisa = container.querySelector('.search-container') || document.getElementById(`search-${this.tabelaId}`);
        
        if (!existePesquisa) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container mb-3';
            searchContainer.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" placeholder="Buscar por cliente, ID, vendedor ou data..." id="search-${this.tabelaId}">
                        </div>
                    </div>
                </div>
            `;
            
            // Inserir antes da table-responsive ou da tabela
            const tableContainer = tabela.closest('.table-responsive') || tabela;
            container.insertBefore(searchContainer, tableContainer);
            
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
                return Object.values(item).some(valor => {
                    if (valor === null || valor === undefined) return false;
                    // Converter datas para formato brasileiro para busca
                    if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const data = new Date(valor + 'T00:00:00');
                        const dataBrasil = data.toLocaleDateString('pt-BR');
                        return dataBrasil.includes(this.termoPesquisa);
                    }
                    return String(valor).toLowerCase().includes(this.termoPesquisa);
                });
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
    
    // Método para atualizar a busca após mudanças na tabela
    atualizarBusca() {
        const searchInput = document.getElementById(`search-${this.tabelaId}`);
        if (searchInput && searchInput.value) {
            this.filtrar(searchInput.value);
        }
    }
}
