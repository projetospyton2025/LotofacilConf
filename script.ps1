# Definindo o diretório do projeto
$projectDir = "H:\Meu Drive\ProjetosPython\Loterias\Conferidores\LotofacilConf"

# Criando diretórios
New-Item -ItemType Directory -Path "$projectDir\static\css" -Force
New-Item -ItemType Directory -Path "$projectDir\static\js" -Force
New-Item -ItemType Directory -Path "$projectDir\templates" -Force

# Criando arquivos
New-Item -ItemType File -Path "$projectDir\static\css\style.css" -Force
New-Item -ItemType File -Path "$projectDir\static\js\main.js" -Force
New-Item -ItemType File -Path "$projectDir\templates\index.html" -Force
New-Item -ItemType File -Path "$projectDir\app.py" -Force
New-Item -ItemType File -Path "$projectDir\requirements.txt" -Force

# Criando o ambiente virtual
python -m venv "$projectDir\venv"

# Carregando o perfil do PowerShell
if (Test-Path $PROFILE) {
    Write-Host "Carregando o perfil do PowerShell..." -ForegroundColor Green
    . $PROFILE
} else {
    Write-Host "O arquivo de perfil do PowerShell não foi encontrado." -ForegroundColor Yellow
}

# Ativando o ambiente virtual diretamente
$activateScript = Join-Path "$projectDir\venv\Scripts" "Activate.ps1"
if (Test-Path $activateScript) {
    Write-Host "Ativando o ambiente virtual..." -ForegroundColor Green
    . $activateScript
} else {
    Write-Host "O script de ativação do ambiente virtual não foi encontrado." -ForegroundColor Red
}
