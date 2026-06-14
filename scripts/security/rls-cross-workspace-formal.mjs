import fs from 'node:fs'
import path from 'node:path'

const migrationsDir = path.resolve('supabase/migrations')
const migrations = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => fs.readFileSync(path.join(migrationsDir, file), 'utf8').toLowerCase())
  .join('\n')

const requiredTables = [
  'workspaces',
  'workspace_members',
  'workspace_users',
  'contacts',
  'channels',
  'conversations',
  'messages',
  'leads',
  'audit_logs',
]

const failures = []

if (!migrations.includes('current_workspace_ids()')) {
  failures.push('missing current_workspace_ids() membership helper')
}

for (const table of requiredTables) {
  if (!migrations.includes(`alter table public.${table} enable row level security`)) {
    failures.push(`missing RLS enablement for public.${table}`)
  }
}

for (const table of requiredTables.filter((table) => !['workspaces', 'workspace_members', 'workspace_users', 'audit_logs'].includes(table))) {
  const hasWorkspacePolicy = migrations.includes(`on public.${table}`) && (
    migrations.includes('workspace_id in (select public.current_workspace_ids())')
    || migrations.includes('public.is_workspace_member(workspace_id)')
  )
  if (!hasWorkspacePolicy) failures.push(`missing workspace-scoped policy evidence for public.${table}`)
}

if (!migrations.includes('audit_logs_workspace_select')) {
  failures.push('missing audit_logs workspace select policy')
}

if (failures.length) {
  console.error('RLS cross-workspace formal check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('RLS cross-workspace formal check passed: workspace-scoped RLS evidence exists for tenant tables.')
