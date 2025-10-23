/*
 * @Author: nevin
 * @Date: 2022-01-21 09:42:13
 * @LastEditors: nevin
 * @LastEditTime: 2025-02-26 09:20:47
 * @Description: 认证
 */
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TokenInfo } from './interfaces/auth.interfaces'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * 生成Token
   * @param tokenInfo
   * @returns
   */
  generateToken(tokenInfo: TokenInfo): string {
    const payload: TokenInfo = {
      account: tokenInfo.account,
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
      account: tokenInfo.account,
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
    catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token已过期，请重新登录')
      }
      else {
        throw new UnauthorizedException('Token校验失败，请重新登录')
      }
    }
  }
}
