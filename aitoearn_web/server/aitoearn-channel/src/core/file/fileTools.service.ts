import { IncomingMessage } from 'node:http'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { firstValueFrom } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { config } from '@/config'

@Injectable()
export class FileToolsService {
  private fileHost = ''

  constructor(private readonly httpService: HttpService) {
    this.fileHost = config.oss.hostUrl
  }

  /**
   * 文件路径转换为url
   * @param url 参考标题
   * @param zip 是否压缩
   * @returns
   */
  filePathToUrl(url: string, zip = false): string {
    // http开头直接返回
    if (url.startsWith('http'))
      return url
    return `${this.fileHost}/${url}${zip ? '?x-oss-process=style/zipdes' : ''}`
  }

  /**
   * 将远程文件 URL 转换为 Base64
   * @param url 文件的 URL 地址
   * @returns Base64 字符串
   */
  async fileUrlToBase64(url: string): Promise<string> {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
      })

      // 将响应数据转为 Buffer 并转换为 Base64
      return Buffer.from(response.data).toString('base64')
    }
    catch (error) {
      throw new Error(`将URL转换为Base64错误: ${error}`)
    }
  }

  /**
   * 将远程文件 URL 转换为 Blob
   * @param url 文件的 URL 地址
   * @returns Blob
   */
  async fileUrlToBlob(url: string): Promise<{ blob: Blob, fileName: string }> {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
      })

      const contentType
        = response.headers['content-type'] || 'application/octet-stream'
      // 构建 Blob
      const blob = new Blob([response.data], { type: contentType })
      return {
        blob,
        fileName: url.split('/').pop() || '',
      }
    }
    catch (error) {
      throw new Error(`将URL转换为Blob错误: ${error}`)
    }
  }

  // 根据文件URL获取文件类型
  getFileTypeFromUrl(url: string, newName = false): string {
    const urlParts = url.split('.')
    const extension = urlParts[urlParts.length - 1]
    return newName ? `${uuidv4()}.${extension}` : extension
  }

  /**
   * 将 Node.js IncomingMessage 流转为 Buffer
   * @param stream IncomingMessage 对象
   * @returns Promise<Buffer>
   */
  incomingMessageToBuffer(stream: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', chunk =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  }

  /**
   * 分片下载远程视频文件
   * @param url 视频地址
   * @param upFn
   * @param overFn
   * @param chunkSize 每个分片大小（字节）
   */
  async streamDownloadAndUpload(
    url: string,
    upFn: (upData: Buffer, partNumber: number) => Promise<any>,
    overFn: (partCount: number) => Promise<any>,
    chunkSize = 1024 * 1024 * 5,
  ) {
    try {
      let partNumber = 1

      // 获取总大小
      const headResponse = await firstValueFrom(this.httpService.head(url))
      const totalSize = Number.parseInt(
        headResponse.headers['content-length'],
        10,
      )

      for (let start = 0; start < totalSize; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, totalSize - 1)
        const range = `bytes=${start}-${end}`
        const rangeRes = await firstValueFrom(
          this.httpService.get(url, {
            responseType: 'stream',
            headers: {
              Range: range,
            },
          }),
        )
        const buffer = await this.incomingMessageToBuffer(rangeRes.data)
        await upFn(buffer, partNumber)
        partNumber++
      }
      await overFn(partNumber)
    }
    catch (e) {
      Logger.error(e)
      throw new Error(e)
    }
  }

  async getFileSizeFromUrl(url: string): Promise<number> {
    try {
      const headResponse = await firstValueFrom(this.httpService.head(url))
      const contentLength = Number.parseInt(
        headResponse.headers['content-length'],
        10,
      )
      return contentLength
    }
    catch (error) {
      throw new Error(`获取文件大小错误: ${error}`)
    }
  }

  async chunkedDownloadFile(
    url: string,
    range: [number, number],
  ): Promise<Buffer> {
    try {
      const chunk = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=${range[0]}-${range[1]}`,
        },
      })
      return Buffer.from(chunk.data)
    }
    catch (error) {
      Logger.error('Failed to download file chunk:', error)
      throw new Error(`Failed to download file chunk from ${url}: ${error}`)
    }
  }
}
