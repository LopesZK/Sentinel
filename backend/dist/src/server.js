"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
let logsSistema = [
    { id: 1, tipo: 'Sistema', status: 'Sentinel Back-End Online via TypeScript', timestamp: new Date().toLocaleTimeString() }
];
// Rota GET: Retorna o status atual e logs do sistema para o Front-End
app.get('/api/status', (req, res) => {
    res.json({
        status: 'Operacional',
        conexao: 'Estável',
        totalLogs: logsSistema.length,
        logs: logsSistema
    });
});
// Rota POST: Recebe eventos críticos da casa (Ex: incêndio, invasão)
app.post('/api/evento', (req, res) => {
    const { tipo, status } = req.body;
    const novoLog = {
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
