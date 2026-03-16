import { aliOssConfigSchema } from '@yikart/ali-oss'
import { s3ConfigSchema } from '@yikart/aws-s3'
import { z } from 'zod'

export const ASSETS_CONFIG = Symbol('ASSETS_CONFIG')

export const cloudflareQueueConfigSchema = z.object({
  accountId: z.string(),
  queueId: z.string(),
  apiToken: z.string(),
})

const s3AssetsConfigSchema = z.looseObject({
  ...s3ConfigSchema.shape,
  provider: z.literal('s3'),
  cloudflare: cloudflareQueueConfigSchema.optional(),
})

const aliOssAssetsConfigSchema = z.looseObject({
  ...aliOssConfigSchema.shape,
  provider: z.literal('ali-oss'),
  callbackUrl: z.string().optional().describe('OSS 上传完成回调 URL'),
})

const assetsDiscriminatedSchema = z.discriminatedUnion('provider', [
  s3AssetsConfigSchema,
  aliOssAssetsConfigSchema,
])

export const assetsConfigSchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && !('provider' in val)) {
      return { ...val, provider: 's3' }
    }
    return val
  },
  assetsDiscriminatedSchema,
)

export type AssetsConfig = z.infer<typeof assetsDiscriminatedSchema>

/**
 * 判断 Cloudflare Queue 是否已配置
 * cloudflare 配置存在则启用 Queue 模式，否则使用轮询模式
 */
export function isQueueEnabled(config: AssetsConfig): boolean {
  return config.provider === 's3' && !!config.cloudflare
}

/**
 * 判断 AliOss Callback 是否已配置
 * callbackUrl 配置存在则启用回调模式，上传完成后 OSS 主动推送确认
 */
export function isCallbackEnabled(config: AssetsConfig): boolean {
  return config.provider === 'ali-oss' && !!config.callbackUrl
}
