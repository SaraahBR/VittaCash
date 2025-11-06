import Joi from 'joi';
import { CATEGORIAS, TIPOS_RECORRENCIA } from '../utils/constantes.js';

export const CriarDespesaDTOSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required().messages({
    'string.min': 'Título deve ter no mínimo 3 caracteres',
    'any.required': 'Título é obrigatório',
  }),

  valor: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Valor deve ser positivo',
    'any.required': 'Valor é obrigatório',
  }),

  data: Joi.date().required().messages({
    'date.base': 'Data inválida',
    'any.required': 'Data é obrigatória',
  }),

  categoria: Joi.string().valid(...CATEGORIAS).required().messages({
    'any.only': `Categoria inválida`,
    'any.required': 'Categoria é obrigatória',
  }),

  recorrente: Joi.boolean().default(false),

  tipoRecorrencia: Joi.string().valid(...TIPOS_RECORRENCIA).default('NENHUMA'),

  notas: Joi.string().max(1000).allow(null, '').optional(),
});

export class CreateExpenseDTO {
  constructor(dados) {
    this.titulo = dados.titulo?.trim();
    this.valor = parseFloat(dados.valor);
    this.data = new Date(dados.data);
    this.categoria = dados.categoria;
    this.recorrente = Boolean(dados.recorrente);
    this.tipoRecorrencia = dados.tipoRecorrencia || 'NENHUMA';
    this.notas = dados.notas?.trim() || null;
  }

  validar() {
    return CriarDespesaDTOSchema.validate(this, { abortEarly: false });
  }
}

