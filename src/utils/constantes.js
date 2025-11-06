export const CATEGORIAS = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Banco',
  'Outros',
];

export const TIPOS_RECORRENCIA = ['NENHUMA', 'MENSAL', 'ANUAL'];

export const STATUS_HTTP = {
  OK: 200,
  CRIADO: 201,
  REQUISICAO_INVALIDA: 400,
  NAO_AUTORIZADO: 401,
  PROIBIDO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  ERRO_INTERNO_SERVIDOR: 500,
};

export const JWT_EXPIRA_EM = '7d';

export const MENSAGENS_ERRO = {
  NAO_AUTORIZADO: 'Não autenticado',
  PROIBIDO: 'Sem permissão',
  NAO_ENCONTRADO: 'Recurso não encontrado',
  DADOS_INVALIDOS: 'Dados inválidos',
  ERRO_INTERNO: 'Erro interno do servidor',
};

