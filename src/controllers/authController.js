import authService from '../services/authService.js';

class AuthController {
  async login(req, res, next) {
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

