# 📋 Backend - Especificação Completa

**Backend:** https://vittacash.onrender.com
**Swagger:** https://vittacash.onrender.com/api-docs/

---

## ✅ O que o Backend DEVE ter

### **1. Configuração CORS**

**Variável de Ambiente no Render:**
```
FRONTEND_URL = http://localhost:3000
```

**Para produção (depois do deploy Vercel):**
```
FRONTEND_URL = https://vittacash.vercel.app
```

**CORS configurado:**
- Origin: valor de `FRONTEND_URL`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: true (cookies/sessões)

---

## 📍 Rotas Obrigatórias

### **1. GET /api/expenses**
**Descrição:** Listar todas as despesas do usuário autenticado

**Query Parameters (todos opcionais):**
- `month` (número 1-12): Filtrar por mês
- `year` (número): Filtrar por ano
- `category` (string): Filtrar por categoria

**Exemplo:** `GET /api/expenses?month=11&year=2024&category=Alimentação`

**Resposta 200 OK:**
```json
[
  {
    "id": "clxxx123",
    "descricao": "Supermercado",
    "valor": 150.50,
    "categoria": "Alimentação",
    "data": "2024-11-06",
    "recorrente": false,
    "userId": "user123",
    "createdAt": "2024-11-06T10:00:00Z",
    "updatedAt": "2024-11-06T10:00:00Z"
  }
]
```

---

### **2. POST /api/expenses**
**Descrição:** Criar nova despesa

**Request Body:**
```json
{
  "descricao": "Supermercado",
  "valor": 150.50,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": false
}
```

**Validações:**
- `descricao`: obrigatório, string, min 3 caracteres
- `valor`: obrigatório, número > 0
- `categoria`: obrigatório, string
- `data`: obrigatório, formato ISO (YYYY-MM-DD)
- `recorrente`: opcional, boolean (default: false)

**Resposta 201 Created:**
```json
{
  "id": "clxxx123",
  "descricao": "Supermercado",
  "valor": 150.50,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": false,
  "userId": "user123",
  "createdAt": "2024-11-06T10:00:00Z",
  "updatedAt": "2024-11-06T10:00:00Z"
}
```

---

### **3. GET /api/expenses/:id**
**Descrição:** Obter uma despesa específica por ID

**Exemplo:** `GET /api/expenses/clxxx123`

**Resposta 200 OK:**
```json
{
  "id": "clxxx123",
  "descricao": "Supermercado",
  "valor": 150.50,
  "categoria": "Alimentação",
  "data": "2024-11-06",
  "recorrente": false,
  "userId": "user123",
  "createdAt": "2024-11-06T10:00:00Z",
  "updatedAt": "2024-11-06T10:00:00Z"
}
```

**Resposta 404 Not Found:**
```json
{
  "error": "Despesa não encontrada"
}
```

---

### **4. PUT /api/expenses/:id**
**Descrição:** Atualizar uma despesa existente

**Exemplo:** `PUT /api/expenses/clxxx123`

**Request Body (todos campos opcionais):**
```json
{
  "descricao": "Supermercado EDITADO",
  "valor": 200.00,
  "categoria": "Alimentação",
  "data": "2024-11-07",
  "recorrente": true
}
```

**Resposta 200 OK:**
```json
{
  "id": "clxxx123",
  "descricao": "Supermercado EDITADO",
  "valor": 200.00,
  "categoria": "Alimentação",
  "data": "2024-11-07",
  "recorrente": true,
  "userId": "user123",
  "createdAt": "2024-11-06T10:00:00Z",
  "updatedAt": "2024-11-07T15:30:00Z"
}
```

---

### **5. DELETE /api/expenses/:id**
**Descrição:** Deletar uma despesa

**Exemplo:** `DELETE /api/expenses/clxxx123`

**Resposta 200 OK:**
```json
{
  "message": "Despesa excluída com sucesso"
}
```

**Resposta 404 Not Found:**
```json
{
  "error": "Despesa não encontrada"
}
```

---

### **6. GET /api/expenses/report**
**Descrição:** Obter relatório agregado de despesas

**Query Parameters:**
- `type` (obrigatório): `"monthly"` ou `"yearly"`
- `month` (obrigatório se type=monthly): número 1-12
- `year` (obrigatório): número (ex: 2024)

**Exemplo Mensal:** `GET /api/expenses/report?type=monthly&month=11&year=2024`

**Resposta Mensal:**
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
    },
    {
      "categoria": "Lazer",
      "total": 300.50,
      "quantidade": 3
    }
  ]
}
```

**Exemplo Anual:** `GET /api/expenses/report?type=yearly&year=2024`

**Resposta Anual:**
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
    },
    ...
    {
      "mes": 12,
      "total": 1800.00,
      "quantidade": 15
    }
  ]
}
```

---

### **7. GET /api/expenses/export**
**Descrição:** Exportar despesas em formato CSV

**Query Parameters (opcionais):**
- `month` (número): Filtrar por mês
- `year` (número): Filtrar por ano
- `category` (string): Filtrar por categoria

**Exemplo:** `GET /api/expenses/export?month=11&year=2024`

**Resposta:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="despesas-2024-11.csv"`

**Formato CSV:**
```csv
descricao,valor,categoria,data,recorrente
Supermercado,150.50,Alimentação,2024-11-06,false
Uber,25.00,Transporte,2024-11-07,false
Cinema,40.00,Lazer,2024-11-08,false
```

---

### **8. POST /api/expenses/import**
**Descrição:** Importar despesas de arquivo CSV

**Request:**
- Content-Type: `multipart/form-data`
- Campo: `file` (arquivo CSV)

**Formato CSV esperado:**
```csv
descricao,valor,categoria,data,recorrente
Supermercado,150.50,Alimentação,2024-11-06,false
Uber,25.00,Transporte,2024-11-07,false
```

**Resposta 200 OK:**
```json
{
  "message": "2 despesas importadas com sucesso",
  "importadas": 2,
  "erros": []
}
```

**Se houver erros:**
```json
{
  "message": "1 despesa importada, 1 erro encontrado",
  "importadas": 1,
  "erros": [
    {
      "linha": 3,
      "erro": "Valor inválido: -50.00"
    }
  ]
}
```

---

## 🔐 Autenticação

**Todas as rotas acima precisam:**
- Verificar sessão do usuário (JWT token)
- Retornar **401 Unauthorized** se não autenticado
- Filtrar despesas por `userId` do usuário autenticado

**Como funciona:**
1. Frontend faz login via Google OAuth
2. Backend gera token JWT
3. Frontend envia token em toda requisição (header Authorization: Bearer <token>)
4. Backend valida token e obtém `userId`
5. Backend retorna apenas dados do usuário logado

---

## 📊 Modelo de Dados (Expense)

```javascript
{
  id: String (cuid),           // ID único
  descricao: String,           // Descrição da despesa
  valor: Number,               // Valor (sempre positivo)
  categoria: String,           // Categoria (ex: Alimentação)
  data: Date,                  // Data da despesa
  recorrente: Boolean,         // Se é recorrente
  userId: String,              // ID do usuário (FK)
  createdAt: DateTime,         // Criado em
  updatedAt: DateTime          // Atualizado em
}
```

---

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# CORS
FRONTEND_URL="http://localhost:3000"  # Local
# FRONTEND_URL="https://vittacash.vercel.app"  # Produção

# JWT
JWT_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Server
PORT=4000
NODE_ENV="production"
```

---

## 🧪 Como Testar (Swagger)

1. Abrir: https://vittacash.onrender.com/api-docs/
2. Todas as 8 rotas devem estar visíveis
3. Testar cada rota:
   - GET /api/expenses → 200 OK
   - POST /api/expenses → 201 Created
   - GET /api/expenses/:id → 200 OK
   - PUT /api/expenses/:id → 200 OK
   - DELETE /api/expenses/:id → 200 OK
   - GET /api/expenses/report → 200 OK
   - GET /api/expenses/export → CSV download
   - POST /api/expenses/import → 200 OK

---

## ❌ Tratamento de Erros

### **400 Bad Request**
Validação falhou
```json
{
  "error": "Dados inválidos",
  "details": {
    "descricao": "Campo obrigatório",
    "valor": "Deve ser maior que zero"
  }
}
```

### **401 Unauthorized**
Não autenticado
```json
{
  "error": "Não autenticado"
}
```

### **403 Forbidden**
Tentando acessar despesa de outro usuário
```json
{
  "error": "Acesso negado"
}
```

### **404 Not Found**
Recurso não encontrado
```json
{
  "error": "Despesa não encontrada"
}
```

### **500 Internal Server Error**
Erro no servidor
```json
{
  "error": "Erro interno do servidor"
}
```

---

## 🚀 Checklist Backend Completo

### **Rotas:**
- [x] GET /api/expenses (listar)
- [x] POST /api/expenses (criar)
- [x] GET /api/expenses/:id (obter)
- [x] PUT /api/expenses/:id (atualizar)
- [x] DELETE /api/expenses/:id (deletar)
- [x] GET /api/expenses/report (relatórios)
- [x] GET /api/expenses/export (exportar CSV)
- [x] POST /api/expenses/import (importar CSV)

### **Configuração:**
- [x] CORS configurado (FRONTEND_URL)
- [x] Database PostgreSQL (Supabase)
- [x] Swagger UI em /api-docs/
- [x] Variáveis de ambiente configuradas

### **Segurança:**
- [x] Autenticação em todas rotas
- [x] Validação de dados
- [x] Filtro por userId
- [x] Tratamento de erros

### **Funcionalidades:**
- [x] Filtros (month, year, category)
- [x] Agregações (relatórios)
- [x] Export CSV
- [x] Import CSV
- [x] Validações server-side

---

## 📝 Notas Importantes

1. **CORS:** Essencial para frontend local funcionar
2. **Autenticação:** Todas rotas precisam verificar sessão
3. **userId:** Sempre filtrar despesas por usuário logado
4. **Validação:** Validar dados antes de salvar
5. **Swagger:** Facilita testes e documentação
6. **Render:** Free tier hiberna após 15min inativo

---

**✅ Backend pronto quando:**
- Todas as 8 rotas funcionando
- CORS configurado
- Swagger acessível
- Testes passando
- Deploy no Render ativo

