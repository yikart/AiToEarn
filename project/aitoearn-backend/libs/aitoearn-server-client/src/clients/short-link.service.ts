import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { BaseService } from './base.service'

export interface CreateShortLinkOptions {
  originalUrl: string
  expiresInSeconds?: number
}

export interface CreateShortLinkResponse {
  shortLink: string
}

@Injectable()
export class ShortLinkService extends BaseService {
  async create(data: CreateShortLinkOptions): Promise<string> {
    const url = '/internal/short-link'
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<CreateShortLinkResponse>(url, config)
    return res.shortLink
  }
}
