import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { AppException } from '@yikart/common'
import { MaterialType, MediaType } from '@yikart/mongodb'
import { NewMaterial, NewMaterialGroup } from '../content/common'
import { CreateMaterialTaskDto, MaterialIdsDto, MaterialListDto } from '../content/dto/material.dto'
import { MaterialService } from '../content/material.service'
import { MaterialGroupService } from '../content/materialGroup.service'
import { MaterialTaskService } from '../content/materialTask.service'
import { MediaGroupService } from '../content/mediaGroup.service'

export const MediaMaterialTypeMap = new Map<MediaType, MaterialType>([
  [MediaType.VIDEO, MaterialType.VIDEO],
  [MediaType.IMG, MaterialType.ARTICLE],
])

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class MaterialInternalController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
    private readonly materialTaskService: MaterialTaskService,
    private readonly mediaGroupService: MediaGroupService,
  ) { }

  @ApiOperation({ summary: '根据ID列表获取素材列表' })
  @Post('material/list/ids')
  async getList(
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.getListByIds(body.ids)
    return res
  }

  @ApiOperation({ summary: '根据ID列表获取最优素材' })
  @Post('material/optimalByIds')
  async optimalByIds(
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.getListByIds(body.ids)
    return res
  }

  @ApiOperation({ summary: '获取素材组信息' })
  @Post('material/group/info')
  async groupInfo(@Body() body: { id: string }) {
    const res = await this.materialGroupService.getGroupInfo(body.id)
    return res
  }

  @ApiOperation({ summary: '组内获取最优素材' })
  @Post('material/group/optimal')
  async optimalInGroup(@Body() body: { groupId: string }) {
    const res = await this.materialService.optimalInGroup(body.groupId)
    return res
  }

  @ApiOperation({ summary: '根据UserId获取草稿箱组列表' })
  @Post('material/group/list/userId')
  async getGroupListByUserId(@Body() body: MaterialListDto & { userId: string }) {
    const res = await this.materialGroupService.getGroupList(body.page, {
      userId: body.userId,
      title: body?.filter?.title,
    })
    return res
  }

  @ApiOperation({ summary: '创建草稿箱组' })
  @Post('material/group/create')
  async createMaterialGroup(@Body() body: NewMaterialGroup) {
    const res = await this.materialGroupService.createGroup(body)
    return res
  }

  @ApiOperation({ summary: '创建草稿' })
  @Post('content/material/create')
  async createMaterial(@Body() body: NewMaterial) {
    const getInfo = await this.materialGroupService.getGroupInfo(body.groupId)
    if (!getInfo) {
      throw new AppException(1000, '素材组不存在')
    }
    const res = await this.materialService.create(body)
    return res
  }

  @ApiOperation({ summary: '创建批量生成草稿任务' })
  @Post('content/material/createTask')
  async createTask(@Body() body: CreateMaterialTaskDto) {
    const mediaGroupInfo = await this.mediaGroupService.getInfo(body.mediaGroups[0])
    if (!mediaGroupInfo) {
      throw new Error('素材组不存在')
    }

    const type = mediaGroupInfo?.type as MediaType
    const res = await this.materialTaskService.createTask({
      ...body,
      type: MediaMaterialTypeMap.get(type)!,
    })
    return res
  }

  @ApiOperation({ summary: '预览草稿生成任务' })
  @Get('content/material/preview/:id')
  async previewTask(@Param('id') id: string) {
    const res = await this.materialTaskService.previewTask(id)
    return res
  }

  @ApiOperation({ summary: '开始草稿生成任务' })
  @Get('content/material/start/:id')
  async startTask(@Param('id') id: string) {
    const res = await this.materialTaskService.startTask(id)
    return res
  }

  @ApiOperation({ summary: '增加素材使用计数' })
  @Post('material/use/increase')
  async increaseMaterialUse(@Body() body: { id: string }) {
    await this.materialService.addUseCount(body.id)
    return true
  }
}
