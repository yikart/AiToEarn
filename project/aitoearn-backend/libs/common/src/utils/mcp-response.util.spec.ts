import { describe, expect, it } from 'vitest'
import { toYamlTextResult } from './mcp-response.util'

describe('mcp-response.util', () => {
  it('序列化 yaml 时会过滤 undefined 并格式化日期', () => {
    const result = toYamlTextResult({
      foo: 'bar',
      optional: undefined,
      nested: {
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    })

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'foo: bar\nnested:\n  createdAt: 2026-04-01T00:00:00.000Z\n',
      }],
    })
  })
})
