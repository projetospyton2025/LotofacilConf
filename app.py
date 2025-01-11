from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime

app = Flask(__name__)

def get_lotofacil_result(concurso):
    try:
        response = requests.get(f'https://loteriascaixa-api.herokuapp.com/api/lotofacil/{concurso}')
        return response.json()
    except:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/conferir', methods=['POST'])
def conferir():
    data = request.json
    inicio = int(data['inicio'])
    fim = int(data['fim'])
    numeros_jogados = data['numerosJogados']
    apenas_premiados = data['apenasPremiados']
    
    resultados = []
    resumo = {11: 0, 12: 0, 13: 0, 14: 0, 15: 0}
    
    for concurso in range(inicio, fim + 1):
        resultado = get_lotofacil_result(concurso)
        if resultado:
            dezenas_sorteadas = [int(n) for n in resultado['dezenas']]
            acertos = len(set(numeros_jogados) & set(dezenas_sorteadas))
            
            if acertos >= 11:
                if apenas_premiados:
                    resumo[acertos] += 1
                    resultados.append({
                        'concurso': concurso,
                        'dezenas': dezenas_sorteadas,
                        'acertos': acertos,
                        'premio': resultado['premiacoes'][15-acertos]['premio'] if acertos >= 11 else 0
                    })
                else:
                    resumo[acertos] += 1
                    resultados.append({
                        'concurso': concurso,
                        'dezenas': dezenas_sorteadas,
                        'acertos': acertos,
                        'premio': resultado['premiacoes'][15-acertos]['premio'] if acertos >= 11 else 0
                    })
    
    return jsonify({
        'resultados': resultados,
        'resumo': resumo
    })

if __name__ == '__main__':
    app.run(debug=True)