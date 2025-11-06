# 💰 VittaCash Backend API

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**API REST completa para gerenciamento de despesas pessoais**

Sistema backend robusto desenvolvido com Node.js, Express e Prisma ORM, integrado com PostgreSQL (Supabase) e autenticação Google OAuth.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Executando o Projeto](#-executando-o-projeto)
- [Documentação da API](#-documentação-da-api)
- [Detalhamento Técnico](#-detalhamento-técnico)

---

## 🎯 Visão Geral

O **VittaCash Backend** é uma API REST que permite aos usuários:

- ✅ Autenticar-se via Google OAuth
- ✅ Criar, visualizar, editar e excluir despesas
- ✅ Filtrar despesas por categoria, data e período
- ✅ Gerar relatórios mensais e anuais
- ✅ Exportar dados em formato CSV
- ✅ Gerenciar despesas recorrentes

### Principais Características

- **Arquitetura em Camadas**: Separação clara entre Controllers, Services, Repositories e DTOs
- **Validação Robusta**: Validação de dados com Joi
- **Segurança**: Autenticação JWT com tokens seguros
- **Documentação Swagger**: Interface interativa para testar endpoints
- **Banco PostgreSQL**: Usando Supabase com Prisma ORM
- **CORS Configurado**: Pronto para integração com frontend
- **Tratamento de Erros**: Sistema centralizado de gestão de erros

---

## 🚀 Tecnologias

### Core
- **Node.js** v18+ - Runtime JavaScript
- **Express.js** v5.1.0 - Framework web minimalista
- **Prisma ORM** v6.19.0 - ORM moderno para PostgreSQL

### Autenticação & Segurança
- **jsonwebtoken** v9.0.2 - Geração e validação de JWT
- **bcryptjs** v3.0.3 - Criptografia de senhas
- **google-auth-library** v10.5.0 - Autenticação Google OAuth

### Validação & Transformação
- **Joi** v18.0.1 - Validação de schemas
- **class-validator** v0.14.2 - Validação baseada em decorators
- **class-transformer** v0.5.1 - Transformação de objetos

### Documentação
- **swagger-jsdoc** v6.2.8 - Geração de specs OpenAPI
- **swagger-ui-express** v5.0.1 - Interface Swagger UI

### Utilitários
- **dotenv** v17.2.3 - Gerenciamento de variáveis de ambiente
- **cors** v2.8.5 - Habilitação de CORS
- **reflect-metadata** v0.2.2 - Metadata reflection API

### DevTools
- **nodemon** v3.1.10 - Auto-reload durante desenvolvimento
- **@types/express** & **@types/node** - Tipagens TypeScript

---

## 🏗️ Arquitetura

O projeto segue a arquitetura em camadas (Layered Architecture) com separação de responsabilidades:

```
┌─────────────────────────────────────────────┐
│           Cliente (Frontend)                │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│    Camada de Rotas (Routes)                 │
│    - Define endpoints                       │
│    - Documentação Swagger                   │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│    Camada de Middleware                     │
│    - Autenticação JWT                       │
│    - Validação de DTOs                      │
│    - Tratamento de Erros                    │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│    Camada de Controllers                    │
│    - Processa requisições HTTP              │
│    - Chama Services                         │
│    - Retorna respostas HTTP                 │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│    Camada de Services (Lógica de Negócio)  │
│    - Regras de negócio                      │
│    - Validações com DTOs                    │
│    - Orquestração de operações              │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│    Camada de Repositories (Dados)           │
│    - Abstração do Prisma ORM                │
│    - Queries ao banco de dados              │
│    - Operações CRUD                         │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│    Banco de Dados (PostgreSQL/Supabase)     │
└─────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Projeto

```
vittacash-backend/
│
├── prisma/                          # Configuração Prisma ORM
│   ├── schema.prisma                # Schema do banco de dados
│   └── migrations/                  # Histórico de migrations
│       ├── migration_lock.toml      # Lock file de migrations
│       └── 20251106202229_init/     # Migration inicial (06/11/2025)
│           └── migration.sql        # SQL de criação das tabelas
│
├── src/                             # Código fonte
│   ├── config/                      # Configurações
│   │   ├── bancoDados.js            # Cliente Prisma (singleton)
│   │   └── swagger.js               # Configuração Swagger/OpenAPI
│   │
│   ├── controllers/                 # Controladores (HTTP)
│   │   ├── authController.js        # Controller de autenticação
│   │   └── expenseController.js     # Controller de despesas
│   │
│   ├── dto/                         # Data Transfer Objects
│   │   ├── CreateExpenseDTO.js      # DTO para criar despesa
│   │   ├── UpdateExpenseDTO.js      # DTO para atualizar despesa
│   │   └── ExpenseResponseDTO.js    # DTO para resposta de despesa
│   │
│   ├── middleware/                  # Middlewares
│   │   ├── autenticacao.js          # Middleware de autenticação JWT
│   │   ├── tratadorErro.js          # Middleware de tratamento de erros
│   │   └── validarDTO.js            # Middleware de validação de DTOs
│   │
│   ├── repositories/                # Repositórios (Acesso a Dados)
│   │   ├── ExpenseRepository.js     # Repositório de despesas
│   │   └── UserRepository.js        # Repositório de usuários
│   │
│   ├── routes/                      # Definição de rotas
│   │   ├── authRoutes.js            # Rotas de autenticação
│   │   └── expenseRoutes.js         # Rotas de despesas
│   │
│   ├── services/                    # Serviços (Lógica de Negócio)
│   │   ├── authService.js           # Serviço de autenticação
│   │   └── expenseService.js        # Serviço de despesas
│   │
│   └── utils/                       # Utilitários
│       ├── constantes.js            # Constantes da aplicação
│       ├── erros.js                 # Classes de erro customizadas
│       └── validadores.js           # Funções de validação
│
├── .env                             # Variáveis de ambiente
├── .gitignore                       # Arquivos ignorados pelo Git
├── package.json                     # Dependências e scripts
├── server.js                        # Ponto de entrada da aplicação
└── README.md                        # Este arquivo

```

---

## 🗄️ Banco de Dados

### Schema Prisma (`prisma/schema.prisma`)

O banco de dados utiliza **PostgreSQL** hospedado no **Supabase**, com 5 tabelas principais:

#### 1️⃣ **Tabela `users`** - Usuários do Sistema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
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
- `email` - Email único (obrigatório)
- `emailVerified` - Data de verificação do email
- `image` - URL da foto de perfil
- `createdAt` - Data de criação
- `updatedAt` - Data de última atualização

**Relacionamentos:**
- Um usuário pode ter múltiplas contas OAuth (`accounts`)
- Um usuário pode ter múltiplas sessões (`sessions`)
- Um usuário pode ter múltiplas despesas (`expenses`)

---

#### 2️⃣ **Tabela `accounts`** - Contas OAuth (Google, etc)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Campos:**
- `userId` - Referência ao usuário
- `provider` - Provedor OAuth (ex: "google")
- `providerAccountId` - ID da conta no provedor
- `access_token` - Token de acesso OAuth
- `refresh_token` - Token de refresh OAuth

---

#### 3️⃣ **Tabela `sessions`** - Sessões de Usuário

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

#### 4️⃣ **Tabela `verification_tokens`** - Tokens de Verificação

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
}
```

---

#### 5️⃣ **Tabela `expenses`** - Despesas (Tabela Principal)

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
- `id` - Identificador único
- `title` - Título da despesa
- `amount` - Valor da despesa (decimal)
- `date` - Data da despesa
- `category` - Categoria (Alimentação, Transporte, etc.)
- `recurring` - Se é recorrente (boolean)
- `recurrenceType` - Tipo de recorrência (NONE, MONTHLY, YEARLY)
- `notes` - Observações opcionais
- `userId` - Referência ao usuário

**Índices:**
- `userId` - Para buscas rápidas por usuário
- `date` - Para filtros por data
- `category` - Para filtros por categoria

---

### Migration SQL (`prisma/migrations/20251106202229_init/migration.sql`)

A migration inicial criada em **06/11/2025 às 20:22:29** contém:

**Tabelas Criadas:**
1. ✅ `users` - 7 colunas
2. ✅ `accounts` - 12 colunas
3. ✅ `sessions` - 4 colunas
4. ✅ `verification_tokens` - 3 colunas
5. ✅ `expenses` - 11 colunas

**Índices Criados:**
- `users_email_key` - Email único
- `sessions_sessionToken_key` - Token de sessão único
- `expenses_userId_idx` - Índice por usuário
- `expenses_date_idx` - Índice por data
- `expenses_category_idx` - Índice por categoria

**Foreign Keys (Chaves Estrangeiras):**
- `accounts.userId` → `users.id` (CASCADE)
- `sessions.userId` → `users.id` (CASCADE)
- `expenses.userId` → `users.id` (CASCADE)

---

## 📦 Instalação

### Pré-requisitos

- **Node.js** v18.0.0 ou superior
- **npm** v9.0.0 ou superior
- **PostgreSQL** (ou conta Supabase)
- **Conta Google Cloud** (para OAuth)

### Passo a Passo

1️⃣ **Clone o repositório:**

```bash
git clone https://github.com/seu-usuario/vittacash-backend.git
cd vittacash-backend
```

2️⃣ **Instale as dependências:**

```bash
npm install
```

3️⃣ **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto (veja seção [Variáveis de Ambiente](#-variáveis-de-ambiente))

4️⃣ **Execute as migrations do Prisma:**

```bash
npx prisma migrate dev --name init
```

5️⃣ **Gere o Prisma Client:**

```bash
npx prisma generate
```

6️⃣ **(Opcional) Abra o Prisma Studio para visualizar o banco:**

```bash
npx prisma studio
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz com o seguinte conteúdo:

```env
# ========================================
# BANCO DE DADOS (Supabase PostgreSQL)
# ========================================
# Connection pooling (para queries normais - porta 6543)
DATABASE_URL="postgresql://postgres.SEU_PROJETO:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (para migrations - porta 5432)
DIRECT_URL="postgresql://postgres.SEU_PROJETO:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres"

# ========================================
# JWT (Autenticação)
# ========================================
# Gere com: openssl rand -base64 32
JWT_SECRET="sua-chave-secreta-super-segura-aqui"

# ========================================
# GOOGLE OAUTH
# ========================================
# Obtenha em: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# ========================================
# SERVIDOR
# ========================================
PORT=4000
NODE_ENV="development"

# ========================================
# FRONTEND (CORS)
# ========================================
# Desenvolvimento
FRONTEND_URL="http://localhost:3000"

# Produção (descomente quando for deploy)
# FRONTEND_URL="https://vittacash.vercel.app"
```

### Como Obter as Credenciais

**Supabase (PostgreSQL):**
1. Acesse [supabase.com](https://supabase.com)
2. Vá em **Settings** → **Database**
3. Copie a **Connection String** (URI)
4. Substitua `[YOUR-PASSWORD]` pela senha do banco

**Google OAuth:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Vá em **APIs & Services** → **Credentials**
4. Crie credenciais **OAuth 2.0 Client ID**
5. Configure as URLs autorizadas

**JWT Secret:**
```bash
# Gere uma chave segura
openssl rand -base64 32
```

---

## ▶️ Executando o Projeto

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:4000**

### Modo Produção

```bash
npm start
```

### Outros Comandos Úteis

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Abrir Prisma Studio (GUI do banco)
npm run prisma:studio

# Deploy de migrations (produção)
npm run prisma:deploy
```

### Saída Esperada

```
==================================================
🚀 Servidor VittaCash rodando!
📊 Ambiente: development
🌐 URL: http://localhost:4000
📚 Documentação: http://localhost:4000/api-docs
🎯 Frontend: http://localhost:3000
==================================================
```

---

## 📖 Documentação da API

### Swagger UI

Acesse a documentação interativa em: **http://localhost:4000/api-docs**

### Endpoints Principais

#### 🔐 Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/login` | Login com Google OAuth | ❌ |
| `GET` | `/api/auth/me` | Obter dados do usuário autenticado | ✅ |

#### 💰 Despesas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/expenses` | Listar todas as despesas | ✅ |
| `POST` | `/api/expenses` | Criar nova despesa | ✅ |
| `GET` | `/api/expenses/:id` | Obter despesa específica | ✅ |
| `PUT` | `/api/expenses/:id` | Atualizar despesa | ✅ |
| `DELETE` | `/api/expenses/:id` | Deletar despesa | ✅ |
| `GET` | `/api/expenses/report` | Gerar relatório | ✅ |
| `GET` | `/api/expenses/export` | Exportar CSV | ✅ |

#### 🏥 Saúde do Sistema

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/` | Informações da API | ❌ |
| `GET` | `/health` | Status do servidor | ❌ |

---

## 🔍 Detalhamento Técnico

### 📂 Camada de Configuração (`src/config/`)

#### `bancoDados.js` - Cliente Prisma

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
```

**Responsabilidade:**
- Cria uma instância única do Prisma Client (Singleton)
- Gerencia conexão com PostgreSQL
- Exporta para uso em Repositories

---

#### `swagger.js` - Configuração Swagger/OpenAPI

```javascript
export const especificacaoSwagger = swaggerJsdoc(opcoes);
```

**Variáveis:**
- `opcoes` - Objeto de configuração do Swagger
  - `definition` - Especificação OpenAPI 3.0
  - `apis` - Caminhos dos arquivos com JSDoc

**Configurações:**
- **Título:** VittaCash API
- **Versão:** 1.0.0
- **Servidores:** 
  - Desenvolvimento: `http://localhost:4000`
  - Produção: `https://vittacash-api.onrender.com`
- **Segurança:** Bearer Token (JWT)

---

### 🎮 Camada de Controllers (`src/controllers/`)

#### `authController.js` - Controller de Autenticação

**Classe:** `AuthController`

**Métodos:**

##### `login(req, res, next)`
- **Parâmetros de entrada (req.body):**
  - `tokenGoogle` (string) - Token do Google OAuth
- **Retorno:**
  - `token` (string) - JWT gerado
  - `usuario` (object) - Dados do usuário
- **Erros:**
  - 400 - Token não fornecido
  - 500 - Erro ao processar autenticação

##### `obterUsuario(req, res, next)`
- **Headers:**
  - `Authorization: Bearer {token}`
- **Retorno:**
  - Dados completos do usuário autenticado
- **Erros:**
  - 401 - Token inválido ou expirado

---

#### `expenseController.js` - Controller de Despesas

**Classe:** `ExpenseController`

**Métodos:**

##### `listar(req, res, next)`
- **Query Params:**
  - `mes` (number, opcional) - Mês para filtro (1-12)
  - `ano` (number, opcional) - Ano para filtro
  - `de` (date, opcional) - Data inicial (YYYY-MM-DD)
  - `ate` (date, opcional) - Data final (YYYY-MM-DD)
  - `categoria` (string, opcional) - Categoria para filtro
- **Retorno:** Array de despesas do usuário
- **Autenticação:** Requerida (JWT)

##### `criar(req, res, next)`
- **Body:**
  ```json
  {
    "titulo": "Almoço no restaurante",
    "valor": 45.50,
    "data": "2024-01-15",
    "categoria": "Alimentação",
    "recorrente": false,
    "tipoRecorrencia": "NENHUMA",
    "notas": "Pagamento em dinheiro"
  }
  ```
- **Validações:**
  - `titulo`: mínimo 3 caracteres, máximo 255
  - `valor`: número positivo, 2 casas decimais
  - `data`: formato ISO date
  - `categoria`: deve estar em `CATEGORIAS`
- **Retorno:** Despesa criada (201)
- **Erros:** 400 (validação), 500 (servidor)

##### `obter(req, res, next)`
- **Params:**
  - `id` (string) - ID da despesa
- **Retorno:** Despesa encontrada
- **Erros:** 404 (não encontrada), 403 (não pertence ao usuário)

##### `atualizar(req, res, next)`
- **Params:**
  - `id` (string) - ID da despesa
- **Body:** Campos a atualizar (parcial)
- **Retorno:** Despesa atualizada
- **Erros:** 400 (validação), 404 (não encontrada)

##### `deletar(req, res, next)`
- **Params:**
  - `id` (string) - ID da despesa
- **Retorno:** `{ mensagem: "Despesa removida com sucesso" }`
- **Erros:** 404 (não encontrada)

##### `relatorio(req, res, next)`
- **Query Params:**
  - `tipo` (string, obrigatório) - "mensal" ou "anual"
  - `ano` (number, obrigatório) - Ano do relatório
  - `mes` (number, opcional) - Mês (apenas para tipo "mensal")
- **Retorno:**
  ```json
  {
    "tipo": "mensal",
    "ano": 2024,
    "mes": 1,
    "totalGeral": 1250.75,
    "porCategoria": [
      { "categoria": "Alimentação", "total": 450.00, "quantidade": 5 }
    ],
    "totalDespesas": 15
  }
  ```

##### `exportar(req, res, next)`
- **Query Params:**
  - `mes` (number, opcional)
  - `ano` (number, opcional)
- **Retorno:** Arquivo CSV
- **Headers de Resposta:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="despesas-*.csv"`

---

### 🧩 Camada de DTOs (`src/dto/`)

#### `CreateExpenseDTO.js` - DTO de Criação

**Classe:** `CreateExpenseDTO`

**Propriedades:**
- `titulo` (string) - Título da despesa
- `valor` (number) - Valor em reais
- `data` (Date) - Data da despesa
- `categoria` (string) - Categoria
- `recorrente` (boolean) - Se é recorrente
- `tipoRecorrencia` (string) - NENHUMA | MENSAL | ANUAL
- `notas` (string | null) - Observações

**Métodos:**
- `validar()` - Valida dados usando Joi schema
  - Retorna: `{ error, value }`

**Schema Joi (`CriarDespesaDTOSchema`):**
```javascript
Joi.object({
  titulo: Joi.string().min(3).max(255).required(),
  valor: Joi.number().positive().precision(2).required(),
  data: Joi.date().required(),
  categoria: Joi.string().valid(...CATEGORIAS).required(),
  recorrente: Joi.boolean().default(false),
  tipoRecorrencia: Joi.string().valid(...TIPOS_RECORRENCIA).default('NENHUMA'),
  notas: Joi.string().max(1000).allow(null, '').optional()
})
```

---

#### `UpdateExpenseDTO.js` - DTO de Atualização

**Classe:** `UpdateExpenseDTO`

Similar ao `CreateExpenseDTO`, mas com todos os campos opcionais.

---

#### `ExpenseResponseDTO.js` - DTO de Resposta

**Classe:** `ExpenseResponseDTO`

**Responsabilidade:**
- Mapeia campos do banco (inglês) para português
- Formata dados para o frontend

**Mapeamento:**
```javascript
{
  id: despesa.id,
  titulo: despesa.title,           // title → titulo
  valor: despesa.amount,            // amount → valor
  data: despesa.date,
  categoria: despesa.category,
  recorrente: despesa.recurring,    // recurring → recorrente
  tipoRecorrencia: despesa.recurrenceType,
  notas: despesa.notes,
  idUsuario: despesa.userId,
  criadoEm: despesa.createdAt,
  atualizadoEm: despesa.updatedAt,
  usuario: {
    id: despesa.user.id,
    nome: despesa.user.name,
    email: despesa.user.email
  }
}
```

**Método Estático:**
- `deArray(despesas)` - Converte array de despesas

---

### 🛡️ Camada de Middleware (`src/middleware/`)

#### `autenticacao.js` - Middleware de Autenticação JWT

**Função:** `autenticar(req, res, next)`

**Fluxo:**
1. Extrai header `Authorization`
2. Valida formato: `Bearer {token}`
3. Verifica token JWT com `JWT_SECRET`
4. Decodifica payload
5. Injeta `req.idUsuario` para uso nos controllers
6. Chama `next()` se válido

**Variáveis Injetadas:**
- `req.idUsuario` (string) - ID do usuário autenticado

**Erros:**
- 401 - Token não fornecido
- 401 - Token mal formatado
- 401 - Token inválido ou expirado

---

#### `tratadorErro.js` - Middleware de Tratamento de Erros

**Função:** `tratadorErro(erro, req, res, next)`

**Responsabilidade:**
- Captura erros lançados em toda a aplicação
- Formata resposta de erro padronizada
- Loga erros no console (desenvolvimento)

**Tipos de Erro Tratados:**
- `ErroValidacao` (400)
- `ErroNaoAutorizado` (401)
- `ErroProibido` (403)
- `ErroNaoEncontrado` (404)
- `ErroConflito` (409)
- Erros genéricos (500)

**Formato de Resposta:**
```json
{
  "erro": "Mensagem do erro",
  "detalhes": ["lista", "de", "erros"],
  "codigo": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `validarDTO.js` - Middleware de Validação de DTOs

**Função:** `validarDTO(DtoClass)`

**Uso:**
```javascript
roteador.post('/', validarDTO(CreateExpenseDTO), controller.criar);
```

**Fluxo:**
1. Instancia o DTO com `req.body`
2. Chama método `validar()`
3. Se inválido, retorna 400 com detalhes
4. Se válido, chama `next()`

---

### 💼 Camada de Services (`src/services/`)

#### `authService.js` - Serviço de Autenticação

**Classe:** `AuthService`

**Métodos:**

##### `loginGoogle(tokenGoogle)`
- **Parâmetros:**
  - `tokenGoogle` (string) - Token OAuth do Google
- **Fluxo:**
  1. Valida token com Google Auth Library
  2. Extrai email, nome e imagem
  3. Busca usuário no banco por email
  4. Se não existe, cria novo usuário
  5. Gera JWT com payload: `{ idUsuario, email }`
  6. Retorna token e dados do usuário
- **Variáveis:**
  - `usuarioGoogle` - Dados extraídos do Google
  - `usuario` - Usuário do banco
  - `token` - JWT gerado
- **Retorno:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": {
      "id": "cuid...",
      "nome": "João Silva",
      "email": "joao@example.com",
      "imagem": "https://..."
    }
  }
  ```

##### `verificarToken(token)`
- **Parâmetros:**
  - `token` (string) - JWT a verificar
- **Fluxo:**
  1. Decodifica JWT com `jwt.verify()`
  2. Busca usuário no banco pelo ID
  3. Retorna dados do usuário
- **Erros:**
  - 401 - Token inválido/expirado
  - 404 - Usuário não encontrado

---

#### `expenseService.js` - Serviço de Despesas

**Classe:** `ExpenseService`

**Métodos:**

##### `listarDespesas(idUsuario, filtros)`
- **Responsabilidade:** Buscar despesas com filtros
- **Fluxo:**
  1. Chama `expenseRepository.buscarTodas()`
  2. Converte resultados com `ExpenseResponseDTO.deArray()`
- **Filtros Aplicados:**
  - Por usuário (sempre)
  - Por mês/ano
  - Por período (de/ate)
  - Por categoria

##### `criarDespesa(idUsuario, dados)`
- **Validação:** Usa `CreateExpenseDTO`
- **Fluxo:**
  1. Valida dados com DTO
  2. Mapeia campos PT → EN
  3. Adiciona `userId`
  4. Chama repository para criar
  5. Retorna DTO de resposta

##### `obterDespesa(id, idUsuario)`
- **Validação:** Verifica se despesa pertence ao usuário
- **Erro:** `ErroNaoEncontrado` se não existe

##### `atualizarDespesa(id, idUsuario, dados)`
- **Validação:** `UpdateExpenseDTO`
- **Fluxo:**
  1. Verifica existência
  2. Valida dados parciais
  3. Atualiza apenas campos enviados
  4. Retorna despesa atualizada

##### `deletarDespesa(id, idUsuario)`
- **Fluxo:**
  1. Verifica existência e propriedade
  2. Deleta do banco
  3. Retorna mensagem de sucesso

##### `relatorioMensal(idUsuario, ano, mes)`
- **Retorno:**
  ```json
  {
    "tipo": "mensal",
    "ano": 2024,
    "mes": 1,
    "totalGeral": 1250.75,
    "porCategoria": [
      {
        "categoria": "Alimentação",
        "total": 450.00,
        "quantidade": 5
      }
    ],
    "totalDespesas": 15
  }
  ```

##### `relatorioAnual(idUsuario, ano)`
- **Retorno:**
  ```json
  {
    "tipo": "anual",
    "ano": 2024,
    "totalGeral": 15000.00,
    "porMes": [
      { "mes": 1, "total": 1250.00, "quantidade": 15 },
      { "mes": 2, "total": 980.00, "quantidade": 12 }
    ],
    "totalDespesas": 180
  }
  ```

##### `exportarCSV(idUsuario, filtros)`
- **Retorno:** String CSV formatada
- **Formato:**
  ```csv
  ID,Título,Valor,Data,Categoria,Recorrente,Tipo Recorrência,Notas
  "cuid...","Almoço",45.50,2024-01-15,"Alimentação",Não,NENHUMA,""
  ```
- **Encoding:** UTF-8 com BOM (`\uFEFF`)

---

### 🗃️ Camada de Repositories (`src/repositories/`)

#### `ExpenseRepository.js` - Repositório de Despesas

**Classe:** `ExpenseRepository`

**Responsabilidade:**
- Abstração do Prisma ORM
- Todas as queries ao banco relacionadas a despesas

**Métodos:**

##### `buscarTodas(filtros)`
- **Parâmetros:**
  - `idUsuario` (string)
  - `mes` (number, opcional)
  - `ano` (number, opcional)
  - `de` (Date, opcional)
  - `ate` (Date, opcional)
  - `categoria` (string, opcional)
- **Query Prisma:**
  ```javascript
  prisma.expense.findMany({
    where: onde,
    orderBy: { date: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true }
      }
    }
  })
  ```
- **Variáveis:**
  - `onde` - Objeto de filtros Prisma
  - `dataInicio` - Data calculada para filtro mensal
  - `dataFim` - Data calculada para filtro mensal

##### `buscarPorId(id, idUsuario)`
- **Query:**
  ```javascript
  prisma.expense.findFirst({
    where: { id, userId: idUsuario }
  })
  ```

##### `criar(dados)`
- **Query:**
  ```javascript
  prisma.expense.create({
    data: dados,
    include: { user: { select: {...} } }
  })
  ```

##### `atualizar(id, dados)`
- **Query:**
  ```javascript
  prisma.expense.update({
    where: { id },
    data: dados,
    include: { user: { select: {...} } }
  })
  ```

##### `deletar(id)`
- **Query:**
  ```javascript
  prisma.expense.delete({ where: { id } })
  ```

##### `contar(filtros)`
- **Query:**
  ```javascript
  prisma.expense.count({ where: onde })
  ```

---

#### `UserRepository.js` - Repositório de Usuários

**Classe:** `UserRepository`

**Métodos:**

##### `buscarPorEmail(email)`
- Busca usuário único por email

##### `buscarPorId(id)`
- Busca usuário por ID

##### `criar(dados)`
- Cria novo usuário

##### `atualizar(id, dados)`
- Atualiza dados do usuário

---

### 🛠️ Camada de Utilitários (`src/utils/`)

#### `constantes.js` - Constantes da Aplicação

**Exportações:**

##### `CATEGORIAS` (Array)
```javascript
[
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Banco',
  'Outros'
]
```

##### `TIPOS_RECORRENCIA` (Array)
```javascript
['NENHUMA', 'MENSAL', 'ANUAL']
```

##### `STATUS_HTTP` (Object)
```javascript
{
  OK: 200,
  CRIADO: 201,
  REQUISICAO_INVALIDA: 400,
  NAO_AUTORIZADO: 401,
  PROIBIDO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  ERRO_INTERNO_SERVIDOR: 500
}
```

##### `JWT_EXPIRA_EM` (String)
```javascript
'7d' // 7 dias
```

##### `MENSAGENS_ERRO` (Object)
```javascript
{
  NAO_AUTORIZADO: 'Não autenticado',
  PROIBIDO: 'Sem permissão',
  NAO_ENCONTRADO: 'Recurso não encontrado',
  DADOS_INVALIDOS: 'Dados inválidos',
  ERRO_INTERNO: 'Erro interno do servidor'
}
```

---

#### `erros.js` - Classes de Erro Customizadas

**Classes:**

##### `ErroApp` (Classe Base)
```javascript
class ErroApp extends Error {
  constructor(mensagem, codigoStatus = 500) {
    this.codigoStatus = codigoStatus;
    this.ehOperacional = true;
  }
}
```

##### `ErroValidacao` (400)
```javascript
class ErroValidacao extends ErroApp {
  constructor(mensagem, detalhes = []) {
    super(mensagem, 400);
    this.detalhes = detalhes;
  }
}
```

##### `ErroNaoAutorizado` (401)
```javascript
class ErroNaoAutorizado extends ErroApp {
  constructor(mensagem = 'Não autenticado') {
    super(mensagem, 401);
  }
}
```

##### `ErroProibido` (403)
##### `ErroNaoEncontrado` (404)
##### `ErroConflito` (409)

**Uso:**
```javascript
throw new ErroNaoEncontrado('Despesa não encontrada');
throw new ErroValidacao('Dados inválidos', ['Título obrigatório']);
```

---

#### `validadores.js` - Funções de Validação

**Funções:**

##### `validarEmail(email)`
- Valida formato de email
- Retorna: `boolean`

##### `validarData(data)`
- Valida se é data válida
- Retorna: `boolean`

##### `validarCategoria(categoria)`
- Valida se categoria está em `CATEGORIAS`
- Retorna: `boolean`

---

### 🚦 Camada de Rotas (`src/routes/`)

#### `authRoutes.js` - Rotas de Autenticação

**Base Path:** `/api/auth`

**Rotas:**

```javascript
POST   /api/auth/login     → authController.login       [Público]
GET    /api/auth/me        → authController.obterUsuario [JWT]
```

**Documentação Swagger:**
- ✅ JSDoc completo para cada rota
- ✅ Schemas de request/response
- ✅ Exemplos de uso
- ✅ Códigos de erro possíveis

---

#### `expenseRoutes.js` - Rotas de Despesas

**Base Path:** `/api/expenses`

**Middleware Global:**
```javascript
roteador.use(autenticar); // Todas as rotas requerem JWT
```

**Rotas:**

```javascript
GET    /api/expenses          → expenseController.listar
POST   /api/expenses          → expenseController.criar
GET    /api/expenses/report   → expenseController.relatorio
GET    /api/expenses/export   → expenseController.exportar
GET    /api/expenses/:id      → expenseController.obter
PUT    /api/expenses/:id      → expenseController.atualizar
DELETE /api/expenses/:id      → expenseController.deletar
```

**Importante:** 
- Rotas `/report` e `/export` DEVEM vir antes de `/:id`
- Todas requerem autenticação JWT

---

### 📄 Arquivo Principal (`server.js`)

**Responsabilidade:**
- Inicializa aplicação Express
- Configura middlewares globais
- Registra rotas
- Inicia servidor HTTP

**Middlewares:**
1. `cors()` - Habilitação de CORS
2. `express.json()` - Parse de JSON
3. `express.urlencoded()` - Parse de URL encoded
4. Logger de requisições (desenvolvimento)
5. Swagger UI em `/api-docs`
6. Rotas da API
7. `tratadorErro` - Tratamento de erros

**Rotas Base:**
```javascript
GET  /              → Informações da API
GET  /health        → Status do servidor
     /api-docs      → Swagger UI
     /api/auth      → authRoutes
     /api/expenses  → expenseRoutes
```

**Variáveis de Ambiente Usadas:**
- `PORT` - Porta do servidor (padrão: 4000)
- `NODE_ENV` - Ambiente (development/production)
- `FRONTEND_URL` - URL do frontend para CORS

**Início do Servidor:**
```javascript
app.listen(PORTA, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Servidor VittaCash rodando!`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORTA}`);
  console.log(`📚 Documentação: http://localhost:${PORTA}/api-docs`);
  console.log(`🎯 Frontend: ${process.env.FRONTEND_URL}`);
  console.log('='.repeat(50));
});
```

---

## 🔒 Segurança

### Autenticação JWT

- **Algoritmo:** HS256 (HMAC SHA-256)
- **Expiração:** 7 dias
- **Payload:**
  ```json
  {
    "idUsuario": "cuid...",
    "email": "usuario@example.com",
    "iat": 1234567890,
    "exp": 1234999999
  }
  ```

### Validação de Dados

- ✅ Joi para validação de schemas
- ✅ DTOs para garantir tipos corretos
- ✅ Sanitização de inputs

### Proteção contra Ataques

- ✅ CORS configurado
- ✅ Rate limiting (recomendado adicionar)
- ✅ Helmet.js (recomendado adicionar)
- ✅ SQL Injection (protegido via Prisma)
- ✅ XSS (sanitização de inputs)

---

## 📊 Fluxo de Requisição Completo

### Exemplo: Criar Despesa

```
1. Cliente Frontend
   ↓
   POST /api/expenses
   Headers: { Authorization: "Bearer eyJ..." }
   Body: { titulo, valor, data, categoria, ... }

2. Express Server (server.js)
   ↓
   Middleware CORS → Permite origem
   Middleware JSON Parser → Parseia body

3. Roteador (expenseRoutes.js)
   ↓
   Middleware autenticar() → Valida JWT, injeta req.idUsuario

4. Controller (expenseController.js)
   ↓
   Método criar(req, res, next)
   - Extrai dados do req.body
   - Chama expenseService.criarDespesa()

5. Service (expenseService.js)
   ↓
   Método criarDespesa(idUsuario, dados)
   - Instancia CreateExpenseDTO(dados)
   - Valida com dto.validar()
   - Se inválido → throw ErroValidacao
   - Mapeia campos PT → EN
   - Chama expenseRepository.criar()

6. Repository (ExpenseRepository.js)
   ↓
   Método criar(dados)
   - Executa prisma.expense.create()
   - Retorna despesa criada

7. Service (expenseService.js)
   ↓
   - Converte com ExpenseResponseDTO
   - Retorna para controller

8. Controller (expenseController.js)
   ↓
   - res.status(201).json(despesa)

9. Cliente Frontend
   ↓
   Recebe resposta:
   {
     "id": "cuid...",
     "titulo": "Almoço",
     "valor": 45.50,
     "data": "2024-01-15T00:00:00.000Z",
     "categoria": "Alimentação",
     ...
   }
```

---

## 🧪 Testes (Recomendado Adicionar)

### Ferramentas Sugeridas

```bash
npm install --save-dev jest supertest
```

### Estrutura de Testes

```
tests/
├── unit/
│   ├── services/
│   ├── repositories/
│   └── utils/
└── integration/
    ├── auth.test.js
    └── expenses.test.js
```

---

## 🚀 Deploy

### Sugestões de Plataformas

1. **Render.com** (Recomendado)
   - Auto-deploy do GitHub
   - PostgreSQL integrado
   - Plano gratuito disponível

2. **Railway.app**
   - Deploy simples
   - Suporte a variáveis de ambiente

3. **Heroku**
   - Clássico e confiável
   - Add-ons para PostgreSQL

### Variáveis de Ambiente (Produção)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://vittacash.vercel.app
```

---

## 📝 Licença

Este projeto está sob a licença **MIT**.

---

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📞 Contato

**Email:** contato@vittacash.com  
**GitHub:** [vittacash](https://github.com/vittacash)

---

## 🙏 Agradecimentos

- **Prisma Team** - ORM incrível
- **Express.js Community** - Framework robusto
- **Supabase** - Banco de dados como serviço

---

**Desenvolvido com ❤️ para VittaCash**

*Última atualização: 06/11/2025*

