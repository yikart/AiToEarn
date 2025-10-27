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
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { CreateMaterialGroupDto, MaterialGroupFilterDto, UpdateMaterialGroupDto } from './dto/materialGroup.dto'
import { MaterialGroupService } from './materialGroup.service'

@ApiTags('草稿')
@Controller('material/group')
export class MaterialGroupController {
  constructor(
    private readonly materialGroupService: MaterialGroupService,
  ) { }

  @ApiOperation({
    description: '创建草稿组',
    summary: '创建草稿组',
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

  @ApiOperation({
    description: '删除素材组',
    summary: '删除素材组',
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

  @ApiOperation({
    description: '更新素材组信息',
    summary: '更新素材组信息',
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

  @ApiOperation({
    description: '获取素材组列表',
    summary: '获取素材组列表',
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
