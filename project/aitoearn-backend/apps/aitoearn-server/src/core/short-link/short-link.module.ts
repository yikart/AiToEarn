import { Global, Module } from '@nestjs/common'
import { ShortLinkController } from './short-link.controller'
import { ShortLinkService } from './short-link.service'

@Global()
@Module({
  controllers: [ShortLinkController],
  providers: [ShortLinkService],
  exports: [ShortLinkService],
})
export class ShortLinkModule {}
