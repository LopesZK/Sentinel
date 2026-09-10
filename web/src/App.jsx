import { useState, useEffect, useRef } from 'react';
import './index.css';

function App() {
  const [luzes, setLuzes] = useState({ sala: false, quarto: false, cozinha: false, corredor: false });
  const [portas, setPortas] = useState({ principal: false, quarto: false });
  const [janelas, setJanelas] = useState({ sala: false, cozinha: false });
  const [incendio, setIncendio] = useState(false);
  const [gas, setGas] = useState(false);
  const [alertaPolicial, setAlertaPolicial] = useState(false);
  const [risco, setRisco] = useState(10);
  const [logsServidor, setLogsServidor] = useState([]);
  
  // Estados da Biometria Facial Profunda
  const [statusIA, setStatusIA] = useState('Carregando redes neurais da IA...');
  const [donoCadastrado, setDonoCadastrado] = useState(false);
  const [descritorDono, setDescritorDono] = useState(null);
  const [statusAcesso, setStatusAcesso] = useState('Aguardando Cadastro do Dono');
  const videoRef = useRef(null);

  // Estados do Chatbot
  const [historicoChat, setHistoricoChat] = useState([
    { texto: 'Sentinel Assistant online com Biometria de Pontos Faciais.', tipo: 'system-msg' }
  ]);
  const [inputTexto, setInputTexto] = useState('');

  // 1. Sincronizar com o Back-End TypeScript
  useEffect(() => {
    fetch('http://localhost:3001/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setLogsServidor(data.logs);
      })
      .catch(err => console.error("Erro ao conectar com a API:", err));
  }, []);

  // 2. Inicializar Modelos da IA e Câmera
  useEffect(() => {
    const carregarModelosEWebcam = async () => {
      try {
        setStatusIA('Carregando pesos biométricos...');
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        if (window.faceapi) {
          await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatusIA('🟢 Câmera Ativa. Pronto para Cadastro.');
      } catch (err) {
        console.error("Erro ao iniciar IA/Webcam:", err);
        setStatusIA('⚠️ Erro ao carregar IA');
      }
    };
    carregarModelosEWebcam();
  }, []);

  const registrarEventoAPI = async (tipo, status) => {
    try {
      const response = await fetch('http://localhost:3001/api/evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, status })
      });
      const data = await response.json();
      if (data.log) {
        setLogsServidor(prev => [data.log, ...prev]);
      }
    } catch (err) {
      console.error("Erro ao registrar evento:", err);
    }
  };

  // 3. Cadastrar os Pontos Faciais do Dono da Casa
  const cadastrarRostoDono = async () => {
    if (!videoRef.current || !window.faceapi) return;
    setStatusIA('Analisando 68 pontos faciais...');

    const detection = await window.faceapi
      .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      setDescritorDono(detection.descriptor);
      setDonoCadastrado(true);
      setStatusIA('🔒 Assinatura Biométrica Salva!');
      setStatusAcesso('🟢 Acesso Exclusivo: Dono Identificado');
      registrarEventoAPI('Segurança IA', 'Mapeamento de pontos faciais do dono concluído.');
    } else {
      setStatusIA('❌ Rosto não detectado. Centralize-se.');
    }
  };

  // 4. Verificação Contínua (Bloqueio de Intrusos)
  useEffect(() => {
    if (!donoCadastrado || !descritorDono || !window.faceapi) return;

    const intervalo = setInterval(async () => {
      if (!videoRef.current) return;

      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const distancia = window.faceapi.euclideanDistance(detection.descriptor, descritorDono);
        
        // Distância menor que 0.5 confirma que é o dono cadastrado
        if (distancia < 0.5) {
          setStatusAcesso('🟢 Dono Identificado (Acesso Total)');
        } else {
          setStatusAcesso('🚨 ALERTA: INTRUSO NÃO RECONHECIDO!');
          setRisco(100);
          registrarEventoAPI('Intrusão IA', '⚠️ Rosto desconhecido detectado na porta principal!');
        }
      } else {
        setStatusAcesso('🔍 Varredura biométrica em andamento...');
      }
    }, 2500);

    return () => clearInterval(intervalo);
  }, [donoCadastrado, descritorDono]);

  // Motor Preditivo de Risco
  useEffect(() => {
    let score = 10;
    if (portas.principal || portas.quarto) score += 20;
    if (janelas.sala || janelas.cozinha) score += 15;
    if (gas) score += 50;
    if (incendio) score += 70;
    if (alertaPolicial) score += 90;
    
    setRisco(score > 100 ? 100 : score);
  }, [portas, janelas, gas, incendio, alertaPolicial]);

  const getCorRisco = () => {
    if (risco < 30) return '#10b981';
    if (risco < 70) return '#f59e0b';
    return '#ef4444';
  };

  const toggleLuz = (comodo) => {
    setLuzes(prev => {
      const novoEstado = !prev[comodo];
      registrarEventoAPI('Iluminação', `Luz da ${comodo} ${novoEstado ? 'Ligada' : 'Desligada'}`);
      return { ...prev, [comodo]: novoEstado };
    });
  };

  const togglePorta = (porta) => {
    setPortas(prev => {
      const novoEstado = !prev[porta];
      registrarEventoAPI('Segurança', `Porta ${porta} ${novoEstado ? 'Aberta' : 'Trancada'}`);
      return { ...prev, [porta]: novoEstado };
    });
  };

  const toggleJanela = (janela) => {
    setJanelas(prev => {
      const novoEstado = !prev[janela];
      registrarEventoAPI('Segurança', `Janela ${janela} ${novoEstado ? 'Aberta' : 'Fechada'}`);
      return { ...prev, [janela]: novoEstado };
    });
  };

  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!inputTexto.trim()) return;

    const msgUsuario = inputTexto;
    setHistoricoChat(prev => [...prev, { texto: msgUsuario, tipo: 'user-msg' }]);
    setInputTexto('');

    setTimeout(() => {
      let resposta = "Comando processado.";
      const msg = msgUsuario.toLowerCase();
      if (msg.includes('risco')) resposta = `O índice de risco atual é de ${risco}%.`;
      else if (msg.includes('trancar')) {
        setPortas({ principal: false, quarto: false });
        setJanelas({ sala: false, cozinha: false });
        resposta = "🔒 Todos os acessos foram trancados com segurança.";
      }
      setHistoricoChat(prev => [...prev, { texto: resposta, tipo: 'system-msg' }]);
    }, 400);
  };

  return (
    <>
      <header className="navbar">
        <div className="logo">
          <span className="shield-icon">🛡️</span>
          <h1>SENTINEL <span>2.1 (Biometria Facial Avançada)</span></h1>
        </div>
        <div className="system-status">
          <span className="status-dot green"></span> {statusAcesso}
        </div>
      </header>

      <main className="dashboard-grid">
        {/* COLUNA ESQUERDA: BIOMETRIA DE PONTOS */}
        <section className="card risk-card">
          <h2>LEITOR BIOMÉTRICO (IA)</h2>
          <div className="webcam-container" style={{ position: 'relative', width: '100%', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #334155', background: '#000' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', fontSize: '0.65rem', color: '#38bdf8', borderRadius: '4px' }}>
              {statusIA}
            </div>
          </div>

          {!donoCadastrado ? (
            <button 
              onClick={cadastrarRostoDono}
              style={{ width: '100%', padding: '8px', background: '#38bdf8', border: 'none', borderRadius: '4px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer', marginBottom: '10px' }}
            >
              👤 REGISTRAR MEU RUSTO (DONO)
            </button>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#10b981', marginBottom: '10px', fontWeight: 'bold' }}>
              ✔ Biometria Ativa & Protegida
            </div>
          )}

          <h2>ÍNDICE PREDITIVO DE RISCO</h2>
          <div className="gauge-container">
            <div className="gauge-circle" style={{ borderColor: getCorRisco(), boxShadow: `0 0 20px ${getCorRisco()}66` }}>
              <span className="gauge-value">{risco}%</span>
              <span className="gauge-label">{risco < 30 ? 'SEGURO' : risco < 70 ? 'ATENÇÃO' : 'ALERTA MÁXIMO'}</span>
            </div>
          </div>

          <div className="device-summary">
            <h3>LOGS DO SERVIDOR (API)</h3>
            <div className="log-feed" style={{ maxHeight: '100px', overflowY: 'auto', background: '#0f172a', padding: '6px', borderRadius: '4px', fontSize: '0.7rem' }}>
              {logsServidor.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px', borderBottom: '1px solid #1e293b', paddingBottom: '2px' }}>
                  <small style={{ color: '#38bdf8' }}>{log.timestamp}</small> <strong>{log.tipo}:</strong> {log.status}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PLANTA ARQUITETÔNICA */}
        <section className="card map-card">
          <div className="map-header">
            <h2>PLANTA BAIXA ARQUITETÔNICA</h2>
          </div>

          <div className="house-map-layout">
            <div className={`map-room ${luzes.corredor ? 'lit' : ''}`}>
              <div className="room-title">
                <span>CORREDOR</span>
                <span>{luzes.corredor ? '💡 LIGADO' : '🔌 DESLIGADO'}</span>
              </div>
              <div className="room-controls">
                <button className={`mini-btn ${luzes.corredor ? 'active-on' : ''}`} onClick={() => toggleLuz('corredor')}>Luz</button>
                <button className={`mini-btn ${portas.principal ? 'active-off' : 'active-on'}`} onClick={() => togglePorta('principal')}>
                  🚪 Porta: {portas.principal ? 'Aberta' : 'Trancada'}
                </button>
              </div>
            </div>

            <div className={`map-room ${luzes.sala ? 'lit' : ''}`}>
              <div className="room-title">
                <span>SALA DE ESTAR</span>
                <span>{luzes.sala ? '💡 LIGADO' : '🔌 DESLIGADO'}</span>
              </div>
              <div className="room-controls">
                <button className={`mini-btn ${luzes.sala ? 'active-on' : ''}`} onClick={() => toggleLuz('sala')}>Luz</button>
                <button className={`mini-btn ${janelas.sala ? 'active-off' : 'active-on'}`} onClick={() => toggleJanela('sala')}>
                  🪟 Janela: {janelas.sala ? 'Aberta' : 'Fechada'}
                </button>
              </div>
            </div>

            <div className={`map-room ${luzes.quarto ? 'lit' : ''}`}>
              <div className="room-title">
                <span>QUARTO PRINCIPAL</span>
                <span>{luzes.quarto ? '💡 LIGADO' : '🔌 DESLIGADO'}</span>
              </div>
              <div className="room-controls">
                <button className={`mini-btn ${luzes.quarto ? 'active-on' : ''}`} onClick={() => toggleLuz('quarto')}>Luz</button>
                <button className={`mini-btn ${portas.quarto ? 'active-off' : 'active-on'}`} onClick={() => togglePorta('quarto')}>
                  🚪 Porta: {portas.quarto ? 'Aberta' : 'Trancada'}
                </button>
              </div>
            </div>

            <div className={`map-room ${luzes.cozinha ? 'lit' : ''} ${incendio || gas ? 'hazard-room' : ''}`}>
              <div className="room-title">
                <span>COZINHA & ÁREA</span>
                <span>{luzes.cozinha ? '💡 LIGADO' : '🔌 DESLIGADO'}</span>
              </div>
              <div className="room-controls">
                <button className={`mini-btn ${luzes.cozinha ? 'active-on' : ''}`} onClick={() => toggleLuz('cozinha')}>Luz</button>
                <button className={`mini-btn ${janelas.cozinha ? 'active-off' : 'active-on'}`} onClick={() => toggleJanela('cozinha')}>
                  🪟 Janela: {janelas.cozinha ? 'Aberta' : 'Fechada'}
                </button>
              </div>
              <div className="room-controls" style={{ marginTop: '5px' }}>
                <button className={`mini-btn ${incendio ? 'active-off' : ''}`} onClick={() => { setIncendio(!incendio); registrarEventoAPI('Perigo', 'Incêndio alternado'); }}>🔥 Fogo</button>
                <button className={`mini-btn ${gas ? 'active-off' : ''}`} onClick={() => { setGas(!gas); registrarEventoAPI('Perigo', 'Gás alternado'); }}>⚠️ Gás</button>
              </div>
            </div>
          </div>
        </section>

        {/* CHATBOT */}
        <section className="card log-card">
          <div className="chatbot-widget">
            <h3>💬 ASSISTENTE SENTINELA</h3>
            <div className="chat-history">
              {historicoChat.map((msg, index) => (
                <div key={index} className={`chat-msg ${msg.tipo}`}>
                  {msg.texto}
                </div>
              ))}
            </div>
            <form onSubmit={enviarMensagem} className="chat-input-area">
              <input 
                type="text" 
                value={inputTexto} 
                onChange={(e) => setInputTexto(e.target.value)} 
                placeholder="Ex: Trancar tudo..." 
              />
              <button type="submit">Enviar</button>
            </form>
          </div>

          <div className="emergency-actions" style={{ marginTop: '15px' }}>
            <button className="btn-emergency btn-fire" onClick={() => { setIncendio(!incendio); registrarEventoAPI('Emergência', 'Incêndio acionado'); }}>🚨 ACIONAR INCÊNDIO</button>
            <button className="btn-emergency btn-police" onClick={() => { setAlertaPolicial(!alertaPolicial); registrarEventoAPI('Emergência', 'Alerta Policial'); }}>🚔 ALERTA POLICIAL</button>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;