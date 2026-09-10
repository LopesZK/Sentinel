import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuração do Banco de Dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Davi2005',
    database: 'sentinel_db'
};

// 2. Configuração do Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Sentinel 3.0 - Smart Home Intelligence',
            version: '1.0.0',
            description: 'Documentação oficial do motor de biometria e segurança da ExpoTech 2026.2',
        },
        servers: [{ url: 'http://localhost:3000' }],
    },
    apis: ['./server.ts'],
};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 3. Função de Validação Biométrica
function calcularDistanciaEuclidiana(vetorA: number[], vetorB: number[]) {
    let soma = 0;
    for (let i = 0; i < vetorA.length; i++) {
        const a = vetorA[i] ?? 0;
        const b = vetorB[i] ?? 0;
        soma += Math.pow(a - b, 2);
    }
    return Math.sqrt(soma);
}

/**
 * @swagger
 * /api/biometria/treinar:
 *   post:
 *     summary: Cadastra a biometria facial no banco de dados MySQL
 */
app.post('/api/biometria/treinar', async (req, res) => {
    const { nome, descriptor } = req.body;

    if (!nome || !descriptor || descriptor.length !== 128) {
        return res.status(400).json({ erro: "Dados inválidos. O vetor deve ter 128 pontos." });
    }

    try {
        const conexao = await mysql.createConnection(dbConfig);
        await conexao.execute('INSERT INTO biometria (nome, descriptor) VALUES (?, ?)', [nome, JSON.stringify(descriptor)]);
        await conexao.end();
        
        console.log(`[LOG] Novo morador salvo no banco: ${nome}`);
        res.status(201).json({ mensagem: `Biometria de ${nome} salva no cofre com sucesso!` });
    } catch (erro) {
        console.error("Erro MySQL:", erro);
        res.status(500).json({ erro: "Erro ao salvar no banco de dados." });
    }
});

/**
 * @swagger
 * /api/biometria/autenticar:
 *   post:
 *     summary: Autentica o rosto lido com os registros do banco de dados
 */
app.post('/api/biometria/autenticar', async (req, res) => {
    const { descriptorLeitura } = req.body;

    try {
        const conexao = await mysql.createConnection(dbConfig);
        const [rows] = await conexao.execute('SELECT nome, descriptor FROM biometria');
        await conexao.end();

        let melhorCorrespondencia = { nome: "DESCONHECIDO", distancia: 1.0 };
        const LIMITE_DE_TOLERANCIA = 0.5;

        // Compara o rosto da câmera com TODOS os rostos do banco MySQL
        for (const usuario of (rows as any[])) {
            // Garante que o vetor lido do banco volte a ser um Array
            const descriptorSalvo = typeof usuario.descriptor === 'string' ? JSON.parse(usuario.descriptor) : usuario.descriptor;
            const distancia = calcularDistanciaEuclidiana(descriptorLeitura, descriptorSalvo);
            
            if (distancia < melhorCorrespondencia.distancia) {
                melhorCorrespondencia = { nome: usuario.nome, distancia };
            }
        }

        if (melhorCorrespondencia.distancia < LIMITE_DE_TOLERANCIA) {
            res.json({ status: "LIBERADO", usuario: melhorCorrespondencia.nome, acao: "Destrancar porta" });
        } else {
            res.status(403).json({ status: "NEGADO", alerta: "CRITICO", acao: "Acionar risco 100% e chamar 190" });
        }

    } catch (erro) {
        console.error("Erro na autenticação:", erro);
        res.status(500).json({ erro: "Erro ao consultar o banco de dados." });
    }
});

app.listen(3000, () => {
    console.log('🛡️ Motor Sentinel 3.0 Back-End rodando na porta 3000');
    console.log('📄 Swagger disponível em: http://localhost:3000/api-docs');
});