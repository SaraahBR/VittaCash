import brevo from '@getbrevo/brevo';
import crypto from 'crypto';
import prisma from '../config/bancoDados.js';

class EmailService {
  constructor() {
    // Configurar Brevo API (ex-Sendinblue)
    const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;

    if (brevoApiKey) {
      this.apiInstance = new brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
      console.log('✅ Brevo API configurada (300 emails/dia grátis)');
    } else {
      console.warn('⚠️  Brevo API Key não encontrada');
    }

    // Número máximo de tentativas
    this.maxRetries = 3;
  }

  /**
   * Verificar se Brevo está configurado
   */
  estaConfigurado() {
    const apiKey = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
    const configurado = !!apiKey;

    if (!configurado) {
      console.warn('\n⚠️  BREVO NÃO CONFIGURADO!');
      console.warn('   Configure a variável de ambiente:');
      console.warn('   - BREVO_API_KEY (Recomendado - 300 emails/dia grátis)');
      console.warn('   Ou mantenha SENDGRID_API_KEY/SMTP_PASS para compatibilidade');
      console.warn('   Cadastre-se: https://app.brevo.com/account/register\n');
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
   * Método auxiliar para enviar e-mail com retry via Brevo API
   */
  async enviarComRetry(sendSmtpEmail, tentativa = 1) {
    try {
      // Criar promise com timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao enviar e-mail')), 10000);
      });

      const sendPromise = this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      const response = await Promise.race([sendPromise, timeoutPromise]);
      
      const messageId = response.body?.messageId || response.messageId || 'N/A';
      console.log(`✅ E-mail enviado com sucesso via Brevo (tentativa ${tentativa})`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Status: ${response.response?.statusCode || 'N/A'} ${response.response?.statusMessage || ''}`);
      console.log(`   Para: ${sendSmtpEmail.to?.[0]?.email || 'N/A'}`);
      console.log(`   De: ${sendSmtpEmail.sender?.email || 'N/A'}`);

      // Aviso importante sobre verificação de sender
      if (tentativa === 1) {
        console.log(`\n⚠️  IMPORTANTE: Se o e-mail não chegar em 2-3 minutos:`);
        console.log(`   1. Verifique se o sender está verificado: https://app.brevo.com/senders`);
        console.log(`   2. Veja logs do envio: https://app.brevo.com/email/logs`);
        console.log(`   3. Procure por Message ID: ${messageId}\n`);
      }

      return true;
    } catch (erro) {
      console.error(`❌ Erro na tentativa ${tentativa}:`, erro.message);

      // Não fazer retry em caso de timeout - falhar rápido
      if (erro.message === 'Timeout ao enviar e-mail') {
        console.error('❌ Timeout ao enviar e-mail - abortando tentativas');
        throw erro;
      }

      if (tentativa < this.maxRetries) {
        const delay = Math.pow(2, tentativa) * 1000; // Backoff exponencial: 2s, 4s, 8s
        console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.enviarComRetry(sendSmtpEmail, tentativa + 1);
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
    // URL do frontend para verificação de e-mail
    const urlsFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const urlFrontend = urlsFrontend.includes(',') ?
      urlsFrontend.split(',').find(url => url.includes('vercel.app')) || urlsFrontend.split(',')[0] :
      urlsFrontend;
    const urlVerificacao = `${urlFrontend.trim()}/auth/verificar-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Se SMTP não estiver configurado, apenas logar
    if (!this.estaConfigurado()) {
      console.warn('⚠️  SMTP não configurado. E-mail não será enviado.');
      console.log(`📧 [MODO DEV] Link de verificação para ${email}:`);
      console.log(`🔗 ${urlVerificacao}`);
      return { sucesso: true, modo: 'dev' };
    }

    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 15px;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
          }
          .header-title {
            color: #ffffff;
            font-size: 32px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          .content {
            padding: 50px 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
          }
          .content p {
            color: #2c3e50;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 15px;
          }
          .content strong {
            color: #1a1a1a;
            font-weight: 600;
          }
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 18px 50px;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            color: #f5f5f0 !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }
          .info-card {
            background: linear-gradient(135deg, #fff9e6 0%, #e8f8f0 50%, #e3f2fd 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border: 2px solid #FFD93D;
            position: relative;
            overflow: hidden;
          }
          .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(180deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
          }
          .info-card p {
            margin: 0;
            padding-left: 15px;
            color: #2c3e50;
            font-size: 15px;
          }
          .info-card strong {
            color: #1a1a1a;
            display: block;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .divider {
            height: 2px;
            background: linear-gradient(90deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            margin: 35px 0;
            border-radius: 2px;
          }
          .link-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 25px;
          }
          .link-section p {
            font-size: 13px;
            color: #6c757d;
            margin-bottom: 10px;
          }
          .verification-link {
            color: #4D96FF;
            word-break: break-all;
            font-size: 13px;
            font-family: 'Courier New', monospace;
            background-color: #fff;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
            display: block;
          }
          .footer {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            padding: 35px 40px;
            text-align: center;
          }
          .footer p {
            color: #ecf0f1;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .footer a {
            color: #FFD93D;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
          }
          .footer a:hover {
            color: #6BCB77;
          }
          .social-links {
            margin-top: 20px;
          }
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #ecf0f1;
            font-size: 12px;
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px;
            }
            .content {
              padding: 30px 25px;
            }
            .header {
              padding: 30px 20px;
            }
            .header-title {
              font-size: 26px;
            }
            .greeting {
              font-size: 24px;
            }
            .cta-button {
              padding: 16px 40px;
              font-size: 15px;
            }
            .logo {
              max-width: 150px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="https://raw.githubusercontent.com/SaraahBR/VittaCash/main/public/LOGO_VittaCash.png" alt="VittaCash Logo" class="logo" />
          </div>
          
          <div class="content">
            <div class="greeting">Olá, ${nome || 'Usuário'}!</div>
            
            <p>
              Seja muito bem-vindo(a) ao <strong>VittaCash</strong>, sua nova plataforma de gerenciamento financeiro pessoal!
            </p>
            
            <p>
              Estamos muito felizes em tê-lo(a) conosco. Para começar a organizar suas finanças de forma inteligente e profissional, precisamos verificar seu endereço de e-mail.
            </p>
            
            <div class="cta-container">
              <a href="${urlVerificacao}" class="cta-button">
                VERIFICAR MEU E-MAIL
              </a>
            </div>

            <div class="info-card">
              <p>
                <strong>⏰ Importante:</strong>
                Este link de verificação expira em 24 horas por motivos de segurança. Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
              </p>
            </div>

            <div class="divider"></div>

            <div class="link-section">
              <p style="margin-bottom: 10px; color: #6c757d;">
                <strong>Problemas com o botão?</strong> Copie e cole este link no seu navegador:
              </p>
              <div class="verification-link">
                ${urlVerificacao}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin-bottom: 15px;">
              <strong>VittaCash</strong> - Seu controle financeiro profissional
            </p>
            <p style="font-size: 13px; color: #bdc3c7;">
              Este é um e-mail automático, por favor não responda.
            </p>
            <p style="font-size: 13px; color: #bdc3c7; margin-top: 5px;">
              © ${new Date().getFullYear()} VittaCash - Todos os direitos reservados.
            </p>
            <div class="social-links">
              <a href="${process.env.FRONTEND_URL}/suporte">Suporte</a> • 
              <a href="${process.env.FRONTEND_URL}/termos">Termos de Uso</a> • 
              <a href="${process.env.FRONTEND_URL}/privacidade">Privacidade</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Formato Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: 'VittaCash',
      email: process.env.EMAIL_FROM || 'vittacash@gmail.com'
    };
    sendSmtpEmail.to = [{ email: email, name: nome }];
    sendSmtpEmail.subject = '✅  Confirme seu e-mail - VittaCash';
    sendSmtpEmail.htmlContent = htmlEmail;

    try {
      await this.enviarComRetry(sendSmtpEmail);
      console.log(`✅ E-mail de verificação enviado para: ${email}`);
      return { sucesso: true, modo: 'producao' };
    } catch (erro) {
      console.error('❌ Erro ao enviar e-mail após todas as tentativas:', erro.message);
      console.log(`📧 [FALLBACK] Link de verificação para ${email}:`);
      console.log(`🔗 ${urlVerificacao}`);
      // Não lançar erro para não quebrar o fluxo de cadastro
      // Mas logar de forma mais visível
      console.log('\n⚠️  ATENÇÃO: Envio de e-mail falhou via Brevo API.');
      console.log('   Verifique:');
      console.log('   1. BREVO_API_KEY está configurado no Render');
      console.log('   2. EMAIL_FROM está correto');
      console.log('   3. Cadastre-se: https://app.brevo.com/account/register\n');
      
      // Retornar ao invés de lançar erro
      return { sucesso: false, modo: 'fallback', erro: erro.message };
    }
  }

  /**
   * Envia e-mail de boas-vindas para usuários do Google OAuth
   * @param {string} email - E-mail do destinatário
   * @param {string} nome - Nome do usuário
   */
  async enviarEmailBoasVindas(email, nome) {
    const urlsFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const urlFrontend = urlsFrontend.includes(',') ?
      urlsFrontend.split(',').find(url => url.includes('vercel.app')) || urlsFrontend.split(',')[0] :
      urlsFrontend;

    // Se SMTP não estiver configurado, apenas logar
    if (!this.estaConfigurado()) {
      console.warn('⚠️  SMTP não configurado. E-mail de boas-vindas não será enviado.');
      return { sucesso: false, modo: 'dev', erro: 'SMTP não configurado' };
    }

    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 15px;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
          }
          .header-title {
            color: #ffffff;
            font-size: 32px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          .content {
            padding: 50px 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
          }
          .celebration-badge {
            display: inline-block;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 100%);
            color: #ffffff;
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 25px;
            box-shadow: 0 4px 12px rgba(107, 203, 119, 0.3);
          }
          .content p {
            color: #2c3e50;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 15px;
          }
          .content strong {
            color: #1a1a1a;
            font-weight: 600;
          }
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 18px 50px;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            color: #f5f5f0 !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 20px rgba(107, 203, 119, 0.4);
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(107, 203, 119, 0.5);
          }
          .info-card {
            background: linear-gradient(135deg, #fff9e6 0%, #e8f8f0 50%, #e3f2fd 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border: 2px solid #FFD93D;
            position: relative;
            overflow: hidden;
          }
          .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(180deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
          }
          .info-card p {
            margin: 0;
            padding-left: 15px;
            color: #2c3e50;
            font-size: 15px;
          }
          .info-card strong {
            color: #1a1a1a;
            display: block;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
          }
          .feature-item {
            padding: 15px 20px;
            margin-bottom: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #6BCB77;
          }
          .feature-item strong {
            display: block;
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .feature-item span {
            color: #6c757d;
            font-size: 14px;
            line-height: 1.6;
          }
          .divider {
            height: 2px;
            background: linear-gradient(90deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            margin: 35px 0;
            border-radius: 2px;
          }
          .footer {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            padding: 35px 40px;
            text-align: center;
          }
          .footer p {
            color: #ecf0f1;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .footer a {
            color: #FFD93D;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
          }
          .footer a:hover {
            color: #6BCB77;
          }
          .social-links {
            margin-top: 20px;
          }
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #ecf0f1;
            font-size: 12px;
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px;
            }
            .content {
              padding: 30px 25px;
            }
            .header {
              padding: 30px 20px;
            }
            .header-title {
              font-size: 26px;
            }
            .greeting {
              font-size: 24px;
            }
            .cta-button {
              padding: 16px 40px;
              font-size: 15px;
            }
            .logo {
              max-width: 150px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="https://raw.githubusercontent.com/SaraahBR/VittaCash/main/public/LOGO_VittaCash.png" alt="VittaCash Logo" class="logo" />
          </div>
          
          <div class="content">
            <div class="greeting">Bem-vindo(a), ${nome || 'Usuário'}!</div>
            
            <p>
              É com grande satisfação que confirmamos a criação da sua conta no <strong>VittaCash</strong>. Estamos prontos para ajudá-lo(a) a transformar a gestão das suas finanças.
            </p>
            
            <p>
              Agora você tem acesso completo a todas as funcionalidades da nossa plataforma de gerenciamento financeiro profissional.
            </p>

            <div class="info-card">
              <p>
                <strong>Recursos Disponíveis:</strong>
              </p>
            </div>

            <ul class="feature-list">
              <li class="feature-item">
                <strong>Controle de Despesas</strong>
                <span>Registre e categorize todas as suas despesas para melhor visualização do seu orçamento.</span>
              </li>
              <li class="feature-item">
                <strong>Relatórios Detalhados</strong>
                <span>Acompanhe suas finanças através de gráficos mensais e anuais com análises completas.</span>
              </li>
              <li class="feature-item">
                <strong>Importação e Exportação</strong>
                <span>Gerencie seus dados com facilidade através de arquivos CSV compatíveis.</span>
              </li>
            </ul>

            <div class="cta-container">
              <a href="${urlFrontend.trim()}/dashboard" class="cta-button">
                Acessar Minha Conta
              </a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Nossa equipe de suporte está à disposição para auxiliá-lo(a) em qualquer dúvida.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin-bottom: 15px;">
              <strong>VittaCash</strong> - Seu controle financeiro profissional
            </p>
            <p style="font-size: 13px; color: #bdc3c7;">
              Este é um e-mail automático, por favor não responda.
            </p>
            <p style="font-size: 13px; color: #bdc3c7; margin-top: 5px;">
              © ${new Date().getFullYear()} VittaCash - Todos os direitos reservados.
            </p>
            <div class="social-links">
              <a href="${urlFrontend.trim()}/suporte">Suporte</a> • 
              <a href="${urlFrontend.trim()}/termos">Termos de Uso</a> • 
              <a href="${urlFrontend.trim()}/privacidade">Privacidade</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Formato Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: 'VittaCash',
      email: process.env.EMAIL_FROM || 'vittacash@gmail.com'
    };
    sendSmtpEmail.to = [{ email: email, name: nome }];
    sendSmtpEmail.subject = 'Bem-vindo ao VittaCash';
    sendSmtpEmail.htmlContent = htmlEmail;

    try {
      await this.enviarComRetry(sendSmtpEmail);
      console.log(`✅ E-mail de boas-vindas enviado para: ${email}`);
      return { sucesso: true, modo: 'producao' };
    } catch (erro) {
      console.error('❌ Erro ao enviar e-mail de boas-vindas após todas as tentativas:', erro.message);
      // Não lançar erro para não quebrar o fluxo de login
      return { sucesso: false, modo: 'fallback', erro: erro.message };
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

  /**
   * Gera gráfico de pizza em SVG
   */
  gerarGraficoPizza(dados) {
    const total = dados.reduce((sum, item) => sum + item.valor, 0);
    if (total === 0) return '';

    let currentAngle = -90; // Começar no topo
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const slices = dados.map(item => {
      const percentage = (item.valor / total) * 100;
      const sliceAngle = (percentage / 100) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      const x1 = centerX + radius * Math.cos((Math.PI * startAngle) / 180);
      const y1 = centerY + radius * Math.sin((Math.PI * startAngle) / 180);
      const x2 = centerX + radius * Math.cos((Math.PI * endAngle) / 180);
      const y2 = centerY + radius * Math.sin((Math.PI * endAngle) / 180);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      currentAngle += sliceAngle;

      return { pathData, cor: item.cor, percentage: percentage.toFixed(1) };
    });

    const svgSlices = slices.map(slice =>
      `<path d="${slice.pathData}" fill="${slice.cor}" stroke="#ffffff" stroke-width="2"/>`
    ).join('');

    return `
      <svg width="200" height="200" viewBox="0 0 200 200" style="display: block; margin: 0 auto;">
        ${svgSlices}
      </svg>
    `;
  }

  /**
   * Gera gráfico de colunas em SVG
   */
  gerarGraficoColunas(dados) {
    if (dados.length === 0) return '';

    const maxValor = Math.max(...dados.map(d => d.valor));
    if (maxValor === 0) return '';

    const barWidth = 40;
    const barSpacing = 20;
    const chartHeight = 200;
    const chartWidth = dados.length * (barWidth + barSpacing);

    const bars = dados.map((item, index) => {
      const barHeight = (item.valor / maxValor) * chartHeight;
      const x = index * (barWidth + barSpacing);
      const y = chartHeight - barHeight;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.cor}" rx="4"/>
        <text x="${x + barWidth / 2}" y="${chartHeight + 15}" text-anchor="middle" font-size="12" fill="#2c3e50">${item.label}</text>
        <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="11" fill="#2c3e50" font-weight="600">R$ ${item.valor.toFixed(2)}</text>
      `;
    }).join('');

    return `
      <svg width="${chartWidth}" height="${chartHeight + 30}" style="display: block; margin: 0 auto;">
        ${bars}
      </svg>
    `;
  }

  /**
   * Envia e-mail com relatório de despesas
   * @param {string} email - E-mail do destinatário
   * @param {string} nome - Nome do usuário
   * @param {object} relatorio - Dados do relatório
   */
  async enviarEmailRelatorioDespesas(email, nome, relatorio) {
    const urlsFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const urlFrontend = urlsFrontend.includes(',') ?
      urlsFrontend.split(',').find(url => url.includes('vercel.app')) || urlsFrontend.split(',')[0] :
      urlsFrontend;

    if (!this.estaConfigurado()) {
      console.warn('⚠️  SMTP não configurado. E-mail de relatório não será enviado.');
      return;
    }

    // Cores para categorias
    const coresCategorias = {
      'ALIMENTACAO': '#FFD93D',
      'TRANSPORTE': '#4D96FF',
      'SAUDE': '#6BCB77',
      'EDUCACAO': '#9B59B6',
      'LAZER': '#E74C3C',
      'MORADIA': '#F39C12',
      'OUTROS': '#95A5A6'
    };

    // Preparar dados para os gráficos
    const dadosPizza = relatorio.porCategoria.map(cat => ({
      categoria: cat.categoria,
      valor: cat.total,
      cor: coresCategorias[cat.categoria] || '#95A5A6'
    }));

    const graficoPizza = this.gerarGraficoPizza(dadosPizza);

    // Dados para gráfico de colunas (se for relatório anual)
    let graficoColunas = '';
    if (relatorio.tipo === 'anual') {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dadosColunas = relatorio.porMes
        .filter(m => m.total > 0)
        .map(m => ({
          label: meses[m.mes - 1],
          valor: m.total,
          cor: '#6BCB77'
        }));
      graficoColunas = this.gerarGraficoColunas(dadosColunas);
    }

    // Calcular estatísticas
    const mediaGasto = relatorio.tipo === 'anual'
      ? relatorio.totalGeral / 12
      : relatorio.totalGeral;

    const despesaMaisCara = relatorio.porCategoria.length > 0
      ? relatorio.porCategoria.reduce((max, cat) => cat.total > max.total ? cat : max)
      : null;

    const periodo = relatorio.tipo === 'mensal'
      ? `${relatorio.mes}/${relatorio.ano}`
      : `${relatorio.ano}`;

    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 15px;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
          }
          .header-title {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          .content {
            padding: 50px 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
          }
          .content p {
            color: #2c3e50;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 15px;
          }
          .content strong {
            color: #1a1a1a;
            font-weight: 600;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 30px 0;
          }
          .stat-card {
            background: linear-gradient(135deg, #fff9e6 0%, #e8f8f0 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 2px solid #6BCB77;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 13px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .chart-section {
            margin: 35px 0;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 12px;
          }
          .chart-title {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
          }
          .category-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
          }
          .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #ffffff;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #6BCB77;
          }
          .category-name {
            font-weight: 600;
            color: #2c3e50;
          }
          .category-value {
            font-weight: 700;
            color: #1a1a1a;
          }
          .highlight-card {
            background: linear-gradient(135deg, #fff9e6 0%, #e8f8f0 50%, #e3f2fd 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border: 2px solid #FFD93D;
            position: relative;
            overflow: hidden;
          }
          .highlight-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(180deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
          }
          .highlight-card h3 {
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 15px;
            padding-left: 15px;
          }
          .highlight-card p {
            margin: 0;
            padding-left: 15px;
            color: #2c3e50;
            font-size: 15px;
          }
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 18px 50px;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            color: #f5f5f0 !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .divider {
            height: 2px;
            background: linear-gradient(90deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            margin: 35px 0;
            border-radius: 2px;
          }
          .footer {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            padding: 35px 40px;
            text-align: center;
          }
          .footer p {
            color: #ecf0f1;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .footer a {
            color: #FFD93D;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
          }
          .footer a:hover {
            color: #6BCB77;
          }
          .social-links {
            margin-top: 20px;
          }
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #ecf0f1;
            font-size: 12px;
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px;
            }
            .content {
              padding: 30px 25px;
            }
            .header {
              padding: 30px 20px;
            }
            .header-title {
              font-size: 24px;
            }
            .greeting {
              font-size: 24px;
            }
            .stats-grid {
              grid-template-columns: 1fr;
            }
            .cta-button {
              padding: 16px 40px;
              font-size: 15px;
            }
            .logo {
              max-width: 150px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="https://raw.githubusercontent.com/SaraahBR/VittaCash/main/public/LOGO_VittaCash.png" alt="VittaCash Logo" class="logo" />
            <div class="header-title">Relatório de Despesas</div>
          </div>
          
          <div class="content">
            <div class="greeting">Olá, ${nome || 'Usuário'}!</div>
            
            <p>
              Preparamos um relatório completo das suas despesas do período <strong>${periodo}</strong>. Confira abaixo as estatísticas e análises detalhadas.
            </p>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">R$ ${relatorio.totalGeral.toFixed(2)}</div>
                <div class="stat-label">Total Gasto</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${relatorio.totalDespesas}</div>
                <div class="stat-label">Despesas Registradas</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">R$ ${mediaGasto.toFixed(2)}</div>
                <div class="stat-label">Média ${relatorio.tipo === 'anual' ? 'Mensal' : 'Diária'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${relatorio.porCategoria.length}</div>
                <div class="stat-label">Categorias Utilizadas</div>
              </div>
            </div>

            ${despesaMaisCara ? `
            <div class="highlight-card">
              <h3>💡 Despesa com Maior Valor</h3>
              <p>
                <strong>${despesaMaisCara.nome || despesaMaisCara.categoria}</strong> foi sua ${despesaMaisCara.nome ? 'despesa' : 'categoria'} com maior gasto: 
                <strong>R$ ${(despesaMaisCara.valor || despesaMaisCara.total).toFixed(2)}</strong> 
                (${(((despesaMaisCara.valor || despesaMaisCara.total) / relatorio.totalGeral) * 100).toFixed(1)}% do total)
              </p>
            </div>
            ` : ''}

            <div class="chart-section">
              <div class="chart-title">📊 Distribuição por Despesas</div>
              ${graficoPizza}
              
              <ul class="category-list">
                ${relatorio.despesas && relatorio.despesas.length > 0 ? relatorio.despesas.map(desp => `
                  <li class="category-item">
                    <span class="category-name">${desp.nome}</span>
                    <span class="category-value">&nbsp;&nbsp;R$ ${desp.valor.toFixed(2)} (${((desp.valor / relatorio.totalGeral) * 100).toFixed(1)}%)</span>
                  </li>
                `).join('') : relatorio.porCategoria.map(cat => `
                  <li class="category-item">
                    <span class="category-name">${cat.categoria}</span>
                    <span class="category-value">&nbsp;&nbsp;R$ ${cat.total.toFixed(2)} (${((cat.total / relatorio.totalGeral) * 100).toFixed(1)}%)</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            ${graficoColunas ? `
            <div class="chart-section">
              <div class="chart-title">📈 Gastos Mensais de ${relatorio.ano}</div>
              ${graficoColunas}
            </div>
            ` : ''}

            <div class="cta-container">
              <a href="${urlFrontend.trim()}/dashboard" class="cta-button">
                Ver Dashboard Completo
              </a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Continue acompanhando suas finanças no VittaCash para manter o controle total dos seus gastos.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin-bottom: 15px;">
              <strong>VittaCash</strong> - Seu controle financeiro profissional
            </p>
            <p style="font-size: 13px; color: #bdc3c7;">
              Este é um e-mail automático, por favor não responda.
            </p>
            <p style="font-size: 13px; color: #bdc3c7; margin-top: 5px;">
              © ${new Date().getFullYear()} VittaCash - Todos os direitos reservados.
            </p>
            <div class="social-links">
              <a href="${urlFrontend.trim()}/suporte">Suporte</a> • 
              <a href="${urlFrontend.trim()}/termos">Termos de Uso</a> • 
              <a href="${urlFrontend.trim()}/privacidade">Privacidade</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: 'VittaCash',
      email: process.env.EMAIL_FROM || 'vittacash@gmail.com'
    };
    sendSmtpEmail.to = [{ email: email, name: nome }];
    sendSmtpEmail.subject = `📊 Relatório de Despesas - ${periodo} - VittaCash`;
    sendSmtpEmail.htmlContent = htmlEmail;

    try {
      await this.enviarComRetry(sendSmtpEmail);
      console.log(`✅ E-mail de relatório enviado para: ${email}`);
      return { sucesso: true };
    } catch (erro) {
      console.error('❌ Erro ao enviar e-mail de relatório:', erro.message);
      return { sucesso: false, erro: erro.message };
    }
  }
}

export default new EmailService();

