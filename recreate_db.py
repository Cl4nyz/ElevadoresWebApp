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
        
        # Limpar dados residuais que possam estar causando conflito
        print("🧹 Limpando dados residuais...")
        cursor.execute("DELETE FROM adicionais")
        cursor.execute("DELETE FROM coluna")
        cursor.execute("DELETE FROM cabine") 
        cursor.execute("DELETE FROM elevador")
        cursor.execute("DELETE FROM contrato")
        cursor.execute("DELETE FROM endereco")
        cursor.execute("DELETE FROM cliente")
        
        # Clientes
        cursor.execute("""
            INSERT INTO cliente (nome, email, comercial, documento) VALUES
            ('João Silva Santos', 'joao.silva@email.com', false, '12345678901'),
            ('Maria Oliveira Costa', 'maria.oliveira@email.com', false, '98765432100'),
            ('Pedro Henrique Lima', 'pedro.lima@email.com', false, '11111111111'),
            ('Ana Carolina Souza', 'ana.souza@email.com', false, '22222222222'),
            ('Empresa ABC Ltda', 'contato@empresaabc.com.br', true, '12345678000195'),
            ('Construtora XYZ S.A.', 'vendas@construtoraXYZ.com.br', true, '98765432000187');
        """)
        
        # Endereços
        cursor.execute("""
            INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) VALUES
            ((SELECT id FROM cliente WHERE nome = 'João Silva Santos'), 'Rua das Flores', 123, 'São Paulo', 'SP', 'Apto 101', '01234567'),
            ((SELECT id FROM cliente WHERE nome = 'João Silva Santos'), 'Av. Paulista', 456, 'São Paulo', 'SP', 'Escritório', '01310100'),
            ((SELECT id FROM cliente WHERE nome = 'Maria Oliveira Costa'), 'Av. Brasil', 789, 'Rio de Janeiro', 'RJ', NULL, '76543210'),
            ((SELECT id FROM cliente WHERE nome = 'Pedro Henrique Lima'), 'Rua Central', 321, 'Belo Horizonte', 'MG', 'Sala 201', '12345678'),
            ((SELECT id FROM cliente WHERE nome = 'Ana Carolina Souza'), 'Av. Atlântica', 654, 'Rio de Janeiro', 'RJ', 'Cobertura', '87654321'),
            ((SELECT id FROM cliente WHERE nome = 'Empresa ABC Ltda'), 'Av. Industrial', 1000, 'São Paulo', 'SP', 'Galpão 5', '04567890'),
            ((SELECT id FROM cliente WHERE nome = 'Construtora XYZ S.A.'), 'Rua Comercial', 250, 'Belo Horizonte', 'MG', 'Andar 10', '30112000');
        """)
        
        # Contratos
        cursor.execute("""
            INSERT INTO contrato (data_venda, data_entrega, id_cliente, vendedor) VALUES
            ('2024-01-15', '2024-12-15', (SELECT id FROM cliente WHERE nome = 'João Silva Santos'), 'Deuclides'),
            ('2024-02-20', '2024-11-20', (SELECT id FROM cliente WHERE nome = 'Maria Oliveira Costa'), 'Leandro'),
            ('2024-03-10', '2025-01-10', (SELECT id FROM cliente WHERE nome = 'Pedro Henrique Lima'), 'Jean'),
            ('2024-04-05', '2025-02-05', (SELECT id FROM cliente WHERE nome = 'Ana Carolina Souza'), 'Deuclides'),
            ('2024-05-01', '2024-10-01', (SELECT id FROM cliente WHERE nome = 'João Silva Santos'), 'Leandro'),
            ('2024-06-15', '2025-03-15', (SELECT id FROM cliente WHERE nome = 'TechCorp Soluções Ltda'), 'Jean'),
            ('2024-07-01', '2025-04-01', (SELECT id FROM cliente WHERE nome = 'Construtora Alpha S.A.'), 'Deuclides'),
            ('2024-08-10', '2025-05-10', (SELECT id FROM cliente WHERE nome = 'Edifício Central EIRELI'), 'Leandro'),
            ('2024-09-05', '2025-06-05', (SELECT id FROM cliente WHERE nome = 'Shopping Plaza Ltda'), 'Jean'),
            ('2024-10-20', '2025-07-20', (SELECT id FROM cliente WHERE nome = 'Hospital São José S.A.'), 'Deuclides');
        """)
        
        # Elevadores com nova estrutura
        elevadores_data = [
            {
                'id_contrato': 1,
                'comando': 'Automático',
                'observacao': 'Elevador residencial padrão',
                'porta_inferior': 'Direita',
                'porta_superior': 'Direita',
                'cor': 'Azul',
                'status': 'Em produção',
                'cabine': {'altura': 220, 'largura': 100, 'profundidade': 120, 'piso': 'Cerâmico'},
                'coluna': {'elevacao': 3000},
                'adicionais': {'cancela': 1, 'porta': 2}
            },
            {
                'id_contrato': 2,
                'comando': 'Pressão constante',
                'observacao': 'Elevador comercial',
                'porta_inferior': 'Esquerda',
                'porta_superior': 'Esquerda',
                'cor': 'Vermelho',
                'status': 'Pronto',
                'cabine': {'altura': 250, 'largura': 110, 'profundidade': 130, 'piso': 'Granito'},
                'coluna': {'elevacao': 3500},
                'adicionais': {'cancela': 0, 'porta': 1, 'barreira_eletronica': 1}
            },
            {
                'id_contrato': 3,
                'comando': 'Automático',
                'observacao': 'Elevador industrial',
                'porta_inferior': 'Direita',
                'porta_superior': 'Direita',
                'cor': 'Verde',
                'status': 'Não iniciado',
                'cabine': {'altura': 280, 'largura': 120, 'profundidade': 140, 'piso': 'Aço'},
                'coluna': {'elevacao': 4000},
                'adicionais': {'cancela': 2, 'porta': 1, 'galvanizada': True}
            },
            {
                'id_contrato': 6,
                'comando': 'Automático',
                'observacao': 'Elevador corporativo TechCorp',
                'porta_inferior': 'Centro',
                'porta_superior': 'Centro',
                'cor': 'Preto',
                'status': 'Em produção',
                'cabine': {'altura': 240, 'largura': 130, 'profundidade': 150, 'piso': 'Mármore'},
                'coluna': {'elevacao': 5000},
                'adicionais': {'cancela': 1, 'porta': 2, 'barreira_eletronica': 1}
            },
            {
                'id_contrato': 7,
                'comando': 'Pressão constante',
                'observacao': 'Elevador de carga Construtora Alpha',
                'porta_inferior': 'Direita',
                'porta_superior': 'Direita',
                'cor': 'Amarelo',
                'status': 'Não iniciado',
                'cabine': {'altura': 300, 'largura': 140, 'profundidade': 160, 'piso': 'Aço'},
                'coluna': {'elevacao': 6000},
                'adicionais': {'cancela': 2, 'porta': 1, 'galvanizada': True}
            },
            {
                'id_contrato': 8,
                'comando': 'Automático',
                'observacao': 'Elevador residencial Edifício Central',
                'porta_inferior': 'Esquerda',
                'porta_superior': 'Esquerda',
                'cor': 'Branco',
                'status': 'Em produção',
                'cabine': {'altura': 230, 'largura': 105, 'profundidade': 125, 'piso': 'Laminado'},
                'coluna': {'elevacao': 4500},
                'adicionais': {'cancela': 1, 'porta': 2}
            }
        ]
        
        for elev_data in elevadores_data:
            # Inserir elevador principal
            cursor.execute("""
                INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor, status) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (elev_data['id_contrato'], elev_data['comando'], elev_data['observacao'], 
                  elev_data['porta_inferior'], elev_data['porta_superior'], elev_data['cor'], elev_data['status']))
            
            elevador_id = cursor.fetchone()[0]
            
            # Inserir dados da cabine
            cabine = elev_data['cabine']
            cursor.execute("""
                INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (elevador_id, cabine['altura'], cabine['largura'], cabine['profundidade'], 
                  cabine['piso'], False, None, None))
            
            # Inserir dados da coluna
            coluna = elev_data['coluna']
            cursor.execute("""
                INSERT INTO coluna (id_elevador, elevacao, montada)
                VALUES (%s, %s, %s)
            """, (elevador_id, coluna['elevacao'], False))
            
            # Inserir adicionais
            adicionais = elev_data['adicionais']
            cursor.execute("""
                INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica,
                                      lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (elevador_id, 
                  adicionais.get('cancela', 0),
                  adicionais.get('porta', 0),
                  adicionais.get('portao', 0),
                  adicionais.get('barreira_eletronica', 0),
                  adicionais.get('lados_enclausuramento', 0),
                  adicionais.get('sensor_esmagamento', 0),
                  adicionais.get('rampa_acesso', 0),
                  adicionais.get('nobreak', 0),
                  adicionais.get('galvanizada', False)))
        
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
