// Configurações de localização e data para garantir formato brasileiro
// Este arquivo deve ser carregado antes dos outros scripts

// Configurar locale padrão para português brasileiro
if (typeof Intl !== 'undefined') {
    // Verificar se o navegador suporta o locale pt-BR
    try {
        const testDate = new Date('2023-12-25');
        const ptBRSupported = testDate.toLocaleDateString('pt-BR') !== testDate.toLocaleDateString();
        
        if (!ptBRSupported) {
            console.warn('Locale pt-BR não totalmente suportado, usando fallbacks');
        }
    } catch (e) {
        console.warn('Erro ao verificar suporte para locale pt-BR:', e);
    }
}

// Configurar FullCalendar para português se estiver sendo usado
if (typeof FullCalendar !== 'undefined' && FullCalendar.globalLocales) {
    FullCalendar.globalLocales.push({
        code: 'pt-br',
        buttonText: {
            prev: 'Anterior',
            next: 'Próximo',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
        },
        weekText: 'Sm',
        allDayText: 'dia inteiro',
        moreLinkText: function(n) {
            return 'mais +' + n;
        },
        noEventsText: 'Não há eventos para mostrar',
        monthNames: [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ],
        monthNamesShort: [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ],
        dayNames: [
            'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
            'Quinta-feira', 'Sexta-feira', 'Sábado'
        ],
        dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    });
}

// Sobrescrever toLocaleDateString para garantir formato brasileiro
const originalToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function(locales, options) {
    // Se não foi especificado locale ou se é o locale do sistema, forçar pt-BR
    if (!locales || (typeof locales === 'string' && locales.startsWith('en'))) {
        locales = 'pt-BR';
    }
    
    // Garantir opções padrão para formato brasileiro
    if (!options) {
        options = {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        };
    }
    
    try {
        return originalToLocaleDateString.call(this, locales, options);
    } catch (e) {
        // Fallback manual se o locale não for suportado
        const day = this.getDate().toString().padStart(2, '0');
        const month = (this.getMonth() + 1).toString().padStart(2, '0');
        const year = this.getFullYear();
        return `${day}/${month}/${year}`;
    }
};

// Função global para garantir que inputs de data funcionem corretamente
function configurarInputsData() {
    const inputs = document.querySelectorAll('input[type="date"]');
    inputs.forEach(input => {
        // Garantir que o valor seja sempre no formato YYYY-MM-DD
        input.addEventListener('change', function(e) {
            const valor = e.target.value;
            if (valor && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
                console.warn('Formato de data inválido detectado:', valor);
                e.target.value = '';
            }
        });
        
        // Adicionar placeholder para ajudar o usuário
        if (!input.placeholder) {
            input.placeholder = 'dd/mm/aaaa';
        }
    });
}

// Executar configuração quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarInputsData);
} else {
    configurarInputsData();
}

// Observar mudanças no DOM para novos inputs de data
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            const novosInputs = document.querySelectorAll('input[type="date"]:not([data-configurado])');
            novosInputs.forEach(input => {
                configurarInputsData();
                input.setAttribute('data-configurado', 'true');
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('🇧🇷 Configurações de localização brasileira carregadas');
