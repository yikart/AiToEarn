/*
 * @Author: nevin
 * @Date: 2024-12-22 21:14:15
 * @LastEditTime: 2025-02-25 21:33:04
 * @LastEditors: nevin
 * @Description:
 */
import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { config } from '@/config'

export const GetToken = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req['user']
  },
)

// export const PaymentDomainVerify = createParamDecorator(
//   (data: string, ctx: ExecutionContext) => {
//     const req = ctx.switchToHttp().getRequest();
//     const sig = req.headers['stripe-signature']; // 获取stripe签名
//     const body = req.body; // 获取body
//     return { sig, body };
//   },
// );

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 💡 查看此条件
    if (isPublic)
      return true

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token)
      throw new UnauthorizedException()

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: config.jwt.secret,
      })
      // 以便我们可以在路由处理器中访问它
      request['user'] = payload
    }
    catch (error) {
      console.log('token验证失败---', error)

      throw new UnauthorizedException()
    }
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
