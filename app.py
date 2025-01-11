from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime

app = Flask(__name__)

def get_latest_concurso():
    try:
        response = requests.get('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest')
        data = response.json()
        return data['concurso']
    except:
        return None

def get_lotofacil_result(concurso):
    try:
        response = requests.get(f'https://loteriascaixa-api.herokuapp.com/api/lotofacil/{concurso}')
        return response.json()
    except:
        return None

@app.route('/')
def index():
    ultimo_concurso = get_latest_concurso()
    return render_template('index.html', ultimo_concurso=ultimo_concurso)

@app.route('/conferir', methods=['POST'])
def conferir():
    data = request.json
    inicio = int(data['inicio'])
    fim = int(data['fim'])
    numeros_jogados = [str(num).zfill(2) for num in data['numerosJogados']]  # Convertendo para formato "01", "02", etc
    apenas_premiados = data['apenasPremiados']
    
    resultados = []
    resumo = {11: 0, 12: 0, 13: 0, 14: 0, 15: 0}
    
    for concurso in range(inicio, fim + 1):
        resultado = get_lotofacil_result(concurso)
        if resultado:
            dezenas_sorteadas = resultado['dezenas']  # Já vem no formato correto da API
            acertos = len(set(numeros_jogados) & set(dezenas_sorteadas))
            
            if acertos >= 11:
                premio = 0
                for premiacao in resultado['premiacoes']:
                    if premiacao['descricao'] == f'{acertos} acertos':
                        premio = premiacao['valorPremio']
                        break
                
                if not apenas_premiados or premio > 0:
                    resumo[acertos] += 1
                    resultados.append({
                        'concurso': concurso,
                        'dezenas': dezenas_sorteadas,
                        'acertos': acertos,
                        'premio': premio
                    })
    
    return jsonify({
        'resultados': resultados,
        'resumo': resumo
    })
    

#if __name__ == '__main__':
#    app.run(debug=True)
    
    
    # Obtém a porta do ambiente ou usa 5000 como padrão
    port = int(os.environ.get("PORT", 5000))
    # Executa o servidor
    app.run(host="0.0.0.0", port=port, debug=False)