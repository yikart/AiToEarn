import { Injectable } from '@nestjs/common'
import { config } from '../config'

@Injectable()
export class ToolsService {
  fileHost = ''
  constructor() {
    this.fileHost = config.fileHost
  }

  /**
   * 文件路径转换为url
   * @param url 参考标题
   * @returns
   */
  filePathToUrl(url: string): string {
    // http开头直接返回
    if (url.startsWith('http'))
      return url
    // return `${this.fileHost}/${url}${zip ? '?x-oss-process=style/zipdes' : ''}`
    return `${this.fileHost}/${url}`
  }
}
