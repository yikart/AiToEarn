import { Injectable } from '@nestjs/common'
import { AxiosRequestConfig } from 'axios'
import { Material, MaterialGroup, MaterialTask, NewMaterialTask } from '../interfaces'
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

  async optimalInGroup(groupId: string) {
    const url = `/internal/material/group/optimal`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data: { groupId },
    }
    return this.request<Material>(url, config)
  }

  async createMaterialTask(data: NewMaterialTask) {
    const url = `/internal/content/material/createTask`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    return this.request<MaterialTask>(url, config)
  }

  async previewMaterialTask(id: string) {
    const url = `/internal/content/material/preview/${id}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    return this.request<Material>(url, config)
  }

  async startMaterialTask(id: string) {
    const url = `/internal/content/material/start/${id}`
    const config: AxiosRequestConfig = {
      method: 'GET',
    }
    return this.request<string>(url, config)
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
