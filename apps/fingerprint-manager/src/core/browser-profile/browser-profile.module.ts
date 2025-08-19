import { MongodbModule } from '@aitoearn/mongodb'
import { Module } from '@nestjs/common'
import { BrowserProfileController } from './browser-profile.controller'
import { BrowserProfileService } from './browser-profile.service'

@Module({
  imports: [MongodbModule],
  controllers: [BrowserProfileController],
  providers: [BrowserProfileService],
  exports: [BrowserProfileService],
})
export class BrowserProfileModule {}
