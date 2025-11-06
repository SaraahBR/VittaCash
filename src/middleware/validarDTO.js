import { ErroValidacao } from '../utils/erros.js';

export function validarDTO(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const detalhes = error.details.map(detalhe => detalhe.message);
      throw new ErroValidacao('Dados inválidos', detalhes);
    }

    req.body = value;
    next();
  };
}

