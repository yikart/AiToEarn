import type { ExecaError } from 'execa'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdtemp, open, rm } from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { Injectable, Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { Asset, AssetRepository, AssetStatus, AssetType } from '@yikart/mongodb'
import { execa } from 'execa'
import { StorageProvider } from './storage-provider'
import { generateAssetPath, PathGeneratorOptions } from './utils/path-generator'

export interface VideoMetadata {
  width: number
  height: number
  duration: number
  bitrate: number
  frameRate: number
}

export interface ExtractThumbnailOptions {
  timeInSeconds?: number
}

const FFPROBE_USER_AGENT = 'AiToEarn-MediaProbe/1.0'
// httpproxy is required for https inputs when http_proxy is set
const REMOTE_PROTOCOL_WHITELIST = 'http,https,tls,tcp,httpproxy'
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000
const MAX_DOWNLOAD_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

function assertSafeVideoUrl(videoUrl: string): void {
  const url = String(videoUrl ?? '').trim()
  if (url.startsWith('-') || !(url.startsWith('http://') || url.startsWith('https://'))) {
    throw new Error(`Invalid video URL: ${url}`)
  }
}

@Injectable()
export class VideoMetadataService {
  private readonly logger = new Logger(VideoMetadataService.name)

  constructor(
    private readonly storage: StorageProvider,
    private readonly assetRepository: AssetRepository,
  ) {}

  async probeVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    assertSafeVideoUrl(videoUrl)

    const { stdout } = await execa('ffprobe', [
      '-v',
      'error',
      '-user_agent',
      FFPROBE_USER_AGENT,
      '-protocol_whitelist',
      REMOTE_PROTOCOL_WHITELIST,
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      videoUrl,
    ], {
      timeout: 60000,
    }).catch((err: ExecaError) => {
      const stderr = String(err.stderr ?? '').trim()
      throw new Error(err.timedOut
        ? 'ffprobe timed out after 60s'
        : `ffprobe failed: ${stderr.split('\n').pop() || `exit code ${err.exitCode}`}`)
    })

    const probeData = JSON.parse(stdout)
    const videoStream = probeData.streams?.find((s: { codec_type: string }) => s.codec_type === 'video')
    const format = probeData.format

    if (!videoStream) {
      throw new Error('No video stream found')
    }

    const frameRateParts = (videoStream.r_frame_rate || '0/1').split('/')
    const frameRate = frameRateParts.length === 2
      ? Number(frameRateParts[0]) / Number(frameRateParts[1])
      : Number(frameRateParts[0])

    return {
      width: videoStream.width || 0,
      height: videoStream.height || 0,
      duration: Number(format?.duration || videoStream.duration || 0),
      bitrate: Number(format?.bit_rate || 0),
      frameRate: Math.round(frameRate * 100) / 100,
    }
  }

  /**
   * Ensure a remote video is compatible with strict upload targets (e.g. Facebook/Meta,
   * error 1363045): H.264 video codec inside a faststart MP4. Downloads the source,
   * probes it, and transcodes when needed. Returns the original URL when already
   * compatible, otherwise uploads the transcoded file and returns its URL.
   */
  async ensureCompatibleVideo(videoUrl: string, userId = 'system'): Promise<string> {
    assertSafeVideoUrl(videoUrl)

    const workDir = await mkdtemp(path.join(os.tmpdir(), 'aitoearn-video-'))
    const inputPath = path.join(workDir, 'input.video')
    const outputPath = path.join(workDir, 'output.mp4')

    try {
      await this.downloadVideo(videoUrl, inputPath)

      const { stdout } = await execa('ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        inputPath,
      ], {
        timeout: 60000,
      })

      const probeData = JSON.parse(stdout)
      const videoStream = probeData.streams?.find((s: { codec_type: string }) => s.codec_type === 'video')
      const formatName: string = probeData.format?.format_name ?? ''
      const isMp4Container = formatName.split(',').some(f => f === 'mp4' || f === 'mov')

      const needsTranscode = videoStream?.codec_name !== 'h264'
        || !isMp4Container
        || !(await this.hasFaststartMoov(inputPath))

      if (!needsTranscode) {
        return videoUrl
      }

      this.logger.log({ videoUrl, codec: videoStream?.codec_name, formatName }, 'Transcoding video to H.264 faststart mp4')

      await execa('ffmpeg', [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        '-f',
        'mp4',
        outputPath,
      ], {
        timeout: 600000,
      })

      const objectPath = generateAssetPath({
        userId,
        userType: UserType.System,
        type: AssetType.PublishMedia,
        mimeType: 'video/mp4',
        filename: 'compatible.mp4',
        subPath: 'compatible-video',
      })

      await this.storage.putObject(objectPath, createReadStream(outputPath), 'video/mp4')

      return this.storage.buildUrl(objectPath)
    }
    finally {
      await rm(workDir, { recursive: true, force: true })
    }
  }

  private async downloadVideo(videoUrl: string, targetPath: string): Promise<void> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
    try {
      const response = await fetch(videoUrl, {
        headers: { 'user-agent': FFPROBE_USER_AGENT },
        signal: controller.signal,
      })
      if (!response.ok || !response.body) {
        throw new Error(`Failed to download video: HTTP ${response.status}`)
      }

      const declaredLength = Number(response.headers.get('content-length') ?? 0)
      if (declaredLength > MAX_DOWNLOAD_BYTES) {
        throw new Error(`Video too large to download: ${declaredLength} bytes (max ${MAX_DOWNLOAD_BYTES})`)
      }

      let receivedBytes = 0
      await pipeline(
        Readable.fromWeb(response.body as ReadableStream),
        async function* (source) {
          for await (const chunk of source) {
            receivedBytes += (chunk as Buffer).length
            if (receivedBytes > MAX_DOWNLOAD_BYTES) {
              throw new Error(`Video download exceeded size limit of ${MAX_DOWNLOAD_BYTES} bytes`)
            }
            yield chunk
          }
        },
        createWriteStream(targetPath),
      )
    }
    finally {
      clearTimeout(timer)
    }
  }

  private async hasFaststartMoov(filePath: string): Promise<boolean> {
    const handle = await open(filePath, 'r')
    try {
      let offset = 0
      const header = Buffer.alloc(16)
      for (;;) {
        const { bytesRead } = await handle.read(header, 0, 8, offset)
        if (bytesRead < 8) {
          return false
        }
        let boxSize = header.readUInt32BE(0)
        const boxType = header.toString('ascii', 4, 8)
        if (boxSize === 1) {
          const { bytesRead: largeBytesRead } = await handle.read(header, 8, 8, offset + 8)
          if (largeBytesRead < 8) {
            return false
          }
          boxSize = Number(header.readBigUInt64BE(8))
        }
        else if (boxSize === 0) {
          boxSize = Number.MAX_SAFE_INTEGER
        }
        if (boxType === 'moov') {
          return true
        }
        if (boxType === 'mdat') {
          return false
        }
        if (boxSize < 8) {
          return false
        }
        offset += boxSize
      }
    }
    finally {
      await handle.close()
    }
  }

  async extractThumbnailFromUrl(videoUrl: string, timeInSeconds: number): Promise<Buffer> {
    assertSafeVideoUrl(videoUrl)

    const { stdout } = await execa('ffmpeg', [
      '-ss',
      String(timeInSeconds),
      '-protocol_whitelist',
      REMOTE_PROTOCOL_WHITELIST,
      '-i',
      videoUrl,
      '-vframes',
      '1',
      '-f',
      'image2pipe',
      '-vcodec',
      'png',
      '-',
    ], {
      timeout: 60000,
      encoding: 'buffer',
    })

    return Buffer.from(stdout)
  }

  async extractAndSaveThumbnail(
    asset: Asset,
    userId: string,
    userType: UserType = UserType.User,
    options?: ExtractThumbnailOptions,
  ): Promise<{
    thumbnailAsset: Asset
    thumbnailUrl: string
  }> {
    const timeInSeconds = options?.timeInSeconds ?? 1
    const videoUrl = this.storage.buildUrl(asset.path)

    this.logger.debug({ assetId: asset.id, videoUrl, timeInSeconds }, 'Extracting thumbnail from video')

    const thumbnailBuffer = await this.extractThumbnailFromUrl(videoUrl, timeInSeconds)

    const pathOptions: PathGeneratorOptions = {
      userId,
      userType,
      type: AssetType.VideoThumbnail,
      mimeType: 'image/png',
      filename: 'thumbnail.png',
      subPath: `source-${asset.id}`,
    }

    const thumbnailPath = generateAssetPath(pathOptions)

    await this.storage.putObject(thumbnailPath, thumbnailBuffer, 'image/png')

    const thumbnailAsset = await this.assetRepository.create({
      userId,
      userType,
      path: thumbnailPath,
      type: AssetType.VideoThumbnail,
      status: AssetStatus.Confirmed,
      size: thumbnailBuffer.length,
      mimeType: 'image/png',
      filename: 'thumbnail.png',
    })

    const existingMetadata = asset.metadata as Record<string, unknown> | undefined
    const hasVideoMetadata = existingMetadata?.['width'] && existingMetadata?.['height'] && existingMetadata?.['duration']

    let videoMeta: Record<string, unknown> = existingMetadata ?? {}
    if (!hasVideoMetadata) {
      try {
        const probed = await this.probeVideoMetadata(videoUrl)
        videoMeta = { ...existingMetadata, ...probed }
      }
      catch (error) {
        this.logger.warn({ assetId: asset.id, error }, 'Failed to probe video metadata for thumbnail')
      }
    }

    await this.assetRepository.updateById(asset.id, {
      metadata: {
        ...videoMeta,
        cover: thumbnailPath,
      },
    })

    this.logger.debug({ assetId: asset.id, thumbnailAssetId: thumbnailAsset.id }, 'Thumbnail extracted and saved')

    return {
      thumbnailAsset,
      thumbnailUrl: this.storage.buildUrl(thumbnailPath),
    }
  }
}
