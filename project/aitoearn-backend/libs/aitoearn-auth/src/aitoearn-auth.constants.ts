export const IS_PUBLIC_KEY = Symbol('is_public')
export const IS_INTERNAL_KEY = Symbol('is_internal')

/**
 * 标记某个路由额外支持从指定 header 读取 API Key 鉴权。
 * metadata 值为 header 名（字符串），guard 会读取该 header 并尝试按 API Key 解析。
 * 例如 @ApiKeyHeader('x-goog-api-key') 让 Gemini SDK 原生鉴权可用；
 * @ApiKeyHeader('Authorization') 让 Bearer token 在 JWT 校验失败后兜底按 API Key 解析。
 */
export const API_KEY_HEADER_KEY = Symbol('api_key_header')
