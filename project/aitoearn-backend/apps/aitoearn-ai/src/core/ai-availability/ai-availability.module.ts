import { DynamicModule, Global, Module } from '@nestjs/common'
import { AiAvailabilityService } from './ai-availability.service'

@Global()
@Module({})
export class AiAvailabilityModule {
  static forRoot(_config?: unknown): DynamicModule {
    return {
      global: true,
      module: AiAvailabilityModule,
      providers: [
        AiAvailabilityService,
      ],
      exports: [AiAvailabilityService],
    }
  }
}
