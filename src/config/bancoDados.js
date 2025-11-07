import { PrismaClient } from '@prisma/client';

// Criar instância única do Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Conectar ao banco com retry
let tentativasConexao = 0;
const MAX_TENTATIVAS = 3;

async function conectarBanco() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao PostgreSQL (Supabase)');
    return true;
  } catch (erro) {
    tentativasConexao++;
    console.error(`❌ Erro ao conectar ao banco (tentativa ${tentativasConexao}/${MAX_TENTATIVAS}):`, erro.message);

    if (tentativasConexao < MAX_TENTATIVAS) {
      console.log(`⏳ Tentando reconectar em 3 segundos...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return conectarBanco();
    } else {
      console.error('❌ Não foi possível conectar ao banco após várias tentativas');
      console.error('⚠️  Servidor continuará rodando, mas rotas de banco falharão');
      return false;
    }
  }
}

// Tentar conectar
conectarBanco();

// Desconectar ao finalizar processo
process.on('beforeExit', async () => {
  try {
    await prisma.$disconnect();
    console.log('👋 Desconectado do banco de dados');
  } catch (erro) {
    console.error('❌ Erro ao desconectar:', erro.message);
  }
});

// Lidar com sinais de término
process.on('SIGINT', async () => {
  console.log('\n⚠️  Recebido SIGINT, encerrando...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Recebido SIGTERM, encerrando...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

