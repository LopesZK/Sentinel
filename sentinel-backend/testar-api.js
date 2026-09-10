const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function executarTeste() {
  console.log("🔄 1. Cadastrando o rosto do morador...");
  
  // Criando um vetor fictício de 128 pontos para representar o "Seu Rosto"
  const vetorMorador = Array.from({ length: 128 }, () => Math.random() * 0.1);

  const resTreino = await fetch('http://localhost:3000/api/biometria/treinar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: "Davi (Morador)", descriptor: vetorMorador })
  });
  console.log(await resTreino.json());

  console.log("\n🔄 2. Testando autenticação com o MESMO rosto (Deve liberar)...");
  const resAuth1 = await fetch('http://localhost:3000/api/biometria/autenticar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descriptorLeitura: vetorMorador })
  });
  console.log("Resposta do Servidor:", await resAuth1.json());

  console.log("\n🔄 3. Testando autenticação com rosto DESCONHECIDO (Deve negar)...");
  // Vetor totalmente diferente (intruso)
  const vetorIntruso = Array.from({ length: 128 }, () => Math.random() + 0.8);
  
  const resAuth2 = await fetch('http://localhost:3000/api/biometria/autenticar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descriptorLeitura: vetorIntruso })
  });
  console.log("Resposta do Servidor:", await resAuth2.json());
}

executarTeste();