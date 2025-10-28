import { Module } from '@nestjs/common'
import { FacebookService as FacebookAPIService } from '../../../libs/facebook/facebook.service'
import { InstagramService as InstagramAPIService } from '../../../libs/instagram/instagram.service'
import { LinkedinService as LinkedinAPIService } from '../../../libs/linkedin/linkedin.service'
import { ThreadsService as ThreadsAPIService } from '../../../libs/threads/threads.service'
import { FacebookService } from './facebook.service'
import { InstagramService } from './instagram.service'
import { LinkedinService } from './linkedin.service'
import { MetaController } from './meta.controller'
import { MetaService } from './meta.service'
import { ThreadsService } from './threads.service'

@Module({
  controllers: [MetaController],
  providers: [
    MetaService,
    FacebookService,
    InstagramService,
    ThreadsService,
    LinkedinService,
    FacebookAPIService,
    InstagramAPIService,
    ThreadsAPIService,
    LinkedinAPIService,
  ],
  exports: [MetaService, FacebookService, InstagramService, ThreadsService, LinkedinService],
})
export class MetaModule {}
