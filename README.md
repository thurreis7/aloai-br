# ALO AI — Frontend + Supabase

Software de atendimento multicanal com IA.

## Stack
- **React 18** + **Vite 5** — frontend
- **React Router v6** — navegação
- **Lucide React** — ícones
- **CSS Custom Properties** — design system (sem Tailwind, sem CSS-in-JS)

## Setup
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

```bashhttps://supabase.com/
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Build para produção
npm run build
```

Acesse: `http://localhost:5173`

## Estrutura

```
src/
├── pages/
│   ├── Landing.jsx       ← Página inicial / marketing
│   ├── Onboarding.jsx    ← Fluxo de setup (5 passos)
│   ├── Inbox.jsx         ← Chat + lista de conversas
│   ├── Dashboard.jsx     ← Métricas e gráficos
│   ├── Channels.jsx      ← Configuração de canais
│   └── Contacts.jsx      ← CRM / lista de contatos
├── components/
│   ├── ui/
│   │   ├── index.jsx     ← Button, Badge, Card, Input, Toggle, Avatar, StatCard
│   │   └── Logo.jsx      ← LogoMark, LogoFull
│   └── layout/
│       └── AppLayout.jsx ← Sidebar + Outlet
├── lib/
│   └── mockData.js       ← Dados de demonstração
├── App.jsx               ← Rotas
├── main.jsx              ← Entry point
└── index.css             ← Design system (tokens CSS)
```

## Rotas

| Rota | Página |
|------|--------|
| `/` | Landing page |
| `/onboarding` | Fluxo de configuração inicial |
| `/app/inbox` | Inbox + chat |
| `/app/dashboard` | Dashboard |
| `/app/channels` | Configuração de canais |
| `/app/contacts` | Contatos / CRM |

## Design System

Tokens CSS definidos em `src/index.css`:

```css
--bg-base, --bg-page, --bg-s1, --bg-s2   /* Backgrounds */
--pri, --pri-h, --pri-l, --pri-pale       /* Roxo primário */
--txt1, --txt2, --txt3, --txt4            /* Textos */
--success, --warn, --err, --info          /* Semântico */
--border, --border2, --border3            /* Bordas */
```

Tema claro via `data-theme="light"` no `<html>`.

## Próximos passos (backend)

1. **Supabase** — auth, banco PostgreSQL, realtime, storage
2. **Evolution API** — integração WhatsApp (self-hosted)
3. **Meta Webhooks** — Instagram + Facebook
4. **OpenAI / Claude API** — agente IA
5. **Pagar.me** — cobrança recorrente

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=https://api.aloai.com.br
```


● # ALO AI — CONTEXTO DE SESSÃO (Handoff para Continuação)                                                                 

  **Data:** 2026-04-08                                                                                                     
  **Sessão:** Correção Evolution API 502 + Preparação deploy backend
  **IA Responsável anterior:** Claude Code (Anthropic)                                                                     
  **Próxima IA/Desenvolvedor:** Continue a partir do **Passo 2** (Deploy do backend)

  ---

  ## 📊 STATUS ATUAL DO PROJETO

  ### ✅ CONCLUÍDO nesta sessão

  1. **Evolution API (WhatsApp)** — Railway
     - Status: ✅ **ONLINE** (Deploy 7eff3de6)
     - Problema 502 resolvido: `DATABASE_URL` aponta para Postgres do Railway (porta 5432 direta, sem pgbouncer)
     - Prisma migrations: "No pending migrations" — aplicadas com sucesso
     - Módulos ativos: WA MODULE, CacheService, PrismaRepository
     - Instância WhatsApp: `aloai-workspace-1` (NÃO criada ainda — aguarda backend)
     - URL: `https://evolution-api-production-2fc5.up.railway.app`

  2. **Frontend (React) — Local**
     - Estrutura validada: pasta correta é `alo-ai/` (não a raiz)
     - Comando correto: `cd alo-ai && npm run dev`
     - Aguardando `.env` com `VITE_SUPABASE_ANON_KEY` correta (JWT eyJ..., não sb_publishable_...)

  3. **Backend (alo-ai-api) — Código local**
     - Código completo e validado
     - `railway.json` e `Dockerfile` prontos
     - **NÃO foi deployado ainda** — aguarda criação no Railway

  ---

  ## 🔐 CREDENCIAIS E CONFIGURAÇÕES IDENTIFICADAS

  ### Supabase
  Project ID: mhrnptfqapizrulexnqo
  URL: https://mhrnptfqapizrulexnqo.supabase.co
  Anon Key (JWT): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocm5wdGZxYXBpenJ1bGV4bnFvIiwicm9s
  ZSI6ImFub24iLCJpYXQiOjE3NzM1MjM5MjYsImV4cCI6MjA4OTA5OTkyNn0.kvI0cT9Y6o1DyKxaHrno6CIgg7OUPYHJIIBjjKYBGeY
  Service Role Key: [REGENERAR — foi gerada mas não foi capturada; ver aviso abaixo]
  Company ID (ALO AI): a1b2c3d4-0001-0001-0001-000000000001
  Admin UUID: 954fa5ad-8249-45dd-a58b-d39bcadad090

  ### Evolution API
  URL: https://evolution-api-production-2fc5.up.railway.app
  API Key: aloai2025
  Instância: aloai-workspace-1
  Database: Postgres do Railway (porta 5432 direta)

  ### ⚠️  AVISO CRÍTICO DE SEGURANÇA

  Uma **service_role key** do Supabase foi exposta na conversa (começando com `eyJhbGci...`).
  **AÇÃO IMEDIATA NECESSÁRIA:**

  1. Vá em Supabase Dashboard → Settings → API → service_role key
  2. Clique em **"Regenerate"** para invalidar a chave vazada
  3. Use a **NOVA** chave nas variáveis do Railway

  ---

  ## 🏗️  ARQUITETURA DO SISTEMA

  Frontend (React + Vite)
      ↓ VITE_API_URL
  alo-ai-api (NestJS/Fastify — Railway)
      ↓ SUPABASE_SERVICE_KEY
  Supabase (DB + Auth + Realtime)
      ↓ WEBHOOK
  Evolution API (WhatsApp — Railway)
      ↓ API_KEY
  WhatsApp Business

  ---

  ## 📂 ESTRUTURA DO BACKEND (alo-ai-api)

  alo-ai-api/
  ├── Dockerfile                 → Node 20 Alpine, EXPOSE 3001
  ├── railway.json               → builder: DOCKERFILE, healthcheck /health
  ├── package.json               → fastify, cors, supabase-js, dotenv
  ├── src/
  │   └── index.js               → Servidor Fastify principal
  │       ├── POST /workspace/setup     → cria company, user, channel
  │       ├── POST /auth/register        → registro multi-tenant
  │       ├── POST /auth/login           → JWT
  │       ├── GET /health               → healthcheck
  │       ├── (módulos pendentes de leitura: conversations, messages, kanban, integrations/whatsapp)
  └── test-evolution.ps1         → script de teste local Evolution API

  **Nota:** O código completo está no repositório local. O deploy no Railway ainda não foi feito.

  ---

  ## 🎯 PRÓXIMOS PASSOS (EM ORDEM)

  ### **PASSO 2 — Deploy do alo-ai-api no Railway**

  1. **Criar novo serviço no Railway:**
     - No mesmo projeto da Evolution API (ou projeto separado — tanto faz)
     - "New" → "Service" → "Deploy from Dockerfile"
     - Fonte: GitHub repo local ou upload da pasta `alo-ai-api`

  2. **Configurar variáveis de ambiente (Settings → Variables):**

     | Key | Value |
     |-----|-------|
     | `SUPABASE_URL` | `https://mhrnptfqapizrulexnqo.supabase.co` |
     | `SUPABASE_SERVICE_KEY` | `[NOVA service_role key regenerada]` |
     | `JWT_SECRET` | `[string 32+ chars de https://generate-secret.vercel.app/32]` |
     | `PORT` | `3001` |
     | `EVOLUTION_URL` | `https://evolution-api-production-2fc5.up.railway.app` |
     | `EVOLUTION_API_KEY` | `aloai2025` |
     | `FRONTEND_URL` | `https://aloai.com.br` |

  3. **Trigger deploy** e aguardar (~2 min)

  4. **Validar:**
     ```bash
     curl https://[seu-backend-railway-url]/health
     # deve retornar {status: "ok"}

  ---
  PASSO 3 — Configurar Frontend

  1. No frontend (alo-ai/.env), adicionar:
  VITE_API_URL=https://[seu-backend-railway-url]
  2. Reiniciar frontend: cd alo-ai && npm run dev

  ---
  PASSO 4 — Criar Instância WhatsApp

  1. Acessar Evolution API diretamente ou via backend:
  curl -X POST https://evolution-api-production-2fc5.up.railway.app/instance/create \
       -H "apikey: aloai2025" \
       -d '{"instanceName":"aloai-workspace-1","qrcode":true,"number":"","integration":"WHATSAPP-BAILEYY"}'
  2. Obter QR code:
  curl -H "apikey: aloai2025" \
       https://evolution-api-production-2fc5.up.railway.app/instance/qrcode/aloai-workspace-1
  3. Escanear no app WhatsApp Business

  ---
  PASSO 5 — Testar Webhook Completo

  1. Confirmar WEBHOOK_GLOBAL_URL na Evolution API aponta para:
  https://[seu-backend-railway-url]/webhook/whatsapp
  2. Enviar mensagem de teste no WhatsApp da instância
  3. Verificar:
    - Mensagem aparece no Supabase (tabela messages)
    - Realtime chega no frontend Inbox

  ---
  🗂️  ARQUIVOS RELEVANTES

  ┌────────────────────────────────────────────────────────────┬─────────────────────────────────────┐
  │                          Arquivo                           │              Descrição              │
  ├────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ C:\Users\ahifr\Downloads\alo-ai\alo--api\ railway.json     │ Config Railway — builder Dockerfile │
  ├────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ C:\Users\ahifr\Downloads\alo-ai\alo-ai-api\Dockerfile      │ Docker Node 20 Alpine               │
  ├────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ C:\Users\ahifr\Downloads\alo-ai\alo-ai-api\src\index.js    │ Backend principal                   │
  ├────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ C:\Users\ahifr\Downloads\alo-ai\alo-ai\src\lib\supabase.js │ Cliente Supabase frontend           │
  ├────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ C:\Users\ahifr\Downloads\alo-ai\CLAUDE.md                  │ Doc completo do projeto             │
  ├────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ C:\Users\ahifr\Downloads\alo-ai\supabase-permissions.sql   │ Schema e RLS                        │
  └────────────────────────────────────────────────────────────┴─────────────────────────────────────┘

  ---
  ⚙️  VARIÁVEIS DE AMBIENTE — RESUMO

  Evolution API (já deployada)

  AUTHENTICATION_API_KEY=aloai2025
  DATABASE_ENABLED=true
  DATABASE_PROVIDER=postgresql
  DATABASE_URL=postgresql://postgres.railway.internal:5432/railway (auto)
  DATABASE_CONNECTION_URI=[idem]
  WEBHOOK_GLOBAL_ENABLED=true
  WEBHOOK_GLOBAL_URL=https://evolution-api-production-2fc5.up.railway.app/webhook/whatsapp

  alo-ai-api (PENDENTE deploy)

  SUPABASE_URL=https://mhrnptfqapizrulexnqo.supabase.co
  SUPABASE_SERVICE_KEY=[NOVA service_role key regenerada]
  JWT_SECRET=[string 32+ chars aleatória]
  PORT=3001
  EVOLUTION_URL=https://evolution-api-production-2fc5.up.railway.app
  EVOLUTION_API_KEY=aloai2025
  FRONTEND_URL=https://aloai.com.br

  Frontend (local)

  VITE_SUPABASE_URL=https://mhrnptfqapizrulexnqo.supabase.co
  VITE_SUPABASE_ANON_KEY=[JWT anon key eyJhbGci...]
  VITE_API_URL=[backend Railway URL]

  ---
  📝 NOTAS TÉCNICAS

  - RLS Policies usam get_my_company_id() (SECURITY DEFINER) — não subquery direta
  - Realtime ativo em: conversations, messages, kanban_cards, users
  - Kanban: 6 colunas fixas (Novos → Em atendimento → Aguardando → Follow Up → Negociação → Resolvidos)
  - Webhook endpoint: POST /webhook/whatsapp no backend
  - Onboarding: /onboarding é uso interno do Hideo — não é público
  - Landing CTAs: todos devem apontar para WhatsApp (wa.me/5524974057429)

  ---
  🔄 O QUE FOI TENTADO / DECIDIDO

  ┌───────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
  │       Item        │                                         Decisão                                          │
  ├───────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ Tailwind          │ ❌ Não usa — CSS variables custom                                                        │
  ├───────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ Framework backend │ ✅ Fastify (não NestJS — era planejado mas código é Fastify puro)                        │
  ├───────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ Evolution API DB  │ ✅ Postgres Railway (porta 5432) — pgbouncer desabilitado                                │
  ├───────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ QR Code           │ ❌ Não appearance porque instância não criada (backend não deployado)                    │
  ├───────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
  │ Projeto Railway   │ ✅ Evolution API já está em projeto separado; backend será novo serviço no mesmo projeto │
  └───────────────────┴──────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  🚨 BLOQUEIOS ATUAIS

  1. ❌ SUPABASE_SERVICE_KEY precisa ser regenerada (chave vazada na conversa)
  2. ❌ Backend alo-ai-api não deployado no Railway
  3. ❌ Frontend .env pode estar com sb_publishable_ errado (verificar)
  4. ❌ Instância WhatsApp aloai-workspace-1 não existe (aguarda backend)
  5. ❌ Webhook /webhook/whatsapp não testado (backend não no ar)

  ---
  📞 CONTATO ÚTIL

  - Suporte Hideo (WhatsApp): 5524974057429
  - Google Forms cadastro:
  https://docs.google.com/forms/d/e/1FAIpQLSeSPdzOKcql4Du4S9c_DY5_lsbP-UCWxfW9V_dYCN4kiFzZxw/viewform
  - Railway Support: https://railway.app/support
  - Supabase Dashboard: https://app.supabase.com/project/mhrnptfqapizrulexnqo

  ---
  🎯 INSTRUÇÕES PARA A PRÓXIMA IA

  Ponto de partida: O usuário está com o backend alo-ai-api ainda não deployado no Railway.

  Ação imediata:
  3. Use o JSON de variáveis fornecido acima (com a chave regenerada)
  4. Valide o healthcheck após deploy
  5. Siga para o Passo 3 (frontend VITE_API_URL)

  Não assuma que as variáveis já estão no Railway — peça para o usuário confirmar.

  ---
  Fim do handoff. Boa continuação!