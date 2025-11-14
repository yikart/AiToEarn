/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 草稿组
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode, TableDto } from '@yikart/common'
import { CreateMaterialGroupDto, MaterialGroupFilterDto, MaterialGroupFilterSchema, UpdateMaterialGroupDto } from './dto/materialGroup.dto'
import { MaterialGroupService } from './materialGroup.service'

@ApiTags('OpenSource/Me/MaterialGroup')
@Controller('material/group')
export class MaterialGroupController {
  constructor(
    private readonly materialGroupService: MaterialGroupService,
  ) { }

  @ApiDoc({
    summary: 'Create Material Group',
    description: 'Create a new material group with the provided metadata.',
    body: CreateMaterialGroupDto.schema,
  })
  @Post()
  async createGroup(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialGroupDto,
  ) {
    const res = await this.materialGroupService.createGroup({
      ...body,
      userId: token.id,
    })
    return res
  }

  @ApiDoc({
    summary: 'Delete Material Group',
    description: 'Delete a material group by ID.',
  })
  @Delete(':id')
  async delGroup(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const materialGroup = await this.materialGroupService.getGroupInfo(id)
    if (!materialGroup || materialGroup.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialGroupNotFound, 'Material Group not found')
    }
    const res = await this.materialGroupService.delGroup(id)
    return res
  }

  @ApiDoc({
    summary: 'Update Material Group Information',
    description: 'Update the details of a material group.',
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
      throw new AppException(ResponseCode.MaterialGroupNotFound, 'Material Group not found')
    }
    const res = await this.materialGroupService.updateGroupInfo(id, body)
    return res
  }

  @ApiDoc({
    summary: 'List Material Groups',
    description: 'Retrieve a paginated list of material groups.',
    query: MaterialGroupFilterSchema,
  })
  @Get('list/:pageNo/:pageSize')
  async getGroupList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MaterialGroupFilterDto,
  ) {
    const { list, total } = await this.materialGroupService.getGroupList(param, {
      userId: token.id,
      ...query,
    })

    return { list, total }
  }
}
