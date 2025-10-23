import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiDoc, TableDto } from '@yikart/common'
import { CreateTaskDto, GetOpportunityListQueryDto, PublishTaskToAccountListDto, publishTaskToAccountListSchema, PublishTaskToUserListDto, publishTaskToUserListSchema, TaskListQueryDto, UpdateAutoDeleteMaterialDto, UpdateTaskDto, UpdateTaskStatusDto } from './task.dto'
import { TaskService } from './task.service'
import { TaskListVo, TaskVo } from './task.vo'

@ApiTags('任务管理')
@Controller('task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
  ) {}

  @ApiOperation({ summary: '创建任务' })
  @Post()
  async create(@Body() body: CreateTaskDto): Promise<TaskVo> {
    const result = await this.taskService.create(body)
    return result
  }

  @ApiOperation({ summary: '删除任务素材' })
  @Delete('material/:id/:materialId')
  async deleteTaskMaterial(@Param('id') id: string, @Param('materialId') materialId: string) {
    const result = await this.taskService.deleteTaskMaterial(id, materialId)
    return result
  }

  @ApiOperation({ summary: '增加任务素材' })
  @Post('material/:id')
  async addTaskMaterial(@Param('id') id: string, @Body('materialIds') materialIds: string[]) {
    const result = await this.taskService.addTaskMaterial(id, materialIds)
    return result
  }

  @ApiOperation({ summary: '更新任务' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTaskDto): Promise<TaskVo> {
    const result = await this.taskService.update(id, updateDto)
    return result
  }

  @ApiOperation({ summary: '获取任务列表' })
  @Get('list/:pageNo/:pageSize')
  async getList(@Param() params: TableDto, @Query() query: TaskListQueryDto): Promise<TaskListVo> {
    const result = await this.taskService.getList(params, query)
    return result
  }

  @ApiOperation({ summary: '删除任务' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.taskService.delete(id)
  }

  @ApiOperation({ summary: '获取任务详情' })
  @Get(':id')
  async getById(@Param('id') id: string): Promise<TaskVo> {
    const result = await this.taskService.getById(id)
    return result
  }

  @ApiOperation({ summary: '更新任务状态' })
  @Put('status/:id')
  async updateStatus(@Param('id') id: string, @Body() statusDto: UpdateTaskStatusDto) {
    await this.taskService.updateStatus(id, statusDto)
  }

  @ApiOperation({ summary: '更新任务是否自动删除' })
  @Put('autoDeleteMaterial/:id')
  async updateAutoDeleteMaterial(@Param('id') id: string, @Body() body: UpdateAutoDeleteMaterialDto) {
    await this.taskService.updateAutoDeleteMaterial(id, body.data)
  }

  @ApiDoc({
    summary: '发布任务到账号列表',
    description: '发布任务到账号列表',
    body: publishTaskToAccountListSchema,
  })
  @Post('publish/accountList')
  async publishTaskToAccountList(@Body() body: PublishTaskToAccountListDto) {
    await this.taskService.publishTaskToAccountList(body.taskId, body.accountIds)
  }

  @ApiDoc({
    summary: '发布任务到用户列表',
    description: '发布任务到用户列表',
    body: publishTaskToUserListSchema,
  })
  @Post('publish/userList')
  async publishTaskToUserList(@Body() body: PublishTaskToUserListDto) {
    await this.taskService.publishTaskToUserList(body.taskId, body.userIds)
  }

  @ApiOperation({ summary: '根据任务ID获取素材列表' })
  @Get('/:taskId/matreials')
  async getByTaskId(@Param('taskId') taskId: string) {
    const materials = await this.taskService.listMaterialsByTaskId(taskId)
    return materials
  }

  @ApiOperation({ summary: '获取任务的派发列表' })
  @Get('opportunity/list/:pageNo/:pageSize')
  async getOpportunityList(@Param() params: TableDto, @Query() query: GetOpportunityListQueryDto) {
    const result = await this.taskService.getOpportunityList(params, query)
    return result
  }

  @ApiOperation({ summary: '取消派发' })
  @Delete('opportunity/:id')
  async delOpportunity(@Param('id') id: string) {
    const result = await this.taskService.delOpportunity(id)
    return result
  }
}
