#!/usr/bin/env python3
import sys
import os

# Adicionar o diretório atual ao path para importar postgre
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from postgre import create_pg_connection, end_pg_connection
    
    def testar_endereco_pe():
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        try:
            # Dados de teste para um endereço em Pernambuco
            dados_teste = {
                'logradouro': 'Rua das Flores, 123',
                'bairro': 'Boa Viagem',
                'cidade': 'Recife',
                'estado': 'PE',
                'cep': '51020-000'
            }
            
            print("🧪 Testando inserção de endereço com estado PE...")
            print(f"   Dados: {dados_teste}")
            
            # Tentar inserir o endereço
            cursor.execute("""
                INSERT INTO endereco (logradouro, bairro, cidade, estado, cep) 
                VALUES (%s, %s, %s, %s, %s) 
                RETURNING id
            """, (
                dados_teste['logradouro'],
                dados_teste['bairro'], 
                dados_teste['cidade'],
                dados_teste['estado'],
                dados_teste['cep']
            ))
            
            endereco_id = cursor.fetchone()[0]
            conn.commit()
            
            print(f"✅ Endereço inserido com sucesso! ID: {endereco_id}")
            
            # Verificar se foi inserido corretamente
            cursor.execute("""
                SELECT e.*, est.nome as estado_nome 
                FROM endereco e 
                JOIN estado est ON e.estado = est.sigla 
                WHERE e.id = %s
            """, (endereco_id,))
            
            resultado = cursor.fetchone()
            if resultado:
                print(f"📍 Endereço verificado:")
                print(f"   ID: {resultado[0]}")
                print(f"   Logradouro: {resultado[1]}")
                print(f"   Bairro: {resultado[2]}")
                print(f"   Cidade: {resultado[3]}")
                print(f"   Estado: {resultado[4]} ({resultado[6]})")
                print(f"   CEP: {resultado[5]}")
            
            # Limpar dados de teste
            cursor.execute("DELETE FROM endereco WHERE id = %s", (endereco_id,))
            conn.commit()
            print("🧹 Dados de teste removidos")
            
            return True
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Erro ao testar endereço: {e}")
            return False
        finally:
            cursor.close()
            end_pg_connection(conn)
    
    if __name__ == "__main__":
        print("🏠 Testando inserção de endereço com estado PE...")
        print("=" * 50)
        testar_endereco_pe()
        print("=" * 50)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("   Certifique-se de que o arquivo postgre.py está no mesmo diretório")
