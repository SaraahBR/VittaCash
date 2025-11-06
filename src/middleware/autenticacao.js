import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  try {
    const cabecalhoAuth = req.headers.authorization;

    if (!cabecalhoAuth) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const [, token] = cabecalhoAuth.split(' ');

    if (!token) {
      return res.status(401).json({ erro: 'Token mal formatado' });
    }

    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    req.idUsuario = decodificado.idUsuario;

    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

