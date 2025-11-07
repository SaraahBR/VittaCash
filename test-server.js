#!/usr/bin/env node

/**
 * Script de teste para verificar se o servidor pode iniciar
 * Usado para debug de erros 502 no Render
 */

import 'reflect-metadata';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 Verificando configuração do servidor...\n');

// 1. Verificar variáveis de ambiente obrigatórias
const variaveis = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'DIRECT_URL': process.env.DIRECT_URL,
  'JWT_SECRET': process.env.JWT_SECRET,
  'NODE_ENV': process.env.NODE_ENV,
  'PORT': process.env.PORT,
  'FRONTEND_URL': process.env.FRONTEND_URL,
};

console.log('📋 Variáveis de ambiente:');
for (const [chave, valor] of Object.entries(variaveis)) {
  const status = valor ? '✅' : '❌';
  const exibir = chave.includes('SECRET') || chave.includes('URL')
    ? (valor ? `${valor.substring(0, 20)}...` : 'não definida')
    : valor || 'não definida';
  console.log(`  ${status} ${chave}: ${exibir}`);
}
console.log();

// 2. Verificar dependências
console.log('📦 Verificando dependências...');
try {
  await import('express');
  console.log('  ✅ express');
} catch (e) {
  console.log('  ❌ express:', e.message);
}

try {
  await import('@prisma/client');
  console.log('  ✅ @prisma/client');
} catch (e) {
  console.log('  ❌ @prisma/client:', e.message);
}

try {
  await import('cors');
  console.log('  ✅ cors');
} catch (e) {
  console.log('  ❌ cors:', e.message);
}

try {
  await import('swagger-ui-express');
  console.log('  ✅ swagger-ui-express');
} catch (e) {
  console.log('  ❌ swagger-ui-express:', e.message);
}
console.log();

// 3. Testar conexão com banco de dados
console.log('🗄️  Testando conexão com banco de dados...');
try {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  await prisma.$connect();
  console.log('  ✅ Conexão com PostgreSQL bem-sucedida!');

  // Testar uma query simples
  const count = await prisma.user.count();
  console.log(`  ℹ️  Total de usuários no banco: ${count}`);

  await prisma.$disconnect();
} catch (erro) {
  console.log('  ❌ Erro ao conectar:', erro.message);
}
console.log();

// 4. Testar importação do servidor
console.log('🚀 Testando importação do servidor...');
try {
  const { default: app } = await import('./server.js');
  console.log('  ✅ Servidor importado com sucesso!');

  // Tentar iniciar na porta de teste
  const PORTA_TESTE = process.env.PORT || 4000;
  const server = app.listen(PORTA_TESTE, () => {
    console.log(`  ✅ Servidor teste iniciado na porta ${PORTA_TESTE}`);

    // Encerrar após 2 segundos
    setTimeout(() => {
      server.close(() => {
        console.log('  ✅ Servidor teste encerrado com sucesso!');
        console.log('\n✅ TUDO OK! Servidor está funcionando corretamente.');
        process.exit(0);
      });
    }, 2000);
  });

  server.on('error', (erro) => {
    console.log('  ❌ Erro ao iniciar servidor:', erro.message);
    process.exit(1);
  });

} catch (erro) {
  console.log('  ❌ Erro ao importar servidor:', erro.message);
  console.log('  Stack:', erro.stack);
  process.exit(1);
}

