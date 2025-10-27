/*
 * @Author: nevin
 * @Date: 2024-12-22 21:14:15
 * @LastEditTime: 2025-02-25 22:13:11
 * @LastEditors: nevin
 * @Description: 保留原始请求守卫
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_ORIGINAL_KEY = 'isOriginal';
export const Original = () => SetMetadata(IS_ORIGINAL_KEY, true);

@Injectable()
export class OriginalGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPass = this.reflector.getAllAndOverride<boolean>(IS_ORIGINAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPass) {
      // 💡 查看此条件
      return true;
    }

    return true;
  }
}
