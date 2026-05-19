import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AITOEARN_AUTH_OPTIONS, AitoearnAuthOptions, TokenPayload } from './aitoearn-auth.config'

@Injectable()
export class AitoearnAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AITOEARN_AUTH_OPTIONS)
    private readonly options: AitoearnAuthOptions,
  ) {}

  /**
   * 生成Token
   * @param tokenInfo
   * @returns
   */
  generateToken(tokenInfo: TokenPayload): string {
    const payload: TokenPayload = {
      mail: tokenInfo.mail,
      id: tokenInfo.id,
      name: tokenInfo.name,
      shopDomain: tokenInfo.shopDomain,
    }

    return this.jwtService.sign(payload, {
      secret: this.options.secret,
      expiresIn: this.options.expiresIn,
    })
  }

  /**
   * 重置Token
   * @param tokenInfo
   * @returns
   */
  resetToken(tokenInfo: TokenPayload): string {
    const payload: TokenPayload = {
      mail: tokenInfo.mail,
      id: tokenInfo.id,
      name: tokenInfo.name,
      shopDomain: tokenInfo.shopDomain,
    }
    return this.jwtService.sign(payload, {
      secret: this.options.secret,
      expiresIn: this.options.expiresIn,
    })
  }

  decodeToken(token: string): TokenPayload {
    token = token.replace('Bearer ', '')
    try {
      return this.jwtService.decode(token)
    }
    catch {
      throw new UnauthorizedException()
    }
  }
}
