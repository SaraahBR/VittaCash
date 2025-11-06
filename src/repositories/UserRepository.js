import prisma from '../config/bancoDados.js';

class UserRepository {
  async buscarPorEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
  }

  async buscarPorId(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
  }

  async criar(dados) {
    return await prisma.user.create({
      data: dados,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
  }

  async atualizar(id, dados) {
    return await prisma.user.update({
      where: { id },
      data: dados,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true,
      },
    });
  }
}

export default new UserRepository();

