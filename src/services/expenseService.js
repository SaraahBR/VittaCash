import expenseRepository from '../repositories/ExpenseRepository.js';
import { CreateExpenseDTO } from '../dto/CreateExpenseDTO.js';
import { UpdateExpenseDTO } from '../dto/UpdateExpenseDTO.js';
import { ExpenseResponseDTO } from '../dto/ExpenseResponseDTO.js';
import { ErroValidacao, ErroNaoEncontrado } from '../utils/erros.js';
import emailService from './emailService.js';
import prisma from '../config/bancoDados.js';

class ExpenseService {
  async listarDespesas(idUsuario, filtros = {}) {
    const despesas = await expenseRepository.buscarTodas({ idUsuario, ...filtros });
    return ExpenseResponseDTO.deArray(despesas);
  }

  async criarDespesa(idUsuario, dados) {
    const dto = new CreateExpenseDTO(dados);
    const { error, value } = dto.validar();

    if (error) {
      const detalhes = error.details.map(d => d.message);
      throw new ErroValidacao('Dados inválidos', detalhes);
    }

    const despesa = await expenseRepository.criar({
      title: value.descricao,
      amount: value.valor,
      date: value.data,
      category: value.categoria,
      recurring: value.recorrente,
      recurrenceType: value.recurrenceType || 'NONE',
      notes: value.notas,
      userId: idUsuario,
    });

    return new ExpenseResponseDTO(despesa);
  }

  async obterDespesa(id, idUsuario) {
    const despesa = await expenseRepository.buscarPorId(id, idUsuario);

    if (!despesa) {
      throw new ErroNaoEncontrado('Despesa não encontrada');
    }

    return new ExpenseResponseDTO(despesa);
  }

  async atualizarDespesa(id, idUsuario, dados) {
    await this.obterDespesa(id, idUsuario);

    const dto = new UpdateExpenseDTO(dados);
    const { error, value } = dto.validar();

    if (error) {
      const detalhes = error.details.map(d => d.message);
      throw new ErroValidacao('Dados inválidos', detalhes);
    }

    const dadosAtualizados = {};
    if (value.descricao) dadosAtualizados.title = value.descricao;
    if (value.valor) dadosAtualizados.amount = value.valor;
    if (value.data) dadosAtualizados.date = value.data;
    if (value.categoria) dadosAtualizados.category = value.categoria;
    if (value.recorrente !== undefined) dadosAtualizados.recurring = value.recorrente;
    if (value.recurrenceType) dadosAtualizados.recurrenceType = value.recurrenceType;
    if (value.notas !== undefined) dadosAtualizados.notes = value.notas;

    const despesa = await expenseRepository.atualizar(id, dadosAtualizados);
    return new ExpenseResponseDTO(despesa);
  }

  async deletarDespesa(id, idUsuario) {
    await this.obterDespesa(id, idUsuario);
    await expenseRepository.deletar(id);
    return { message: 'Despesa excluída com sucesso' };
  }

  async relatorioMensal(idUsuario, ano, mes) {
    const anoNum = parseInt(ano, 10);
    const mesNum = parseInt(mes, 10);

    const despesas = await expenseRepository.buscarTodas({
      idUsuario,
      month: mesNum,
      year: anoNum,
    });

    const porCategoria = {};
    let totalGeral = 0;

    despesas.forEach((despesa) => {
      const categoria = despesa.category;
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = { categoria, total: 0, quantidade: 0 };
      }
      porCategoria[categoria].total += despesa.amount;
      porCategoria[categoria].quantidade += 1;
      totalGeral += despesa.amount;
    });

    return {
      tipo: 'mensal',
      ano: anoNum,
      mes: mesNum,
      totalGeral,
      totalDespesas: despesas.length,
      porCategoria: Object.values(porCategoria),
      despesas: despesas.map(d => ({
        nome: d.title,
        valor: d.amount,
        categoria: d.category,
        data: d.date
      }))
    };
  }

  async relatorioAnual(idUsuario, ano) {
    const anoNum = parseInt(ano, 10);

    const despesas = await expenseRepository.buscarTodas({
      idUsuario,
      year: anoNum,
    });

    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      total: 0,
      quantidade: 0,
    }));

    const porCategoria = {};
    let totalGeral = 0;

    despesas.forEach((despesa) => {
      const mesIndex = despesa.date.getMonth();
      porMes[mesIndex].total += despesa.amount;
      porMes[mesIndex].quantidade += 1;
      totalGeral += despesa.amount;

      const categoria = despesa.category;
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = { categoria, total: 0, quantidade: 0 };
      }
      porCategoria[categoria].total += despesa.amount;
      porCategoria[categoria].quantidade += 1;
    });

    return {
      tipo: 'anual',
      ano: anoNum,
      totalGeral,
      totalDespesas: despesas.length,
      porMes,
      porCategoria: Object.values(porCategoria),
      despesas: despesas.map(d => ({
        nome: d.title,
        valor: d.amount,
        categoria: d.category,
        data: d.date
      }))
    };
  }


  async enviarEmailRelatorio(idUsuario, tipo, ano, mes) {
    // Buscar dados do usuário
    const usuario = await prisma.user.findUnique({
      where: { id: idUsuario },
    });

    if (!usuario) {
      throw new ErroNaoEncontrado('Usuário não encontrado');
    }

    // Gerar relatório
    let relatorio;
    if (tipo === 'monthly') {
      relatorio = await this.relatorioMensal(idUsuario, ano, mes);
    } else {
      relatorio = await this.relatorioAnual(idUsuario, ano);
    }

    // Enviar email
    const resultado = await emailService.enviarEmailRelatorioDespesas(
      usuario.email,
      usuario.name,
      relatorio
    );

    if (resultado.sucesso) {
      return {
        message: 'Relatório enviado por e-mail com sucesso',
        email: usuario.email
      };
    } else {
      throw new Error('Falha ao enviar e-mail de relatório');
    }
  }
}

export default new ExpenseService();

