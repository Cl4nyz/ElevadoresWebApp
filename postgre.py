#import csv
from dotenv import load_dotenv
import os
import psycopg2
#import pandas as pd

# Carregar variáveis do arquivo .env
load_dotenv()

NAME = os.getenv('PG_NAME')
USER = os.getenv('PG_USER')
PASSWORD = os.getenv('PG_PASSWORD')
HOST = os.getenv('PG_HOST')
PORT = os.getenv('PG_PORT')

def create_database():
    conn = psycopg2.connect(
        dbname='postgres',
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = %s;", (NAME,))
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f'CREATE DATABASE "{NAME}";')
            print(f"Banco de dados '{NAME}' criado com sucesso.")
        else:
            print(f"Banco de dados '{NAME}' já existe.")
    except Exception as e:
        print(f"Erro ao criar banco de dados: {e}")
    finally:
        cursor.close()
        conn.close()

def create_pg_connection(verbose=False):
    """Cria uma conexão com o banco de dados PostgreSQL."""
    try:
        conn = psycopg2.connect(
            dbname=NAME,
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT
        )
        if verbose:
            print(f'Nome: {NAME}')
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None

def end_pg_connection(conn, verbose=False):
    """Faz commit e encerra a conexão com o banco de dados."""
    if conn:
        conn.commit()
        conn.close()
        if verbose:
            print("Conexão encerrada.")
            
def drop_all_tables(conn):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            DROP TABLE IF EXISTS elevador CASCADE;
            DROP TABLE IF EXISTS endereco CASCADE;
            DROP TABLE IF EXISTS cliente CASCADE;
            DROP TABLE IF EXISTS cabine CASCADE;
            DROP TABLE IF EXISTS contrato CASCADE;
            DROP TABLE IF EXISTS estado CASCADE;
        """)
        print("Todas as tabelas foram apagadas com sucesso.")
    except Exception as e:
        print(f"Erro ao apagar tabelas: {e}")
    finally:
        cursor.close()

def create_tables(conn):
    cursor = conn.cursor()
    try:
        with open('create.txt', 'r', encoding='utf-8') as f:
            sql = f.read()
        cursor.execute(sql)
        print("Tabelas criadas com sucesso.")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
    finally:
        cursor.close()

def insert_initial_data(conn):
    """Insere dados iniciais obrigatórios (estados)"""
    cursor = conn.cursor()
    try:
        # Inserir todos os estados brasileiros
        cursor.execute("""
            INSERT INTO estado (sigla, nome) VALUES
            ('AC', 'Acre'),
            ('AL', 'Alagoas'),
            ('AP', 'Amapá'),
            ('AM', 'Amazonas'),
            ('BA', 'Bahia'),
            ('CE', 'Ceará'),
            ('DF', 'Distrito Federal'),
            ('ES', 'Espírito Santo'),
            ('GO', 'Goiás'),
            ('MA', 'Maranhão'),
            ('MT', 'Mato Grosso'),
            ('MS', 'Mato Grosso do Sul'),
            ('MG', 'Minas Gerais'),
            ('PA', 'Pará'),
            ('PB', 'Paraíba'),
            ('PR', 'Paraná'),
            ('PE', 'Pernambuco'),
            ('PI', 'Piauí'),
            ('RJ', 'Rio de Janeiro'),
            ('RN', 'Rio Grande do Norte'),
            ('RS', 'Rio Grande do Sul'),
            ('RO', 'Rondônia'),
            ('RR', 'Roraima'),
            ('SC', 'Santa Catarina'),
            ('SP', 'São Paulo'),
            ('SE', 'Sergipe'),
            ('TO', 'Tocantins')
            ON CONFLICT (sigla) DO NOTHING;
        """)
        
        conn.commit()
        print("Dados iniciais inseridos com sucesso.")
    except Exception as e:
        print(f"Erro ao inserir dados iniciais: {e}")
    finally:
        cursor.close()
		
if __name__ == '__main__':
    conn = create_pg_connection(True)
    conn.commit()
    cursor = conn.cursor()
    pop = False

    if pop:
        drop_all_tables(conn)
        create_tables(conn)
        insert_initial_data(conn)  # Inserir dados iniciais obrigatórios
        
        # Populando as tabelas com dados de exemplo
        try:
            # Inserir clientes (sem especificar ID - será auto-incrementado)
            cursor.execute("""
                INSERT INTO cliente (nome, cpf) VALUES
                ('João Silva Santos', '12345678901'),
                ('Maria Oliveira Costa', '98765432100'),
                ('Pedro Henrique Lima', '11111111111');
            """)

            # Inserir endereços (usando siglas de estado válidas)
            cursor.execute("""
                INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) VALUES
                (1, 'Rua das Flores', 100, 'São Paulo', 'SP', 'Apto 101', '01234567'),
                (1, 'Av. Paulista', 456, 'São Paulo', 'SP', 'Escritório', '01310100'),
                (2, 'Av. Brasil', 200, 'Rio de Janeiro', 'RJ', NULL, '76543210'),
                (3, 'Rua Central', 321, 'Belo Horizonte', 'MG', 'Sala 201', '12345678');
            """)

            # Inserir contratos
            cursor.execute("""
                INSERT INTO contrato (data_venda, data_entrega, id_cliente) VALUES
                ('2024-01-15', '2024-12-15', 1),
                ('2024-02-20', '2024-11-20', 2),
                ('2024-03-10', '2025-01-10', 3);
            """)

            # Inserir elevadores com nova estrutura
            cursor.execute("""
                INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor, status) VALUES
                (1, 'Manual', 'Elevador residencial', 'Simples', 'Simples', 'Azul', 'Em produção'),
                (2, 'Automatico', 'Elevador comercial', 'Dupla', 'Dupla', 'Vermelho', 'Pronto'),
                (3, 'Manual', 'Elevador de carga', 'Portao', 'Portao', 'Verde', 'Não iniciado');
            """)

            # Inserir dados das cabines
            cursor.execute("""
                INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida) VALUES
                (1, 2200, 1000, 1200, 'Ceramico', true, 'Frente', 'Frente'),
                (2, 2400, 1200, 1400, 'Granito', true, 'Frente', 'Tras'),
                (3, 2800, 1500, 2000, 'Chapa', false, 'Lateral', 'Lateral');
            """)

            # Inserir dados das colunas
            cursor.execute("""
                INSERT INTO coluna (id_elevador, elevacao, montada) VALUES
                (1, 3000, true),
                (2, 3500, true),
                (3, 4000, false);
            """)

            # Inserir dados dos adicionais
            cursor.execute("""
                INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica, lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada) VALUES
                (1, 1, 0, 0, 1, 2, 1, 0, 0, false),
                (2, 2, 1, 0, 2, 4, 2, 1, 1, true),
                (3, 0, 0, 2, 0, 0, 0, 1, 0, true);
            """)

            print("Tabelas populadas com dados de exemplo.")
        except Exception as e:
            print(f"Erro ao popular tabelas: {e}")
        print('Setup concluído com sucesso!')
    
    end_pg_connection(conn, True)
	