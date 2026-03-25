import { basename } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, CommonResponse, ResponseCode } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import axios, { AxiosRequestConfig } from 'axios'
import { config } from '../../config'

interface UploadSignResult {
  id: string
  path: string
  url: string
  uploadUrl: string
}

@Injectable()
export class RelayClientService {
  private readonly logger = new Logger(RelayClientService.name)

  get enabled() {
    return !!config.relay
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', url: path, params })
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', url: path, data })
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', url: path, data })
  }

  async delete<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'DELETE', url: path, data })
  }

  async uploadFileFromLocalUrl(localUrl: string): Promise<string> {
    const filename = basename(new URL(localUrl).pathname)

    const fileResponse = await axios.get(localUrl, { responseType: 'arraybuffer' })
    const contentType = fileResponse.headers['content-type'] || 'application/octet-stream'
    const size = (fileResponse.data as ArrayBuffer).byteLength

    const signResult = await this.post<UploadSignResult>('/assets/uploadSign', {
      filename,
      type: AssetType.PublishMedia,
      size,
    })

    if (!signResult?.uploadUrl) {
      throw new Error(`uploadSign returned no uploadUrl: ${JSON.stringify(signResult)}`)
    }

    await axios.put(signResult.uploadUrl, fileResponse.data, {
      headers: { 'Content-Type': contentType },
    })

    await this.post(`/assets/${signResult.id}/confirm`, {})

    return signResult.url
  }

  private async request<T>(options: AxiosRequestConfig): Promise<T> {
    if (!config.relay) {
      throw new AppException(ResponseCode.RelayServerUnavailable)
    }

    try {
      const response = await axios<CommonResponse<T>>({
        ...options,
        url: `${config.relay.serverUrl}${options.url}`,
        headers: {
          ...options.headers,
          'x-api-key': config.relay.apiKey,
        },
      })
      if (response.data.code !== 0) {
        this.logger.error({ message: 'Relay API returned error', url: options.url, code: response.data.code, relayMessage: response.data.message })
        throw new Error(`Relay API error [${response.data.code}]: ${response.data.message}`)
      }
      return response.data.data as T
    }
    catch (error) {
      this.logger.error(error, `Relay request failed: ${options.url}`)
      throw new AppException(ResponseCode.RelayServerUnavailable)
    }
  }
}
