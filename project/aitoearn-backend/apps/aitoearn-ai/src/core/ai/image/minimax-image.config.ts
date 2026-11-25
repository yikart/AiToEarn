import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export enum MiniMaxImageModel {
  Standard = 'MiniMax-H3-Image',
  Highspeed = 'MiniMax-H3-Image-Highspeed',
}

export const miniMaxImageConfigSchema = z.object({
  apiKey: z.string().describe('MiniMax API key'),
  endpoint: z.enum([
    'https://api.minimax.io/v1/images/generations',
    'https://api.minimax.cn/v1/images/generations',
  ]).describe('Endpoint for the region where the key was issued'),
})

export class MiniMaxImageConfig extends createZodDto(miniMaxImageConfigSchema) {}
