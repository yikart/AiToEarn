/*
 * @Author: nevin
 * @Date: 2025-02-06 12:10:04
 * @LastEditTime: 2025-02-06 14:10:51
 * @LastEditors: nevin
 * @Description:
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.guard';

export const IS_MANAGER_KEY = 'isManager';
export const Manager = () => SetMetadata(IS_MANAGER_KEY, true);

@Injectable()
export class ManagerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isManager = this.reflector.getAllAndOverride<boolean>(
      IS_MANAGER_KEY,
      [context.getHandler(), context.getClass()],
    );

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isManager || isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('token不存在,需要管理员权限');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.AUTH_SECRET,
      });

      if (!payload.isManager) {
        throw new UnauthorizedException('需要管理员权限1');
      }

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('需要管理员权限2');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
