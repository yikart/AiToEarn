import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
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

@ApiTags('OpenSource/Internal/Material')
@Controller('internal')
@Internal()
export class MaterialInternalController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
    private readonly materialTaskService: MaterialTaskService,
    private readonly mediaGroupService: MediaGroupService,
  ) { }

  @ApiDoc({
    summary: 'Get Materials by IDs',
    body: MaterialIdsDto.schema,
  })
  @Post('material/list/ids')
  async getList(
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.getListByIds(body.ids)
    return res
  }

  @ApiDoc({
    summary: 'Get Optimal Materials by IDs',
    body: MaterialIdsDto.schema,
  })
  @Post('material/optimalByIds')
  async optimalByIds(
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.getListByIds(body.ids)
    return res
  }

  @ApiDoc({
    summary: 'Get Material Group Info',
  })
  @Post('material/group/info')
  async groupInfo(@Body() body: { id: string }) {
    const res = await this.materialGroupService.getGroupInfo(body.id)
    return res
  }

  @ApiDoc({
    summary: 'Get Optimal Material in Group',
  })
  @Post('material/group/optimal')
  async optimalInGroup(@Body() body: { groupId: string }) {
    const res = await this.materialService.optimalInGroup(body.groupId)
    return res
  }

  @ApiDoc({
    summary: 'List Material Groups by User',
    body: MaterialListDto.schema,
  })
  @Post('material/group/list/userId')
  async getGroupListByUserId(@Body() body: MaterialListDto & { userId: string }) {
    const res = await this.materialGroupService.getGroupList(body.page, {
      userId: body.userId,
      title: body?.filter?.title,
    })
    return res
  }

  @ApiDoc({
    summary: 'Create Material Group',
  })
  @Post('material/group/create')
  async createMaterialGroup(@Body() body: NewMaterialGroup) {
    const res = await this.materialGroupService.createGroup(body)
    return res
  }

  @ApiDoc({
    summary: 'Create Material',
  })
  @Post('content/material/create')
  async createMaterial(@Body() body: NewMaterial) {
    const getInfo = await this.materialGroupService.getGroupInfo(body.groupId)
    if (!getInfo) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }
    const res = await this.materialService.create(body)
    return res
  }

  @ApiDoc({
    summary: 'Create Material Generation Task',
    body: CreateMaterialTaskDto.schema,
  })
  @Post('content/material/createTask')
  async createTask(@Body() body: CreateMaterialTaskDto) {
    const mediaGroupInfo = await this.mediaGroupService.getInfo(body.mediaGroups[0])
    if (!mediaGroupInfo) {
      throw new AppException(ResponseCode.MediaGroupNotFound)
    }

    const type = mediaGroupInfo?.type as MediaType
    const res = await this.materialTaskService.createTask({
      ...body,
      type: MediaMaterialTypeMap.get(type)!,
    })
    return res
  }

  @ApiDoc({
    summary: 'Preview Material Generation Task',
  })
  @Get('content/material/preview/:id')
  async previewTask(@Param('id') id: string) {
    const res = await this.materialTaskService.previewTask(id)
    return res
  }

  @ApiDoc({
    summary: 'Start Material Generation Task',
  })
  @Get('content/material/start/:id')
  async startTask(@Param('id') id: string) {
    const res = await this.materialTaskService.startTask(id)
    return res
  }

  @ApiDoc({
    summary: 'Increase Material Usage Count',
  })
  @Post('material/use/increase')
  async increaseMaterialUse(@Body() body: { id: string }) {
    await this.materialService.addUseCount(body.id)
    return true
  }
}
