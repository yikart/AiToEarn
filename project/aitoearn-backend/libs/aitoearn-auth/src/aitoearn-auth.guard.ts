import { createHash } from 'node:crypto'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { ApiKeyRepository, UserRepository, UserStatus } from '@yikart/mongodb'
import { AitoearnAuthConfig } from './aitoearn-auth.config'
import { IS_PUBLIC_KEY } from './aitoearn-auth.constants'

@Injectable()
export class AitoearnAuthGuard implements CanActivate {
  private readonly logger = new Logger(AitoearnAuthGuard.name)
  private readonly reflector = new Reflector()
  private readonly secret: string
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AitoearnAuthConfig,
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.secret = config.secret
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()

    // 1. API Key 认证
    const apiKey = request.headers['x-api-key'] as string | undefined
    if (apiKey) {
      const keyHash = createHash('sha1').update(apiKey).digest('hex')
      const record = await this.apiKeyRepository.getByKeyHash(keyHash)
      if (!record) {
        throw new UnauthorizedException()
      }
      await this.apiKeyRepository.updateLastUsedAt(record.id)
      const user = await this.userRepository.getById(record.userId)
      if (!user || user.isDelete || user.status !== UserStatus.OPEN) {
        throw new UnauthorizedException()
      }
      request['user'] = {
        id: record.userId,
        mail: user.mail,
        name: user.name,
      }
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

    if (token === this.config.internalToken) {
      return true
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.secret,
      })
      request['user'] = payload
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
