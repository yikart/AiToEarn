/*
 * @Author: nevin
 * @Date: 2025-02-20 16:23:34
 * @LastEditTime: 2025-04-27 16:10:15
 * @LastEditors: nevin
 * @Description: 管理端任务管理
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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Manager } from '../../auth/manager.guard';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import { Task, TaskStatus } from '../../db/schema/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { QueryVerificationDto } from './dto/query-verification.dto';
import {
  ActionTaskFileDto,
  UpdateTaskDto,
  UpTaskStatusDto,
} from './dto/task.dto';
import { UserTaskService } from './user-task.service';
import { AdminTaskService } from './adminTask.service';
import { PagerDto } from 'src/common/dto/pager.dto';
import { ActionTaskMaterialDto } from './dto/adminTask.dto';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';

@ApiTags('admin/tasks - 任务管理')
@Controller('admin/tasks')
@Manager()
export class AdminTaskController {
  constructor(
    private readonly userTaskService: UserTaskService,
    private readonly adminTaskService: AdminTaskService,
  ) {}

  @ApiOperation({ summary: '创建任务' })
  @ApiResult({ type: Task })
  @Post('create')
  async createTask(@Body() body: CreateTaskDto) {
    return this.adminTaskService.create(body);
  }

  @ApiOperation({ summary: '更新任务' })
  @ApiResult({ type: Task })
  @Put('update/:id')
  async updateTask(@Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.adminTaskService.update(id, body);
  }

  @ApiOperation({ summary: '添加任务附件' })
  @Post('file/:id')
  async addTaskFile(@Param('id') id: string, @Body() body: ActionTaskFileDto) {
    return this.adminTaskService.addTaskFile(id, body);
  }

  @ApiOperation({ summary: '删除任务附件' })
  @Delete('file/:id')
  async delTaskFile(@Param('id') id: string, @Body() body: ActionTaskFileDto) {
    return this.adminTaskService.deleteTaskFile(id, body);
  }

  @ApiOperation({ summary: '删除任务' })
  @Delete('delete/:id')
  @ApiResult({ type: Boolean })
  async deleteTask(@Param('id') id: string) {
    return this.adminTaskService.delTask(id);
  }

  // 更新任务状态
  @Put('status/:id/:status')
  @ApiResult({ type: Boolean })
  async upTaskStatus(@Param() param: UpTaskStatusDto) {
    const tastInfo = await this.adminTaskService.findOne(param.id);
    return this.adminTaskService.updateStatus(tastInfo, param.status);
  }

  @ApiOperation({ summary: '获取任务列表' })
  @ApiResult({ type: [Task], isPage: true })
  @Get('list')
  async getTasks(@Query() query: QueryTaskDto) {
    return this.adminTaskService.findAll(query);
  }

  @ApiOperation({ summary: '获取任务详情' })
  @ApiResult({ type: Task })
  @Get('info/:id')
  async getTask(@Param('id') id: string) {
    return this.adminTaskService.findOne(id);
  }

  @ApiOperation({ summary: '获取待验证任务列表' })
  @ApiResult({ type: [Task], isPage: true })
  @Get('verification/pending')
  async getTasksForVerification(@Query() query: QueryVerificationDto) {
    return this.userTaskService.getTasksForVerification(query);
  }

  // 获取任务素材列表
  @Get('material/list/:taskId')
  async getMaterialList(
    @Param('taskId') taskId: string,
    @Query() query: PagerDto,
  ) {
    return this.adminTaskService.findTaskMaterialList(taskId, query);
  }

  // 添加任务素材列表
  @Post('material')
  async addTaskMaterial(@Body() body: ActionTaskMaterialDto) {
    return this.adminTaskService.createTaskMaterial(body);
  }

  // 更新任务素材
  @Put('material/:id')
  async upTaskMaterial(
    @Param('id') id: string,
    @Body() body: ActionTaskMaterialDto,
  ) {
    const info = await this.adminTaskService.getTaskMaterialById(id);
    if (!info) throw new AppHttpException(ErrHttpBack.fail);

    return this.adminTaskService.upTaskMaterial(id, body);
  }

  // 删除任务素材
  @Delete('material/:id')
  async deleteTaskMaterial(@Param('id') id: string) {
    return this.adminTaskService.deleteTaskMaterial(id);
  }
}
