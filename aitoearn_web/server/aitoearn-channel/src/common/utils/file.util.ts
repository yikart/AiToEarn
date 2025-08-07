import * as fs from 'node:fs'
import path from 'node:path'
import { Logger } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import { firstValueFrom } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'

enum Type {
  IMAGE = '图片',
  TXT = '文档',
  MUSIC = '音乐',
  VIDEO = '视频',
  OTHER = '其他',
}

export function getFileType(extName: string) {
  const documents = 'txt doc pdf ppt pps xlsx xls docx'
  const music = 'mp3 wav wma mpa ram ra aac aif m4a'
  const video = 'avi mpg mpe mpeg asf wmv mov qt rm mp4 flv m4v webm ogv ogg'
  const image
    = 'bmp dib pcp dif wmf gif jpg tif eps psd cdr iff tga pcd mpt png jpeg'
  if (image.includes(extName))
    return Type.IMAGE

  if (documents.includes(extName))
    return Type.TXT

  if (music.includes(extName))
    return Type.MUSIC

  if (video.includes(extName))
    return Type.VIDEO

  return Type.OTHER
}

export function getName(fileName: string) {
  if (fileName.includes('.'))
    return fileName.split('.')[0]

  return fileName
}

export function getExtname(fileName: string) {
  return path.extname(fileName).replace('.', '')
}

export function getSize(bytes: number, decimals = 2) {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

/**
 * nodejs存储文件到本地
 * @param base64String
 * @param path
 * @param fileName
 * @returns
 */
export function saveFile(base64String: string, path: string, fileName: string) {
  // 文件不存在则创建文件
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(path + fileName, base64String, 'base64', (err) => {
      if (err) {
        reject(err)
      }
      else {
        resolve(true)
      }
    })
  })
}

/**
 * 文件URL转Blob
 * @param url
 * @returns
 */

export async function urlToBlob(url: string): Promise<Blob> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  })

  return new Blob([response.data], { type: response.headers['content-type'] })
}

/**
 * 将远程文件 URL 转换为 Base64
 * @param url 文件的 URL 地址
 * @returns Base64 字符串
 */
export async function fileUrlToBase64(url: string): Promise<string> {
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
export async function fileUrlToBlob(url: string): Promise<{ blob: Blob, fileName: string }> {
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
export function getFileTypeFromUrl(url: string, newName = false): string {
  const urlParts = url.split('.')
  const extension = urlParts[urlParts.length - 1]
  return newName ? `${uuidv4()}.${extension}` : extension
}

/**
 * 分片下载远程视频文件
 * @param url 视频地址
 * @param upFn
 * @param overFn
 * @param chunkSize 每个分片大小（字节）
 */
export async function streamDownloadAndUpload(
  url: string,
  upFn: (upData: Buffer, partNumber: number) => Promise<any>,
  overFn: (partCount: number) => Promise<any>,
  chunkSize = 1024 * 1024 * 5,
) {
  try {
    let partNumber = 1

    // 获取总大小
    const headResponse: AxiosResponse<unknown> = await firstValueFrom(this.httpService.head(url))
    const totalSize = Number.parseInt(
      headResponse.headers['content-length'],
      10,
    )

    for (let start = 0; start < totalSize; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, totalSize - 1)
      const range = `bytes=${start}-${end}`
      const rangeRes: AxiosResponse<unknown> = await firstValueFrom(
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

/**
 * 获取远程文件大小
 * @param url 文件的 URL 地址
 * @returns
 */
export async function getFileSizeFromUrl(url: string): Promise<number> {
  try {
    const headResponse: AxiosResponse<unknown> = await firstValueFrom(this.httpService.head(url))
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

/**
 * 分片下载文件
 * @param url 远程文件的 URL 地址
 * @param range 分片范围 [start, end]
 * @returns
 */
export async function chunkedDownloadFile(
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

export async function getRemoteFileSize(url: string): Promise<number> {
  try {
    const response = await axios.head(url)
    if (!response.headers['content-length']) {
      throw new Error('Content-Length header is missing')
    }
    const contentLength = Number.parseInt(response.headers['content-length'], 10)
    return contentLength
  }
  catch (error) {
    Logger.error(`Failed to get remote file metadata: ${error}, URL: ${url}`)
    throw new Error(`Failed to get remote file metadata: ${error}, URL: ${url}`)
  }
}
