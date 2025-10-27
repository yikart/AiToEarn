import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { IS_PUBLIC_KEY } from './aitoearn-auth.constants'

export const GetToken = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    return req['user']
  },
)

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
