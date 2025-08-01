#!/usr/bin/env python3
import sys
import os

# Adicionar o diretório atual ao path para importar postgre
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from postgre import create_pg_connection, end_pg_connection
    
    def verificar_sequences_e_orfaos():
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        try:
            print("🔍 Verificando sequences e dados órfãos...")
            print("=" * 60)
            
            # Verificar sequence atual da tabela elevador
            try:
                # Primeiro, verificar se a sequence existe e foi usada
                cursor.execute("""
                    SELECT last_value, is_called 
                    FROM elevador_id_seq
                """)
                seq_info = cursor.fetchone()
                if seq_info:
                    last_value, is_called = seq_info
                    if is_called:
                        current_sequence = last_value
                        print(f"📊 Sequence atual de elevador.id: {current_sequence}")
                    else:
                        current_sequence = 0
                        print(f"📊 Sequence de elevador.id ainda não foi usada (próximo valor: {last_value})")
                else:
                    current_sequence = 0
                    print("📊 Sequence de elevador.id não encontrada")
            except Exception as e:
                current_sequence = 0
                print(f"📊 Sequence de elevador.id ainda não foi inicializada: {e}")
            
            # Verificar o maior ID na tabela elevador
            cursor.execute("SELECT COALESCE(MAX(id), 0) FROM elevador")
            max_elevador_id = cursor.fetchone()[0]
            print(f"📊 Maior ID na tabela elevador: {max_elevador_id}")
            
            # Verificar dados órfãos em cabine
            cursor.execute("""
                SELECT c.id_elevador FROM cabine c 
                LEFT JOIN elevador e ON c.id_elevador = e.id 
                WHERE e.id IS NULL
            """)
            orfaos_cabine = [row[0] for row in cursor.fetchall()]
            if orfaos_cabine:
                print(f"⚠️  Dados órfãos em cabine: {orfaos_cabine}")
            else:
                print("✅ Sem dados órfãos em cabine")
            
            # Verificar dados órfãos em coluna
            cursor.execute("""
                SELECT c.id_elevador FROM coluna c 
                LEFT JOIN elevador e ON c.id_elevador = e.id 
                WHERE e.id IS NULL
            """)
            orfaos_coluna = [row[0] for row in cursor.fetchall()]
            if orfaos_coluna:
                print(f"⚠️  Dados órfãos em coluna: {orfaos_coluna}")
            else:
                print("✅ Sem dados órfãos em coluna")
            
            # Verificar dados órfãos em adicionais
            cursor.execute("""
                SELECT a.id_elevador FROM adicionais a 
                LEFT JOIN elevador e ON a.id_elevador = e.id 
                WHERE e.id IS NULL
            """)
            orfaos_adicionais = [row[0] for row in cursor.fetchall()]
            if orfaos_adicionais:
                print(f"⚠️  Dados órfãos em adicionais: {orfaos_adicionais}")
            else:
                print("✅ Sem dados órfãos em adicionais")
            
            # Contar total de registros em cada tabela
            cursor.execute("SELECT COUNT(*) FROM elevador")
            total_elevadores = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM cabine")
            total_cabines = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM coluna")
            total_colunas = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM adicionais")
            total_adicionais = cursor.fetchone()[0]
            
            print(f"\n📈 Totais por tabela:")
            print(f"   Elevadores: {total_elevadores}")
            print(f"   Cabines: {total_cabines}")
            print(f"   Colunas: {total_colunas}")
            print(f"   Adicionais: {total_adicionais}")
            
            # Identificar problemas
            problemas = []
            if orfaos_cabine:
                problemas.append(f"Cabines órfãos: {orfaos_cabine}")
            if orfaos_coluna:
                problemas.append(f"Colunas órfãs: {orfaos_coluna}")
            if orfaos_adicionais:
                problemas.append(f"Adicionais órfãos: {orfaos_adicionais}")
            if total_cabines > total_elevadores:
                problemas.append(f"Mais cabines ({total_cabines}) que elevadores ({total_elevadores})")
            if total_colunas > total_elevadores:
                problemas.append(f"Mais colunas ({total_colunas}) que elevadores ({total_elevadores})")
            if total_adicionais > total_elevadores:
                problemas.append(f"Mais adicionais ({total_adicionais}) que elevadores ({total_elevadores})")
            
            if problemas:
                print(f"\n⚠️  Problemas identificados:")
                for problema in problemas:
                    print(f"   - {problema}")
                return orfaos_cabine + orfaos_coluna + orfaos_adicionais
            else:
                print(f"\n✅ Estrutura de dados consistente!")
                return []
                
        except Exception as e:
            print(f"❌ Erro na verificação: {e}")
            return False
        finally:
            cursor.close()
            end_pg_connection(conn)
    
    def limpar_dados_orfaos(ids_orfaos):
        if not ids_orfaos:
            return True
            
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        try:
            print(f"\n🧹 Limpando dados órfãos: {list(set(ids_orfaos))}")
            
            ids_unicos = list(set(ids_orfaos))
            
            for id_orfao in ids_unicos:
                # Remover dados órfãos
                cursor.execute("DELETE FROM cabine WHERE id_elevador = %s", (id_orfao,))
                cabines_removidas = cursor.rowcount
                
                cursor.execute("DELETE FROM coluna WHERE id_elevador = %s", (id_orfao,))
                colunas_removidas = cursor.rowcount
                
                cursor.execute("DELETE FROM adicionais WHERE id_elevador = %s", (id_orfao,))
                adicionais_removidos = cursor.rowcount
                
                if cabines_removidas or colunas_removidas or adicionais_removidos:
                    print(f"🗑️  ID {id_orfao}: cabines={cabines_removidas}, colunas={colunas_removidas}, adicionais={adicionais_removidos}")
            
            # Resetar sequence se necessário
            cursor.execute("SELECT COALESCE(MAX(id), 0) FROM elevador")
            max_id = cursor.fetchone()[0]
            
            if max_id > 0:
                cursor.execute(f"SELECT setval(pg_get_serial_sequence('elevador', 'id'), {max_id})")
                print(f"🔄 Sequence resetada para {max_id}")
            else:
                cursor.execute("SELECT setval(pg_get_serial_sequence('elevador', 'id'), 1, false)")
                print("🔄 Sequence resetada para começar em 1")
            
            conn.commit()
            print("✅ Limpeza concluída com sucesso!")
            return True
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Erro na limpeza: {e}")
            return False
        finally:
            cursor.close()
            end_pg_connection(conn)
    
    if __name__ == "__main__":
        print("🔧 Verificação de Consistência de Dados")
        print("=" * 60)
        
        ids_problematicos = verificar_sequences_e_orfaos()
        
        if ids_problematicos:
            print("\n" + "=" * 60)
            resposta = input("Deseja limpar os dados órfãos? (s/N): ").lower()
            if resposta in ['s', 'sim', 'y', 'yes']:
                limpar_dados_orfaos(ids_problematicos)
                print("\n🔄 Executando verificação novamente...")
                verificar_sequences_e_orfaos()
        
        print("=" * 60)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("   Certifique-se de que o arquivo postgre.py está no mesmo diretório")
