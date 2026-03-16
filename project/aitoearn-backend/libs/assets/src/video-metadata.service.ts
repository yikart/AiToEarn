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

@Injectable()
export class VideoMetadataService {
  private readonly logger = new Logger(VideoMetadataService.name)

  constructor(
    private readonly storage: StorageProvider,
    private readonly assetRepository: AssetRepository,
  ) {}

  async probeVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    const { stdout } = await execa('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      videoUrl,
    ], {
      timeout: 60000,
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

  async extractThumbnailFromUrl(videoUrl: string, timeInSeconds: number): Promise<Buffer> {
    const { stdout } = await execa('ffmpeg', [
      '-ss',
      String(timeInSeconds),
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
