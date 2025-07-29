#!/usr/bin/env python3
"""
Script para recriar o banco de dados com as correções
"""

from postgre import create_pg_connection, drop_all_tables, create_tables, insert_initial_data, end_pg_connection

def recriar_banco():
    """Recria o banco de dados com as correções"""
    print("🔄 Recriando banco de dados...")
    
    try:
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
        
        print("🗑️ Removendo tabelas existentes...")
        drop_all_tables(conn)
        
        print("🏗️ Criando novas tabelas...")
        create_tables(conn)
        
        print("📋 Inserindo dados iniciais (estados e cabines)...")
        insert_initial_data(conn)
        
        conn.commit()
        print("✅ Banco recriado com sucesso!")
        
        # Perguntar se quer adicionar dados de exemplo
        resposta = input("\n📊 Deseja adicionar dados de exemplo? [S/n]: ")
        if resposta.lower() not in ['n', 'no', 'não']:
            adicionar_dados_exemplo(conn)
        
        end_pg_connection(conn)
        return True
        
    except Exception as e:
        print(f"❌ Erro ao recriar banco: {e}")
        return False

def adicionar_dados_exemplo(conn):
    """Adiciona dados de exemplo"""
    cursor = conn.cursor()
    
    try:
        print("📝 Adicionando dados de exemplo...")
        
        # Clientes
        cursor.execute("""
            INSERT INTO cliente (nome, cpf) VALUES
            ('João Silva Santos', '12345678901'),
            ('Maria Oliveira Costa', '98765432100'),
            ('Pedro Henrique Lima', '11111111111'),
            ('Ana Carolina Souza', '22222222222');
        """)
        
        # Endereços
        cursor.execute("""
            INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) VALUES
            ((SELECT id FROM cliente WHERE nome = 'João Silva Santos'), 'Rua das Flores', 123, 'São Paulo', 'SP', 'Apto 101', '01234567'),
            ((SELECT id FROM cliente WHERE nome = 'João Silva Santos'), 'Av. Paulista', 456, 'São Paulo', 'SP', 'Escritório', '01310100'),
            ((SELECT id FROM cliente WHERE nome = 'Maria Oliveira Costa'), 'Av. Brasil', 789, 'Rio de Janeiro', 'RJ', NULL, '76543210'),
            ((SELECT id FROM cliente WHERE nome = 'Pedro Henrique Lima'), 'Rua Central', 321, 'Belo Horizonte', 'MG', 'Sala 201', '12345678'),
            ((SELECT id FROM cliente WHERE nome = 'Ana Carolina Souza'), 'Av. Atlântica', 654, 'Rio de Janeiro', 'RJ', 'Cobertura', '87654321');
        """)
        
        # Contratos
        cursor.execute("""
            INSERT INTO contrato (data_venda, data_entrega, id_cliente) VALUES
            ('2024-01-15', '2024-12-15', (SELECT id FROM cliente WHERE nome = 'João Silva Santos')),
            ('2024-02-20', '2024-11-20', (SELECT id FROM cliente WHERE nome = 'Maria Oliveira Costa')),
            ('2024-03-10', '2025-01-10', (SELECT id FROM cliente WHERE nome = 'Pedro Henrique Lima')),
            ('2024-04-05', '2025-02-05', (SELECT id FROM cliente WHERE nome = 'Ana Carolina Souza')),
            ('2024-05-01', '2024-10-01', (SELECT id FROM cliente WHERE nome = 'João Silva Santos'));
        """)
        
        # Elevadores
        cursor.execute("""
            INSERT INTO elevador (id_contrato, id_cabine, elevacao, cor) VALUES
            ((SELECT MIN(id) FROM contrato WHERE id_cliente = (SELECT id FROM cliente WHERE nome = 'João Silva Santos')), 
             (SELECT MIN(id) FROM cabine WHERE altura = 220), 3000, 'Azul'),
            ((SELECT MIN(id) FROM contrato WHERE id_cliente = (SELECT id FROM cliente WHERE nome = 'Maria Oliveira Costa')), 
             (SELECT MIN(id) FROM cabine WHERE altura = 250), 3500, 'Vermelho'),
            ((SELECT MIN(id) FROM contrato WHERE id_cliente = (SELECT id FROM cliente WHERE nome = 'Pedro Henrique Lima')), 
             (SELECT MIN(id) FROM cabine WHERE altura = 280), 4000, 'Verde'),
            ((SELECT MIN(id) FROM contrato WHERE id_cliente = (SELECT id FROM cliente WHERE nome = 'Ana Carolina Souza')), 
             (SELECT MIN(id) FROM cabine WHERE altura = 300), 2500, 'Amarelo'),
            ((SELECT MAX(id) FROM contrato WHERE id_cliente = (SELECT id FROM cliente WHERE nome = 'João Silva Santos')), 
             (SELECT MIN(id) FROM cabine WHERE altura = 350), 4500, 'Roxo');
        """)
        
        conn.commit()
        print("✅ Dados de exemplo adicionados!")
        
        # Mostrar estatísticas
        cursor.execute("SELECT COUNT(*) FROM cliente")
        clientes_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM endereco")
        enderecos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM cabine")
        cabines_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM contrato")
        contratos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM elevador")
        elevadores_count = cursor.fetchone()[0]
        
        print(f"\n📊 Estatísticas:")
        print(f"   👥 Clientes: {clientes_count}")
        print(f"   📍 Endereços: {enderecos_count}")
        print(f"   📦 Cabines: {cabines_count}")
        print(f"   📄 Contratos: {contratos_count}")
        print(f"   🏗️ Elevadores: {elevadores_count}")
        
    except Exception as e:
        print(f"⚠️ Erro ao adicionar dados: {e}")
        conn.rollback()
    finally:
        cursor.close()

if __name__ == "__main__":
    print("🏢 RECRIAÇÃO DO BANCO DE DADOS")
    print("="*50)
    print("⚠️  ATENÇÃO: Isso apagará todos os dados existentes!")
    
    resposta = input("\nDeseja continuar? [s/N]: ")
    if resposta.lower() in ['s', 'sim', 'y', 'yes']:
        if recriar_banco():
            print("\n🎉 Banco recriado com sucesso!")
            print("💡 Agora você pode executar: python app.py")
        else:
            print("\n❌ Falha ao recriar banco")
    else:
        print("❌ Operação cancelada")
