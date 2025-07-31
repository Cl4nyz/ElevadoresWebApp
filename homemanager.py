#!/usr/bin/env python3
"""
HomeManager - Sistema de Gerenciamento de Elevadores
Aplicativo principal executável
"""

import sys
import os
import subprocess
import threading
import time
import webbrowser
import signal
import atexit
from pathlib import Path

# Adicionar o diretório atual ao Python path
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

# Variável global para controlar o servidor
servidor_processo = None

def importar_psutil():
    """Importa psutil de forma segura"""
    try:
        import psutil
        return psutil
    except ImportError:
        print("⚠️  psutil não encontrado - algumas funcionalidades podem não funcionar")
        return None

def verificar_criar_venv():
    """Verifica se existe .venv e cria se necessário"""
    venv_path = current_dir / ".venv"
    
    if not venv_path.exists():
        print("🔧 Criando ambiente virtual Python...")
        try:
            subprocess.run([sys.executable, "-m", "venv", str(venv_path)], 
                         check=True, capture_output=True)
            print("✅ Ambiente virtual criado com sucesso")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erro ao criar ambiente virtual: {e}")
            return False
    else:
        print("✅ Ambiente virtual já existe")
    
    return True

def ativar_venv_e_instalar():
    """Ativa o ambiente virtual e instala dependências"""
    venv_path = current_dir / ".venv"
    
    # Determinar o caminho do Python no venv
    if os.name == 'nt':  # Windows
        python_venv = venv_path / "Scripts" / "python.exe"
        pip_venv = venv_path / "Scripts" / "pip.exe"
    else:  # Linux/Mac
        python_venv = venv_path / "bin" / "python"
        pip_venv = venv_path / "bin" / "pip"
    
    if not python_venv.exists():
        print("❌ Python não encontrado no ambiente virtual")
        return False
    
    print("🔍 Verificando dependências no ambiente virtual...")
    
    # Verificar se as dependências estão instaladas no venv
    try:
        result = subprocess.run([str(python_venv), "-c", 
                               "import flask, flask_cors, psycopg2, reportlab, psutil"], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print("⚠️  Instalando dependências no ambiente virtual...")
            requirements_path = current_dir / "requirements.txt"
            if requirements_path.exists():
                subprocess.run([str(pip_venv), "install", "-r", str(requirements_path)], 
                             check=True, capture_output=True)
                print("✅ Dependências instaladas no ambiente virtual")
            else:
                print("❌ Arquivo requirements.txt não encontrado")
                return False
        else:
            print("✅ Dependências já instaladas no ambiente virtual")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        return False
    
    return str(python_venv)

def verificar_dependencias():
    """Verifica se todas as dependências estão instaladas"""
    try:
        import flask
        import flask_cors
        import psycopg2
        import reportlab
        print("✅ Todas as dependências estão instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependência faltando: {e}")
        return False

def monitorar_navegador():
    """Monitora se o navegador ainda está acessando o site"""
    psutil = importar_psutil()
    if not psutil:
        # Se não temos psutil, não podemos monitorar - usar timeout simples
        time.sleep(300)  # 5 minutos
        print("\n🚪 Timeout - encerrando aplicativo...")
        encerrar_aplicativo()
        return
    
    import socket
    
    while True:
        try:
            # Verificar se há conexões ativas na porta 5000
            conexoes_ativas = False
            for conn in psutil.net_connections():
                if conn.laddr.port == 5000 and conn.status == 'ESTABLISHED':
                    conexoes_ativas = True
                    break
            
            if not conexoes_ativas:
                # Aguardar um pouco para confirmar que não há mais conexões
                time.sleep(10)
                # Verificar novamente
                conexoes_ativas = False
                for conn in psutil.net_connections():
                    if conn.laddr.port == 5000 and conn.status == 'ESTABLISHED':
                        conexoes_ativas = True
                        break
                
                if not conexoes_ativas:
                    print("\n🚪 Navegador fechado - encerrando aplicativo...")
                    encerrar_aplicativo()
                    break
                    
        except Exception as e:
            print(f"Erro no monitoramento: {e}")
            
        time.sleep(5)  # Verificar a cada 5 segundos

def encerrar_aplicativo():
    """Encerra o aplicativo completamente"""
    global servidor_processo
    
    print("🛑 Encerrando HomeManager...")
    
    try:
        if servidor_processo:
            servidor_processo.terminate()
            servidor_processo.wait(timeout=5)
    except:
        pass
    
    # Forçar encerramento de qualquer processo Python rodando na porta 5000
    try:
        psutil = importar_psutil()
        if psutil:
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    for conn in proc.info['connections'] or []:
                        if conn.laddr.port == 5000:
                            print(f"🔴 Encerrando processo {proc.info['pid']}")
                            proc.terminate()
                except:
                    pass
    except:
        pass
    
    print("👋 HomeManager encerrado!")
    os._exit(0)

def iniciar_servidor(python_path=None):
    """Inicia o servidor Flask"""
    global servidor_processo
    
    try:
        print("🚀 Iniciando servidor HomeManager...")
        
        # Usar Python do venv se fornecido
        python_cmd = python_path if python_path else sys.executable
        
        # Iniciar servidor como subprocesso
        servidor_processo = subprocess.Popen([
            python_cmd, "-c",
            """
import sys
sys.path.insert(0, '.')
from app import app
app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False, threaded=True)
            """
        ], cwd=str(current_dir))
        
        # Aguardar servidor inicializar
        time.sleep(3)
        
        # Verificar se o servidor está rodando
        if servidor_processo.poll() is None:
            print("✅ Servidor iniciado com sucesso")
            return True
        else:
            print("❌ Erro ao iniciar servidor")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        return False

def abrir_navegador():
    """Abre o navegador após o servidor estar pronto"""
    # Aguardar o servidor inicializar
    time.sleep(3)
    
    try:
        url = "http://127.0.0.1:5000"
        print(f"🌐 Abrindo HomeManager em: {url}")
        webbrowser.open(url)
    except Exception as e:
        print(f"❌ Erro ao abrir navegador: {e}")
        print("💡 Acesse manualmente: http://127.0.0.1:5000")

def configurar_handlers_encerramento():
    """Configura handlers para encerramento limpo"""
    def signal_handler(signum, frame):
        print(f"\n🛑 Recebido sinal {signum} - encerrando...")
        encerrar_aplicativo()
    
    # Registrar handlers para sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Registrar função para encerramento
    atexit.register(encerrar_aplicativo)

def main():
    """Função principal"""
    print("=" * 50)
    print("🏠 HomeManager - Sistema de Elevadores")
    print("=" * 50)
    
    # Configurar handlers de encerramento
    configurar_handlers_encerramento()
    
    # Verificar e criar ambiente virtual
    if not verificar_criar_venv():
        input("Pressione Enter para sair...")
        return
    
    # Ativar venv e instalar dependências
    python_venv = ativar_venv_e_instalar()
    if not python_venv:
        input("Pressione Enter para sair...")
        return
    
    # Verificar se o banco de dados está configurado
    try:
        # Usar Python do venv para verificar conexão
        result = subprocess.run([python_venv, "-c", """
import sys
sys.path.insert(0, '.')
try:
    from postgre import create_pg_connection
    conn = create_pg_connection()
    if conn:
        conn.close()
        print('✅ Conexão com banco de dados OK')
    else:
        print('⚠️  Aviso: Problemas na conexão com banco de dados')
except Exception as e:
    print(f'⚠️  Aviso: {e}')
"""], capture_output=True, text=True, cwd=str(current_dir))
        
        print(result.stdout.strip())
        
    except Exception as e:
        print(f"⚠️  Aviso: {e}")
    
    print("\n🚀 Iniciando aplicação...")
    print("💡 Para fechar o aplicativo, feche a aba do navegador ou pressione Ctrl+C")
    print("=" * 50)
    
    try:
        # Iniciar servidor Flask
        if not iniciar_servidor(python_venv):
            input("Pressione Enter para sair...")
            return
        
        # Iniciar thread para abrir o navegador
        browser_thread = threading.Thread(target=abrir_navegador, daemon=True)
        browser_thread.start()
        
        # Iniciar monitoramento do navegador
        monitor_thread = threading.Thread(target=monitorar_navegador, daemon=True)
        monitor_thread.start()
        
        # Aguardar o servidor terminar
        if servidor_processo:
            servidor_processo.wait()
        
    except KeyboardInterrupt:
        print("\n👋 Encerrando HomeManager...")
        encerrar_aplicativo()
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        encerrar_aplicativo()

if __name__ == "__main__":
    main()
