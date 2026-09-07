import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Interface seguindo princípios de boas práticas
interface SensorLog {
  id: number;
  tipo: string;
  status: string;
  timestamp: string;
}

let logsSistema: SensorLog[] = [
  { id: 1, tipo: 'Sistema', status: 'Sentinel Back-End Online via TypeScript', timestamp: new Date().toLocaleTimeString() }
];

// Rota GET: Retorna o status atual e logs do sistema para o Front-End
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'Operacional',
    conexao: 'Estável',
    totalLogs: logsSistema.length,
    logs: logsSistema
  });
});

// Rota POST: Recebe eventos críticos da casa (Ex: incêndio, invasão)
app.post('/api/evento', (req: Request, res: Response) => {
  const { tipo, status } = req.body;
  
  const novoLog: SensorLog = {
    id: logsSistema.length + 1,
    tipo: tipo || 'Geral',
    status: status || 'Atualizado',
    timestamp: new Date().toLocaleTimeString()
  };

  logsSistema.unshift(novoLog); // Adiciona no topo
  res.status(201).json({ mensagem: 'Evento registrado com sucesso no Back-End', log: novoLog });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Back-End rodando na porta ${PORT}`);
});