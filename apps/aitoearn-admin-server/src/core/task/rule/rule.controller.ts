import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import {
  CreateRuleDto,
  QueryRuleDto,
  UpdateRuleDto,
} from './rule.dto'
import { RuleService } from './rule.service'
import { RuleListVo, RuleVo } from './rule.vo'

@ApiTags('task/rule - 任务匹配规则')
@Controller('task/rule')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @ApiOperation({ summary: '创建任务匹配规则' })
  @Post()
  async create(@Body() createDto: CreateRuleDto): Promise<RuleVo> {
    const matcher = await this.ruleService.create(createDto)
    return matcher
  }

  @ApiOperation({ summary: '获取单个任务匹配规则' })
  @Get('info/:id')
  async get(@Param('id') id: string): Promise<RuleVo> {
    const matcher = await this.ruleService.getById(id)
    return matcher
  }

  @ApiOperation({ summary: '更新任务匹配规则' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRuleDto,
  ): Promise<RuleVo> {
    const matcher = await this.ruleService.update(
      id,
      updateDto,
    )
    return matcher
  }

  @ApiOperation({ summary: '删除任务匹配规则' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.ruleService.delete(id)
  }

  @ApiOperation({ summary: '获取任务匹配规则列表' })
  @Get('list/:pageNo/:pageSize')
  async list(@Param() page: TableDto, @Query() query: QueryRuleDto): Promise<RuleListVo> {
    const result = await this.ruleService.getList(page, query)
    return result
  }
}
