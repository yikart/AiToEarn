import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const ChannelAccountGroupOutputSchema = z.object({
  id: z.string().describe('分组 ID'),
  name: z.string().describe('分组名称'),
  rank: z.number().optional().describe('排序值'),
  ip: z.string().optional().describe('IP'),
  location: z.string().optional().describe('位置'),
  countryCode: z.string().optional().describe('国家代码'),
  proxyIp: z.string().optional().describe('代理 IP'),
  isDefault: z.boolean().optional().describe('是否默认分组'),
  hasBrowserConfig: z.boolean().describe('是否包含浏览器指纹配置'),
  createdAt: z.date().optional().describe('创建时间'),
  updatedAt: z.date().optional().describe('更新时间'),
})

export const ChannelAccountGroupVoSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object') {
    return input
  }

  const group = input as { browserConfig?: unknown, hasBrowserConfig?: unknown }
  return {
    ...group,
    hasBrowserConfig: typeof group.hasBrowserConfig === 'boolean'
      ? group.hasBrowserConfig
      : Boolean(group.browserConfig),
  }
}, ChannelAccountGroupOutputSchema)

export class ChannelAccountGroupVo extends createZodDto(ChannelAccountGroupVoSchema, 'ChannelAccountGroupVo') {}
