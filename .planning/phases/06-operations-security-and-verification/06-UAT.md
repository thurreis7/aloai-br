---
status: testing
phase: 06-operations-security-and-verification
requirements:
  - HAND-04
  - PROD-01
  - PROD-02
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
started: 2026-04-25T23:30:00-03:00
updated: 2026-04-25T23:30:00-03:00
---

## Current Test

number: 1
name: Hardening smoke dry-run
expected: |
  Rodar o script de smoke da fase 6 em modo `-WhatIf`.
  O script deve listar os checks de inbox/routing/AI/handoff sem erro de sintaxe ou bootstrap.
awaiting: user response

## Tests

### 1. Hardening smoke dry-run
expected: `powershell -ExecutionPolicy Bypass -File scripts/smoke/phase6-critical-paths.ps1 -WhatIf` executa sem erro de parsing e com resumo final.
result: [pending]

### 2. Dashboard exibe sinais operacionais gerenciais
expected: Para supervisor/admin/owner, Dashboard mostra backlog por fila, sem dono, escalonadas e IA pausada em dados canônicos do workspace.
result: [pending]

### 3. Kanban exibe contexto operacional sem alterar lifecycle
expected: Kanban mantém 6 estados e exibe contexto de sem dono/escalonadas/IA pausada + backlog por fila para perfis gerenciais.
result: [pending]

### 4. Endpoints críticos rejeitam IDs inválidos
expected: Rotas de conversation/routing com `workspaceId` ou `conversationId` inválidos retornam `400` (`workspaceId invalido` / `conversationId invalido`).
result: [pending]

### 5. Reatribuição bloqueia usuário fora do workspace
expected: `PATCH /workspaces/:workspaceId/conversations/:conversationId/assignment` falha quando `assignedTo` não pertence ao workspace.
result: [pending]

### 6. RLS/policy hardening aplicado de forma aditiva
expected: Migração `20260429_phase6_tenant_hardening_and_ops_metrics.sql` cria índices operacionais e políticas RLS de `audit_logs` sem quebrar contratos de workspace.
result: [pending]

### 7. Hybrid verification mantido (sem suíte completa)
expected: Verificação da fase usa smoke script + UAT guiado, sem prometer suíte automatizada end-to-end completa em v1.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps

- Execução assistida em ambiente real com token/workspace/conversation válidos ainda pendente.
