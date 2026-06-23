import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const atlascloudConfigSchema = z.object({
  apiKey: z.string().describe('Atlas Cloud API Key'),
  baseUrl: z.string().default('https://api.atlascloud.ai/v1').describe('Atlas Cloud Base URL (OpenAI-compatible)'),
  timeout: z.number().default(300 * 1000),
})

export class AtlascloudConfig extends createZodDto(atlascloudConfigSchema) {}
