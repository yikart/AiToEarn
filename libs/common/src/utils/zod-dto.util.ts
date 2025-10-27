import { z, ZodType } from 'zod'

export interface ZodDto<
  TOutput = unknown,
  TInput = TOutput,
> {
  new (): TOutput
  isZodDto: true
  schema: ZodType<TOutput, TInput>
  create: (input: TInput) => TOutput
}

export function createZodDto<
  TOutput = unknown,
  TInput = TOutput,
>(schema: ZodType<TOutput, TInput>, id?: string) {
  if (id)
    z.globalRegistry.add(schema, { id })

  class AugmentedZodDto {
    public static isZodDto = true
    public static schema = schema

    public static create(input: TInput) {
      return this.schema.parse(input)
    }
  }

  return AugmentedZodDto as unknown as ZodDto<TOutput, TInput>
}

export function isZodDto(metatype: unknown): metatype is ZodDto {
  return typeof metatype === 'function'
    && 'isZodDto' in metatype
    && metatype.isZodDto === true
}
