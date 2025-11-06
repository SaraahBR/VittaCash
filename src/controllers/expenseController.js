import expenseService from '../services/expenseService.js';

class ExpenseController {
  async listar(req, res, next) {
    try {
      const { mes, ano, de, ate, categoria } = req.query;
      const despesas = await expenseService.listarDespesas(req.idUsuario, {
        mes, ano, de, ate, categoria,
      });
      res.json(despesas);
    } catch (erro) {
      next(erro);
    }
  }

  async criar(req, res, next) {
    try {
      const despesa = await expenseService.criarDespesa(req.idUsuario, req.body);
      res.status(201).json(despesa);
    } catch (erro) {
      next(erro);
    }
  }

  async obter(req, res, next) {
    try {
      const despesa = await expenseService.obterDespesa(req.params.id, req.idUsuario);
      res.json(despesa);
    } catch (erro) {
      next(erro);
    }
  }

  async atualizar(req, res, next) {
    try {
      const despesa = await expenseService.atualizarDespesa(
        req.params.id,
        req.idUsuario,
        req.body
      );
      res.json(despesa);
    } catch (erro) {
      next(erro);
    }
  }

  async deletar(req, res, next) {
    try {
      const resultado = await expenseService.deletarDespesa(req.params.id, req.idUsuario);
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  async relatorio(req, res, next) {
    try {
      const { tipo, ano, mes } = req.query;

      if (!tipo || !ano) {
        return res.status(400).json({ erro: 'Parâmetros "tipo" e "ano" obrigatórios' });
      }

      let relatorio;

      if (tipo === 'mensal') {
        relatorio = await expenseService.relatorioMensal(req.idUsuario, ano, mes);
      } else if (tipo === 'anual') {
        relatorio = await expenseService.relatorioAnual(req.idUsuario, ano);
      } else {
        return res.status(400).json({ erro: 'Tipo inválido (use "mensal" ou "anual")' });
      }

      res.json(relatorio);
    } catch (erro) {
      next(erro);
    }
  }

  async exportar(req, res, next) {
    try {
      const { mes, ano } = req.query;
      const csv = await expenseService.exportarCSV(req.idUsuario, { mes, ano });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="despesas-${ano || 'todas'}-${mes || 'todos'}.csv"`
      );

      res.send('\uFEFF' + csv);
    } catch (erro) {
      next(erro);
    }
  }
}

export default new ExpenseController();

