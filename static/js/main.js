document.addEventListener('DOMContentLoaded', function () {
    const selectedNumbers = new Set();
    const numbersGrid = document.querySelector('.numbers-grid');
    const selectedCountDisplay = document.getElementById('selected-count');
    const conferirButton = document.getElementById('conferir');
    const progressOverlay = document.getElementById('progress-overlay');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');
    const progressDetail = document.getElementById('progress-detail');

    // Função para atualizar o progresso
    function updateProgress(percent, status, detail) {
        progressBar.style.width = `${percent}%`;
        if (status) progressStatus.textContent = status;
        if (detail) progressDetail.textContent = detail;
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
    });

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inicio: parseInt(inicio),
                    fim: parseInt(fim),
                    numerosJogados: Array.from(selectedNumbers),
                    apenasPremiados: apenasPremiados,
                }),
            });

            // Simulação de progresso durante a consulta
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

            // Pequeno delay para mostrar a conclusão
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

    function updateResults(data) {
        // Atualizar resumo
        const resumoBoxes = document.querySelectorAll('.acerto-box');
        resumoBoxes.forEach((box) => {
            const acertos = parseInt(box.dataset.acertos);
            const count = data.resumo[acertos] || 0;
            box.querySelector('.count').textContent = count;
        });

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
});
