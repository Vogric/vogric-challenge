import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MAX_LINES = 100
const ROOT = 'app'

function findPageFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry)
    if (statSync(fullPath).isDirectory()) return findPageFiles(fullPath)
    return entry === 'page.tsx' ? [fullPath] : []
  })
}

const failures = findPageFiles(ROOT)
  .map((file) => ({
    file,
    lines: readFileSync(file, 'utf8').split('\n').length - 1,
  }))
  .filter(({ lines }) => lines > MAX_LINES)

for (const { file, lines } of failures) {
  console.error(`FAIL  ${file}: ${lines} lines (max ${MAX_LINES})`)
}

if (failures.length > 0) {
  console.error('Extract route data/helpers/presentation into _components before merging.')
  process.exitCode = 1
} else {
  console.log(`PASS  all page.tsx files are <= ${MAX_LINES} lines`)
}
