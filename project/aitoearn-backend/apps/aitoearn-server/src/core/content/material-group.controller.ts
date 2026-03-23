import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { CreateMaterialGroupDto, MaterialGroupFilterDto, MaterialGroupFilterSchema, UpdateMaterialGroupDto } from './material-group.dto'

import { MaterialGroupService } from './material-group.service'
import { MaterialGroupVo } from './material-group.vo'

@ApiTags('Me/MaterialGroup')
@Controller('material/group')
export class MaterialGroupController {
  private readonly logger = new Logger(MaterialGroupController.name)

  constructor(
    private readonly materialGroupService: MaterialGroupService,
  ) { }

  @ApiDoc({
    summary: '创建草稿分组',
    description: '使用提供的元数据创建新的草稿分组。',
    body: CreateMaterialGroupDto.schema,
  })
  @Post()
  async createGroup(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialGroupDto,
  ) {
    return this.materialGroupService.createGroup({
      ...body,
      userId: token.id,
    })
  }

  @ApiDoc({
    summary: '删除草稿分组',
    description: '根据ID删除草稿分组。',
  })
  @Delete(':id')
  async delGroup(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const materialGroup = await this.materialGroupService.getGroupInfo(id)
    if (!materialGroup || materialGroup.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }
    if (materialGroup.isDefault) {
      throw new AppException(ResponseCode.MaterialGroupDefaultNotAllowed)
    }
    return this.materialGroupService.delGroup(id)
  }

  @ApiDoc({
    summary: '更新草稿分组信息',
    description: '更新草稿分组的详情。',
    body: UpdateMaterialGroupDto.schema,
  })
  @Post('info/:id')
  async updateGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMaterialGroupDto,
  ) {
    const materialGroup = await this.materialGroupService.getGroupInfo(id)
    if (!materialGroup || materialGroup.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }
    return this.materialGroupService.updateGroupInfo(id, body)
  }

  @ApiDoc({
    summary: '获取草稿分组详情',
    description: '根据ID获取草稿分组详情。',
  })
  @Get('info/:id')
  async getGroupInfo(@Param('id') id: string) {
    return this.materialGroupService.getGroupInfo(id)
  }

  @ApiDoc({
    summary: '获取草稿分组列表',
    description: '分页获取草稿分组列表。',
    query: MaterialGroupFilterSchema,
    response: [MaterialGroupVo],
  })
  @Get('list/:pageNo/:pageSize')
  async getGroupList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MaterialGroupFilterDto,
  ) {
    await this.materialGroupService.ensureDefaultGroup(token.id)

    const { list, total } = await this.materialGroupService.getGroupList(param, {
      userId: token.id,
      ...query,
    })

    return {
      list: list.map(item => MaterialGroupVo.create(item)),
      total,
    }
  }
}
