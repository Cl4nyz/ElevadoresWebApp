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
            SELECT c.id, c.nome, c.comercial, c.documento, c.email,
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
                if row[5]:  # Se há rua (endereco existe)
                    cliente_existente['enderecos'].append({
                        'id': row[11],
                        'rua': row[5],
                        'numero': row[6],
                        'cidade': row[7],
                        'estado': row[8],
                        'complemento': row[9],
                        'cep': row[10]
                    })
            else:
                # Cria novo cliente
                cliente = {
                    'id': row[0],
                    'nome': row[1],
                    'comercial': row[2] if row[2] is not None else False,
                    'documento': row[3] if row[3] else '',
                    'email': row[4] if row[4] else '',
                    'cpf': row[3] if not row[2] else '',  # Para compatibilidade: documento como cpf se pessoa física
                    'cnpj': row[3] if row[2] else '',    # Para compatibilidade: documento como cnpj se comercial
                    'enderecos': []
                }
                if row[5]:  # Se há rua (endereco existe)
                    cliente['enderecos'].append({
                        'id': row[11],
                        'rua': row[5],
                        'numero': row[6],
                        'cidade': row[7],
                        'estado': row[8],
                        'complemento': row[9],
                        'cep': row[10]
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
        
        # Determinar se é comercial
        comercial = data.get('comercial', False)
        
        # Validar documento se fornecido
        documento = data.get('documento')
        if documento:
            documento = str(documento).strip()
            # Remove caracteres não numéricos
            import re
            documento = re.sub(r'\D', '', documento)
            
            if comercial:
                # Validação CNPJ
                if len(documento) != 14:
                    return jsonify({'error': 'CNPJ deve ter exatamente 14 dígitos numéricos'}), 400
                # Verificar se não é uma sequência de números iguais
                if documento == documento[0] * 14:
                    return jsonify({'error': 'CNPJ inválido'}), 400
            else:
                # Validação CPF
                if len(documento) != 11:
                    return jsonify({'error': 'CPF deve ter exatamente 11 dígitos numéricos'}), 400
                # Verificar se não é uma sequência de números iguais
                if documento == documento[0] * 11:
                    return jsonify({'error': 'CPF inválido'}), 400
        else:
            documento = None
        
        # Inserir cliente (sem especificar ID - será auto-incrementado)
        cursor.execute("""
            INSERT INTO cliente (nome, email, comercial, documento) 
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (data['nome'].strip(), (data.get('email') or '').strip() or None, comercial, documento))
        
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
        
        # Determinar se é comercial
        comercial = data.get('comercial', False)
        
        # Validar documento se fornecido
        documento = data.get('documento')
        if documento:
            documento = str(documento).strip()
            # Remove caracteres não numéricos
            import re
            documento = re.sub(r'\D', '', documento)
            
            if comercial:
                # Validação CNPJ
                if len(documento) != 14:
                    return jsonify({'error': 'CNPJ deve ter exatamente 14 dígitos numéricos'}), 400
                # Verificar se não é uma sequência de números iguais
                if documento == documento[0] * 14:
                    return jsonify({'error': 'CNPJ inválido'}), 400
            else:
                # Validação CPF
                if len(documento) != 11:
                    return jsonify({'error': 'CPF deve ter exatamente 11 dígitos numéricos'}), 400
                # Verificar se não é uma sequência de números iguais
                if documento == documento[0] * 11:
                    return jsonify({'error': 'CPF inválido'}), 400
        else:
            documento = None
            
        cursor.execute("""
            UPDATE cliente SET nome = %s, email = %s, comercial = %s, documento = %s 
            WHERE id = %s
        """, (data['nome'].strip(), (data.get('email') or '').strip() or None, comercial, documento, cliente_id))
        
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

# API para vendedores
@app.route('/api/vendedores', methods=['GET'])
def get_vendedores():
    """Retorna lista de vendedores disponíveis"""
    vendedores = ['Deuclides', 'Leandro', 'Jean']
    return jsonify(vendedores)

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
            SELECT c.id, c.data_venda, c.data_entrega, c.id_cliente, cl.nome, c.vendedor
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
                'cliente_nome': row[4],
                'vendedor': row[5]
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
            INSERT INTO contrato (data_venda, data_entrega, id_cliente, vendedor) 
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (data_venda, data_entrega, data['id_cliente'], data.get('vendedor')))
        
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
            SELECT c.id, c.data_venda, c.data_entrega, c.id_cliente, c.vendedor,
                   cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.comercial, cl.documento,
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
            'vendedor': row[4],
            'cliente_nome': row[5],
            'cliente_cpf': row[6],  # Mantém para compatibilidade
            'cliente_comercial': row[7] if row[7] is not None else False,
            'cliente_documento': row[8] if row[8] else row[6],  # documento ou cpf
            'endereco': {
                'rua': row[9],
                'numero': row[10],
                'cidade': row[11],
                'estado': row[12],
                'cep': row[13],
                'complemento': row[14]
            } if row[9] else None
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
            UPDATE contrato SET data_venda = %s, data_entrega = %s, id_cliente = %s, vendedor = %s 
            WHERE id = %s
        """, (data_venda, data_entrega, data['id_cliente'], data.get('vendedor'), contrato_id))
        
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
                SELECT e.id, e.id_contrato, e.comando, e.observacao, 
                       e.porta_inferior, e.porta_superior, e.cor, e.status
                FROM elevador e
                WHERE e.id_contrato = %s
                ORDER BY e.id
            """, (contrato_id,))
        else:
            # Buscar todos os elevadores
            cursor.execute("""
                SELECT e.id, e.id_contrato, e.comando, e.observacao, 
                       e.porta_inferior, e.porta_superior, e.cor, e.status
                FROM elevador e
                ORDER BY e.id
            """)
        
        elevadores = []
        for row in cursor.fetchall():
            elevador_id = row[0]
            
            # Buscar dados da cabine
            cursor.execute("""
                SELECT altura, largura, profundidade, piso, montada, 
                       lado_entrada, lado_saida
                FROM cabine WHERE id_elevador = %s
            """, (elevador_id,))
            cabine_data = cursor.fetchone()
            
            # Buscar dados da coluna
            cursor.execute("""
                SELECT elevacao, montada
                FROM coluna WHERE id_elevador = %s
            """, (elevador_id,))
            coluna_data = cursor.fetchone()
            
            # Buscar adicionais
            cursor.execute("""
                SELECT cancela, porta, portao, barreira_eletronica,
                       lados_enclausuramento, sensor_esmagamento,
                       rampa_acesso, nobreak, galvanizada
                FROM adicionais WHERE id_elevador = %s
            """, (elevador_id,))
            adicionais_data = cursor.fetchone()
            
            # Buscar dados do contrato para mostrar informações completas
            cursor.execute("""
                SELECT c.data_venda, c.data_entrega, cl.nome
                FROM contrato c
                LEFT JOIN cliente cl ON c.id_cliente = cl.id
                WHERE c.id = %s
            """, (row[1],))  # row[1] é id_contrato
            contrato_data = cursor.fetchone()
            
            elevador = {
                'id': row[0],
                'id_contrato': row[1],
                'comando': row[2],
                'observacao': row[3],
                'porta_inferior': row[4],
                'porta_superior': row[5],
                'cor': row[6],
                'status': row[7],
                'cabine': {
                    'altura': cabine_data[0] if cabine_data else None,
                    'largura': cabine_data[1] if cabine_data else None,
                    'profundidade': cabine_data[2] if cabine_data else None,
                    'piso': cabine_data[3] if cabine_data else None,
                    'montada': cabine_data[4] if cabine_data else False,
                    'lado_entrada': cabine_data[5] if cabine_data else None,
                    'lado_saida': cabine_data[6] if cabine_data else None,
                    # Descrição calculada para compatibilidade
                    'descricao': f"{cabine_data[0]}x{cabine_data[1]}x{cabine_data[2]}" if cabine_data and all([cabine_data[0], cabine_data[1], cabine_data[2]]) else "N/A"
                } if cabine_data else None,
                'coluna': {
                    'elevacao': coluna_data[0] if coluna_data else None,
                    'montada': coluna_data[1] if coluna_data else False
                } if coluna_data else None,
                'adicionais': {
                    'cancela': adicionais_data[0] if adicionais_data else 0,
                    'porta': adicionais_data[1] if adicionais_data else 0,
                    'portao': adicionais_data[2] if adicionais_data else 0,
                    'barreira_eletronica': adicionais_data[3] if adicionais_data else 0,
                    'lados_enclausuramento': adicionais_data[4] if adicionais_data else 0,
                    'sensor_esmagamento': adicionais_data[5] if adicionais_data else 0,
                    'rampa_acesso': adicionais_data[6] if adicionais_data else 0,
                    'nobreak': adicionais_data[7] if adicionais_data else 0,
                    'galvanizada': adicionais_data[8] if adicionais_data else False
                } if adicionais_data else None,
                # Campos adicionais para compatibilidade com o frontend
                'cliente_nome': contrato_data[2] if contrato_data else None,
                'data_entrega': contrato_data[1].isoformat() if contrato_data and contrato_data[1] else None,
                'cabine_descricao': f"{cabine_data[0]}x{cabine_data[1]}x{cabine_data[2]}" if cabine_data else "N/A",
                'elevacao': coluna_data[0] if coluna_data else None
            }
            
            elevadores.append(elevador)
        
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
        if not data.get('id_contrato'):
            return jsonify({'error': 'Contrato é obrigatório'}), 400
        if not data.get('comando'):
            return jsonify({'error': 'Comando é obrigatório'}), 400
        if not data.get('cabine') or not data['cabine'].get('altura') or not data['cabine'].get('largura') or not data['cabine'].get('profundidade'):
            return jsonify({'error': 'Dados da cabine (altura, largura, profundidade) são obrigatórios'}), 400
        if not data.get('coluna') or not data['coluna'].get('elevacao'):
            return jsonify({'error': 'Elevação da coluna é obrigatória'}), 400
        
        # Validar se contrato existe
        cursor.execute("SELECT id FROM contrato WHERE id = %s", (data['id_contrato'],))
        if not cursor.fetchone():
            return jsonify({'error': 'Contrato não encontrado'}), 400
        
        # Inserir elevador principal
        cursor.execute("""
            INSERT INTO elevador (id_contrato, comando, observacao, porta_inferior, porta_superior, cor, status) 
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            data['id_contrato'],
            data['comando'],
            data.get('observacao'),
            data.get('porta_inferior'),
            data.get('porta_superior'),
            data.get('cor'),
            data.get('status', 'Não iniciado')  # Valor padrão
        ))
        
        elevador_id = cursor.fetchone()[0]
        
        # Inserir dados da cabine
        cabine = data['cabine']
        cursor.execute("""
            INSERT INTO cabine (id_elevador, altura, largura, profundidade, piso, montada, lado_entrada, lado_saida)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            elevador_id,
            cabine['altura'],
            cabine['largura'],
            cabine['profundidade'],
            cabine.get('piso'),
            cabine.get('montada', False),
            cabine.get('lado_entrada'),
            cabine.get('lado_saida')
        ))
        
        # Inserir dados da coluna
        coluna = data['coluna']
        cursor.execute("""
            INSERT INTO coluna (id_elevador, elevacao, montada)
            VALUES (%s, %s, %s)
        """, (
            elevador_id,
            coluna['elevacao'],
            coluna.get('montada', False)
        ))
        
        # Inserir adicionais
        adicionais = data.get('adicionais', {})
        cursor.execute("""
            INSERT INTO adicionais (id_elevador, cancela, porta, portao, barreira_eletronica,
                                  lados_enclausuramento, sensor_esmagamento, rampa_acesso, nobreak, galvanizada)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            elevador_id,
            adicionais.get('cancela', 0),
            adicionais.get('porta', 0),
            adicionais.get('portao', 0),
            adicionais.get('barreira_eletronica', 0),
            adicionais.get('lados_enclausuramento', 0),
            adicionais.get('sensor_esmagamento', 0),
            adicionais.get('rampa_acesso', 0),
            adicionais.get('nobreak', 0),
            adicionais.get('galvanizada', False)
        ))
        
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
        # Atualizar dados principais do elevador
        cursor.execute("""
            UPDATE elevador 
            SET id_contrato = %s, comando = %s, observacao = %s, 
                porta_inferior = %s, porta_superior = %s, cor = %s, status = %s 
            WHERE id = %s
        """, (
            data.get('id_contrato'),
            data.get('comando'),
            data.get('observacao'),
            data.get('porta_inferior'),
            data.get('porta_superior'),
            data.get('cor'),
            data.get('status'),
            elevador_id
        ))
        
        # Atualizar dados da cabine
        if data.get('cabine'):
            cabine = data['cabine']
            cursor.execute("""
                UPDATE cabine 
                SET altura = %s, largura = %s, profundidade = %s, piso = %s, 
                    montada = %s, lado_entrada = %s, lado_saida = %s
                WHERE id_elevador = %s
            """, (
                cabine.get('altura'),
                cabine.get('largura'),
                cabine.get('profundidade'),
                cabine.get('piso'),
                cabine.get('montada', False),
                cabine.get('lado_entrada'),
                cabine.get('lado_saida'),
                elevador_id
            ))
        
        # Atualizar dados da coluna
        if data.get('coluna'):
            coluna = data['coluna']
            cursor.execute("""
                UPDATE coluna 
                SET elevacao = %s, montada = %s
                WHERE id_elevador = %s
            """, (
                coluna.get('elevacao'),
                coluna.get('montada', False),
                elevador_id
            ))
        
        # Atualizar adicionais
        if data.get('adicionais'):
            adicionais = data['adicionais']
            cursor.execute("""
                UPDATE adicionais 
                SET cancela = %s, porta = %s, portao = %s, barreira_eletronica = %s,
                    lados_enclausuramento = %s, sensor_esmagamento = %s, 
                    rampa_acesso = %s, nobreak = %s, galvanizada = %s
                WHERE id_elevador = %s
            """, (
                adicionais.get('cancela', 0),
                adicionais.get('porta', 0),
                adicionais.get('portao', 0),
                adicionais.get('barreira_eletronica', 0),
                adicionais.get('lados_enclausuramento', 0),
                adicionais.get('sensor_esmagamento', 0),
                adicionais.get('rampa_acesso', 0),
                adicionais.get('nobreak', 0),
                adicionais.get('galvanizada', False),
                elevador_id
            ))
        
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
                e.id, e.comando, e.observacao, e.porta_inferior, e.porta_superior, e.cor,
                c.id as contrato_id, c.data_venda, c.data_entrega, c.vendedor,
                cl.nome as cliente_nome, cl.documento,
                cab.altura as cabine_altura, cab.largura as cabine_largura, 
                cab.profundidade as cabine_profundidade, cab.piso as cabine_piso,
                cab.montada as cabine_montada, cab.lado_entrada, cab.lado_saida,
                col.elevacao, col.montada as coluna_montada,
                ad.cancela, ad.porta, ad.portao, ad.barreira_eletronica,
                ad.lados_enclausuramento, ad.sensor_esmagamento, ad.rampa_acesso,
                ad.nobreak, ad.galvanizada,
                en.rua, en.numero, en.complemento, en.cidade, en.estado, en.cep,
                est.nome as estado_nome
            FROM elevador e
            LEFT JOIN contrato c ON e.id_contrato = c.id
            LEFT JOIN cliente cl ON c.id_cliente = cl.id
            LEFT JOIN cabine cab ON e.id = cab.id_elevador
            LEFT JOIN coluna col ON e.id = col.id_elevador
            LEFT JOIN adicionais ad ON e.id = ad.id_elevador
            LEFT JOIN endereco en ON cl.id = en.id_cliente
            LEFT JOIN estado est ON en.estado = est.sigla
            WHERE e.id = %s
        """
        
        cursor.execute(query, (elevador_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Elevador não encontrado'}), 404
        
        # Imports para PDF
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch, cm
        from reportlab.lib import colors
        from reportlab.graphics.shapes import Drawing, Rect, Line, Polygon, String
        from io import BytesIO
        import os
        from datetime import datetime
        
        # ========== CONSTANTES DE CONFIGURAÇÃO DO PDF ==========
        # Margens do documento (você pode alterar estas margens individualmente)
        MARGEM_ESQUERDA = 0.05*cm   # Margem esquerda - reduzida para aproveitar mais espaço
        MARGEM_DIREITA = 0.05*cm    # Margem direita - reduzida para aproveitar mais espaço  
        MARGEM_SUPERIOR = 0.3*cm    # Margem superior
        MARGEM_INFERIOR = 0.3*cm    # Margem inferior
        
        # Tamanhos de fonte
        FONTE_TITULO = 32
        FONTE_SECAO = 20
        FONTE_TABELA = 14
        FONTE_CABECALHO = 14
        FONTE_RODAPE = 12
        FONTE_DESENHO = 12
        
        # Espaçamentos
        ESPACAMENTO_TITULO = 16
        ESPACAMENTO_SECAO_ANTES = 16
        ESPACAMENTO_SECAO_DEPOIS = 8
        ESPACAMENTO_RODAPE = 4
        ESPACAMENTO_TABELA_VERTICAL = 6
        ESPACAMENTO_TABELA_HORIZONTAL = 4
        ESPACAMENTO_GERAL = 6
        
        # Dimensões de imagem
        LOGO_LARGURA = 3*inch
        LOGO_ALTURA = 0.8*inch
        
        # Dimensões de tabelas - otimizadas para melhor distribuição horizontal
        LARGURA_COLUNA_PEQUENA = 2*cm
        LARGURA_COLUNA_MEDIA = 2.5*cm
        LARGURA_COLUNA_GRANDE = 4*cm
        LARGURA_CABECALHO_1 = 3.5*cm      # Aumentada ligeiramente
        LARGURA_CABECALHO_2 = 4.5*cm      # Aumentada para melhor proporção
        LARGURA_CABECALHO_3 = 14*cm        # Aumentada para aproveitar espaço
        LARGURA_DESENHO_CABINE = 6*cm     # Aumentada para melhor proporção
        LARGURA_DESENHO_VISUAL = 10*cm    # Aumentada para aproveitar espaço extra
        
        # Larguras específicas para cada seção - otimizadas para melhor distribuição
        LARGURA_INFO_COLUNA_1 = 3*cm      # Aumentada para melhor distribuição
        LARGURA_INFO_COLUNA_2 = 4.5*cm    # Aumentada para aproveitar espaço
        LARGURA_INFO_COLUNA_3 = 3*cm      # Aumentada para melhor distribuição
        LARGURA_INFO_COLUNA_4 = 4.5*cm    # Aumentada para aproveitar espaço
        
        LARGURA_CABINE_COLUNA_1 = 2.5*cm  # Aumentada ligeiramente
        LARGURA_CABINE_COLUNA_2 = 3.5*cm  # Aumentada para melhor proporção
        
        LARGURA_ESTRUTURA_COLUNA_1 = 3.5*cm   # Aumentada para melhor distribuição
        LARGURA_ESTRUTURA_COLUNA_2 = 3*cm     # Aumentada ligeiramente
        LARGURA_ESTRUTURA_COLUNA_3 = 3.5*cm   # Aumentada para melhor distribuição
        LARGURA_ESTRUTURA_COLUNA_4 = 3*cm     # Aumentada ligeiramente
        
        LARGURA_ADICIONAIS_COLUNA_1 = 6*cm  # Aumentada para melhor distribuição
        LARGURA_ADICIONAIS_COLUNA_2 = 1*cm    # Aumentada para aproveitar espaço
        LARGURA_ADICIONAIS_COLUNA_3 = 6*cm  # Aumentada para melhor distribuição
        LARGURA_ADICIONAIS_COLUNA_4 = 1*cm    # Aumentada para aproveitar espaço
        
        # Espaçamentos adicionais
        ESPACAMENTO_TABELA_SECAO = 6
        
        # Dimensões e configurações do desenho da cabine
        DESENHO_LARGURA = 180
        DESENHO_ALTURA = 120
        DESENHO_ESCALA = 1.5
        DESENHO_LARGURA_PADRAO = 50
        DESENHO_ALTURA_PADRAO = 35
        DESENHO_MARGEM_PLATAFORMA = 6
        DESENHO_TAMANHO_SETA = 12
        DESENHO_OFFSET_SETA_DUPLA = 15
        DESENHO_OFFSET_SETA_Y = 18
        DESENHO_OFFSET_SETA_X = 18
        DESENHO_POSICAO_DIMENSOES_Y = 10
        DESENHO_POSICAO_CENTRO_X = 90
        DESENHO_POSICAO_CENTRO_Y = 60
        
        # Dimensões do desenho da cabine
        DESENHO_LARGURA = 180
        DESENHO_ALTURA = 120
        ESCALA_CABINE = 1.5
        MARGEM_PLATAFORMA = 6
        # ====================================================
        
        # Preparar dados
        endereco_completo = 'Não informado'
        if result[30]:  # rua
            endereco_completo = f"{result[30]}, {result[31]}"
            if result[32]:  # complemento
                endereco_completo += f", {result[32]}"
            endereco_completo += f" - {result[33]}/{result[34]} - CEP: {result[35]}"
        
        # Criar buffer em memória
        buffer = BytesIO()
        
        # Configurar documento PDF - margens configuráveis
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                              rightMargin=MARGEM_DIREITA, leftMargin=MARGEM_ESQUERDA, 
                              topMargin=MARGEM_SUPERIOR, bottomMargin=MARGEM_INFERIOR)
        
        # Configurar estilos com fontes maiores
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle('CustomTitle',
                                   parent=styles['Heading1'],
                                   fontSize=FONTE_TITULO,
                                   spaceAfter=ESPACAMENTO_TITULO,
                                   alignment=1)  # Centralizado
        
        section_style = ParagraphStyle('SectionStyle',
                                     parent=styles['Heading2'],
                                     fontSize=FONTE_SECAO,
                                     spaceAfter=ESPACAMENTO_SECAO_DEPOIS,
                                     spaceBefore=ESPACAMENTO_SECAO_ANTES,
                                     textColor=colors.darkblue,
                                     alignment=1)
        
        small_style = ParagraphStyle('Small',
                                   parent=styles['Normal'],
                                   fontSize=FONTE_RODAPE,
                                   spaceAfter=ESPACAMENTO_RODAPE)
        
        text_style = ParagraphStyle('Text',
                                    parent=styles['Normal'],
                                    fontSize=FONTE_TABELA,
                                    spaceAfter=ESPACAMENTO_GERAL)
        
        # Conteúdo do PDF
        story = []
        
        # # Título principal
        # title = Paragraph(f"RELATÓRIO DO ELEVADOR #{result[0]}", title_style)
        # story.append(title)
        # story.append(Spacer(1, 4))

        # ====== CABEÇALHO COM LOGO, PEDIDO E CLIENTE ======
        pedido_data = [
            ['OS:', str(result[6]) if result[6] else 'N/A'],
            ['Data Venda:', result[7].strftime('%d/%m/%Y') if result[7] else 'N/A'],
            ['Data Entrega:', result[8].strftime('%d/%m/%Y') if result[8] else 'N/A']
        ]

        if result[33] and result[34]:
            cidade_estado = f"{result[33]}, {result[34]}"
        elif result[33]:
            cidade_estado = result[33]
        else:
            cidade_estado = 'N/A'

        cliente_data = [
            ['Cliente:', result[10] or 'N/A'],
            ['Cidade:', cidade_estado]
        ]

        # Montar logo + pedido_data lado a lado
        logo_path = os.path.join(app.static_folder, 'images', 'home.png')
        logo_img = None
        if os.path.exists(logo_path):
            logo_img = Image(logo_path, width=LOGO_LARGURA, height=LOGO_ALTURA)
            logo_img.hAlign = 'LEFT'

        pedido_table = Table(pedido_data, colWidths=[LARGURA_CABECALHO_1, LARGURA_CABECALHO_2])
        pedido_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), FONTE_CABECALHO),
            ('BOTTOMPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('TOPPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ]))

        # Cabeçalho: logo à esquerda, pedido à direita - larguras otimizadas
        if logo_img:
            cabecalho_table = Table([[logo_img, pedido_table]], colWidths=[8*cm, 6*cm])
        else:
            cabecalho_table = Table([['', pedido_table]], colWidths=[8*cm, 6*cm])
        cabecalho_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(cabecalho_table)

        # Cliente_data logo abaixo do cabeçalho
        cliente_table = Table(cliente_data, colWidths=[LARGURA_CABECALHO_1, LARGURA_CABECALHO_3])
        cliente_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), FONTE_CABECALHO),
            ('BOTTOMPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('TOPPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ]))
        story.append(cliente_table)
        story.append(Spacer(1, ESPACAMENTO_GERAL))
        
        # Função para criar desenho da cabine
        def criar_desenho_cabine(largura, profundidade, lado_entrada, lado_saida):
            try:
                # Criar desenho
                drawing = Drawing(DESENHO_LARGURA, DESENHO_ALTURA)
                
                # Dimensões base para o desenho (escaladas)
                scale = DESENHO_ESCALA
                
                # Usar dimensões reais se disponíveis, senão usar valores padrão
                cab_width = float(largura) * scale if largura else DESENHO_LARGURA_PADRAO
                cab_height = float(profundidade) * scale if profundidade else DESENHO_ALTURA_PADRAO
                
                # Centralizar desenho
                start_x = DESENHO_POSICAO_CENTRO_X - cab_width/2
                start_y = DESENHO_POSICAO_CENTRO_Y - cab_height/2
                
                # Desenhar cabine (retângulo principal)
                cabine_rect = Rect(start_x, start_y, cab_width, cab_height)
                cabine_rect.fillColor = colors.lightblue
                cabine_rect.strokeColor = colors.black
                cabine_rect.strokeWidth = 2
                drawing.add(cabine_rect)
                
                # Desenhar plataforma (retângulo menor dentro da cabine)
                plat_margin = DESENHO_MARGEM_PLATAFORMA
                plataforma = Rect(start_x + plat_margin, start_y + plat_margin, 
                                cab_width - 2*plat_margin, cab_height - 2*plat_margin)
                plataforma.fillColor = colors.lightyellow
                plataforma.strokeColor = colors.darkgray
                plataforma.strokeWidth = 1
                drawing.add(plataforma)
                
                # Função para desenhar seta
                def desenhar_seta(x, y, direcao, cor=colors.red):
                    seta_tamanho = DESENHO_TAMANHO_SETA
                    if direcao == 'direita':
                        # Seta para direita
                        seta = Polygon([x, y, x+seta_tamanho, y+seta_tamanho/2, x, y+seta_tamanho, x+2, y+seta_tamanho/2])
                    elif direcao == 'esquerda':
                        # Seta para esquerda
                        seta = Polygon([x+seta_tamanho, y, x, y+seta_tamanho/2, x+seta_tamanho, y+seta_tamanho, x+seta_tamanho-2, y+seta_tamanho/2])
                    elif direcao == 'cima':
                        # Seta para cima
                        seta = Polygon([x, y+seta_tamanho, x+seta_tamanho/2, y, x+seta_tamanho, y+seta_tamanho, x+seta_tamanho/2, y+seta_tamanho-2])
                    elif direcao == 'baixo':
                        # Seta para baixo
                        seta = Polygon([x, y, x+seta_tamanho/2, y+seta_tamanho, x+seta_tamanho, y, x+seta_tamanho/2, y+2])
                    else:
                        return
                    
                    seta.fillColor = cor
                    seta.strokeColor = colors.darkred
                    seta.strokeWidth = 1
                    drawing.add(seta)
                
                # Mapear lados para posições e direções
                lados_config = {
                    'frente': {'pos': (start_x + cab_width/2 - DESENHO_TAMANHO_SETA/2, start_y - DESENHO_OFFSET_SETA_Y), 'dir': 'cima'},
                    'tras': {'pos': (start_x + cab_width/2 - DESENHO_TAMANHO_SETA/2, start_y + cab_height + 6), 'dir': 'baixo'},
                    'direita': {'pos': (start_x + cab_width + 6, start_y + cab_height/2 - DESENHO_TAMANHO_SETA/2), 'dir': 'direita'},
                    'esquerda': {'pos': (start_x - DESENHO_OFFSET_SETA_X, start_y + cab_height/2 - DESENHO_TAMANHO_SETA/2), 'dir': 'esquerda'}
                }
                
                # Desenhar seta de entrada
                if lado_entrada and lado_entrada.lower() in lados_config:
                    config = lados_config[lado_entrada.lower()]
                    desenhar_seta(config['pos'][0], config['pos'][1], config['dir'], colors.green)
                    
                    # Adicionar texto "E"
                    entrada_text = String(config['pos'][0] + DESENHO_TAMANHO_SETA/2, config['pos'][1] - 8, 'E')
                    entrada_text.fontSize = FONTE_DESENHO
                    entrada_text.fillColor = colors.green
                    entrada_text.textAnchor = 'middle'
                    drawing.add(entrada_text)
                
                # Desenhar seta de saída
                if lado_saida and lado_saida.lower() in lados_config:
                    config = lados_config[lado_saida.lower()]
                    # Usar posição ligeiramente deslocada se for o mesmo lado da entrada
                    offset_x = DESENHO_OFFSET_SETA_DUPLA if lado_entrada == lado_saida else 0
                    desenhar_seta(config['pos'][0] + offset_x, config['pos'][1], config['dir'], colors.red)
                    
                    # Adicionar texto "S"
                    saida_text = String(config['pos'][0] + offset_x + DESENHO_TAMANHO_SETA/2, config['pos'][1] - 8, 'S')
                    saida_text.fontSize = FONTE_DESENHO
                    saida_text.fillColor = colors.red
                    saida_text.textAnchor = 'middle'
                    drawing.add(saida_text)
                
                # Adicionar dimensões como texto
                if largura and profundidade:
                    dim_text = String(DESENHO_POSICAO_CENTRO_X, DESENHO_POSICAO_DIMENSOES_Y, f'{largura} x {profundidade}')
                    dim_text.fontSize = FONTE_DESENHO
                    dim_text.fillColor = colors.black
                    dim_text.textAnchor = 'middle'
                    drawing.add(dim_text)
                
                return drawing
                
            except Exception as e:
                print(f"Erro ao criar desenho da cabine: {e}")
                # Retornar desenho vazio em caso de erro
                return Drawing(DESENHO_LARGURA, DESENHO_ALTURA)
        
        # SETOR 1: INFORMAÇÕES BÁSICAS
        section_title = Paragraph("INFORMAÇÕES BÁSICAS", section_style)
        story.append(section_title)
        
        info_data = [
            ['Comando:', result[1] or 'Não informado', 'Cor:', result[5] or 'Não especificada'],
            ['Porta Inferior:', result[3] or 'N/A', 'Porta Superior:', result[4] or 'N/A']]
        
        info_table = Table(info_data, colWidths=[LARGURA_INFO_COLUNA_1, LARGURA_INFO_COLUNA_2, LARGURA_INFO_COLUNA_3, LARGURA_INFO_COLUNA_4])
        info_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), FONTE_TABELA),
            ('BOTTOMPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('TOPPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
        ]))
        story.append(info_table)
        story.append(Spacer(1, ESPACAMENTO_TABELA_SECAO))

        if result[2]:
            text = f'Observação: {result[2]}.'
        else:
            text = 'Sem observações.'
        obs = Paragraph(text, text_style)
        story.append(obs)
        
        # SETOR 2 e 3: CABINE E DESENHO (lado a lado)
        section_title = Paragraph("CABINE E VISUALIZAÇÃO", section_style)
        story.append(section_title)
        
        # Dados da cabine
        cabine_data = [
            ['Altura:', str(result[12]) if result[12] else 'N/A'],
            ['Largura:', str(result[13]) if result[13] else 'N/A'],
            ['Profundidade:', str(result[14]) if result[14] else 'N/A'],
            ['Piso:', result[15] or 'N/A'],
            ['Montada:', 'Sim' if result[16] else 'Não'],
            ['Entrada:', result[17] or 'N/A'],
            ['Saída:', result[18] or 'N/A']
        ]
        
        cabine_table = Table(cabine_data, colWidths=[LARGURA_CABINE_COLUNA_1, LARGURA_CABINE_COLUNA_2])
        cabine_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), FONTE_TABELA),
            ('BOTTOMPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('TOPPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ]))
        
        # Criar desenho da cabine
        desenho_cabine = criar_desenho_cabine(
            result[13],  # largura
            result[14],  # profundidade  
            result[17],  # lado_entrada
            result[18]   # lado_saida
        )
        
        # Juntar cabine e desenho lado a lado
        cabine_desenho_table = Table([[cabine_table, desenho_cabine]], colWidths=[LARGURA_DESENHO_CABINE, LARGURA_DESENHO_VISUAL])
        cabine_desenho_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(cabine_desenho_table)
        story.append(Spacer(1, ESPACAMENTO_TABELA_SECAO))
        
        # SETOR 4: COLUNA E ESTRUTURA
        section_title = Paragraph("COLUNA E ESTRUTURA", section_style)
        story.append(section_title)
        
        coluna_data = [
            ['Elevação:', str(result[19]) if result[19] else 'N/A', 'Coluna Montada:', 'Sim' if result[20] else 'Não'],
            ['Galvanizada:', 'Sim' if result[29] else 'Não', '', '']
        ]
        
        coluna_table = Table(coluna_data, colWidths=[LARGURA_ESTRUTURA_COLUNA_1, LARGURA_ESTRUTURA_COLUNA_2, LARGURA_ESTRUTURA_COLUNA_3, LARGURA_ESTRUTURA_COLUNA_4])
        coluna_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), FONTE_TABELA),
            ('BOTTOMPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('TOPPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgreen),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgreen),
        ]))
        story.append(coluna_table)
        story.append(Spacer(1, ESPACAMENTO_TABELA_SECAO))
        
        # SETOR 5: ADICIONAIS
        section_title = Paragraph("ADICIONAIS", section_style)
        story.append(section_title)
        
        adicionais_data = [
            ['Cancela:', str(result[21]) if result[21] else '0', 'Porta:', str(result[22]) if result[22] else '0'],
            ['Portão:', str(result[23]) if result[23] else '0', 'Barreira Eletrônica:', str(result[24]) if result[24] else '0'],
            ['Lados Enclausuramento:', str(result[25]) if result[25] else '0', 'Sensor Esmagamento:', str(result[26]) if result[26] else '0'],
            ['Rampa Acesso:', str(result[27]) if result[27] else '0', 'NoBreak:', str(result[28]) if result[28] else '0']
        ]
        
        adicionais_table = Table(adicionais_data, colWidths=[LARGURA_ADICIONAIS_COLUNA_1, LARGURA_ADICIONAIS_COLUNA_2, LARGURA_ADICIONAIS_COLUNA_3, LARGURA_ADICIONAIS_COLUNA_4])
        adicionais_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), FONTE_TABELA),
            ('BOTTOMPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('TOPPADDING', (0, 0), (-1, -1), ESPACAMENTO_TABELA_HORIZONTAL),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightyellow),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightyellow),
        ]))
        story.append(adicionais_table)
        story.append(Spacer(1, ESPACAMENTO_RODAPE))
        
        # Rodapé com data de geração
        story.append(Spacer(1, ESPACAMENTO_TABELA_SECAO))
        rodape = Paragraph(f"Relatório gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", small_style)
        story.append(rodape)
        
        # Construir PDF
        doc.build(story)
        
        # Obter dados do buffer
        pdf_data = buffer.getvalue()
        buffer.close()
        
        # Retornar PDF
        from flask import Response
        return Response(
            pdf_data,
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
            SELECT e.id, e.cor, e.status, e.comando, e.porta_inferior, e.porta_superior, e.observacao,
                   col.elevacao,
                   c.id as contrato_id, c.data_entrega, c.data_venda, c.vendedor,
                   cl.id as cliente_id, cl.nome as cliente_nome, cl.documento, cl.comercial, cl.email,
                   cab.altura, cab.largura, cab.profundidade, cab.lado_entrada, cab.lado_saida,
                   en.cidade, en.estado, en.rua, en.numero, en.complemento, en.cep,
                   -- Buscar itens adicionais
                   COALESCE(
                       (SELECT json_build_object(
                           'cancela', cancela,
                           'porta', porta,
                           'portao', portao,
                           'barreira_eletronica', barreira_eletronica,
                           'lados_enclausuramento', lados_enclausuramento,
                           'sensor_esmagamento', sensor_esmagamento,
                           'rampa_acesso', rampa_acesso,
                           'nobreak', nobreak,
                           'galvanizada', galvanizada
                       )
                       FROM adicionais
                       WHERE id_elevador = e.id),
                       '{}'::json
                   ) as itens_adicionais
            FROM elevador e
            JOIN contrato c ON e.id_contrato = c.id
            JOIN cliente cl ON c.id_cliente = cl.id
            LEFT JOIN cabine cab ON e.id = cab.id_elevador
            LEFT JOIN coluna col ON e.id = col.id_elevador
            LEFT JOIN endereco en ON cl.id = en.id_cliente
            WHERE c.data_entrega IS NOT NULL
            ORDER BY c.data_entrega
        """)
        eventos = []
        for row in cursor.fetchall():
            # Formatação do título com quebras de linha: #ID, Nome cliente, Cidade/Estado
            elevador_id = f'#{row[0]}'
            cliente_nome = row[13] if row[13] else ''
            cidade = row[19] if row[19] else ''
            estado = row[20] if row[20] else ''
            
            # Criar título com quebras de linha
            linha1 = elevador_id
            linha2 = cliente_nome
            
            # Só mostrar cidade e estado
            if cidade and estado:
                linha3 = f'{cidade}, {estado}'
            elif cidade:
                linha3 = cidade
            elif estado:
                linha3 = estado
            else:
                linha3 = ''
            
            # Usando \n para quebras de linha (será tratado no frontend)
            titulo = f'{linha1}\n{linha2}'
            if linha3:
                titulo += f'\n{linha3}'
            
            # Determinar cor baseada no status
            status = row[2] or 'Não iniciado'
            
            # Usar cor baseada no status
            if status == 'Não iniciado':
                cor_evento = '#6c757d'  # Cinza
            elif status == 'Em produção':
                cor_evento = '#ffc107'  # Amarelo
            elif status == 'Pronto':
                cor_evento = '#28a745'  # Verde
            elif status == 'Entregue':
                cor_evento = '#17a2b8'  # Azul claro (info)
            else:
                cor_evento = row[1] or '#007bff'  # Usar cor do elevador como fallback
            
            # Garantir que a data seja formatada corretamente
            data_entrega = row[9]
            if data_entrega:
                # Converter para string no formato ISO (YYYY-MM-DD)
                data_iso = data_entrega.strftime('%Y-%m-%d')
            else:
                continue  # Pular se não há data de entrega
            
            eventos.append({
                'id': row[0],
                'title': titulo,
                'start': data_iso,
                'allDay': True,  # Eventos de dia inteiro
                'color': cor_evento,
                'extendedProps': {
                    # Dados do elevador
                    'elevador_id': row[0],
                    'cor': row[1],
                    'status': status,
                    'comando': row[3],
                    'porta_inferior': row[4],
                    'porta_superior': row[5],
                    'observacao': row[6],
                    'elevacao': row[7],
                    
                    # Dados do contrato
                    'contrato_id': row[8],
                    'data_venda': row[10].strftime('%Y-%m-%d') if row[10] else None,
                    'vendedor': row[11],
                    
                    # Dados do cliente
                    'cliente_id': row[12],
                    'cliente_nome': row[13],
                    'cliente_documento': row[14],
                    'cliente_comercial': row[15],
                    'cliente_email': row[16],
                    
                    # Dados da cabine
                    'altura_cabine': row[17],
                    'largura_cabine': row[18],
                    'profundidade_cabine': row[19],
                    'lado_entrada': row[20],
                    'lado_saida': row[21],
                    
                    # Dados do endereço
                    'cidade': cidade,
                    'estado': estado,
                    'rua': row[22],
                    'numero': row[23],
                    'complemento': row[24],
                    'cep': row[25],
                    
                    # Itens adicionais
                    'itens_adicionais': row[26] if row[26] else []
                }
            })
        return jsonify(eventos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        end_pg_connection(conn)

# Rotas para atualização do sistema (sem Git)
@app.route('/api/sistema/verificar-atualizacoes')
def verificar_atualizacoes():
    """Verifica se há atualizações disponíveis comparando com GitHub API"""
    try:
        import requests
        import os
        
        # Versão atual do sistema
        versao_atual = "1.0.0"
        try:
            with open('version.txt', 'r') as f:
                versao_atual = f.read().strip()
        except:
            pass
        
        # Verificar versão mais recente no GitHub
        github_api_url = "https://api.github.com/repos/Cl4nyz/ElevadoresWebApp/releases/latest"
        
        response = requests.get(github_api_url, timeout=10)
        if response.status_code == 200:
            release_data = response.json()
            
            versao_nova = release_data.get('tag_name', '').replace('v', '')
            descricao = release_data.get('body', 'Melhorias e correções gerais.')
            
            # URL para download do ZIP
            download_url = f"https://github.com/Cl4nyz/ElevadoresWebApp/archive/refs/tags/{release_data.get('tag_name', 'main')}.zip"
            
            # Comparar versões (simplificado)
            if versao_nova != versao_atual:
                return jsonify({
                    'atualizada': False,
                    'versao_atual': versao_atual,
                    'versao_nova': versao_nova,
                    'descricao': descricao,
                    'download_url': download_url
                })
            else:
                return jsonify({
                    'atualizada': True,
                    'versao_atual': versao_atual
                })
        else:
            # Fallback: sempre considerar que há uma nova versão disponível
            return jsonify({
                'atualizada': False,
                'versao_atual': versao_atual,
                'versao_nova': '1.0.1',
                'descricao': 'Atualizações e melhorias disponíveis.',
                'download_url': 'https://github.com/Cl4nyz/ElevadoresWebApp/archive/refs/heads/main.zip'
            })
            
    except Exception as e:
        return jsonify({'error': f'Erro ao verificar atualizações: {str(e)}'}), 500

@app.route('/api/sistema/atualizar', methods=['POST'])
def atualizar_sistema():
    """Baixa e instala a atualização do sistema"""
    try:
        import requests
        import zipfile
        import os
        import shutil
        import tempfile
        from pathlib import Path
        
        data = request.json
        download_url = data.get('download_url')
        nova_versao = data.get('versao')
        
        if not download_url:
            return jsonify({'error': 'URL de download não fornecida'}), 400
        
        # Criar backup da versão atual
        backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Arquivos importantes para backup
        arquivos_backup = [
            'app.py',
            'postgre.py', 
            'requirements.txt',
            'templates',
            'static',
            'version.txt'
        ]
        
        print(f"Criando backup em: {backup_dir}")
        os.makedirs(backup_dir, exist_ok=True)
        
        for item in arquivos_backup:
            if os.path.exists(item):
                if os.path.isdir(item):
                    shutil.copytree(item, os.path.join(backup_dir, item))
                else:
                    shutil.copy2(item, backup_dir)
        
        # Baixar nova versão
        print("Baixando nova versão...")
        response = requests.get(download_url, timeout=300)
        
        if response.status_code != 200:
            return jsonify({'error': 'Falha ao baixar atualização'}), 500
        
        # Salvar arquivo ZIP temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            temp_file.write(response.content)
            zip_path = temp_file.name
        
        # Extrair ZIP
        print("Extraindo atualização...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Extrair para diretório temporário
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_ref.extractall(temp_dir)
                
                # Encontrar pasta extraída (geralmente tem nome do repo)
                extracted_folders = [f for f in os.listdir(temp_dir) if os.path.isdir(os.path.join(temp_dir, f))]
                if not extracted_folders:
                    return jsonify({'error': 'Estrutura de arquivo inválida'}), 500
                
                source_dir = os.path.join(temp_dir, extracted_folders[0])
                
                # Arquivos que devem ser atualizados
                arquivos_atualizar = [
                    'app.py',
                    'templates',
                    'static',
                    'requirements.txt'
                ]
                
                # Copiar arquivos atualizados
                print("Instalando atualização...")
                for item in arquivos_atualizar:
                    source_path = os.path.join(source_dir, item)
                    if os.path.exists(source_path):
                        if os.path.exists(item):
                            if os.path.isdir(item):
                                shutil.rmtree(item)
                            else:
                                os.remove(item)
                        
                        if os.path.isdir(source_path):
                            shutil.copytree(source_path, item)
                        else:
                            shutil.copy2(source_path, item)
        
        # Atualizar version.txt
        with open('version.txt', 'w') as f:
            f.write(nova_versao)
        
        # Limpar arquivo temporário
        os.unlink(zip_path)
        
        print("Atualização instalada com sucesso!")
        
        # Restart do servidor em thread separada
        def restart_server():
            import time
            time.sleep(2)  # Aguardar resposta ser enviada
            os._exit(0)  # Força reinicialização
        
        threading.Timer(1, restart_server).start()
        
        return jsonify({
            'success': True,
            'message': 'Atualização instalada com sucesso!',
            'backup': backup_dir
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao instalar atualização: {str(e)}'}), 500

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
