import { Controller, Injectable, Logger } from '@nestjs/common'
import { getUser, UserType } from '@yikart/common'
import { MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { Tool } from '@yikart/nest-mcp'
import { z } from 'zod'
import { MaterialGroupService } from './material-group.service'
import { MaterialService } from './material.service'
import { MediaGroupService } from './media-group.service'
import { MediaService } from './media.service'

const GetGroupInfoByNameSchema = z.object({
  title: z.string().describe('分组标题'),
})

const CreateMediaSchema = z.object({
  groupId: z.string().describe('媒体分组ID'),
  draftId: z.string().optional().describe('草稿ID'),
  type: z.enum(MediaType).describe('媒体类型'),
  url: z.string().describe('媒体URL'),
  thumbUrl: z.string().optional().describe('媒体缩略图URL'),
  title: z.string().optional().describe('媒体标题'),
  desc: z.string().optional().describe('媒体描述'),
})

const MaterialMediaSchema = z.object({
  id: z.string().optional().describe('媒体ID'),
  url: z.string(),
  type: z.enum(MediaType).describe('媒体类型'),
  thumbUrl: z.string().optional().describe('媒体缩略图URL'),
  content: z.string().optional().describe('媒体内容'),
  mediaId: z.string().optional().describe('媒体ID'),
})

const CreateMaterialSchema = z.object({
  groupId: z.string().describe('分组ID'),
  coverUrl: z.string().optional().describe('素材封面URL'),
  mediaList: z.array(MaterialMediaSchema).describe('素材媒体列表'),
  title: z.string().describe('素材标题'),
  desc: z.string().optional().describe('素材描述'),
  topics: z.array(z.string()).optional().default([]).describe('素材话题'),
  option: z.any().optional().describe('素材选项'),
  type: z.enum(MaterialType).describe('素材类型'),
})

@Injectable()
@Controller()
export class ContentMcpController {
  private readonly logger = new Logger(ContentMcpController.name)

  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaGroupService: MediaGroupService,
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
  ) {}

  @Tool({
    name: 'getMediaGroupInfoByName',
    description: '根据标题获取当前用户的媒体分组信息。提供分组标题，返回匹配的媒体分组详情，如果未找到则返回默认分组。',
    parameters: GetGroupInfoByNameSchema,
  })
  async getMediaGroupByName(params: z.infer<typeof GetGroupInfoByNameSchema>) {
    const user = getUser()
    const { title } = params
    const result = await this.mediaGroupService.getInfoByName(user.id, title)
    if (result) {
      const lines = [`ID: ${result.id}`, `Name: ${result.title}`, `Type: ${result.type}`]
      return {
        content: [
          {
            type: 'text',
            text: `Media Group:\n${lines.join('\n')}`,
          },
        ],
      }
    }

    // find default
    const defaultGroup = await this.mediaGroupService.getDefaultGroup(user.id)
    if (defaultGroup) {
      const lines = [`ID: ${defaultGroup.id}`, `Name: ${defaultGroup.title}`, `Type: ${defaultGroup.type}`, `Is Default: Yes`]
      return {
        content: [
          {
            type: 'text',
            text: `Media Group (Default):\n${lines.join('\n')}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Failed to get media group by title',
        },
      ],
      isError: true,
    }
  }

  @Tool({
    name: 'createMedia',
    description: '为当前用户创建新的媒体资源。提供分组ID、类型、媒体URL、可选的缩略图URL、标题和描述。返回创建的媒体详情。',
    parameters: CreateMediaSchema,
  })
  async createMedia(params: z.infer<typeof CreateMediaSchema>) {
    const user = getUser()
    const result = await this.mediaService.create(user.id, {
      groupId: params.groupId,
      materialId: params.draftId,
      type: params.type,
      url: params.url,
      thumbUrl: params.thumbUrl,
      title: params.title,
      desc: params.desc,
    })
    return {
      content: [
        {
          type: 'text',
          text: `Media created successfully, ID: ${result.id}`,
        },
      ],
    }
  }

  @Tool({
    name: 'getDraftGroupInfoByName',
    description: '根据标题获取当前用户的草稿（素材）分组信息。提供分组标题，返回匹配的草稿分组详情，如果未找到则返回默认分组。',
    parameters: GetGroupInfoByNameSchema,
  })
  async getMaterialGroupByName(params: z.infer<typeof GetGroupInfoByNameSchema>) {
    const user = getUser()
    const { title } = params
    const result = await this.materialGroupService.getInfoByName(user.id, title)
    if (result) {
      const lines = [`ID: ${result.id}`, `Name: ${result.name}`]
      return {
        content: [
          {
            type: 'text',
            text: `Draft Group:\n${lines.join('\n')}`,
          },
        ],
      }
    }

    // find default
    const defaultGroup = await this.materialGroupService.getDefaultGroup(user.id)
    if (defaultGroup) {
      const lines = [`ID: ${defaultGroup.id}`, `Name: ${defaultGroup.name}`, `Is Default: Yes`]
      return {
        content: [
          {
            type: 'text',
            text: `Draft Group (Default):\n${lines.join('\n')}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Failed to get Draft group by title',
        },
      ],
      isError: true,
    }
  }

  @Tool({
    name: 'createDraft',
    description: '为当前用户创建新的草稿（素材）。提供分组ID、标题、描述、封面URL、媒体列表、类型和选项。返回创建的草稿详情及成功状态。',
    parameters: CreateMaterialSchema,
  })
  async createMaterial(params: z.infer<typeof CreateMaterialSchema>) {
    const user = getUser()
    const result = await this.materialService.create({
      userId: user.id,
      userType: UserType.User,
      type: params.type,
      groupId: params.groupId,
      coverUrl: params.coverUrl,
      mediaList: params.mediaList,
      title: params.title,
      desc: params.desc,
      topics: params.topics,
      option: params.option,
      autoDeleteMedia: false,
      status: MaterialStatus.SUCCESS,
    })
    return {
      content: [
        {
          type: 'text',
          text: `Draft created successfully, ID: ${result.id}`,
        },
      ],
    }
  }
}
