import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    request.is_org = true
    return true
  }
}
