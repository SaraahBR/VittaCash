# 💰 VittaCash - Backend API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v5.1-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-v6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Brevo](https://img.shields.io/badge/Brevo-0B996E?style=for-the-badge&logo=sendinblue&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)

**Sistema de Gerenciamento de Despesas Pessoais**

[Demo](https://vittacash.onrender.com) • [Documentação API](https://vittacash.onrender.com/api-docs) • [Frontend](https://vittacash.vercel.app)

</div>

---

## 📑 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Por que Brevo? (Solução de E-mail)](#-por-que-brevo-solução-de-e-mail)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Modelos de Dados](#-modelos-de-dados)
- [API Endpoints](#-api-endpoints)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Documentação Técnica](#-documentação-técnica)
- [Deploy](#-deploy)
- [Autora](#-autora)
- [Licença](#-licença)

---

## 📖 Sobre o Projeto

**VittaCash** é uma API REST completa para gerenciamento de despesas pessoais, desenvolvida com Node.js e Express. O sistema oferece autenticação segura (tradicional e OAuth Google), CRUD completo de despesas, relatórios analíticos e verificação de e-mail.

### 🎯 Objetivo

Fornecer uma solução robusta e escalável para controle financeiro pessoal, com foco em:
- Segurança e privacidade dos dados
- Facilidade de uso e integração
- Relatórios e análises detalhadas

### 🌟 Diferenciais

- ✅ Autenticação híbrida (tradicional + OAuth Google)
- ✅ Verificação de e-mail com tokens seguros
- ✅ DTOs para validação e transformação de dados
- ✅ Arquitetura em camadas (MVC + Repository Pattern)
- ✅ Documentação Swagger/OpenAPI integrada
- ✅ Suporte a múltiplas origens CORS
- ✅ Relatórios mensais e anuais

---

## 🚀 Tecnologias

### **Core**
- **[Node.js](https://nodejs.org/)** v20+ - Runtime JavaScript
- **[Express.js](https://expressjs.com/)** v5.1 - Framework web minimalista
- **[Prisma ORM](https://www.prisma.io/)** v6.19 - ORM moderno para Node.js
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional

### **Autenticação & Segurança**
- **[JWT (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken)** - Autenticação baseada em tokens
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hash de senhas
- **[Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)** - OAuth 2.0 Google
- **[crypto](https://nodejs.org/api/crypto.html)** (nativo) - Geração de tokens de verificação

### **Validação**
- **[Joi](https://joi.dev/)** - Validação de schemas
- **DTOs customizados** - Transformação e validação de dados

### **Documentação**
- **[Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)** - Interface Swagger
- **[Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)** - Geração de especificação OpenAPI

### **E-mail**
- **[Brevo](https://www.brevo.com/)** (ex-Sendinblue) - Serviço de e-mail transacional
  - 300 emails/dia **grátis para sempre**
  - 9.000 emails/mês sem custo
  - API REST confiável e rápida
  - Dashboard com analytics completo

### **Utilitários**
- **[CORS](https://github.com/expressjs/cors)** - Cross-Origin Resource Sharing
- **[dotenv](https://github.com/motdotla/dotenv)** - Gerenciamento de variáveis de ambiente

### **Desenvolvimento**
- **[Nodemon](https://nodemon.io/)** - Hot reload em desenvolvimento
- **[ESLint](https://eslint.org/)** - Linter JavaScript

---

## 📧 Por que Brevo? (Solução de E-mail)

### **Contexto e Decisão Técnica**

Durante o desenvolvimento do VittaCash, foram testadas **3 soluções** diferentes para envio de e-mails transacionais (verificação de conta, recuperação de senha, etc). Abaixo está a análise técnica completa que levou à escolha do **Brevo** como solução definitiva.

---

### **❌ Solução 1: SMTP Gmail (Primeira Tentativa)**

#### **Implementação:**
- Biblioteca: `nodemailer`
- Protocolo: SMTP (porta 587)
- Servidor: `smtp.gmail.com`

#### **Problemas Identificados:**

##### **1. Bloqueio no Render Free Tier**
```
❌ Connection timeout
❌ SMTP porta 587 bloqueada
```
O **Render Free Tier bloqueia todas as portas SMTP** (25, 465, 587) para prevenir spam. Isso torna impossível usar SMTP direto em produção gratuita.

##### **2. Configuração Complexa**
- Requer "Senha de App" do Google (2FA obrigatório)
- Configuração de "Apps menos seguros"
- Problemas de segurança com credenciais hardcoded

##### **3. Limitações do Gmail**
- **Limite:** 500 emails/dia (conta gratuita)
- **Restrições:** Bloqueios automáticos por comportamento suspeito
- **Confiabilidade:** Taxa de entrega ~85-90%

#### **Conclusão:** ❌ Inviável para produção no Render Free Tier

---

### **❌ Solução 2: SendGrid (Segunda Tentativa)**

#### **Implementação:**
- Biblioteca: `@sendgrid/mail`
- Protocolo: API HTTP (porta 443)
- Plano: Free Trial (60 dias)

#### **Problemas Identificados:**

##### **1. Plano Free Trial Limitado**
```
✅ Durante trial: 100 emails/dia
❌ Após trial (60 dias): 0 emails/mês
```
O SendGrid **não possui plano gratuito permanente**. Após o período de teste de 60 dias, é necessário migrar para plano pago.

##### **2. Custos Elevados**
| Plano | Emails/Mês | Custo/Mês |
|-------|------------|-----------|
| Free Trial | 100/dia (60 dias) | R$ 0 |
| **Essentials 50K** | 50.000 | **$19.95** (~R$ 100) |
| Essentials 100K | 100.000 | $34.95 (~R$ 175) |

Para um MVP/startup, **$19.95/mês** (~R$ 1.200/ano) é um custo significativo apenas para envio de e-mails.

##### **3. Problemas de Billing**
Durante os testes, identificamos um **bug crítico**:
```
❌ Erro: Maximum credits exceeded
❌ Billing adicionado, mas API bloqueada
⏳ Delay de 30-60 minutos para liberação
```
Mesmo após adicionar método de pagamento, o sistema demorava até 1 hora para liberar os envios.

##### **4. Complexidade Desnecessária**
- Verificação de Single Sender obrigatória
- Configuração de DNS (para domínios próprios)
- Dashboard complexo com recursos não utilizados

#### **Conclusão:** ❌ Custo-benefício ruim para MVP, insustentável a longo prazo

---

### **✅ Solução 3: Brevo (Solução Definitiva)**

#### **Implementação:**
- Biblioteca: `@getbrevo/brevo`
- Protocolo: API HTTP (porta 443)
- Plano: **Free Forever**

#### **Vantagens Técnicas:**

##### **1. Plano Gratuito Permanente**
```
✅ 300 emails/dia GRÁTIS PARA SEMPRE
✅ 9.000 emails/mês sem custo
✅ Sem limite de tempo
✅ Sem necessidade de cartão de crédito
```

##### **2. Funciona Perfeitamente no Render Free Tier**
- ✅ API HTTP (porta 443 - não bloqueada)
- ✅ Sem necessidade de SMTP
- ✅ Latência baixa (~200-500ms)
- ✅ Taxa de entrega: **99%+**

##### **3. API Simples e Moderna**
```javascript
// Exemplo de envio
const sendSmtpEmail = new brevo.SendSmtpEmail();
sendSmtpEmail.sender = { name: 'VittaCash', email: 'noreply@vittacash.com' };
sendSmtpEmail.to = [{ email: user.email, name: user.name }];
sendSmtpEmail.subject = 'Verificação de E-mail';
sendSmtpEmail.htmlContent = templateHTML;

await apiInstance.sendTransacEmail(sendSmtpEmail);
```

##### **4. Dashboard Completo**
- ✅ Analytics em tempo real
- ✅ Taxa de abertura e cliques
- ✅ Histórico de envios
- ✅ Logs detalhados de erros
- ✅ Testes A/B (planos pagos)

##### **5. Recursos Inclusos no Plano Free**
- ✅ Templates de e-mail
- ✅ API REST completa
- ✅ SMTP relay (se necessário)
- ✅ Webhooks para eventos
- ✅ Editor visual de e-mails

#### **Conclusão:** ✅ **Melhor custo-benefício, confiável e escalável**

---

### **📊 Comparação Final**

| Critério | Gmail SMTP | SendGrid | **Brevo** |
|----------|-----------|----------|-----------|
| **Funciona no Render Free?** | ❌ Não (porta bloqueada) | ✅ Sim | ✅ Sim |
| **Emails Grátis/Mês** | ~15.000 (500/dia) | 0 (após trial) | **9.000 (300/dia)** |
| **Custo Mensal** | R$ 0 | R$ 100+ | **R$ 0** |
| **Plano Permanente?** | ✅ Sim | ❌ Não | ✅ **Sim** |
| **Taxa de Entrega** | ~85% | ~99% | **~99%** |
| **Configuração** | Complexa | Média | **Simples** |
| **Dashboard** | ❌ Não | ✅ Sim | ✅ **Sim** |
| **API Moderna** | ❌ SMTP | ✅ HTTP | ✅ **HTTP** |
| **Suporte** | Comunidade | Ticket | **Ticket + Docs** |

---

### **💰 Economia Anual**

```
SendGrid Essentials: $19.95/mês × 12 = $239.40/ano (~R$ 1.200/ano)
Brevo Free Forever: R$ 0/ano

💰 ECONOMIA: R$ 1.200/ano
```

---

### **🎯 Decisão Final**

**Brevo foi escolhido por:**

1. ✅ **Custo zero permanente** (crítico para MVP/startup)
2. ✅ **Funciona no Render Free Tier** (sem bloqueios)
3. ✅ **300 emails/dia suficientes** para crescimento inicial
4. ✅ **API simples e confiável** (menor complexidade)
5. ✅ **Dashboard completo** (monitoramento em tempo real)
6. ✅ **99%+ de entregabilidade** (mesma do SendGrid)
7. ✅ **Escalável** (planos pagos disponíveis se necessário)

**Resultado:** Sistema de e-mail **confiável, gratuito e escalável** que atende perfeitamente as necessidades do VittaCash sem comprometer qualidade ou gerar custos operacionais.

---

## ✨ Funcionalidades

### 🔐 **Autenticação**
- ✅ Cadastro de usuário com e-mail e senha
- ✅ Login tradicional (e-mail + senha)
- ✅ Login via Google OAuth 2.0
- ✅ Verificação de e-mail por token
- ✅ Reenvio de e-mail de verificação
- ✅ E-mails HTML responsivos via Brevo API
- ✅ Sistema de retry automático (3 tentativas)
- ✅ Proteção de rotas com JWT via SendGrid
- ✅ Sistema de retry automático (3 tentativas)

### 💸 **Gerenciamento de Despesas**
- ✅ Criar despesa
- ✅ Listar todas as despesas do usuário
- ✅ Obter despesa específica por ID
- ✅ Atualizar despesa
- ✅ Excluir despesa
- ✅ Filtros por: mês, ano, categoria
- ✅ Suporte a despesas recorrentes

### 📊 **Relatórios**
- ✅ Relatório mensal por categoria
- ✅ Relatório anual por mês
- ✅ Total geral de despesas
- ✅ Quantidade de despesas por período
- ✅ Agregação de dados


### 🛡️ **Segurança**
- ✅ Senhas hashadas com bcrypt (salt 10)
- ✅ Tokens JWT com expiração
- ✅ Tokens de verificação SHA-256
- ✅ Validação de dados com Joi
- ✅ Proteção CORS configurável
- ✅ Sanitização de inputs

---

## 🏗️ Arquitetura

O projeto segue uma **arquitetura em camadas** com padrões de design consolidados:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Frontend)                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────▼──────────────────────────────────┐
│                    ROUTES (Rotas)                        │
│  • expenseRoutes.js → Rotas de despesas                 │
│  • authRoutes.js → Rotas de autenticação                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 MIDDLEWARE (Camada)                      │
│  • autenticacao.js → Valida JWT                         │
│  • validarDTO.js → Valida dados                         │
│  • tratadorErro.js → Trata exceções                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               CONTROLLERS (Controladores)                │
│  • authController.js → Lógica de autenticação           │
│  • expenseController.js → Lógica de despesas            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   SERVICES (Serviços)                    │
│  • authService.js → Regras de negócio (auth)            │
│  • expenseService.js → Regras de negócio (despesas)     │
│  • emailService.js → Envio de e-mails                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              REPOSITORIES (Repositórios)                 │
│  • UserRepository.js → Acesso a dados (usuários)        │
│  • ExpenseRepository.js → Acesso a dados (despesas)     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   PRISMA ORM                             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              POSTGRESQL (Supabase)                       │
└─────────────────────────────────────────────────────────┘
```

### **Padrões Utilizados**

1. **Repository Pattern** - Abstração de acesso a dados
2. **DTO Pattern** - Validação e transformação de dados
3. **Service Layer** - Lógica de negócio centralizada
4. **Middleware Chain** - Pipeline de processamento de requisições
5. **Error Handling** - Tratamento centralizado de erros

---

## 📂 Estrutura do Projeto

```
vittacash-backend/
│
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   └── migrations/                # Migrações SQL
│       ├── migration_lock.toml
│       ├── 20251106202229_init/
│       └── 20251107030356_add_password_field/
│
├── src/
│   ├── config/
│   │   ├── bancoDados.js          # Configuração Prisma Client
│   │   └── swagger.js             # Configuração Swagger/OpenAPI
│   │
│   ├── controllers/
│   │   ├── authController.js      # Controlador de autenticação
│   │   └── expenseController.js   # Controlador de despesas
│   │
│   ├── dto/
│   │   ├── CadastrarUsuarioDTO.js # DTO para cadastro de usuário
│   │   ├── LoginUsuarioDTO.js     # DTO para login
│   │   ├── CreateExpenseDTO.js    # DTO para criar despesa
│   │   ├── UpdateExpenseDTO.js    # DTO para atualizar despesa
│   │   └── ExpenseResponseDTO.js  # DTO de resposta de despesa
│   │
│   ├── middleware/
│   │   ├── autenticacao.js        # Middleware de autenticação JWT
│   │   ├── validarDTO.js          # Middleware de validação de DTOs
│   │   └── tratadorErro.js        # Middleware de tratamento de erros
│   │
│   ├── repositories/
│   │   ├── UserRepository.js      # Repositório de usuários
│   │   └── ExpenseRepository.js   # Repositório de despesas
│   │
│   ├── routes/
│   │   ├── authRoutes.js          # Rotas de autenticação
│   │   └── expenseRoutes.js       # Rotas de despesas
│   │
│   ├── services/
│   │   ├── authService.js         # Serviço de autenticação
│   │   ├── expenseService.js      # Serviço de despesas
│   │   └── emailService.js        # Serviço de envio de e-mails
│   │
│   ├── utils/
│   │   ├── constantes.js          # Constantes globais
│   │   ├── erros.js               # Classes de erro customizadas
│   │   └── validadores.js         # Funções de validação
│   │
│   └── views/
│       ├── verificacao-sucesso.html  # Template de sucesso
│       └── verificacao-erro.html     # Template de erro
│
├── .env                           # Variáveis de ambiente
├── .gitignore                     # Arquivos ignorados pelo Git
├── package.json                   # Dependências e scripts
├── server.js                      # Arquivo principal do servidor
├── README.md                      # Este arquivo
├── LICENSE                        # Licença MIT
└── CORRECOES_APLICADAS.md         # Documentação de correções
```

---

## 🗄️ Modelos de Dados

### **User (Usuário)**

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String?   // Hash bcrypt (null para OAuth)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  expenses      Expense[]
}
```

**Campos:**
- `id` - Identificador único (CUID)
- `name` - Nome do usuário
- `email` - E-mail único
- `password` - Senha hashada (opcional para OAuth)
- `emailVerified` - Data de verificação do e-mail
- `image` - URL da foto de perfil
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

---

### **Account (Conta OAuth)**

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String  // "google", "github", etc.
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

**Campos:**
- `id` - Identificador único
- `userId` - ID do usuário (FK)
- `provider` - Provedor OAuth (ex: "google")
- `providerAccountId` - ID da conta no provedor
- `access_token` - Token de acesso OAuth
- `refresh_token` - Token de renovação

---

### **Session (Sessão)**

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Campos:**
- `id` - Identificador único
- `sessionToken` - Token único da sessão
- `userId` - ID do usuário (FK)
- `expires` - Data de expiração

---

### **VerificationToken (Token de Verificação)**

```prisma
model VerificationToken {
  identifier String   // E-mail do usuário
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Campos:**
- `identifier` - E-mail do usuário
- `token` - Token SHA-256 único
- `expires` - Data de expiração (24h)

---

### **Expense (Despesa)**

```prisma
model Expense {
  id              String   @id @default(cuid())
  title           String
  amount          Float
  date            DateTime
  category        String
  recurring       Boolean  @default(false)
  recurrenceType  String   @default("NONE")
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([date])
  @@index([category])
}
```

**Campos:**
- `id` - Identificador único (CUID)
- `title` - Descrição da despesa
- `amount` - Valor (Float)
- `date` - Data da despesa
- `category` - Categoria (ex: "Alimentação")
- `recurring` - Se é recorrente (Boolean)
- `recurrenceType` - Tipo: "NONE", "MENSAL", "ANUAL"
- `notes` - Observações opcionais
- `userId` - ID do usuário (FK)
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

**Índices:**
- `userId` - Otimiza consultas por usuário
- `date` - Otimiza filtros por data
- `category` - Otimiza filtros por categoria

---

## 🔌 API Endpoints

### **Base URL**
- **Produção:** `https://vittacash.onrender.com/api`
- **Local:** `http://localhost:4000/api`

### **Documentação Interativa**
- **Swagger UI:** `https://vittacash.onrender.com/api-docs`

---

### 🔐 **Autenticação**

#### **POST /api/auth/cadastrar**
Cria um novo usuário com e-mail e senha.

**Request Body:**
```json
{
  "nome": "Sarah Hernandes",
  "email": "sarah@example.com",
  "senha": "SenhaSegura123!"
}
```

**Response (201 Created):**
```json
{
  "mensagem": "Usuário criado com sucesso! Verifique seu e-mail.",
  "usuario": {
    "id": "clxxx123",
    "nome": "Sarah Hernandes",
    "email": "sarah@example.com"
  }
}
```

---

#### **POST /api/auth/login**
Faz login com e-mail e senha.

**Request Body:**
```json
{
  "email": "sarah@example.com",
  "senha": "SenhaSegura123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "clxxx123",
    "nome": "Sarah Hernandes",
    "email": "sarah@example.com"
  }
}
```

---

#### **POST /api/auth/google**
Login via Google OAuth 2.0.

**Request Body:**
```json
{
  "tokenId": "ya29.a0AfH6SMBx..."
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "clxxx456",
    "nome": "Sarah Hernandes",
    "email": "sarah@gmail.com",
    "imagem": "https://lh3.googleusercontent.com/..."
  }
}
```

---

#### **GET /api/auth/verificar-email**
Verifica e-mail através do token enviado.

**Query Params:**
- `token` (required) - Token de verificação
- `email` (required) - E-mail do usuário

**Response (200 OK):** Redireciona para página de sucesso

---

#### **POST /api/auth/reenviar-verificacao**
Reenvia e-mail de verificação.

**Request Body:**
```json
{
  "email": "sarah@example.com"
}
```

**Response (200 OK):**
```json
{
  "mensagem": "E-mail de verificação reenviado com sucesso!"
}
```

---

### 💸 **Despesas**

> **Nota:** Todas as rotas de despesas requerem autenticação (header `Authorization: Bearer {token}`)

#### **GET /api/expenses**
Lista todas as despesas do usuário autenticado.

**Query Params (opcionais):**
- `month` - Mês (1-12)
- `year` - Ano (ex: 2024)
- `category` - Categoria

**Exemplo:** `GET /api/expenses?month=11&year=2024&category=Alimentação`

**Response (200 OK):**
```json
[
  {
    "id": "clxxx789",
    "descricao": "Supermercado",
    "valor": 150.50,
    "categoria": "Alimentação",
    "data": "2024-11-06",
    "recorrente": false,
    "tipoRecorrencia": "NONE",
    "notas": null,
    "userId": "clxxx123",
    "createdAt": "2024-11-06T10:00:00Z",
    "updatedAt": "2024-11-06T10:00:00Z"
  }
]
```

---

#### **POST /api/expenses**
Cria uma nova despesa.

**Request Body:**
```json
{
  "descricao": "Supermercado",
  "valor": 150.50,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": false,
  "tipoRecorrencia": "NONE",
  "notas": "Compras do mês"
}
```

**Response (201 Created):**
```json
{
  "id": "clxxx789",
  "descricao": "Supermercado",
  "valor": 150.50,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": false,
  "tipoRecorrencia": "NONE",
  "notas": "Compras do mês",
  "userId": "clxxx123",
  "createdAt": "2024-11-06T10:00:00Z",
  "updatedAt": "2024-11-06T10:00:00Z"
}
```

---

#### **GET /api/expenses/:id**
Obtém uma despesa específica.

**Response (200 OK):**
```json
{
  "id": "clxxx789",
  "descricao": "Supermercado",
  "valor": 150.50,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": false,
  "tipoRecorrencia": "NONE",
  "notas": "Compras do mês",
  "userId": "clxxx123",
  "createdAt": "2024-11-06T10:00:00Z",
  "updatedAt": "2024-11-06T10:00:00Z"
}
```

---

#### **PUT /api/expenses/:id**
Atualiza uma despesa existente.

**Request Body (todos campos opcionais):**
```json
{
  "descricao": "Supermercado EDITADO",
  "valor": 200.00,
  "tipoRecorrencia": "MENSAL"
}
```

**Response (200 OK):**
```json
{
  "id": "clxxx789",
  "descricao": "Supermercado EDITADO",
  "valor": 200.00,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": true,
  "tipoRecorrencia": "MENSAL",
  "notas": "Compras do mês",
  "userId": "clxxx123",
  "createdAt": "2024-11-06T10:00:00Z",
  "updatedAt": "2024-11-07T15:30:00Z"
}
```

---

#### **DELETE /api/expenses/:id**
Deleta uma despesa.

**Response (200 OK):**
```json
{
  "message": "Despesa excluída com sucesso"
}
```

---

### 📊 **Relatórios**

#### **GET /api/expenses/report**
Gera relatório mensal ou anual.

**Query Params:**
- `type` (required) - "monthly" ou "yearly"
- `month` (required se type=monthly) - Mês (1-12)
- `year` (required) - Ano (ex: 2024)

**Exemplo Mensal:** `GET /api/expenses/report?type=monthly&month=11&year=2024`

**Response Mensal (200 OK):**
```json
{
  "tipo": "mensal",
  "ano": 2024,
  "mes": 11,
  "totalGeral": 1500.50,
  "totalDespesas": 15,
  "porCategoria": [
    {
      "categoria": "Alimentação",
      "total": 800.00,
      "quantidade": 8
    },
    {
      "categoria": "Transporte",
      "total": 400.00,
      "quantidade": 4
    }
  ]
}
```

**Exemplo Anual:** `GET /api/expenses/report?type=yearly&year=2024`

**Response Anual (200 OK):**
```json
{
  "tipo": "anual",
  "ano": 2024,
  "totalGeral": 18000.00,
  "totalDespesas": 120,
  "porMes": [
    {
      "mes": 1,
      "total": 1500.00,
      "quantidade": 10
    },
    {
      "mes": 2,
      "total": 1600.00,
      "quantidade": 12
    }
  ]
}
```

---


## 🛠️ Instalação

### **Pré-requisitos**
- Node.js v20 ou superior
- PostgreSQL (ou Supabase)
- SendGrid (gratuito - 100 emails/dia)
- Git

### **Passo a Passo**

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/vittacash-backend.git
cd vittacash-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais.

4. **Configure o banco de dados**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. **Inicie o servidor**

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

6. **Acesse a aplicação**
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/api-docs`

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados (Supabase)
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Servidor
PORT=4000
NODE_ENV=production

# JWT
JWT_SECRET="sua_chave_secreta_super_segura_aqui"

# Frontend (CORS)
FRONTEND_URL="http://localhost:3000,https://vittacash.vercel.app"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# E-mail (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="seuemail@gmail.com"
```

### **Descrição das Variáveis**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do banco (Pooler) | `postgresql://...?pgbouncer=true` |
| `DIRECT_URL` | URL direta do banco | `postgresql://.../postgres` |
| `PORT` | Porta do servidor | `4000` |
| `NODE_ENV` | Ambiente | `production` ou `development` |
| `JWT_SECRET` | Chave secreta JWT | String aleatória longa |
| `FRONTEND_URL` | URLs permitidas (CORS) | Separadas por vírgula |
| `GOOGLE_CLIENT_ID` | ID OAuth Google | Do console Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Secret OAuth Google | Do console Google Cloud |
| `SMTP_HOST` | Host SMTP SendGrid | `smtp.sendgrid.net` |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USER` | Usuário SendGrid | `apikey` (fixo) |
| `SMTP_PASS` | API Key SendGrid | Gerada no Dashboard SendGrid |
| `EMAIL_FROM` | E-mail remetente | Single Sender verificado |

### **Como Obter Credenciais**

- **SendGrid API Key:** https://app.sendgrid.com/settings/api_keys
- **SendGrid Single Sender:** https://app.sendgrid.com/settings/sender_auth
- **Google OAuth Credentials:** https://console.cloud.google.com/apis/credentials
- **Supabase Database URLs:** https://supabase.com/dashboard/project/_/settings/database

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento (Nodemon) |
| `npm start` | Inicia servidor em modo produção |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Executa migrações (dev) |
| `npm run prisma:deploy` | Aplica migrações (produção) |
| `npm run prisma:studio` | Abre Prisma Studio (GUI) |

---

## 📚 Documentação Técnica

### **DTOs (Data Transfer Objects)**

#### **CadastrarUsuarioDTO**
**Arquivo:** `src/dto/CadastrarUsuarioDTO.js`

**Campos:**
- `nome` (String, 2-100 chars) - Nome do usuário
- `email` (String, email válido) - E-mail único
- `senha` (String, 6+ chars) - Senha (será hashada)

**Validações:**
- E-mail único no banco
- Senha com mínimo 6 caracteres
- Nome obrigatório

---

#### **LoginUsuarioDTO**
**Arquivo:** `src/dto/LoginUsuarioDTO.js`

**Campos:**
- `email` (String, email válido) - E-mail
- `senha` (String, obrigatório) - Senha

---

#### **CreateExpenseDTO**
**Arquivo:** `src/dto/CreateExpenseDTO.js`

**Campos:**
- `descricao` (String, 3-255 chars) - Descrição da despesa
- `valor` (Number, positivo) - Valor da despesa
- `data` (Date, ISO 8601) - Data da despesa
- `categoria` (String, obrigatório) - Categoria
- `recorrente` (Boolean, default: false) - Se é recorrente
- `recurrenceType` (String, default: "NONE") - Tipo de recorrência
- `notas` (String, opcional) - Observações

**Validações:**
- Valor deve ser positivo
- Descrição mínimo 3 caracteres
- Data válida (ISO 8601)
- Categoria obrigatória

**Mapeamento:**
- `descricao` (PT-BR) → `title` (EN)
- `valor` (PT-BR) → `amount` (EN)
- `tipoRecorrencia` (PT-BR) → `recurrenceType` (EN)

---

#### **UpdateExpenseDTO**
**Arquivo:** `src/dto/UpdateExpenseDTO.js`

**Campos:** Todos opcionais (mesmos de CreateExpenseDTO)

**Validação:** Pelo menos 1 campo deve ser fornecido

---

#### **ExpenseResponseDTO**
**Arquivo:** `src/dto/ExpenseResponseDTO.js`

**Campos:**
- `id` - ID único
- `descricao` - Descrição (mapeado de `title`)
- `valor` - Valor (mapeado de `amount`)
- `categoria` - Categoria
- `data` - Data (ISO 8601)
- `recorrente` - Se é recorrente
- `tipoRecorrencia` - Tipo de recorrência
- `notas` - Observações
- `userId` - ID do usuário
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

**Método estático:**
- `deArray(despesas)` - Converte array de despesas

---

### **Services (Serviços)**

#### **authService.js**
**Arquivo:** `src/services/authService.js`

**Métodos:**

**`cadastrarUsuario(dados)`**
- Valida dados com `CadastrarUsuarioDTO`
- Verifica se e-mail já existe
- Gera hash da senha (bcrypt, salt 10)
- Cria usuário no banco
- Gera token de verificação (SHA-256)
- Envia e-mail de verificação
- Retorna: `{ mensagem, usuario }`

**`fazerLogin(dados)`**
- Valida dados com `LoginUsuarioDTO`
- Busca usuário por e-mail
- Valida senha (bcrypt.compare)
- Verifica se e-mail foi verificado
- Gera token JWT (expira em 7 dias)
- Retorna: `{ token, usuario }`

**`loginComGoogle(tokenId)`**
- Verifica token com Google OAuth Library
- Extrai dados do payload (e-mail, nome, foto)
- Busca ou cria usuário no banco
- Marca e-mail como verificado
- Gera token JWT
- Retorna: `{ token, usuario }`

**`verificarEmail(token, email)`**
- Busca token no banco
- Verifica se não expirou (24h)
- Valida e-mail
- Marca usuário como verificado
- Deleta token usado
- Retorna: `{ mensagem }`

**`reenviarVerificacao(email)`**
- Busca usuário por e-mail
- Verifica se já não foi verificado
- Deleta tokens antigos
- Gera novo token
- Envia e-mail
- Retorna: `{ mensagem }`

---

#### **expenseService.js**
**Arquivo:** `src/services/expenseService.js`

**Métodos:**

**`listarDespesas(idUsuario, filtros)`**
- Filtros: month, year, category
- Busca despesas do usuário
- Retorna array de `ExpenseResponseDTO`

**`criarDespesa(idUsuario, dados)`**
- Valida com `CreateExpenseDTO`
- Mapeia campos PT-BR → EN
- Cria despesa no banco
- Retorna `ExpenseResponseDTO`

**`obterDespesa(id, idUsuario)`**
- Busca despesa por ID
- Verifica se pertence ao usuário
- Lança erro 404 se não encontrar
- Retorna `ExpenseResponseDTO`

**`atualizarDespesa(id, idUsuario, dados)`**
- Valida com `UpdateExpenseDTO`
- Verifica propriedade
- Mapeia campos PT-BR → EN
- Atualiza apenas campos fornecidos
- Retorna `ExpenseResponseDTO`

**`deletarDespesa(id, idUsuario)`**
- Verifica propriedade
- Remove do banco
- Retorna: `{ message }`

**`relatorioMensal(idUsuario, ano, mes)`**
- Filtra despesas por mês/ano
- Agrupa por categoria
- Calcula totais
- Retorna: `{ tipo, ano, mes, totalGeral, totalDespesas, porCategoria[] }`

**`relatorioAnual(idUsuario, ano)`**
- Filtra despesas por ano
- Agrupa por mês
- Calcula totais
- Retorna: `{ tipo, ano, totalGeral, totalDespesas, porMes[] }`


---

#### **emailService.js**
**Arquivo:** `src/services/emailService.js`

**Métodos:**

**`enviarEmailVerificacao(email, token)`**
- Gera link de verificação
- Cria HTML responsivo
- Envia via Nodemailer + SendGrid
- Sistema de retry (3 tentativas com backoff exponencial)
- Fallback: log do link no console (se falhar)

**Configuração SMTP (SendGrid):**
- Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey` (fixo)
- Pass: API Key do SendGrid
- TLS: 1.2+ forçado

**Recursos:**
- ✅ 100 emails/dia grátis
- ✅ 99%+ taxa de entrega
- ✅ Dashboard com analytics
- ✅ Sistema de retry automático
- ✅ Timeout aumentado (60s)

**Template HTML:**
- Design responsivo
- Botão CTA com gradiente
- Link alternativo
- Expiração: 24h
- Brand VittaCash

---

### **Repositories (Repositórios)**

#### **UserRepository.js**
**Arquivo:** `src/repositories/UserRepository.js`

**Métodos:**

**`criar(dados)`**
- Cria usuário no banco
- Retorna usuário criado

**`buscarPorEmail(email)`**
- Busca usuário por e-mail
- Retorna usuário ou null

**`buscarPorId(id)`**
- Busca usuário por ID
- Retorna usuário ou null

**`atualizar(id, dados)`**
- Atualiza usuário
- Retorna usuário atualizado

**`marcarEmailComoVerificado(id)`**
- Define `emailVerified = now()`
- Retorna usuário atualizado

**`criarOuAtualizarPorEmail(dados)`**
- Upsert baseado em e-mail
- Usado para OAuth
- Retorna usuário

---

#### **ExpenseRepository.js**
**Arquivo:** `src/repositories/ExpenseRepository.js`

**Métodos:**

**`criar(dados)`**
- Cria despesa no banco
- Retorna despesa criada

**`buscarTodas({ idUsuario, month, year, category })`**
- Filtra por userId
- Filtros opcionais: mês, ano, categoria
- Ordena por data (DESC)
- Retorna array de despesas

**`buscarPorId(id, idUsuario)`**
- Busca por ID e userId
- Retorna despesa ou null

**`atualizar(id, dados)`**
- Atualiza despesa
- Retorna despesa atualizada

**`deletar(id)`**
- Remove despesa do banco
- Retorna despesa deletada

---

### **Middleware**

#### **autenticacao.js**
**Arquivo:** `src/middleware/autenticacao.js`

**Função:** `verificarAutenticacao`

**Lógica:**
1. Extrai token do header `Authorization: Bearer {token}`
2. Verifica token com JWT
3. Busca usuário no banco
4. Anexa `req.usuario` com dados do usuário
5. Retorna 401 se falhar

---

#### **validarDTO.js**
**Arquivo:** `src/middleware/validarDTO.js`

**Função:** `validarDTO(DTOClass)`

**Lógica:**
1. Instancia DTO com `req.body`
2. Valida com método `validar()`
3. Retorna erros de validação (400)
4. Anexa DTO validado em `req.dto`

---

#### **tratadorErro.js**
**Arquivo:** `src/middleware/tratadorErro.js`

**Função:** `tratadorErro(erro, req, res, next)`

**Lógica:**
1. Detecta tipo de erro
2. Mapeia para status HTTP correto
3. Retorna JSON padronizado
4. Log de erro no console

**Tipos de erro:**
- `ErroValidacao` → 400
- `ErroNaoEncontrado` → 404
- `ErroConflito` → 409
- `ErroNaoAutorizado` → 401
- Outros → 500

---

### **Utils (Utilitários)**

#### **constantes.js**
**Arquivo:** `src/utils/constantes.js`

**Constantes:**

**`CATEGORIAS`** (Array)
- "Alimentação"
- "Transporte"
- "Moradia"
- "Saúde"
- "Educação"
- "Lazer"
- "Banco"
- "Outros"

**`TIPOS_RECORRENCIA`** (Array)
- "NONE"
- "NENHUMA"
- "MENSAL"
- "ANUAL"

**`STATUS_HTTP`** (Object)
- `OK: 200`
- `CRIADO: 201`
- `REQUISICAO_INVALIDA: 400`
- `NAO_AUTORIZADO: 401`
- `PROIBIDO: 403`
- `NAO_ENCONTRADO: 404`
- `CONFLITO: 409`
- `ERRO_INTERNO_SERVIDOR: 500`

**`JWT_EXPIRA_EM`** (String)
- `"7d"` (7 dias)

**`MENSAGENS_ERRO`** (Object)
- `NAO_AUTORIZADO: "Não autenticado"`
- `PROIBIDO: "Sem permissão"`
- `NAO_ENCONTRADO: "Recurso não encontrado"`
- `DADOS_INVALIDOS: "Dados inválidos"`
- `ERRO_INTERNO: "Erro interno do servidor"`

---

#### **erros.js**
**Arquivo:** `src/utils/erros.js`

**Classes:**

**`ErroBase`**
- Classe base para erros customizados
- Herda de `Error`

**`ErroValidacao`**
- Código: 400
- Usado para: dados inválidos

**`ErroNaoAutorizado`**
- Código: 401
- Usado para: não autenticado

**`ErroProibido`**
- Código: 403
- Usado para: sem permissão

**`ErroNaoEncontrado`**
- Código: 404
- Usado para: recurso não encontrado

**`ErroConflito`**
- Código: 409
- Usado para: e-mail duplicado

---

#### **validadores.js**
**Arquivo:** `src/utils/validadores.js`

**Funções:**

**`validarEmail(email)`**
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Retorna: Boolean

**`validarSenha(senha)`**
- Mínimo: 6 caracteres
- Retorna: Boolean

**`sanitizarString(str)`**
- Remove espaços extras
- Trim
- Retorna: String

---

### **Config**

#### **bancoDados.js**
**Arquivo:** `src/config/bancoDados.js`

**Exporta:** Instância do Prisma Client

**Uso:**
```javascript
import prisma from './config/bancoDados.js';
const usuarios = await prisma.user.findMany();
```

---

#### **swagger.js**
**Arquivo:** `src/config/swagger.js`

**Configuração Swagger/OpenAPI:**

**Informações:**
- Título: "VittaCash API"
- Versão: "1.0.0"
- Descrição: "API para gerenciamento de despesas pessoais"

**Servidores:**
- Local: `http://localhost:4000`
- Produção: `https://vittacash.onrender.com`

**Segurança:**
- Bearer Token (JWT)

**Tags:**
- Auth - Autenticação
- Expenses - Despesas

---

## 🚀 Deploy

### **Render.com**

1. **Crie um novo Web Service**
   - Conecte o repositório GitHub
   - Runtime: Node
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`

2. **Configure as variáveis de ambiente**
   - Adicione todas as variáveis do `.env`

3. **Configure o banco de dados**
   - Use Supabase PostgreSQL
   - Adicione `DATABASE_URL` e `DIRECT_URL`

4. **Deploy automático**
   - Cada push na branch `main` dispara deploy

**URL do Deploy:** https://vittacash.onrender.com

---

### **Supabase (Banco de Dados)**

1. **Crie um projeto no Supabase**
2. **Copie as URLs de conexão:**
   - Pooler URL → `DATABASE_URL`
   - Direct URL → `DIRECT_URL`
3. **Execute as migrações:**
```bash
npx prisma migrate deploy
```

---

### **SendGrid (Envio de E-mails)**

O projeto utiliza **SendGrid** para envio de e-mails transacionais (verificação de conta, etc).

#### **Por que SendGrid?**
- ✅ **100 emails/dia grátis** (suficiente para MVP)
- ✅ **99%+ taxa de entrega** (melhor que SMTP direto)
- ✅ **Funciona no Render Free Tier** (porta 587 não bloqueada)
- ✅ **Dashboard com analytics** (rastreamento de e-mails)
- ✅ **API simples** (fácil integração)

#### **Configuração (5 minutos):**

1. **Crie conta no SendGrid**
   - Acesse: https://sendgrid.com/free/
   - Cadastre-se gratuitamente

2. **Gere uma API Key**
   - Dashboard → Settings → API Keys
   - Create API Key → Full Access
   - Nome: `VittaCash-Production`
   - **Copie a chave** (só aparece uma vez!)

3. **Verifique Single Sender**
   - Settings → Sender Authentication
   - Verify a Single Sender
   - Preencha com seu e-mail
   - **Confirme no e-mail recebido**

4. **Configure no Render**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxxx (sua API Key)
   EMAIL_FROM=seuemail@gmail.com (e-mail verificado)
   ```

5. **Monitore no Dashboard**
   - Activity: https://app.sendgrid.com/activity
   - Veja status de entrega, aberturas, etc.

**Documentação completa:** `SOLUCAO-SMTP.md` (na raiz do projeto)

---

## 👩‍💻 Autora

<div align="center">

### **Sarah Hernandes**

Desenvolvedora Full Stack apaixonada por criar soluções elegantes e eficientes.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sarah-hernandes)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sarah-hernandes)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:vihernandesbr@gmail.com)

</div>

---

## 📄 Licença

Este projeto está sob a licença **MIT**.

```
MIT License

Copyright (c) 2024 Sarah Hernandes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Agradecimentos

- **Prisma** - ORM incrível e moderno
- **Express** - Framework web robusto e minimalista
- **Supabase** - Hosting PostgreSQL gratuito e confiável
- **Render** - Deploy simplificado com CI/CD automático
- **Brevo** - Serviço de e-mail transacional excepcional (300 emails/dia grátis PERMANENTE)
- **Google** - OAuth 2.0 e infraestrutura cloud

---

<div align="center">

**Desenvolvido com ❤️ por Sarah Hernandes**

⭐ **Se este projeto foi útil, deixe uma estrela!** ⭐

[⬆ Voltar ao topo](#-vittacash---backend-api)

</div>

