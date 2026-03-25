/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: Material Controller
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, AppException, FileUtil, ResponseCode, TableDto, UserType } from '@yikart/common'
import { MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { MaterialGroupService } from './material-group.service'
import {
  CreateMaterialDto,
  DeleteByUseCountDto,
  GetOptimalMaterialDto,
  MaterialFilterDto,
  MaterialFilterSchema,
  MaterialIdsDto,
  UpdateMaterialDto,
} from './material.dto'
import { MaterialService } from './material.service'

export const MediaMaterialTypeMap = new Map<MediaType, MaterialType>([
  [MediaType.VIDEO, MaterialType.VIDEO],
  [MediaType.IMG, MaterialType.ARTICLE],
])

const VIDEO_ONLY_PLATFORMS = new Set<AccountType>([
  AccountType.YOUTUBE,
  AccountType.BILIBILI,
  AccountType.KWAI,
  AccountType.TIKTOK,
  AccountType.Douyin,
  AccountType.WxSph,
])

function getMaterialTypeByAccountType(accountType: AccountType): MaterialType | undefined {
  if (VIDEO_ONLY_PLATFORMS.has(accountType)) {
    return MaterialType.VIDEO
  }
  return undefined
}

@ApiTags('Me/Material')
@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly materialGroupService: MaterialGroupService,
  ) { }

  @ApiDoc({
    summary: '创建草稿',
    description: '使用提供的媒体和元数据创建草稿。',
    body: CreateMaterialDto.schema,
  })
  @Post()
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateMaterialDto,
  ) {
    const getInfo = await this.materialGroupService.getGroupInfo(body.groupId)
    if (!getInfo) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }

    const res = await this.materialService.create({
      ...body,
      userId: token.id,
      userType: UserType.User,
      status: MaterialStatus.SUCCESS,
    })
    return res
  }

  @ApiDoc({
    summary: '按条件删除草稿',
    description: '删除符合筛选条件的草稿。',
    body: MaterialFilterDto.schema,
  })
  @Delete('filter')
  async delByFilter(
    @GetToken() token: TokenInfo,
    @Body() body: MaterialFilterDto,
  ) {
    const res = await this.materialService.delByFilter(token.id, body)
    return res
  }

  @ApiDoc({
    summary: '批量删除草稿',
    description: '根据ID列表批量删除草稿。',
    body: MaterialIdsDto.schema,
  })
  @Delete('list')
  async delByIds(
    @GetToken() token: TokenInfo,
    @Body() body: MaterialIdsDto,
  ) {
    const res = await this.materialService.delByIds(token.id, body.ids)
    return res
  }

  @ApiDoc({
    summary: '根据使用次数删除草稿',
    description: '删除指定草稿箱内使用次数大于等于指定值的草稿。',
    body: DeleteByUseCountDto.schema,
  })
  @Delete('use-count')
  async deleteByUseCount(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteByUseCountDto,
  ) {
    await this.materialService.deleteByUseCount(token.id, body.groupId, body.minUseCount)
  }

  @ApiDoc({
    summary: '删除草稿',
    description: '根据ID删除草稿。',
  })
  @Delete(':id')
  async del(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const material = await this.materialService.getInfo(id)
    if (!material || material.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialNotFound, 'Material not found')
    }
    const res = await this.materialService.del(id)
    return res
  }

  @ApiDoc({
    summary: '更新草稿信息',
    description: '根据ID更新草稿详情。',
    body: UpdateMaterialDto.schema,
  })
  @Put('info/:id')
  async upMaterialInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: UpdateMaterialDto,
  ) {
    const material = await this.materialService.getInfo(id)
    if (!material || material.userId !== token.id) {
      throw new AppException(ResponseCode.MaterialNotFound, 'Material not found')
    }
    const res = await this.materialService.updateInfo(id, body)
    return res
  }

  @ApiDoc({
    summary: '获取草稿详情',
    description: '根据ID获取草稿详情。',
  })
  @Get('info/:id')
  async getInfo(@Param('id') id: string) {
    const res = await this.materialService.getInfo(id)
    return res
  }

  @ApiDoc({
    summary: '获取草稿箱最优草稿',
    description: '根据草稿箱ID和平台类型获取最优草稿，视频类平台自动筛选视频草稿',
    query: GetOptimalMaterialDto.schema,
  })
  @Public()
  @Get('optimal')
  async optimalInGroup(@Query() query: GetOptimalMaterialDto) {
    const type = getMaterialTypeByAccountType(query.accountType)
    const res = await this.materialService.optimalInGroup(query.groupId, type, query.accountType)
    return res
  }

  @ApiDoc({
    summary: '获取草稿列表',
    description: '分页获取草稿列表，支持筛选条件。',
    query: MaterialFilterSchema,
  })
  @Get('list/:pageNo/:pageSize')
  async getList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: MaterialFilterDto,
  ) {
    const res = await this.materialService.getList(
      param,
      {
        ...query,
        ...(!query.groupId && { userId: token.id, userType: UserType.User }),
      },
    )

    for (const item of res.list) {
      if (item.coverUrl)
        item.coverUrl = FileUtil.buildUrl(item.coverUrl)
      for (const media of item.mediaList) {
        media.url = FileUtil.buildUrl(media.url)
        if (media.thumbUrl)
          media.thumbUrl = FileUtil.buildUrl(media.thumbUrl)
      }
    }
    return res
  }
}
