/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 草稿
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
import { TableDto, UserType } from '@yikart/common'
import { GetToken } from '../../common/auth/auth.guard'
import { TokenInfo } from '../../common/auth/interfaces/auth.interfaces'
import { CreateMaterialGroupDto, MaterialGroupFilterDto, UpdateMaterialGroupDto } from './dto/materialGroup.dto'
import { MaterialGroupService } from './materialGroup.service'

@ApiTags('草稿组')
@Controller('material/group')
export class MaterialGroupController {
  constructor(
    private readonly gaterialGroupService: MaterialGroupService,
  ) { }

  @ApiOperation({
    description: '创建素材组',
    summary: '创建素材组',
  })
  @Post()
  async createGroup(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialGroupDto,
  ) {
    const res = await this.gaterialGroupService.createGroup({
      ...body,
      userId: token.id,
      userType: UserType.Admin,
    })
    return res
  }

  @ApiOperation({
    description: '删除素材组',
    summary: '删除素材组',
  })
  @Delete(':id')
  async delGroup(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const res = await this.gaterialGroupService.delGroup(id)
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
    const res = await this.gaterialGroupService.updateGroupInfo(id, body)
    return res
  }

  @ApiOperation({
    description: '获取素材组信息',
    summary: '获取素材组信息',
  })
  @Get('info/:id')
  async getGroupInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const res = await this.gaterialGroupService.getGroupInfo(id)
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
    const res = await this.gaterialGroupService.getGroupList(param, {
      userId: token.id,
      userType: UserType.Admin,
      ...query,
    })
    return res
  }
}
