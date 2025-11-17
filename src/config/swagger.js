import swaggerJsdoc from 'swagger-jsdoc';

// Detectar ambiente e configurar URLs
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 4000;

// Configurar servidores baseado no ambiente
const servers = isProduction
  ? [
      {
        url: 'https://vittacash.onrender.com',
        description: 'Produção (Render)',
      },
      {
        url: 'http://localhost:4000',
        description: 'Desenvolvimento Local',
      },
    ]
  : [
      {
        url: `http://localhost:${port}`,
        description: 'Desenvolvimento Local',
      },
      {
        url: 'https://vittacash.onrender.com',
        description: 'Produção (Render)',
      },
    ];

const opcoes = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VittaCash API',
      version: '1.0.0',
      description: 'API REST para gerenciamento de finanças pessoais - Controle suas despesas de forma inteligente',
      contact: {
        name: 'Sarah Hernandes',
        email: 'vihernandesbr@gmail.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{bearerAuth: []}],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const especificacaoSwagger = swaggerJsdoc(opcoes);

