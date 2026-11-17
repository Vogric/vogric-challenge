import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MAX_LINES = 220
const ROOTS = ['app', 'components', 'contexts', 'hooks', 'lib', 'types']

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry)
    if (statSync(fullPath).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(fullPath)
    }
    if (!/\.(ts|tsx)$/.test(entry)) return []
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry)) return []
    if (entry === 'page.tsx') return []
    return [fullPath]
  })
}

const failures = ROOTS.flatMap(sourceFiles)
  .map((file) => ({ file, lines: readFileSync(file, 'utf8').split('\n').length - 1 }))
  .filter(({ lines }) => lines > MAX_LINES)

for (const { file, lines } of failures) {
  console.error(`FAIL  ${file}: ${lines} lines (max ${MAX_LINES})`)
}

if (failures.length > 0) {
  console.error('Extract cohesive units into focused modules before merging.')
  process.exitCode = 1
} else {
  console.log(`PASS  all non-page source files are <= ${MAX_LINES} lines`)
}
