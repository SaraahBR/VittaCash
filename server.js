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
        const origensPermitidas = process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || ['http://localhost:3000'];

        // Permitir requisições sem origin (ex: Postman, curl) em desenvolvimento
        if (!origin && process.env.NODE_ENV === 'development') {
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
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

app.listen(PORTA, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor VittaCash rodando!`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🌐 URL: http://localhost:${PORTA} (redireciona para /api-docs)`);
    console.log(`📚 Documentação: http://localhost:${PORTA}/api-docs`);
    console.log(`🎯 Frontend permitido: ${process.env.FRONTEND_URL}`);
    console.log('='.repeat(50));
});

export default app;