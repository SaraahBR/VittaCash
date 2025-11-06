import Joi from 'joi';
import { CATEGORIAS, TIPOS_RECORRENCIA } from '../utils/constantes.js';

export const AtualizarDespesaDTOSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).optional(),
  valor: Joi.number().positive().precision(2).optional(),
  data: Joi.date().optional(),
  categoria: Joi.string().valid(...CATEGORIAS).optional(),
  recorrente: Joi.boolean().optional(),
  tipoRecorrencia: Joi.string().valid(...TIPOS_RECORRENCIA).optional(),
  notas: Joi.string().max(1000).allow(null, '').optional(),
}).min(1);

export class UpdateExpenseDTO {
  constructor(dados) {
    if (dados.titulo) this.titulo = dados.titulo.trim();
    if (dados.valor) this.valor = parseFloat(dados.valor);
    if (dados.data) this.data = new Date(dados.data);
    if (dados.categoria) this.categoria = dados.categoria;
    if (dados.recorrente !== undefined) this.recorrente = Boolean(dados.recorrente);
    if (dados.tipoRecorrencia) this.tipoRecorrencia = dados.tipoRecorrencia;
    if (dados.notas !== undefined) this.notas = dados.notas?.trim() || null;
  }

  validar() {
    return AtualizarDespesaDTOSchema.validate(this, { abortEarly: false });
  }
}

