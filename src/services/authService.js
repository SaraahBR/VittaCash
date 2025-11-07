import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/bancoDados.js';
import emailService from './emailService.js';
import { CadastrarUsuarioDTO } from '../dto/CadastrarUsuarioDTO.js';
import { LoginUsuarioDTO } from '../dto/LoginUsuarioDTO.js';
import { ErroValidacao, ErroNaoAutorizado, ErroNaoEncontrado } from '../utils/erros.js';

const clienteGoogle = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  /**
   * Cadastro tradicional com e-mail e senha
   */
  async cadastrarUsuario(dados) {
    const dto = new CadastrarUsuarioDTO(dados);
    const { error, value } = dto.validar();

    if (error) {
      const detalhes = error.details.map(d => d.message);
      throw new ErroValidacao('Dados inválidos', detalhes);
    }

    // Verificar se e-mail já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email: value.email },
    });

    if (usuarioExistente) {
      throw new ErroValidacao('E-mail já cadastrado', ['Este e-mail já está em uso']);
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(value.senha, 10);

    // Criar usuário
    const usuario = await prisma.user.create({
      data: {
        name: value.nome,
        email: value.email,
        password: senhaHash,
        emailVerified: null, // Aguardando verificação
      },
    });

    // Gerar token de verificação e enviar e-mail
    const tokenVerificacao = await emailService.criarTokenVerificacao(usuario.email);
    await emailService.enviarEmailVerificacao(usuario.email, usuario.name, tokenVerificacao);

    return {
      mensagem: 'Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta.',
      usuario: {
        id: usuario.id,
        nome: usuario.name,
        email: usuario.email,
      },
    };
  }

  /**
   * Login tradicional com e-mail e senha
   */
  async loginTradicional(dados) {
    const dto = new LoginUsuarioDTO(dados);
    const { error, value } = dto.validar();

    if (error) {
      const detalhes = error.details.map(d => d.message);
      throw new ErroValidacao('Dados inválidos', detalhes);
    }

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { email: value.email },
    });

    if (!usuario || !usuario.password) {
      throw new ErroNaoAutorizado('E-mail ou senha incorretos');
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(value.senha, usuario.password);

    if (!senhaValida) {
      throw new ErroNaoAutorizado('E-mail ou senha incorretos');
    }

    // Verificar se e-mail foi verificado
    if (!usuario.emailVerified) {
      throw new ErroNaoAutorizado('E-mail não verificado. Verifique sua caixa de entrada.');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { idUsuario: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.name,
        email: usuario.email,
        imagem: usuario.image,
        emailVerificado: usuario.emailVerified,
      },
    };
  }

  /**
   * Login via Google OAuth
   */
  async loginGoogle(tokenGoogle) {
    try {
      // Verificar token do Google
      const ticket = await clienteGoogle.verifyIdToken({
        idToken: tokenGoogle,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture, email_verified } = payload;

      // Buscar ou criar usuário
      let usuario = await prisma.user.findUnique({
        where: { email },
      });

      const ehNovoUsuario = !usuario;

      if (!usuario) {
        // Criar novo usuário via Google
        usuario = await prisma.user.create({
          data: {
            email,
            name,
            image: picture,
            emailVerified: email_verified ? new Date() : null,
          },
        });

        // Enviar e-mail de boas-vindas
        await emailService.enviarEmailBoasVindas(email, name);
      } else {
        // Atualizar informações se necessário
        if (!usuario.emailVerified && email_verified) {
          usuario = await prisma.user.update({
            where: { id: usuario.id },
            data: { emailVerified: new Date() },
          });
        }
      }

      // Gerar token JWT
      const token = jwt.sign(
        { idUsuario: usuario.id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.name,
          email: usuario.email,
          imagem: usuario.image,
          emailVerificado: usuario.emailVerified,
        },
        ehNovoUsuario,
      };
    } catch (erro) {
      console.error('Erro no login Google:', erro);
      throw new ErroNaoAutorizado('Token do Google inválido');
    }
  }

  /**
   * Verificar e-mail com token
   */
  async verificarEmail(email, token) {
    const resultado = await emailService.verificarToken(email, token);

    if (!resultado.valido) {
      throw new ErroValidacao(resultado.erro);
    }

    // Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }

    if (usuario.emailVerified) {
      throw new ErroValidacao('E-mail já verificado');
    }

    // Marcar e-mail como verificado
    await prisma.user.update({
      where: { id: usuario.id },
      data: { emailVerified: new Date() },
    });

    // Deletar token usado
    await emailService.deletarToken(email, token);

    // Gerar token JWT para login automático
    const tokenJWT = jwt.sign(
      { idUsuario: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      mensagem: 'E-mail verificado com sucesso!',
      token: tokenJWT,
      usuario: {
        id: usuario.id,
        nome: usuario.name,
        email: usuario.email,
      },
    };
  }

  /**
   * Reenviar e-mail de verificação
   */
  async reenviarVerificacao(email) {
    return await emailService.reenviarEmailVerificacao(email);
  }

  /**
   * Verificar token JWT
   */
  async verificarToken(token) {
    try {
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await prisma.user.findUnique({
        where: { id: decodificado.idUsuario },
      });

      if (!usuario) {
        throw new ErroNaoEncontrado('Usuário não encontrado');
      }

      return {
        id: usuario.id,
        nome: usuario.name,
        email: usuario.email,
        imagem: usuario.image,
        emailVerificado: usuario.emailVerified,
      };
    } catch (erro) {
      throw new ErroNaoAutorizado('Token inválido ou expirado');
    }
  }
}

export default new AuthService();



