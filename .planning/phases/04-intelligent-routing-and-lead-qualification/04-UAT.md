---
status: testing
phase: 04-intelligent-routing-and-lead-qualification
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
started: 2026-04-25T18:24:32.4498271-03:00
updated: 2026-04-25T18:24:32.4498271-03:00
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Pare os serviços da aplicação. Suba frontend e backend do zero com banco já migrado na fase 4.
  O boot deve concluir sem erro, com API respondendo normalmente e Inbox carregando conversas com os campos de roteamento.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Pare os serviços da aplicação. Suba frontend e backend do zero com banco já migrado na fase 4. O boot deve concluir sem erro, com API respondendo normalmente e Inbox carregando conversas com os campos de roteamento.
result: [pending]

### 2. Inbox exibe fila e intencao da conversa
expected: Ao abrir uma conversa no Inbox, tags de fila e intencao aparecem no card/lista e no header da conversa com valores canônicos (suporte, comercial, financeiro, triagem / suporte, comercial, financeiro, duvida_geral, spam).
result: [pending]

### 3. Sugestao de roteamento on-demand no Inbox
expected: Ao acionar "Sugerir fila", o Inbox consulta backend e mostra recomendacao (fila, intencao, confidence/source) sem avaliar regras no cliente.
result: [pending]

### 4. Aplicacao de roteamento restrita a supervisor+
expected: Perfil supervisor/admin/owner consegue aplicar roteamento no Inbox; perfil agente nao recebe acao de aplicar.
result: [pending]

### 5. Raciocinio de roteamento visivel apenas para supervisor+
expected: A linha curta de raciocinio ("Roteado por canal...") aparece para supervisor/admin/owner e nao aparece para agente.
result: [pending]

### 6. Qualificacao leve em Contacts
expected: Em Contacts, lead status fica limitado a open/qualified/disqualified, com fila e intencao visiveis; supervisor+ consegue atualizar status via backend.
result: [pending]

### 7. Kanban preserva 6 estados e mostra contexto leve
expected: Kanban continua usando apenas os 6 estados de conversa e mostra contexto de fila/qualificacao no card ou painel lateral, sem pipeline de vendas adicional.
result: [pending]

### 8. Dashboard reflete triagem e qualificacao
expected: Dashboard mostra indicadores derivados de dados canonicos (ex.: fila triagem, qualificacao), sem depender de estado local.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

