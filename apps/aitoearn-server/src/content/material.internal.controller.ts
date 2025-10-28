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
  Post,
} from '@nestjs/common'
import { Internal } from '@yikart/aitoearn-auth'
import {
  MaterialIdsDto,
} from './dto/material.dto'
import { MaterialService } from './material.service'
import { MaterialGroupService } from './materialGroup.service'

@Controller()
@Internal()
export class MaterialInternalController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
  ) { }

  @Post('materialInternal/list/ids')
  async getList(
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.getListByIds(body.ids)
    return res
  }

  @Post('materialInternal/optimalByIds')
  async optimalByIds(
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.getListByIds(body.ids)
    return res
  }

  @Post('materialInternal/group/info')
  async groupInfo(@Body() body: { id: string }) {
    const res = await this.materialGroupService.getGroupInfo(body.id)
    return res
  }

  @Post('materialInternal/group/info')
  async optimalInGroup(@Body() body: { groupId: string }) {
    const res = await this.materialService.optimalInGroup(body.groupId)
    return res
  }
}
