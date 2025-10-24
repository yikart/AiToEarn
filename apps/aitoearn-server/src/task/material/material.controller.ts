import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { MaterialService } from './material.service'
import { MaterialVo } from './material.vo'

@ApiTags('task/material - 素材')
@Controller('task/material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @ApiOperation({ summary: '获取素材信息' })
  @Get(':id')
  async getMaterial(@Param('id') id: string): Promise<MaterialVo> {
    const result = await this.materialService.getMaterial(id)
    return MaterialVo.create(result)
  }

  @ApiOperation({ summary: '按任务ID获取素材列表' })
  @Get('task/:taskId')
  async getMaterialsByTaskId(
    @Param('taskId') taskId: string,
  ): Promise<MaterialVo[]> {
    const result = await this.materialService.getMaterialsByTaskId(taskId)
    return Array.isArray(result)
      ? result.map(item => MaterialVo.create(item))
      : []
  }
}
