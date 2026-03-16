import z, { ZodType } from 'zod'

export type RangeFilter<T> = [T, T] | [undefined, T] | [T, undefined]

export function createRangeFilter<TOutput = unknown, TInput = TOutput>(schema: ZodType<TOutput, TInput>): ZodType<RangeFilter<TOutput>> {
  return z.union([
    z.tuple([schema, schema]),
    z.tuple([z.undefined(), schema]),
    z.tuple([schema, z.undefined()]),
  ])
}
