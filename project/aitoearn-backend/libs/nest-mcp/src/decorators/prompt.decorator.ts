import { SetMetadata } from '@nestjs/common'
import { ZodObject, ZodOptional, ZodType } from 'zod'
import { MCP_PROMPT_METADATA_KEY } from './constants'

interface PromptArgsRawShape {
  [k: string]:
    | ZodType
    | ZodOptional<ZodType>
}

export interface PromptMetadata {
  name: string
  description: string
  parameters?: ZodObject<PromptArgsRawShape>
}

export interface PromptOptions {
  name?: string
  description: string
  parameters?: ZodObject<PromptArgsRawShape>
}

export function Prompt(options: PromptOptions) {
  return SetMetadata(MCP_PROMPT_METADATA_KEY, options)
}
