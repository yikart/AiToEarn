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
import { IS_INTERNAL_KEY, IS_PUBLIC_KEY } from './aitoearn-auth.constants'

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

    // 1. API Key 认证
    const apiKey = request.headers['x-api-key'] as string | undefined
    if (apiKey) {
      if (!this.options.getTokenInfoByApiKey) {
        throw new UnauthorizedException()
      }
      request['user'] = await this.options.getTokenInfoByApiKey(apiKey)
      return true
    }

    // 2. Bearer Token 认证
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

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.options.secret,
      })
      request['user'] = await this.options.getTokenInfo(payload)
    }
    catch (error) {
      this.logger.debug({
        message: 'token验证失败',
        error,
      })

      if (isPublic)
        return true

      throw new UnauthorizedException()
    }
    return true
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
