import Joi from 'joi';

export const CadastrarUsuarioDTOSchema = Joi.object({
    nome: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Nome deve ter no mínimo 3 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório',
    }),

    email: Joi.string().email().required().messages({
        'string.email': 'E-mail inválido',
        'any.required': 'E-mail é obrigatório',
    }),

    senha: Joi.string().min(6).max(50).required().messages({
        'string.min': 'Senha deve ter no mínimo 6 caracteres',
        'string.max': 'Senha deve ter no máximo 50 caracteres',
        'any.required': 'Senha é obrigatória',
    }),

    confirmarSenha: Joi.string().valid(Joi.ref('senha')).required().messages({
        'any.only': 'As senhas não coincidem',
        'any.required': 'Confirmação de senha é obrigatória',
    }),
});

export class CadastrarUsuarioDTO {
    constructor(dados) {
        this.nome = dados.nome?.trim();
        this.email = dados.email?.toLowerCase().trim();
        this.senha = dados.senha;
        this.confirmarSenha = dados.confirmarSenha;
    }

    validar() {
        return CadastrarUsuarioDTOSchema.validate(this, { abortEarly: false });
    }
}