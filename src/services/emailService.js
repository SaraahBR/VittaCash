import nodemailer from 'nodemailer';
import crypto from 'crypto';
import prisma from '../config/bancoDados.js';

class EmailService {
  constructor() {
    // Configuração do transportador de e-mail com timeout e retry
    const port = parseInt(process.env.SMTP_PORT) || 587;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true para 465 (SSL), false para 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 60000, // 60 segundos (aumentado)
      greetingTimeout: 30000,   // 30 segundos
      socketTimeout: 60000,     // 60 segundos (aumentado)
      pool: false,              // Desabilitar pool em produção
      maxConnections: 1,        // Uma conexão por vez
      tls: {
        rejectUnauthorized: false, // Aceitar certificados auto-assinados
        minVersion: 'TLSv1.2',     // Forçar TLS 1.2+
      },
      debug: process.env.NODE_ENV === 'development', // Debug apenas em dev
      logger: process.env.NODE_ENV === 'development', // Logs apenas em dev
    });

    // Número máximo de tentativas
    this.maxRetries = 3;
  }

  /**
   * Verificar se SMTP está configurado
   */
  estaConfigurado() {
    const configurado = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (!configurado) {
      console.warn('\n⚠️  SMTP NÃO CONFIGURADO!');
      console.warn('   Configure as variáveis de ambiente:');
      console.warn('   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM');
      console.warn('   Veja: SENDGRID-SETUP.md para instruções\n');
    }

    return configurado;
  }

  /**
   * Gera um token de verificação único
   */
  gerarToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cria token de verificação no banco de dados
   * @param {string} email - E-mail do usuário
   * @param {number} expiracaoHoras - Horas até expiração (padrão: 24h)
   */
  async criarTokenVerificacao(email, expiracaoHoras = 24) {
    const token = this.gerarToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + expiracaoHoras);

    // Deletar tokens antigos do mesmo e-mail
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Criar novo token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    return token;
  }

  /**
   * Verifica se o token é válido
   * @param {string} email - E-mail do usuário
   * @param {string} token - Token de verificação
   */
  async verificarToken(email, token) {
    const tokenData = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });

    if (!tokenData) {
      return { valido: false, erro: 'Token inválido' };
    }

    if (new Date() > tokenData.expires) {
      // Token expirado, deletar do banco
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token,
          },
        },
      });
      return { valido: false, erro: 'Token expirado' };
    }

    return { valido: true };
  }

  /**
   * Deleta token após verificação bem-sucedida
   */
  async deletarToken(email, token) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });
  }

  /**
   * Método auxiliar para enviar e-mail com retry
   */
  async enviarComRetry(mailOptions, tentativa = 1) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ E-mail enviado com sucesso (tentativa ${tentativa}): ${info.messageId}`);
      return true;
    } catch (erro) {
      console.error(`❌ Erro na tentativa ${tentativa}:`, erro.message);

      if (tentativa < this.maxRetries) {
        const delay = Math.pow(2, tentativa) * 1000; // Backoff exponencial: 2s, 4s, 8s
        console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.enviarComRetry(mailOptions, tentativa + 1);
      }

      throw erro;
    }
  }

  /**
   * Envia e-mail de verificação para novo cadastro
   * @param {string} email - E-mail do destinatário
   * @param {string} nome - Nome do usuário
   * @param {string} token - Token de verificação
   */
  async enviarEmailVerificacao(email, nome, token) {
    // Se SMTP não estiver configurado, apenas logar
    if (!this.estaConfigurado()) {
      console.warn('⚠️  SMTP não configurado. E-mail não será enviado.');
      console.log(`📧 [MODO DEV] Link de verificação para ${email}:`);
      const urlFrontend = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000';
      const urlVerificacao = `${urlFrontend}/auth/verificar-email?token=${token}&email=${encodeURIComponent(email)}`;
      console.log(`🔗 ${urlVerificacao}`);
      return;
    }

    // URL do frontend para verificação de e-mail
    // Se tiver múltiplas URLs (dev,prod), pega a primeira (produção)
    const urlsFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const urlFrontend = urlsFrontend.includes(',') ?
      urlsFrontend.split(',').find(url => url.includes('vercel.app')) || urlsFrontend.split(',')[0] :
      urlsFrontend;
    const urlVerificacao = `${urlFrontend.trim()}/auth/verificar-email?token=${token}&email=${encodeURIComponent(email)}`;

    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
          }
          .content h2 {
            color: #667eea;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            line-height: 1.6;
            font-size: 16px;
            color: #555555;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            margin: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background-color: #f8f8f8;
            padding: 20px 30px;
            text-align: center;
            color: #888888;
            font-size: 14px;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
          }
          .info-box {
            background-color: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 0;
            color: #555555;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 VittaCash</h1>
          </div>
          <div class="content">
            <h2>Olá, ${nome || 'Usuário'}! 👋</h2>
            <p>
              Bem-vindo(a) ao <strong>VittaCash</strong>, sua plataforma de gerenciamento financeiro pessoal!
            </p>
            <p>
              Para concluir seu cadastro e começar a organizar suas finanças de forma inteligente, 
              precisamos verificar seu endereço de e-mail.
            </p>
            
            <div style="text-align: center;">
              <a href="${urlVerificacao}" class="button">
                ✅ Verificar Meu E-mail
              </a>
            </div>

            <div class="info-box">
              <p>
                <strong>⏰ Este link expira em 24 horas.</strong><br>
                Se você não solicitou este cadastro, pode ignorar este e-mail.
              </p>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #888888;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="font-size: 14px; word-break: break-all; color: #667eea;">
              ${urlVerificacao}
            </p>
          </div>
          <div class="footer">
            <p>
              Este é um e-mail automático, por favor não responda.<br>
              © ${new Date().getFullYear()} VittaCash - Todos os direitos reservados.
            </p>
            <p>
              Precisa de ajuda? <a href="${process.env.FRONTEND_URL}/suporte">Entre em contato</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"VittaCash" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Confirme seu e-mail - VittaCash',
      html: htmlEmail,
    };

    try {
      await this.enviarComRetry(mailOptions);
      console.log(`✅ E-mail de verificação enviado para: ${email}`);
    } catch (erro) {
      console.error('❌ Erro ao enviar e-mail após todas as tentativas:', erro.message);
      console.log(`📧 [FALLBACK] Link de verificação para ${email}:`);
      console.log(`🔗 ${urlVerificacao}`);
      // Não lançar erro para não quebrar o fluxo de cadastro
      // Mas logar de forma mais visível
      console.log('\n⚠️  ATENÇÃO: Envio de e-mail falhou. Possíveis causas:');
      console.log('   1. Render pode estar bloqueando SMTP na porta 587');
      console.log('   2. Gmail pode estar bloqueando o IP do Render');
      console.log('   3. Verifique as credenciais SMTP no painel do Render\n');
    }
  }

  /**
   * Envia e-mail de boas-vindas para usuários do Google OAuth
   * @param {string} email - E-mail do destinatário
   * @param {string} nome - Nome do usuário
   */
  async enviarEmailBoasVindas(email, nome) {
    // Se SMTP não estiver configurado, apenas logar
    if (!this.estaConfigurado()) {
      console.warn('⚠️  SMTP não configurado. E-mail de boas-vindas não será enviado.');
      return;
    }

    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
          }
          .content h2 {
            color: #667eea;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            line-height: 1.6;
            font-size: 16px;
            color: #555555;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            margin: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
          }
          .footer {
            background-color: #f8f8f8;
            padding: 20px 30px;
            text-align: center;
            color: #888888;
            font-size: 14px;
          }
          .feature {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 15px;
            background-color: #f0f4ff;
            border-radius: 8px;
          }
          .feature-icon {
            font-size: 24px;
            margin-right: 15px;
          }
          .feature-text {
            flex: 1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 VittaCash</h1>
          </div>
          <div class="content">
            <h2>Bem-vindo(a), ${nome || 'Usuário'}! 🎉</h2>
            <p>
              Sua conta foi criada com sucesso usando o <strong>Google</strong>! 
              Estamos muito felizes em tê-lo(a) conosco.
            </p>
            <p>
              Agora você pode aproveitar todas as funcionalidades do VittaCash para 
              gerenciar suas finanças de forma simples e inteligente.
            </p>

            <div style="margin: 30px 0;">
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                  <strong>Controle total de despesas</strong><br>
                  Adicione, edite e organize suas despesas por categoria
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📈</div>
                <div class="feature-text">
                  <strong>Relatórios detalhados</strong><br>
                  Visualize gráficos mensais e anuais das suas finanças
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📁</div>
                <div class="feature-text">
                  <strong>Import/Export</strong><br>
                  Importe e exporte seus dados em formato CSV
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                🚀 Acessar Minha Conta
              </a>
            </div>
          </div>
          <div class="footer">
            <p>
              © ${new Date().getFullYear()} VittaCash - Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"VittaCash" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '🎉 Bem-vindo ao VittaCash!',
      html: htmlEmail,
    };

    try {
      await this.enviarComRetry(mailOptions);
      console.log(`✅ E-mail de boas-vindas enviado para: ${email}`);
    } catch (erro) {
      console.error('❌ Erro ao enviar e-mail de boas-vindas após todas as tentativas:', erro.message);
      // Não lançar erro para não quebrar o fluxo de login
    }
  }

  /**
   * Reenvia e-mail de verificação
   */
  async reenviarEmailVerificacao(email) {
    const usuario = await prisma.user.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (usuario.emailVerified) {
      throw new Error('E-mail já verificado');
    }

    const token = await this.criarTokenVerificacao(email);
    await this.enviarEmailVerificacao(email, usuario.name, token);

    return { mensagem: 'E-mail de verificação reenviado com sucesso' };
  }
}

export default new EmailService();

