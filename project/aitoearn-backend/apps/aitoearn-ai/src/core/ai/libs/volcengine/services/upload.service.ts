import type {
  FileTypes,
  VodCommitUploadInfoResult,
  VodQueryUploadTaskInfoRequest,
  VodQueryUploadTaskInfoResult,
  VodUploadMaterialRequest,
  VodUploadMediaByUrlRequest,
  VodUploadMediaByUrlResult,
} from '@volcengine/openapi/lib/services/vod/types'
import type {
  UploadFailure,
  UploadResult,
  UploadSuccess,
  VideoStreamInput,
  VideoUrlInput,
} from '../volcengine.interface'
import path from 'node:path'
import { Readable } from 'node:stream'
import { Injectable } from '@nestjs/common'
import { AppException, getErrorDetail, getErrorMessage, ResponseCode } from '@yikart/common'
import axios, { AxiosResponse } from 'axios'
import { VolcengineConfig } from '../volcengine.config'
import { BaseService } from './base.service'

/**
 * Volcengine 上传服务
 * 负责视频上传相关功能：URL 批量拉取、流式上传、上传任务查询
 */
@Injectable()
export class UploadService extends BaseService {
  constructor(config: VolcengineConfig) {
    super(config)
  }

  /**
   * URL 批量拉取上传
   * 将网络上的媒体资源直接拉取到视频点播服务
   */
  async uploadMediaByUrl(
    request: VodUploadMediaByUrlRequest,
  ): Promise<VodUploadMediaByUrlResult> {
    const options: VodUploadMediaByUrlRequest = {
      SpaceName: request.SpaceName || this.config.spaceName,
      URLSets: request.URLSets,
    }

    this.logger.debug({
      spaceName: options.SpaceName,
      urlCount: options.URLSets?.length,
      urls: options.URLSets?.map(u => u.SourceUrl),
    }, '[uploadMediaByUrl] 开始上传')

    try {
      const response = await this.vodService.UploadMediaByUrl(options)

      this.checkApiResponseError(response, 'uploadMediaByUrl', options)

      this.logger.debug({
        jobIds: response.Result.Data?.map(d => d.JobId),
      }, '[uploadMediaByUrl] 上传请求成功')

      return response.Result
    }
    catch (error) {
      this.logger.error({
        ...getErrorDetail(error),
        urls: options.URLSets?.map(u => u.SourceUrl),
      }, '[uploadMediaByUrl] 上传异常')
      throw error
    }
  }

  /**
   * 流式上传
   * 将本地文件以流的方式上传到视频点播服务
   */
  async uploadMaterial(
    request: VodUploadMaterialRequest,
  ): Promise<VodCommitUploadInfoResult> {
    // 添加Functions参数，指定这是音视频（RecordType: 1）而不是素材（RecordType: 2）
    const functions = [
      { Name: 'GetMeta' },
      {
        Name: 'AddOptionInfo',
        Input: {
          RecordType: 1, // 1表示音视频，2表示素材
          Category: 'video',
          Format: request.FileExtension?.replace('.', '').toUpperCase() || 'MP4',
        },
      },
    ]

    const options: VodUploadMaterialRequest = {
      ...request,
      SpaceName: request.SpaceName || this.config.spaceName,
      FileType: 'media' as unknown as FileTypes, // SDK 枚举缺少 'media'，但 API 需要此值
      Functions: JSON.stringify(functions),
    }

    try {
      const response = await this.vodService.UploadMaterial(options)
      this.logger.debug({
        hasResult: !!response.Result,
        hasError: !!response.ResponseMetadata?.Error,
        responseMetadata: response.ResponseMetadata,
      }, '[uploadMaterial] 收到火山引擎响应')

      this.checkApiResponseError(response, 'uploadMaterial', {
        fileName: options.FileName,
        fileExtension: options.FileExtension,
      })

      this.logger.debug({
        vid: response.Result.Data?.Vid,
        posterUri: response.Result.Data?.PosterUri,
      }, '[uploadMaterial] 上传成功')

      return response.Result
    }
    catch (error) {
      this.logger.error({
        ...getErrorDetail(error),
        fileName: options.FileName,
        fileExtension: options.FileExtension,
        fileSize: options.FileSize,
      }, '[uploadMaterial] 上传异常')
      throw error
    }
  }

  /**
   * 查询上传任务状态
   * 查询 URL 批量拉取上传任务的状态
   * @deprecated 使用 getUploadTaskInfo 代替
   */
  async queryUploadTaskInfo(
    request: VodQueryUploadTaskInfoRequest,
  ): Promise<VodQueryUploadTaskInfoResult> {
    return this.getUploadTaskInfo(request)
  }

  /**
   * 获取上传任务状态
   * 查询 URL 批量拉取上传任务的状态
   */
  async getUploadTaskInfo(
    request: VodQueryUploadTaskInfoRequest,
  ): Promise<VodQueryUploadTaskInfoResult> {
    const response = await this.vodService.QueryUploadTaskInfo(request)

    // 调试日志：查看完整响应结构
    const mediaInfoList = response.Result?.Data?.MediaInfoList
    this.logger.debug({
      hasResult: !!response.Result,
      hasData: !!response.Result?.Data,
      mediaInfoCount: mediaInfoList?.length || 0,
      firstTaskState: mediaInfoList?.[0]?.State,
      firstTaskVid: mediaInfoList?.[0]?.Vid,
      firstTaskJobId: mediaInfoList?.[0]?.JobId,
    }, '查询上传任务响应')

    this.checkApiResponseError(response, 'getUploadTaskInfo', request)

    return response.Result
  }

  /**
   * 下载 URL 并使用 stream 方式上传
   * @param url 视频 URL
   * @param options 可选参数（文件名、扩展名等）
   * @returns 上传成功后的 VID
   */
  async downloadUrlAndUploadAsStream(
    url: string,
    options?: VideoUrlInput,
  ): Promise<string> {
    let fileName = options?.fileName
    let fileExtension = options?.fileExtension

    const response: AxiosResponse<NodeJS.ReadableStream> = await axios.get(url, {
      responseType: 'stream',
      timeout: 60000,
      maxContentLength: 1000 * 1024 * 1024,
      maxBodyLength: 1000 * 1024 * 1024,
    })

    const contentLength = response.headers['content-length']
    if (!contentLength) {
      throw new AppException(ResponseCode.VideoUploadFailed, {
        message: '无法获取视频文件大小（响应头缺少 content-length）',
      })
    }
    const fileSize = Number.parseInt(contentLength, 10)

    if (!fileName || !fileExtension) {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const fileNameFromUrl = pathname.split('/').pop() || 'video'

      if (!fileExtension) {
        fileExtension = path.extname(fileNameFromUrl).toLowerCase() || '.mp4'
      }
      else if (!fileExtension.startsWith('.')) {
        fileExtension = `.${fileExtension}`
      }

      if (!fileName) {
        fileName = path.basename(urlObj.pathname)
      }
    }
    fileName = path.basename(fileName, path.extname(fileName))

    this.logger.debug({
      fileName,
      fileExtension,
      fileSize,
      url,
    }, '[downloadUrlAndUploadAsStream] 准备上传')

    const uploadResult = await this.uploadMaterial({
      SpaceName: this.config.spaceName,
      Content: response.data,
      FileSize: fileSize,
      FileName: fileName,
      FileExtension: fileExtension,
    })

    const vid = uploadResult.Data?.Vid
    if (!vid) {
      throw new AppException(ResponseCode.VideoUploadVidNotFound)
    }

    return vid
  }

  /**
   * 批量上传 URL 并获取 vids
   * 使用下载后流式上传的方式，比 URL 批量拉取更快
   */
  async batchUploadUrlsAndGetVids(
    urlInputs: Array<{ url: string, options?: VideoUrlInput }>,
  ): Promise<string[]> {
    const results = await Promise.allSettled(
      urlInputs.map(({ url, options }, index) =>
        this.downloadUrlAndUploadAsStream(url, options)
          .then((vid): UploadSuccess => ({ success: true, vid, url, index }))
          .catch((error): UploadFailure => {
            const errorMessage = getErrorMessage(error)
            this.logger.error({ url, index: index + 1, error: errorMessage }, '批量上传单个视频失败')
            return { success: false, url, index, error: errorMessage }
          }),
      ),
    )

    const allResults = results
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((r): r is UploadResult => r !== null)

    const failedUploads = allResults.filter((r): r is UploadFailure => !r.success)

    if (failedUploads.length > 0) {
      const failureDetails = failedUploads.map(f =>
        `第 ${f.index + 1} 个 (${f.url}): ${f.error}`,
      ).join('\n')
      this.logger.error({ failedCount: failedUploads.length, details: failureDetails }, '批量上传部分失败')
      throw new AppException(ResponseCode.VideoUploadFailed, {
        message: '部分视频上传失败',
        details: failureDetails,
      })
    }

    const vids = allResults
      .filter((r): r is UploadSuccess => r.success)
      .map(r => r.vid)

    return vids
  }

  /**
   * 上传文件流并获取 vid
   */
  async uploadStreamAndGetVid(input: VideoStreamInput): Promise<string> {
    const content: NodeJS.ReadableStream = Buffer.isBuffer(input.stream)
      ? Readable.from(input.stream)
      : input.stream

    const uploadResult = await this.uploadMaterial({
      SpaceName: this.config.spaceName,
      Content: content,
      FileSize: input.fileSize,
      FileName: input.fileName,
      FileExtension: input.fileExtension,
    })

    const vid = uploadResult.Data?.Vid
    if (!vid) {
      throw new AppException(ResponseCode.VideoUploadVidNotFound)
    }

    return vid
  }
}
