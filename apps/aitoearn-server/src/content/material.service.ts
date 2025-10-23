import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { Material, MaterialRepository, MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { Queue } from 'bullmq'
import { NewMaterial, NewMaterialTask, UpMaterial } from './common'
import { MaterialTaskService } from './materialTask.service'
import { MediaService } from './media.service'
import { MediaGroupService } from './mediaGroup.service'

const MaterialMediaTypeMap = new Map<MaterialType, MediaType>([
  [MaterialType.VIDEO, MediaType.VIDEO],
  [MaterialType.ARTICLE, MediaType.IMG],
])

@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly mediaService: MediaService,
    private readonly mediaGroupService: MediaGroupService,
    private readonly materialTaskService: MaterialTaskService,
    @InjectQueue('bull_material_generate') private materialGenerateQueue: Queue,
  ) { }

  /**
   * 创建
   * @param newData
   * @returns
   */
  async create(newData: NewMaterial) {
    const res = await this.materialRepository.create(newData)
    return res
  }

  /**
   * 批量生成任务
   * @param newData
   * @returns
   */
  async createTask(data: NewMaterialTask) {
    const { coverGroup, mediaGroups, type } = data
    // 验证组不能为空组
    if (coverGroup) {
      const coverGroupIsEmpty = await this.mediaService.checkIsEmptyGroup(coverGroup)
      if (coverGroupIsEmpty)
        throw new AppException(1000, '封面组不能为空组')
    }
    if (mediaGroups && mediaGroups.length > 0) {
      for (const mediaGroupId of mediaGroups) {
        const mediaGroup = await this.mediaGroupService.getInfo(mediaGroupId)
        if (!mediaGroup)
          throw new AppException(1000, '媒体组不存在')

        const needType = MaterialMediaTypeMap.get(type)
        if (!needType)
          throw new AppException(1000, '暂不支持该素材类型')
        if (mediaGroup.type !== needType)
          throw new AppException(1000, '媒体组类型错误')

        const mediaGroupIsEmpty = await this.mediaService.checkIsEmptyGroup(mediaGroupId)

        if (mediaGroupIsEmpty)
          throw new AppException(1000, '内容组不能为空组')
      }
    }
    const res = await this.materialTaskService.addCreateMaterialTask(data)
    return res
  }

  /**
   * 生成任务结果预览
   * @param newData
   * @returns
   */
  async previewTask(taskId: string) {
    const taskInfo = await this.materialTaskService.getInfo(taskId)
    if (!taskInfo)
      throw new AppException(1, '任务信息不存在')

    const res = await this.materialTaskService.doCreateTask(taskInfo, true)
    return res
  }

  /**
   * 开始生成任务
   * @param id
   * @returns
   */
  async startTask(id: string) {
    const taskInfo = await this.materialTaskService.getInfo(id)
    if (!taskInfo)
      throw new AppException(1, '任务信息不存在')

    // 开始任务
    void this.materialGenerateQueue.add(
      'start',
      {
        taskId: taskInfo.id,
      },
      // {
      //   delay: 1000 * 60 * 5,
      // },
    )
    return taskInfo._id
  }

  /**
   * delete material
   * @param id
   * @returns
   */
  async del(id: string) {
    const material = await this.getInfo(id)
    if (!material)
      return true
    const res = await this.materialRepository.delOne(id)
    if (!res)
      return false
    // 删除媒体资源
    if (material.autoDeleteMedia) {
      for (const item of material.mediaList) {
        if (!item.mediaId)
          continue
        this.mediaService.del(item.mediaId)
      }
    }
    return res
  }

  /**
   * 批量删除素材
   * @param ids
   * @returns
   */
  async delByIds(ids: string[]): Promise<boolean> {
    const res = await this.materialRepository.delByIds(ids)
    return res
  }

  /**
   * 更新素材信息
   * @param id
   * @param data
   * @returns
   */
  async updateInfo(id: string, data: UpMaterial): Promise<boolean> {
    const res = await this.materialRepository.updateInfo(id, data)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Material | null> {
    const res = await this.materialRepository.getInfo(id)
    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param userId
   * @param groupId
   * @returns
   */
  async getList(page: TableDto, userId: string, groupId?: string) {
    const res = await this.materialRepository.getList({
      userId,
      groupId,
    }, page)
    return res
  }

  /**
   * 开始生成任务
   * @param id
   * @returns
   */
  async updateStatus(id: string, status: MaterialStatus, message: string) {
    const res = await this.materialRepository.updateStatus(id, status, message)
    return res
  }
}
