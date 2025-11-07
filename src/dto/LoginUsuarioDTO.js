import Joi from 'joi';

export const LoginUsuarioDTOSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'E-mail inválido',
        'any.required': 'E-mail é obrigatório',
    }),

    senha: Joi.string().required().messages({
        'any.required': 'Senha é obrigatória',
    }),
});

export class LoginUsuarioDTO {
    constructor(dados) {
        this.email = dados.email?.toLowerCase().trim();
        this.senha = dados.senha;
    }

    validar() {
        return LoginUsuarioDTOSchema.validate(this, { abortEarly: false });
    }
}