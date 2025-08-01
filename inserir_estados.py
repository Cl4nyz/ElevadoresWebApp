#!/usr/bin/env python3
import sys
import os

# Adicionar o diretório atual ao path para importar postgre
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from postgre import create_pg_connection, end_pg_connection
    
    def inserir_estados():
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        estados = [
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
        ]
        
        try:
            # Verificar estados existentes
            cursor.execute("SELECT sigla FROM estado")
            estados_existentes = {row[0] for row in cursor.fetchall()}
            
            print(f"📊 Estados já cadastrados: {len(estados_existentes)}")
            if estados_existentes:
                print(f"   Existentes: {sorted(estados_existentes)}")
            
            # Inserir apenas os estados que não existem
            estados_inseridos = 0
            for sigla, nome in estados:
                if sigla not in estados_existentes:
                    cursor.execute(
                        "INSERT INTO estado (sigla, nome) VALUES (%s, %s)",
                        (sigla, nome)
                    )
                    estados_inseridos += 1
                    print(f"✅ Inserido: {sigla} - {nome}")
            
            if estados_inseridos == 0:
                print("ℹ️  Todos os estados já estão cadastrados!")
            else:
                conn.commit()
                print(f"\n🎉 {estados_inseridos} novos estados inseridos com sucesso!")
            
            # Verificar se PE foi inserido/existe
            cursor.execute("SELECT nome FROM estado WHERE sigla = 'PE'")
            pe_result = cursor.fetchone()
            if pe_result:
                print(f"✅ PE (Pernambuco) está disponível: {pe_result[0]}")
            else:
                print("❌ PE ainda não está disponível")
            
            # Mostrar total final
            cursor.execute("SELECT COUNT(*) FROM estado")
            total = cursor.fetchone()[0]
            print(f"📈 Total de estados no banco: {total}")
                
            return True
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Erro ao inserir estados: {e}")
            return False
        finally:
            cursor.close()
            end_pg_connection(conn)
    
    if __name__ == "__main__":
        print("🏛️  Inserindo estados brasileiros...")
        print("=" * 50)
        inserir_estados()
        print("=" * 50)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("   Certifique-se de que o arquivo postgre.py está no mesmo diretório")
