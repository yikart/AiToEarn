import { Global, Module } from '@nestjs/common'
import { AppReleaseController } from './app-release.controller'
import { AppReleaseService } from './app-release.service'

@Global()
@Module({
  imports: [],
  providers: [AppReleaseService],
  controllers: [AppReleaseController],
})
export class AppReleaseModule {}
