#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import postgre

def verificar_dados():
    """Verifica os dados na base de dados"""
    conn = postgre.create_pg_connection()
    if not conn:
        print("Erro ao conectar com o banco de dados")
        return
    
    cursor = conn.cursor()
    try:
        # Verificar elevadores
        cursor.execute('SELECT COUNT(*) FROM elevador')
        print(f'Elevadores: {cursor.fetchone()[0]}')
        
        # Verificar contratos disponíveis
        cursor.execute('SELECT c.id, c.data_venda, cl.nome FROM contrato c LEFT JOIN cliente cl ON c.id_cliente = cl.id LIMIT 5')
        print('Contratos disponíveis:')
        for row in cursor.fetchall():
            print(f'  ID: {row[0]}, Data: {row[1]}, Cliente: {row[2]}')
        
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        cursor.close()
        postgre.end_pg_connection(conn)

if __name__ == '__main__':
    verificar_dados()
