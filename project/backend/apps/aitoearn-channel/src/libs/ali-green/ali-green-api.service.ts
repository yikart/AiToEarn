import { randomBytes } from 'node:crypto'
import Green20220302, * as $Green20220302 from '@alicloud/green20220302'
import * as $Util from '@alicloud/tea-util'
/*
 * @Author: white
 * @Date: 2025-09-18 01:15:15
 * @LastEditTime: 2025-09-18 01:42:41
 * @LastEditors: white
 * @Description:
 */
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ALI_GREEN_CLIENT } from './ali-green-api.constants'

@Injectable()
export class AliGreenApiService {
  private readonly logger = new Logger(AliGreenApiService.name)
  constructor(
    @Inject(ALI_GREEN_CLIENT) private readonly client: Green20220302,
  ) {}

  async textGreen(
    content: string,
  ) {
    const textModerationRequest = new $Green20220302.TextModerationPlusRequest({ service: 'comment_detection', serviceParameters: JSON.stringify({ content }) })
    const runtime = new $Util.RuntimeOptions({})
    return this.client
      .textModerationWithOptions(textModerationRequest, runtime)
      .catch((error) => {
        this.logger.error(error.message, content)
        return error.message
      })
  }

  async imgGreen(
    imageUrl: string,
  ) {
    const dataId = randomBytes(4).toString('hex').slice(0, 8)
    const serviceParameters = JSON.stringify({ dataId, imageUrl })
    const imageModerationRequest = new $Green20220302.ImageModerationRequest({ service: 'baselineCheck', serviceParameters })
    const runtime = new $Util.RuntimeOptions({})
    return this.client
      .imageModerationWithOptions(imageModerationRequest, runtime)
      .catch((error) => {
        this.logger.error(error.message, dataId, imageUrl)
        return error.message
      })
  }

  async videoGreen(
    url: string,
  ) {
    const videoModerationRequest = new $Green20220302.VideoModerationRequest({ service: 'videoDetection', serviceParameters: JSON.stringify({ url }) })
    const runtime = new $Util.RuntimeOptions({})
    return this.client
      .videoModerationWithOptions(videoModerationRequest, runtime)
      .catch((error) => {
        this.logger.error(error.message, url)
        return error.message
      })
  }

  async getVideoResult(
    taskId: string,
  ) {
    const videoModerationRequest = new $Green20220302.VideoModerationResultRequest({ service: 'videoDetection', serviceParameters: JSON.stringify({ taskId }) })
    const runtime = new $Util.RuntimeOptions({})
    return this.client
      .videoModerationResultWithOptions(videoModerationRequest, runtime)
      .catch((error) => {
        this.logger.error(error.message, taskId)
        return error.message
      })
  }
}
