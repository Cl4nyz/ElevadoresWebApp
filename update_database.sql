-- Script para atualizar o banco de dados para o novo formato
-- Este script vai preservar clientes, enderecos e contratos, mas recriar a estrutura dos elevadores

BEGIN;

-- Remover todas as instancias de elevador conforme solicitado
DROP TABLE IF EXISTS elevador CASCADE;
DROP TABLE IF EXISTS cabine CASCADE;
DROP TABLE IF EXISTS coluna CASCADE;
DROP TABLE IF EXISTS adicionais CASCADE;

-- Recriar as tabelas com a nova estrutura

-- Tabela elevador (principal)
CREATE TABLE IF NOT EXISTS public.elevador
(
    id SERIAL NOT NULL,
    id_contrato integer,
    comando character varying(20),
    observacao character varying(100),
    porta_inferior character varying(10),
    porta_superior character varying(10),
    cor character varying(20),
    status character varying(20),
    PRIMARY KEY (id)
);

-- Tabela cabine (relacionada ao elevador)
CREATE TABLE IF NOT EXISTS public.cabine
(
    id_elevador integer NOT NULL,
    altura integer,
    largura integer,
    profundidade integer,
    piso character varying(10),
    montada boolean DEFAULT false,
    lado_entrada character varying(10),
    lado_saida character varying(10),
    PRIMARY KEY (id_elevador)
);

-- Tabela coluna (relacionada ao elevador)
CREATE TABLE IF NOT EXISTS public.coluna
(
    id_elevador integer NOT NULL,
    elevacao integer,
    montada boolean DEFAULT false,
    PRIMARY KEY (id_elevador)
);

-- Tabela adicionais (relacionada ao elevador)
CREATE TABLE IF NOT EXISTS public.adicionais
(
    id_elevador integer NOT NULL,
    cancela integer DEFAULT 0,
    porta integer DEFAULT 0,
    portao integer DEFAULT 0,
    barreira_eletronica integer DEFAULT 0,
    lados_enclausuramento integer DEFAULT 0,
    sensor_esmagamento integer DEFAULT 0,
    rampa_acesso integer DEFAULT 0,
    nobreak integer DEFAULT 0,
    galvanizada boolean DEFAULT false,
    PRIMARY KEY (id_elevador)
);

-- Adicionar as foreign keys
ALTER TABLE IF EXISTS public.cabine
    ADD FOREIGN KEY (id_elevador)
    REFERENCES public.elevador (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;

ALTER TABLE IF EXISTS public.adicionais
    ADD FOREIGN KEY (id_elevador)
    REFERENCES public.elevador (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;

ALTER TABLE IF EXISTS public.elevador
    ADD FOREIGN KEY (id_contrato)
    REFERENCES public.contrato (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE SET NULL
    NOT VALID;

ALTER TABLE IF EXISTS public.coluna
    ADD FOREIGN KEY (id_elevador)
    REFERENCES public.elevador (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
    NOT VALID;

-- Garantir que cliente e endereco tenham AUTO INCREMENT se nao tiverem
ALTER TABLE IF EXISTS public.cliente ALTER COLUMN id SET DEFAULT nextval('cliente_id_seq'::regclass);
ALTER TABLE IF EXISTS public.endereco ALTER COLUMN id SET DEFAULT nextval('endereco_id_seq'::regclass);
ALTER TABLE IF EXISTS public.contrato ALTER COLUMN id SET DEFAULT nextval('contrato_id_seq'::regclass);

-- Criar sequencias se nao existirem
CREATE SEQUENCE IF NOT EXISTS cliente_id_seq OWNED BY cliente.id;
CREATE SEQUENCE IF NOT EXISTS endereco_id_seq OWNED BY endereco.id;
CREATE SEQUENCE IF NOT EXISTS contrato_id_seq OWNED BY contrato.id;

COMMIT;
