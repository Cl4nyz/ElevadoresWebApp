#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de diagnóstico para verificar a conexão com o banco de dados
"""

import sys
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

print("=== DIAGNÓSTICO DE CONEXÃO COM BANCO DE DADOS ===")
print()

print("1. Verificando variáveis de ambiente:")
env_vars = ['PG_NAME', 'PG_USER', 'PG_PASSWORD', 'PG_HOST', 'PG_PORT']
for var in env_vars:
    value = os.getenv(var)
    if value:
        if var == 'PG_PASSWORD':
            print(f"   ✓ {var}: {'*' * len(value)}")
        else:
            print(f"   ✓ {var}: {value}")
    else:
        print(f"   ✗ {var}: NÃO DEFINIDA")

print()
print("2. Testando importação dos módulos:")
try:
    import psycopg2
    print("   ✓ psycopg2 importado com sucesso")
except ImportError as e:
    print(f"   ✗ Erro ao importar psycopg2: {e}")
    sys.exit(1)

try:
    from postgre import create_pg_connection
    print("   ✓ módulo postgre importado com sucesso")
except ImportError as e:
    print(f"   ✗ Erro ao importar módulo postgre: {e}")
    sys.exit(1)

print()
print("3. Testando conexão direta com psycopg2:")
try:
    conn = psycopg2.connect(
        dbname=os.getenv('PG_NAME'),
        user=os.getenv('PG_USER'),
        password=os.getenv('PG_PASSWORD'),
        host=os.getenv('PG_HOST'),
        port=os.getenv('PG_PORT')
    )
    print("   ✓ Conexão direta OK")
    
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    print(f"   ✓ Versão PostgreSQL: {version}")
    
    cursor.execute("SELECT current_database();")
    db_name = cursor.fetchone()[0]
    print(f"   ✓ Banco conectado: {db_name}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"   ✗ Erro na conexão direta: {e}")
    sys.exit(1)

print()
print("4. Testando função create_pg_connection:")
try:
    conn = create_pg_connection(verbose=True)
    if conn:
        print("   ✓ create_pg_connection OK")
        conn.close()
    else:
        print("   ✗ create_pg_connection retornou None")
except Exception as e:
    print(f"   ✗ Erro na create_pg_connection: {e}")

print()
print("5. Testando tabelas:")
try:
    conn = create_pg_connection()
    cursor = conn.cursor()
    
    # Verificar se a tabela cliente existe
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cliente';
    """)
    
    if cursor.fetchone():
        print("   ✓ Tabela 'cliente' existe")
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM cliente;")
        count = cursor.fetchone()[0]
        print(f"   ✓ Registros na tabela cliente: {count}")
    else:
        print("   ✗ Tabela 'cliente' não existe")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"   ✗ Erro ao verificar tabelas: {e}")

print()
print("=== FIM DO DIAGNÓSTICO ===")
