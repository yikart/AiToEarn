import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { Material, MaterialGroup } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class ContentService extends BaseService {
  async deleteMaterial(id: string) {
    const url = `/internal/publishing/materials/${id}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
    }
    const res = await this.request<boolean>(
      url,
      config,
    )
    return res
  }

  async getMaterialListByIds(ids: string[]) {
    const url = `/internal/material/list/ids`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { ids },
    }
    return this.request<Material[]>(url, config)
  }

  async optimalByIds(ids: string[]) {
    const url = `/internal/material/optimalByIds`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { ids },
    }
    return this.request<Material[]>(url, config)
  }

  async getGroupInfo(id: string) {
    const url = `/internal/material/group/info`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id },
    }
    return this.request<MaterialGroup>(url, config)
  }

  async optimalInGroup(groupId: string, type?: string) {
    const url = `/internal/material/group/optimal`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { groupId, ...(type && { type }) },
    }
    return this.request<Material>(url, config)
  }

  async increaseMaterialUseCount(id: string) {
    const url = `/internal/material/use/increase`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { id },
    }
    return this.request<boolean>(url, config)
  }
}
