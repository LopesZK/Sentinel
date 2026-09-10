const video = document.getElementById('webcam');
const modalCamera = document.getElementById('cameraModal');
const modalTitle = document.getElementById('modalTitle');
const scanStatus = document.getElementById('scanStatus');
const logFeed = document.getElementById('logFeed');
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');

let cameraAtiva = false;
let monitorandoIA = false;

// 1. Controle do Modal da Webcam
async function abrirCamera(idCamera, nomeCamera) {
  modalTitle.innerText = `FEED: ${nomeCamera}`;
  modalCamera.style.display = 'flex';
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    cameraAtiva = true;
    scanStatus.innerText = "WEBCAM ATIVA. PRONTO PARA IA.";
    adicionarLog(`Câmera '${nomeCamera}' aberta.`);
  } catch (erro) {
    console.error("Erro ao abrir webcam:", erro);
    scanStatus.innerText = "ERRO AO ACESSAR WEBCAM.";
    alert("Permissão de câmera negada ou dispositivo indisponível.");
  }
}

function fecharCamera() {
  modalCamera.style.display = 'none';
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
  cameraAtiva = false;
  monitorandoIA = false;
  adicionarLog("Feed de câmera encerrado.");
}

// 2. Carregar Modelos da face-api.js usando funções diretas e seguras
async function carregarModelosFaceApi() {
  scanStatus.innerText = "CARREGANDO MODELOS DE IA...";
  console.log("Iniciando o carregamento dos modelos da face-api...");

  try {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
    await faceapi.loadFaceLandmarkModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);
    
    scanStatus.innerText = "IA PRONTA PARA USO.";
    console.log("🧠 Modelos de IA do Sentinel 3.0 carregados com sucesso!");
  } catch (e) {
    console.error("Erro ao carregar modelos de IA:", e);
    scanStatus.innerText = "ERRO AO CARREGAR IA.";
  }
}

window.addEventListener('DOMContentLoaded', () => {
  carregarModelosFaceApi();
});

// 3. Cadastrar Biometria (Salva no MySQL)
async function cadastrarBiometria() {
  if (!cameraAtiva) {
    alert("Abra uma câmera primeiro!");
    return;
  }

  scanStatus.innerText = "ANALISANDO ROSTO...";
  
  try {
    const detecao = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

    if (!detecao) {
      scanStatus.innerText = "ROSTO NÃO DETECTADO.";
      alert("Nenhum rosto encontrado. Olhe diretamente para la lente.");
      return;
    }

    const nomeMorador = prompt("Digite o nome do morador:", "Davi (Morador)");
    if (!nomeMorador) {
      scanStatus.innerText = "CADASTRO CANCELADO.";
      return;
    }

    scanStatus.innerText = "SALVANDO NO MYSQL...";

    const resposta = await fetch('http://localhost:3000/api/biometria/treinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nomeMorador,
        descriptor: Array.from(detecao.descriptor)
      })
    });

    const resultado = await resposta.json();
    if (resposta.ok) {
      scanStatus.innerText = "ROSTO CADASTRADO COM SUCESSO!";
      adicionarLog(`Novo morador cadastrado: ${nomeMorador}`);
      alert(resultado.mensagem);
    } else {
      alert("Erro ao salvar: " + resultado.erro);
      scanStatus.innerText = "ERRO AO SALVAR.";
    }
  } catch (erro) {
    console.error("Erro na requisição de cadastro:", erro);
    alert("Erro de conexão com o servidor na porta 3000.");
    scanStatus.innerText = "FALHA DE CONEXÃO.";
  }
}

// 4. Iniciar Monitoramento Contínuo por IA (Autenticação)
async function iniciarReconhecimento() {
  if (!cameraAtiva) {
    alert("Abra uma câmera primeiro!");
    return;
  }

  monitorandoIA = true;
  scanStatus.innerText = "MONITORANDO ACESSOS (IA ATIVA)...";
  adicionarLog("Monitoramento facial contínuo ativado.");

  const intervalo = setInterval(async () => {
    if (!monitorandoIA || !cameraAtiva) {
      clearInterval(intervalo);
      return;
    }

    try {
      const detecao = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (!detecao) {
        scanStatus.innerText = "BUSCANDO ROSTOS...";
        return;
      }

      const resposta = await fetch('http://localhost:3000/api/biometria/autenticar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descriptorLeitura: Array.from(detecao.descriptor)
        })
      });

      const resultado = await resposta.json();

      if (resposta.ok && resultado.status === "LIBERADO") {
        scanStatus.innerText = `🟢 LIBERADO: ${resultado.usuario}`;
        document.getElementById('lastAccess').innerText = `${resultado.usuario} (${new Date().toLocaleTimeString()})`;
        adicionarLog(`Acesso autorizado para ${resultado.usuario}. Porta destrancada.`);
      } else {
        scanStatus.innerText = "🔴 ALERTA: INTRUSO DETECTADO!";
        document.getElementById('riskValue').innerText = "100%";
        document.getElementById('riskLevel').innerText = "CRÍTICO - INTRUSO";
        adicionarLog(`Alerta de Segurança: Intruso bloqueado pelo motor de IA!`);
      }
    } catch (e) {
      console.error("Erro no ciclo de IA:", e);
    }
  }, 3000);
}

// 5. Simulação de Intruso/Procurado
function simularProcuradoPolicia() {
  scanStatus.innerText = "🔴 INTRUSO SIMULADO IDENTIFICADO!";
  document.getElementById('riskValue').innerText = "100%";
  document.getElementById('riskLevel').innerText = "RISCO CRÍTICO";
  adicionarLog("🚨 INTRUSO DETECTADO: Acionando protocolo de segurança e chamada 190.");
  discarEmergencia("190 (POLÍCIA MILITAR)", "Intruso / Procurado Detectado");
}

// Funções Auxiliares do Painel
function adicionarLog(mensagem) {
  const hora = new Date().toLocaleTimeString();
  const item = document.createElement('div');
  item.className = 'log-item info';
  item.innerHTML = `<small>${hora}</small> ${mensagem}`;
  logFeed.prepend(item);
}

function togglePorta() {
  const el = document.getElementById('statusPortaPrincipal');
  const btn = document.getElementById('btnPortaPrincipal');
  if (el.innerText === "TRANCADA") {
    el.innerText = "DESTRANCADA";
    el.className = "text-red";
    btn.innerText = "🚪 Porta (DESTRANCADA)";
    adicionarLog("Porta principal destrancada manualmente.");
  } else {
    el.innerText = "TRANCADA";
    el.className = "text-green";
    btn.innerText = "🚪 Porta (TRANCADA)";
    adicionarLog("Porta principal trancada.");
  }
}

function toggleJanela() {
  const el = document.getElementById('statusJanelaSala');
  const btn = document.getElementById('btnJanelaSala');
  if (el.innerText === "FECHADA") {
    el.innerText = "ABERTA";
    el.className = "text-red";
    btn.innerText = "🪟 Janela (ABERTA)";
    adicionarLog("Aviso: Janela da sala aberta.");
  } else {
    el.innerText = "FECHADA";
    el.className = "text-green";
    btn.innerText = "🪟 Janela (FECHADA)";
    adicionarLog("Janela da sala fechada.");
  }
}

function toggleIncendio() {
  adicionarLog("🔥 Sensor de fumaça acionado! Verificando cozinha...");
  document.getElementById('statusFumaca').innerText = "FUMAÇA DETECTADA!";
  document.getElementById('statusFumaca').className = "text-red";
}

function toggleGas() {
  adicionarLog("⚠️ Vazamento de gás detectado na residência!");
  document.getElementById('statusGas').className = "text-red";
  document.getElementById('statusGas').innerText = "VAZAMENTO!";
}

function discarEmergencia(orgao, motivo) {
  document.getElementById('emergencyModal').style.display = 'flex';
  document.getElementById('emergencyTitle').innerText = `🚨 LIGANDO PARA ${orgao}`;
  document.getElementById('emergencyBody').innerText = `Motivo: ${motivo}`;
  adicionarLog(`Discagem automática iniciada para ${orgao}.`);
}

function cancelarEmergencia() {
  document.getElementById('emergencyModal').style.display = 'none';
  adicionarLog("Chamada de emergência cancelada pelo usuário.");
}

function enviarMensagem() {
  const texto = chatInput.value.trim();
  if (!texto) return;

  const msgUser = document.createElement('div');
  msgUser.className = 'chat-msg user-msg';
  msgUser.innerText = texto;
  chatHistory.appendChild(msgUser);
  chatInput.value = "";

  setTimeout(() => {
    const msgBot = document.createElement('div');
    msgBot.className = 'chat-msg system-msg';
    
    if (texto.toLowerCase().includes("trancar")) {
      msgBot.innerText = "Comando recebido: Trancando os acessos da residência com segurança.";
      document.getElementById('statusPortaPrincipal').innerText = "TRANCADA";
    } else {
      msgBot.innerText = `Comando "${texto}" processado pelo Sentinel 3.0. Todos os sistemas operando normalmente.`;
    }
    
    chatHistory.appendChild(msgBot);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }, 500);
}

function verificarEnter(e) {
  if (e.key === 'Enter') enviarMensagem();
}