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
      totalDespesas: despesas.length,
      porMes,
    };
  }

  async exportarCSV(idUsuario, filtros) {
    const despesas = await this.listarDespesas(idUsuario, filtros);

    const csvLinhas = [
      'descricao,valor,categoria,data,recorrente',
    ];

    despesas.forEach((despesa) => {
      const linha = [
        `"${despesa.descricao.replace(/"/g, '""')}"`,
        despesa.valor,
        `"${despesa.categoria}"`,
        despesa.data,
        despesa.recorrente ? 'true' : 'false',
      ].join(',');

      csvLinhas.push(linha);
    });

    return csvLinhas.join('\n');
  }

  async importarCSV(idUsuario, conteudoCSV) {
    const linhas = conteudoCSV.split('\n').filter(l => l.trim());
    const header = linhas[0];

    // Validar header
    if (!header.includes('descricao') || !header.includes('valor')) {
      throw new ErroValidacao('Formato CSV inválido. Campos esperados: descricao,valor,categoria,data,recorrente');
    }

    const despesasImportadas = [];
    const erros = [];

    for (let i = 1; i < linhas.length; i++) {
      try {
        const valores = linhas[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        const despesaData = {
          descricao: valores[0],
          valor: parseFloat(valores[1]),
          categoria: valores[2],
          data: valores[3],
          recorrente: valores[4] === 'true',
        };

        const despesa = await this.criarDespesa(idUsuario, despesaData);
        despesasImportadas.push(despesa);
      } catch (erro) {
        erros.push({
          linha: i + 1,
          erro: erro.message || 'Erro ao processar linha',
        });
      }
    }

    return {
      message: `${despesasImportadas.length} despesa(s) importada(s)${erros.length > 0 ? `, ${erros.length} erro(s) encontrado(s)` : ' com sucesso'}`,
      importadas: despesasImportadas.length,
      erros,
    };
  }
}

export default new ExpenseService();

