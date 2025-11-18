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
            <img src="${process.env.LOGO_URL || 'https://raw.githubusercontent.com/SaraahBR/VittaCash/main/public/LOGO_VittaCash.png'}" alt="VittaCash Logo" class="logo" onerror="this.style.display='none'" />
          </div>
          
          <div class="content">
            <div class="greeting">Olá, ${nome || 'Usuário'}! 👋</div>
            
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
    sendSmtpEmail.subject = '✅ Confirme seu e-mail - VittaCash';
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
            color: #f5f5f0;
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
          .features-grid {
            margin: 40px 0;
          }
          .feature-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            border: 2px solid transparent;
            background-clip: padding-box;
            position: relative;
            transition: all 0.3s ease;
          }
          .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 12px;
            padding: 2px;
            background: linear-gradient(135deg, #FFD93D 0%, #6BCB77 50%, #4D96FF 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
          }
          .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(107, 203, 119, 0.2);
          }
          .feature-icon {
            font-size: 32px;
            margin-bottom: 15px;
            display: inline-block;
          }
          .feature-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          .feature-description {
            font-size: 14px;
            color: #6c757d;
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
            <img src="${process.env.LOGO_URL || 'https://raw.githubusercontent.com/SaraahBR/VittaCash/main/public/LOGO_VittaCash.png'}" alt="VittaCash Logo" class="logo" onerror="this.style.display='none'" />
          </div>
          
          <div class="content">
            <div style="text-align: center;">
              <div class="celebration-badge">🎉 Conta Criada com Sucesso!</div>
            </div>
            
            <div class="greeting">Bem-vindo(a), ${nome || 'Usuário'}!</div>
            
            <p>
              Sua conta foi criada com sucesso usando o <strong>Google</strong>! Estamos muito felizes em tê-lo(a) conosco no <strong>VittaCash</strong>.
            </p>
            
            <p>
              Agora você tem acesso completo a todas as funcionalidades da nossa plataforma profissional de gerenciamento financeiro. Prepare-se para transformar a forma como você controla suas finanças!
            </p>

            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <div class="feature-title">Controle Total de Despesas</div>
                <div class="feature-description">
                  Adicione, edite e organize suas despesas por categoria com facilidade. Acompanhe cada centavo do seu orçamento.
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">📈</div>
                <div class="feature-title">Relatórios Detalhados</div>
                <div class="feature-description">
                  Visualize gráficos mensais e anuais com análises completas das suas finanças. Tome decisões baseadas em dados reais.
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">📁</div>
                <div class="feature-title">Import/Export de Dados</div>
                <div class="feature-description">
                  Importe e exporte seus dados em formato CSV. Seus dados sempre seguros e acessíveis quando você precisar.
                </div>
              </div>
            </div>

            <div class="cta-container">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">
                🚀 Acessar Minha Conta
              </a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6c757d; text-align: center;">
              Dúvidas? Nossa equipe está pronta para ajudar você a começar!
            </p>
          </div>
          
          <div class="footer">
            <p style="margin-bottom: 15px;">
              <strong>VittaCash</strong> - Seu controle financeiro profissional
            </p>
            <p style="font-size: 13px; color: #bdc3c7;">
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
    sendSmtpEmail.subject = '🎉 Bem-vindo ao VittaCash!';
    sendSmtpEmail.htmlContent = htmlEmail;

    try {
      await this.enviarComRetry(sendSmtpEmail);
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

