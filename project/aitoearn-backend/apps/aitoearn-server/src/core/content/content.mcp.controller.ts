import { Controller, Injectable } from '@nestjs/common'
import { getUser, toTextResult, toYamlTextResult, UserType } from '@yikart/common'
import { MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { Tool } from '@yikart/nest-mcp'
import { z } from 'zod'
import { MaterialGroupService } from './material-group.service'
import { MaterialService } from './material.service'
import { MediaGroupService } from './media-group.service'
import { MediaService } from './media.service'

const GetGroupInfoByNameSchema = z.object({
  title: z.string().describe('Group title'),
})

const CreateMediaSchema = z.object({
  groupId: z.string().describe('Media group ID'),
  draftId: z.string().optional().describe('Draft ID'),
  type: z.enum(MediaType).describe('Media type'),
  url: z.string().describe('Media URL'),
  thumbUrl: z.string().optional().describe('Media thumbnail URL'),
  title: z.string().optional().describe('Media title'),
  desc: z.string().optional().describe('Media description'),
})

const MaterialMediaSchema = z.object({
  id: z.string().optional().describe('Media ID'),
  url: z.string(),
  type: z.enum(MediaType).describe('Media type'),
  thumbUrl: z.string().optional().describe('Media thumbnail URL'),
  content: z.string().optional().describe('Media content'),
  mediaId: z.string().optional().describe('Media ID'),
})

const CreateMaterialSchema = z.object({
  groupId: z.string().describe('Group ID'),
  coverUrl: z.string().optional().describe('Cover URL'),
  mediaList: z.array(MaterialMediaSchema).describe('Media list'),
  title: z.string().describe('Draft title'),
  desc: z.string().optional().describe('Draft description'),
  topics: z.array(z.string()).optional().default([]).describe('Draft topics'),
  option: z.any().optional().describe('Draft options'),
  type: z.enum(MaterialType).describe('Draft type'),
})

const ListDraftsSchema = z.object({
  pageNo: z.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.number().int().min(1).max(100).default(20).describe('Page size'),
  groupId: z.string().optional().describe('Draft group ID'),
  title: z.string().optional().describe('Search by title'),
})

const GetDraftDetailSchema = z.object({
  draftId: z.string().describe('Draft ID'),
})

const DeleteDraftSchema = z.object({
  draftId: z.string().describe('Draft ID'),
})

const ListMediaSchema = z.object({
  pageNo: z.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.number().int().min(1).max(100).default(20).describe('Page size'),
  groupId: z.string().optional().describe('Media group ID'),
})

const ListGroupsSchema = z.object({
  pageNo: z.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.number().int().min(1).max(100).default(100).describe('Page size'),
})

@Injectable()
@Controller()
export class ContentMcpController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaGroupService: MediaGroupService,
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
  ) {}

  @Tool({
    name: 'getMediaGroupInfoByName',
    description: 'Get the authenticated user\'s media group by title. Returns matching group details, or default group if not found.',
    parameters: GetGroupInfoByNameSchema,
  })
  async getMediaGroupByName(params: z.infer<typeof GetGroupInfoByNameSchema>) {
    const user = getUser()
    const result = await this.mediaGroupService.getInfoByName(user.id, params.title)
    if (result) {
      return toYamlTextResult(result)
    }

    const defaultGroup = await this.mediaGroupService.getDefaultGroup(user.id)
    if (defaultGroup) {
      return toYamlTextResult({
        ...defaultGroup,
        isDefault: true,
      })
    }

    return toTextResult('Failed to get media group by title', true)
  }

  @Tool({
    name: 'createMedia',
    description: 'Create a new media resource for the authenticated user. Provide group ID, type, media URL, and optional thumbnail, title, and description.',
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
    return toTextResult(`Media created successfully, ID: ${result.id}`)
  }

  @Tool({
    name: 'getDraftGroupInfoByName',
    description: 'Get the authenticated user\'s draft group by title. Returns matching group details, or default group if not found.',
    parameters: GetGroupInfoByNameSchema,
  })
  async getMaterialGroupByName(params: z.infer<typeof GetGroupInfoByNameSchema>) {
    const user = getUser()
    const result = await this.materialGroupService.getInfoByName(user.id, params.title)
    if (result) {
      return toYamlTextResult(result)
    }

    const defaultGroup = await this.materialGroupService.getDefaultGroup(user.id)
    if (defaultGroup) {
      return toYamlTextResult({
        ...defaultGroup,
        isDefault: true,
      })
    }

    return toTextResult('Failed to get Draft group by title', true)
  }

  @Tool({
    name: 'createDraft',
    description: 'Create a new draft for the authenticated user. Provide group ID, title, description, cover URL, media list, type, and options.',
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
    return toTextResult(`Draft created successfully, ID: ${result.id}`)
  }

  @Tool({
    name: 'listDrafts',
    description: 'List the authenticated user\'s drafts with pagination. Supports filtering by group ID and title.',
    parameters: ListDraftsSchema,
  })
  async listDrafts(params: z.infer<typeof ListDraftsSchema>) {
    const user = getUser()
    const { list, total } = await this.materialService.getList(
      { pageNo: params.pageNo, pageSize: params.pageSize },
      { userId: user.id, userType: UserType.User, groupId: params.groupId, title: params.title },
    )
    return toYamlTextResult({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      total,
      list,
    })
  }

  @Tool({
    name: 'getDraftDetail',
    description: 'Get detailed information of a single draft, including title, description, topics, and media list.',
    parameters: GetDraftDetailSchema,
  })
  async getDraftDetail(params: z.infer<typeof GetDraftDetailSchema>) {
    const user = getUser()
    const material = await this.materialService.getInfo(params.draftId)
    if (!material || material.userId !== user.id) {
      return toTextResult('Draft not found.', true)
    }
    return toYamlTextResult(material)
  }

  @Tool({
    name: 'deleteDraft',
    description: 'Delete a single draft for the authenticated user.',
    parameters: DeleteDraftSchema,
  })
  async deleteDraft(params: z.infer<typeof DeleteDraftSchema>) {
    const user = getUser()
    const material = await this.materialService.getInfo(params.draftId)
    if (!material || material.userId !== user.id) {
      return toTextResult('Draft not found.', true)
    }
    await this.materialService.del(params.draftId)
    return toTextResult(`Draft deleted successfully, ID: ${params.draftId}`)
  }

  @Tool({
    name: 'listMedia',
    description: 'List the authenticated user\'s media resources with pagination. Supports filtering by group ID.',
    parameters: ListMediaSchema,
  })
  async listMedia(params: z.infer<typeof ListMediaSchema>) {
    const user = getUser()
    const { list, total } = await this.mediaService.getList(
      { pageNo: params.pageNo, pageSize: params.pageSize },
      { userId: user.id, groupId: params.groupId },
    )
    return toYamlTextResult({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      total,
      list,
    })
  }

  @Tool({
    name: 'listDraftGroups',
    description: 'List all draft groups for the authenticated user.',
    parameters: ListGroupsSchema,
  })
  async listDraftGroups(params: z.infer<typeof ListGroupsSchema>) {
    const user = getUser()
    const { list, total } = await this.materialGroupService.getGroupList(
      { pageNo: params.pageNo, pageSize: params.pageSize },
      { userId: user.id },
    )
    return toYamlTextResult({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      total,
      list,
    })
  }

  @Tool({
    name: 'listMediaGroups',
    description: 'List all media groups for the authenticated user.',
    parameters: ListGroupsSchema,
  })
  async listMediaGroups(params: z.infer<typeof ListGroupsSchema>) {
    const user = getUser()
    const { list, total } = await this.mediaGroupService.getList(
      { pageNo: params.pageNo, pageSize: params.pageSize },
      { userId: user.id },
    )
    return toYamlTextResult({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      total,
      list,
    })
  }
}
