import * as fs from 'node:fs'
import path from 'node:path'
import axios, { AxiosResponse } from 'axios'
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

export function saveFile(base64String: string, path: string, fileName: string) {
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

export async function urlToBlob(url: string): Promise<Blob> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  })

  return new Blob([response.data], { type: response.headers['content-type'] })
}

export async function fileUrlToBase64(url: string): Promise<string> {
  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
    })

    return Buffer.from(response.data).toString('base64')
  }
  catch (error) {
    throw new Error(`将URL转换为Base64错误: ${error}`)
  }
}

export async function fileUrlToBlob(url: string): Promise<{ blob: Blob, fileName: string }> {
  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
    })

    const contentType
      = response.headers['content-type'] || 'application/octet-stream'
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

export function getFileTypeFromUrl(url: string, newName = false): string {
  const urlParts = url.split('.')
  const extension = urlParts[urlParts.length - 1]
  return newName ? `${uuidv4()}.${extension}` : extension
}

export async function getFileSizeFromUrl(url: string): Promise<number> {
  try {
    const headResponse: AxiosResponse<unknown> = await axios.head(url)
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

export async function chunkedDownloadFile(
  url: string,
  range: [number, number],
): Promise<Buffer<ArrayBuffer>> {
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
    throw new Error(`Failed to get remote file metadata: ${error}, URL: ${url}`)
  }
}
