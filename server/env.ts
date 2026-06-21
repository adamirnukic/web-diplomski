// Load .env.local / .env into process.env before any other server module
// reads configuration. Imported first in index.ts.
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const loadEnvFile = (process as unknown as {
  loadEnvFile?: (path: string) => void
}).loadEnvFile

for (const file of ['.env.local', '.env']) {
  const path = join(process.cwd(), file)
  if (existsSync(path) && loadEnvFile) {
    try {
      loadEnvFile(path)
    } catch {
      // ignore malformed env file; defaults in code still apply
    }
  }
}
