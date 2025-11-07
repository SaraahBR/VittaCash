import { ErroApp, ErroValidacao } from '../utils/erros.js';

export function tratadorErro(erro, req, res, next) {
  console.error('❌ Erro:', erro);

  if (erro instanceof ErroApp) {
    const resposta = {
      error: erro.message,
    };

    if (erro instanceof ErroValidacao && erro.detalhes) {
      resposta.details = erro.detalhes;
    }

    return res.status(erro.codigoStatus).json(resposta);
  }

  if (erro.code === 'P2002') {
    return res.status(409).json({
      error: 'Registro duplicado',
      details: erro.meta,
    });
  }

  if (erro.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado',
    });
  }

  if (erro.code === 'P2003') {
    return res.status(400).json({
      error: 'Violação de integridade referencial',
      details: erro.meta,
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? erro.stack : undefined,
  });
}

