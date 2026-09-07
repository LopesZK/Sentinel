import { useState, useEffect } from 'react';
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

  // Estados do Chatbot
  const [historicoChat, setHistoricoChat] = useState([
    { texto: 'Sentinel Assistant online e conectado ao Back-End TypeScript.', tipo: 'system-msg' }
  ]);
  const [inputTexto, setInputTexto] = useState('');

  // Sincronizar com o Back-End (API Node.js)
  useEffect(() => {
    fetch('http://localhost:3001/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setLogsServidor(data.logs);
      })
      .catch(err => console.error("Erro ao conectar com o Back-End:", err));
  }, []);

  // Função para registrar eventos na API
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
      console.error("Erro ao enviar evento para a API:", err);
    }
  };

  // Motor Preditivo Dinâmico
  useEffect(() => {
    let score = 10;
    if (portas.principal) score += 20;
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

    const novaMsg = inputTexto;
    setHistoricoChat(prev => [...prev, { texto: novaMsg, tipo: 'user-msg' }]);
    setInputTexto('');

    setTimeout(() => {
      let resposta = "Comando processado pelo Sentinel Assistant.";
      const msg = novaMsg.toLowerCase();

      if (msg.includes('risco')) {
        resposta = `O índice de risco atual monitorado pela API é de ${risco}%.`;
      } else if (msg.includes('trancar')) {
        setPortas({ principal: false, quarto: false });
        setJanelas({ sala: false, cozinha: false });
        resposta = "Todos os acessos foram trancados com segurança.";
      }

      setHistoricoChat(prev => [...prev, { texto: resposta, tipo: 'system-msg' }]);
    }, 400);
  };

  return (
    <>
      <header className="navbar">
        <div className="logo">
          <span className="shield-icon">🛡️</span>
          <h1>SENTINEL <span>2.1 (Full-Stack Integrado)</span></h1>
        </div>
        <div className="system-status">
          <span className="status-dot green"></span> API NODE.JS CONECTADA
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="card risk-card">
          <h2>ÍNDICE PREDITIVO DE RISCO</h2>
          <div className="gauge-container">
            <div 
              className="gauge-circle" 
              style={{ borderColor: getCorRisco(), boxShadow: `0 0 20px ${getCorRisco()}66` }}
            >
              <span className="gauge-value">{risco}%</span>
              <span className="gauge-label">
                {risco < 30 ? 'RISCO BAIXO' : risco < 70 ? 'ATENÇÃO' : 'ALERTA MÁXIMO'}
              </span>
            </div>
          </div>

          <div className="device-summary">
            <h3>LOGS DO SERVIDOR (API)</h3>
            <div className="log-feed" style={{ maxHeight: '150px', overflowY: 'auto', background: '#0f172a', padding: '8px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {logsServidor.map((log, index) => (
                <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #1e293b', paddingBottom: '3px' }}>
                  <small style={{ color: '#38bdf8' }}>{log.timestamp}</small> <strong>{log.tipo}:</strong> {log.status}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card map-card">
          <div className="map-header">
            <h2>PLANTA BAIXA ARQUITETÔNICA (FULL-STACK)</h2>
          </div>

          <div className="house-map-layout">
            <div className={`map-room ${luzes.corredor ? 'lit' : ''}`}>
              <div className="room-title">
                <span>CORREDOR</span>
                <span>{luzes.corredor ? '💡 ON' : '🔌 OFF'}</span>
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
                <span>{luzes.sala ? '💡 ON' : '🔌 OFF'}</span>
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
                <span>{luzes.quarto ? '💡 ON' : '🔌 OFF'}</span>
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
                <span>{luzes.cozinha ? '💡 ON' : '🔌 OFF'}</span>
              </div>
              <div className="room-controls">
                <button className={`mini-btn ${luzes.cozinha ? 'active-on' : ''}`} onClick={() => toggleLuz('cozinha')}>Luz</button>
                <button className={`mini-btn ${incendio ? 'active-off' : ''}`} onClick={() => { setIncendio(!incendio); registrarEventoAPI('Perigo', 'Incêndio alternado'); }}>🔥 Fogo</button>
                <button className={`mini-btn ${gas ? 'active-off' : ''}`} onClick={() => { setGas(!gas); registrarEventoAPI('Perigo', 'Gás alternado'); }}>⚠️ Gás</button>
              </div>
            </div>
          </div>
        </section>

        <section className="card log-card">
          <div className="chatbot-widget">
            <h3>💬 SENTINEL ASSISTANT</h3>
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
                placeholder="Digite um comando..." 
              />
              <button type="submit">Enviar</button>
            </form>
          </div>

          <div className="emergency-actions" style={{ marginTop: '15px' }}>
            <button className="btn-emergency btn-fire" onClick={() => { setIncendio(!incendio); registrarEventoAPI('Emergência', 'Botão de Incêndio Acionado'); }}>🚨 ACIONAR INCÊNDIO</button>
            <button className="btn-emergency btn-police" onClick={() => { setAlertaPolicial(!alertaPolicial); registrarEventoAPI('Emergência', 'Alerta Policial Ativado'); }}>🚔 ALERTA POLICIAL</button>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;