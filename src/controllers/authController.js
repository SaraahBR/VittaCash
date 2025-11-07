import authService from '../services/authService.js';

class AuthController {
  /**
   * Cadastro tradicional
   */
  async cadastrar(req, res, next) {
    try {
      const resultado = await authService.cadastrarUsuario(req.body);
      res.status(201).json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Login tradicional com e-mail e senha
   */
  async loginTradicional(req, res, next) {
    try {
      const resultado = await authService.loginTradicional(req.body);
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Login via Google OAuth
   */
  async loginGoogle(req, res, next) {
    try {
      const { tokenGoogle } = req.body;

      if (!tokenGoogle) {
        return res.status(400).json({ error: 'Token do Google obrigatório' });
      }

      const resultado = await authService.loginGoogle(tokenGoogle);
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Verificar e-mail com token
   */
  async verificarEmail(req, res, next) {
    try {
      const { email, token } = req.query;

      if (!email || !token) {
        return res.status(400).json({ error: 'E-mail e token são obrigatórios' });
      }

      const resultado = await authService.verificarEmail(email, token);
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Reenviar e-mail de verificação
   */
  async reenviarVerificacao(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório' });
      }

      const resultado = await authService.reenviarVerificacao(email);
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Obter dados do usuário logado
   */
  async obterUsuario(req, res, next) {
    try {
      const usuario = await authService.verificarToken(req.headers.authorization?.split(' ')[1]);
      res.json(usuario);
    } catch (erro) {
      next(erro);
    }
  }
}

export default new AuthController();

