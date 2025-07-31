#!/usr/bin/env python3
"""
Script de inicialização do Sistema de Gerenciamento de Elevadores
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Instala as dependências do projeto"""
    print("📦 Instalando dependências...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependências instaladas com sucesso!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Erro ao instalar dependências")
        return False

def setup_database():
    """Configura o banco de dados"""
    print("🗄️ Configurando banco de dados...")
    try:
        from postgre import create_database, create_pg_connection, drop_all_tables, create_tables, end_pg_connection, insert_initial_data
        create_database()
        conn = create_pg_connection()
        if not conn:
            print("❌ Erro ao conectar com o banco de dados")
            print("   Verifique as configurações no arquivo .env")
            return False
        
        # Configurar tabelas
        drop_all_tables(conn)
        create_tables(conn)
        insert_initial_data(conn)
        conn.commit()
        
        # Adicionar dados de exemplo
        cursor = conn.cursor()
        
        # Inserir clientes de exemplo
        cursor.execute("""
            INSERT INTO cliente (nome, comercial, documento, email) VALUES
            ('João Silva', 0, '12345678901', 'joao.silva@email.com'),
            ('Maria Souza', 0, '98765432100', 'maria.souza@email.com'),
            ('Pedro Santos', 0, '11111111111', 'pedro.santos@email.com');
        """)
        
        # Inserir endereços de exemplo
        cursor.execute("""
            INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep) VALUES
            (1, 'Rua das Flores', 100, 'São Paulo', 'SP', 'Apto 101', '01234567'),
            (2, 'Av. Brasil', 200, 'Rio de Janeiro', 'RJ', NULL, '76543210'),
            (3, 'Rua Central', 300, 'Belo Horizonte', 'MG', 'Sala 201', '12345678');
        """)
        
        # Inserir contratos de exemplo
        cursor.execute("""
            INSERT INTO contrato (data_venda, data_entrega, id_cliente) VALUES
            ('2024-01-15', '2024-12-15', 1),
            ('2024-02-20', '2024-11-20', 2),
            ('2024-03-10', '2025-01-10', 3);
        """)
        
        # Inserir elevadores de exemplo
        cursor.execute("""
            INSERT INTO elevador (id_contrato, id_cabine, elevacao, cor) VALUES
            (1, 1, 3000, 'Azul'),
            (2, 2, 3500, 'Vermelho'),
            (3, 1, 4000, 'Verde');
        """)
        
        conn.commit()
        cursor.close()
        end_pg_connection(conn)
        
        print("✅ Banco de dados configurado com sucesso!")
        print("📊 Dados de exemplo adicionados")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao configurar banco de dados: {e}")
        return False

def run_app():
    """Executa a aplicação"""
    print("🚀 Iniciando aplicação...")
    try:
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n👋 Aplicação encerrada pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao executar aplicação: {e}")

def main():
    """Função principal"""
    print("=" * 60)
    print("🏢 SISTEMA DE GERENCIAMENTO DE ELEVADORES")
    print("=" * 60)
    
    # Verificar se estamos no diretório correto
    if not Path("app.py").exists():
        print("❌ Arquivo app.py não encontrado!")
        print("   Execute este script no diretório do projeto")
        return
    
    # Verificar arquivo .env
    if not Path(".env").exists():
        print("⚠️  Arquivo .env não encontrado!")
        print("   Crie um arquivo .env com as configurações do banco de dados")
        print("   Exemplo:")
        print("   PG_NAME=nome_banco")
        print("   PG_USER=postgres")
        print("   PG_PASSWORD=sua_senha")
        print("   PG_HOST=localhost")
        print("   PG_PORT=5432")
        return
    
    # Menu de opções
    while True:
        print("\n📋 Escolha uma opção:")
        print("1. Instalar dependências")
        print("2. Configurar banco de dados")
        print("3. Executar aplicação")
        print("4. Fazer tudo (setup completo)")
        print("5. Sair")
        
        escolha = input("\n➤ Digite sua escolha (1-5): ").strip()
        
        if escolha == "1":
            install_requirements()
        elif escolha == "2":
            setup_database()
        elif escolha == "3":
            run_app()
        elif escolha == "4":
            if install_requirements() and setup_database():
                print("\n🎉 Setup completo! Iniciando aplicação...")
                run_app()
        elif escolha == "5":
            print("👋 Até logo!")
            break
        else:
            print("❌ Opção inválida! Tente novamente.")

if __name__ == "__main__":
    main()
