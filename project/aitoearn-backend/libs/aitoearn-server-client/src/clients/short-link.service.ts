import { Injectable } from '@nestjs/common'
import { CreateShortLinkOptions, CreateShortLinkResponse } from '@yikart/aitoearn-server-shared'
import { AxiosRequestConfig } from 'axios'
import { BaseService } from './base.service'

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
