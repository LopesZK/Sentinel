import { useState, useEffect } from 'react';
import './index.css';

function App() {
  // Estados do Sistema (Sensores e Alertas)
  const [portaPrincipal, setPortaPrincipal] = useState(false);
  const [janelaSala, setJanelaSala] = useState(false);
  const [incendio, setIncendio] = useState(false);
  const [gas, setGas] = useState(false);
  const [alertaPolicial, setAlertaPolicial] = useState(false);
  const [risco, setRisco] = useState(10);
  const [ultimoAcesso, setUltimoAcesso] = useState('Aguardando...');
  
  // Estados do Chatbot
  const [historicoChat, setHistoricoChat] = useState([
    { texto: 'Olá! Sou o Sentinel Assistant. Como posso ajudar com a segurança da casa hoje?', tipo: 'system-msg' }
  ]);
  const [inputTexto, setInputTexto] = useState('');

  // Motor Preditivo de Risco Reativo
  useEffect(() => {
    let score = 10;
    if (portaPrincipal) score += 25;
    if (janelaSala) score += 20;
    if (gas) score += 50;
    if (incendio) score += 70;
    if (alertaPolicial) score += 90;
    
    setRisco(score > 100 ? 100 : score);
  }, [portaPrincipal, janelaSala, gas, incendio, alertaPolicial]);

  const getCorRisco = () => {
    if (risco < 30) return '#10b981';
    if (risco < 70) return '#f59e0b';
    return '#ef4444';
  };

  // Funções de Ação dos Sensores
  const togglePorta = () => {
    setPortaPrincipal(!portaPrincipal);
    setUltimoAcesso(portaPrincipal ? 'Porta Fechada' : 'Porta Aberta manualmente');
  };

  const toggleJanela = () => setJanelaSala(!janelaSala);
  const toggleIncendio = () => setIncendio(!incendio);
  const toggleGas = () => setGas(!gas);

  // Lógica do Chatbot Local
  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!inputTexto.trim()) return;

    const novaMsg = inputTexto;
    setHistoricoChat(prev => [...prev, { texto: novaMsg, tipo: 'user-msg' }]);
    setInputTexto('');

    setTimeout(() => {
      let resposta = "Comando não reconhecido. Pergunte sobre o 'risco' ou peça para 'trancar a porta'.";
      const msgLower = novaMsg.toLowerCase();

      if (msgLower.includes('risco') || msgLower.includes('status')) {
        resposta = `O risco atual da casa é de ${risco}%. ${portaPrincipal ? 'Atenção: Porta aberta.' : 'Seguro.'}`;
      } else if (msgLower.includes('trancar') || msgLower.includes('fechar')) {
        setPortaPrincipal(false);
        resposta = "A porta principal foi trancada com sucesso.";
      } else if (msgLower.includes('polícia') || msgLower.includes('190')) {
        setAlertaPolicial(true);
        resposta = "⚠️ ALERTA: Protocolo de segurança acionado para a Polícia Militar!";
      }

      setHistoricoChat(prev => [...prev, { texto: resposta, tipo: 'system-msg' }]);
    }, 500);
  };

  return (
    <>
      <header className="navbar">
        <div className="logo">
          <span className="shield-icon">🛡️</span>
          <h1>SENTINEL <span>2.1 (React Pro)</span></h1>
        </div>
        <div className="system-status">
          <span className="status-dot green"></span> SISTEMA TOTALMENTE ATIVO
        </div>
      </header>

      <main className="dashboard-grid">
        {/* COLUNA ESQUERDA: RISCO E STATUS */}
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
            <h3>STATUS DOS SENSORES</h3>
            <div className="status-item">
              <span>Porta Principal:</span>
              <strong className={portaPrincipal ? 'text-red' : 'text-green'}>
                {portaPrincipal ? 'ABERTA' : 'TRANCADA'}
              </strong>
            </div>
            <div className="status-item">
              <span>Janela da Sala:</span>
              <strong className={janelaSala ? 'text-red' : 'text-green'}>
                {janelaSala ? 'ABERTA' : 'FECHADA'}
              </strong>
            </div>
            <div className="status-item">
              <span>Sensor Fumaça:</span>
              <strong className={incendio ? 'text-red' : 'text-green'}>
                {incendio ? 'FOGO DETECTADO' : 'NORMAL'}
              </strong>
            </div>
            <div className="status-item">
              <span>Sensor Gás:</span>
              <strong className={gas ? 'text-red' : 'text-green'}>
                {gas ? 'VAZAMENTO' : 'NORMAL'}
              </strong>
            </div>
            <div className="status-item">
              <span>Último Evento:</span>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{ultimoAcesso}</span>
            </div>
          </div>
        </section>

        {/* COLUNA CENTRAL: MAPA 2D DA CASA */}
        <section className="card map-card">
          <div className="map-header">
            <h2>PLANTA BAIXA 2D (SMART HOME)</h2>
            <span className="instruction">Clique nos elementos para interagir</span>
          </div>

          <div className="house-map">
            <div className="room hallway">CORREDOR</div>
            <div className="room living-room">SALA DE ESTAR</div>
            <div className="room bedroom">QUARTO</div>
            <div className={`room kitchen ${incendio ? 'hazard' : ''}`}>COZINHA</div>

            {/* Botões interativos dos sensores */}
            <button 
              className={`sensor-btn door-main ${portaPrincipal ? 'open' : ''}`}
              onClick={togglePorta}
            >
              🚪 Porta ({portaPrincipal ? 'ABERTA' : 'TRANCADA'})
            </button>

            <button 
              className={`sensor-btn window-living ${janelaSala ? 'open' : ''}`}
              onClick={toggleJanela}
            >
              🪟 Janela ({janelaSala ? 'ABERTA' : 'FECHADA'})
            </button>

            <button 
              className={`sensor-btn sensor-fire ${incendio ? 'active' : ''}`}
              onClick={toggleIncendio}
            >
              🔥 Fumaça
            </button>

            <button 
              className={`sensor-btn sensor-gas ${gas ? 'active' : ''}`}
              onClick={toggleGas}
            >
              ⚠️ Gás GLP
            </button>
          </div>
        </section>

        {/* COLUNA DIREITA: CHATBOT E EMERGÊNCIA */}
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

          <div className="emergency-actions" style={{ marginTop: '20px' }}>
            <button className="btn-emergency btn-fire" onClick={() => setIncendio(true)}>🚨 SIMULAR INCÊNDIO</button>
            <button className="btn-emergency btn-police" onClick={() => setAlertaPolicial(true)}>🚔 ALERTA POLICIAL</button>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;