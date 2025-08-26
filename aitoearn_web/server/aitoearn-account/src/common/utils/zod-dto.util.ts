import { ZodType } from 'zod/v4'

export interface ZodDto<TOutput = unknown, TInput = TOutput> {
  new(): TOutput
  isZodDto: true
  schema: ZodType<TOutput, TInput>
  create: (input: TInput) => TOutput
}

export function createZodDto<TOutput = unknown, TInput = TOutput>(
  schema: ZodType<TOutput, TInput>,
) {
  class AugmentedZodDto {
    public static isZodDto = true
    public static schema = schema

    public static create(input: unknown) {
      return this.schema.parse(input)
    }
  }
  return AugmentedZodDto as unknown as ZodDto<TOutput, TInput>
}

export function isZodDto(metatype: unknown): metatype is ZodDto<unknown> {
  return (
    typeof metatype === 'function'
    && 'isZodDto' in metatype
    && metatype.isZodDto === true
  )
}
