import { createHash, generateKeyPairSync, sign as signData } from 'node:crypto'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verifyManifest } from '@airongrong/plugin-api'

export interface TestPackageOptions {
  id: string
  type: 'hook' | 'adapter' | 'skill'
  entrySource?: string
  apiVersion?: string
  engines?: string
  hooks?: string[]
  network?: string[]
  secrets?: string[]
  storage?: { kv: boolean, bytes?: number }
  signWithKey?: string
  overrideManifest?: Record<string, unknown>
}

export async function writeTestPluginPackage(options: TestPackageOptions): Promise<{ dir: string, manifest: ReturnType<typeof verifyManifest> }> {
  const root = await mkdtemp(join(tmpdir(), 'ait-plugin-'))
  const dir = join(root, options.id)
  await mkdir(join(dir, 'dist'), { recursive: true })
  const entrySource = options.entrySource ?? 'export async function activate() { return { hooks: {} } }\n'
  await writeFile(join(dir, 'dist', 'index.mjs'), entrySource)
  const sha256 = createHash('sha256').update(entrySource).digest('hex')
  const manifest: Record<string, unknown> = {
    id: options.id,
    version: '1.0.0',
    apiVersion: options.apiVersion ?? '^1.0.0',
    type: options.type,
    description: '测试插件',
    ...(options.type === 'skill' ? {} : { entry: { module: './dist/index.mjs', sha256 } }),
    contributes: options.type === 'hook'
      ? { hooks: options.hooks ?? ['beforePublish'] }
      : options.type === 'adapter'
        ? { channels: [{ id: 'test', label: 'Test', capabilities: ['publish.text'] }] }
        : { skills: ['test-skill'] },
    permissions: {
      network: options.network ?? [],
      ...(options.secrets ? { secrets: options.secrets } : {}),
      ...(options.storage ? { storage: options.storage } : {}),
    },
    engines: { aitoearn: options.engines ?? '>=1.0.0 <3' },
    license: 'MIT',
    ...options.overrideManifest,
  }
  if (options.signWithKey) {
    manifest['signature'] = signData(null, Buffer.from(sha256), options.signWithKey).toString('base64')
  }
  await writeFile(join(dir, 'plugin.json'), JSON.stringify(manifest, null, 2))
  return { dir, manifest: verifyManifest(manifest) }
}

export function createTestKeyPair(): { privateKey: string, publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  }
}
