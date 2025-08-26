import { Module } from '@nestjs/common'
import { NatsModule } from '@transports/nats.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  imports: [NatsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
