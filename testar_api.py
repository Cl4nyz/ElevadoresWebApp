#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def testar_api():
    """Testa os endpoints da API"""
    try:
        # Testar contratos
        print("=== Testando API de Contratos ===")
        response = requests.get('http://localhost:5000/api/contratos')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            contratos = response.json()
            print(f'Contratos encontrados: {len(contratos)}')
            for contrato in contratos[:3]:  # Mostrar apenas os primeiros 3
                print(f'  ID: {contrato["id"]}, Cliente: {contrato.get("cliente_nome", "N/A")}')
        else:
            print(f'Erro: {response.text}')
            
        # Testar clientes
        print("\n=== Testando API de Clientes ===")
        response = requests.get('http://localhost:5000/api/clientes')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            clientes = response.json()
            print(f'Clientes encontrados: {len(clientes)}')
        else:
            print(f'Erro: {response.text}')
            
    except requests.exceptions.ConnectionError:
        print("Erro: Não foi possível conectar ao servidor Flask. Certifique-se de que está rodando.")
    except Exception as e:
        print(f'Erro: {e}')

if __name__ == '__main__':
    testar_api()
