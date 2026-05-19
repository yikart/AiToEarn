import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'node_modules', 'tinymce')
const targetDir = path.join(projectRoot, 'public', 'tinymce')

if (!existsSync(sourceDir)) {
  console.warn('[copy-tinymce-assets] tinymce package not found, skip copying assets.')
  process.exit(0)
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(path.dirname(targetDir), { recursive: true })
cpSync(sourceDir, targetDir, {
  recursive: true,
  dereference: true,
  force: true,
})

console.log('[copy-tinymce-assets] copied TinyMCE assets to public/tinymce')
