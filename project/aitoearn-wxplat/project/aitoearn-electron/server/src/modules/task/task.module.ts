/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-03-02 20:46:08
 * @LastEditors: nevin
 * @Description: 任务模块
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../../db/schema/task.schema';
import { UserTask, UserTaskSchema } from '../../db/schema/user-task.schema';
import { TaskController } from './task.controller';
import { AdminTaskController } from './adminTask.controller';
import { TaskService } from './task.service';
import { UserTaskService } from './user-task.service';
import { FinanceModule } from '../finance/finance.module';
import { AdminTaskService } from './adminTask.service';
import { AdminUserTaskService } from './adminUserTask.service';
import { AdminUserTaskController } from './adminUserTask.controller';
import {
  TaskMaterial,
  TaskMaterialSchema,
} from 'src/db/schema/taskMaterial.schema';
import { BullModule } from '@nestjs/bullmq';
import { BullTaskAuditProcessor } from './bullTaskAudit.processor';
import { TaskUtilService } from './util.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: UserTask.name, schema: UserTaskSchema },
      { name: TaskMaterial.name, schema: TaskMaterialSchema },
    ]),
    FinanceModule,
    BullModule.registerQueue({
      name: 'bull_aotu_task_audit', // 队列名称-任务自动审核
    }),
  ],
  controllers: [TaskController, AdminTaskController, AdminUserTaskController],
  providers: [
    TaskService,
    UserTaskService,
    AdminTaskService,
    AdminUserTaskService,
    BullTaskAuditProcessor,
    TaskUtilService
  ],
  exports: [TaskService, UserTaskService],
})
export class TaskModule {}
