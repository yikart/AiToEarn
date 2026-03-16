import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { GooglePlacePreview } from '../interfaces/brand-lib.interface'
import { BaseService } from './base.service'

@Injectable()
export class BrandLibService extends BaseService {
  async getPlacePreview(placeId: string): Promise<GooglePlacePreview> {
    const url = `/brand-lib/place-preview/${placeId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    return this.request<GooglePlacePreview>(url, config)
  }
}
