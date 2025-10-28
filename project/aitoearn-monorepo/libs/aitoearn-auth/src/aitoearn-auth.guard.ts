import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { AitoearnAuthConfig } from './aitoearn-auth.config'
import { IS_INTERNAL_KEY, IS_PUBLIC_KEY } from './aitoearn-auth.constants'

@Injectable()
export class AitoearnAuthGuard implements CanActivate {
  private readonly logger = new Logger(AitoearnAuthGuard.name)
  private readonly reflector = new Reflector()
  private readonly secret: string
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AitoearnAuthConfig,
  ) {
    this.secret = config.secret
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      if (isPublic) {
        return true
      }
      throw new UnauthorizedException()
    }

    if (token === this.config.internalToken) {
      const isInternal = this.reflector.getAllAndOverride<boolean>(IS_INTERNAL_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      return !!isInternal
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.secret,
      })
      // 以便我们可以在路由处理器中访问它
      request['user'] = payload

      this.logger.debug({
        message: 'token验证成功',
        payload,
      })
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
