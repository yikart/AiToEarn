/*
 * @Author: nevin
 * @Date: 2022-01-21 09:42:13
 * @LastEditors: nevin
 * @LastEditTime: 2025-02-26 09:20:47
 * @Description: 认证
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenInfo } from './interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * 生成Token
   * @param tokenInfo
   * @returns
   */
  async generateToken(tokenInfo: TokenInfo): Promise<string> {
    const payload: TokenInfo = {
      phone: tokenInfo.phone,
      id: tokenInfo.id,
      name: tokenInfo.name,
      isManager: tokenInfo.isManager,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * 重置Token
   * @param tokenInfo
   * @returns
   */
  async resetToken(tokenInfo: TokenInfo): Promise<string> {
    const payload: TokenInfo = {
      phone: tokenInfo.phone,
      id: tokenInfo.id,
      name: tokenInfo.name,
      isManager: tokenInfo.isManager,
    };
    return this.jwtService.sign(payload);
  }

  async decodeToken(token: string): Promise<TokenInfo> {
    token = token.replace('Bearer ', '');
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token已过期，请重新登录');
      } else {
        throw new UnauthorizedException('Token校验失败，请重新登录');
      }
    }
  }
}
