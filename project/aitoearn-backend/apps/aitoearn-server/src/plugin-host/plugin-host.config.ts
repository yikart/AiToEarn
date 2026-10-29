import { z } from 'zod'

export const pluginsConfigSchema = z.object({
  /** 插件目录，空字符串表示不加载任何插件 */
  dir: z.string().default(''),
  /** 受信任的 ed25519 公钥（PEM），adapter 签名校验使用 */
  trustedKeys: z.array(z.string().min(1)).default([]),
  /** 宿主版本，用于 engines.aitoearn 兼容性判断 */
  hostVersion: z.string().default('1.0.0'),
  /**
   * 文件系统隔离：
   * - auto（默认）：Node 支持 --permission 时启用，否则降级并记录告警
   * - on：强制启用，Node 不支持时插件加载直接失败（生产建议使用）
   * - off：关闭，仅限本地调试
   */
  fsIsolation: z.enum(['auto', 'on', 'off']).default('auto'),
  /**
   * 是否允许把明文密钥回传给插件进程（P1-6）。
   * 默认 false：插件只能通过 host.http.request 的 authSecret 让宿主注入 Authorization。
   */
  allowRawSecrets: z.boolean().default(false),
  /**
   * 插件 KV 存储后端：
   * - redis（默认）：走全局 ioredis 客户端，多实例部署共享（复审 A 组）
   * - memory：进程内 Map，仅限本地调试
   */
  storage: z.enum(['redis', 'memory']).default('redis'),
}).default({ dir: '', trustedKeys: [], hostVersion: '1.0.0', fsIsolation: 'auto', allowRawSecrets: false, storage: 'redis' })

export type PluginsConfig = z.infer<typeof pluginsConfigSchema>
