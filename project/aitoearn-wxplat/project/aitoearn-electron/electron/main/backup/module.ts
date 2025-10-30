import { Module } from '../core/decorators';
import { BackupController } from './controller';
import { BackupService } from './service';

@Module({
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
