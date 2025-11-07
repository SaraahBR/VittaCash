import Joi from 'joi';
import { CATEGORIAS, TIPOS_RECORRENCIA } from '../utils/constantes.js';

export const AtualizarDespesaDTOSchema = Joi.object({
  descricao: Joi.string().min(3).max(255).optional(),
  valor: Joi.number().positive().precision(2).optional(),
  data: Joi.date().optional(),
  categoria: Joi.string().optional(),
  recorrente: Joi.boolean().optional(),
}).min(1);

export class UpdateExpenseDTO {
  constructor(dados) {
    if (dados.descricao) this.descricao = dados.descricao.trim();
    if (dados.valor) this.valor = parseFloat(dados.valor);
    if (dados.data) this.data = new Date(dados.data);
    if (dados.categoria) this.categoria = dados.categoria;
    if (dados.recorrente !== undefined) this.recorrente = Boolean(dados.recorrente);
  }

  validar() {
    return AtualizarDespesaDTOSchema.validate(this, { abortEarly: false });
  }
}

