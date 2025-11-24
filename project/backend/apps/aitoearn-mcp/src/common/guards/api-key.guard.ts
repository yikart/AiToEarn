import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ResponseCode } from '../../libs/common/enums'
import { ApiKeyRepository } from '../../libs/mongodb/repositories'

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key'] || request.query['x-api-key']
    const apiKeyInfo = await this.apiKeyRepository.getByApiKey(apiKey)
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
