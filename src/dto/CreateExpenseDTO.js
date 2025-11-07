import Joi from 'joi';
import { CATEGORIAS, TIPOS_RECORRENCIA } from '../utils/constantes.js';

export const CriarDespesaDTOSchema = Joi.object({
  descricao: Joi.string().min(3).max(255).required().messages({
    'string.min': 'Descrição deve ter no mínimo 3 caracteres',
    'any.required': 'Descrição é obrigatória',
  }),

  valor: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Valor deve ser positivo',
    'any.required': 'Valor é obrigatório',
  }),

  data: Joi.date().required().messages({
    'date.base': 'Data inválida',
    'any.required': 'Data é obrigatória',
  }),

  categoria: Joi.string().required().messages({
    'any.required': 'Categoria é obrigatória',
  }),

  recorrente: Joi.boolean().default(false),
});

export class CreateExpenseDTO {
  constructor(dados) {
    this.descricao = dados.descricao?.trim();
    this.valor = parseFloat(dados.valor);
    this.data = new Date(dados.data);
    this.categoria = dados.categoria;
    this.recorrente = Boolean(dados.recorrente);
  }

  validar() {
    return CriarDespesaDTOSchema.validate(this, { abortEarly: false });
  }
}

