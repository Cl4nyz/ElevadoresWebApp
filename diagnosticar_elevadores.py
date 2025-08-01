#!/usr/bin/env python3
import sys
import os

# Adicionar o diretório atual ao path para importar postgre
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from postgre import create_pg_connection, end_pg_connection
    
    def diagnosticar_duplicatas():
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        try:
            print("🔍 Diagnosticando possíveis duplicatas...")
            print("=" * 60)
            
            # Verificar elevadores órfãos (sem dados relacionados)
            cursor.execute("""
                SELECT e.id, e.comando, e.status,
                       (SELECT COUNT(*) FROM cabine WHERE id_elevador = e.id) as tem_cabine,
                       (SELECT COUNT(*) FROM coluna WHERE id_elevador = e.id) as tem_coluna,
                       (SELECT COUNT(*) FROM adicionais WHERE id_elevador = e.id) as tem_adicionais
                FROM elevador e
                ORDER BY e.id
            """)
            
            elevadores = cursor.fetchall()
            print(f"📊 Total de elevadores: {len(elevadores)}")
            print()
            
            elevadores_incompletos = []
            elevadores_completos = []
            
            for elev in elevadores:
                id_elev, comando, status, tem_cabine, tem_coluna, tem_adicionais = elev
                print(f"🏗️  Elevador ID {id_elev}:")
                print(f"   Comando: {comando}")
                print(f"   Status: {status}")
                print(f"   Cabine: {'✅' if tem_cabine else '❌'}")
                print(f"   Coluna: {'✅' if tem_coluna else '❌'}")
                print(f"   Adicionais: {'✅' if tem_adicionais else '❌'}")
                
                if tem_cabine and tem_coluna and tem_adicionais:
                    elevadores_completos.append(id_elev)
                    print(f"   Status: ✅ COMPLETO")
                else:
                    elevadores_incompletos.append(id_elev)
                    print(f"   Status: ⚠️  INCOMPLETO")
                print()
            
            print("=" * 60)
            print(f"📈 Resumo:")
            print(f"   Elevadores completos: {len(elevadores_completos)}")
            print(f"   Elevadores incompletos: {len(elevadores_incompletos)}")
            
            if elevadores_incompletos:
                print(f"   IDs incompletos: {elevadores_incompletos}")
                print()
                print("🔧 Opções de correção:")
                print("   1. Completar dados faltantes")
                print("   2. Remover elevadores incompletos")
                print("   3. Recriar dados relacionados")
            
            # Verificar possíveis conflitos de chave primária
            print("\n🔍 Verificando possíveis conflitos...")
            
            # Verificar duplicatas em cabine
            cursor.execute("SELECT id_elevador, COUNT(*) FROM cabine GROUP BY id_elevador HAVING COUNT(*) > 1")
            duplicatas_cabine = cursor.fetchall()
            if duplicatas_cabine:
                print(f"❌ Duplicatas em cabine: {duplicatas_cabine}")
            else:
                print("✅ Sem duplicatas em cabine")
            
            # Verificar duplicatas em coluna
            cursor.execute("SELECT id_elevador, COUNT(*) FROM coluna GROUP BY id_elevador HAVING COUNT(*) > 1")
            duplicatas_coluna = cursor.fetchall()
            if duplicatas_coluna:
                print(f"❌ Duplicatas em coluna: {duplicatas_coluna}")
            else:
                print("✅ Sem duplicatas em coluna")
            
            # Verificar duplicatas em adicionais
            cursor.execute("SELECT id_elevador, COUNT(*) FROM adicionais GROUP BY id_elevador HAVING COUNT(*) > 1")
            duplicatas_adicionais = cursor.fetchall()
            if duplicatas_adicionais:
                print(f"❌ Duplicatas em adicionais: {duplicatas_adicionais}")
            else:
                print("✅ Sem duplicatas em adicionais")
                
            return True
            
        except Exception as e:
            print(f"❌ Erro no diagnóstico: {e}")
            return False
        finally:
            cursor.close()
            end_pg_connection(conn)
    
    def limpar_elevadores_incompletos():
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro na conexão com o banco")
            return False
            
        cursor = conn.cursor()
        
        try:
            print("🧹 Limpando elevadores incompletos...")
            
            # Encontrar elevadores sem dados relacionados completos
            cursor.execute("""
                SELECT e.id 
                FROM elevador e
                LEFT JOIN cabine c ON e.id = c.id_elevador
                LEFT JOIN coluna col ON e.id = col.id_elevador
                LEFT JOIN adicionais a ON e.id = a.id_elevador
                WHERE c.id_elevador IS NULL OR col.id_elevador IS NULL OR a.id_elevador IS NULL
            """)
            
            elevadores_incompletos = [row[0] for row in cursor.fetchall()]
            
            if not elevadores_incompletos:
                print("✅ Não há elevadores incompletos para limpar")
                return True
            
            print(f"🗑️  Removendo {len(elevadores_incompletos)} elevadores incompletos: {elevadores_incompletos}")
            
            for elev_id in elevadores_incompletos:
                # Remover dados relacionados primeiro (se existirem)
                cursor.execute("DELETE FROM cabine WHERE id_elevador = %s", (elev_id,))
                cursor.execute("DELETE FROM coluna WHERE id_elevador = %s", (elev_id,))
                cursor.execute("DELETE FROM adicionais WHERE id_elevador = %s", (elev_id,))
                
                # Remover o elevador
                cursor.execute("DELETE FROM elevador WHERE id = %s", (elev_id,))
                print(f"🗑️  Removido elevador ID {elev_id}")
            
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
        print("🔧 Diagnóstico de Elevadores")
        print("=" * 60)
        
        if diagnosticar_duplicatas():
            print("\n" + "=" * 60)
            resposta = input("Deseja limpar elevadores incompletos? (s/N): ").lower()
            if resposta in ['s', 'sim', 'y', 'yes']:
                limpar_elevadores_incompletos()
        
        print("=" * 60)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("   Certifique-se de que o arquivo postgre.py está no mesmo diretório")
