import { Module } from '@nestjs/common'
import { MediaModule } from '../media/media.module'
import { PublishStateService } from '../publish/tasks/publish-state.service'
import { PlatformIntegrationRegistry } from './platforms.registry'

@Module({
  imports: [MediaModule],
  providers: [PlatformIntegrationRegistry, PublishStateService],
  exports: [PlatformIntegrationRegistry, PublishStateService, MediaModule],
})
export class PlatformRegistryModule {}
