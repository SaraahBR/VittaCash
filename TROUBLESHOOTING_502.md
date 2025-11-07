# 🔧 Troubleshooting - Erro 502 Bad Gateway no Render

## 🎯 Soluções Implementadas

### 1. **Melhorias no Banco de Dados** ✅
**Arquivo:** `src/config/bancoDados.js`

**O que foi feito:**
- ✅ Adicionado sistema de retry (3 tentativas) na conexão
- ✅ Timeout de 3 segundos entre tentativas
- ✅ Servidor não trava se banco falhar
- ✅ Logs detalhados de erro
- ✅ Graceful shutdown (SIGTERM, SIGINT)

**Benefícios:**
- Resolve falhas temporárias de conexão
- Servidor sempre inicia, mesmo com DB offline
- Logs claros para debug

---

### 2. **Melhorias no Servidor** ✅
**Arquivo:** `server.js`

**O que foi feito:**
- ✅ Tratamento de `uncaughtException`
- ✅ Tratamento de `unhandledRejection`
- ✅ Binding em `0.0.0.0` (todas interfaces)
- ✅ Graceful shutdown
- ✅ Timeout de 10s para forçar encerramento
- ✅ Logs detalhados de inicialização

**Benefícios:**
- Previne crashes por erros não tratados
- Render pode acessar o servidor
- Shutdown limpo

---

### 3. **Configuração do Render** ✅

**Arquivos criados:**
- `.nvmrc` - Força Node.js 20
- `render.yaml` - Configuração do serviço
- `test-server.js` - Script de diagnóstico

**Package.json atualizado:**
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "npm install && npx prisma generate && npx prisma migrate deploy",
    "postinstall": "prisma generate",
    "test": "node test-server.js"
  }
}
```

---

## 🚀 Instruções para Deploy no Render

### **Opção 1: Redeploy Manual**

1. **Acesse o Render Dashboard:**
   - https://dashboard.render.com

2. **Selecione o serviço `vittacash-backend`**

3. **Verifique as variáveis de ambiente:**
   ```env
   DATABASE_URL=postgresql://...?pgbouncer=true
   DIRECT_URL=postgresql://.../postgres
   JWT_SECRET=sua_chave_secreta
   NODE_ENV=production
   PORT=4000
   FRONTEND_URL=http://localhost:3000,https://vittacash.vercel.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASS=...
   ```

4. **Configurações do Serviço:**
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - **Node Version:** 20

5. **Clique em "Manual Deploy" → "Deploy latest commit"**

6. **Aguarde o deploy (2-5 minutos)**

7. **Verifique os logs:**
   - Deve aparecer: `✅ Conectado ao PostgreSQL`
   - Deve aparecer: `🚀 Servidor VittaCash rodando!`

---

### **Opção 2: Push Git (Deploy Automático)**

1. **Faça commit das alterações:**
```bash
git add .
git commit -m "fix: corrigir erro 502 - melhorar tratamento de erros e conexão com DB"
git push origin main
```

2. **Render fará deploy automático**

3. **Acompanhe os logs no Dashboard**

---

## 🔍 Como Diagnosticar Problemas

### **1. Verificar Logs no Render**

No Dashboard do Render → Logs, procure por:

**✅ Logs de sucesso:**
```
✅ Conectado ao PostgreSQL (Supabase)
🚀 Servidor VittaCash rodando!
📊 Ambiente: production
🌐 Porta: 4000
```

**❌ Logs de erro comuns:**

#### Erro: "Can't reach database server"
```
❌ Erro ao conectar ao banco (tentativa 1/3): Can't reach database server
```
**Solução:** Verificar `DATABASE_URL` e `DIRECT_URL`

#### Erro: "Invalid JWT_SECRET"
```
❌ Erro: JWT_SECRET não definido
```
**Solução:** Adicionar `JWT_SECRET` nas variáveis de ambiente

#### Erro: "Module not found"
```
❌ Error: Cannot find module '@prisma/client'
```
**Solução:** Executar build novamente (Prisma não foi gerado)

---

### **2. Testar Health Check**

Após deploy, acesse:
```
https://vittacash.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2024-11-07T...",
  "uptime": 123.456,
  "ambiente": "production"
}
```

Se retornar 502, o servidor não está iniciando.

---

### **3. Testar Swagger**

Acesse:
```
https://vittacash.onrender.com/api-docs
```

Deve carregar a interface Swagger.

---

## 🐛 Problemas Comuns e Soluções

### **Problema 1: Erro 502 após deploy**

**Causa:** Servidor não iniciou ou crashou

**Solução:**
1. Verificar logs no Render
2. Verificar variáveis de ambiente
3. Executar `npm run test` localmente
4. Verificar se Prisma Client foi gerado

---

### **Problema 2: Conexão com banco falha**

**Causa:** URLs do Supabase incorretas ou firewall

**Solução:**
1. Verificar `DATABASE_URL` (deve ter `?pgbouncer=true`)
2. Verificar `DIRECT_URL` (sem pgbouncer)
3. Testar conexão no Prisma Studio local:
   ```bash
   npx prisma studio
   ```

---

### **Problema 3: Prisma Client não encontrado**

**Causa:** `npx prisma generate` não foi executado

**Solução:**
1. No Render, verificar Build Command:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
2. Ou adicionar ao package.json:
   ```json
   "postinstall": "prisma generate"
   ```

---

### **Problema 4: Timeout ao conectar**

**Causa:** Render Free hiberna após 15 min de inatividade

**Solução:**
- Primeira requisição pode demorar 30-60s (cold start)
- Aguardar e tentar novamente
- Considerar plano pago (sem hibernação)

---

## 🧪 Testes Locais

### **1. Testar conexão com DB:**
```bash
npx prisma studio
```

### **2. Testar servidor localmente:**
```bash
npm run test
```

### **3. Iniciar servidor em dev:**
```bash
npm run dev
```

### **4. Verificar se porta está livre:**
```bash
netstat -ano | findstr :4000
```

---

## 📊 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] ✅ `DATABASE_URL` configurado (com `?pgbouncer=true`)
- [ ] ✅ `DIRECT_URL` configurado (sem pgbouncer)
- [ ] ✅ `JWT_SECRET` configurado (string longa e aleatória)
- [ ] ✅ `FRONTEND_URL` configurado (separado por vírgula)
- [ ] ✅ `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configurados
- [ ] ✅ `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` configurados
- [ ] ✅ Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
- [ ] ✅ Start Command: `npm start`
- [ ] ✅ Health Check Path: `/health`
- [ ] ✅ Node Version: 20

---

## 🔗 Links Úteis

- **Dashboard Render:** https://dashboard.render.com
- **Documentação Render:** https://render.com/docs
- **Logs:** Render Dashboard → Seu Serviço → Logs
- **Supabase Dashboard:** https://app.supabase.com

---

## 📞 Contato

**Desenvolvido por:** Sarah Hernandes  
**E-mail:** vihernandesbr@gmail.com

---

**✅ Após aplicar essas correções, o erro 502 deve estar resolvido!**

Se o problema persistir, verifique os logs no Render Dashboard para identificar a causa específica.

