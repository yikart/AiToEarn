import { Global, Module } from '@nestjs/common'
import { ServerRedisService } from './server-redis.service'

@Global()
@Module({
  providers: [ServerRedisService],
  exports: [ServerRedisService],
})
export class ServerRedisModule {}
