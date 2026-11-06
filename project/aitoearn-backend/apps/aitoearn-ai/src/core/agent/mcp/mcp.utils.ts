import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { AiAvailabilityService } from '../../ai-availability'
import { lookup } from 'node:dns/promises'
import { BlockList } from 'node:net'
import { createSdkMcpServer, InferShape, McpSdkServerConfigWithInstance, tool } from '@anthropic-ai/claude-agent-sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Logger } from '@nestjs/common'
import { AppException, FileUtil, getErrorMessage, ResponseCode } from '@yikart/common'
import { z } from 'zod'

// ==================== 媒体 URL 安全校验 ====================

/**
 * 校验传给 ffmpeg/ffprobe 的媒体 URL 是否安全：
 * - 必须是合法的 http/https URL（拒绝 file:// 等非 http scheme，避免读取本地文件）
 * - trim 后不允许以 '-' 开头，避免被 ffmpeg 当作命令行选项解析
 * @param mediaUrl 用户传入的媒体 URL
 * @throws AppException URL 不合法时抛出
 */
export function assertSafeMediaUrl(mediaUrl: string): void {
  const trimmedUrl = mediaUrl.trim()
  if (trimmedUrl.startsWith('-')) {
    throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${mediaUrl}", URL must not start with '-'`)
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedUrl)
  }
  catch {
    throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${mediaUrl}", expected a valid http(s) URL`)
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${mediaUrl}", only http/https URLs are supported`)
  }

  if (!parsedUrl.hostname) {
    throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${mediaUrl}", missing hostname`)
  }
}

const blockedMediaAddresses = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedMediaAddresses.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedMediaAddresses.addSubnet(network, prefix, 'ipv6')
}

async function assertPublicMediaHost(url: URL): Promise<void> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = await lookup(hostname, { all: true, verbatim: true }).catch(() => {
    throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${url.href}", hostname cannot be resolved`)
  })
  const blocked = addresses.some(({ address, family }) => blockedMediaAddresses.check(address, family === 6 ? 'ipv6' : 'ipv4'))
  if (blocked) {
    throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${url.href}", private or reserved network addresses are not allowed`)
  }
}

/**
 * 在交给 ffmpeg/ffprobe 之前解析媒体 URL，防止 SSRF：
 * - 自有存储（cdnEndpoint / endpoint）地址直接放行，私有化部署时它们通常就是内网地址
 * - 其余地址逐跳跟随重定向，每一跳都要求解析到公网地址，ffmpeg 拿到的是最终地址
 * @param mediaUrl 用户传入的媒体 URL
 * @returns 可以交给 ffmpeg/ffprobe 的最终 URL
 * @throws AppException URL 不合法、指向内网/保留地址或重定向过多时抛出
 */
export async function resolveSafeMediaUrl(mediaUrl: string): Promise<string> {
  assertSafeMediaUrl(mediaUrl)
  let currentUrl = new URL(mediaUrl.trim())
  if (FileUtil.isStorageUrl(currentUrl.href)) {
    return currentUrl.href
  }

  for (let hop = 0; hop <= 5; hop++) {
    await assertPublicMediaHost(currentUrl)
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: { range: 'bytes=0-0' },
      signal: AbortSignal.timeout(15000),
    })
    await response.body?.cancel()
    const location = response.headers.get('location')
    if (response.status < 300 || response.status >= 400 || !location) {
      return currentUrl.href
    }
    const nextUrl = new URL(location, currentUrl).href
    assertSafeMediaUrl(nextUrl)
    currentUrl = new URL(nextUrl)
  }

  throw new AppException(ResponseCode.ValidationFailed, `Invalid media URL: "${mediaUrl}", too many redirects`)
}

// httpproxy is required for https inputs when http_proxy is set
export const FFMPEG_REMOTE_PROTOCOL_WHITELIST = 'http,https,tls,tcp,httpproxy'

// ==================== SRT 时间戳工具函数 ====================

/**
 * 将 SRT 时间戳转换为毫秒
 * @param srtTimestamp SRT 格式时间戳 (HH:MM:SS,sss)
 * @returns 毫秒数
 */
export function srtTimestampToMs(srtTimestamp: string): number {
  const [rest, millisecondsString] = srtTimestamp.split(',')
  const milliseconds = Number.parseInt(millisecondsString)
  const [hours, minutes, seconds] = rest.split(':').map(x => Number.parseInt(x))
  const result = milliseconds * 0.001 + seconds + 60 * minutes + 3600 * hours

  // fix odd JS roundings, e.g. timestamp '00:01:20,460' result is 80.46000000000001
  return Math.round(result * 1000)
}

/**
 * 将秒数转换为 SRT 时间戳格式
 * @param seconds 秒数
 * @returns SRT 格式时间戳 (HH:MM:SS,sss)
 */
export function secondsToSrtTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.round((seconds % 1) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
}

type ContentInput = string | unknown[] | Record<string, unknown>

/**
 * 将输入内容转换为 CallToolResult 的 content 格式
 */
function normalizeContent(input: ContentInput): CallToolResult['content'] {
  if (typeof input === 'string') {
    return [{ type: 'text', text: input }]
  }
  if (Array.isArray(input)) {
    if (input.length > 0 && typeof input[0] === 'object' && input[0] !== null && 'type' in input[0]) {
      return input as CallToolResult['content']
    }
    return [{ type: 'text', text: JSON.stringify(input) }]
  }
  if (typeof input === 'object' && input !== null) {
    return [{ type: 'text', text: JSON.stringify(input) }]
  }
  return [{ type: 'text', text: String(input) }]
}

/**
 * 创建成功结果
 * @param content 内容，可以是字符串、数组或对象
 */
export function successResult(content: ContentInput): CallToolResult {
  return {
    content: normalizeContent(content),
  }
}

/**
 * 创建错误结果
 * @param message 错误消息，可以是字符串、数组或对象
 */
export function errorResult(message: ContentInput): CallToolResult {
  return {
    content: normalizeContent(message),
    isError: true,
  }
}

/**
 * 包装工具定义，自动添加日志、错误处理和可用性监控
 * @param logger Logger 实例
 * @param toolName 工具名称
 * @param description 工具描述
 * @param schema Zod Object schema 用于类型验证
 * @param handler 业务逻辑处理器
 * @param aiAvailability AI 可用性监控服务
 * @returns tool 函数的返回值
 */
export function wrapTool<T extends z.ZodRawShape>(
  logger: Logger,
  toolName: string,
  description: string,
  schema: T,
  handler: (params: InferShape<T>) => Promise<CallToolResult>,
  aiAvailability: AiAvailabilityService,
) {
  const availabilityContext = { provider: 'mcp', operation: toolName, module: 'agent' }

  return tool(
    toolName,
    description,
    schema,
    async (params) => {
      try {
        const result = await aiAvailability.execute(
          availabilityContext,
          () => handler(params),
        )
        return result
      }
      catch (error) {
        const errMessage = getErrorMessage(error)

        if (error instanceof AppException) {
          logger.warn({ toolName, code: error.code }, `Tool business error: ${errMessage}`)
          return errorResult(errMessage)
        }

        logger.fatal({ toolName, params }, 'Tool handler error')
        logger.fatal(error, `Tool handler error ${toolName}`)
        return errorResult(errMessage)
      }
    },
  )
}

// ==================== 格式化工具函数 ====================

/**
 * 需要过滤的字段列表（时间戳和 MongoDB 元数据）
 */
const FILTER_FIELDS = ['createdAt', 'updatedAt', 'deletedAt', '__v', '_id']

/**
 * 过滤对象中的不必要字段
 * @param obj 原始对象
 * @param keepFields 保留的字段白名单（可选）
 */
function filterFields<T extends Record<string, unknown>>(obj: T, keepFields?: string[]): Partial<T> {
  if (!obj || typeof obj !== 'object')
    return obj

  const filtered: Partial<T> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (keepFields && !keepFields.includes(key))
      continue

    if (!keepFields && FILTER_FIELDS.includes(key))
      continue

    filtered[key as keyof T] = value as T[keyof T]
  }

  return filtered
}

/**
 * 将对象转换为 YAML 格式字符串（键值对形式）
 * @param obj 对象
 * @param keepFields 保留的字段白名单（可选）
 */
export function formatObject<T extends Record<string, unknown>>(obj: T, keepFields?: string[]): string {
  if (!obj)
    return ''

  const filtered = filterFields(obj, keepFields)
  const lines: string[] = []

  for (const [key, value] of Object.entries(filtered)) {
    if (value === null || value === undefined)
      continue

    let formattedValue: string
    if (typeof value === 'object' && !Array.isArray(value)) {
      formattedValue = JSON.stringify(value)
    }
    else if (Array.isArray(value)) {
      formattedValue = value.join(', ')
    }
    else {
      formattedValue = String(value)
    }

    lines.push(`${key}: ${formattedValue}`)
  }

  return lines.join('\n')
}

/**
 * 将数组转换为格式化列表
 * @param list 数组
 * @param formatter 每项的格式化函数
 */
export function formatList<T>(list: T[], formatter?: (item: T, index: number) => string): string {
  if (!list || list.length === 0)
    return 'No data'

  const lines: string[] = [`Total ${list.length}:`]

  list.forEach((item, index) => {
    const formatted = formatter ? formatter(item, index) : String(item)
    lines.push(`${index + 1}. ${formatted}`)
  })

  return lines.join('\n')
}

// ==================== HTTP MCP 桥接 ====================

/**
 * 创建 HTTP MCP 桥接服务器，将 HTTP MCP 转换为 SDK MCP
 * @param name - MCP 服务器名称
 * @param url - HTTP MCP 端点 URL
 * @param headers - HTTP 请求头（用于认证）
 * @returns SDK MCP Server 配置
 */
export async function createHttpBridgeServer(
  name: string,
  url: string,
  headers: Record<string, string>,
): Promise<McpSdkServerConfigWithInstance> {
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers },
  })
  const client = new Client(
    { name, version: '1.0.0' },
    { capabilities: {} },
  )

  await client.connect(transport)
  const { tools } = await client.listTools()

  const sdkTools = tools.map((mcpTool) => {
    // @ts-expect-error - mcpTool.inputSchema 类型不完全匹配 z.fromJSONSchema 预期的 JSONSchema 类型
    const zodSchema = z.fromJSONSchema(mcpTool.inputSchema)

    // @ts-expect-error - zodSchema 可能是 ZodObject 或其他类型，我们需要提取 shape
    const schema: z.ZodRawShape = zodSchema.shape || {}

    return tool(
      mcpTool.name,
      mcpTool.description || '',
      schema,
      async (params) => {
        const result = await client.callTool({
          name: mcpTool.name,
          arguments: params,
        })
        return result as CallToolResult
      },
    )
  })

  return createSdkMcpServer({
    name,
    version: '1.0.0',
    tools: sdkTools,
  })
}
