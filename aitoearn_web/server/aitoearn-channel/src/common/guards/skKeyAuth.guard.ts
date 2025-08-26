import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SkKeyService } from '@/core/skKey/skKey.service';

export const GetSkKey = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req['skKey']
  },
)

@Injectable()
export class SkKeyAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly skKeyService: SkKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // 获取令牌sk
    const key = request.headers['sk-key'];

    try {
      const keyInfo = await this.skKeyService.getInfo(key);
      if (!keyInfo) {
        throw new UnauthorizedException('令牌验证失败');
      }
      request['skKey'] = keyInfo
    }
    catch (error) {
      Logger.error(error);
      throw new UnauthorizedException('令牌验证失败');
    }
    return true;
  }
}
