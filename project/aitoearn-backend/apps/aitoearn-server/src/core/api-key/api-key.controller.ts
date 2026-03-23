import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreateApiKeyDto } from './api-key.dto'
import { ApiKeyService } from './api-key.service'
import { ApiKeyCreatedVo, ApiKeyItemVo } from './api-key.vo'

@ApiTags('Auth/API-Key')
@Controller('/api-key')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @ApiDoc({
    summary: '创建 API Key',
    description: '生成新的 API Key，明文仅返回一次',
    body: CreateApiKeyDto.schema,
    response: ApiKeyCreatedVo,
  })
  @Post('/create')
  async create(
    @GetToken() token: TokenInfo,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyCreatedVo> {
    const result = await this.apiKeyService.create(token.id, dto.name)
    return ApiKeyCreatedVo.create(result)
  }

  @ApiDoc({
    summary: '获取 API Key 列表',
    response: [ApiKeyItemVo],
  })
  @Get('/list')
  async list(
    @GetToken() token: TokenInfo,
  ): Promise<ApiKeyItemVo[]> {
    const keys = await this.apiKeyService.listByUserId(token.id)
    return keys.map(k => ApiKeyItemVo.create({
      id: k.id,
      name: k.name,
      lastUsedAt: k.lastUsedAt ?? null,
      createdAt: k.createdAt,
    }))
  }

  @ApiDoc({
    summary: '删除 API Key',
  })
  @Delete('/:id')
  async delete(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ): Promise<void> {
    await this.apiKeyService.deleteByIdAndUserId(id, token.id)
  }
}
