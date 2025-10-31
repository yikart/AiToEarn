import { Injectable } from '@nestjs/common'
import { AccountGroup, CloudSpace } from '@yikart/mongodb'
import { AxiosRequestConfig } from 'axios'
import {
  CreateCloudSpaceDto,
  RenewCloudSpaceDto,
} from '../interfaces'
import { BaseService } from './base.service'

export interface CreateAccountGroupDto {
  userId: string
  name: string
}

@Injectable()
export class CloudSpaceService extends BaseService {
  async createCloudSpace(data: CreateCloudSpaceDto): Promise<CloudSpace> {
    const url = `/internal/cloud-space/create`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<CloudSpace>(url, config)
  }

  async renewCloudSpace(data: RenewCloudSpaceDto): Promise<CloudSpace> {
    const url = `/internal/cloud-space/renew`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<CloudSpace>(url, config)
  }

  async createAccountGroup(data: CreateAccountGroupDto): Promise<AccountGroup> {
    const url = `/internal/cloud-space/create-account-group`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<AccountGroup>(url, config)
  }
}
