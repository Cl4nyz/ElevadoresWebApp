#!/usr/bin/env python3
"""
Script para adicionar a coluna status na tabela elevador e atualizar dados existentes
"""

from postgre import create_pg_connection, end_pg_connection

def update_database():
    """Adiciona coluna status e atualiza dados"""
    
    conn = create_pg_connection(verbose=True)
    if not conn:
        print("Erro: Não foi possível conectar ao banco de dados")
        return False
        
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna status já existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'elevador' AND column_name = 'status'
        """)
        
        if not cursor.fetchone():
            print('Adicionando coluna status...')
            cursor.execute('ALTER TABLE elevador ADD COLUMN status character varying(20);')
            print('✓ Coluna status adicionada com sucesso.')
        else:
            print('✓ Coluna status já existe.')
        
        # Atualizar registros existentes sem status
        cursor.execute("UPDATE elevador SET status = 'Não iniciado' WHERE status IS NULL OR status = '';")
        affected_rows = cursor.rowcount
        print(f'✓ Atualizados {affected_rows} registros com status padrão.')
        
        # Commit das alterações
        conn.commit()
        print('✓ Banco de dados atualizado com sucesso!')
        
        # Verificar a estrutura atual da tabela elevador
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'elevador' 
            ORDER BY ordinal_position
        """)
        
        print('\n📋 Estrutura atual da tabela elevador:')
        for col in cursor.fetchall():
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            print(f'   {col[0]} - {col[1]} ({nullable})')
            
        # Verificar dados dos elevadores
        cursor.execute("SELECT id, id_contrato, comando, cor, status FROM elevador ORDER BY id;")
        elevadores = cursor.fetchall()
        
        print(f'\n📊 Elevadores cadastrados ({len(elevadores)}):')
        for elev in elevadores:
            print(f'   ID: {elev[0]} | Contrato: {elev[1]} | Comando: {elev[2]} | Cor: {elev[3]} | Status: {elev[4]}')
            
        return True
        
    except Exception as e:
        print(f'❌ Erro: {e}')
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        end_pg_connection(conn, verbose=True)

if __name__ == '__main__':
    print("🔧 Atualizando estrutura do banco de dados...")
    print("=" * 50)
    
    success = update_database()
    
    print("=" * 50)
    if success:
        print("✅ Atualização concluída com sucesso!")
        print("\n🚀 Agora você pode:")
        print("   1. Iniciar o servidor Flask: python start.py")
        print("   2. Acessar o sistema e testar o campo status")
        print("   3. Criar novos elevadores com status")
    else:
        print("❌ Falha na atualização. Verifique os erros acima.")
