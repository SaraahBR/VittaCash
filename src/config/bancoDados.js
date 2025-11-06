import { PrismaClient } from '@prisma/client';

// Criar instância única do Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Conectar ao banco
prisma.$connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL'))
  .catch((erro) => console.error('❌ Erro ao conectar ao banco:', erro));

// Desconectar ao finalizar processo
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

