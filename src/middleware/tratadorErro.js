import { ErroApp, ErroValidacao } from '../utils/erros.js';

export function tratadorErro(erro, req, res, next) {
  console.error('❌ Erro:', erro);

  if (erro instanceof ErroApp) {
    const resposta = {
      erro: erro.message,
    };

    if (erro instanceof ErroValidacao && erro.detalhes) {
      resposta.detalhes = erro.detalhes;
    }

    return res.status(erro.codigoStatus).json(resposta);
  }

  if (erro.code === 'P2002') {
    return res.status(409).json({
      erro: 'Registro duplicado',
      detalhes: erro.meta,
    });
  }

  if (erro.code === 'P2025') {
    return res.status(404).json({
      erro: 'Registro não encontrado',
    });
  }

  if (erro.code === 'P2003') {
    return res.status(400).json({
      erro: 'Violação de integridade referencial',
      detalhes: erro.meta,
    });
  }

  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? erro.stack : undefined,
  });
}

