/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: MaterialTask materialTask
 */
import { Injectable, Logger } from '@nestjs/common'
import { AppException, UserType } from '@yikart/common'
import { MaterialStatus, MaterialTaskRepository } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { AiService } from '../ai/ai.service'
import { ToolsService } from '../tools/tools.service'
import { MaterialMedia, MaterialTask, MediaType, MediaUrlInfo, NewMaterial } from './common'
import { CreateMaterialTaskDto } from './dto/material.dto'
import { MaterialService } from './material.service'
import { MaterialGroupService } from './materialGroup.service'
import { MediaService } from './media.service'

@Injectable()
export class MaterialTaskService {
  logger = new Logger(MaterialTaskService.name)

  constructor(
    readonly redisService: RedisService,
    private readonly materialTaskRepository: MaterialTaskRepository,
    readonly aiService: AiService,
    readonly toolsService: ToolsService,
    readonly mediaService: MediaService,
    readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
  ) { }

  /**
   * 生成媒体的二维数组
   * @param mediaGroups 媒体组ID数组
   * @returns
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
   * 创建任务信息
   * @param inData
   * @returns
   */
  async addCreateMaterialTask(inData: CreateMaterialTaskDto) {
    const groupInfo = await this.materialGroupService.getGroupInfo(inData.groupId)
    if (!groupInfo)
      throw new AppException(1000, '组信息不存在')

    const newData: Partial<MaterialTask> = {
      userId: groupInfo.userId,
      userType: groupInfo.userType,
      groupId: inData.groupId,
      type: groupInfo.type,
      aiModelTag: inData.aiModelTag,
      prompt: inData.prompt,
      coverGroup: inData.coverGroup,
      mediaGroups: inData.mediaGroups,
      option: inData.option,
      title: inData.title,
      desc: inData.desc,
      reNum: inData.num,
      textMax: inData.textMax,
      language: inData.language,
      autoDeleteMedia: inData.autoDeleteMedia,
    }

    // 媒体组
    newData.mediaUrlMap = await this.generateMediaUrlMap(inData.mediaGroups)

    // 封面
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
   * 生成素材文案内容
   * @param user
   * @param model
   * @param type
   * @param imgUrl
   * @param option
   * @returns
   */
  async generateMediaContent(
    user: { userId: string, userType: UserType },
    model: string,
    type: MediaType,
    fileUrl: string,
    prompt: string,
    option: {
      title?: string
      desc?: string
      max?: number
      language?: string
    },
  ) {
    if (type === MediaType.IMG) {
      const res = await this.aiService.imgContentByAi(
        user,
        model,
        fileUrl,
        prompt,
        option,
      )
      return res
    }

    if (type === MediaType.VIDEO) {
      const res = await this.aiService.videoContentByAi(
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
   * 生成媒体文案内容
   * @param user
   * @param model
   * @param prompt
   * @param option
   * @param coverUrl
   * @returns
   */
  async generateMaterialContent(
    user: { userId: string, userType: UserType },
    model: string,
    prompt: string,
    option: {
      coverUrl?: string
      title?: string
      desc?: string
      max?: number
      language?: string
    },
    coverUrl?: string,
  ) {
    const res = {
      title: option.title,
      content: option.desc,
    }

    const content = await this.aiService.getContentByAi(user, model, prompt, {
      ...option,
      coverUrl,
    })
    if (!content)
      return res
    res.content = content

    const title = await this.aiService.getTitleByAi(user, model, content, {
      ...option,
    })
    if (!title)
      return res
    res.title = title
    return res
  }

  /**
   * 获取内容片段
   */
  async getContentItems(
    taskInfo: {
      mediaUrlMap: MediaUrlInfo[][]
      title?: string
      desc?: string
      textMax?: number
      language?: string
      userId: string
      userType: UserType
      aiModelTag: string
    },
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
      // 1. 根据num的值，重新从小到大排列mediaUrlLiskt
      mediaUrlList.sort((a, b) => a.num - b.num)

      // 取第一张图，进行媒体内容创建
      const theOne = mediaUrlList[0]
      if (!theOne)
        continue

      const content = await this.generateMediaContent(
        { userId: taskInfo.userId, userType: taskInfo.userType },
        taskInfo.aiModelTag,
        theOne.type,
        this.toolsService.filePathToUrl(theOne.url),
        taskInfo.aiModelTag,
        {
          title: taskInfo.title,
          desc: taskInfo.desc,
          max: taskInfo.textMax,
          language: taskInfo.language,
        },
      )
      if (!content) {
        res.status = -1
        res.message = `${theOne.url}生成内容失败`
        return res
      }

      res.data.mediaList.push({
        url: theOne.url,
        type: theOne.type,
        content,
      })
      res.data.content += content

      // 增加媒体的计数
      theOne.num++
    }

    return res
  }

  async create(newData: Partial<MaterialTask>) {
    return await this.materialTaskRepository.create(newData)
  }

  // 添加使用次数
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
   * 进行生成任务
   * @param taskInfo
   * @returns
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

    // 创建一个20分钟的超时Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('任务执行超时（超过10分钟）'))
      }, 10 * 60 * 1000) // 20分钟超时
    })

    const mainTaskPromise = (async () => {
      try {
        const groupInfo = await this.materialGroupService.getGroupInfo(taskInfo.groupId)
        if (!groupInfo) {
          res.status = -1
          res.message = '草稿组不存在'
          return res
        }

        // 创建草稿初始数据 预览不入库
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
        }
        const newMaterial = preview
          ? newMaterialData
          : await this.materialService.create(newMaterialData)
        if (!newMaterial) {
          res.status = -1
          res.message = '创建草稿初始数据失败'
          return res
        }

        // 生成内容和项目列表
        const {
          status,
          message,
          data: { content: dbDesc, mediaList },
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
          res.message = '生成内容数据失败'
          return res
        }

        // 封面
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

        // 传入封面，生成内容
        const contentRes = await this.generateMaterialContent(
          { userId: taskInfo.userId, userType: taskInfo.userType },
          taskInfo.aiModelTag,
          taskInfo.prompt,
          {
            coverUrl: theOneCover.url,
            title: taskInfo.title,
            desc: dbDesc,
            max: taskInfo.textMax,
            language: taskInfo.language,
          },
          theOneCover.url
            ? this.toolsService.filePathToUrl(theOneCover.url)
            : undefined,
        )

        // 更新草稿信息信息
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
          message: '创建成功',
        }
        if (preview) {
          res.status = 1
          res.message = '预览数据成功'
          res.data = {
            id: 'private',
            userType: UserType.User,
            ...updateData,
            autoDeleteMedia: false,
          }
          return res
        }

        // 更新数据库
        const upDbRes = await this.materialService.updateInfo(
          newMaterial.id,
          updateData,
        )
        if (!upDbRes) {
          res.status = -1
          res.message = '更新内容失败'
          return res
        }

        // 更新任务
        // 剩余次数 -1
        taskInfo.reNum = taskInfo.reNum - 1

        // 素材增加使用次数
        this.addUseCount(taskInfo)

        // 更新任务信息
        const upRes = await this.update(taskInfo.id, taskInfo)
        if (!upRes) {
          res.status = -1
          res.message = '更新内容失败'
          return res
        }

        res.status = 1
        res.message = '执行成功'
        return res
      }
      catch (error: any) {
        res.status = -1
        res.message = error
        return res
      }
    })()

    // 使用Promise.race来实现超时控制
    try {
      const result = await Promise.race([mainTaskPromise, timeoutPromise])
      return result
    }
    catch (error: any) {
      // 超时或发生错误时更新任务状态
      if (!preview) {
        // 如果不是预览模式，尝试更新任务状态为失败
        void this.materialService.updateStatus(
          taskInfo.id,
          MaterialStatus.FAIL,
          '任务执行超时（超过20分钟）',
        )
      }

      res.status = -1
      res.message = error.message || '任务执行超时'
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
