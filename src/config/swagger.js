import swaggerJsdoc from 'swagger-jsdoc';

const opcoes = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VittaCash API',
      version: '1.0.0',
      description: 'API REST para controle de gastos pessoais',
      contact: {
        name: 'VittaCash Team',
        email: 'contato@vittacash.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Desenvolvimento',
      },
      {
        url: 'https://vittacash-api.onrender.com',
        description: 'Produção',
      },
    ],
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

