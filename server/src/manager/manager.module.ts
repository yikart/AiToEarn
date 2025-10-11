import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from '../db/schema/manager.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Manager.name, schema: ManagerSchema }]),
  ],
  controllers: [ManagerController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
