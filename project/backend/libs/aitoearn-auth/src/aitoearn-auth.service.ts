import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TokenInfo } from './aitoearn-auth.interface'

@Injectable()
export class AitoearnAuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * 生成Token
   * @param tokenInfo
   * @returns
   */
  generateToken(tokenInfo: TokenInfo): string {
    const payload: TokenInfo = {
      mail: tokenInfo.mail,
      id: tokenInfo.id,
      name: tokenInfo.name,
    }

    return this.jwtService.sign(payload)
  }

  /**
   * 重置Token
   * @param tokenInfo
   * @returns
   */
  resetToken(tokenInfo: TokenInfo): string {
    const payload: TokenInfo = {
      mail: tokenInfo.mail,
      id: tokenInfo.id,
      name: tokenInfo.name,
    }
    return this.jwtService.sign(payload)
  }

  decodeToken(token: string): TokenInfo {
    token = token.replace('Bearer ', '')
    try {
      return this.jwtService.decode(token)
    }
    catch {
      throw new UnauthorizedException()
    }
  }
}
