import { buildUrl, zodBuildUrl, zodTrimHost } from './url.util'

export class FileUtil {
  private static hostUrl: string
  private static cdnEndpoint: string
  private static s3Endpoint: string

  static init(config: { endpoint: string, cdnEndpoint?: string }) {
    this.s3Endpoint = config.endpoint
    this.cdnEndpoint = config.cdnEndpoint || ''
    this.hostUrl = this.cdnEndpoint || this.s3Endpoint
  }

  static buildUrl(path: string): string {
    if (!path)
      return path
    return buildUrl(this.hostUrl, path)
  }

  static zodBuildUrl() {
    return zodBuildUrl(() => this.hostUrl)
  }

  static zodTrimHost() {
    return zodTrimHost(() => this.hostUrl)
  }

  static trimHost(url: string): string {
    if (!url)
      return url

    if (this.cdnEndpoint && url.startsWith(this.cdnEndpoint)) {
      return url.replace(this.cdnEndpoint, '').replace(/^\/+/, '')
    }

    if (url.startsWith(this.s3Endpoint)) {
      return url.replace(this.s3Endpoint, '').replace(/^\/+/, '')
    }

    return url
  }
}
