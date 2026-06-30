# ALO AI

SaaS multicanal de atendimento com CRM, Kanban e agente IA assistivo.

## Stack

- Frontend: React 18, Vite 5, React Router v6, Supabase client.
- Backend: NestJS/Fastify em `alo-ai-api/`.
- Banco/Auth/Realtime: Supabase PostgreSQL.
- WhatsApp: Evolution API v2, chamada somente pelo backend.
- Deploy v1: frontend na Vercel, backend e Evolution no Render.

## Setup local

```bash
npm install
npm run dev
npm run build
```

Frontend local: `http://localhost:5173`

## Variaveis de ambiente

Frontend:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_API_URL=https://<alo-ai-api-host>
```

Backend:

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<supabase-service-role-key>
JWT_SECRET=<32-plus-char-random-secret>
EVOLUTION_URL=https://<evolution-api-host>
EVOLUTION_API_KEY=<rotated-evolution-api-key>
FRONTEND_URL=https://<frontend-host>
PORT=3000
NODE_ENV=production
```

Evolution API:

```env
DATABASE_URL=<supabase-direct-postgres-url-port-5432>
AUTHENTICATION_API_KEY=<rotated-evolution-api-key>
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://aloai-br-1i7u.onrender.com/webhook/whatsapp
```

Do not commit real keys. Any key previously copied into docs must be rotated before RC.

## Operational boundaries

- Frontend never calls Evolution directly.
- WhatsApp sends go through the backend first.
- Evolution provider remains unchanged in v1.
- `CHAN-01` is the known Evolution webhook blocker: the current remediation is a fork of the Evolution image with the internal `.env` removed so Render env vars are authoritative.
- Target webhook remains `https://aloai-br-1i7u.onrender.com/webhook/whatsapp`.

## Final smoke

```bash
npm run smoke:v1 -- -WhatIf
```

For RC sign-off, provide:

```env
ALO_API_URL=https://aloai-br-1i7u.onrender.com
ALO_FRONTEND_URL=https://<vercel-host>
ALO_WORKSPACE_ID=<workspace-id>
ALO_CONVERSATION_ID=<conversation-id>
ALO_TOKEN=<valid-user-bearer-token>
```

Then run:

```bash
npm run build
npm run build --prefix alo-ai-api
npm run smoke:v1
```

## Sales

Sem signup publico em v1. Vendas via WhatsApp: `5524974057429`.
