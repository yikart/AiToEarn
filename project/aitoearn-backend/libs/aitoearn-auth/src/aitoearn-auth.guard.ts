import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { AITOEARN_AUTH_OPTIONS, AitoearnAuthOptions, TokenPayload } from './aitoearn-auth.config'
import { API_KEY_HEADER_KEY, IS_INTERNAL_KEY, IS_PUBLIC_KEY } from './aitoearn-auth.constants'

@Injectable()
export class AitoearnAuthGuard implements CanActivate {
  private readonly logger = new Logger(AitoearnAuthGuard.name)
  private readonly reflector = new Reflector()
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AITOEARN_AUTH_OPTIONS)
    private readonly options: AitoearnAuthOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const isInternal = this.reflector.getAllAndOverride<boolean>(IS_INTERNAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()

    if (isInternal) {
      const token = this.extractTokenFromHeader(request)
      if (token === this.options.internalToken) {
        return true
      }
      throw new UnauthorizedException()
    }

    // 1. API Key 认证（x-api-key，既有行为，对所有路由生效）
    const apiKey = request.headers['x-api-key'] as string | undefined
    if (apiKey) {
      await this.resolveApiKey(request, apiKey)
      return true
    }

    // 2. 额外声明的 header（@ApiKeyHeader）按 API Key 解析
    const apiKeyHeader = this.reflector.getAllAndOverride<string>(API_KEY_HEADER_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (apiKeyHeader) {
      // Authorization 特殊处理：优先按 JWT 校验，失败再兜底按 API Key 解析
      if (apiKeyHeader.toLowerCase() === 'authorization') {
        const token = this.extractTokenFromHeader(request)
        if (token && token !== this.options.internalToken) {
          if (await this.tryJwt(request, token)) {
            return true
          }
          await this.resolveApiKey(request, token)
          return true
        }
      }
      else {
        const headerValue = request.headers[apiKeyHeader.toLowerCase()] as string | undefined
        if (headerValue) {
          await this.resolveApiKey(request, headerValue)
          return true
        }
      }
    }

    // 3. Bearer Token 认证（默认 JWT 路径）
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      if (isPublic) {
        return true
      }
      throw new UnauthorizedException()
    }

    if (token === this.options.internalToken) {
      return true
    }

    if (await this.tryJwt(request, token)) {
      return true
    }

    if (isPublic) {
      return true
    }
    throw new UnauthorizedException()
  }

  private async resolveApiKey(request: any, apiKey: string): Promise<void> {
    if (!this.options.getTokenInfoByApiKey) {
      throw new UnauthorizedException()
    }
    request['user'] = await this.options.getTokenInfoByApiKey(apiKey)
  }

  private async tryJwt(request: any, token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.options.secret,
      })
      request['user'] = await this.options.getTokenInfo(payload)
      return true
    }
    catch (error) {
      this.logger.debug({
        message: 'token验证失败',
        error,
      })
      return false
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
