import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, ZodValidationPipe } from '@yikart/common'
import { Request } from 'express'
import { z } from 'zod'
import { config } from '../../config'
import { filterHeaders } from '../agent/agent.utils'
import { AdaptMaterialDto, AdaptMaterialDtoSchema, UpdateMaterialAdaptationDto, UpdateMaterialAdaptationDtoSchema } from './material-adaptation.dto'
import { MaterialAdaptationService } from './material-adaptation.service'
import { MaterialAdaptationVo } from './material-adaptation.vo'

const PlatformParamSchema = z.enum(AccountType)

@ApiTags('AI/Material-Adaptation')
@Controller('/ai/material-adaptation')
export class MaterialAdaptationController {
  constructor(
    private readonly materialAdaptationService: MaterialAdaptationService,
  ) { }

  @Public()
  @ApiDoc({
    summary: '适配素材到多个平台',
    description: '使用 AI 将素材内容适配到指定的社交媒体平台',
    body: AdaptMaterialDtoSchema,
    response: [MaterialAdaptationVo],
  })
  @Post('/')
  async adaptMaterial(
    @Body() body: AdaptMaterialDto,
    @Req() req: Request,
  ): Promise<MaterialAdaptationVo[]> {
    const headers = {
      ...filterHeaders(req.headers),
      authorization: `Bearer ${config.serverClient.token}`,
    }
    return this.materialAdaptationService.adaptMaterial(body, headers)
  }

  @ApiDoc({
    summary: '更新平台适配内容',
    description: '更新特定平台的标题、描述和话题',
    body: UpdateMaterialAdaptationDtoSchema,
    response: MaterialAdaptationVo,
  })
  @Patch('/:materialId/:platform')
  async updateByMaterialIdAndPlatform(
    @GetToken() token: TokenInfo,
    @Param('materialId') materialId: string,
    @Param('platform', new ZodValidationPipe(PlatformParamSchema)) platform: AccountType,
    @Body() body: UpdateMaterialAdaptationDto,
  ): Promise<MaterialAdaptationVo> {
    return this.materialAdaptationService.updateByMaterialIdAndPlatform(token.id, materialId, platform, body)
  }

  @ApiDoc({
    summary: '删除平台适配',
    description: '删除特定素材在特定平台的适配内容',
  })
  @Delete('/:materialId/:platform')
  async deleteByMaterialIdAndPlatform(
    @GetToken() token: TokenInfo,
    @Param('materialId') materialId: string,
    @Param('platform', new ZodValidationPipe(PlatformParamSchema)) platform: AccountType,
  ): Promise<void> {
    return this.materialAdaptationService.deleteByMaterialIdAndPlatform(token.id, materialId, platform)
  }

  @ApiDoc({
    summary: '删除所有平台适配',
    description: '删除特定素材的所有平台适配内容',
  })
  @Delete('/:materialId')
  async deleteManyByMaterialId(
    @GetToken() token: TokenInfo,
    @Param('materialId') materialId: string,
  ): Promise<void> {
    return this.materialAdaptationService.deleteManyByMaterialId(token.id, materialId)
  }

  @Public()
  @ApiDoc({
    summary: '获取平台适配',
    description: '获取特定平台的适配内容，如果不存在则自动生成',
    response: MaterialAdaptationVo,
  })
  @Get('/:materialId/:platform')
  async getByMaterialIdAndPlatform(
    @Param('materialId') materialId: string,
    @Param('platform', new ZodValidationPipe(PlatformParamSchema)) platform: AccountType,
    @Req() req: Request,
  ): Promise<MaterialAdaptationVo> {
    return this.materialAdaptationService.getByMaterialIdAndPlatform(materialId, platform, {
      ...filterHeaders(req.headers),
      authorization: `Bearer ${config.serverClient.token}`,
    })
  }

  @Public()
  @ApiDoc({
    summary: '列出所有平台适配',
    description: '列出特定素材的所有平台适配内容',
    response: [MaterialAdaptationVo],
  })
  @Get('/:materialId')
  async listByMaterialId(@Param('materialId') materialId: string): Promise<MaterialAdaptationVo[]> {
    return this.materialAdaptationService.listByMaterialId(materialId)
  }
}
