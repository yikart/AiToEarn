import type { AccountType } from '@yikart/common'
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import type { Readable } from 'node:stream'
import type { PlatformMediaPolicy, PlatformMediaRules, PublishMediaMetadata } from '../platforms/platforms.interface'
import type { PublishMediaAdaptationOption } from '../platforms/publish-media-adaptation.schema'
import { createReadStream, createWriteStream, openAsBlob } from 'node:fs'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { AppException, ResponseCode } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import axios from 'axios'
import sizeOf from 'image-size'
import { lookup, extension as mimeExtension } from 'mime-types'
import sharp from 'sharp'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms/platforms.exception'
import { PublishMediaType } from '../platforms/platforms.interface'
import { isImageFormatAllowedByMediaRules, listAllowedAdaptationImageFormats, normalizeAdaptationImageFormat, PublishMediaAdaptationImageFormat } from '../platforms/publish-media-adaptation.schema'
import { PublishValidationField, PublishValidationIssue, PublishValidationIssueCode } from '../platforms/publish.schema'

export interface MediaHttpInput {
  platform: AccountType
  url: string
  endpoint: string
  accountId?: string
  taskId?: string
  platformWorkId?: string
}

export interface MediaUploadRange {
  start: number
  end: number
}

export interface MediaUploadSource {
  sizeBytes: number
  contentType?: string
  filename: string
  stream: (range?: MediaUploadRange) => Readable
  blob: (range?: MediaUploadRange) => Promise<Blob>
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    channelMedia?: MediaHttpInput
  }
}

export interface ImageProbe {
  width: number
  height: number
  format: string
  sizeBytes: number
}

export interface VideoProbe {
  width: number
  height: number
  format: string
  durationSec: number
  codec: string
  sizeBytes: number
}

interface ValidateVideoOptions {
  allowUnknownFormat?: boolean
}

type PublishMediaProbe
  = | { type: PublishMediaType.Image, probe: ImageProbe }
    | { type: PublishMediaType.Video, probe: VideoProbe }

export interface ConvertedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
  sizeBytes: number
}

export interface PublishMediaLike {
  url: string
  metadata?: PublishMediaMetadata
  options?: { adaptation?: PublishMediaAdaptationOption }
}

export interface PublishCoverLike {
  url: string
  metadata?: PublishMediaMetadata
  options?: { adaptation?: PublishMediaAdaptationOption }
}

export interface PublishContentMediaLike {
  title?: string
  body?: string
  media: PublishMediaLike[]
  cover?: PublishCoverLike
}

export interface PreparedPublishImage {
  url: string
  width: number
  height: number
  format: string
  sizeBytes: number
}

export type PublishMediaPreparationCache = Map<string, PreparedPublishImage>

export interface PreparePublishContentMediaInput<TContent extends PublishContentMediaLike = PublishContentMediaLike> {
  userId: string
  content: TContent
  mediaRules: PlatformMediaRules
  mediaPolicy?: PlatformMediaPolicy
  cache?: PublishMediaPreparationCache
}

export interface PreparePublishContentMediaResult<TContent extends PublishContentMediaLike = PublishContentMediaLike> {
  content: TContent
  issues: PublishValidationIssue[]
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name)
  private readonly imageConversionSourceMaxBytes = 25 * 1024 * 1024
  private readonly http: AxiosInstance

  constructor(
    private readonly videoMetadataService: VideoMetadataService,
    private readonly assetsService: AssetsService,
  ) {
    this.http = axios.create({
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })
    this.http.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        const input = error.config?.channelMedia
        if (!input) {
          throw error
        }
        throw this.fromAxiosError(error, input)
      },
    )
  }

  async getBuffer(input: MediaHttpInput): Promise<Buffer> {
    return this.downloadBuffer(input.url, input)
  }

  async getStream(input: MediaHttpInput): Promise<Readable> {
    const response = await this.http.get(input.url, {
      responseType: 'stream',
      channelMedia: input,
    })
    return response.data as Readable
  }

  async withUploadSource<T>(
    input: MediaHttpInput,
    handler: (source: MediaUploadSource) => Promise<T>,
  ): Promise<T> {
    const tempDir = await mkdtemp(join(tmpdir(), 'aitoearn-media-'))
    try {
      const response = await this.http.get(input.url, {
        responseType: 'stream',
        channelMedia: input,
      })
      const contentType = this.getHeaderString(response.headers['content-type'])
      const filename = this.getUploadSourceFilename(input.url, contentType)
      const filePath = join(tempDir, filename)

      await pipeline(response.data as Readable, createWriteStream(filePath))
      const fileStats = await stat(filePath)
      const source: MediaUploadSource = {
        sizeBytes: fileStats.size,
        contentType,
        filename,
        stream: range => createReadStream(filePath, range ? { start: range.start, end: range.end } : {}),
        blob: async (range) => {
          const blob = await openAsBlob(filePath, contentType ? { type: contentType } : undefined)
          return range ? blob.slice(range.start, range.end + 1, blob.type) : blob
        },
      }
      return await handler(source)
    }
    finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }

  async head(input: MediaHttpInput): Promise<AxiosResponse['headers']> {
    const response = await this.http.head(input.url, {
      channelMedia: input,
    })
    return response.headers
  }

  async probeImage(url: string): Promise<ImageProbe> {
    const head = await this.http.head(url, { timeout: 15000 })
    const { 'content-length': contentLength } = head.headers
    const sizeBytes = Number(contentLength || 0)
    const contentType = this.getHeaderString(head.headers['content-type'])

    const buffer = await this.downloadBuffer(url)

    const { width = 0, height = 0, type } = sizeOf(buffer)
    const format = type || (contentType ? mimeExtension(contentType) || contentType : undefined) || lookup(url) || 'unknown'

    return { width, height, format, sizeBytes }
  }

  async probeVideo(url: string): Promise<VideoProbe> {
    const head = await this.http.head(url, { timeout: 15000 })
    const { 'content-length': contentLength } = head.headers
    const sizeBytes = Number(contentLength || 0)
    const contentType = this.getHeaderString(head.headers['content-type'])

    const metadata = await this.videoMetadataService.probeVideoMetadata(url)
    const format = this.getUrlExtension(url) || contentType || 'unknown'

    return {
      width: metadata.width,
      height: metadata.height,
      format,
      durationSec: metadata.duration,
      codec: 'unknown',
      sizeBytes,
    }
  }

  validateImage(probe: ImageProbe, rules: PlatformMediaRules, pathPrefix: Array<string | number>): PublishValidationIssue[] {
    const issues: PublishValidationIssue[] = []

    if (rules.maxImageSize && probe.sizeBytes > rules.maxImageSize) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Image, current: probe.sizeBytes, maximum: rules.maxImageSize, unit: 'bytes' },
      })
    }

    if (rules.imageFormats?.length && !rules.imageFormats.includes(probe.format)) {
      issues.push({
        code: PublishValidationIssueCode.UnsupportedFormat,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Image, format: probe.format, allowed: rules.imageFormats.join(', ') },
      })
    }

    if (rules.minImageWidth && probe.width < rules.minImageWidth) {
      issues.push({
        code: PublishValidationIssueCode.TooSmall,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Image, dimension: 'width', current: probe.width, minimum: rules.minImageWidth, unit: 'pixels' },
      })
    }
    if (rules.maxImageWidth && probe.width > rules.maxImageWidth) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Image, dimension: 'width', current: probe.width, maximum: rules.maxImageWidth, unit: 'pixels' },
      })
    }
    if (rules.minImageHeight && probe.height < rules.minImageHeight) {
      issues.push({
        code: PublishValidationIssueCode.TooSmall,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Image, dimension: 'height', current: probe.height, minimum: rules.minImageHeight, unit: 'pixels' },
      })
    }
    if (rules.maxImageHeight && probe.height > rules.maxImageHeight) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Image, dimension: 'height', current: probe.height, maximum: rules.maxImageHeight, unit: 'pixels' },
      })
    }

    if (rules.aspectRatio) {
      const ratio = probe.width / probe.height
      if (rules.aspectRatio.min && ratio < rules.aspectRatio.min) {
        issues.push({
          code: PublishValidationIssueCode.TooSmall,
          path: [...pathPrefix],
          params: { field: PublishValidationField.Image, dimension: 'aspectRatio', current: Math.round(ratio * 100) / 100, minimum: rules.aspectRatio.min },
        })
      }
      if (rules.aspectRatio.max && ratio > rules.aspectRatio.max) {
        issues.push({
          code: PublishValidationIssueCode.TooBig,
          path: [...pathPrefix],
          params: { field: PublishValidationField.Image, dimension: 'aspectRatio', current: Math.round(ratio * 100) / 100, maximum: rules.aspectRatio.max },
        })
      }
    }

    return issues
  }

  validateVideo(probe: VideoProbe, rules: PlatformMediaRules, pathPrefix: Array<string | number>, options: ValidateVideoOptions = {}): PublishValidationIssue[] {
    const issues: PublishValidationIssue[] = []

    if (rules.maxVideoSize && probe.sizeBytes > rules.maxVideoSize) {
      issues.push({
        code: PublishValidationIssueCode.TooBig,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Video, current: probe.sizeBytes, maximum: rules.maxVideoSize, unit: 'bytes' },
      })
    }

    const format = this.normalizeVideoFormat(probe.format)

    if (rules.videoFormats?.length && !rules.videoFormats.includes(format) && !(options.allowUnknownFormat && format === 'unknown')) {
      issues.push({
        code: PublishValidationIssueCode.UnsupportedFormat,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Video, format, allowed: rules.videoFormats.join(', ') },
      })
    }

    if (rules.minVideoDuration !== undefined && probe.durationSec < rules.minVideoDuration) {
      issues.push({
        code: PublishValidationIssueCode.InvalidDuration,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Video, current: probe.durationSec, minimum: rules.minVideoDuration, maximum: rules.maxVideoDuration, unit: 'seconds' },
      })
    }

    if (rules.maxVideoDuration !== undefined && probe.durationSec > rules.maxVideoDuration) {
      issues.push({
        code: PublishValidationIssueCode.InvalidDuration,
        path: [...pathPrefix],
        params: { field: PublishValidationField.Video, current: probe.durationSec, minimum: rules.minVideoDuration, maximum: rules.maxVideoDuration, unit: 'seconds' },
      })
    }

    return issues
  }

  private getUrlExtension(url: string): string | undefined {
    const pathname = this.getUrlPathname(url)
    const extension = extname(pathname).replace('.', '').toLowerCase()
    return extension || undefined
  }

  private getUrlPathname(url: string): string {
    try {
      return new URL(url).pathname
    }
    catch {
      return url.split(/[?#]/)[0]
    }
  }

  private normalizeVideoFormat(format: string): string {
    return (mimeExtension(format) || format).replace('.', '').toLowerCase()
  }

  async validateMedia(content: PublishContentMediaLike, rules: PlatformMediaRules): Promise<PublishValidationIssue[]> {
    const issues: PublishValidationIssue[] = []

    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'flv', 'wmv', 'rmvb', '3gp']
    for (const [i, m] of content.media.entries()) {
      const pathPrefix = ['content', 'media', i]
      const mediaType = this.getMediaType(m)
      const urlExtension = this.getUrlExtension(m.url)
      if (mediaType === PublishMediaType.Video || videoExtensions.includes(urlExtension ?? '')) {
        try {
          const probe = await this.probeVideo(m.url)
          issues.push(...this.validateVideo(probe, rules, pathPrefix, {
            allowUnknownFormat: mediaType === PublishMediaType.Video && !urlExtension,
          }))
        }
        catch (err) {
          this.logger.warn(err, `Failed to probe video ${m.url}`)
          issues.push({
            code: PublishValidationIssueCode.InvalidUrl,
            path: pathPrefix,
            params: { field: PublishValidationField.Video, url: m.url },
          })
        }
      }
      else {
        try {
          const probe = await this.probeImage(m.url)
          issues.push(...this.validateImage(probe, rules, pathPrefix))
        }
        catch (err) {
          this.logger.warn(err, `Failed to probe image ${m.url}`)
          issues.push({
            code: PublishValidationIssueCode.InvalidUrl,
            path: pathPrefix,
            params: { field: PublishValidationField.Image, url: m.url },
          })
        }
      }
    }
    if (content.cover?.url) {
      const pathPrefix = ['content', 'cover']
      try {
        const probe = await this.probeImage(content.cover.url)
        issues.push(...this.validateImage(probe, rules, pathPrefix))
      }
      catch (err) {
        this.logger.warn(err, `Failed to probe cover ${content.cover.url}`)
        issues.push({
          code: PublishValidationIssueCode.InvalidUrl,
          path: pathPrefix,
          params: { field: PublishValidationField.Image, url: content.cover.url },
        })
      }
    }

    return issues
  }

  async preparePublishContentMedia<TContent extends PublishContentMediaLike>(
    input: PreparePublishContentMediaInput<TContent>,
  ): Promise<PreparePublishContentMediaResult<TContent>> {
    const cache = input.cache ?? new Map<string, PreparedPublishImage>()
    const issues: PublishValidationIssue[] = []
    const media: PublishMediaLike[] = []

    for (const [index, item] of input.content.media.entries()) {
      const path = ['content', 'media', index]
      const normalized = await this.normalizePublishMedia(item, path)
      issues.push(...normalized.issues)
      if (normalized.issues.length || normalized.media?.type !== PublishMediaType.Image) {
        media.push(this.stripPublishMediaOptions(normalized.item))
        continue
      }

      const prepared = await this.preparePublishImage({
        userId: input.userId,
        item: normalized.item,
        probe: normalized.media.probe,
        path,
        field: PublishValidationField.Image,
        mediaRules: input.mediaRules,
        mediaPolicy: input.mediaPolicy,
        cache,
      })
      issues.push(...prepared.issues)
      media.push(prepared.item)
    }

    let cover = input.content.cover
    if (input.content.cover?.url) {
      const normalized = await this.normalizePublishCover(input.content.cover, ['content', 'cover'])
      issues.push(...normalized.issues)
      if (normalized.issues.length || !normalized.probe) {
        cover = normalized.item
      }
      else {
        const prepared = await this.preparePublishImage({
          userId: input.userId,
          item: normalized.item,
          probe: normalized.probe,
          path: ['content', 'cover'],
          field: PublishValidationField.Cover,
          mediaRules: input.mediaRules,
          mediaPolicy: input.mediaPolicy,
          cache,
        })
        issues.push(...prepared.issues)
        cover = prepared.item
      }
    }

    return {
      content: issues.length > 0
        ? input.content
        : {
            ...input.content,
            media,
            cover,
          } as TContent,
      issues,
    }
  }

  private async normalizePublishMedia(
    item: PublishMediaLike,
    path: Array<string | number>,
  ): Promise<{ item: PublishMediaLike, media?: PublishMediaProbe, issues: PublishValidationIssue[] }> {
    try {
      const media = await this.probePublishMedia(item)
      return {
        item: {
          ...item,
          metadata: this.getProbeMetadata(media),
        },
        media,
        issues: [],
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to probe media ${item.url}`)
      return {
        item: this.stripPublishMediaOptions(item),
        issues: [{
          code: PublishValidationIssueCode.InvalidUrl,
          path,
          params: { field: PublishValidationField.Media, url: item.url },
        }],
      }
    }
  }

  private async normalizePublishCover(
    item: PublishCoverLike,
    path: Array<string | number>,
  ): Promise<{ item: PublishCoverLike, probe?: ImageProbe, issues: PublishValidationIssue[] }> {
    try {
      const probe = await this.probeImage(item.url)
      return {
        item: {
          ...item,
          metadata: this.getImageMetadata(probe),
        },
        probe,
        issues: [],
      }
    }
    catch (err) {
      this.logger.warn(err, `Failed to probe cover ${item.url}`)
      return {
        item: this.stripPublishMediaOptions(item),
        issues: [{
          code: PublishValidationIssueCode.InvalidUrl,
          path,
          params: { field: PublishValidationField.Cover, url: item.url },
        }],
      }
    }
  }

  private async probePublishMedia(item: PublishMediaLike): Promise<PublishMediaProbe> {
    const type = this.getMediaType(item)
    if (type === PublishMediaType.Video) {
      return { type: PublishMediaType.Video, probe: await this.probeVideo(item.url) }
    }
    if (type === PublishMediaType.Image) {
      return { type: PublishMediaType.Image, probe: await this.probeImage(item.url) }
    }

    const extension = this.getUrlExtension(item.url)
    if (this.isVideoExtension(extension)) {
      return { type: PublishMediaType.Video, probe: await this.probeVideo(item.url) }
    }
    if (this.isImageExtension(extension)) {
      return { type: PublishMediaType.Image, probe: await this.probeImage(item.url) }
    }

    const contentType = await this.getRemoteContentType(item.url)
    if (contentType?.startsWith('video/')) {
      return { type: PublishMediaType.Video, probe: await this.probeVideo(item.url) }
    }
    if (contentType?.startsWith('image/')) {
      return { type: PublishMediaType.Image, probe: await this.probeImage(item.url) }
    }

    try {
      return { type: PublishMediaType.Video, probe: await this.probeVideo(item.url) }
    }
    catch {
      return { type: PublishMediaType.Image, probe: await this.probeImage(item.url) }
    }
  }

  async convertImage(url: string, policy: PlatformMediaPolicy, maxSourceBytes?: number): Promise<ConvertedImage | null> {
    if (!policy.maxImageWidth && !policy.maxImageHeight && !policy.imageConvertFormat) {
      return null
    }

    const sourceBuffer = await this.downloadBuffer(url, undefined, maxSourceBytes)
    let image = sharp(sourceBuffer)

    const metadata = await image.metadata()
    const currentWidth = metadata.width ?? 0
    const currentHeight = metadata.height ?? 0

    let targetWidth = currentWidth
    let targetHeight = currentHeight
    if (policy.maxImageWidth && currentWidth > policy.maxImageWidth) {
      const ratio = policy.maxImageWidth / currentWidth
      targetWidth = policy.maxImageWidth
      targetHeight = Math.round(currentHeight * ratio)
    }
    if (policy.maxImageHeight && targetHeight > policy.maxImageHeight) {
      const ratio = policy.maxImageHeight / targetHeight
      targetHeight = policy.maxImageHeight
      targetWidth = Math.round(targetWidth * ratio)
    }

    if (targetWidth !== currentWidth || targetHeight !== currentHeight) {
      image = image.resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
    }

    const format = policy.imageConvertFormat ?? metadata.format ?? 'jpeg'
    const quality = policy.imageQuality ?? 90
    if (format === 'png') {
      image = image.png({ quality })
    }
    else if (format === 'webp') {
      image = image.webp({ quality })
    }
    else {
      image = image.jpeg({ quality })
    }

    const convertedBuffer = await image.toBuffer()

    return {
      buffer: convertedBuffer,
      width: targetWidth,
      height: targetHeight,
      format,
      sizeBytes: convertedBuffer.length,
    }
  }

  private async preparePublishImage<TItem extends PublishMediaLike | PublishCoverLike>(input: {
    userId: string
    item: TItem
    probe: ImageProbe
    path: Array<string | number>
    field: PublishValidationField
    mediaRules: PlatformMediaRules
    mediaPolicy?: PlatformMediaPolicy
    cache: PublishMediaPreparationCache
  }): Promise<{ item: TItem, issues: PublishValidationIssue[] }> {
    const item = this.stripPublishMediaOptions(input.item)
    const imageFormat = input.item.options?.adaptation?.imageFormat
    if (!imageFormat || imageFormat === PublishMediaAdaptationImageFormat.Off) {
      return { item, issues: [] }
    }

    if (!this.isHttpUrl(input.item.url)) {
      return {
        item,
        issues: [{
          code: PublishValidationIssueCode.InvalidUrl,
          path: input.path,
          params: { field: input.field, url: input.item.url },
        }],
      }
    }

    const sourceFormat = normalizeAdaptationImageFormat(mimeExtension(input.probe.format) || input.probe.format)
    const needsResize = Boolean(input.mediaPolicy?.maxImageWidth || input.mediaPolicy?.maxImageHeight)
    const targetFormat = this.resolveTargetImageFormat(imageFormat, sourceFormat, input.mediaRules, needsResize)
    if (!targetFormat) {
      return {
        item,
        issues: [{
          code: PublishValidationIssueCode.InvalidOption,
          path: [...input.path, 'options', 'adaptation', 'imageFormat'],
          params: {
            field: PublishValidationField.Option,
            current: imageFormat,
            allowed: listAllowedAdaptationImageFormats(input.mediaRules).join(', '),
          },
        }],
      }
    }
    if (sourceFormat === targetFormat && !needsResize) {
      return { item, issues: [] }
    }

    const cacheKey = this.getPublishImageCacheKey(input.item.url, targetFormat, input.mediaPolicy)
    const cached = input.cache.get(cacheKey)
    if (cached) {
      const issues = this.validatePreparedImageSize(cached.sizeBytes, input.mediaRules, input.path, input.field)
      return {
        item: issues.length ? item : { ...item, url: cached.url, metadata: this.getPreparedImageMetadata(cached) } as TItem,
        issues,
      }
    }

    const sourceSizeBytes = await this.getRemoteContentLength(input.item.url)
    if (sourceSizeBytes && sourceSizeBytes > this.imageConversionSourceMaxBytes) {
      return {
        item,
        issues: [{
          code: PublishValidationIssueCode.TooBig,
          path: input.path,
          params: { field: input.field, current: sourceSizeBytes, maximum: this.imageConversionSourceMaxBytes, unit: 'bytes' },
        }],
      }
    }

    let converted: ConvertedImage | null
    try {
      converted = await this.convertImage(input.item.url, {
        ...input.mediaPolicy,
        imageConvertFormat: targetFormat,
      }, this.imageConversionSourceMaxBytes)
    }
    catch (err) {
      this.logger.warn(err, `Failed to convert image ${input.item.url}`)
      return {
        item,
        issues: [{
          code: PublishValidationIssueCode.InvalidUrl,
          path: input.path,
          params: { field: input.field, url: input.item.url },
        }],
      }
    }

    if (!converted) {
      return { item, issues: [] }
    }

    const sizeIssues = this.validatePreparedImageSize(converted.sizeBytes, input.mediaRules, input.path, input.field)
    if (sizeIssues.length) {
      return { item, issues: sizeIssues }
    }

    const upload = await this.assetsService.uploadFromBuffer(input.userId, converted.buffer, {
      type: AssetType.PublishMedia,
      mimeType: this.getImageMimeType(targetFormat),
      metadata: {
        width: converted.width,
        height: converted.height,
      },
    })
    const prepared = {
      url: upload.url,
      width: converted.width,
      height: converted.height,
      format: targetFormat,
      sizeBytes: converted.sizeBytes,
    }
    input.cache.set(cacheKey, prepared)

    return {
      item: { ...item, url: upload.url, metadata: this.getPreparedImageMetadata(prepared) } as TItem,
      issues: [],
    }
  }

  private resolveTargetImageFormat(
    imageFormat: PublishMediaAdaptationImageFormat,
    sourceFormat: string | undefined,
    rules: PlatformMediaRules,
    needsResize: boolean,
  ): PublishMediaAdaptationImageFormat | undefined {
    if (imageFormat === PublishMediaAdaptationImageFormat.Auto) {
      if (!needsResize && isImageFormatAllowedByMediaRules(sourceFormat, rules)) {
        return sourceFormat as PublishMediaAdaptationImageFormat
      }
      return listAllowedAdaptationImageFormats(rules)[0]
    }
    return listAllowedAdaptationImageFormats(rules).includes(imageFormat)
      ? imageFormat
      : undefined
  }

  private stripPublishMediaOptions<TItem extends PublishMediaLike | PublishCoverLike>(item: TItem): TItem {
    if (!item.options) {
      return item
    }
    const options = { ...item.options }
    delete options.adaptation
    if (Object.keys(options).length) {
      return { ...item, options } as TItem
    }
    const rest = { ...item }
    delete rest.options
    return rest as TItem
  }

  private validatePreparedImageSize(
    sizeBytes: number,
    rules: PlatformMediaRules,
    path: Array<string | number>,
    field: PublishValidationField,
  ): PublishValidationIssue[] {
    if (!rules.maxImageSize || sizeBytes <= rules.maxImageSize) {
      return []
    }
    return [{
      code: PublishValidationIssueCode.TooBig,
      path,
      params: { field, current: sizeBytes, maximum: rules.maxImageSize, unit: 'bytes' },
    }]
  }

  private getPublishImageCacheKey(url: string, targetFormat: PublishMediaAdaptationImageFormat, policy?: PlatformMediaPolicy): string {
    return [
      url,
      targetFormat,
      policy?.maxImageWidth ?? '',
      policy?.maxImageHeight ?? '',
      policy?.imageQuality ?? '',
    ].join('|')
  }

  private getImageMimeType(format: PublishMediaAdaptationImageFormat): string {
    if (format === PublishMediaAdaptationImageFormat.Png) {
      return 'image/png'
    }
    if (format === PublishMediaAdaptationImageFormat.Webp) {
      return 'image/webp'
    }
    return 'image/jpeg'
  }

  private getProbeMetadata(media: PublishMediaProbe): PublishMediaMetadata {
    return media.type === PublishMediaType.Video
      ? this.getVideoMetadata(media.probe)
      : this.getImageMetadata(media.probe)
  }

  private getImageMetadata(probe: ImageProbe): PublishMediaMetadata {
    return {
      type: PublishMediaType.Image,
      width: probe.width,
      height: probe.height,
      format: probe.format,
      sizeBytes: probe.sizeBytes,
    }
  }

  private getVideoMetadata(probe: VideoProbe): PublishMediaMetadata {
    return {
      type: PublishMediaType.Video,
      width: probe.width,
      height: probe.height,
      durationSec: probe.durationSec,
      codec: probe.codec,
      format: probe.format,
      sizeBytes: probe.sizeBytes,
    }
  }

  private getPreparedImageMetadata(prepared: PreparedPublishImage): PublishMediaMetadata {
    return {
      type: PublishMediaType.Image,
      width: prepared.width,
      height: prepared.height,
      format: prepared.format,
      sizeBytes: prepared.sizeBytes,
    }
  }

  private async getRemoteContentType(url: string): Promise<string | undefined> {
    try {
      const response = await this.http.head(url, { timeout: 15000 })
      return this.getHeaderString(response.headers['content-type'])?.toLowerCase()
    }
    catch {
      return undefined
    }
  }

  private async getRemoteContentLength(url: string): Promise<number | undefined> {
    try {
      const response = await this.http.head(url, { timeout: 15000 })
      const contentLength = response.headers['content-length']
      const value = Array.isArray(contentLength) ? contentLength[0] : contentLength
      const size = Number(value)
      return Number.isFinite(size) && size > 0 ? size : undefined
    }
    catch {
      return undefined
    }
  }

  private isHttpUrl(url: string): boolean {
    try {
      const protocol = new URL(url).protocol
      return protocol === 'http:' || protocol === 'https:'
    }
    catch {
      return false
    }
  }

  private isVideoExtension(extension: string | undefined): boolean {
    return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'flv', 'wmv', 'rmvb', '3gp'].includes(extension ?? '')
  }

  private isImageExtension(extension: string | undefined): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(extension ?? '')
  }

  private async downloadBuffer(url: string, input?: MediaHttpInput, maxBytes?: number): Promise<Buffer> {
    const response = await this.http.get<ArrayBuffer | Buffer>(url, {
      responseType: 'arraybuffer',
      maxContentLength: maxBytes ?? Infinity,
      maxBodyLength: maxBytes ?? Infinity,
      ...(input ? { channelMedia: input } : {}),
    })
    const buffer = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data)
    if (maxBytes && buffer.length > maxBytes) {
      if (!input) {
        throw new AppException(ResponseCode.ChannelPlatformMediaProcessingFailed, {
          reasonCode: 'media_exceeds_max_bytes',
          maxBytes,
          sizeBytes: buffer.length,
        })
      }
      throw new ChannelPlatformException({
        code: ResponseCode.ChannelPlatformMediaProcessingFailed,
        platform: input.platform,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: input.endpoint,
          taskId: input.taskId,
          accountId: input.accountId,
          platformWorkId: input.platformWorkId,
        },
        cause: {
          type: PlatformErrorCauseType.Platform,
          platformMessage: 'Media exceeds maximum byte size',
          raw: {
            reasonCode: 'media_exceeds_max_bytes',
            maxBytes,
            sizeBytes: buffer.length,
          },
        },
        retryable: false,
      })
    }
    return buffer
  }

  private getUploadSourceFilename(url: string, contentType?: string): string {
    const filename = basename(this.getUrlPathname(url))
    if (filename && filename !== '.' && filename !== '/') {
      return filename
    }
    const extension = contentType ? mimeExtension(contentType) : undefined
    return extension ? `media.${extension}` : 'media'
  }

  private getMediaType(media: { metadata?: { type?: unknown } }): PublishMediaType | undefined {
    const type = media.metadata?.type
    return type === PublishMediaType.Image || type === PublishMediaType.Video ? type : undefined
  }

  private getHeaderString(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      return typeof value[0] === 'string' ? value[0] : undefined
    }
    return typeof value === 'string' ? value : undefined
  }

  private fromAxiosError(error: AxiosError, input: MediaHttpInput): ChannelPlatformException {
    const response = error.response

    return new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformMediaProcessingFailed,
      platform: input.platform,
      category: response ? PlatformErrorCategory.MediaUnavailable : PlatformErrorCategory.Network,
      context: {
        endpoint: input.endpoint,
        taskId: input.taskId,
        accountId: input.accountId,
        platformWorkId: input.platformWorkId,
        metadata: { url: input.url },
      },
      cause: {
        type: response ? PlatformErrorCauseType.Http : PlatformErrorCauseType.Network,
        httpStatus: response?.status,
        platformMessage: error.message,
        raw: response?.data ?? error.toJSON(),
      },
      retryable: !response || response.status === 408 || response.status === 429 || response.status >= 500,
    })
  }
}
