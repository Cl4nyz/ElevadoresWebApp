#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import postgre

def inserir_dados_exemplo():
    """Insere alguns dados de exemplo para testar o sistema"""
    conn = postgre.create_pg_connection(True)
    if not conn:
        print("Erro ao conectar com o banco de dados")
        return
    
    cursor = conn.cursor()
    try:
        # Inserir elevadores
        cursor.execute("""
            INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor) VALUES
            (1, 'Manual', 'Elevador residencial', 'Simples', 'Simples', 'Azul'),
            (2, 'Automatico', 'Elevador comercial', 'Dupla', 'Dupla', 'Vermelho')
        """)

        # Inserir dados das cabines
        cursor.execute("""
            INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida) VALUES
            (1, 2200, 1000, 1200, 'Ceramico', true, 'Frente', 'Frente'),
            (2, 2400, 1200, 1400, 'Granito', true, 'Frente', 'Tras')
        """)

        # Inserir dados das colunas
        cursor.execute("""
            INSERT INTO coluna (id_elevador, elevacao, montada) VALUES
            (1, 3000, true),
            (2, 3500, true)
        """)

        # Inserir dados dos adicionais
        cursor.execute("""
            INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica, lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada) VALUES
            (1, 1, 0, 0, 1, 2, 1, 0, 0, false),
            (2, 2, 1, 0, 2, 4, 2, 1, 1, true)
        """)

        conn.commit()
        print("Dados de exemplo inseridos com sucesso!")
        
    except Exception as e:
        conn.rollback()
        print(f"Erro ao inserir dados: {e}")
    finally:
        cursor.close()
        postgre.end_pg_connection(conn)

if __name__ == '__main__':
    inserir_dados_exemplo()
