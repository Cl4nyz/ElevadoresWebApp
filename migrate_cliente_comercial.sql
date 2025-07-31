-- Migração para adicionar campos comercial e documento à tabela cliente
-- Este script preserva todos os dados existentes

BEGIN;

-- Adicionar coluna comercial (padrão false para compatibilidade)
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS comercial boolean DEFAULT false;

-- Adicionar coluna documento (para CPF/CNPJ)
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS documento character varying(14);

-- Migrar dados existentes: copiar CPF para documento onde cpf não é null
UPDATE cliente 
SET documento = cpf 
WHERE cpf IS NOT NULL AND documento IS NULL;

-- Verificar os dados migrados
SELECT 
    id, 
    nome, 
    cpf, 
    comercial, 
    documento,
    CASE 
        WHEN comercial THEN 'CNPJ'
        ELSE 'CPF'
    END as tipo_documento
FROM cliente 
ORDER BY id;

COMMIT;
