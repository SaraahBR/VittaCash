import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { especificacaoSwagger } from './src/config/swagger.js';
import expenseRoutes from './src/routes/expenseRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import { tratadorErro } from './src/middleware/tratadorErro.js';

dotenv.config();

const app = express();
const PORTA = process.env.PORT || 4000;

// Configuração CORS - Suporta múltiplas origens
const corsOptions = {
    origin: (origin, callback) => {
        // Lista de origens permitidas (separadas por vírgula no .env)
        const origensPermitidas = [
            'http://localhost:3000',
            'http://localhost:4000', // Swagger local
            'https://vittacash.onrender.com', // Backend em produção
            'https://vittacash.vercel.app', // Frontend em produção (quando houver)
            ...(process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [])
        ];

        // Permitir requisições sem origin (Swagger, Postman, curl, health checks)
        if (!origin) {
            return callback(null, true);
        }

        // Verificar se a origem está na lista de permitidas
        if (origensPermitidas.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS bloqueou origem: ${origin}`);
            console.warn(`✅ Origens permitidas: ${origensPermitidas.join(', ')}`);
            callback(new Error('Não permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 horas de cache para preflight
};

app.use(cors(corsOptions));

// Headers de segurança adicionais (mas flexíveis para Google Auth)
app.use((req, res, next) => {
    // Permitir iframes do Google (para OAuth popup)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Cross-Origin-Opener-Policy mais permissivo para Google Auth
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    // Cross-Origin-Embedder-Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

    // Content Security Policy básico
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "frame-src 'self' https://accounts.google.com;"
    );

    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`📝 ${req.method} ${req.path}`);
        next();
    });
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(especificacaoSwagger, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'VittaCash API Docs',
}));

app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        ambiente: process.env.NODE_ENV,
        googleAuth: {
            configurado: !!process.env.GOOGLE_CLIENT_ID,
            clientIdPreview: process.env.GOOGLE_CLIENT_ID ?
                process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' :
                'não configurado'
        }
    });
});

// Endpoint de teste para Google Auth
app.get('/api/test/google-auth', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID ?
            process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' :
            'não configurado',
        jwtSecret: process.env.JWT_SECRET ? 'configurado' : 'não configurado',
        cors: {
            frontendUrl: process.env.FRONTEND_URL || 'não configurado',
            allowedOrigins: [
                'http://localhost:3000',
                'https://vittacash.onrender.com',
                'https://vittacash.vercel.app',
                ...(process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [])
            ]
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada',
        caminho: req.path,
    });
});

app.use(tratadorErro);

// Tratamento de erros não capturados
process.on('uncaughtException', (erro) => {
    console.error('❌ Erro não capturado:', erro);
    console.error('Stack:', erro.stack);
});

process.on('unhandledRejection', (motivo, promise) => {
    console.error('❌ Promise rejeitada não tratada:', motivo);
    console.error('Promise:', promise);
});

// Iniciar servidor
const server = app.listen(PORTA, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor VittaCash rodando!`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Porta: ${PORTA}`);
    console.log(`🌐 Host: 0.0.0.0 (todas interfaces)`);
    console.log(`📚 Documentação: /api-docs`);
    console.log(`❤️  Health Check: /health`);
    console.log(`🎯 Frontend permitido: ${process.env.FRONTEND_URL || 'não configurado'}`);
    console.log('='.repeat(50));
});

// Tratamento de erro ao iniciar servidor
server.on('error', (erro) => {
    if (erro.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORTA} já está em uso`);
    } else {
        console.error('❌ Erro ao iniciar servidor:', erro);
    }
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n⚠️  Recebido sinal de término, encerrando graciosamente...');
    server.close(() => {
        console.log('✅ Servidor encerrado');
        process.exit(0);
    });

    // Forçar encerramento após 10 segundos
    setTimeout(() => {
        console.error('❌ Forçando encerramento após timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;