import express from 'express';
import multer from 'multer';
import expenseController from '../controllers/expenseController.js';
import { autenticar } from '../middleware/autenticacao.js';

const roteador = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

roteador.use(autenticar);

/**
 * @swagger
 * tags:
 *   name: Despesas
 *   description: Gerenciamento de despesas pessoais
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Despesa:
 *       type: object
 *       required:
 *         - descricao
 *         - valor
 *         - categoria
 *         - data
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da despesa
 *           example: 1
 *         descricao:
 *           type: string
 *           description: Descrição da despesa
 *           example: Almoço no restaurante
 *         valor:
 *           type: number
 *           format: float
 *           description: Valor da despesa
 *           example: 45.50
 *         categoria:
 *           type: string
 *           enum: [ALIMENTACAO, TRANSPORTE, SAUDE, EDUCACAO, LAZER, MORADIA, OUTROS]
 *           description: Categoria da despesa
 *           example: ALIMENTACAO
 *         data:
 *           type: string
 *           format: date
 *           description: Data da despesa
 *           example: 2024-01-15
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *           example: Pagamento em dinheiro
 *         usuarioId:
 *           type: integer
 *           description: ID do usuário
 *           example: 1
 *         criadoEm:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         atualizadoEm:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 */

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Listar todas as despesas do usuário
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [ALIMENTACAO, TRANSPORTE, SAUDE, EDUCACAO, LAZER, MORADIA, OUTROS]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: ordenar
 *         schema:
 *           type: string
 *           enum: [data, valor, categoria]
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Lista de despesas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Despesa'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
roteador.get('/', expenseController.listar);

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Criar uma nova despesa
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descricao
 *               - valor
 *               - categoria
 *               - data
 *             properties:
 *               descricao:
 *                 type: string
 *                 example: Almoço no restaurante
 *               valor:
 *                 type: number
 *                 format: float
 *                 example: 45.50
 *               categoria:
 *                 type: string
 *                 enum: [ALIMENTACAO, TRANSPORTE, SAUDE, EDUCACAO, LAZER, MORADIA, OUTROS]
 *                 example: ALIMENTACAO
 *               data:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               observacoes:
 *                 type: string
 *                 example: Pagamento em dinheiro
 *     responses:
 *       201:
 *         description: Despesa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Despesa'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
roteador.post('/', expenseController.criar);

/**
 * @swagger
 * /api/expenses/report:
 *   get:
 *     summary: Obter relatório de despesas
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Relatório gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   format: float
 *                   example: 1250.75
 *                 porCategoria:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   example:
 *                     ALIMENTACAO: 450.00
 *                     TRANSPORTE: 300.00
 *                     LAZER: 500.75
 *                 totalDespesas:
 *                   type: integer
 *                   example: 15
 *                 periodo:
 *                   type: object
 *                   properties:
 *                     inicio:
 *                       type: string
 *                       format: date
 *                     fim:
 *                       type: string
 *                       format: date
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
roteador.get('/report', expenseController.relatorio);

/**
 * @swagger
 * /api/expenses/export:
 *   get:
 *     summary: Exportar despesas em CSV
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: CSV gerado com sucesso
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
roteador.get('/export', expenseController.exportar);

/**
 * @swagger
 * /api/expenses/import:
 *   post:
 *     summary: Importar despesas de arquivo CSV
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo CSV com despesas
 *     responses:
 *       200:
 *         description: Despesas importadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 2 despesas importadas com sucesso
 *                 importadas:
 *                   type: integer
 *                   example: 2
 *                 erros:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       linha:
 *                         type: integer
 *                       erro:
 *                         type: string
 *       400:
 *         description: Arquivo não enviado ou formato inválido
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
roteador.post('/import', upload.single('file'), expenseController.importar);

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Obter uma despesa específica
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da despesa
 *     responses:
 *       200:
 *         description: Despesa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Despesa'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Despesa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
roteador.get('/:id', expenseController.obter);

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Atualizar uma despesa
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da despesa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *                 example: Jantar no restaurante
 *               valor:
 *                 type: number
 *                 format: float
 *                 example: 55.00
 *               categoria:
 *                 type: string
 *                 enum: [ALIMENTACAO, TRANSPORTE, SAUDE, EDUCACAO, LAZER, MORADIA, OUTROS]
 *                 example: ALIMENTACAO
 *               data:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               observacoes:
 *                 type: string
 *                 example: Pagamento em cartão
 *     responses:
 *       200:
 *         description: Despesa atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Despesa'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Despesa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
roteador.put('/:id', expenseController.atualizar);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Deletar uma despesa
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da despesa
 *     responses:
 *       200:
 *         description: Despesa deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Despesa deletada com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Despesa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
roteador.delete('/:id', expenseController.deletar);

export default roteador;

