import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { API_KEY_HEADER_KEY, IS_INTERNAL_KEY, IS_PUBLIC_KEY } from './aitoearn-auth.constants'

export const GetToken = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req['user']
  },
)

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
export const Internal = () => SetMetadata(IS_INTERNAL_KEY, true)

/**
 * 声明该路由额外支持从指定 header 读取 API Key 鉴权。
 * @param headerName 额外兼容的 header 名，例如 'x-goog-api-key'、'Authorization'
 */
export const ApiKeyHeader = (headerName: string) => SetMetadata(API_KEY_HEADER_KEY, headerName)
