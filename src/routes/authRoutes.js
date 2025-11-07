import express from 'express';
import authController from '../controllers/authController.js';
import { autenticar } from '../middleware/autenticacao.js';

const roteador = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Endpoints de autenticação e gerenciamento de usuários
 */

/**
 * @swagger
 * /api/auth/cadastrar:
 *   post:
 *     summary: Cadastrar novo usuário
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - confirmarSenha
 *             properties:
 *               nome:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@exemplo.com
 *               senha:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *               confirmarSenha:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Cadastro realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta.
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 */
roteador.post('/cadastrar', authController.cadastrar);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login tradicional com e-mail e senha
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@exemplo.com
 *               senha:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *                     imagem:
 *                       type: string
 *                     emailVerificado:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: E-mail ou senha incorretos
 */
roteador.post('/login', authController.loginTradicional);

/**
 * @swagger
 * /api/auth/login/google:
 *   post:
 *     summary: Login via Google OAuth
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenGoogle
 *             properties:
 *               tokenGoogle:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *                 ehNovoUsuario:
 *                   type: boolean
 *       401:
 *         description: Token do Google inválido
 */
roteador.post('/login/google', authController.loginGoogle);

/**
 * @swagger
 * /api/auth/verificar-email:
 *   get:
 *     summary: Verificar e-mail com token
 *     tags: [Autenticação]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: E-mail do usuário
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificação
 *     responses:
 *       200:
 *         description: E-mail verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       400:
 *         description: Token inválido ou expirado
 */
roteador.get('/verificar-email', authController.verificarEmail);

/**
 * @swagger
 * /api/auth/reenviar-verificacao:
 *   post:
 *     summary: Reenviar e-mail de verificação
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@exemplo.com
 *     responses:
 *       200:
 *         description: E-mail reenviado com sucesso
 *       400:
 *         description: E-mail já verificado ou usuário não encontrado
 */
roteador.post('/reenviar-verificacao', authController.reenviarVerificacao);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autenticado
 */
roteador.get('/me', autenticar, authController.obterUsuario);

export default roteador;

