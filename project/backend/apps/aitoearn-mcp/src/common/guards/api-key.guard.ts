import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ResponseCode } from '@yikart/common'
import { ApiKeyService } from '../../core/api-key/api-key.service'

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key'] || request.query['x-api-key']
    const apiKeyInfo = await this.apiKeyService.getApiKeyInfo(apiKey)
    if (!apiKeyInfo || !apiKeyInfo.id) {
      throw new UnauthorizedException(ResponseCode.ApiKeyNotFound)
    }
    request['user'] = {
      userId: apiKeyInfo.userId,
      status: apiKeyInfo.status,
      apiKey,
    }
    return true
  }
}
