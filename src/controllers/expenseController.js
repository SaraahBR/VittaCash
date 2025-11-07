import expenseService from '../services/expenseService.js';

class ExpenseController {
  async listar(req, res, next) {
    try {
      const { month, year, category } = req.query;
      const despesas = await expenseService.listarDespesas(req.idUsuario, {
        month, year, category,
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
      const { type, year, month } = req.query;

      if (!type || !year) {
        return res.status(400).json({ error: 'Parâmetros "type" e "year" obrigatórios' });
      }

      let relatorio;

      if (type === 'monthly') {
        if (!month) {
          return res.status(400).json({ error: 'Parâmetro "month" obrigatório para relatório mensal' });
        }
        relatorio = await expenseService.relatorioMensal(req.idUsuario, year, month);
      } else if (type === 'yearly') {
        relatorio = await expenseService.relatorioAnual(req.idUsuario, year);
      } else {
        return res.status(400).json({ error: 'Tipo inválido (use "monthly" ou "yearly")' });
      }

      res.json(relatorio);
    } catch (erro) {
      next(erro);
    }
  }

  async exportar(req, res, next) {
    try {
      const { month, year, category } = req.query;
      const csv = await expenseService.exportarCSV(req.idUsuario, { month, year, category });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="despesas-${year || 'todas'}-${month || 'todos'}.csv"`
      );

      res.send('\uFEFF' + csv);
    } catch (erro) {
      next(erro);
    }
  }

  async importar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo CSV não enviado' });
      }

      const resultado = await expenseService.importarCSV(req.idUsuario, req.file.buffer.toString('utf-8'));
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  }
}

export default new ExpenseController();

