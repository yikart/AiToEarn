import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AssetListVo } from '@yikart/assets'
import { ApiDoc, createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { AssetRepository, AssetStatus, AssetType } from '@yikart/mongodb'

const assetListQuerySchema = PaginationDtoSchema
class AssetListQueryDto extends createZodDto(assetListQuerySchema) {}

@ApiTags('Me/Ai/Assets')
@Controller('ai/assets')
export class AssetsController {
  constructor(private readonly assetRepo: AssetRepository) {}

  @ApiDoc({
    summary: 'Get User AI Generated Assets',
    query: AssetListQueryDto.schema,
    response: AssetListVo,
  })
  @Get('/')
  async listAssetsWithPagination(
    @GetToken() token: TokenInfo,
    @Query() query: AssetListQueryDto,
  ): Promise<AssetListVo> {
    const { list, total } = await this.assetRepo.listWithPagination({
      userId: token.id,
      userType: UserType.User,
      types: [
        AssetType.AiImage,
        AssetType.AiVideo,
        AssetType.AiCard,
        AssetType.AiChatImage,
        AssetType.AideoOutput,
        AssetType.VideoEdit,
        AssetType.DramaRecap,
        AssetType.StyleTransfer,
        AssetType.ImageEdit,
      ],
      statuses: [AssetStatus.Confirmed, AssetStatus.Uploaded],
      ...query,
    })
    return new AssetListVo(list.map(item => ({ ...item, url: item.path })), total, query)
  }
}
