import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { MaterialType, MediaType } from '@yikart/mongodb'
import { NewMaterial, NewMaterialGroup } from '../content/common'
import { MaterialGroupService } from '../content/material-group.service'
import { MaterialIdsDto, MaterialListDto } from '../content/material.dto'
import { MaterialService } from '../content/material.service'
import { MediaGroupService } from '../content/media-group.service'

export const MediaMaterialTypeMap = new Map<MediaType, MaterialType>([
  [MediaType.VIDEO, MaterialType.VIDEO],
  [MediaType.IMG, MaterialType.ARTICLE],
])

@ApiTags('Internal/Material')
@Controller('internal')
@Internal()
export class MaterialInternalController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
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
  async optimalInGroup(@Body() body: { groupId: string, type?: MaterialType }) {
    const res = await this.materialService.optimalInGroup(body.groupId, body.type)
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
    summary: 'Increase Material Usage Count',
  })
  @Post('material/use/increase')
  async increaseMaterialUse(@Body() body: { id: string }) {
    await this.materialService.addUseCount(body.id)
    return true
  }
}
