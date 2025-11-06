import prisma from '../config/bancoDados.js';

class ExpenseRepository {
  async buscarTodas(filtros = {}) {
    const { idUsuario, mes, ano, de, ate, categoria } = filtros;
    const onde = {};

    if (idUsuario) onde.userId = idUsuario;

    if (mes && ano) {
      const mesNum = parseInt(mes, 10);
      const anoNum = parseInt(ano, 10);
      const dataInicio = new Date(anoNum, mesNum - 1, 1);
      const dataFim = new Date(anoNum, mesNum, 0, 23, 59, 59);
      onde.date = { gte: dataInicio, lte: dataFim };
    } else if (de || ate) {
      onde.date = {};
      if (de) onde.date.gte = new Date(de);
      if (ate) onde.date.lte = new Date(ate);
    }

    if (categoria) onde.category = categoria;

    return await prisma.expense.findMany({
      where: onde,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  async buscarPorId(id, idUsuario = null) {
    const onde = { id };
    if (idUsuario) onde.userId = idUsuario;
    return await prisma.expense.findFirst({ where: onde });
  }

  async criar(dados) {
    return await prisma.expense.create({
      data: dados,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async atualizar(id, dados) {
    return await prisma.expense.update({
      where: { id },
      data: dados,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deletar(id) {
    return await prisma.expense.delete({ where: { id } });
  }

  async contar(filtros = {}) {
    const { idUsuario, mes, ano, categoria } = filtros;
    const onde = {};

    if (idUsuario) onde.userId = idUsuario;
    if (categoria) onde.category = categoria;

    if (mes && ano) {
      const mesNum = parseInt(mes, 10);
      const anoNum = parseInt(ano, 10);
      const dataInicio = new Date(anoNum, mesNum - 1, 1);
      const dataFim = new Date(anoNum, mesNum, 0, 23, 59, 59);
      onde.date = { gte: dataInicio, lte: dataFim };
    }

    return await prisma.expense.count({ where: onde });
  }
}

export default new ExpenseRepository();

