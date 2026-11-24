// Mirror @deepseek-ai/dsh-mcp-client's tool naming and result projection.
import { createHash } from 'node:crypto'

const MAX_PUBLIC_NAME_LENGTH = 64
const INVALID_NAME_CHARS = /[^A-Za-z0-9_-]/g
const HASH_LENGTH = 12

export function publicToolName(serverName, rawName) {
  const joined = `mcp__${serverName}__${rawName}`
  const normalized = joined.replace(INVALID_NAME_CHARS, '_')
  if (normalized === joined && normalized.length <= MAX_PUBLIC_NAME_LENGTH) return normalized
  const hash = createHash('sha256').update(`${serverName}\0${rawName}`).digest('hex').slice(0, HASH_LENGTH)
  return `${normalized.slice(0, MAX_PUBLIC_NAME_LENGTH - HASH_LENGTH - 1)}_${hash}`
}

function extractText(content, rawName) {
  if (!Array.isArray(content)) return `(${rawName} returned no text content)`
  const parts = []
  for (const value of content) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      parts.push('[unsupported content type: unknown]')
      continue
    }
    switch (value.type) {
      case 'text':
        if (value.text !== undefined) parts.push(value.text)
        break
      case 'image':
        parts.push(`[image: ${value.mimeType ?? 'unknown'}, content discarded]`)
        break
      case 'audio':
        parts.push(`[audio: ${value.mimeType ?? 'unknown'}, content discarded]`)
        break
      case 'resource':
      case 'resource_link':
        parts.push('[resource: content discarded]')
        break
      default:
        parts.push(`[unsupported content type: ${value.type}]`)
    }
  }
  return parts.join('\n') || `(${rawName} returned no text content)`
}

function createOutput(rawName) {
  return {
    schema: {
      type: 'object',
      properties: {
        content: { type: 'array', items: {} },
        structuredContent: {},
      },
      required: ['content'],
      additionalProperties: false,
    },
    render(_args, value) {
      return [{ type: 'text', text: extractText(value?.content, rawName) }]
    },
  }
}

function createExecutor(client, rawName, taskRequired) {
  return async (args, exec) => {
    if (taskRequired) {
      throw new Error(`Tool "${rawName}" requires task-based execution, which this plugin does not support`)
    }
    const argsObject = typeof args === 'object' && args !== null ? args : {}
    const result = await client.callTool(rawName, argsObject, { signal: exec?.signal })
    const content = Array.isArray(result?.content) ? result.content : []
    const text = extractText(content, rawName)
    if (result?.isError === true) throw new Error(text)
    return {
      content: content.length ? content : [{ type: 'text', text }],
      ...(result?.structuredContent === undefined ? {} : { structuredContent: result.structuredContent }),
    }
  }
}

/**
 * Fetch the server's tool list and swap the registered generation.
 * Returns the new disposer map; on any failure the previous generation stays.
 */
export async function syncTools(client, ctx, serverName, previous) {
  const tools = await client.listTools()
  const definitions = new Map()
  for (const tool of tools) {
    if (!tool || typeof tool.name !== 'string' || !tool.name) continue
    const publicName = publicToolName(serverName, tool.name)
    if (definitions.has(publicName)) {
      throw new Error(`aitoearn(${serverName}): server listed tool "${tool.name}" more than once`)
    }
    definitions.set(publicName, {
      name: publicName,
      description: tool.description ?? '',
      parameters: tool.inputSchema ?? { type: 'object', properties: {} },
      output: createOutput(tool.name),
      execute: createExecutor(client, tool.name, tool.execution?.taskSupport === 'required'),
    })
  }

  for (const dispose of previous.values()) dispose()
  const disposers = new Map()
  try {
    for (const [publicName, definition] of definitions) {
      disposers.set(publicName, ctx.tools.register(definition))
    }
  } catch (error) {
    for (const dispose of disposers.values()) dispose()
    ctx.logger?.error?.(`aitoearn(${serverName}): tool registration failed: ${String(error)}`)
    return new Map()
  }
  return disposers
}
