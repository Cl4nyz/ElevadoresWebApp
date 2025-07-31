#!/usr/bin/env python3
"""
Inicializador do Sistema de Gerenciamento de Elevadores
"""

import os
import sys
from pathlib import Path

def verificar_ambiente():
    """Verifica se o ambiente está configurado corretamente"""
    print("🔍 Verificando ambiente...")
    
    # Verificar arquivo .env
    if not Path(".env").exists():
        print("❌ Arquivo .env não encontrado!12")
        criar_env_exemplo()
        return False
    
    # Verificar se as dependências estão instaladas
    try:
        import flask
        import psycopg2
        from dotenv import load_dotenv
        print("✅ Dependências encontradas!")
    except ImportError as e:
        print(f"❌ Dependência não encontrada: {e}")
        print("💡 Execute: pip install -r requirements.txt")
        return False
    
    return True

def criar_env_exemplo():
    """Cria um arquivo .env de exemplo"""
    env_content = """# Configurações do Banco de Dados PostgreSQL
PG_NAME=elevadores_db
PG_USER=postgres
PG_PASSWORD=sua_senha_aqui
PG_HOST=localhost
PG_PORT=5432

# Configurações da Aplicação
FLASK_ENV=development
FLASK_DEBUG=True
"""
    
    with open(".env", "w", encoding="utf-8") as f:
        f.write(env_content)
    
    print("📄 Arquivo .env criado!")
    print("✏️  Edite o arquivo .env com suas configurações do PostgreSQL")

def testar_conexao_banco():
    """Testa a conexão com o banco de dados"""
    print("🗄️ Testando conexão com o banco...")
    
    try:
        from postgre import create_pg_connection
        conn = create_pg_connection()
        
        if conn:
            print("✅ Conexão com banco estabelecida!")
            conn.close()
            return True
        else:
            print("❌ Erro na conexão com o banco!")
            print("💡 Verifique as configurações no arquivo .env")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao conectar com o banco: {e}")
        return False

def inicializar_banco():
    """Inicializa o banco de dados com as tabelas"""
    print("🏗️ Inicializando banco de dados...")
    
    try:
        from postgre import create_pg_connection, drop_all_tables, create_tables, end_pg_connection
        
        conn = create_pg_connection()
        if not conn:
            return False
        
        # Perguntar se quer recriar as tabelas
        resposta = input("⚠️  Deseja recriar todas as tabelas? (isso apagará todos os dados) [s/N]: ")
        
        if resposta.lower() in ['s', 'sim', 'y', 'yes']:
            drop_all_tables(conn)
            create_tables(conn)
            print("✅ Tabelas criadas com sucesso!")
            
            # Perguntar se quer dados de exemplo
            resposta = input("📊 Deseja adicionar dados de exemplo? [S/n]: ")
            
            if resposta.lower() not in ['n', 'no', 'não']:
                adicionar_dados_exemplo(conn)
        
        end_pg_connection(conn)
        return True
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco: {e}")
        return False

def adicionar_dados_exemplo(conn):
    """Adiciona dados de exemplo ao banco"""
    cursor = conn.cursor()
    
    try:
        # Clientes
        cursor.execute("""
            INSERT INTO cliente (nome, comercial, documento, email) VALUES
            ('João Silva Santos', 0, '12345678901', 'joao.silva@email.com'),
            ('Maria Oliveira Costa', 0, '98765432100', 'maria.oliveira@email.com'),
            ('Pedro Henrique Lima', 0, '11111111111', 'pedro.lima@email.com'),
            ('Ana Carolina Souza', 0, '22222222222', 'ana.souza@email.com')
            ON CONFLICT DO NOTHING;
        """)
        
        # Endereços
        cursor.execute("""
            INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) VALUES
            (1, 'Rua das Flores', 123, 'São Paulo', 'SP', 'Apto 101', '01234567'),
            (1, 'Av. Paulista', 456, 'São Paulo', 'SP', 'Escritório', '01310100'),
            (2, 'Av. Brasil', 789, 'Rio de Janeiro', 'RJ', NULL, '76543210'),
            (3, 'Rua Central', 321, 'Belo Horizonte', 'MG', 'Sala 201', '12345678'),
            (4, 'Av. Atlântica', 654, 'Rio de Janeiro', 'RJ', 'Cobertura', '87654321')
            ON CONFLICT DO NOTHING;
        """)
        
        # Cabines
        cursor.execute("""
            INSERT INTO cabine (altura) VALUES
            (220), (250), (280), (300), (350)
            ON CONFLICT DO NOTHING;
        """)
        
        # Contratos
        cursor.execute("""
            INSERT INTO contrato (data_venda, data_entrega, id_cliente) VALUES
            ('2024-01-15', '2024-12-15', 1),
            ('2024-02-20', '2024-11-20', 2),
            ('2024-03-10', '2025-01-10', 3),
            ('2024-04-05', '2025-02-05', 4),
            ('2024-05-01', '2024-10-01', 1)
            ON CONFLICT DO NOTHING;
        """)
        
        # Elevadores
        cursor.execute("""
            INSERT INTO elevador (id_contrato, id_cabine, elevacao, cor) VALUES
            (1, 1, 3000, 'Azul'),
            (2, 2, 3500, 'Vermelho'),
            (3, 3, 4000, 'Verde'),
            (4, 4, 2500, 'Amarelo'),
            (5, 5, 4500, 'Roxo')
            ON CONFLICT DO NOTHING;
        """)
        
        conn.commit()
        print("✅ Dados de exemplo adicionados!")
        
    except Exception as e:
        print(f"⚠️  Alguns dados podem já existir: {e}")
    finally:
        cursor.close()

def executar_sistema():
    """Executa o sistema"""
    print("\n🚀 Iniciando Sistema de Gerenciamento de Elevadores...")
    print("="*60)
    
    try:
        # Importar e executar a aplicação
        from app import app
        app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
        
    except KeyboardInterrupt:
        print("\n👋 Sistema encerrado pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro ao executar sistema: {e}")

def main():
    """Função principal"""
    print("🏢 SISTEMA DE GERENCIAMENTO DE ELEVADORES")
    print("="*60)
    
    # Verificar se estamos no diretório correto
    if not Path("app.py").exists():
        print("❌ Arquivo app.py não encontrado!")
        print("   Execute este script no diretório do projeto")
        return
    
    # Verificar ambiente
    if not verificar_ambiente():
        print("\n💡 Configure o ambiente e tente novamente")
        return
    
    # Testar conexão com banco
    if not testar_conexao_banco():
        print("\n💡 Configure o banco de dados e tente novamente")
        return
    
    # Menu de opções
    while True:
        print(f"\n📋 Escolha uma opção:")
        print("1. 🚀 Executar sistema")
        print("2. 🏗️  Configurar banco de dados")
        print("3. 📊 Adicionar dados de exemplo")
        print("4. 🔧 Verificar ambiente")
        print("5. 👋 Sair")
        
        escolha = input("\n➤ Digite sua escolha (1-5): ").strip()
        
        if escolha == "1":
            executar_sistema()
            break
        elif escolha == "2":
            inicializar_banco()
        elif escolha == "3":
            try:
                from postgre import create_pg_connection, end_pg_connection
                conn = create_pg_connection()
                if conn:
                    adicionar_dados_exemplo(conn)
                    end_pg_connection(conn)
            except Exception as e:
                print(f"❌ Erro: {e}")
        elif escolha == "4":
            verificar_ambiente()
            testar_conexao_banco()
        elif escolha == "5":
            print("👋 Até logo!")
            break
        else:
            print("❌ Opção inválida! Tente novamente.")

if __name__ == "__main__":
    main()
