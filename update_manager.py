"""
Sistema de Atualização sem Git
Implementa download direto de arquivos via HTTP/HTTPS
"""

import os
import sys
import requests
import zipfile
import shutil
import tempfile
import json
from pathlib import Path
from datetime import datetime
import hashlib
import threading
import time
import signal

# Importar configurações
try:
    from update_config import (
        UPDATE_SERVER_URL, VERSION_CHECK_URL, CURRENT_VERSION,
        PROTECTED_FILES, CRITICAL_FILES
    )
except ImportError:
    # Configurações padrão se o arquivo não existir
    UPDATE_SERVER_URL = "https://github.com/Cl4nyz/ElevadoresWebApp/archive/refs/heads/main.zip"
    VERSION_CHECK_URL = "https://api.github.com/repos/Cl4nyz/ElevadoresWebApp/releases/latest"
    CURRENT_VERSION = "1.0.0"
    PROTECTED_FILES = ["postgre.py", ".venv/", "*.db", "config.ini", "*.log"]
    CRITICAL_FILES = ["app.py", "homemanager.py", "requirements.txt"]

class UpdateManager:
    def __init__(self):
        self.current_dir = Path.cwd()
        self.temp_dir = None
        self.backup_dir = None
        
    def get_current_version(self):
        """Obtém a versão atual do sistema"""
        version_file = self.current_dir / "version.txt"
        if version_file.exists():
            try:
                return version_file.read_text().strip()
            except:
                pass
        return CURRENT_VERSION
    
    def check_for_updates(self):
        """Verifica se há atualizações disponíveis"""
        try:
            print("🔍 Verificando atualizações disponíveis...")
            
            # Tentar GitHub API primeiro
            try:
                response = requests.get(VERSION_CHECK_URL, timeout=10)
                if response.status_code == 200:
                    release_data = response.json()
                    remote_version = release_data.get('tag_name', '').lstrip('v')
                    if not remote_version:
                        remote_version = release_data.get('name', '').lstrip('v')
                    
                    if remote_version:
                        current_version = self.get_current_version()
                        
                        return {
                            'available': remote_version != current_version,
                            'current_version': current_version,
                            'remote_version': remote_version,
                            'download_url': release_data.get('zipball_url', UPDATE_SERVER_URL),
                            'release_notes': release_data.get('body', 'Sem notas de versão'),
                            'published_at': release_data.get('published_at', '')
                        }
            except:
                pass
            
            # Fallback: assumir que há atualização disponível
            current_version = self.get_current_version()
            return {
                'available': True,
                'current_version': current_version,
                'remote_version': 'latest',
                'download_url': UPDATE_SERVER_URL,
                'release_notes': 'Atualização disponível',
                'published_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Erro ao verificar atualizações: {e}")
            return {
                'available': False,
                'error': str(e)
            }
    
    def create_backup(self):
        """Cria backup dos arquivos críticos"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.backup_dir = self.current_dir / f"backup_{timestamp}"
            self.backup_dir.mkdir(exist_ok=True)
            
            print(f"💾 Criando backup em: {self.backup_dir}")
            
            # Backup de arquivos críticos
            critical_files = ['app.py', 'homemanager.py', 'requirements.txt', 'postgre.py']
            for file_name in critical_files:
                source = self.current_dir / file_name
                if source.exists():
                    shutil.copy2(source, self.backup_dir / file_name)
            
            # Backup de diretórios importantes
            for dir_name in ['templates', 'static']:
                source_dir = self.current_dir / dir_name
                if source_dir.exists():
                    shutil.copytree(source_dir, self.backup_dir / dir_name, dirs_exist_ok=True)
            
            print("✅ Backup criado com sucesso")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao criar backup: {e}")
            return False
    
    def download_update(self, download_url):
        """Baixa o arquivo de atualização"""
        try:
            print("⬇️  Baixando atualização...")
            
            # Criar diretório temporário
            self.temp_dir = Path(tempfile.mkdtemp())
            zip_file = self.temp_dir / "update.zip"
            
            # Download com progress
            response = requests.get(download_url, stream=True, timeout=30)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(zip_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\r📦 Progresso: {percent:.1f}%", end="", flush=True)
            
            print(f"\n✅ Download concluído: {zip_file}")
            return zip_file
            
        except Exception as e:
            print(f"\n❌ Erro no download: {e}")
            return None
    
    def extract_update(self, zip_file):
        """Extrai o arquivo de atualização"""
        try:
            print("📂 Extraindo arquivos...")
            
            extract_dir = self.temp_dir / "extracted"
            extract_dir.mkdir(exist_ok=True)
            
            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Encontrar o diretório principal (pode estar em subpasta)
            extracted_items = list(extract_dir.iterdir())
            if len(extracted_items) == 1 and extracted_items[0].is_dir():
                return extracted_items[0]
            else:
                return extract_dir
                
        except Exception as e:
            print(f"❌ Erro na extração: {e}")
            return None
            
    def should_update_file(self, file_path):
        """Verifica se um arquivo deve ser atualizado"""
        rel_path = str(file_path.relative_to(self.current_dir))
        
        # Verificar arquivos protegidos
        for protected in PROTECTED_FILES:
            if protected.endswith('/'):
                if rel_path.startswith(protected):
                    return False
            elif '*' in protected:
                import fnmatch
                if fnmatch.fnmatch(rel_path, protected):
                    return False
            elif rel_path == protected:
                return False
        
        return True
    
    def apply_update(self, source_dir):
        """Aplica a atualização"""
        try:
            print("🔄 Aplicando atualização...")
            updated_files = []
            skipped_files = []
            
            # Percorrer todos os arquivos do update
            for source_file in source_dir.rglob('*'):
                if source_file.is_file():
                    # Calcular caminho relativo
                    try:
                        rel_path = source_file.relative_to(source_dir)
                        target_file = self.current_dir / rel_path
                        
                        # Verificar se deve atualizar
                        if self.should_update_file(target_file):
                            # Criar diretório pai se necessário
                            target_file.parent.mkdir(parents=True, exist_ok=True)
                            
                            # Copiar arquivo
                            shutil.copy2(source_file, target_file)
                            updated_files.append(str(rel_path))
                        else:
                            skipped_files.append(str(rel_path))
                            
                    except Exception as e:
                        print(f"⚠️  Erro ao processar {source_file}: {e}")
            
            print(f"✅ Arquivos atualizados: {len(updated_files)}")
            print(f"⏭️  Arquivos ignorados: {len(skipped_files)}")
            
            return updated_files
            
        except Exception as e:
            print(f"❌ Erro ao aplicar atualização: {e}")
            return None
    
    def update_version(self, new_version):
        """Atualiza o arquivo de versão"""
        try:
            version_file = self.current_dir / "version.txt"
            version_file.write_text(new_version)
            print(f"📝 Versão atualizada para: {new_version}")
        except Exception as e:
            print(f"⚠️  Erro ao atualizar versão: {e}")
    
    def cleanup(self):
        """Limpa arquivos temporários"""
        try:
            if self.temp_dir and self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
                print("🧹 Arquivos temporários removidos")
        except Exception as e:
            print(f"⚠️  Erro na limpeza: {e}")
    
    def rollback(self):
        """Desfaz a atualização usando o backup"""
        if not self.backup_dir or not self.backup_dir.exists():
            print("❌ Backup não encontrado para rollback")
            return False
        
        try:
            print("🔙 Fazendo rollback...")
            
            # Restaurar arquivos do backup
            for backup_file in self.backup_dir.rglob('*'):
                if backup_file.is_file():
                    rel_path = backup_file.relative_to(self.backup_dir)
                    target_file = self.current_dir / rel_path
                    shutil.copy2(backup_file, target_file)
            
            print("✅ Rollback concluído")
            return True
            
        except Exception as e:
            print(f"❌ Erro no rollback: {e}")
            return False
    
    def perform_update(self):
        """Executa o processo completo de atualização"""
        try:
            print("=" * 50)
            print("🚀 Iniciando processo de atualização")
            print("=" * 50)
            
            # 1. Verificar atualizações
            update_info = self.check_for_updates()
            if not update_info.get('available'):
                print("✅ Sistema já está atualizado")
                return True
            
            print(f"📋 Nova versão encontrada: {update_info['remote_version']}")
            print(f"📋 Versão atual: {update_info['current_version']}")
            
            # 2. Criar backup
            if not self.create_backup():
                print("❌ Falha no backup - atualização cancelada")
                return False
            
            # 3. Baixar atualização
            zip_file = self.download_update(update_info['download_url'])
            if not zip_file:
                print("❌ Falha no download - atualização cancelada")
                return False
            
            # 4. Extrair arquivos
            source_dir = self.extract_update(zip_file)
            if not source_dir:
                print("❌ Falha na extração - atualização cancelada")
                return False
            
            # 5. Aplicar atualização
            updated_files = self.apply_update(source_dir)
            if updated_files is None:
                print("❌ Falha na aplicação - fazendo rollback...")
                self.rollback()
                return False
            
            # 6. Atualizar versão
            self.update_version(update_info['remote_version'])
            
            # 7. Limpeza
            self.cleanup()
            
            print("=" * 50)
            print("🎉 Atualização concluída com sucesso!")
            print(f"📦 {len(updated_files)} arquivos foram atualizados")
            print("=" * 50)
            
            return True
            
        except Exception as e:
            print(f"❌ Erro geral na atualização: {e}")
            self.cleanup()
            return False

def main():
    """Função principal para teste"""
    updater = UpdateManager()
    
    # Verificar atualizações
    update_info = updater.check_for_updates()
    print("Informações de atualização:", json.dumps(update_info, indent=2))
    
    # Executar atualização se disponível
    if update_info.get('available'):
        updater.perform_update()

if __name__ == "__main__":
    main()
