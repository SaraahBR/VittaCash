# 💰 VittaCash Backend API

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**API REST completa para gerenciamento inteligente de despesas pessoais**

🌐 **Deploy:** https://vittacash.onrender.com  
📚 **Documentação Swagger:** https://vittacash.onrender.com/api-docs/  
🔗 **Repositório:** https://github.com/SaraahBR/VittaCash

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Rotas da API](#-rotas-da-api)
- [Autenticação](#-autenticação)
- [Verificação de E-mail](#-verificação-de-e-mail)
- [Testes](#-testes)
- [Deploy](#-deploy)

---

## 🎯 Visão Geral

O **VittaCash Backend** é uma API REST completa desenvolvida com **Node.js**, **Express** e **Prisma ORM**, integrada com **PostgreSQL** (Supabase). Oferece dois métodos de autenticação: **tradicional** (e-mail/senha) com verificação de e-mail e **Google OAuth**.

### Principais Características

✅ **Autenticação Dual** - Login tradicional + Google OAuth  
✅ **Verificação de E-mail** - Sistema completo com tokens e envio de e-mails HTML  
✅ **CRUD Completo** - Gerenciamento total de despesas  
✅ **Relatórios Inteligentes** - Análises mensais e anuais por categoria  
✅ **Import/Export CSV** - Importação e exportação de dados  
✅ **Arquitetura em Camadas** - Controller → Service → Repository  
✅ **Validação Robusta** - Joi + DTOs personalizados  
✅ **Documentação Swagger** - API totalmente documentada  
✅ **CORS Configurado** - Pronto para integração frontend  
✅ **Tratamento de Erros** - Sistema centralizado  
✅ **Segurança** - JWT, bcrypt, proteção de rotas

---

## 🚀 Funcionalidades

### 🔐 Autenticação
- **Cadastro Tradicional** com e-mail e senha
- **Login Tradicional** com validação de senha criptografada
- **Login Google OAuth** com integração oficial
- **Verificação de E-mail** via token (24h de validade)
- **Reenvio de E-mail** de verificação
- **JWT Tokens** com expiração de 7 dias

### 💰 Gerenciamento de Despesas
- **Criar** despesas com validação completa
- **Listar** com filtros avançados (mês, ano, categoria)
- **Visualizar** despesa individual por ID
- **Editar** despesas existentes
- **Excluir** despesas
- **Marcar como recorrente**

### 📊 Relatórios & Análises
- **Relatório Mensal** - Total por categoria
- **Relatório Anual** - Total por mês
- **Agregações** - Quantidade e valor total
- **Filtros Combinados** - Período + categoria

### 📁 Import/Export
- **Exportar CSV** - Download de dados filtrados
- **Importar CSV** - Upload em lote com validação
- **Tratamento de Erros** - Retorna erros linha por linha

### 📧 Sistema de E-mails
- **Templates HTML Responsivos** - Design profissional
- **E-mail de Verificação** - Para cadastro tradicional
- **E-mail de Boas-Vindas** - Para login Google OAuth
- **SMTP Configurável** - Gmail, SendGrid, etc.

---

## 🛠️ Tecnologias

### Core
- **Node.js** v18+ - Runtime JavaScript
- **Express.js** v5.1.0 - Framework web
- **Prisma ORM** v6.19.0 - ORM para PostgreSQL

### Banco de Dados
- **PostgreSQL** 15+ - Banco relacional
- **Supabase** - Plataforma de banco de dados

### Autenticação & Segurança
- **jsonwebtoken** v9.0.2 - JWT tokens
- **bcryptjs** v3.0.3 - Hash de senhas
- **google-auth-library** v10.5.0 - Google OAuth

### E-mail
- **nodemailer** v6.9.7 - Envio de e-mails

### Validação
- **Joi** v18.0.1 - Validação de schemas
- **class-validator** v0.14.2 - Validação com decorators

### Upload
- **Multer** v2.0.2 - Upload de arquivos multipart

### Documentação
- **swagger-ui-express** v5.0.1 - Interface Swagger
- **swagger-jsdoc** v6.2.8 - Specs OpenAPI

### Utilitários
- **cors** v2.8.5 - CORS
- **dotenv** v17.2.3 - Variáveis de ambiente

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│     Cliente     │ (Frontend React/Next.js)
└────────┬────────┘
         │ HTTP/JSON
┌────────▼────────┐
│     Routes      │ (Definição de endpoints + Swagger)
└────────┬────────┘
         │
┌────────▼────────┐
│   Middleware    │ (Autenticação, Validação, CORS)
└────────┬────────┘
         │
┌────────▼────────┐
│   Controllers   │ (Recebe requests, chama services)
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │ (Lógica de negócio, validação DTOs)
└────────┬────────┘
         │
┌────────▼────────┐
│  Repositories   │ (Acesso ao banco via Prisma)
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │ (PostgreSQL - Supabase)
└─────────────────┘
```

---

## 📁 Estrutura do Projeto

```
vittacash/
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   └── migrations/                # Histórico de migrações
│       ├── 20251106202229_init/
│       └── 20251107030356_add_password_field/
├── src/
│   ├── config/
│   │   ├── bancoDados.js          # Configuração Prisma Client
│   │   └── swagger.js             # Configuração Swagger UI
│   ├── controllers/
│   │   ├── authController.js      # Controller de autenticação
│   │   └── expenseController.js   # Controller de despesas
│   ├── dto/
│   │   ├── CadastrarUsuarioDTO.js # DTO cadastro de usuário
│   │   ├── LoginUsuarioDTO.js     # DTO login
│   │   ├── CreateExpenseDTO.js    # DTO criar despesa
│   │   ├── UpdateExpenseDTO.js    # DTO atualizar despesa
│   │   └── ExpenseResponseDTO.js  # DTO resposta despesa
│   ├── middleware/
│   │   ├── autenticacao.js        # Middleware JWT
│   │   ├── tratadorErro.js        # Tratamento de erros
│   │   └── validarDTO.js          # Validação de DTOs
│   ├── repositories/
│   │   ├── ExpenseRepository.js   # Repository de despesas
│   │   └── UserRepository.js      # Repository de usuários
│   ├── routes/
│   │   ├── authRoutes.js          # Rotas de autenticação
│   │   └── expenseRoutes.js       # Rotas de despesas
│   ├── services/
│   │   ├── authService.js         # Service de autenticação
│   │   ├── emailService.js        # Service de e-mails
│   │   └── expenseService.js      # Service de despesas
│   ├── utils/
│   │   ├── constantes.js          # Constantes do sistema
│   │   ├── erros.js               # Classes de erro
│   │   └── validadores.js         # Funções de validação
│   └── views/                     # (Removido - frontend gerencia)
├── .env                           # Variáveis de ambiente
├── .gitignore
├── package.json
├── server.js                      # Ponto de entrada
└── README.md                      # Este arquivo
```

---

## 🗄️ Banco de Dados

### Schema Prisma

```prisma
// Usuário
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
  
  @@map("users")
}

// Despesa
model Expense {
  id              String   @id @default(cuid())
  title           String   // Título/Descrição
  amount          Float    // Valor
  date            DateTime // Data da despesa
  category        String   // Categoria
  recurring       Boolean  @default(false)
  recurrenceType  String   @default("NONE")
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  userId          String
  user            User     @relation(...)
  
  @@index([userId, date, category])
  @@map("expenses")
}

// Token de Verificação
model VerificationToken {
  identifier String   // E-mail
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### Migrações Aplicadas

1. **`20251106202229_init`** - Criação inicial (users, accounts, sessions, expenses, verification_tokens)
2. **`20251107030356_add_password_field`** - Adição do campo `password` na tabela users

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+ ou Supabase
- Conta Gmail (para SMTP) ou SendGrid

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/SaraahBR/VittaCash.git
cd vittacash

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Execute as migrações do banco
npx prisma migrate dev

# 5. Gere o Prisma Client
npx prisma generate

# 6. Inicie o servidor
npm start
```

O servidor estará em `http://localhost:4000` e redirecionará automaticamente para `/api-docs`.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# Database (Supabase PostgreSQL)
# Connection pooling (queries normais)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"

# Direct connection (migrations)
DIRECT_URL="postgresql://user:pass@host:5432/db"

# JWT Secret (gere com: openssl rand -base64 32)
JWT_SECRET="sua-chave-secreta-de-32-caracteres"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# SMTP Email (Gmail)
# Obtenha senha de app em: https://myaccount.google.com/apppasswords
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"

# Frontend URL (CORS e links de e-mail)
FRONTEND_URL="http://localhost:3000"

# Servidor
PORT=4000
NODE_ENV="development"
```

### Obter Credenciais

#### Google OAuth:
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie um projeto
3. Configure OAuth consent screen
4. Crie credenciais OAuth 2.0
5. Copie Client ID e Client Secret

#### Gmail SMTP:
1. Acesse: https://myaccount.google.com/apppasswords
2. Gere uma senha de app
3. Use a senha de 16 dígitos no `.env`

#### Supabase Database:
1. Acesse: https://supabase.com
2. Crie um projeto
3. Vá em Settings → Database
4. Copie Connection String (URI) para `DATABASE_URL`
5. Copie Direct connection para `DIRECT_URL`

---

## 🌐 Rotas da API

### 🔐 Autenticação (`/api/auth`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/cadastrar` | Cadastro tradicional | ❌ |
| POST | `/api/auth/login` | Login tradicional | ❌ |
| POST | `/api/auth/login/google` | Login Google OAuth | ❌ |
| GET | `/api/auth/verificar-email` | Verificar e-mail | ❌ |
| POST | `/api/auth/reenviar-verificacao` | Reenviar e-mail | ❌ |
| GET | `/api/auth/me` | Dados do usuário logado | ✅ |

### 💰 Despesas (`/api/expenses`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/expenses` | Listar despesas | ✅ |
| POST | `/api/expenses` | Criar despesa | ✅ |
| GET | `/api/expenses/:id` | Obter despesa | ✅ |
| PUT | `/api/expenses/:id` | Atualizar despesa | ✅ |
| DELETE | `/api/expenses/:id` | Excluir despesa | ✅ |
| GET | `/api/expenses/report` | Relatórios | ✅ |
| GET | `/api/expenses/export` | Exportar CSV | ✅ |
| POST | `/api/expenses/import` | Importar CSV | ✅ |

### Exemplos de Uso

#### 1. Cadastrar Usuário
```bash
POST /api/auth/cadastrar
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha123",
  "confirmarSenha": "senha123"
}

# Resposta 201:
{
  "mensagem": "Cadastro realizado com sucesso! Verifique seu e-mail...",
  "usuario": {
    "id": "clxxx",
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

#### 2. Login Tradicional
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "senha123"
}

# Resposta 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "clxxx",
    "nome": "João Silva",
    "email": "joao@email.com",
    "emailVerificado": "2025-11-07T03:00:00.000Z"
  }
}
```

#### 3. Criar Despesa
```bash
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "descricao": "Supermercado",
  "valor": 250.50,
  "categoria": "Alimentação",
  "data": "2025-11-07",
  "recorrente": false
}

# Resposta 201:
{
  "id": "clyyy",
  "descricao": "Supermercado",
  "valor": 250.50,
  "categoria": "Alimentação",
  "data": "2025-11-07",
  "recorrente": false,
  "userId": "clxxx",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### 4. Listar Despesas com Filtros
```bash
GET /api/expenses?month=11&year=2025&category=Alimentação
Authorization: Bearer <token>

# Resposta 200:
[
  {
    "id": "clyyy",
    "descricao": "Supermercado",
    "valor": 250.50,
    "categoria": "Alimentação",
    "data": "2025-11-07",
    ...
  }
]
```

#### 5. Relatório Mensal
```bash
GET /api/expenses/report?type=monthly&month=11&year=2025
Authorization: Bearer <token>

# Resposta 200:
{
  "tipo": "mensal",
  "ano": 2025,
  "mes": 11,
  "totalGeral": 1500.50,
  "totalDespesas": 15,
  "porCategoria": [
    {
      "categoria": "Alimentação",
      "total": 800.00,
      "quantidade": 8
    },
    ...
  ]
}
```

#### 6. Exportar CSV
```bash
GET /api/expenses/export?month=11&year=2025
Authorization: Bearer <token>

# Resposta: Arquivo CSV
Content-Type: text/csv
Content-Disposition: attachment; filename="despesas-2025-11.csv"

descricao,valor,categoria,data,recorrente
Supermercado,250.50,Alimentação,2025-11-07,false
...
```

---

## 🔐 Autenticação

### Fluxo de Cadastro Tradicional

```
1. Usuário preenche formulário de cadastro
2. Backend valida dados (Joi)
3. Verifica se e-mail já existe
4. Cria hash da senha (bcrypt - 10 rounds)
5. Cria usuário no banco (emailVerified = null)
6. Gera token de verificação (32 bytes, expira em 24h)
7. Envia e-mail HTML com link de verificação
8. Retorna sucesso
```

### Fluxo de Login Tradicional

```
1. Usuário envia e-mail e senha
2. Backend busca usuário por e-mail
3. Verifica se tem senha (não é OAuth)
4. Compara senha com bcrypt
5. Verifica se e-mail foi confirmado
6. Gera token JWT (válido por 7 dias)
7. Retorna token + dados do usuário
```

### Fluxo Google OAuth

```
1. Frontend obtém ID Token do Google
2. Envia para backend
3. Backend verifica token com google-auth-library
4. Extrai dados (email, name, picture)
5. Busca ou cria usuário
6. Se novo: envia e-mail de boas-vindas
7. Gera token JWT
8. Retorna token + dados
```

### Proteção de Rotas

Todas as rotas de despesas (`/api/expenses/*`) exigem autenticação:

```javascript
// Middleware em todas as rotas
autenticar: (req, res, next) => {
  // 1. Extrai token do header Authorization
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. Verifica validade do token
  const decodificado = jwt.verify(token, process.env.JWT_SECRET);
  
  // 3. Injeta userId no request
  req.idUsuario = decodificado.idUsuario;
  
  // 4. Continua para o controller
  next();
}
```

---

## 📧 Verificação de E-mail

### Templates HTML

#### E-mail de Verificação (Cadastro)
- Design responsivo com gradiente roxo
- Botão CTA destacado
- Link alternativo em texto
- Aviso de expiração (24h)
- Footer profissional

#### E-mail de Boas-Vindas (Google OAuth)
- Confirmação de conta criada
- Lista de funcionalidades
- Botão de acesso à plataforma

### Fluxo Completo

```
1. Usuário cadastra conta tradicional
2. Backend envia e-mail com link:
   http://localhost:3000/auth/verificar-email?token=xxx&email=xxx

3. Usuário clica no link
4. Frontend abre página /auth/verificar-email
5. Frontend chama API do backend:
   GET /api/auth/verificar-email?token=xxx&email=xxx

6. Backend:
   - Valida token (existe? expirou?)
   - Atualiza emailVerified = NOW()
   - Deleta token usado
   - Gera JWT token
   - Retorna: { mensagem, token, usuario }

7. Frontend:
   - Salva token JWT no localStorage
   - Mostra mensagem de sucesso
   - Redireciona para dashboard
```

### Reenvio de E-mail

```bash
POST /api/auth/reenviar-verificacao
Content-Type: application/json

{
  "email": "joao@email.com"
}

# Resposta 200:
{
  "mensagem": "E-mail de verificação reenviado com sucesso"
}
```

---

## 🧪 Testes

### Testar no Swagger

1. Acesse: http://localhost:4000/api-docs
2. Teste cada endpoint interativamente
3. Copie o token JWT gerado
4. Clique em **Authorize** no topo
5. Cole: `Bearer <seu_token>`
6. Todos os endpoints protegidos ficam desbloqueados

### Testar Cadastro + Verificação

```bash
# 1. Cadastrar
POST /api/auth/cadastrar
{
  "nome": "Teste",
  "email": "seu-email@gmail.com",
  "senha": "senha123",
  "confirmarSenha": "senha123"
}

# 2. Verificar console do servidor
# Verá o link de verificação gerado

# 3. Copiar token do link e testar API
GET /api/auth/verificar-email?token=<token>&email=seu-email@gmail.com

# 4. Fazer login
POST /api/auth/login
{
  "email": "seu-email@gmail.com",
  "senha": "senha123"
}

# 5. Usar token JWT retornado para acessar despesas
GET /api/expenses
Authorization: Bearer <token_jwt>
```

---

## 🚀 Deploy

### Deploy no Render

1. **Criar Conta**: https://render.com
2. **Novo Web Service**: Conectar repositório GitHub
3. **Configurações**:
   - Name: `vittacash`
   - Region: `São Paulo (South America)`
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`

4. **Variáveis de Ambiente no Render**:
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FRONTEND_URL=https://vittacash.vercel.app
PORT=4000
NODE_ENV=production
```

5. **Deploy**: Push para `main` → Deploy automático

### Verificar Deploy

- **API**: https://vittacash.onrender.com
- **Swagger**: https://vittacash.onrender.com/api-docs
- **Health**: https://vittacash.onrender.com/health

---

## 🐛 Troubleshooting

### CORS Error
**Problema:** Frontend não consegue acessar API  
**Solução:** Verificar `FRONTEND_URL` no `.env`

### 401 Unauthorized
**Problema:** Rotas retornam não autorizado  
**Solução:** Verificar se token JWT está no header `Authorization: Bearer <token>`

### E-mail não enviado
**Problema:** Erro ao enviar e-mail  
**Solução:** 
- Verificar `SMTP_USER` e `SMTP_PASS`
- Usar senha de app do Gmail (não a senha normal)
- Verificar logs do servidor

### Prisma não conecta
**Problema:** Erro de conexão com banco  
**Solução:** Verificar `DATABASE_URL` e `DIRECT_URL` no `.env`

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start

# Gerar Prisma Client
npm run prisma:generate

# Criar nova migração
npm run prisma:migrate

# Abrir Prisma Studio (GUI do banco)
npm run prisma:studio

# Aplicar migrações em produção
npm run prisma:deploy
```

---

## 📊 Status do Projeto

### ✅ Implementado

- [x] Autenticação tradicional (e-mail/senha)
- [x] Autenticação Google OAuth
- [x] Verificação de e-mail com tokens
- [x] Envio de e-mails HTML
- [x] CRUD completo de despesas
- [x] Filtros avançados (mês, ano, categoria)
- [x] Relatórios mensais e anuais
- [x] Export CSV
- [x] Import CSV com validação
- [x] Documentação Swagger completa
- [x] Tratamento de erros centralizado
- [x] CORS configurado
- [x] Deploy no Render

### 🔄 Em Desenvolvimento

- [ ] Recuperação de senha
- [ ] Autenticação de dois fatores (2FA)
- [ ] Notificações push
- [ ] Relatórios em PDF
- [ ] Integração com Open Banking

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: Adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👩‍💻 Desenvolvedor

**Sarah Hernandes**  
📧 Email: vihernandesbr@gmail.com  
🔗 GitHub: [@SaraahBR](https://github.com/SaraahBR)

---

## 🙏 Agradecimentos

- **Supabase** - Hospedagem do banco de dados
- **Render** - Deploy gratuito do backend
- **Google** - OAuth e APIs
- **Prisma** - ORM incrível
- **Node.js Community** - Ferramentas e bibliotecas

---

Desenvolvido por Sarah Hernandes

