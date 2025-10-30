/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2024-09-05 15:18:26
 * @LastEditors: nevin
 * @Description: 跟踪模块 tracing Tracing
 */
import { Global, Module } from '@nestjs/common';
import { TracingController } from './tracing.controller';
import { TracingService } from './tracing.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Tracing, TracingSchema } from 'src/db/schema/tracing.schema';
import { TracingAdminController } from './tracingAdmin.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tracing.name, schema: TracingSchema }]),
  ],
  controllers: [TracingController, TracingAdminController],
  providers: [TracingService],
})
export class TracingModule {}
