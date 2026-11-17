import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function testFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry)
    if (entry === 'node_modules' || entry === '.next') return []
    if (statSync(fullPath).isDirectory()) return testFiles(fullPath)
    return /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(entry) ? [fullPath] : []
  })
}

const offenders = testFiles('.')
  .filter((file) => /\b(test|it|describe)\.only\b/.test(readFileSync(file, 'utf8')))

if (offenders.length > 0) {
  offenders.forEach((file) => console.error(`FAIL  ${file} contains an exclusive test`))
  process.exitCode = 1
} else {
  console.log('PASS  no exclusive tests')
}
