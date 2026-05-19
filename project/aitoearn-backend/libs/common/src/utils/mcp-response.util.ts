import { stringify } from 'yaml'

export interface McpTextResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

function normalizeYamlValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeYamlValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, normalizeYamlValue(item)]),
    )
  }

  return value
}

export function toTextResult(text: string, isError = false): McpTextResult {
  return {
    content: [{
      type: 'text',
      text,
    }],
    ...(isError ? { isError: true } : {}),
  }
}

export function toYamlTextResult(data: unknown): McpTextResult {
  return toTextResult(stringify(normalizeYamlValue(data)))
}
