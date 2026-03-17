import { Storage } from '@google-cloud/storage'
import {
  GenerateContentParameters,
  GenerateContentResponse,
  GenerateVideosOperation,
  GenerateVideosParameters,
  GoogleGenAI,
  Modality,
} from '@google/genai'
import { Injectable, Logger } from '@nestjs/common'
import { GeminiKeyPairSelection } from './gemini-key-manager.interface'
import { GeminiKeyManagerService } from './gemini-key-manager.service'
import { GeminiConfig } from './gemini.config'
import {
  GeminiGeneratedImage,
  GeminiImageGenerateRequest,
  GeminiImageGenerateResponse,
  GeminiImageUsage,
  GeminiModalityTokenDetails,
} from './gemini.interface'

export interface CreateVideoResult {
  operation: GenerateVideosOperation
  keyPairId: string
  bucket: string
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name)
  private readonly genAiClient: GoogleGenAI

  constructor(
    private readonly config: GeminiConfig,
    readonly keyManager: GeminiKeyManagerService,
  ) {
    const baseUrl = config.proxyUrl
      ? `${config.proxyUrl}/${config.baseUrl}`
      : config.baseUrl

    this.genAiClient = new GoogleGenAI({
      apiKey: config.apiKey,
      httpOptions: { baseUrl },
    })
  }

  async generateImage(request: GeminiImageGenerateRequest): Promise<GeminiImageGenerateResponse> {
    const { prompt, imageUrls = [], imageSize, aspectRatio } = request
    const model = request.model || 'gemini-3.1-flash-image-preview'

    this.logger.debug({ prompt, imageUrlsCount: imageUrls.length, imageSize, aspectRatio }, 'Starting image generation')

    const parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }> = []

    for (const url of imageUrls) {
      const imageData = await this.fetchImageAsBase64(url)
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      })
    }

    parts.push({ text: prompt })

    const response = await this.genAiClient.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          ...(imageSize && { imageSize }),
          ...(aspectRatio && { aspectRatio }),
        },
      },
    })

    const images: GeminiGeneratedImage[] = []

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ('inlineData' in part && part.inlineData) {
          images.push({
            imageData: Buffer.from(part.inlineData.data!, 'base64'),
            mimeType: part.inlineData.mimeType || 'image/png',
          })
        }
      }
    }

    if (images.length === 0) {
      this.logger.error('No image generated from Gemini API')
      throw new Error('No image generated')
    }

    const usage: GeminiImageUsage | undefined = response.usageMetadata
      ? {
          promptTokenCount: response.usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
          totalTokenCount: response.usageMetadata.totalTokenCount || 0,
          inputTokenDetails: this.extractGeminiModalityTokenDetails((response.usageMetadata as unknown as Record<string, unknown>)['promptTokensDetails']),
          outputTokenDetails: this.extractGeminiModalityTokenDetails((response.usageMetadata as unknown as Record<string, unknown>)['candidatesTokensDetails']),
        }
      : undefined

    this.logger.debug({
      imageCount: images.length,
      totalSize: images.reduce((sum, img) => sum + img.imageData.length, 0),
      usage,
    }, 'Image generation completed')

    return { images, usage }
  }

  private extractGeminiModalityTokenDetails(details: unknown): GeminiModalityTokenDetails | undefined {
    if (!Array.isArray(details)) {
      return undefined
    }

    const result: GeminiModalityTokenDetails = {}

    for (const detail of details) {
      if (typeof detail !== 'object' || detail == null) {
        continue
      }

      const detailRecord = detail as Record<string, unknown>
      const rawModality = detailRecord['modality']
      const rawTokenCount = detailRecord['tokenCount']

      if (typeof rawModality !== 'string') {
        continue
      }

      const modality = rawModality.toLowerCase()
      const tokenCount = typeof rawTokenCount === 'number' ? rawTokenCount : 0

      if (tokenCount <= 0) {
        continue
      }

      if (modality.includes('text')) {
        result.text = (result.text || 0) + tokenCount
      }
      else if (modality.includes('image')) {
        result.image = (result.image || 0) + tokenCount
      }
      else if (modality.includes('audio')) {
        result.audio = (result.audio || 0) + tokenCount
      }
      else if (modality.includes('video')) {
        result.video = (result.video || 0) + tokenCount
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  private async fetchImageAsBase64(url: string): Promise<{ base64: string, mimeType: string }> {
    this.logger.debug({ url }, 'Fetching image as base64')
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      base64: buffer.toString('base64'),
      mimeType: contentType,
    }
  }

  async createVideo(params: GenerateVideosParameters): Promise<CreateVideoResult> {
    return this.executeWithKeyRotation(async (client, selection) => {
      const operation = await client.models.generateVideos(params)
      return {
        operation,
        keyPairId: selection.keyPairId,
        bucket: selection.bucket,
      }
    })
  }

  async getOperation(operation: GenerateVideosOperation): Promise<GenerateVideosOperation> {
    return this.executeWithKeyRotation(async (client) => {
      return await client.operations.getVideosOperation({ operation })
    })
  }

  private async executeWithKeyRotation<T>(
    operation: (client: GoogleGenAI, selection: GeminiKeyPairSelection) => Promise<T>,
    options?: { maxRetries?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const selection = await this.keyManager.selectKeyPair()

      try {
        const result = await operation(selection.genAiClient, selection)
        await this.keyManager.markKeySuccess(selection.keyPairId)
        return result
      }
      catch (error) {
        const analysis = await this.keyManager.markKeyFailed(selection.keyPairId, error)
        this.logger.warn({ keyPairId: selection.keyPairId, attempt, analysis }, 'Vertex AI request failed')

        if (!analysis.shouldSwitchKey || !analysis.retryable || !analysis.hasAlternativeKey) {
          throw error
        }
      }
    }
    throw new Error('All Vertex AI key pairs exhausted')
  }

  async generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
    return this.executeWithKeyRotation(async (client) => {
      return await client.models.generateContent(params)
    })
  }

  async generateContentStream(params: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.executeWithKeyRotation(async (client) => {
      return await client.models.generateContentStream(params)
    })
  }

  async uploadToGcs(buffer: Buffer, options: {
    keyPairId: string
    path: string
    mimeType: string
  }): Promise<string> {
    const storageClient = this.keyManager.getStorageClientByKeyPairId(options.keyPairId)
    const bucketName = this.keyManager.getBucketByKeyPairId(options.keyPairId)

    if (!storageClient || !bucketName) {
      throw new Error(`No storage client/bucket for keyPairId: ${options.keyPairId}`)
    }

    const bucket = storageClient.bucket(bucketName)
    const file = bucket.file(options.path)

    await file.save(buffer, {
      contentType: options.mimeType,
    })

    return `gs://${bucketName}/${options.path}`
  }

  async downloadFromGcs(gcsUri: string, keyPairId: string): Promise<Buffer> {
    let storageClient: Storage | null = this.keyManager.getStorageClientByKeyPairId(keyPairId)

    if (!storageClient) {
      const defaultId = this.keyManager.getDefaultKeyPairId()
      this.logger.warn(
        { keyPairId, defaultId },
        'KeyPairId not found, using default key pair',
      )
      storageClient = this.keyManager.getStorageClientByKeyPairId(defaultId)
      if (!storageClient) {
        throw new Error(`No storage client for keyPairId: ${keyPairId}`)
      }
    }

    return this.downloadWithClient(gcsUri, storageClient)
  }

  private async downloadWithClient(gcsUri: string, storageClient: Storage): Promise<Buffer> {
    const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
    if (!match) {
      throw new Error('Invalid GCS URI')
    }

    const [, bucketName, filePath] = match
    const bucket = storageClient.bucket(bucketName)
    const file = bucket.file(filePath)

    const [buffer] = await file.download()
    return Buffer.from(buffer)
  }
}
