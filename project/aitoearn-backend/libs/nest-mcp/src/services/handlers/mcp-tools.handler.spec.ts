import { zodToJsonSchemaOptions } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

describe('mcpToolsHandler', () => {
  it('tool 参数 schema 中的 date 字段可以转换为 JSON Schema', () => {
    const schema = z.object({
      commentTime: z.coerce.date().optional(),
      publishTime: z.date().optional(),
      time: z.tuple([z.coerce.date(), z.coerce.date()]).optional(),
    })

    const jsonSchema = z.toJSONSchema(schema, {
      ...zodToJsonSchemaOptions,
      io: 'input',
    })

    expect(jsonSchema).toMatchObject({
      type: 'object',
      properties: {
        commentTime: {
          type: 'string',
          format: 'date-time',
        },
        publishTime: {
          type: 'string',
          format: 'date-time',
        },
        time: {
          type: 'array',
        },
      },
    })
  })
})
