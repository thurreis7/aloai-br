import { spawn } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const tmpDir = path.join(root, '.tmp')

function runCheck(label, command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === 'win32',
      env: { ...process.env, CI: 'true', ...options.env },
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
      process.stdout.write(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      process.stderr.write(chunk)
    })
    child.on('close', (code) => {
      resolve({ label, code, ok: code === 0, stdout, stderr })
    })
  })
}

function emptyCounts() {
  return { passed: 0, failed: 0 }
}

async function readJsonCounts(filePath, kind) {
  try {
    const raw = await readFile(filePath, 'utf8')
    const payload = JSON.parse(raw)
    if (kind === 'jest') {
      return {
        passed: Number(payload.numPassedTests || 0),
        failed: Number(payload.numFailedTests || 0),
      }
    }

    const total = Number(payload.numTotalTests || 0)
    const failed = Number(payload.numFailedTests || 0)
    const passed = Number(payload.numPassedTests || Math.max(0, total - failed) || 0)
    return { passed, failed }
  } catch {
    return emptyCounts()
  }
}

function formatStatus(result) {
  return result.ok ? 'PASS' : 'FAIL'
}

function printLine(label, result, counts = null) {
  const suffix = counts ? ` (${counts.passed} passed, ${counts.failed} failed)` : ''
  console.log(`${label.padEnd(17)} ${formatStatus(result)}${suffix}`)
}

await mkdir(tmpDir, { recursive: true })
const jestJson = path.join(tmpDir, 'phase-jest.json')
const vitestJson = path.join(tmpDir, 'phase-vitest.json')
await rm(jestJson, { force: true }).catch(() => {})
await rm(vitestJson, { force: true }).catch(() => {})

const backend = await runCheck('Backend tests', 'npx', [
  'jest',
  '--testPathPattern=__tests__',
  '--passWithNoTests',
  '--ci',
  '--json',
  `--outputFile=${jestJson}`,
])
const frontend = await runCheck('Frontend tests', 'npx', [
  'vitest',
  'run',
  '--passWithNoTests',
  '--reporter=json',
  `--outputFile=${vitestJson}`,
])
const securityRls = await runCheck('Security RLS', 'npm', ['run', 'security:rls'])
const securityJwt = await runCheck('Security JWT', 'npm', ['run', 'security:jwt'])
const apiBuild = await runCheck('API build', 'npm', ['run', 'build', '--prefix', 'alo-ai-api'])
const frontendBuild = await runCheck('Frontend build', 'npm', ['run', 'build'])

const backendCounts = await readJsonCounts(jestJson, 'jest')
const frontendCounts = await readJsonCounts(vitestJson, 'vitest')
const overall = [backend, frontend, securityRls, securityJwt, apiBuild, frontendBuild].every((item) => item.ok)

console.log('')
console.log('PHASE VERIFICATION REPORT')
console.log('-------------------------')
printLine('Backend tests:', backend, backendCounts)
printLine('Frontend tests:', frontend, frontendCounts)
printLine('Security RLS:', securityRls)
printLine('Security JWT:', securityJwt)
printLine('API build:', apiBuild)
printLine('Frontend build:', frontendBuild)
console.log('-------------------------')
console.log(`OVERALL: ${overall ? 'PASS' : 'FAIL'}`)

process.exit(overall ? 0 : 1)
