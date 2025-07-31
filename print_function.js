// Função para imprimir a visualização do elevador
function imprimirVisualizacaoElevador() {
    console.log('Imprimindo visualização do elevador...');
    
    // Salvar o título original da página
    const tituloOriginal = document.title;
    
    // Obter o ID do elevador atual
    const elevadorId = window.elevadorVisualizacaoAtual ? window.elevadorVisualizacaoAtual.id : 'N/A';
    
    // Alterar título para a impressão
    document.title = `Elevador ${elevadorId} - Visualização`;
    
    // Criar uma nova janela de impressão com apenas o conteúdo do modal
    const modalContent = document.querySelector('#visualizarElevadorModal .modal-body').cloneNode(true);
    
    // Criar documento para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Elevador ${elevadorId} - Visualização</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px;
                    background: white;
                }
                .card { 
                    border: 1px solid #ddd; 
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                .card-header { 
                    background-color: #f8f9fa; 
                    font-weight: bold;
                    padding: 10px 15px;
                }
                .card-body { 
                    padding: 15px; 
                }
                .form-label { 
                    font-weight: bold; 
                    color: #495057;
                }
                .form-control-plaintext { 
                    margin: 0; 
                    padding: 5px 0;
                    border-bottom: 1px solid #eee;
                }
                .row { 
                    margin-bottom: 10px; 
                }
                h1 {
                    text-align: center;
                    color: #0d6efd;
                    margin-bottom: 30px;
                    font-size: 24px;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #0d6efd;
                    padding-bottom: 15px;
                }
                .print-date {
                    text-align: right;
                    color: #6c757d;
                    font-size: 12px;
                    margin-bottom: 20px;
                }
                @media print {
                    body { 
                        margin: 0; 
                        padding: 15px;
                    }
                    .card {
                        box-shadow: none;
                        border: 1px solid #000;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1><i class="fas fa-elevator"></i> Visualização do Elevador ${elevadorId}</h1>
            </div>
            <div class="print-date">
                Impresso em: ${new Date().toLocaleString('pt-BR')}
            </div>
            <div class="container-fluid">
                ${modalContent.innerHTML}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };
    
    // Restaurar título original
    document.title = tituloOriginal;
}
