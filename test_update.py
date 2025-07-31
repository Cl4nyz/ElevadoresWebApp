#!/usr/bin/python3
"""
Teste do Sistema de Atualização HTTP
Script para testar as funcionalidades de atualização sem Git
"""

import sys
import os

# Adicionar o diretório atual ao path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from update_manager import UpdateManager
import json

def main():
    print("🧪 TESTE DO SISTEMA DE ATUALIZAÇÃO HTTP")
    print("=" * 50)
    
    # Criar instância do UpdateManager
    updater = UpdateManager()
    
    # Teste 1: Verificar versão atual
    print("📋 Teste 1: Verificar versão atual")
    current_version = updater.get_current_version()
    print(f"   Versão atual: {current_version}")
    print()
    
    # Teste 2: Verificar atualizações disponíveis
    print("📋 Teste 2: Verificar atualizações disponíveis")
    update_info = updater.check_for_updates()
    print(f"   Resultado: {json.dumps(update_info, indent=2, ensure_ascii=False)}")
    print()
    
    # Teste 3: Verificar arquivos protegidos
    print("📋 Teste 3: Verificar proteção de arquivos")
    test_files = [
        "postgre.py",
        ".venv/lib/python3.11/site-packages/flask.py", 
        "app.py",
        "database.db",
        "config.ini",
        "system.log"
    ]
    
    for test_file in test_files:
        should_update = updater.should_update_file(updater.current_dir / test_file)
        status = "❌ PROTEGIDO" if not should_update else "✅ PODE ATUALIZAR"
        print(f"   {test_file}: {status}")
    print()
    
    # Teste 4: Simular processo de backup
    print("📋 Teste 4: Teste de backup")
    backup_success = updater.create_backup()
    if backup_success:
        print(f"   ✅ Backup criado em: {updater.backup_dir}")
        # Limpar backup de teste
        if updater.backup_dir and updater.backup_dir.exists():
            import shutil
            shutil.rmtree(updater.backup_dir)
            print("   🧹 Backup de teste removido")
    else:
        print("   ❌ Falha no backup")
    print()
    
    # Teste 5: Perguntar se deve executar atualização real
    if update_info.get('available'):
        print("📋 Teste 5: Atualização disponível")
        print(f"   Nova versão: {update_info.get('remote_version', 'unknown')}")
        print(f"   Versão atual: {update_info.get('current_version', 'unknown')}")
        
        resposta = input("\n🤔 Deseja executar a atualização real? (s/N): ").lower().strip()
        if resposta in ['s', 'sim', 'y', 'yes']:
            print("\n🚀 Executando atualização real...")
            success = updater.perform_update()
            if success:
                print("✅ Atualização concluída com sucesso!")
            else:
                print("❌ Falha na atualização")
        else:
            print("⏭️  Atualização cancelada pelo usuário")
    else:
        print("📋 Sistema já está atualizado")
    
    print("\n🏁 Teste concluído!")

if __name__ == "__main__":
    main()
