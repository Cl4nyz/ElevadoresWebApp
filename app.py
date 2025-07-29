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

def parse_date_safe(date_string):
    """
    Função para converter string de data de forma segura.
    Aceita formatos: YYYY-MM-DD, DD/MM/YYYY, ou ISO format
    """
    if not date_string:
        return None
    
    try:
        # Se já é uma string no formato ISO (YYYY-MM-DD)
        if len(date_string) == 10 and date_string.count('-') == 2:
            parts = date_string.split('-')
            if len(parts[0]) == 4:  # Ano primeiro = formato ISO
                return datetime.fromisoformat(date_string).date()
        
        # Se é formato brasileiro (DD/MM/YYYY)
        if date_string.count('/') == 2:
            parts = date_string.split('/')
            if len(parts) == 3 and len(parts[2]) == 4:  # DD/MM/YYYY
                day, month, year = parts
                return date(int(year), int(month), int(day))
        
        # Tentar como ISO format
        return datetime.fromisoformat(date_string).date()
        
    except (ValueError, IndexError):
        raise ValueError(f"Formato de data inválido: {date_string}")

def validate_date_range(data_inicio, data_fim):
    """
    Valida se a data de fim é posterior à data de início
    """
    if data_inicio and data_fim:
        inicio = parse_date_safe(data_inicio) if isinstance(data_inicio, str) else data_inicio
        fim = parse_date_safe(data_fim) if isinstance(data_fim, str) else data_fim
        
        if inicio and fim and fim < inicio:
            return False
    return True

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

# Rotas para contratos
@app.route('/contratos')
def contratos():
    return render_template('contratos.html')

# API para cabines (somente leitura - usado pelos elevadores)
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
        
        # Validar formato das datas
        try:
            if data_venda:
                data_venda = parse_date_safe(data_venda)
            if data_entrega:
                data_entrega = parse_date_safe(data_entrega)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Validar se data de entrega é posterior à data de venda
        if not validate_date_range(data_venda, data_entrega):
            return jsonify({'error': 'Data de entrega deve ser posterior à data da venda'}), 400
        
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

@app.route('/api/contratos/<int:contrato_id>', methods=['GET'])
def get_contrato(contrato_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT c.id, c.data_venda, c.data_entrega, c.id_cliente,
                   cl.nome as cliente_nome, cl.cpf as cliente_cpf,
                   e.rua, e.numero, e.cidade, e.estado, e.cep, e.complemento
            FROM contrato c
            JOIN cliente cl ON c.id_cliente = cl.id
            LEFT JOIN endereco e ON cl.id = e.id_cliente
            WHERE c.id = %s
        """, (contrato_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Contrato não encontrado'}), 404
        
        contrato = {
            'id': row[0],
            'data_venda': row[1].isoformat() if row[1] else None,
            'data_entrega': row[2].isoformat() if row[2] else None,
            'id_cliente': row[3],
            'cliente_nome': row[4],
            'cliente_cpf': row[5],
            'endereco': {
                'rua': row[6],
                'numero': row[7],
                'cidade': row[8],
                'estado': row[9],
                'cep': row[10],
                'complemento': row[11]
            } if row[6] else None
        }
        
        return jsonify(contrato)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
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
        # Validar datas se fornecidas
        data_venda = data.get('data_venda')
        data_entrega = data.get('data_entrega')
        
        # Validar formato das datas
        try:
            if data_venda:
                data_venda = parse_date_safe(data_venda)
            if data_entrega:
                data_entrega = parse_date_safe(data_entrega)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Validar se data de entrega é posterior à data de venda
        if not validate_date_range(data_venda, data_entrega):
            return jsonify({'error': 'Data de entrega deve ser posterior à data da venda'}), 400
        
        cursor.execute("""
            UPDATE contrato SET data_venda = %s, data_entrega = %s, id_cliente = %s 
            WHERE id = %s
        """, (data_venda, data_entrega, data['id_cliente'], contrato_id))
        
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
    
    # Verificar se há filtro por contrato
    contrato_id = request.args.get('contrato')
    
    cursor = conn.cursor()
    try:
        if contrato_id:
            # Buscar elevadores de um contrato específico
            cursor.execute("""
                SELECT e.id, e.id_contrato, e.id_cabine, e.elevacao, e.cor,
                       c.data_venda, c.data_entrega, c.id_cliente,
                       cl.nome, cab.altura, cab.descricao
                FROM elevador e
                LEFT JOIN contrato c ON e.id_contrato = c.id
                LEFT JOIN cliente cl ON c.id_cliente = cl.id
                LEFT JOIN cabine cab ON e.id_cabine = cab.id
                WHERE e.id_contrato = %s
                ORDER BY e.id
            """, (contrato_id,))
        else:
            # Buscar todos os elevadores
            cursor.execute("""
                SELECT e.id, e.id_contrato, e.id_cabine, e.elevacao, e.cor,
                       c.data_venda, c.data_entrega, c.id_cliente,
                       cl.nome, cab.altura, cab.descricao
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
                'altura_cabine': row[9],
                'cabine_descricao': row[10]
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

@app.route('/api/elevadores/<int:elevador_id>/pdf')
def gerar_pdf_elevador(elevador_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Buscar dados completos do elevador
        query = """
            SELECT 
                e.id, e.elevacao, e.cor,
                c.id as contrato_id, c.data_venda, c.data_entrega,
                cl.nome as cliente_nome, cl.cpf,
                cb.altura as cabine_altura, cb.descricao as cabine_descricao,
                en.rua, en.numero, en.complemento, en.cidade, en.estado, en.cep,
                est.nome as estado_nome
            FROM elevador e
            LEFT JOIN contrato c ON e.id_contrato = c.id
            LEFT JOIN cliente cl ON c.id_cliente = cl.id
            LEFT JOIN cabine cb ON e.id_cabine = cb.id
            LEFT JOIN endereco en ON cl.id = en.id_cliente
            LEFT JOIN estado est ON en.estado = est.sigla
            WHERE e.id = %s
        """
        
        cursor.execute(query, (elevador_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Elevador não encontrado'}), 404
        
        # Imports necessários
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from io import BytesIO
        import os
        from datetime import datetime
        
        # Ler template Markdown para estruturar os dados
        template_path = os.path.join(app.template_folder, 'elevador_pdf_template.md')
        template_structure = None
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
                # O template será usado como referência de estrutura
        except FileNotFoundError:
            template_content = None
        
        # Preparar dados para o PDF
        endereco_completo = 'Não informado'
        if result[10]:  # rua
            endereco_completo = f"{result[10]}, {result[11]}"
            if result[12]:  # complemento
                endereco_completo += f", {result[12]}"
            endereco_completo += f" - {result[13]}/{result[14]} - CEP: {result[15]}"
        
        # Dicionário com os dados
        dados = {
            'elevador_id': str(result[0]),
            'elevacao': str(result[1]) if result[1] else 'Não informada',
            'cor': result[2] or 'Não especificada',
            'cabine_altura': str(result[8]) if result[8] else 'N/A',
            'cabine_descricao': result[9] or 'N/A',
            'cliente_nome': result[6] or 'Não informado',
            'cliente_cpf': result[7] or 'Não informado',
            'endereco_completo': endereco_completo,
            'cidade': result[13] or 'Não informada',
            'estado_nome': result[16] or 'Não informado',
            'estado_sigla': result[14] or 'N/A',
            'cep': result[15] or 'Não informado',
            'contrato_id': str(result[3]) if result[3] else 'Não informado',
            'data_venda': result[4].strftime('%d/%m/%Y') if result[4] else 'Não informada',
            'data_entrega': result[5].strftime('%d/%m/%Y') if result[5] else 'Não informada',
            'data_geracao': datetime.now().strftime('%d/%m/%Y às %H:%M')
        }
        
        # Processar template Markdown se disponível
        if template_content:
            # Substituir placeholders no template
            markdown_processed = template_content
            for key, value in dados.items():
                markdown_processed = markdown_processed.replace(f'{{{{{key}}}}}', str(value))
        else:
            # Template padrão como fallback
            markdown_processed = f"""
# RELATÓRIO DE ELEVADOR

## DADOS DO ELEVADOR
- **ID:** {dados['elevador_id']}
- **Elevação:** {dados['elevacao']} mm
- **Cor:** {dados['cor']}
- **Cabine:** {dados['cabine_altura']} cm - {dados['cabine_descricao']}

## INFORMAÇÕES DO CLIENTE
- **Nome:** {dados['cliente_nome']}
- **CPF:** {dados['cliente_cpf']}

## ENDEREÇO DE INSTALAÇÃO
- **Endereço:** {dados['endereco_completo']}
- **Cidade:** {dados['cidade']}
- **Estado:** {dados['estado_nome']} ({dados['estado_sigla']})
- **CEP:** {dados['cep']}

## DADOS DO CONTRATO
- **ID do Contrato:** {dados['contrato_id']}
- **Data da Venda:** {dados['data_venda']}
- **Data de Entrega:** {dados['data_entrega']}

---
*Relatório gerado em: {dados['data_geracao']}*
"""
        
        # Criar buffer em memória
        buffer = BytesIO()
        
        # Criar documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                               topMargin=inch, bottomMargin=inch,
                               leftMargin=inch, rightMargin=inch)
        styles = getSampleStyleSheet()
        
        # Estilos personalizados baseados no template
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            spaceAfter=30,
            alignment=1,  # Centralizado
            textColor=colors.HexColor('#2c3e50')
        )
        
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=15,
            textColor=colors.HexColor('#34495e'),
            borderWidth=1,
            borderColor=colors.HexColor('#bdc3c7'),
            borderPadding=5
        )
        
        normal_style = ParagraphStyle(
            'Normal',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8
        )
        
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=10,
            alignment=1,  # Centralizado
            textColor=colors.HexColor('#7f8c8d')
        )
        
        # Estilo para tabelas
        table_style = TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
        ])
        
        # Função para processar markdown e converter para elementos ReportLab
        def markdown_to_reportlab_elements(markdown_text):
            elements = []
            lines = markdown_text.split('\n')
            
            current_table_data = []
            in_table = False
            
            for line in lines:
                line = line.strip()
                
                if not line:
                    if not in_table:
                        elements.append(Spacer(1, 12))
                    continue
                
                # Processar tags de imagem
                if '<img ' in line and 'src=' in line:
                    if in_table and current_table_data:
                        # Finalizar tabela anterior
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    
                    # Extrair o src da imagem
                    import re
                    src_match = re.search(r'src=["\']([^"\']+)["\']', line)
                    if src_match:
                        img_src = src_match.group(1)
                        # Construir caminho absoluto para a imagem
                        if not img_src.startswith('/') and not img_src.startswith('http'):
                            img_path = os.path.join('static', 'images', img_src)
                        else:
                            img_path = img_src
                        
                        try:
                            # Verificar se a imagem existe
                            if os.path.exists(img_path):
                                # Criar elemento de imagem com dimensões ajustadas
                                img = Image(img_path)
                                
                                # Ajustar tamanho da imagem para caber na página
                                available_width = 6 * inch  # Largura disponível
                                available_height = 2 * inch  # Altura máxima desejada
                                
                                # Calcular proporção
                                img_width, img_height = img.drawWidth, img.drawHeight
                                ratio = min(available_width / img_width, available_height / img_height)
                                
                                img.drawWidth = img_width * ratio
                                img.drawHeight = img_height * ratio
                                
                                elements.append(img)
                                elements.append(Spacer(1, 12))
                            else:
                                # Se a imagem não existe, adicionar texto indicativo
                                elements.append(Paragraph(f"[Imagem não encontrada: {img_src}]", normal_style))
                        except Exception as e:
                            elements.append(Paragraph(f"[Erro ao carregar imagem: {img_src}]", normal_style))
                    continue
                
                # Título principal (# )
                if line.startswith('# '):
                    if in_table and current_table_data:
                        # Finalizar tabela anterior
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    
                    title_text = line[2:].strip()
                    elements.append(Paragraph(title_text, title_style))
                    elements.append(Spacer(1, 20))
                
                # Subtítulo (## )
                elif line.startswith('## '):
                    if in_table and current_table_data:
                        # Finalizar tabela anterior
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    
                    subtitle_text = line[3:].strip()
                    elements.append(Paragraph(subtitle_text, section_style))
                    elements.append(Spacer(1, 10))
                
                # Cabeçalho de tabela
                elif line.startswith('| Campo | Valor |'):
                    in_table = True
                    current_table_data = [['Campo', 'Valor']]
                
                # Separador de tabela
                elif line.startswith('|----'):
                    continue
                
                # Linha de tabela
                elif line.startswith('|') and in_table:
                    parts = [part.strip() for part in line.split('|')[1:-1]]
                    if len(parts) >= 2:
                        # Remover formatação markdown **texto**
                        campo = parts[0].replace('**', '').strip()
                        valor = parts[1].replace('**', '').strip()
                        current_table_data.append([campo, valor])
                
                # Linha separadora ---
                elif line.startswith('---'):
                    if in_table and current_table_data:
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    elements.append(Spacer(1, 15))
                
                # Lista com marcadores (- )
                elif line.startswith('- '):
                    if in_table and current_table_data:
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    
                    list_text = line[2:].strip().replace('**', '')
                    elements.append(Paragraph(f"• {list_text}", normal_style))
                
                # Texto em div class="footer" ou texto em itálico
                elif line.startswith('*') and line.endswith('*'):
                    if in_table and current_table_data:
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    
                    footer_text = line[1:-1].strip()
                    elements.append(Paragraph(footer_text, footer_style))
                
                # Tags HTML e outras linhas
                elif not line.startswith('<') and not line.startswith('</'):
                    if in_table and current_table_data:
                        table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                        table.setStyle(table_style)
                        elements.append(table)
                        current_table_data = []
                        in_table = False
                    
                    if line:
                        elements.append(Paragraph(line, normal_style))
            
            # Finalizar última tabela se necessário
            if in_table and current_table_data:
                table = Table(current_table_data[1:], colWidths=[2*inch, 4*inch])
                table.setStyle(table_style)
                elements.append(table)
            
            return elements
        
        # Processar markdown e gerar elementos PDF
        elements = markdown_to_reportlab_elements(markdown_processed)
        
        # Gerar PDF
        doc.build(elements)
        
        # Retornar PDF
        buffer.seek(0)
        
        from flask import Response
        return Response(
            buffer.getvalue(),
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'inline; filename="elevador_{elevador_id}.pdf"'
            }
        )
        elements.append(Paragraph("RELATÓRIO DE ELEVADOR", title_style))
        elements.append(Spacer(1, 20))
        
        # Seção: Dados do Elevador
        elements.append(Paragraph("DADOS DO ELEVADOR", section_style))
        
        elevador_data = [
            ['ID do Elevador:', dados['elevador_id']],
            ['Elevação:', f"{dados['elevacao']} mm"],
            ['Cor:', dados['cor']],
            ['Cabine:', f"{dados['cabine_altura']} cm - {dados['cabine_descricao']}"]
        ]
        
        elevador_table = Table(elevador_data, colWidths=[2*inch, 4*inch])
        elevador_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(elevador_table)
        elements.append(Spacer(1, 20))
        
        # Seção: Informações do Cliente
        elements.append(Paragraph("INFORMAÇÕES DO CLIENTE", section_style))
        
        cliente_data = [
            ['Nome:', dados['cliente_nome']],
            ['CPF:', dados['cliente_cpf']]
        ]
        
        cliente_table = Table(cliente_data, colWidths=[2*inch, 4*inch])
        cliente_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5e8')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(cliente_table)
        elements.append(Spacer(1, 20))
        
        # Seção: Endereço de Instalação
        elements.append(Paragraph("ENDEREÇO DE INSTALAÇÃO", section_style))
        
        endereco_data = [
            ['Endereço Completo:', dados['endereco_completo']],
            ['Cidade:', dados['cidade']],
            ['Estado:', f"{dados['estado_nome']} ({dados['estado_sigla']})"],
            ['CEP:', dados['cep']]
        ]
        
        endereco_table = Table(endereco_data, colWidths=[2*inch, 4*inch])
        endereco_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff3e0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(endereco_table)
        elements.append(Spacer(1, 20))
        
        # Seção: Dados do Contrato
        elements.append(Paragraph("DADOS DO CONTRATO", section_style))
        
        contrato_data = [
            ['ID do Contrato:', dados['contrato_id']],
            ['Data da Venda:', dados['data_venda']],
            ['Data de Entrega:', dados['data_entrega']]
        ]
        
        contrato_table = Table(contrato_data, colWidths=[2*inch, 4*inch])
        contrato_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fce4ec')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(contrato_table)
        elements.append(Spacer(1, 20))
        
        # Seção: Observações Técnicas
        elements.append(Paragraph("OBSERVAÇÕES TÉCNICAS", section_style))
        
        observacoes_data = [
            ['Status:', 'Elevador registrado no sistema'],
            ['Tipo de Relatório:', 'Relatório técnico completo'],
            ['Versão do Sistema:', '1.0']
        ]
        
        observacoes_table = Table(observacoes_data, colWidths=[2*inch, 4*inch])
        observacoes_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(observacoes_table)
        elements.append(Spacer(1, 40))
        
        # Rodapé
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=10,
            alignment=1,  # Centralizado
            textColor=colors.HexColor('#7f8c8d')
        )
        
        elements.append(Paragraph(f"Relatório gerado automaticamente em: {dados['data_geracao']}", footer_style))
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"Sistema de Gerenciamento de Elevadores | Relatório de Elevador ID: {dados['elevador_id']}", footer_style))
        
        # Gerar PDF
        doc.build(elements)
        
        # Retornar PDF
        buffer.seek(0)
        
        from flask import Response
        return Response(
            buffer.getvalue(),
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'inline; filename="elevador_{elevador_id}.pdf"'
            }
        )
        
    except Exception as e:
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
        # Obter parâmetros de filtro
        filtro_mes = request.args.get('mes')
        filtro_estado = request.args.get('estado')
        
        # Construir query com filtros
        where_conditions = []
        params = []
        
        if filtro_estado:
            where_conditions.append("e.estado = %s")
            params.append(filtro_estado)
        
        if filtro_mes:
            # Converter formato MM/YYYY para YYYY-MM
            try:
                mes_parts = filtro_mes.split('/')
                if len(mes_parts) == 2:
                    mes_formatado = f"{mes_parts[1]}-{mes_parts[0]}"
                    where_conditions.append("TO_CHAR(c.data_venda, 'YYYY-MM') = %s")
                    params.append(mes_formatado)
            except:
                pass  # Ignorar formato inválido
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        query = f"""
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
            {where_clause}
            GROUP BY e.estado, est.nome
            ORDER BY total_elevadores DESC
        """
        
        cursor.execute(query, params)
        
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

@app.route('/api/relatorios/opcoes-filtros')
def get_opcoes_filtros():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Buscar meses/anos disponíveis
        cursor.execute("""
            SELECT DISTINCT 
                TO_CHAR(c.data_venda, 'YYYY-MM') as mes_ano,
                TO_CHAR(c.data_venda, 'MM/YYYY') as mes_ano_br
            FROM contrato c 
            WHERE c.data_venda IS NOT NULL
            ORDER BY mes_ano DESC
        """)
        meses_raw = cursor.fetchall()
        meses = [row[1] for row in meses_raw if row[1]]
        
        # Buscar estados disponíveis
        cursor.execute("""
            SELECT DISTINCT e.estado, est.nome 
            FROM endereco e
            JOIN estado est ON e.estado = est.sigla
            ORDER BY est.nome
        """)
        estados_raw = cursor.fetchall()
        estados = [{'sigla': row[0], 'nome': row[1]} for row in estados_raw]
        
        return jsonify({
            'meses': meses,
            'estados': estados
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/relatorios/contratos-por-estado/<estado>')
def get_contratos_por_estado(estado):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Obter parâmetro de filtro de mês
        filtro_mes = request.args.get('mes')
        
        # Construir query com filtros
        where_conditions = ["e.estado = %s"]
        params = [estado]
        
        if filtro_mes:
            # Converter formato MM/YYYY para YYYY-MM
            try:
                mes_parts = filtro_mes.split('/')
                if len(mes_parts) == 2:
                    mes_formatado = f"{mes_parts[1]}-{mes_parts[0]}"
                    where_conditions.append("TO_CHAR(c.data_venda, 'YYYY-MM') = %s")
                    params.append(mes_formatado)
            except:
                pass  # Ignorar formato inválido
        
        where_clause = " AND ".join(where_conditions)
        
        query = f"""
            SELECT 
                c.id,
                c.data_venda,
                c.data_entrega,
                c.id_cliente,
                cl.nome as cliente_nome,
                cl.cpf,
                e.rua,
                e.numero,
                e.cidade,
                e.estado,
                est.nome as estado_nome,
                e.cep,
                COUNT(el.id) as total_elevadores,
                STRING_AGG(CAST(el.elevacao AS TEXT), ', ') as elevacoes
            FROM contrato c
            JOIN cliente cl ON c.id_cliente = cl.id
            JOIN endereco e ON cl.id = e.id_cliente
            JOIN estado est ON e.estado = est.sigla
            LEFT JOIN elevador el ON c.id = el.id_contrato
            WHERE {where_clause}
            GROUP BY c.id, c.data_venda, c.data_entrega, c.id_cliente, cl.nome, cl.cpf, 
                     e.rua, e.numero, e.cidade, e.estado, est.nome, e.cep
            ORDER BY c.data_venda DESC NULLS LAST
        """
        
        cursor.execute(query, params)
        
        contratos = []
        for row in cursor.fetchall():
            contratos.append({
                'id': row[0],
                'data_venda': row[1].strftime('%d/%m/%Y') if row[1] else None,
                'data_entrega': row[2].strftime('%d/%m/%Y') if row[2] else None,
                'cliente_id': row[3],
                'cliente_nome': row[4],
                'cliente_cpf': row[5],
                'endereco': {
                    'rua': row[6],
                    'numero': row[7],
                    'cidade': row[8],
                    'estado': row[9],
                    'estado_nome': row[10],
                    'cep': row[11]
                },
                'total_elevadores': row[12] or 0,
                'elevacoes': row[13].split(', ') if row[13] else []
            })
        
        return jsonify(contratos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

@app.route('/api/relatorios/vendas-temporais')
def get_vendas_temporais():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erro na conexão com o banco'}), 500
    
    cursor = conn.cursor()
    try:
        # Obter parâmetros de filtro
        filtro_estado = request.args.get('estado')
        periodo = request.args.get('periodo', 'ultimo-ano')
        intervalo = request.args.get('intervalo', 'mes')
        data_inicio = request.args.get('dataInicio')
        data_fim = request.args.get('dataFim')
        
        # Construir condições WHERE
        where_conditions = []
        params = []
        
        if filtro_estado:
            where_conditions.append("e.estado = %s")
            params.append(filtro_estado)
        
        # Definir período baseado na seleção
        if periodo == 'personalizado' and data_inicio and data_fim:
            where_conditions.append("c.data_venda BETWEEN %s AND %s")
            params.extend([data_inicio, data_fim])
        elif periodo == 'ultimo-mes':
            where_conditions.append("c.data_venda >= CURRENT_DATE - INTERVAL '1 month'")
        elif periodo == 'ultimos-3-meses':
            where_conditions.append("c.data_venda >= CURRENT_DATE - INTERVAL '3 months'")
        elif periodo == 'ultimos-6-meses':
            where_conditions.append("c.data_venda >= CURRENT_DATE - INTERVAL '6 months'")
        elif periodo == 'ultimo-ano':
            where_conditions.append("c.data_venda >= CURRENT_DATE - INTERVAL '1 year'")
        
        # Adicionar condição para excluir datas nulas
        where_conditions.append("c.data_venda IS NOT NULL")
        
        # Determinar formato de agrupamento baseado no intervalo
        if intervalo == 'dia':
            date_format = "DATE(c.data_venda)"
            date_label = "TO_CHAR(c.data_venda, 'DD/MM/YYYY')"
        elif intervalo == 'semana':
            date_format = "DATE_TRUNC('week', c.data_venda)"
            date_label = "'Semana ' || TO_CHAR(c.data_venda, 'WW/YYYY')"
        elif intervalo == 'trimestre':
            date_format = "DATE_TRUNC('quarter', c.data_venda)"
            date_label = "TO_CHAR(c.data_venda, 'Q') || 'º Tri/' || TO_CHAR(c.data_venda, 'YYYY')"
        elif intervalo == 'ano':
            date_format = "DATE_TRUNC('year', c.data_venda)"
            date_label = "TO_CHAR(c.data_venda, 'YYYY')"
        else:  # mes
            date_format = "DATE_TRUNC('month', c.data_venda)"
            date_label = "TO_CHAR(c.data_venda, 'MM/YYYY')"
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        query = f"""
            SELECT 
                {date_format} as periodo,
                {date_label} as periodo_label,
                COUNT(el.id) as total_elevadores,
                COUNT(DISTINCT c.id_cliente) as total_clientes,
                COUNT(DISTINCT c.id) as total_contratos,
                AVG(el.elevacao) as elevacao_media
            FROM contrato c
            JOIN cliente cl ON c.id_cliente = cl.id
            JOIN endereco e ON cl.id = e.id_cliente
            LEFT JOIN elevador el ON c.id = el.id_contrato
            {where_clause}
            GROUP BY {date_format}, {date_label}
            ORDER BY periodo ASC
        """
        
        cursor.execute(query, params)
        
        vendas_temporais = []
        for row in cursor.fetchall():
            vendas_temporais.append({
                'periodo': row[0].strftime('%Y-%m-%d') if row[0] else None,
                'periodo_label': row[1],
                'total_elevadores': row[2] or 0,
                'total_clientes': row[3] or 0,
                'total_contratos': row[4] or 0,
                'elevacao_media': round(float(row[5]) if row[5] else 0, 2)
            })
        
        return jsonify(vendas_temporais)
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
                   cab.altura,
                   en.cidade, en.estado
            FROM elevador e
            JOIN contrato c ON e.id_contrato = c.id
            JOIN cliente cl ON c.id_cliente = cl.id
            JOIN cabine cab ON e.id_cabine = cab.id
            LEFT JOIN endereco en ON cl.id = en.id_cliente
            WHERE c.data_entrega IS NOT NULL
            ORDER BY c.data_entrega
        """)
        eventos = []
        for row in cursor.fetchall():
            # Formatação do título: Nome - Cidade, Estado
            cidade = row[7] if row[7] else ''
            estado = row[8] if row[8] else ''
            
            if cidade and estado:
                titulo = f'{row[5]} - {cidade}, {estado}'
            elif cidade:
                titulo = f'{row[5]} - {cidade}'
            else:
                titulo = row[5]  # Apenas o nome do cliente
            
            eventos.append({
                'id': row[0],
                'title': titulo,
                'start': row[3].isoformat(),
                'color': row[1] or '#007bff',
                'extendedProps': {
                    'elevador_id': row[0],
                    'cor': row[1],
                    'elevacao': row[2],
                    'data_venda': row[4].isoformat() if row[4] else None,
                    'cliente_nome': row[5],
                    'altura_cabine': row[6],
                    'cidade': cidade,
                    'estado': estado
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
