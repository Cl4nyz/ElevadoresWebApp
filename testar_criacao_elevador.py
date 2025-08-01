#!/usr/bin/env python3
import sys
import os
import json

# Adicionar o diretório atual ao path para importar postgre
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from postgre import create_pg_connection, end_pg_connection
    
    def testar_criacao_elevador():
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        try:
            # Primeiro, verificar se existe pelo menos um contrato
            cursor.execute("SELECT id FROM contrato LIMIT 1")
            contrato = cursor.fetchone()
            
            if not contrato:
                print("⚠️  Não há contratos cadastrados. Criando um contrato de teste...")
                # Criar um contrato de teste
                cursor.execute("""
                    INSERT INTO contrato (numero, descricao, valor, data_inicio, status) 
                    VALUES ('TEST-001', 'Contrato de Teste', 1000.00, CURRENT_DATE, 'Ativo') 
                    RETURNING id
                """)
                contrato_id = cursor.fetchone()[0]
                print(f"✅ Contrato de teste criado com ID: {contrato_id}")
            else:
                contrato_id = contrato[0]
                print(f"✅ Usando contrato existente ID: {contrato_id}")
            
            # Dados de teste para o elevador
            dados_elevador = {
                'id_contrato': contrato_id,
                'comando': 'CMD-001',
                'observacao': 'Elevador de teste',
                'porta_inferior': 'Tipo A',
                'porta_superior': 'Tipo B',
                'cor': 'Branco',
                'status': 'Planejado',
                'cabine': {
                    'altura': 220,
                    'largura': 100,
                    'profundidade': 140,
                    'piso': 'Granito',
                    'montada': False,
                    'lado_entrada': 'Frente',
                    'lado_saida': 'Frente'
                },
                'coluna': {
                    'elevacao': 300,
                    'montada': False
                },
                'adicionais': {
                    'cancela': 1,
                    'porta': 2,
                    'portao': 0,
                    'barreira_eletronica': 1,
                    'lados_enclausuramento': 4,
                    'sensor_esmagamento': 1,
                    'rampa_acesso': 0,
                    'nobreak': 1,
                    'galvanizada': True
                }
            }
            
            print("\n🏗️  Testando criação de elevador...")
            print(f"📋 Dados: {json.dumps(dados_elevador, indent=2, ensure_ascii=False)}")
            
            # Simular a lógica do app.py
            print("\n🔄 Executando inserção principal...")
            cursor.execute("""
                INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor, status) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                dados_elevador['id_contrato'],
                dados_elevador['comando'],
                dados_elevador['observacao'],
                dados_elevador['porta_inferior'],
                dados_elevador['porta_superior'],
                dados_elevador['cor'],
                dados_elevador['status']
            ))
            
            elevador_id = cursor.fetchone()[0]
            print(f"✅ Elevador criado com ID: {elevador_id}")
            
            # Inserir cabine
            print("🔄 Inserindo dados da cabine...")
            cabine = dados_elevador['cabine']
            cursor.execute("""
                INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                elevador_id,
                cabine['altura'],
                cabine['largura'],
                cabine['profundidade'],
                cabine['piso'],
                cabine['montada'],
                cabine['lado_entrada'],
                cabine['lado_saida']
            ))
            print("✅ Cabine inserida")
            
            # Inserir coluna
            print("🔄 Inserindo dados da coluna...")
            coluna = dados_elevador['coluna']
            cursor.execute("""
                INSERT INTO coluna (id_elevador, elevacao, montada)
                VALUES (%s, %s, %s)
            """, (
                elevador_id,
                coluna['elevacao'],
                coluna['montada']
            ))
            print("✅ Coluna inserida")
            
            # Inserir adicionais
            print("🔄 Inserindo adicionais...")
            adicionais = dados_elevador['adicionais']
            cursor.execute("""
                INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica,
                                      lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                elevador_id,
                adicionais['cancela'],
                adicionais['porta'],
                adicionais['portao'],
                adicionais['barreira_eletronica'],
                adicionais['lados_enclausuramento'],
                adicionais['sensor_esmagamento'],
                adicionais['rampa_acesso'],
                adicionais['nobreak'],
                adicionais['galvanizada']
            ))
            print("✅ Adicionais inseridos")
            
            # Verificar dados inseridos
            print("\n🔍 Verificando dados inseridos...")
            cursor.execute("""
                SELECT e.*, c.altura, c.largura, c.profundidade, col.elevacao, a.cancela
                FROM elevador e
                LEFT JOIN cabine c ON e.id = c.id_elevador
                LEFT JOIN coluna col ON e.id = col.id_elevador
                LEFT JOIN adicionais a ON e.id = a.id_elevador
                WHERE e.id = %s
            """, (elevador_id,))
            
            resultado = cursor.fetchone()
            if resultado:
                print(f"📊 Elevador verificado:")
                print(f"   ID: {resultado[0]}")
                print(f"   Contrato: {resultado[1]}")
                print(f"   Comando: {resultado[2]}")
                print(f"   Status: {resultado[7]}")
                print(f"   Cabine: {resultado[8]}x{resultado[9]}x{resultado[10]}")
                print(f"   Elevação: {resultado[11]}")
                print(f"   Cancelas: {resultado[12]}")
            
            conn.commit()
            print(f"\n🎉 Teste concluído com sucesso! Elevador ID {elevador_id} criado completamente.")
            
            # Testar criação de um segundo elevador
            print("\n🔄 Testando criação de segundo elevador...")
            dados_elevador['comando'] = 'CMD-002'
            dados_elevador['observacao'] = 'Segundo elevador de teste'
            
            cursor.execute("""
                INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor, status) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                dados_elevador['id_contrato'],
                dados_elevador['comando'],
                dados_elevador['observacao'],
                dados_elevador['porta_inferior'],
                dados_elevador['porta_superior'],
                dados_elevador['cor'],
                dados_elevador['status']
            ))
            
            elevador_id_2 = cursor.fetchone()[0]
            print(f"✅ Segundo elevador criado com ID: {elevador_id_2}")
            
            # Inserir dados do segundo elevador
            cursor.execute("""
                INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (elevador_id_2, 200, 110, 130, 'Cerâmica', False, 'Lateral', 'Lateral'))
            
            cursor.execute("""
                INSERT INTO coluna (id_elevador, elevacao, montada)
                VALUES (%s, %s, %s)
            """, (elevador_id_2, 250, False))
            
            cursor.execute("""
                INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica,
                                      lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (elevador_id_2, 2, 1, 1, 0, 3, 1, 1, 0, False))
            
            conn.commit()
            print(f"✅ Segundo elevador completo! ID: {elevador_id_2}")
            
            print(f"\n🎉 Teste completo bem-sucedido! Criados elevadores IDs: {elevador_id} e {elevador_id_2}")
            return True
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Erro no teste: {e}")
            return False
        finally:
            cursor.close()
            end_pg_connection(conn)
    
    if __name__ == "__main__":
        print("🧪 Teste de Criação de Elevador")
        print("=" * 60)
        testar_criacao_elevador()
        print("=" * 60)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("   Certifique-se de que o arquivo postgre.py está no mesmo diretório")
