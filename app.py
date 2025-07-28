from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
from datetime import datetime, date
import json
import webbrowser
import threading
from postgre import create_pg_connection, end_pg_connection

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return create_pg_connection()

# Rota principal
@app.route('/')
def index():
    return render_template('index.html')

# Rotas para clientes
@app.route('/clientes')
def clientes():
    return render_template('clientes.html')

@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT c.id, c.nome, c.cpf, 
                   e.rua, e.numero, e.cidade, e.estado, e.complemento, e.cep, e.id as endereco_id
            FROM cliente c
            LEFT JOIN endereco e ON c.id = e.id_cliente
            ORDER BY c.id
        """)
        clientes = []
        for row in cursor.fetchall():
            cliente_id = row[0]
            # Verifica se o cliente já está na lista
            cliente_existente = next((c for c in clientes if c['id'] == cliente_id), None)
            
            if cliente_existente:
                # Adiciona o endereço ao cliente existente
                if row[3]:  # Se há rua (endereco existe)
                    cliente_existente['enderecos'].append({
                        'id': row[9],
                        'rua': row[3],
                        'numero': row[4],
                        'cidade': row[5],
                        'estado': row[6],
                        'complemento': row[7],
                        'cep': row[8]
                    })
            else:
                # Cria novo cliente
                cliente = {
                    'id': row[0],
                    'nome': row[1],
                    'cpf': row[2],
                    'enderecos': []
                }
                if row[3]:  # Se há rua (endereco existe)
                    cliente['enderecos'].append({
                        'id': row[9],
                        'rua': row[3],
                        'numero': row[4],
                        'cidade': row[5],
                        'estado': row[6],
                        'complemento': row[7],
                        'cep': row[8]
                    })
                clientes.append(cliente)
        
        return jsonify(clientes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/clientes', methods=['POST'])
def add_cliente():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Validar dados obrigatórios
        if not data.get('nome') or not data.get('nome').strip():
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        # Validar CPF se fornecido
        cpf = data.get('cpf')
        if cpf:
            cpf = cpf.strip()
            if len(cpf) != 11:
                return jsonify({'error': 'CPF deve ter 11 dígitos'}), 400
        else:
            cpf = None
        
        # Inserir cliente (sem especificar ID - será auto-incrementado)
        cursor.execute("""
            INSERT INTO cliente (nome, cpf) 
            VALUES (%s, %s) RETURNING id
        """, (data['nome'].strip(), cpf))
        
        cliente_id = cursor.fetchone()[0]
        
        # Inserir endereço se fornecido
        if data.get('endereco'):
            endereco = data['endereco']
            # Validar campos obrigatórios do endereço
            if endereco.get('cidade') and endereco.get('estado'):
                cursor.execute("""
                    INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (cliente_id, endereco.get('rua'), endereco.get('numero'), 
                      endereco.get('cidade'), endereco.get('estado'), 
                      endereco.get('complemento'), endereco.get('cep')))
        
        conn.commit()
        return jsonify({'id': cliente_id, 'message': 'Cliente criado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Erro ao criar cliente: {str(e)}'}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/clientes/<int:cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Validar dados obrigatórios
        if not data.get('nome') or not data.get('nome').strip():
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        # Validar CPF se fornecido
        cpf = data.get('cpf')
        if cpf:
            cpf = cpf.strip()
            if len(cpf) != 11:
                return jsonify({'error': 'CPF deve ter 11 dígitos'}), 400
        else:
            cpf = None
            
        cursor.execute("""
            UPDATE cliente SET nome = %s, cpf = %s 
            WHERE id = %s
        """, (data['nome'].strip(), cpf, cliente_id))
        
        conn.commit()
        return jsonify({'message': 'Cliente atualizado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/clientes/<int:cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM cliente WHERE id = %s", (cliente_id,))
        conn.commit()
        return jsonify({'message': 'Cliente excluído com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rotas para endereços
@app.route('/api/enderecos', methods=['POST'])
def add_endereco():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Validar dados obrigatórios
        if not data.get('id_cliente'):
            return jsonify({'error': 'Cliente é obrigatório'}), 400
        if not data.get('cidade') or not data.get('cidade').strip():
            return jsonify({'error': 'Cidade é obrigatória'}), 400
        if not data.get('estado') or not data.get('estado').strip():
            return jsonify({'error': 'Estado é obrigatório'}), 400
        
        cursor.execute("""
            INSERT INTO endereco (id_cliente, rua, numero, cidade, estado, complemento, cep)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (data['id_cliente'], data.get('rua'), data.get('numero'), 
              data['cidade'].strip(), data['estado'].strip().upper(), 
              data.get('complemento'), data.get('cep')))
        
        endereco_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({'id': endereco_id, 'message': 'Endereço criado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Erro ao criar endereço: {str(e)}'}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/enderecos/<int:endereco_id>', methods=['PUT'])
def update_endereco(endereco_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE endereco SET rua = %s, numero = %s, cidade = %s, 
                   estado = %s, complemento = %s, cep = %s
            WHERE id = %s
        """, (data['rua'], data['numero'], data['cidade'], 
              data['estado'], data.get('complemento'), data['cep'], endereco_id))
        
        conn.commit()
        return jsonify({'message': 'Endereço atualizado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/enderecos/<int:endereco_id>', methods=['DELETE'])
def delete_endereco(endereco_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM endereco WHERE id = %s", (endereco_id,))
        conn.commit()
        return jsonify({'message': 'Endereço excluído com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rotas para estados
@app.route('/api/estados', methods=['GET'])
def get_estados():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT sigla, nome FROM estado ORDER BY nome")
        estados = [{'sigla': row[0], 'nome': row[1]} for row in cursor.fetchall()]
        return jsonify(estados)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rotas para cabines (somente leitura)
@app.route('/api/cabines', methods=['GET'])
def get_cabines():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, altura, descricao FROM cabine ORDER BY altura")
        cabines = [{'id': row[0], 'altura': row[1], 'descricao': row[2]} for row in cursor.fetchall()]
        return jsonify(cabines)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rotas para contratos
@app.route('/contratos')
def contratos():
    return render_template('contratos.html')

@app.route('/api/contratos', methods=['GET'])
def get_contratos():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT c.id, c.data_venda, c.data_entrega, c.id_cliente, cl.nome
            FROM contrato c
            LEFT JOIN cliente cl ON c.id_cliente = cl.id
            ORDER BY c.id
        """)
        contratos = []
        for row in cursor.fetchall():
            contratos.append({
                'id': row[0],
                'data_venda': row[1].isoformat() if row[1] else None,
                'data_entrega': row[2].isoformat() if row[2] else None,
                'id_cliente': row[3],
                'cliente_nome': row[4]
            })
        return jsonify(contratos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/contratos', methods=['POST'])
def add_contrato():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Validar dados obrigatórios
        if not data.get('id_cliente'):
            return jsonify({'error': 'Cliente é obrigatório'}), 400
        
        # Validar se cliente existe
        cursor.execute("SELECT id FROM cliente WHERE id = %s", (data['id_cliente'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Cliente não encontrado'}), 400
        
        # Validar datas se fornecidas
        data_venda = data.get('data_venda')
        data_entrega = data.get('data_entrega')
        
        if data_venda and data_entrega:
            from datetime import datetime
            try:
                dt_inicio = datetime.fromisoformat(data_venda)
                dt_entrega = datetime.fromisoformat(data_entrega)
                if dt_entrega < dt_inicio:
                    return jsonify({'error': 'Data de entrega deve ser posterior à data da venda'}), 400
            except ValueError:
                return jsonify({'error': 'Formato de data inválido'}), 400
        
        cursor.execute("""
            INSERT INTO contrato (data_venda, data_entrega, id_cliente) 
            VALUES (%s, %s, %s) RETURNING id
        """, (data_venda, data_entrega, data['id_cliente']))
        
        contrato_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({'id': contrato_id, 'message': 'Contrato criado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Erro ao criar contrato: {str(e)}'}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/contratos/<int:contrato_id>', methods=['PUT'])
def update_contrato(contrato_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE contrato SET data_venda = %s, data_entrega = %s, id_cliente = %s 
            WHERE id = %s
        """, (data.get('data_venda'), data.get('data_entrega'), data['id_cliente'], contrato_id))
        
        conn.commit()
        return jsonify({'message': 'Contrato atualizado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/contratos/<int:contrato_id>', methods=['DELETE'])
def delete_contrato(contrato_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM contrato WHERE id = %s", (contrato_id,))
        conn.commit()
        return jsonify({'message': 'Contrato excluído com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rotas para elevadores
@app.route('/elevadores')
def elevadores():
    return render_template('elevadores.html')

@app.route('/api/elevadores', methods=['GET'])
def get_elevadores():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT e.id, e.id_contrato, e.id_cabine, e.elevacao, e.cor,
                   c.data_venda, c.data_entrega, c.id_cliente,
                   cl.nome, cab.altura
            FROM elevador e
            LEFT JOIN contrato c ON e.id_contrato = c.id
            LEFT JOIN cliente cl ON c.id_cliente = cl.id
            LEFT JOIN cabine cab ON e.id_cabine = cab.id
            ORDER BY e.id
        """)
        elevadores = []
        for row in cursor.fetchall():
            elevadores.append({
                'id': row[0],
                'id_contrato': row[1],
                'id_cabine': row[2],
                'elevacao': row[3],
                'cor': row[4],
                'data_venda': row[5].isoformat() if row[5] else None,
                'data_entrega': row[6].isoformat() if row[6] else None,
                'id_cliente': row[7],
                'cliente_nome': row[8],
                'altura_cabine': row[9]
            })
        return jsonify(elevadores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/elevadores', methods=['POST'])
def add_elevador():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Validar dados obrigatórios
        if not data.get('id_cabine'):
            return jsonify({'error': 'Cabine é obrigatória'}), 400
        if not data.get('elevacao') or not isinstance(data.get('elevacao'), (int, float)):
            return jsonify({'error': 'Elevação é obrigatória e deve ser um número'}), 400
        
        elevacao = int(data['elevacao'])
        if elevacao <= 0:
            return jsonify({'error': 'Elevação deve ser maior que zero'}), 400
        
        # Validar se cabine existe
        cursor.execute("SELECT id FROM cabine WHERE id = %s", (data['id_cabine'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Cabine não encontrada'}), 400
        
        # Validar contrato se fornecido
        id_contrato = data.get('id_contrato')
        if id_contrato:
            cursor.execute("SELECT id FROM contrato WHERE id = %s", (id_contrato,))
            if not cursor.fetchone():
                return jsonify({'error': 'Contrato não encontrado'}), 400
        
        cursor.execute("""
            INSERT INTO elevador (id_contrato, id_cabine, elevacao, cor) 
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (id_contrato, data['id_cabine'], elevacao, data.get('cor')))
        
        elevador_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({'id': elevador_id, 'message': 'Elevador criado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Erro ao criar elevador: {str(e)}'}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/elevadores/<int:elevador_id>', methods=['PUT'])
def update_elevador(elevador_id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE elevador SET id_contrato = %s, id_cabine = %s, elevacao = %s, cor = %s 
            WHERE id = %s
        """, (data.get('id_contrato'), data['id_cabine'], data['elevacao'], data.get('cor'), elevador_id))
        
        conn.commit()
        return jsonify({'message': 'Elevador atualizado com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/elevadores/<int:elevador_id>', methods=['DELETE'])
def delete_elevador(elevador_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM elevador WHERE id = %s", (elevador_id,))
        conn.commit()
        return jsonify({'message': 'Elevador excluído com sucesso'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rota para o calendário
@app.route('/calendario')
def calendario():
    return render_template('calendario.html')

# Rota para relatórios
@app.route('/relatorios')
def relatorios():
    return render_template('relatorios.html')

@app.route('/api/relatorios/vendas-por-estado')
def get_vendas_por_estado():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                e.estado,
                est.nome as estado_nome,
                COUNT(el.id) as total_elevadores,
                COUNT(DISTINCT c.id_cliente) as total_clientes,
                AVG(el.elevacao) as elevacao_media
            FROM endereco e
            JOIN estado est ON e.estado = est.sigla
            LEFT JOIN cliente cli ON e.id_cliente = cli.id
            LEFT JOIN contrato c ON cli.id = c.id_cliente
            LEFT JOIN elevador el ON c.id = el.id_contrato
            GROUP BY e.estado, est.nome
            ORDER BY total_elevadores DESC
        """)
        
        vendas = []
        for row in cursor.fetchall():
            vendas.append({
                'estado': row[0],
                'estado_nome': row[1],
                'total_elevadores': row[2] or 0,
                'total_clientes': row[3] or 0,
                'elevacao_media': round(float(row[4]) if row[4] else 0, 2)
            })
        
        return jsonify(vendas)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/calendario')
def get_calendario_data():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT e.id, e.cor, e.elevacao,
                   c.data_entrega, c.data_venda,
                   cl.nome as cliente_nome,
                   cab.altura
            FROM elevador e
            JOIN contrato c ON e.id_contrato = c.id
            JOIN cliente cl ON c.id_cliente = cl.id
            JOIN cabine cab ON e.id_cabine = cab.id
            WHERE c.data_entrega IS NOT NULL
            ORDER BY c.data_entrega
        """)
        eventos = []
        for row in cursor.fetchall():
            eventos.append({
                'id': row[0],
                'title': f'Elevador #{row[0]} - {row[5]}',
                'start': row[3].isoformat(),
                'color': row[1] or '#007bff',
                'extendedProps': {
                    'elevador_id': row[0],
                    'cor': row[1],
                    'elevacao': row[2],
                    'data_venda': row[4].isoformat() if row[4] else None,
                    'cliente_nome': row[5],
                    'altura_cabine': row[6]
                }
            })
        return jsonify(eventos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

def open_browser():
    """Abre o navegador após o servidor iniciar"""
    webbrowser.open('http://localhost:5000')

if __name__ == '__main__':
    # Abrir navegador após 1 segundo (tempo para o servidor iniciar)
    threading.Timer(1, open_browser).start()
    
    print("🏢 Sistema de Gerenciamento de Elevadores")
    print("="*50)
    print("🚀 Iniciando servidor...")
    print("🌐 Acesse: http://localhost:5000")
    print("⏹️  Pressione Ctrl+C para parar o servidor")
    print("="*50)
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
