import fs from 'node:fs'
import path from 'node:path'

const controllersDir = path.resolve('alo-ai-api/src/controllers')
const allowedPublic = new Map([
  ['app.controller.ts', new Set(['getHealth'])],
  ['compatibility.controller.ts', new Set(['webhookWhatsapp', 'webhooksWhatsapp'])],
])

const routeMethodPattern = /@(Get|Post|Patch|Delete)\([^)]*\)\s+async\s+(\w+)\s*\([^)]*\)\s*{/g
const failures = []

for (const file of fs.readdirSync(controllersDir).filter((item) => item.endsWith('.ts'))) {
  const absolute = path.join(controllersDir, file)
  const source = fs.readFileSync(absolute, 'utf8')
  const matches = [...source.matchAll(routeMethodPattern)]

  for (let index = 0; index < matches.length; index += 1) {
    const methodName = matches[index][2]
    if (allowedPublic.get(file)?.has(methodName)) continue

    const start = matches[index].index
    const end = matches[index + 1]?.index ?? source.length
    const body = source.slice(start, end)
    const hasJwtCheck = body.includes('resolveRequestContext(') || body.includes('requireOwner(')
    if (!hasJwtCheck) failures.push(`${file}:${methodName}`)
  }
}

if (failures.length) {
  console.error('JWT coverage scan failed. Missing auth checks:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('JWT coverage scan passed: all controller routes require JWT except webhooks/health.')
