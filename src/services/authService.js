import jwt from 'jsonwebtoken';
import prisma from '../config/bancoDados.js';

class AuthService {
  async loginGoogle(tokenGoogle) {
    // Simular dados do Google (em produção, use google-auth-library)
    const usuarioGoogle = {
      email: 'user@example.com',
      nome: 'Usuário Teste',
      imagem: 'https://avatar.url',
    };

    let usuario = await prisma.user.findUnique({
      where: { email: usuarioGoogle.email },
    });

    if (!usuario) {
      usuario = await prisma.user.create({
        data: {
          email: usuarioGoogle.email,
          name: usuarioGoogle.nome,
          image: usuarioGoogle.imagem,
        },
      });
    }

    const token = jwt.sign(
      { idUsuario: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, usuario };
  }

  async verificarToken(token) {
    try {
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await prisma.user.findUnique({
        where: { id: decodificado.idUsuario },
      });

      return usuario;
    } catch (erro) {
      throw { status: 401, message: 'Token inválido' };
    }
  }
}

export default new AuthService();

