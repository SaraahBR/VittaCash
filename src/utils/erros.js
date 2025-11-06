// Classes de erro customizadas

export class ErroApp extends Error {
  constructor(mensagem, codigoStatus = 500) {
    super(mensagem);
    this.codigoStatus = codigoStatus;
    this.ehOperacional = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErroValidacao extends ErroApp {
  constructor(mensagem, detalhes = []) {
    super(mensagem, 400);
    this.detalhes = detalhes;
  }
}

export class ErroNaoAutorizado extends ErroApp {
  constructor(mensagem = 'Não autenticado') {
    super(mensagem, 401);
  }
}

export class ErroProibido extends ErroApp {
  constructor(mensagem = 'Sem permissão') {
    super(mensagem, 403);
  }
}

export class ErroNaoEncontrado extends ErroApp {
  constructor(mensagem = 'Recurso não encontrado') {
    super(mensagem, 404);
  }
}

export class ErroConflito extends ErroApp {
  constructor(mensagem = 'Conflito de dados') {
    super(mensagem, 409);
  }
}

