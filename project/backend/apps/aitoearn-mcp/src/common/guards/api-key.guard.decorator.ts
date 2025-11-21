import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetToken = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req['user']
  },
)
