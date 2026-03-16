import { createHash } from 'node:crypto'
import { Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { getErrorMessage } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import sizeOf from 'image-size'
import { config } from '../../../../config'
import { VolcengineService } from '../../../ai/libs/volcengine'

/**
 * 火山引擎视频处理工具类
 * 提供视频下载、上传、鉴权等通用功能
 */
export class VolcengineVideoUtils {
  /**
   * 解析 URL 的各个部分
   */
  static splitUrl(url: string): { scheme: string, host: string, path: string, args: string } {
    const urlObj = new URL(url)
    return {
      scheme: `${urlObj.protocol}//`,
      host: urlObj.host,
      path: urlObj.pathname,
      args: urlObj.search || '',
    }
  }

  /**
   * 计算字符串的 MD5 哈希值
   */
  static getMd5(text: string): string {
    return createHash('md5').update(text).digest('hex')
  }

  /**
   * 生成指定长度的随机字符串
   */
  static getRandomString(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }

  /**
   * 生成 A 类型鉴权 URL
   * @param url 基础 URL（完整 URL，如 http://play.vod.com/FileName）
   * @param key 鉴权密钥
   * @param ts 时间戳（Unix 时间戳，秒）
   * @returns 带鉴权参数的完整 URL
   */
  static genTypeAUrl(url: string, key: string, ts: number): string {
    const { scheme, host, path, args } = this.splitUrl(url)
    const signName = 'auth_key' // 固定为 auth_key
    const uid = '0' // 固定为 0
    const randStr = this.getRandomString(10)

    // 计算签名：text = {path}-{ts}-{rand}-{uid}-{key}
    const text = `${path}-${ts}-${randStr}-${uid}-${key}`
    const hash = this.getMd5(text)

    // 生成鉴权参数：auth_key={ts}-{rand}-{uid}-{hash}
    const authArg = `${signName}=${ts}-${randStr}-${uid}-${hash}`

    if (!args) {
      return `${scheme}${host}${path}?${authArg}`
    }
    else {
      return `${scheme}${host}${path}${args}&${authArg}`
    }
  }

  /**
   * 获取图片尺寸
   * @param imageUrl 图片 URL
   * @param logger 日志记录器
   * @returns 图片的宽度和高度
   */
  static async getImageDimensions(
    imageUrl: string,
    logger: Logger,
  ): Promise<{ width: number, height: number }> {
    try {
      logger.debug('[getImageDimensions] Fetching image dimensions', { url: imageUrl })

      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const dimensions = sizeOf(buffer)

      if (!dimensions.width || !dimensions.height) {
        throw new Error('Failed to get image dimensions')
      }

      logger.debug('[getImageDimensions] Image dimensions retrieved', {
        width: dimensions.width,
        height: dimensions.height,
      })

      return {
        width: dimensions.width,
        height: dimensions.height,
      }
    }
    catch (error) {
      const errorMessage = getErrorMessage(error)
      logger.error('[getImageDimensions] Failed to get image dimensions', {
        error: errorMessage,
        url: imageUrl,
      })
      logger.warn('[getImageDimensions] Using default dimensions 1920x1080')
      return { width: 1920, height: 1080 }
    }
  }

  /**
   * 根据 FileName 拼接播放 URL 并下载上传
   * @param fileName 文件路径
   * @param userId 用户 ID
   * @param filenamePrefix 文件名前缀
   * @param subPath 子路径（如模型名称）
   * @param assetsService Assets 服务
   * @param logger 日志记录器
   * @param assetType 资源类型
   * @returns URL 或 undefined
   */
  static async saveVideoFromFileName(
    fileName: string,
    userId: string,
    filenamePrefix: string,
    subPath: string,
    assetsService: AssetsService,
    logger: Logger,
    assetType: AssetType = AssetType.AideoOutput,
  ): Promise<string | undefined> {
    const playbackBaseUrl = config.ai.volcengine.playbackBaseUrl
    const urlAuthPrimaryKey = config.ai.volcengine.urlAuthPrimaryKey

    const normalizedFileName = fileName.startsWith('/') ? fileName : `/${fileName}`
    const baseUrl = `${playbackBaseUrl}${normalizedFileName}`

    const ts = Math.floor(Date.now() / 1000) + 3600
    const playbackUrl = this.genTypeAUrl(baseUrl, urlAuthPrimaryKey, ts)

    logger.debug({ playbackUrl, fileName }, '拼接播放 URL')

    // 使用 fetch 流式下载并上传
    const response = await fetch(playbackUrl)
    if (!response.ok || !response.body) {
      throw new Error(`下载失败: ${response.status}`)
    }

    const contentLength = response.headers.get('content-length')
    const size = contentLength ? Number.parseInt(contentLength, 10) : 0

    logger.debug({ size: `${(size / 1024 / 1024).toFixed(2)} MB` }, '开始流式上传')

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await assetsService.uploadFromStream(userId, buffer, {
      type: assetType,
      mimeType: 'video/mp4',
      size,
    }, subPath)

    return assetsService.buildUrl(result.asset.path)
  }

  /**
   * 从 VID 获取视频并上传
   * @param vid 视频 ID
   * @param userId 用户 ID
   * @param filenamePrefix 文件名前缀
   * @param subPath 子路径（如模型名称）
   * @param volcengineService 火山引擎服务
   * @param assetsService Assets 服务
   * @param logger 日志记录器
   * @param assetType 资源类型
   * @returns URL，如果失败则返回 undefined
   */
  static async saveVideoFromVid(
    vid: string,
    userId: string,
    filenamePrefix: string,
    subPath: string,
    volcengineService: VolcengineService,
    assetsService: AssetsService,
    logger: Logger,
    assetType: AssetType = AssetType.AideoOutput,
  ): Promise<string | undefined> {
    const mediaInfo = await volcengineService.getMediaInfos({
      Vids: vid,
    })

    const sourceInfo = mediaInfo.MediaInfoList?.[0]?.SourceInfo as Record<string, unknown> | undefined

    const fileName = sourceInfo?.['FileName'] as string

    return this.saveVideoFromFileName(
      fileName,
      userId,
      filenamePrefix,
      subPath,
      assetsService,
      logger,
      assetType,
    )
  }
}
