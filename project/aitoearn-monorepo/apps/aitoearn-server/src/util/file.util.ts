import { buildUrl, zodBuildUrl, zodTrimHost } from '@yikart/aws-s3'
import { config } from '../config'

class FileUtile {
  private hostUrl = config.awsS3.endpoint
  public buildUrl(path = '') {
    if (!path)
      return path
    return buildUrl(this.hostUrl, path)
  }

  zodBuildUrl() {
    return zodBuildUrl(this.hostUrl)
  }

  /**
   * 去除host部分，保留path部分
   * @param url
   * @returns
   */
  public trimHost(url: string) {
    if (!url)
      return url
    return url.replace(this.hostUrl, '')
  }

  zodTrimHost() {
    return zodTrimHost(this.hostUrl)
  }
}
export const fileUtile = new FileUtile()
