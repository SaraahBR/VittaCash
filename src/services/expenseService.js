import expenseRepository from '../repositories/ExpenseRepository.js';
import { CreateExpenseDTO } from '../dto/CreateExpenseDTO.js';
import { UpdateExpenseDTO } from '../dto/UpdateExpenseDTO.js';
import { ExpenseResponseDTO } from '../dto/ExpenseResponseDTO.js';
import { ErroValidacao, ErroNaoEncontrado } from '../utils/erros.js';

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
      title: value.titulo,
      amount: value.valor,
      date: value.data,
      category: value.categoria,
      recurring: value.recorrente,
      recurrenceType: value.tipoRecorrencia,
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
    if (value.titulo) dadosAtualizados.title = value.titulo;
    if (value.valor) dadosAtualizados.amount = value.valor;
    if (value.data) dadosAtualizados.date = value.data;
    if (value.categoria) dadosAtualizados.category = value.categoria;
    if (value.recorrente !== undefined) dadosAtualizados.recurring = value.recorrente;
    if (value.tipoRecorrencia) dadosAtualizados.recurrenceType = value.tipoRecorrencia;
    if (value.notas !== undefined) dadosAtualizados.notes = value.notas;

    const despesa = await expenseRepository.atualizar(id, dadosAtualizados);
    return new ExpenseResponseDTO(despesa);
  }

  async deletarDespesa(id, idUsuario) {
    await this.obterDespesa(id, idUsuario);
    await expenseRepository.deletar(id);
    return { mensagem: 'Despesa removida com sucesso' };
  }

  async relatorioMensal(idUsuario, ano, mes) {
    const anoNum = parseInt(ano, 10);
    const mesNum = mes ? parseInt(mes, 10) : new Date().getMonth() + 1;

    const despesas = await expenseRepository.buscarTodas({
      idUsuario,
      mes: mesNum,
      ano: anoNum,
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
      porCategoria: Object.values(porCategoria),
      totalDespesas: despesas.length,
    };
  }

  async relatorioAnual(idUsuario, ano) {
    const anoNum = parseInt(ano, 10);
    const dataInicio = new Date(anoNum, 0, 1);
    const dataFim = new Date(anoNum, 11, 31, 23, 59, 59);

    const despesas = await expenseRepository.buscarTodas({
      idUsuario,
      de: dataInicio,
      ate: dataFim,
    });

    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      total: 0,
      quantidade: 0,
    }));

    let totalGeral = 0;

    despesas.forEach((despesa) => {
      const mesIndex = despesa.date.getMonth();
      porMes[mesIndex].total += despesa.amount;
      porMes[mesIndex].quantidade += 1;
      totalGeral += despesa.amount;
    });

    return {
      tipo: 'anual',
      ano: anoNum,
      totalGeral,
      porMes,
      totalDespesas: despesas.length,
    };
  }

  async exportarCSV(idUsuario, filtros) {
    const despesas = await this.listarDespesas(idUsuario, filtros);

    const csvLinhas = [
      'ID,Título,Valor,Data,Categoria,Recorrente,Tipo Recorrência,Notas',
    ];

    despesas.forEach((despesa) => {
      const linha = [
        despesa.id,
        `"${despesa.titulo.replace(/"/g, '""')}"`,
        despesa.valor,
        despesa.data.toISOString().split('T')[0],
        `"${despesa.categoria}"`,
        despesa.recorrente ? 'Sim' : 'Não',
        despesa.tipoRecorrencia,
        despesa.notas ? `"${despesa.notas.replace(/"/g, '""')}"` : '',
      ].join(',');

      csvLinhas.push(linha);
    });

    return csvLinhas.join('\n');
  }
}

export default new ExpenseService();

