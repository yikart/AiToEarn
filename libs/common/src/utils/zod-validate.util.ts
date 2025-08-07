import type { ZodType } from 'zod'
import type { ZodExceptionCreator } from '../exceptions'
import type { ZodDto } from './zod-dto.util'
import { createZodValidationException } from '../exceptions'
import { isZodDto } from './zod-dto.util'

export function zodValidate<
  TOutput = unknown,
  TInput = TOutput,
>(
  value: TInput,
  schemaOrDto: ZodType<TOutput, TInput> | ZodDto<TOutput, TInput>,
  createValidationException: ZodExceptionCreator = createZodValidationException,
): TOutput {
  // @ts-expect-error wtf???
  const schema: ZodType = isZodDto(schemaOrDto) ? schemaOrDto.schema : schemaOrDto

  const result = schema.safeParse(value)

  if (!result.success) {
    throw createValidationException(result.error)
  }

  return result.data as TOutput
}
