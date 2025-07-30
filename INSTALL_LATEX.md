# Instruções de instalação para geração de PDF

## Opção 1: Sem instalações externas (RECOMENDADO)
O sistema possui fallback automático para **WeasyPrint** quando LaTeX não está disponível.

### Instalar apenas dependências Python:
```bash
pip install weasyprint pylatex requests
```

**Vantagens:**
- ✅ Não requer instalação externa
- ✅ Funciona em qualquer sistema
- ✅ Fallback automático
- ✅ Mesmo resultado visual

## Opção 2: LaTeX completo (Melhor qualidade tipográfica)

### Para Windows:
1. Instale MiKTeX: https://miktex.org/download
2. Ou instale TeX Live: https://www.tug.org/texlive/acquire-netinstall.html

### Para Linux (Ubuntu/Debian):
```bash
sudo apt-get install texlive-latex-extra texlive-fonts-recommended texlive-lang-portuguese
```

### Para macOS:
```bash
brew install mactex
```

### Verificação da instalação:
```bash
pdflatex --version
```

## Como funciona o sistema:

1. **Tenta usar pdflatex** (se disponível) para máxima qualidade
2. **Fallback automático** para WeasyPrint se pdflatex não existir
3. **Erro apenas** se ambos falharem

## Pacotes LaTeX necessários (se usar LaTeX):
- inputenc (UTF-8)
- babel (português)  
- geometry (margens)
- booktabs (tabelas)
- graphicx (imagens)
- array (tabelas avançadas)
