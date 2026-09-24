import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/bancoDados.js';
import emailService from './emailService.js';
import { CadastrarUsuarioDTO } from '../dto/CadastrarUsuarioDTO.js';
import { LoginUsuarioDTO } from '../dto/LoginUsuarioDTO.js';
import { ErroValidacao, ErroNaoAutorizado, ErroNaoEncontrado, ErroServicoIndisponivel } from '../utils/erros.js';

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

    // Gerar token de verificação e enviar e-mail de forma assíncrona
    const tokenVerificacao = await emailService.criarTokenVerificacao(usuario.email);

    // Enviar e-mail sem bloquear a resposta (fire and forget)
    emailService.enviarEmailVerificacao(usuario.email, usuario.name, tokenVerificacao)
      .then(resultado => {
        if (resultado.sucesso) {
          console.log(`✅ E-mail de verificação processado para ${usuario.email}`);
        } else {
          console.warn(`⚠️ E-mail de verificação falhou para ${usuario.email}:`, resultado.erro);
        }
      })
      .catch(erro => {
        console.error(`❌ Erro ao enviar e-mail de verificação para ${usuario.email}:`, erro.message);
      });

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
    console.log('🔐 Iniciando login Google...');

    try {
      // Validação básica do token
      if (!tokenGoogle || typeof tokenGoogle !== 'string') {
        console.error('❌ Token inválido:', typeof tokenGoogle);
        throw new ErroValidacao('Token do Google inválido ou ausente');
      }

      // Verificar se GOOGLE_CLIENT_ID está configurado
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('❌ GOOGLE_CLIENT_ID não configurado no ambiente');
        throw new Error('Configuração do Google OAuth incompleta');
      }

      console.log('🔍 Verificando token do Google...');
      console.log('📝 Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');

      // Verificar token do Google com timeout
      const ticket = await Promise.race([
        clienteGoogle.verifyIdToken({
          idToken: tokenGoogle,
          audience: process.env.GOOGLE_CLIENT_ID,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout ao verificar token do Google')), 15000)
        )
      ]);

      const payload = ticket.getPayload();
      const { email, name, picture, email_verified } = payload;

      console.log('✅ Token verificado para:', email);

      // Buscar ou criar usuário
      let usuario = await prisma.user.findUnique({
        where: { email },
      });

      const ehNovoUsuario = !usuario;

      if (!usuario) {
        console.log('👤 Criando novo usuário:', email);
        // Criar novo usuário via Google
        usuario = await prisma.user.create({
          data: {
            email,
            name,
            image: picture,
            emailVerified: email_verified ? new Date() : null,
          },
        });

        // Enviar e-mail de boas-vindas de forma assíncrona (fire and forget)
        emailService.enviarEmailBoasVindas(email, name)
          .then(resultado => {
            if (resultado?.sucesso) {
              console.log(`✅ E-mail de boas-vindas processado para ${email}`);
            }
          })
          .catch(erro => {
            console.error(`❌ Erro ao enviar e-mail de boas-vindas para ${email}:`, erro.message);
          });
      } else {
        console.log('👤 Usuário existente:', email);
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

      console.log('✅ Login Google concluído com sucesso');

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
      console.error('❌ Erro detalhado no login Google:');
      console.error('   Tipo:', erro.constructor.name);
      console.error('   Mensagem:', erro.message);
      console.error('   Stack:', erro.stack);

      // Falha de banco não é problema do token: não mascarar como 401
      if (erro.constructor.name.startsWith('PrismaClient')) {
        throw new ErroServicoIndisponivel('Não foi possível acessar o banco de dados. Tente novamente em instantes.');
      }

      // Retornar erro mais específico
      if (erro.message?.includes('Timeout')) {
        throw new ErroNaoAutorizado('Timeout ao verificar token do Google. Tente novamente.');
      } else if (erro.message?.includes('Token used too late') || erro.message?.includes('expired')) {
        throw new ErroNaoAutorizado('Token do Google expirado. Faça login novamente.');
      } else if (erro.message?.includes('Invalid token signature')) {
        throw new ErroNaoAutorizado('Assinatura do token inválida. Verifique sua configuração.');
      } else {
        throw new ErroNaoAutorizado('Token do Google inválido ou erro de conexão');
      }
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

    // Enviar e-mail de boas-vindas de forma assíncrona (fire and forget)
    emailService.enviarEmailBoasVindas(email, usuario.name)
      .catch(erro => {
        console.error(`❌ Erro ao enviar e-mail de boas-vindas para ${email}:`, erro.message);
      });

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



