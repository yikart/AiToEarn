import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  imports: [
    HttpModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
