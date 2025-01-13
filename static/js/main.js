document.addEventListener('DOMContentLoaded', async function () {
    // Variáveis e elementos de interface
    const selectedNumbers = new Set();
    const numbersGrid = document.querySelector('.numbers-grid');
    const selectedCountDisplay = document.getElementById('selected-count');
    const conferirButton = document.getElementById('conferir');
    const progressOverlay = document.getElementById('progress-overlay');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');
    const progressDetail = document.getElementById('progress-detail');
    let totalGanhos = 0;
    let premiacaoTable = null;

    // Fetch dados de premiação inicial
    try {
        const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest');
        const data = await response.json();
        premiacaoTable = {
            11: data.premiacoes[4].valorPremio,
            12: data.premiacoes[3].valorPremio,
            13: data.premiacoes[2].valorPremio,
            14: data.premiacoes[1].valorPremio,
            15: data.premiacoes[0].valorPremio
        };
    } catch (error) {
        console.error('Erro ao carregar dados de premiação:', error);
        alert('Erro ao carregar dados de premiação. Usando valores padrão.');
        // Valores de fallback se a API falhar
        premiacaoTable = {
            11: 5,
            12: 10,
            13: 25,
            14: 1000,
            15: 1500000
        };
    }

    // Elementos adicionais
    const selectedNumbersDisplay = document.createElement('div');
    selectedNumbersDisplay.id = 'selected-numbers-container';
    selectedNumbersDisplay.className = 'selected-numbers-container';
    document.querySelector('.numbers-grid').insertAdjacentElement('beforebegin', selectedNumbersDisplay);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';
    buttonsContainer.innerHTML = `
        <button id="btn-limpar" class="btn-action">Limpar</button>
        <button id="btn-premiacao" class="btn-action">Premiação</button>
        <button id="btn-palpite" class="btn-action">Palpite</button>
    `;
    document.querySelector('.controls').appendChild(buttonsContainer);

    // Função para atualizar a barra de progresso
    function updateProgress(percent, status, detail) {
        progressBar.style.width = `${percent}%`;
        if (status) progressStatus.textContent = status;
        if (detail) progressDetail.textContent = detail;
        progressBar.style.transition = 'width 0.3s ease-in-out';
    }

    function showProgress() {
        progressOverlay.classList.remove('hidden');
        updateProgress(0, 'Iniciando consulta...', 'Preparando dados...');
    }

    function hideProgress() {
        progressOverlay.classList.add('hidden');
        updateProgress(0);
    }

    // Seleção de números
    numbersGrid.addEventListener('click', function (e) {
        const numberElement = e.target.closest('.number');
        if (!numberElement) return;

        const number = parseInt(numberElement.dataset.number);
        if (selectedNumbers.has(number)) {
            selectedNumbers.delete(number);
            numberElement.classList.remove('selected');
        } else if (selectedNumbers.size < 15) {
            selectedNumbers.add(number);
            numberElement.classList.add('selected');
        }

        selectedCountDisplay.textContent = selectedNumbers.size;
        updateSelectedNumbersDisplay();
    });

    // Função para atualizar os números selecionados no display
    function updateSelectedNumbersDisplay() {
        const numbers = Array.from(selectedNumbers).sort((a, b) => a - b);
        selectedNumbersDisplay.textContent = numbers.map(n => String(n).padStart(2, '0')).join(' ');
    }

    // Clique no botão "Conferir"
    conferirButton.addEventListener('click', async function () {
        if (selectedNumbers.size !== 15) {
            alert('Selecione exatamente 15 números!');
            return;
        }

        const inicio = document.getElementById('inicio').value;
        const fim = document.getElementById('fim').value;
        const apenasPremiados = document.getElementById('apenas-premiados').checked;

        if (!inicio || !fim || parseInt(inicio) > parseInt(fim)) {
            alert('Por favor, insira um intervalo válido de concursos!');
            return;
        }

        showProgress();

        try {
            const totalConcursos = parseInt(fim) - parseInt(inicio) + 1;
            let processados = 0;

            const response = await fetch('/conferir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inicio: parseInt(inicio),
                    fim: parseInt(fim),
                    numerosJogados: Array.from(selectedNumbers),
                    apenasPremiados: apenasPremiados,
                }),
            });

            const progressInterval = setInterval(() => {
                processados++;
                const percentual = Math.min((processados / totalConcursos) * 100, 95);
                updateProgress(
                    percentual,
                    'Consultando resultados...',
                    `Processando concurso ${parseInt(inicio) + processados - 1} de ${fim}`
                );
            }, 100);

            const data = await response.json();

            clearInterval(progressInterval);
            updateProgress(100, 'Concluído!', 'Atualizando resultados...');

            setTimeout(() => {
                hideProgress();
                updateResults(data);
            }, 500);
        } catch (error) {
            hideProgress();
            console.error('Erro ao conferir resultados:', error);
            alert('Erro ao conferir resultados. Tente novamente.');
        }
    });

    // Função para atualizar resultados e resumo
    function updateResults(data) {
        // Atualizar resumo
        const resumoBoxes = document.querySelectorAll('.acerto-box');
        resumoBoxes.forEach((box) => {
            const acertos = parseInt(box.dataset.acertos);
            const count = data.resumo[acertos] || 0;
            box.querySelector('.count').textContent = count;

            const valorTotal = count * premiacaoTable[acertos];
            totalGanhos += valorTotal;
            box.innerHTML += `<p class="premio">R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>`;
        });

        // Exibir total de ganhos
        const totalElement = document.createElement('div');
        totalElement.className = 'total-ganhos';
        totalElement.innerHTML = `<h3>Total de Ganhos: R$ ${totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>`;
        document.querySelector('.resumo').appendChild(totalElement);

        // Atualizar lista de resultados
        const resultadosList = document.getElementById('resultados-list');
        resultadosList.innerHTML = '';

        data.resultados.forEach((resultado) => {
            const resultadoElement = document.createElement('div');
            resultadoElement.className = 'resultado-item';

            const dezenasHtml = resultado.dezenas
                .map((dezena) => {
                    const isAcertada = selectedNumbers.has(dezena);
                    return `<span class="number ${isAcertada ? 'dezena-acertada' : ''}">${dezena}</span>`;
                })
                .join(' ');

            resultadoElement.innerHTML = `
                <h3>Concurso ${resultado.concurso}</h3>
                <p>Acertos: ${resultado.acertos}</p>
                <p>Prêmio: R$ ${resultado.premio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <div class="dezenas">
                    ${dezenasHtml}
                </div>
            `;

            resultadosList.appendChild(resultadoElement);
        });
    }

    // Adicionar handlers para os novos botões
    document.getElementById('btn-limpar').addEventListener('click', () => {
        selectedNumbers.clear();
        document.querySelectorAll('.number').forEach(el => el.classList.remove('selected'));
        selectedCountDisplay.textContent = '0';
        updateSelectedNumbersDisplay();
    });

    document.getElementById('btn-premiacao').addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Tabela de Premiação</h3>
                <table>
                    <tr><th>Acertos</th><th>Valor</th></tr>
                    ${Object.entries(premiacaoTable)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([acertos, valor]) => `
                            <tr>
                                <td>${acertos}</td>
                                <td>R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('')}
                </table>
                <button onclick="this.closest('.modal').remove()">Fechar</button>
            </div>
        `;
        document.body.appendChild(modal);
    });

    document.getElementById('btn-palpite').addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Gerar Palpite</h3>
                <div class="palpite-buttons">
                    ${[10,11,12,13,14,15].map(n => 
                        `<button onclick="gerarPalpite(${n})">${n} números</button>`
                    ).join('')}
                </div>
                <button onclick="this.closest('.modal').remove()">Fechar</button>
            </div>
        `;
        document.body.appendChild(modal);
    });

    function gerarPalpite(quantidade) {
        selectedNumbers.clear();
        document.querySelectorAll('.number').forEach(el => el.classList.remove('selected'));

        while (selectedNumbers.size < quantidade) {
            const num = Math.floor(Math.random() * 25) + 1;
            if (!selectedNumbers.has(num)) {
                selectedNumbers.add(num);
                document.querySelector(`[data-number="${String(num).padStart(2, '0')}"]`).classList.add('selected');
            }
        }

        selectedCountDisplay.textContent = selectedNumbers.size;
        updateSelectedNumbersDisplay();
    }
});
