#!/usr/bin/env python3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

# Configuração do banco
DB_CONFIG = {
    'host': os.getenv('PG_HOST', 'localhost'),
    'database': os.getenv('PG_NAME', 'db_elevadores'),
    'user': os.getenv('PG_USER', 'postgres'),
    'password': os.getenv('PG_PASSWORD', 'postgres'),
    'port': os.getenv('PG_PORT', 5432)
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Verificar estrutura da tabela cliente
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'cliente' 
        ORDER BY ordinal_position;
    """)
    
    print('📋 Estrutura da tabela cliente:')
    for row in cursor.fetchall():
        print(f'   {row["column_name"]:15} {row["data_type"]:20} {"NULL" if row["is_nullable"] == "YES" else "NOT NULL"}')
    
    # Verificar alguns dados de exemplo
    cursor.execute('SELECT id, nome, comercial, documento, email FROM cliente LIMIT 6;')
    print('\n👥 Clientes cadastrados:')
    for row in cursor.fetchall():
        tipo = 'Comercial' if row['comercial'] else 'Pessoa Física'
        print(f'   {row["id"]:2} | {row["nome"]:30} | {tipo:13} | {row["documento"]:14} | {row["email"]}')
    
    # Verificar contratos
    cursor.execute('SELECT COUNT(*) as total FROM contrato;')
    total_contratos = cursor.fetchone()['total']
    print(f'\n📄 Total de contratos: {total_contratos}')
    
    cursor.close()
    conn.close()
    print('\n✅ Verificação concluída!')
    
except Exception as e:
    print(f'❌ Erro: {e}')
