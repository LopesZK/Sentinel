// ESTADO DO SISTEMA
let estadoSistema = {
  portaPrincipal: false, // false = Trancada, true = Aberta
  janelaSala: false,      // false = Fechada, true = Aberta
  cameraAtiva: null,
  streamWebcam: null
};

// ELEMENTOS DA TELA
const modal = document.getElementById('cameraModal');
const webcamElement = document.getElementById('webcam');
const modalTitle = document.getElementById('modalTitle');
const riskValue = document.getElementById('riskValue');
const riskLevel = document.getElementById('riskLevel');
const gaugeCircle = document.getElementById('gaugeCircle');
const scanStatus = document.getElementById('scanStatus');

// 1. GERENCIAR CÂMERA E WEBCAM DO NOTEBOOK
async function abrirCamera(id, nome) {
  estadoSistema.cameraAtiva = nome;
  modalTitle.innerText = `FEED AO VIVO — ${nome.toUpperCase()}`;
  modal.style.display = 'flex';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamElement.srcObject = stream;
    estadoSistema.streamWebcam = stream;
    adicionarLog(`Câmera ativada: ${nome}`);
  } catch (err) {
    alert("Erro ao acessar a webcam do notebook: " + err.message);
  }
}

function fecharCamera() {
  modal.style.display = 'none';
  if (estadoSistema.streamWebcam) {
    estadoSistema.streamWebcam.getTracks().forEach(track => track.stop());
  }
}

// 2. SIMULADOR DE SENSORES DE ACESSO
function togglePorta() {
  estadoSistema.portaPrincipal = !estadoSistema.portaPrincipal;
  const btn = document.getElementById('btnPortaPrincipal');
  const txtStatus = document.getElementById('statusPortaPrincipal');

  if (estadoSistema.portaPrincipal) {
    btn.classList.add('open');
    btn.innerText = '🚪 Porta Principal (ABERTA)';
    txtStatus.innerText = 'ABERTA';
    txtStatus.className = 'text-red';
    adicionarLog('ALERTA: Porta Principal foi ABERTA!');
  } else {
    btn.classList.remove('open');
    btn.innerText = '🚪 Porta Principal (TRANCADA)';
    txtStatus.innerText = 'TRANCADA';
    txtStatus.className = 'text-green';
    adicionarLog('Porta Principal trancada com segurança.');
  }

  recalcularRisco();
}

function toggleJanela() {
  estadoSistema.janelaSala = !estadoSistema.janelaSala;
  const btn = document.getElementById('btnJanelaSala');
  const txtStatus = document.getElementById('statusJanelaSala');

  if (estadoSistema.janelaSala) {
    btn.classList.add('open');
    btn.innerText = '🪟 Janela Sala (ABERTA)';
    txtStatus.innerText = 'ABERTA';
    txtStatus.className = 'text-red';
    adicionarLog('ALERTA: Janela da Sala foi ABERTA!');
  } else {
    btn.classList.remove('open');
    btn.innerText = '🪟 Janela Sala (FECHADA)';
    txtStatus.innerText = 'FECHADA';
    txtStatus.className = 'text-green';
    adicionarLog('Janela da Sala fechada com segurança.');
  }

  recalcularRisco();
}

// 3. MOTOR PREDITIVO DE RISCO (REGRAS)
function recalcularRisco(bonusIntruso = 0) {
  let scoreRisco = 10; // Risco base

  if (estadoSistema.portaPrincipal) scoreRisco += 40;
  if (estadoSistema.janelaSala) scoreRisco += 30;
  scoreRisco += bonusIntruso;

  if (scoreRisco > 100) scoreRisco = 100;

  riskValue.innerText = `${scoreRisco}%`;

  if (scoreRisco < 30) {
    riskLevel.innerText = 'RISCO BAIXO';
    gaugeCircle.style.borderColor = '#10b981';
    gaugeCircle.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
  } else if (scoreRisco < 70) {
    riskLevel.innerText = 'RISCO MÉDIO (ATENÇÃO)';
    gaugeCircle.style.borderColor = '#f59e0b';
    gaugeCircle.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
  } else {
    riskLevel.innerText = 'PERIGO (INVASÃO)';
    gaugeCircle.style.borderColor = '#ef4444';
    gaugeCircle.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
  }
}

// 4. SIMULADORES DE RECONHECIMENTO FACIAL
function simularMorador() {
  scanStatus.innerText = "VERIFIED: MORADOR — ACESSO PERMITIDO";
  scanStatus.style.color = "#10b981";
  document.getElementById('lastAccess').innerText = "Morador (Autorizado)";
  adicionarLog(`Reconhecimento Facial: Morador validado na ${estadoSistema.cameraAtiva}.`);
  recalcularRisco(0);
}

function simularIntruso() {
  scanStatus.innerText = "ALERTA: ROSTO NÃO RECONHECIDO (DESCONHECIDO)";
  scanStatus.style.color = "#ef4444";
  document.getElementById('lastAccess').innerText = "INTRUSO DETECTADO!";
  adicionarLog(`ALERTA CRÍTICO: Pessoa não autorizada na ${estadoSistema.cameraAtiva}!`);
  recalcularRisco(60);
}

// UTILITÁRIO DE LOGS
function adicionarLog(mensagem) {
  const logFeed = document.getElementById('logFeed');
  const hora = new Date().toLocaleTimeString().substring(0, 5);
  const item = document.createElement('div');
  item.className = 'log-item';
  item.innerHTML = `<small>${hora}</small> ${mensagem}`;
  logFeed.prepend(item);
}