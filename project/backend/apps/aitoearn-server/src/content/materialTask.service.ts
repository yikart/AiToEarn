/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: MaterialTask materialTask
 */
import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { buildUrl } from '@yikart/aws-s3'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { MaterialStatus, MaterialTaskRepository, MaterialType } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { config } from '../config'
import { MaterialMedia, MaterialTask, MediaType, MediaUrlInfo, NewMaterial, NewMaterialTask } from './common'
import { CreateMaterialTaskDto } from './dto/material.dto'
import { MaterialService } from './material.service'
import { MaterialGroupService } from './materialGroup.service'
import { MediaService } from './media.service'
import { MediaGroupService } from './mediaGroup.service'
import { ContentAiUtil } from './util/ai.util'

export const MaterialMediaTypeMap = new Map<MaterialType, MediaType>([
  [MaterialType.VIDEO, MediaType.VIDEO],
  [MaterialType.ARTICLE, MediaType.IMG],
])
@Injectable()
export class MaterialTaskService {
  logger = new Logger(MaterialTaskService.name)

  constructor(
    readonly redisService: RedisService,
    private readonly materialTaskRepository: MaterialTaskRepository,
    readonly contentAiUtil: ContentAiUtil,
    readonly mediaService: MediaService,
    readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
    private readonly mediaGroupService: MediaGroupService,
    private readonly queueService: QueueService,
  ) { }

  /**
   * Create tasks in batch
   */
  async createTask(data: NewMaterialTask) {
    const { coverGroup, mediaGroups, type } = data
    // Validate groups are not empty
    if (coverGroup) {
      const coverGroupIsEmpty = await this.mediaService.checkIsEmptyGroup(coverGroup)
      if (coverGroupIsEmpty)
        throw new AppException(ResponseCode.MaterialGroupEmpty)
    }
    if (mediaGroups && mediaGroups.length > 0) {
      for (const mediaGroupId of mediaGroups) {
        const mediaGroup = await this.mediaGroupService.getInfo(mediaGroupId)
        if (!mediaGroup)
          throw new AppException(ResponseCode.MediaGroupNotFound)

        const needType = MaterialMediaTypeMap.get(type)
        if (!needType)
          throw new AppException(ResponseCode.MediaGroupTypeNotSupported)
        if (mediaGroup.type !== needType)
          throw new AppException(ResponseCode.MaterialGroupTypeError)

        const mediaGroupIsEmpty = await this.mediaService.checkIsEmptyGroup(mediaGroupId)

        if (mediaGroupIsEmpty)
          throw new AppException(ResponseCode.MaterialGroupEmpty)
      }
    }
    const res = await this.addCreateMaterialTask(data)
    return res
  }

  /**
   * Preview task result
   */
  async previewTask(taskId: string) {
    const taskInfo = await this.getInfo(taskId)
    if (!taskInfo)
      throw new AppException(ResponseCode.MaterialTaskNotFound)

    const res = await this.doCreateTask(taskInfo, true)
    return res
  }

  /**
   * Start task
   */
  async startTask(id: string) {
    const taskInfo = await this.getInfo(id)
    if (!taskInfo)
      throw new AppException(ResponseCode.MaterialTaskNotFound)
    // Start task
    await this.queueService.addMaterialGenerateJob({
      taskId: taskInfo.id,
    })
    return taskInfo._id
  }

  /**
   * Generate 2D array of media
   */
  async generateMediaUrlMap(mediaGroups: string[]) {
    const mediaUrlMap: MediaUrlInfo[][] = []
    for (const materialGroup of mediaGroups) {
      const mediaList = await this.mediaService.getListByGroup(materialGroup)
      const mediaUrlList: MediaUrlInfo[] = []
      for (const media of mediaList) {
        mediaUrlList.push({
          mediaId: media.id,
          url: media.url,
          num: 0,
          type: media.type,
        })
      }
      mediaUrlMap.push(mediaUrlList)
    }

    return mediaUrlMap
  }

  /**
   * Create task info
   */
  async addCreateMaterialTask(inData: CreateMaterialTaskDto) {
    const groupInfo = await this.materialGroupService.getGroupInfo(inData.groupId)
    if (!groupInfo)
      throw new AppException(ResponseCode.GroupInfoNotFound)

    const newData: Partial<MaterialTask> = {
      userId: groupInfo.userId,
      userType: groupInfo.userType,
      groupId: inData.groupId,
      type: groupInfo.type,
      aiModelTag: inData.aiModelTag,
      prompt: inData.prompt,
      systemPrompt: inData.systemPrompt,
      coverGroup: inData.coverGroup,
      mediaGroups: inData.mediaGroups,
      option: inData.option,
      reNum: inData.num,
      autoDeleteMedia: inData.autoDeleteMedia,
    }

    // Media groups
    newData.mediaUrlMap = await this.generateMediaUrlMap(inData.mediaGroups)

    // Cover
    const cover = await this.mediaService.getListByGroup(inData.coverGroup)
    newData.coverUrlList = cover.map(item => ({
      mediaId: item.id,
      url: item.url,
      num: 0,
      type: item.type,
    }))

    const res = await this.materialTaskRepository.create(newData)
    return res
  }

  /**
   * Generate content from media
   */
  async generateMediaContent(
    user: { userId: string, userType: UserType },
    model: string,
    type: MediaType,
    fileUrl: string,
    prompt: string,
    option?: {
      systemPrompt?: string
    },
  ) {
    if (type === MediaType.IMG) {
      const res = await this.contentAiUtil.imgContentByAi(
        user,
        model,
        fileUrl,
        prompt,
        option,
      )
      return res
    }

    if (type === MediaType.VIDEO) {
      const res = await this.contentAiUtil.videoContentByAi(
        user,
        model,
        fileUrl,
        prompt,
        option,
      )
      return res
    }

    return ''
  }

  /**
   * Generate material content
   */
  async generateMaterialContent(
    user: { userId: string, userType: UserType },
    model: string,
    prompt: string,
    option: {
      coverUrl?: string
      systemPrompt?: string
    },
  ) {
    const res = {
      title: '',
      content: '',
    }

    const content = await this.contentAiUtil.getContentByAi(user, model, prompt, option)
    if (!content)
      return res
    res.content = content

    const title = await this.contentAiUtil.getTitleByAi(user, model, content)
    if (!title)
      return res
    res.title = title
    return res
  }

  /**
   * Get content sections
   */
  async getContentItems(
    taskInfo: MaterialTask,
  ) {
    const res: {
      status: -1 | 0 | 1
      message: string
      data: {
        mediaList: MaterialMedia[]
        content: string
      }
    } = {
      status: 0,
      message: '',
      data: {
        mediaList: [],
        content: '',
      },
    }

    for (const mediaUrlList of taskInfo.mediaUrlMap) {
      // 1. Sort mediaUrlList by num ascending
      mediaUrlList.sort((a, b) => a.num - b.num)

      // Pick the first item to generate media content
      const theOne = mediaUrlList[0]
      if (!theOne)
        continue

      const content = await this.generateMediaContent(
        { userId: taskInfo.userId, userType: taskInfo.userType },
        taskInfo.aiModelTag,
        theOne.type,
        buildUrl(config.awsS3.endpoint, theOne.url),
        taskInfo.prompt,
        {
          systemPrompt: taskInfo.systemPrompt,
        },
      )
      if (!content) {
        res.status = -1
        res.message = `${theOne.url} content generation failed`
        return res
      }

      res.data.mediaList.push({
        url: theOne.url,
        type: theOne.type,
        content,
      })
      res.data.content += content

      // Increment media counter
      theOne.num++
    }

    return res
  }

  async create(newData: Partial<MaterialTask>) {
    return await this.materialTaskRepository.create(newData)
  }

  // Add usage count
  private addUseCount(taskInfo: MaterialTask) {
    try {
      const { mediaUrlMap, coverUrlList } = taskInfo
      mediaUrlMap.forEach((mediaUrlList) => {
        mediaUrlList.forEach((mediaUrlInfo) => {
          this.mediaService.addUseCount(mediaUrlInfo.mediaId)
        })
      })

      coverUrlList.forEach((coverUrlInfo) => {
        this.mediaService.addUseCount(coverUrlInfo.mediaId)
      })
    }
    catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * Execute generation task
   */
  async doCreateTask(taskInfo: MaterialTask, preview = false): Promise<{
    status: -1 | 0 | 1
    message: string
    data?: NewMaterial
  }> {
    const res: {
      status: -1 | 0 | 1
      message: string
      data?: NewMaterial
    } = {
      status: 0,
      message: '',
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Task timed out (exceeded 10 minutes)'))
      }, 10 * 60 * 1000)
    })

    const mainTaskPromise = (async () => {
      try {
        const groupInfo = await this.materialGroupService.getGroupInfo(taskInfo.groupId)
        if (!groupInfo) {
          res.status = -1
          res.message = 'Draft group does not exist'
          return res
        }

        // Create initial draft; do not persist in preview
        const newMaterialData: NewMaterial = {
          userId: groupInfo.userId,
          userType: groupInfo.userType,
          groupId: groupInfo.id,
          taskId: taskInfo.id,
          type: groupInfo.type,
          mediaList: [],
          title: '',
          desc: '',
          option: taskInfo.option,
          autoDeleteMedia: false,
          status: MaterialStatus.WAIT,
        }
        const newMaterial = preview
          ? newMaterialData
          : await this.materialService.create(newMaterialData)
        if (!newMaterial) {
          res.status = -1
          res.message = 'Failed to create initial draft'
          return res
        }

        // Generate content and media list
        const {
          status,
          message,
          data: { mediaList },
        } = await this.getContentItems(taskInfo)
        if (status === -1) {
          if (!preview) {
            void this.materialService.updateStatus(
              newMaterial.id,
              MaterialStatus.FAIL,
              message,
            )
          }

          res.status = -1
          res.message = 'Failed to generate content data'
          return res
        }

        // Cover
        const { coverUrlList } = taskInfo
        let theOneCover: MediaUrlInfo = {
          mediaId: '',
          url: '',
          num: 0,
          type: MediaType.IMG,
        }
        if (coverUrlList && coverUrlList.length > 0) {
          coverUrlList.sort((a, b) => a.num - b.num)
          theOneCover = coverUrlList[0]
          theOneCover.num++
        }

        // Generate content with the selected cover
        const contentRes = await this.generateMaterialContent(
          { userId: taskInfo.userId, userType: taskInfo.userType },
          taskInfo.aiModelTag,
          taskInfo.prompt,
          {
            coverUrl: theOneCover.url
              ? buildUrl(config.awsS3.endpoint, theOneCover.url)
              : undefined,
            systemPrompt: taskInfo.systemPrompt,
          },
        )

        // Update draft information
        const updateData = {
          userId: groupInfo.userId,
          groupId: groupInfo.id,
          type: groupInfo.type,
          mediaList,
          title: contentRes.title || '',
          desc: contentRes.content,
          option: taskInfo.option,
          coverUrl: theOneCover.url || undefined,
          status: MaterialStatus.SUCCESS,
          message: 'Created successfully',
        }
        if (preview) {
          res.status = 1
          res.message = 'Preview data generated successfully'
          res.data = {
            id: 'private',
            userType: UserType.User,
            ...updateData,
            autoDeleteMedia: false,
          }
          return res
        }

        // Update database
        const upDbRes = await this.materialService.updateInfo(
          newMaterial.id,
          updateData,
        )
        if (!upDbRes) {
          res.status = -1
          res.message = 'Failed to update content'
          return res
        }

        // Update task
        // Remaining attempts -1
        taskInfo.reNum = taskInfo.reNum - 1

        // Increase usage count for materials
        this.addUseCount(taskInfo)

        // Update task info
        const upRes = await this.update(taskInfo.id, taskInfo)
        if (!upRes) {
          res.status = -1
          res.message = 'Failed to update content'
          return res
        }

        res.status = 1
        res.message = 'Success'
        return res
      }
      catch (error: any) {
        res.status = -1
        res.message = error
        return res
      }
    })()

    // Use Promise.race to implement timeout control
    try {
      const result = await Promise.race([mainTaskPromise, timeoutPromise])
      return result
    }
    catch (error: any) {
      // Update task status on timeout or error
      if (!preview) {
        // If not preview mode, try to update task status to FAIL
        void this.materialService.updateStatus(
          taskInfo.id,
          MaterialStatus.FAIL,
          'Task timed out (exceeded 20 minutes)',
        )
      }

      res.status = -1
      res.message = error.message || 'Task timed out'
      return res
    }
  }

  async update(id: string, newData: Partial<MaterialTask>): Promise<boolean> {
    const res = await this.materialTaskRepository.update(id, newData)
    return res
  }

  async getInfo(id: string) {
    return await this.materialTaskRepository.getInfo(id)
  }
}
