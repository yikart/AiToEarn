import {
  createZodValidationException,
  ZodExceptionCreator,
} from '@common/exceptions'
import { ZodType } from 'zod/v4'
import { isZodDto, ZodDto } from './zod-dto.util'

export function zodValidate<TOutput = unknown, TInput = TOutput>(
  value: unknown,
  schemaOrDto: ZodType<TOutput, TInput> | ZodDto<TOutput, TInput>,
  createValidationException: ZodExceptionCreator = createZodValidationException,
) {
  const schema = isZodDto(schemaOrDto) ? schemaOrDto.schema : schemaOrDto

  const result = schema.safeParse(value)

  if (!result.success) {
    throw createValidationException(result.error)
  }

  return result.data
}
