import { Module } from '../core/decorators';
import { TracingController } from './controller';
import { TracingService } from './service';

@Module({
  controllers: [TracingController],
  providers: [TracingService],
})
export class TracingModule {}
