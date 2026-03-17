import { Controller, Inject } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssetsService } from '../assets.service'
import { VideoMetadataService } from '../video-metadata.service'
import { AssetsHttpControllerBase } from './assets-http.controller-base'
import { ASSETS_HTTP_OPTIONS, AssetsHttpModuleOptions } from './assets-http.options'

@ApiTags('Assets')
@Controller('/assets')
export class AssetsHttpController extends AssetsHttpControllerBase {
  constructor(
    assetsService: AssetsService,
    videoMetadataService: VideoMetadataService,
    @Inject(ASSETS_HTTP_OPTIONS)
    options: AssetsHttpModuleOptions,
  ) {
    super(assetsService, videoMetadataService, options)
  }
}
