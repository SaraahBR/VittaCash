// Validações de dados

export function validarDespesa(dados) {
  const erros = [];

  if (!dados.titulo || dados.titulo.trim().length < 3) {
    erros.push('Título deve ter no mínimo 3 caracteres');
  }

  if (!dados.valor || isNaN(dados.valor) || dados.valor <= 0) {
    erros.push('Valor deve ser um número positivo');
  }

  if (!dados.data || isNaN(new Date(dados.data).getTime())) {
    erros.push('Data inválida');
  }

  const categoriasValidas = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Banco',
    'Outros',
  ];

  if (!categoriasValidas.includes(dados.categoria)) {
    erros.push('Categoria inválida');
  }

  if (dados.recorrente && !['NENHUMA', 'MENSAL', 'ANUAL'].includes(dados.tipoRecorrencia)) {
    erros.push('Tipo de recorrência inválido');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

export function sanitizarDespesa(dados) {
  return {
    titulo: dados.titulo.trim(),
    valor: parseFloat(dados.valor),
    data: new Date(dados.data),
    categoria: dados.categoria,
    recorrente: Boolean(dados.recorrente),
    tipoRecorrencia: dados.tipoRecorrencia || 'NENHUMA',
    notas: dados.notas ? dados.notas.trim() : null,
  };
}

