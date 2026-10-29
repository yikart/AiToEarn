import type { PluginManifest } from '@airongrong/plugin-api'
import type { Dirent } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyManifest } from '@airongrong/plugin-api'
import { Injectable, Logger } from '@nestjs/common'

export interface DiscoveredPlugin {
  dir: string
  manifest: PluginManifest
}

export interface RegistryScanResult {
  plugins: DiscoveredPlugin[]
  errors: Array<{ dir: string, error: string }>
}

/**
 * 发现、清单解析与版本解析。单个插件目录损坏不影响其余插件的发现。
 */
@Injectable()
export class PluginHostRegistry {
  private readonly logger = new Logger(PluginHostRegistry.name)

  async scan(pluginsDir: string): Promise<RegistryScanResult> {
    const result: RegistryScanResult = { plugins: [], errors: [] }
    if (!pluginsDir) {
      return result
    }
    let entries: Dirent[]
    try {
      entries = await readdir(pluginsDir, { withFileTypes: true })
    }
    catch {
      this.logger.warn(`插件目录不可读: ${pluginsDir}`)
      return result
    }
    for (const entry of entries.filter(item => item.isDirectory())) {
      const dir = join(pluginsDir, entry.name)
      try {
        const raw = JSON.parse(await readFile(join(dir, 'plugin.json'), 'utf8')) as unknown
        result.plugins.push({ dir, manifest: verifyManifest(raw) })
      }
      catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`插件清单解析失败: ${dir}: ${message}`)
        result.errors.push({ dir, error: message })
      }
    }
    return result
  }

  /** 同 id 多版本时取 semver 最高者 */
  resolveLatest(plugins: DiscoveredPlugin[]): Map<string, DiscoveredPlugin> {
    const byId = new Map<string, DiscoveredPlugin>()
    for (const plugin of plugins) {
      const current = byId.get(plugin.manifest.id)
      if (!current || compareSemver(plugin.manifest.version, current.manifest.version) > 0) {
        byId.set(plugin.manifest.id, plugin)
      }
    }
    return byId
  }
}

export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(part => Number(part))
  const pb = b.split('.').map(part => Number(part))
  for (let index = 0; index < 3; index += 1) {
    if (pa[index] !== pb[index]) {
      return (pa[index] ?? 0) - (pb[index] ?? 0)
    }
  }
  return 0
}
